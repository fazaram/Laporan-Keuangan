import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { WalletService } from '@/lib/services/wallet-service';

export const dynamic = "force-dynamic";

export async function POST() {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const result = await WalletService.processAutoAllocations(session.user.id);

        return NextResponse.json({
            success: true,
            processed: result.processed,
            errors: result.errors
        });
    } catch (error) {
        console.error('Error processing auto allocations:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
