import { prisma } from '@/lib/db';
import { TransactionType } from '@prisma/client';

export class WalletService {
    /**
     * Gets the main balance of the user (Total Income - Total Expense - Sum of Wallet Balances).
     * This represents the "Available" funds.
     */
    static async getMainBalance(userId: string) {
        const [aggregations, walletsAggregate] = await Promise.all([
            prisma.transaction.groupBy({
                by: ['type'],
                where: { userId },
                _sum: {
                    amount: true,
                },
            }),
            prisma.wallet.aggregate({
                where: { userId },
                _sum: {
                    balance: true,
                },
            })
        ]);

        const income = Number(aggregations.find(a => a.type === TransactionType.INCOME)?._sum.amount || 0);
        const expense = Number(aggregations.find(a => a.type === TransactionType.EXPENSE)?._sum.amount || 0);
        const totalWalletBalance = Number(walletsAggregate._sum.balance || 0);

        return income - expense - totalWalletBalance;
    }

    /**
     * Gets the available balance (Same as Main Balance in this new logic).
     */
    static async getAvailableBalance(userId: string) {
        return this.getMainBalance(userId);
    }

    /**
     * Allocates income to wallets based on defined rules.
     * Updates wallet.balance and wallet.budgetAmount.
     */
    static async allocateIncome(userId: string, amount: number) {
        if (!amount || amount <= 0) return;

        const rules = await prisma.walletRule.findMany({
            where: { userId },
        });

        if (rules.length === 0) return;

        for (const rule of rules) {
            let allocation = 0;
            
            if (rule.percentage !== null && rule.percentage !== undefined) {
                allocation = amount * (Number(rule.percentage) / 100);
            } else if (rule.fixedAmount !== null && rule.fixedAmount !== undefined) {
                allocation = Number(rule.fixedAmount);
            }

            if (allocation > 0) {
                await prisma.wallet.update({
                    where: { id: rule.walletId },
                    data: {
                        balance: { increment: allocation },
                        budgetAmount: { increment: allocation }
                    }
                });

                // Log the top-up from auto-allocation
                await prisma.walletTransaction.create({
                    data: {
                        userId,
                        toWalletId: rule.walletId,
                        amount: allocation,
                        type: 'TOPUP',
                        description: 'Auto-allocation from income'
                    }
                });
            }
        }
    }

    /**
     * Checks if an expense can be made from a wallet.
     */
    static async validateExpense(userId: string, walletId: string, amount: number) {
        const wallet = await prisma.wallet.findUnique({
            where: { id: walletId }
        });

        if (!wallet) {
            throw new Error('Wallet tidak ditemukan');
        }

        if (wallet.userId !== userId) {
            throw new Error('Akses wallet tidak sah');
        }

        if (Number(wallet.balance) < amount) {
            throw new Error(`Saldo wallet "${wallet.name}" tidak mencukupi (Tersedia: ${Number(wallet.balance)})`);
        }

        return wallet;
    }

    /**
     * Records an expense in the wallet by decrementing balance.
     */
    static async recordExpense(walletId: string, amount: number) {
        return prisma.wallet.update({
            where: { id: walletId },
            data: {
                balance: { decrement: amount },
                spentAmount: { increment: amount }
            }
        });
    }

    /**
     * Top up a wallet from available balance.
     */
    static async topUp(userId: string, walletId: string, amount: number) {
        const available = await this.getAvailableBalance(userId);
        if (available < amount) {
            throw new Error('Saldo utama tidak mencukupi untuk top up');
        }

        const wallet = await prisma.wallet.update({
            where: { id: walletId },
            data: { balance: { increment: amount } }
        });

        await prisma.walletTransaction.create({
            data: {
                userId,
                toWalletId: walletId,
                amount,
                type: 'TOPUP',
                description: `Top up ke ${wallet.name}`
            }
        });

        return wallet;
    }

    /**
     * Withdraw from a wallet back to available balance.
     */
    static async withdraw(userId: string, walletId: string, amount: number) {
        const wallet = await prisma.wallet.findUnique({ where: { id: walletId } });
        if (!wallet || Number(wallet.balance) < amount) {
            throw new Error('Saldo wallet tidak mencukupi untuk penarikan');
        }

        const updatedWallet = await prisma.wallet.update({
            where: { id: walletId },
            data: { balance: { decrement: amount } }
        });

        await prisma.walletTransaction.create({
            data: {
                userId,
                fromWalletId: walletId,
                amount,
                type: 'WITHDRAW',
                description: `Penarikan dari ${wallet.name}`
            }
        });

        return updatedWallet;
    }

    /**
     * Transfer between wallets.
     */
    static async transfer(userId: string, fromId: string, toId: string, amount: number) {
        const fromWallet = await prisma.wallet.findUnique({ where: { id: fromId } });
        const toWallet = await prisma.wallet.findUnique({ where: { id: toId } });

        if (!fromWallet || Number(fromWallet.balance) < amount) {
            throw new Error('Saldo wallet sumber tidak mencukupi');
        }

        if (!toWallet) {
            throw new Error('Wallet tujuan tidak ditemukan');
        }

        // Atomic transaction
        return prisma.$transaction(async (tx) => {
            await tx.wallet.update({
                where: { id: fromId },
                data: { balance: { decrement: amount } }
            });

            await tx.wallet.update({
                where: { id: toId },
                data: { balance: { increment: amount } }
            });

            await tx.walletTransaction.create({
                data: {
                    userId,
                    fromWalletId: fromId,
                    toWalletId: toId,
                    amount,
                    type: 'TRANSFER',
                    description: `Transfer dari ${fromWallet.name} ke ${toWallet.name}`
                }
            });
        });
    }

    static async resetMonthly(userId: string, resetBudget: boolean = false) {
        return prisma.wallet.updateMany({
            where: { userId },
            data: {
                spentAmount: 0,
                ...(resetBudget && { budgetAmount: 0 })
            }
        });
    }

    /**
     * Gets the full history of a wallet (Internal transfers + External transactions).
     */
    static async getWalletHistory(userId: string, walletId: string) {
        const [walletTransactions, expenses] = await Promise.all([
            prisma.walletTransaction.findMany({
                where: {
                    userId,
                    OR: [
                        { fromWalletId: walletId },
                        { toWalletId: walletId }
                    ]
                },
                orderBy: { createdAt: 'desc' }
            }),
            prisma.transaction.findMany({
                where: {
                    userId,
                    walletId
                },
                orderBy: { date: 'desc' }
            })
        ]);

        // Merge and sort
        const history = [
            ...walletTransactions.map(wt => ({
                id: wt.id,
                type: wt.type, // TOPUP, WITHDRAW, TRANSFER
                amount: Number(wt.amount),
                description: wt.description,
                date: wt.createdAt,
                isInternal: true,
                isPositive: wt.toWalletId === walletId
            })),
            ...expenses.map(ex => ({
                id: ex.id,
                type: ex.type, // INCOME, EXPENSE
                amount: Number(ex.amount),
                description: ex.description || ex.category,
                date: ex.date,
                isInternal: false,
                isPositive: ex.type === 'INCOME'
            }))
        ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        return history;
    }
}
