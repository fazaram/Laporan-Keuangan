'use server';

import { prisma } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { revalidatePath } from 'next/cache';
import { GoalService } from '@/lib/services/goal-service';
import { MAX_ALLOWED_AMOUNT } from '@/lib/utils';

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
        
        if (targetAmount > MAX_ALLOWED_AMOUNT) {
            return { error: `Target nominal tidak boleh melebihi Rp ${MAX_ALLOWED_AMOUNT.toLocaleString('id-ID')}` };
        }

        // Cek duplikat nama goal untuk user yang sama
        const existing = await prisma.goal.findFirst({
            where: { userId: session.user.id, name: { equals: name, mode: 'insensitive' } }
        });
        if (existing) {
            return { error: `Nama tabungan "${name}" sudah ada. Gunakan nama lain.` };
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

        const result = await GoalService.allocateAutomatically(session.user.id, amountToAllocate);
        
        revalidatePath('/goals');
        return result;
    } catch (error: any) {
        console.error('Error allocating funds:', error);
        return { error: error.message || 'Gagal mengalokasikan tabungan' };
    }
}

export async function syncGoalsAction() {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) throw new Error('Unauthorized');

        const result = await GoalService.syncGoalAmounts(session.user.id);
        
        revalidatePath('/goals');
        return result;
    } catch (error: any) {
        console.error('Error syncing goals:', error);
        return { error: 'Gagal melakukan sinkronisasi data' };
    }
}

export async function updateGoal(id: string, data: { name: string; targetAmount: number; priority: 'LOW' | 'MEDIUM' | 'HIGH'; durationMonths: number }) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) throw new Error('Unauthorized');

        if (!data.name || isNaN(data.targetAmount) || data.targetAmount <= 0) {
            return { error: 'Data tidak valid' };
        }
        
        if (data.targetAmount > MAX_ALLOWED_AMOUNT) {
            return { error: `Target nominal tidak boleh melebihi Rp ${MAX_ALLOWED_AMOUNT.toLocaleString('id-ID')}` };
        }

        const goal = await prisma.goal.findUnique({ where: { id, userId: session.user.id } });
        if (!goal) return { error: 'Goal tidak ditemukan' };

        // Cek duplikat nama, kecuali nama milik goal itu sendiri
        const duplicate = await prisma.goal.findFirst({
            where: {
                userId: session.user.id,
                name: { equals: data.name, mode: 'insensitive' },
                id: { not: id }
            }
        });
        if (duplicate) {
            return { error: `Nama tabungan "${data.name}" sudah digunakan. Pilih nama lain.` };
        }

        // Jika target baru lebih kecil dari yang terkumpul, naikkan status
        const newStatus = Number(goal.currentAmount) >= data.targetAmount ? 'COMPLETED' : 'ACTIVE';

        await prisma.goal.update({
            where: { id, userId: session.user.id },
            data: {
                name: data.name,
                targetAmount: data.targetAmount,
                priority: data.priority,
                durationMonths: data.durationMonths,
                status: newStatus,
            },
        });

        revalidatePath('/goals');
        return { success: true };
    } catch (error: any) {
        return { error: error.message || 'Gagal mengupdate goal' };
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
