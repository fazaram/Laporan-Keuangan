import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET() {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'ADMIN') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        // AI Requests per day for the last 7 days
        const last7Days = Array.from({ length: 7 }, (_, i) => {
            const d = new Date();
            d.setDate(d.getDate() - i);
            d.setHours(0, 0, 0, 0);
            return d;
        }).reverse();

        const dailyUsage = await Promise.all(last7Days.map(async (date) => {
            const nextDay = new Date(date);
            nextDay.setDate(date.getDate() + 1);

            const count = await (prisma as any).chatHistory?.count({
                where: {
                    createdAt: { gte: date, lt: nextDay }
                }
            }) || 0;

            return {
                date: date.toISOString().split('T')[0],
                count
            };
        }));

        // Top users by AI usage
        const topUsers = await (prisma as any).chatHistory?.groupBy({
            by: ['userId'],
            _count: {
                id: true
            },
            orderBy: {
                _count: {
                    id: 'desc'
                }
            },
            take: 5
        }) || [];

        // Enrich with user names
        const enrichedTopUsers = await Promise.all(topUsers.map(async (u: any) => {
            const user = await prisma.user.findUnique({
                where: { id: u.userId },
                select: { name: true, email: true }
            });
            return {
                ...u,
                name: user?.name,
                email: user?.email,
                usageCount: u._count.id
            };
        }));

        return NextResponse.json({ dailyUsage, topUsers: enrichedTopUsers });
    } catch (error) {
        console.error('Error fetching AI stats:', error);
        return NextResponse.json({ dailyUsage: [], topUsers: [] });
    }
}
