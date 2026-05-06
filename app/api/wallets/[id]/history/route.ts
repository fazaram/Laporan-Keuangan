import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { WalletService } from '@/lib/services/wallet-service';

export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const history = await WalletService.getWalletHistory(session.user.id, params.id);

        return NextResponse.json({ history });
    } catch (error) {
        console.error('Error fetching wallet history:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
