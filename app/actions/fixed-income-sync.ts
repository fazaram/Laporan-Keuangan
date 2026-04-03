'use server';

import { prisma } from '@/lib/db';
import { TransactionType } from '@prisma/client';

export async function syncFixedIncomeTransactions(userId: string) {
    try {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { fixedIncome: true, fixedIncomeStartDate: true }
        });

        if (!user || !(user as any).fixedIncome || !(user as any).fixedIncomeStartDate) {
            return { success: true, message: 'No fixed income set' };
        }

        const fixedAmount = Number((user as any).fixedIncome);
        const startDate = new Date((user as any).fixedIncomeStartDate);
        const now = new Date();

        // Target: months from startDate to now
        let currentIterDate = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
        const endIterDate = new Date(now.getFullYear(), now.getMonth(), 1);

        let createdCount = 0;

        while (currentIterDate <= endIterDate) {
            const monthStart = new Date(currentIterDate.getFullYear(), currentIterDate.getMonth(), 1);
            const monthEnd = new Date(currentIterDate.getFullYear(), currentIterDate.getMonth() + 1, 0, 23, 59, 59);

            // Check if transaction already exists for this user in this month with category "Gaji (Otomatis)"
            const existing = await prisma.transaction.findFirst({
                where: {
                    userId: userId,
                    category: 'Gaji (Otomatis)',
                    date: {
                        gte: monthStart,
                        lte: monthEnd,
                    },
                },
            });

            if (!existing) {
                // Create the transaction
                // Use the specific day from fixedIncomeStartDate if possible, otherwise use 1st of month
                let transactionDay = startDate.getDate();
                // Ensure the day is valid for this month
                const lastDayOfMonth = monthEnd.getDate();
                if (transactionDay > lastDayOfMonth) transactionDay = lastDayOfMonth;

                const transactionDate = new Date(currentIterDate.getFullYear(), currentIterDate.getMonth(), transactionDay);

                await prisma.transaction.create({
                    data: {
                        userId: userId,
                        amount: fixedAmount,
                        type: TransactionType.INCOME,
                        category: 'Gaji (Otomatis)',
                        description: `Penghasilan tetap bulan ${transactionDate.toLocaleString('id-ID', { month: 'long', year: 'numeric' })}`,
                        date: transactionDate,
                    },
                });
                createdCount++;
            }

            // Move to next month
            currentIterDate.setMonth(currentIterDate.getMonth() + 1);
        }

        return { success: true, createdCount };
    } catch (error: any) {
        console.error('Error syncing fixed income:', error);
        return { error: error.message };
    }
}
