import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function POST(request: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { transactions, walletId } = body;

        if (!transactions || !Array.isArray(transactions) || transactions.length === 0) {
            return NextResponse.json({ error: 'Tidak ada transaksi untuk diimport' }, { status: 400 });
        }

        let wallet = null;
        if (walletId) {
            // Verify that the wallet belongs to the user
            wallet = await prisma.wallet.findFirst({
                where: {
                    id: walletId,
                    userId: session.user.id
                }
            });

            if (!wallet) {
                return NextResponse.json({ error: 'Wallet tidak ditemukan atau bukan milik Anda' }, { status: 404 });
            }
        }

        let totalIncome = 0;
        let totalExpense = 0;

        const transactionsToCreate = transactions.map((t: any) => {
            const amount = parseFloat(t.amount);
            
            if (t.type === 'INCOME') totalIncome += amount;
            else if (t.type === 'EXPENSE') totalExpense += amount;

            // Safely parse date or fallback to today
            let parsedDate = new Date();
            if (t.date) {
                const tempDate = new Date(t.date);
                if (!isNaN(tempDate.getTime())) {
                    parsedDate = tempDate;
                }
            }

            return {
                userId: session.user.id,
                walletId: wallet ? wallet.id : null,
                date: parsedDate,
                category: t.category || 'Lainnya',
                amount: amount,
                type: t.type === 'INCOME' ? 'INCOME' : 'EXPENSE',
                description: t.description || 'Transaksi Import OCR'
            };
        });

        // We avoid interactive transactions ($transaction(async)) here because 
        // they often timeout (P2028) with PgBouncer connection pools.
        // Instead, we just execute them sequentially.
        
        await prisma.transaction.createMany({
            data: transactionsToCreate
        });

        let newBalance = null;
        if (wallet) {
            const balanceChange = totalIncome - totalExpense;
            const updatedWallet = await prisma.wallet.update({
                where: { id: wallet.id },
                data: {
                    balance: {
                        increment: balanceChange
                    }
                }
            });
            newBalance = updatedWallet.balance;
        }

        const result = {
            importedCount: transactionsToCreate.length,
            newBalance: newBalance
        };

        return NextResponse.json({ 
            message: 'Import berhasil', 
            data: result 
        });

    } catch (error: any) {
        console.error('Import Batch API Error:', error);
        return NextResponse.json({ 
            error: 'Gagal mengimport transaksi',
            details: error.message 
        }, { status: 500 });
    }
}
