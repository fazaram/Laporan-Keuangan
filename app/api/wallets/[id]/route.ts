import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function PATCH(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { name, icon, color } = body;

        if (name) {
            const existingWallet = await prisma.wallet.findFirst({
                where: { 
                    userId: session.user.id,
                    name: { equals: name, mode: 'insensitive' },
                    NOT: { id: params.id }
                }
            });

            if (existingWallet) {
                return NextResponse.json({ error: 'Pocket dengan nama ini sudah ada' }, { status: 400 });
            }
        }

        const wallet = await prisma.wallet.update({
            where: { 
                id: params.id,
                userId: session.user.id
            },
            data: {
                ...(name && { name }),
                ...(icon && { icon }),
                ...(color && { color })
            }
        });

        return NextResponse.json({
            wallet: {
                ...wallet,
                balance: Number(wallet.balance),
                budgetAmount: Number(wallet.budgetAmount),
                spentAmount: Number(wallet.spentAmount)
            }
        });
    } catch (error) {
        console.error('Error updating wallet:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Before deleting, we might want to check if balance is 0 or what to do with remaining balance.
        // For now, let's just delete it. The balance effectively "returns" to available because Available = Main - sum(Wallets).
        await prisma.wallet.delete({
            where: { 
                id: params.id,
                userId: session.user.id
            }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting wallet:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
