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
        const broadcasts = await (prisma as any).broadcast.findMany({
            include: {
                author: {
                    select: { name: true }
                }
            },
            orderBy: { createdAt: 'desc' },
        }) || [];

        return NextResponse.json(broadcasts);
    } catch (error) {
        console.error('Error fetching broadcasts:', error);
        return NextResponse.json([]);
    }
}

export async function POST(req: Request) {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'ADMIN') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await req.json();
        const { title, message } = body;

        const broadcast = await (prisma as any).broadcast.create({
            data: {
                title,
                message,
                authorId: session.user.id
            }
        });

        return NextResponse.json(broadcast);
    } catch (error) {
        console.error('Error creating broadcast:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
