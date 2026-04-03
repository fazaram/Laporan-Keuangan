'use server';

import { prisma } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

export async function createGoal(formData: FormData) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) throw new Error('Unauthorized');

        const name = formData.get('name') as string;
        const targetAmount = parseFloat(formData.get('targetAmount') as string);
        const durationMonths = parseInt(formData.get('durationMonths') as string);
        const startDateString = formData.get('startDate') as string;
        const startDate = new Date(startDateString);
        const priority = formData.get('priority') as 'LOW' | 'MEDIUM' | 'HIGH';

        if (!name || isNaN(targetAmount) || isNaN(durationMonths) || !startDateString) {
            return { error: 'Semua kolom wajib diisi dengan benar' };
        }

        await prisma.goal.create({
            data: {
                name,
                targetAmount,
                durationMonths,
                startDate,
                priority,
                userId: session.user.id,
            },
        });

        revalidatePath('/goals');
        return { success: true };
    } catch (error: any) {
        return { error: error.message || 'Gagal membuat goal' };
    }
}

export async function getGoals() {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) return [];

        const goals = await prisma.goal.findMany({
            where: { userId: session.user.id },
            orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
        });

        return goals.map(goal => ({
            ...goal,
            targetAmount: Number(goal.targetAmount),
            currentAmount: Number(goal.currentAmount),
        }));
    } catch (error) {
        console.error('Error fetching goals:', error);
        return [];
    }
}

export async function getMonthlyFinancials() {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) return { income: 0, expense: 0, surplus: 0 };

        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

        const transactions = await prisma.transaction.findMany({
            where: {
                userId: session.user.id,
                date: {
                    gte: startOfMonth,
                    lte: endOfMonth,
                },
            },
        });

        let income = 0;
        let expense = 0;

        transactions.forEach(t => {
            const amount = Number(t.amount);
            if (t.type === 'INCOME') income += amount;
            else if (t.type === 'EXPENSE') expense += amount;
        });

        return {
            income,
            expense,
            surplus: income - expense
        };
    } catch (error) {
        console.error('Error fetching monthly financials:', error);
        return { income: 0, expense: 0, surplus: 0 };
    }
}

export async function allocateFunds(amountToAllocate: number) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) throw new Error('Unauthorized');

        if (amountToAllocate <= 0) return { error: 'Jumlah alokasi harus lebih dari 0' };

        // Fetch active goals ordered by priority
        const activeGoals = await prisma.goal.findMany({
            where: { userId: session.user.id, status: 'ACTIVE' },
            orderBy: [
                { priority: 'desc' }, // HIGH, then MEDIUM, then LOW. Wait, Prisma string desc is tricky. Usually High > Medium > Low but alphabetical? High, Medium, Low -> H, M, L. Desc: M, L, H. It might be better to sort in code or use custom ordering. Let's fetch all and sort in JS.
            ],
        });

        // Priority weighting
        const priorityOrder = { HIGH: 3, MEDIUM: 2, LOW: 1 };
        activeGoals.sort((a, b) => priorityOrder[b.priority] - priorityOrder[a.priority]);

        let remainingAmount = amountToAllocate;
        const now = new Date();
        const month = now.getMonth() + 1;
        const year = now.getFullYear();

        const updates = [];

        for (const goal of activeGoals) {
            if (remainingAmount <= 0) break;

            const tAmount = Number(goal.targetAmount);
            const cAmount = Number(goal.currentAmount);

            if (cAmount >= tAmount) continue; // Already completed

            // Kebutuhan per bulan = (Target - Terkumpul) / Sisa Bulan
            const monthsPassed = (year - goal.startDate.getFullYear()) * 12 + (month - (goal.startDate.getMonth() + 1));
            // Minimum sisa bulan 1
            const remainingMonths = Math.max(1, goal.durationMonths - monthsPassed); 
            
            const remainingTarget = Math.max(0, tAmount - cAmount);
            let neededThisMonth = remainingTarget / remainingMonths;

            // Alokasikan dana
            const allocated = Math.min(neededThisMonth, remainingAmount);
            if (allocated > 0) {
                updates.push(
                    prisma.goal.update({
                        where: { id: goal.id },
                        data: {
                            currentAmount: {
                                increment: allocated
                            },
                            status: cAmount + allocated >= tAmount ? 'COMPLETED' : 'ACTIVE'
                        }
                    })
                );

                updates.push(
                    prisma.goalAllocation.create({
                        data: {
                            goalId: goal.id,
                            amount: allocated,
                            month,
                            year
                        }
                    })
                );

                remainingAmount -= allocated;
            }
        }

        // If there's still remaining amount, it means Surplus. 
        // We can just leave it unallocated or return it to user logic.
        
        await prisma.$transaction(updates);

        revalidatePath('/goals');
        return { success: true, remainingSurplus: remainingAmount };
    } catch (error: any) {
        console.error('Error allocating funds:', error);
        return { error: error.message || 'Gagal mengalokasikan tabungan' };
    }
}

export async function deleteGoal(id: string) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) throw new Error('Unauthorized');

        await prisma.goal.delete({
            where: { id, userId: session.user.id },
        });

        revalidatePath('/goals');
        return { success: true };
    } catch (error: any) {
        return { error: error.message || 'Gagal menghapus goal' };
    }
}
