import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export const dynamic = "force-dynamic";

export async function GET() {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'ADMIN') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const [
            totalUsers,
            totalTransactions,
            totalIncomeRaw,
            totalExpenseRaw,
            activeGoals,
            aiRequestsToday
        ] = await Promise.all([
            prisma.user.count(),
            prisma.transaction.count(),
            prisma.transaction.aggregate({
                where: { type: 'INCOME' },
                _sum: { amount: true }
            }),
            prisma.transaction.aggregate({
                where: { type: 'EXPENSE' },
                _sum: { amount: true }
            }),
            (prisma as any).goal.count({
                where: { status: 'ACTIVE' }
            }),
            (prisma as any).chatHistory?.count({
                where: {
                    createdAt: {
                        gte: new Date(new Date().setHours(0, 0, 0, 0))
                    }
                }
            }) || 0
        ]);

        return NextResponse.json({
            totalUsers,
            totalTransactions,
            totalIncome: Number(totalIncomeRaw._sum.amount || 0),
            totalExpense: Number(totalExpenseRaw._sum.amount || 0),
            activeGoals,
            aiRequestsToday
        });
    } catch (error) {
        console.error('Error fetching admin stats:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
