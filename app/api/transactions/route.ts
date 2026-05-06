import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { AuditLogger } from '@/lib/audit/logger';
import { WalletService } from '@/lib/services/wallet-service';
import { TransactionType } from '@prisma/client';
import { GoalService } from '@/lib/services/goal-service';
import { MAX_ALLOWED_AMOUNT } from '@/lib/utils';

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || !session.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const type = searchParams.get('type') as 'INCOME' | 'EXPENSE' | null;
        const startDate = searchParams.get('startDate');
        const endDate = searchParams.get('endDate');
        const category = searchParams.get('category');

        const where: any = {};
        const walletWhere: any = {
            userId: session.user.id,
            type: { in: ['TOPUP', 'WITHDRAW'] }
        };

        if (session.user.role !== 'VIEWER') {
            where.userId = session.user.id;
        }

        if (type) {
            where.type = type;
            // TOPUP is Expense, WITHDRAW is Income
            if (type === 'INCOME') {
                walletWhere.type = 'WITHDRAW';
            } else {
                walletWhere.type = 'TOPUP';
            }
        }

        if (category) {
            where.category = category;
            // If category filter is applied, wallet transactions (Category: Smart Wallet) 
            // will only show if the search matches 'Smart Wallet'
            if (category !== 'Smart Wallet') {
                walletWhere.id = 'none'; // effectively hide
            }
        }

        if (startDate && endDate) {
            const dateRange = {
                gte: new Date(startDate),
                lte: new Date(endDate),
            };
            where.date = dateRange;
            walletWhere.createdAt = dateRange;
        }

        const [transactions, walletTransactions] = await Promise.all([
            prisma.transaction.findMany({
                where,
                orderBy: { date: 'desc' },
            }),
            prisma.walletTransaction.findMany({
                where: walletWhere,
                include: {
                    toWallet: true,
                    fromWallet: true
                },
                orderBy: { createdAt: 'desc' }
            })
        ]);

        const mergedTransactions = [
            ...transactions.map((t) => ({
                ...t,
                amount: Number(t.amount),
                date: t.date.toISOString(),
            })),
            ...walletTransactions.map((wt) => ({
                id: wt.id,
                userId: wt.userId,
                amount: Number(wt.amount),
                type: wt.type === 'TOPUP' ? 'EXPENSE' : 'INCOME',
                category: 'Smart Wallet',
                description: wt.type === 'TOPUP' 
                    ? `Alokasi ke ${wt.toWallet?.name || 'Wallet'}` 
                    : `Penarikan dari ${wt.fromWallet?.name || 'Wallet'}`,
                date: wt.createdAt.toISOString(),
                createdAt: wt.createdAt.toISOString(),
                updatedAt: wt.createdAt.toISOString(),
                isWalletTransaction: true
            }))
        ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        return NextResponse.json({
            transactions: mergedTransactions
        });
    } catch (error) {
        console.error('Error fetching transactions:', error);
        return NextResponse.json(
            { error: 'Failed to fetch transactions' },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || !session.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Check if user has permission to create
        if (session.user.role === 'VIEWER') {
            return NextResponse.json(
                { error: 'Forbidden: Viewers cannot create transactions' },
                { status: 403 }
            );
        }

        const body = await request.json();
        const { date, category, amount, type, description, walletId } = body;

        if (!date || !category || !amount || !type) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }
        
        const numericAmount = Number(amount);
        if (numericAmount > MAX_ALLOWED_AMOUNT) {
            return NextResponse.json(
                { error: `Nominal tidak boleh melebihi Rp 100 Triliun (100.000.000.000.000)` },
                { status: 400 }
            );
        }

        // Wallet logic: If expense, check budget
        if (type === TransactionType.EXPENSE && walletId) {
            try {
                await WalletService.validateExpense(session.user.id, walletId, Number(amount));
            } catch (err: any) {
                return NextResponse.json({ error: err.message }, { status: 400 });
            }
        }

        const transaction = await prisma.transaction.create({
            data: {
                date: new Date(date),
                category,
                amount,
                type,
                description: description || null,
                userId: session.user.id,
                walletId: walletId || null,
            },
        });

        // Wallet logic: If income, allocate to wallets. If expense, record in wallet.
        if (type === TransactionType.INCOME) {
            await WalletService.allocateIncome(session.user.id, Number(amount));
            // Goal logic: Also allocate surplus to goals automatically (Sync)
            await GoalService.allocateAutomatically(session.user.id, Number(amount));
        } else if (type === TransactionType.EXPENSE && walletId) {
            await WalletService.recordExpense(walletId, Number(amount));
        }

        // Log the creation in audit log
        await AuditLogger.logCreate(
            session.user.id,
            'Transaction',
            transaction.id,
            {
                date: transaction.date,
                category: transaction.category,
                amount: Number(transaction.amount),
                type: transaction.type,
                description: transaction.description,
            },
            request
        );

        return NextResponse.json({
            transaction: {
                ...transaction,
                amount: Number(transaction.amount),
            },
        });
    } catch (error) {
        console.error('Error creating transaction:', error);
        return NextResponse.json(
            { error: 'Failed to create transaction' },
            { status: 500 }
        );
    }
}

export async function DELETE(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || !session.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        if (session.user.role === 'VIEWER') {
            return NextResponse.json(
                { error: 'Forbidden: Viewers cannot delete transactions' },
                { status: 403 }
            );
        }

        const body = await request.json();
        const { ids } = body;

        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            return NextResponse.json(
                { error: 'Missing or invalid transaction IDs' },
                { status: 400 }
            );
        }

        // Validate that all transactions belong to the user (unless admin, but for now enforce userId)
        const transactionsToDelete = await prisma.transaction.findMany({
            where: {
                id: { in: ids },
                userId: session.user.id,
            },
        });

        if (transactionsToDelete.length === 0) {
            return NextResponse.json(
                { error: 'No matching transactions found or unauthorized' },
                { status: 404 }
            );
        }

        const validIds = transactionsToDelete.map(t => t.id);

        await prisma.transaction.deleteMany({
            where: {
                id: { in: validIds },
            },
        });

        // Audit log for multiple deletions
        for (const transaction of transactionsToDelete) {
            try {
                await AuditLogger.logDelete(
                    session.user.id,
                    'Transaction',
                    transaction.id,
                    {
                        date: transaction.date,
                        category: transaction.category,
                        amount: Number(transaction.amount),
                        type: transaction.type,
                        description: transaction.description,
                    },
                    request
                );
            } catch (err) {
                console.error('Audit log error on bulk delete:', err);
            }
        }

        return NextResponse.json({
            success: true,
            message: `Successfully deleted ${validIds.length} transactions`,
            deletedCount: validIds.length
        });
    } catch (error) {
        console.error('Error in bulk deleting transactions:', error);
        return NextResponse.json(
            { error: 'Failed to delete transactions' },
            { status: 500 }
        );
    }
}
