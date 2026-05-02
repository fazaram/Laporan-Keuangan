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
        
        // 1. Monthly Joins
        const monthlyJoins = await Promise.all(
            Array.from({ length: months }).map(async (_, i) => {
                const date = new Date(now.getFullYear(), now.getMonth() - (months - 1 - i), 1);
                const nextMonth = new Date(date.getFullYear(), date.getMonth() + 1, 1);

                const usersCount = await prisma.user.count({
                    where: {
                        createdAt: { gte: date, lt: nextMonth }
                    }
                });

                return {
                    month: date.toLocaleString('default', { month: 'short' }),
                    users: usersCount
                };
            })
        );

        // 2. Role Distribution
        const rolesData = await prisma.user.groupBy({
            by: ['role'],
            _count: { id: true }
        });

        const roles = rolesData.map(r => ({
            name: r.role,
            count: r._count.id
        }));

        // 3. Summary Stats
        const totalUsers = await prisma.user.count();
        const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const thisYearStart = new Date(now.getFullYear(), 0, 1);
        
        const joinedThisMonth = await prisma.user.count({
            where: { createdAt: { gte: thisMonthStart } }
        });
        
        const joinedThisYear = await prisma.user.count({
            where: { createdAt: { gte: thisYearStart } }
        });

        return NextResponse.json({ 
            monthlyJoins, 
            roles, 
            summary: { totalUsers, joinedThisMonth, joinedThisYear } 
        });
    } catch (error) {
        console.error('Error fetching admin reports:', error);
        return NextResponse.json({ 
            monthlyJoins: [], 
            roles: [], 
            summary: { totalUsers: 0, joinedThisMonth: 0, joinedThisYear: 0 } 
        });
    }
}
