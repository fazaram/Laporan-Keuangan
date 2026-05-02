import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { MAX_ALLOWED_AMOUNT } from '@/lib/utils';

export const dynamic = "force-dynamic";

export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const rules = await prisma.walletRule.findMany({
            where: { userId: session.user.id },
            include: {
                wallet: true
            }
        });

        return NextResponse.json({
            rules: rules.map(r => ({
                ...r,
                percentage: r.percentage ? Number(r.percentage) : null,
                fixedAmount: r.fixedAmount ? Number(r.fixedAmount) : null,
            }))
        });
    } catch (error) {
        console.error('Error fetching rules:', error);
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
        const { walletId, percentage, fixedAmount } = body;

        if (!walletId) {
            return NextResponse.json({ error: 'Wallet ID is required' }, { status: 400 });
        }

        // Validate wallet ownership
        const wallet = await prisma.wallet.findUnique({
            where: { id: walletId }
        });

        if (!wallet || wallet.userId !== session.user.id) {
            return NextResponse.json({ error: 'Wallet not found or unauthorized' }, { status: 404 });
        }

        // Validate percentage if provided
        if (percentage !== undefined && percentage !== null) {
            const currentRules = await prisma.walletRule.findMany({
                where: { userId: session.user.id }
            });

            const totalPercentage = currentRules.reduce((sum, r) => sum + (r.percentage ? Number(r.percentage) : 0), 0);
            if (totalPercentage + Number(percentage) > 100) {
                return NextResponse.json({ error: 'Total allocation percentage cannot exceed 100%' }, { status: 400 });
            }
        }
        
        if (fixedAmount && Number(fixedAmount) > MAX_ALLOWED_AMOUNT) {
            return NextResponse.json({ 
                error: `Nominal tetap tidak boleh melebihi Rp ${MAX_ALLOWED_AMOUNT.toLocaleString('id-ID')}` 
            }, { status: 400 });
        }

        const rule = await prisma.walletRule.create({
            data: {
                userId: session.user.id,
                walletId,
                percentage: percentage ? Number(percentage) : null,
                fixedAmount: fixedAmount ? Number(fixedAmount) : null,
            }
        });

        return NextResponse.json({
            rule: {
                ...rule,
                percentage: rule.percentage ? Number(rule.percentage) : null,
                fixedAmount: rule.fixedAmount ? Number(rule.fixedAmount) : null,
            }
        });
    } catch (error) {
        console.error('Error creating rule:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
