import { prisma } from '@/lib/db';
import { TransactionType } from '@prisma/client';

export class WalletService {
    /**
     * Allocates income to wallets based on defined rules.
     * Updates wallet.budgetAmount.
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
                        budgetAmount: {
                            increment: allocation
                        }
                    }
                });
            }
        }
    }

    /**
     * Checks if an expense exceeds the wallet's budget.
     * Throws an error if budget is exceeded.
     */
    static async validateExpense(userId: string, walletId: string, amount: number) {
        const wallet = await prisma.wallet.findUnique({
            where: { id: walletId }
        });

        if (!wallet) {
            throw new Error('Wallet not found');
        }

        if (wallet.userId !== userId) {
            throw new Error('Unauthorized wallet access');
        }

        const newSpentAmount = Number(wallet.spentAmount) + amount;
        if (newSpentAmount > Number(wallet.budgetAmount)) {
            throw new Error('Budget exceeded for this wallet');
        }

        return wallet;
    }

    /**
     * Records an expense in the wallet by incrementing spentAmount.
     */
    static async recordExpense(walletId: string, amount: number) {
        return prisma.wallet.update({
            where: { id: walletId },
            data: {
                spentAmount: {
                    increment: amount
                }
            }
        });
    }

    /**
     * Resets all user wallets' spent amounts to 0.
     * Optionally resets budgetAmount too.
     */
    static async resetMonthly(userId: string, resetBudget: boolean = false) {
        return prisma.wallet.updateMany({
            where: { userId },
            data: {
                spentAmount: 0,
                ...(resetBudget && { budgetAmount: 0 })
            }
        });
    }
}
