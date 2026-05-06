import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { WalletService } from '@/lib/services/wallet-service';

export const dynamic = "force-dynamic";

export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const userId = session.user.id;

        const [wallets, mainBalance, availableBalance] = await Promise.all([
            prisma.wallet.findMany({
                where: { userId },
                include: { rules: true },
                orderBy: { createdAt: 'desc' }
            }),
            WalletService.getMainBalance(userId),
            WalletService.getAvailableBalance(userId)
        ]);

        return NextResponse.json({
            wallets: wallets.map(w => ({
                ...w,
                balance: Number(w.balance),
                budgetAmount: Number(w.budgetAmount),
                spentAmount: Number(w.spentAmount)
            })),
            mainBalance,
            availableBalance
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
        const { name, icon, color, initialAmount } = body;

        if (!name) {
            return NextResponse.json({ error: 'Nama wallet wajib diisi' }, { status: 400 });
        }

        const amount = Number(initialAmount || 0);

        if (amount > 0) {
            const available = await WalletService.getAvailableBalance(session.user.id);
            if (amount > available) {
                return NextResponse.json({ error: 'Saldo utama tidak mencukupi' }, { status: 400 });
            }
        }

        // Check for duplicate name
        const existingWallet = await prisma.wallet.findFirst({
            where: { 
                userId: session.user.id,
                name: { equals: name, mode: 'insensitive' }
            }
        });

        if (existingWallet) {
            return NextResponse.json({ error: 'Pocket dengan nama ini sudah ada' }, { status: 400 });
        }

        const wallet = await prisma.wallet.create({
            data: {
                userId: session.user.id,
                name,
                icon: icon || null,
                color: color || '#3B82F6',
                balance: amount,
            }
        });

        if (amount > 0) {
            await prisma.walletTransaction.create({
                data: {
                    userId: session.user.id,
                    toWalletId: wallet.id,
                    amount,
                    type: 'TOPUP',
                    description: `Saldo awal wallet ${name}`
                }
            });
        }

        return NextResponse.json({
            wallet: {
                ...wallet,
                balance: Number(wallet.balance),
                budgetAmount: Number(wallet.budgetAmount),
                spentAmount: Number(wallet.spentAmount)
            }
        });
    } catch (error) {
        console.error('Error creating wallet:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
