import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const wallets = await prisma.wallet.findMany({
            where: { userId: session.user.id },
            include: {
                rules: true
            },
            orderBy: { createdAt: 'desc' }
        });

        return NextResponse.json({
            wallets: wallets.map(w => ({
                ...w,
                budgetAmount: Number(w.budgetAmount),
                spentAmount: Number(w.spentAmount)
            }))
        });
    } catch (error) {
        console.error('Error fetching wallets:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { name, icon } = body;

        if (!name) {
            return NextResponse.json({ error: 'Wallet name is required' }, { status: 400 });
        }

        const wallet = await prisma.wallet.create({
            data: {
                userId: session.user.id,
                name,
                icon: icon || null,
            }
        });

        return NextResponse.json({
            wallet: {
                ...wallet,
                budgetAmount: Number(wallet.budgetAmount),
                spentAmount: Number(wallet.spentAmount)
            }
        });
    } catch (error) {
        console.error('Error creating wallet:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
