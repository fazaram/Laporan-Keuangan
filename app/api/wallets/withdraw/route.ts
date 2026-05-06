import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { WalletService } from '@/lib/services/wallet-service';

export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { walletId, amount } = body;

        if (!walletId || !amount || amount <= 0) {
            return NextResponse.json({ error: 'Invalid withdrawal details' }, { status: 400 });
        }

        await WalletService.withdraw(
            session.user.id,
            walletId,
            Number(amount)
        );

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Error withdrawing from wallet:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
