import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET(req: Request) {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'ADMIN') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const url = new URL(req.url);
        const type = url.searchParams.get('type');
        const userId = url.searchParams.get('userId');

        const transactions = await prisma.transaction.findMany({
            where: {
                ...(type && { type: type as any }),
                ...(userId && { userId }),
            },
            include: {
                user: {
                    select: {
                        name: true,
                        email: true,
                    }
                }
            },
            orderBy: { date: 'desc' },
            take: 100,
        });

        return NextResponse.json(transactions);
    } catch (error) {
        console.error('Error fetching admin transactions:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
