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
        const months = 6;
        const now = new Date();
        const start = new Date(now.getFullYear(), now.getMonth() - months + 1, 1);

        // 1. Monthly Totals
        const monthlyTotals = await Promise.all(
            Array.from({ length: months }).map(async (_, i) => {
                const date = new Date(now.getFullYear(), now.getMonth() - (months - 1 - i), 1);
                const nextMonth = new Date(date.getFullYear(), date.getMonth() + 1, 1);

                const stats = await prisma.transaction.groupBy({
                    by: ['type'],
                    where: {
                        date: { gte: date, lt: nextMonth }
                    },
                    _sum: { amount: true }
                });

                const income = Number(stats.find(s => s.type === 'INCOME')?._sum.amount || 0);
                const expense = Number(stats.find(s => s.type === 'EXPENSE')?._sum.amount || 0);

                return {
                    month: date.toLocaleString('default', { month: 'short' }),
                    income,
                    expense
                };
            })
        );

        // 2. Category Distribution
        const categoryStats = await prisma.transaction.groupBy({
            by: ['category'],
            where: { type: 'EXPENSE' },
            _sum: { amount: true },
            orderBy: { _sum: { amount: 'desc' } },
            take: 10
        });

        const categories = categoryStats.map(c => ({
            name: c.category,
            value: Number(c._sum.amount || 0)
        }));

        return NextResponse.json({ monthlyTotals, categories });
    } catch (error) {
        console.error('Error fetching admin reports:', error);
        return NextResponse.json({ monthlyTotals: [], categories: [] });
    }
}
