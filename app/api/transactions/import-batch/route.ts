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

        if (!walletId) {
            return NextResponse.json({ error: 'Destination wallet tidak valid' }, { status: 400 });
        }

        // Verify that the wallet belongs to the user
        const wallet = await prisma.wallet.findFirst({
            where: {
                id: walletId,
                userId: session.user.id
            }
        });

        if (!wallet) {
            return NextResponse.json({ error: 'Wallet tidak ditemukan atau bukan milik Anda' }, { status: 404 });
        }

        // Use interactive transaction to insert all and update wallet balance
        const result = await prisma.$transaction(async (tx: any) => {
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
                    walletId: wallet.id,
                    date: parsedDate,
                    category: t.category || 'Lainnya',
                    amount: amount,
                    type: t.type === 'INCOME' ? 'INCOME' : 'EXPENSE',
                    description: t.description || 'Transaksi Import OCR'
                };
            });

            // Bulk create transactions
            await tx.transaction.createMany({
                data: transactionsToCreate
            });

            // Calculate new balance
            const balanceChange = totalIncome - totalExpense;
            
            const updatedWallet = await tx.wallet.update({
                where: { id: wallet.id },
                data: {
                    balance: {
                        increment: balanceChange
                    }
                }
            });

            return {
                importedCount: transactionsToCreate.length,
                newBalance: updatedWallet.balance
            };
        });

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
