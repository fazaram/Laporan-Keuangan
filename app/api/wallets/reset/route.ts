import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { WalletService } from '@/lib/services/wallet-service';

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { resetBudget } = body;

        await WalletService.resetMonthly(session.user.id, !!resetBudget);

        return NextResponse.json({ message: 'Wallets reset successfully' });
    } catch (error) {
        console.error('Error resetting wallets:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
