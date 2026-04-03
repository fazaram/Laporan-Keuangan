'use server';

import { prisma } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

export async function getAvailableSurplus() {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return { surplus: 0 };

    const userId = session.user.id;

    // Hitung Pemasukan dan Pengeluaran (All Time)
    const transactions = await prisma.transaction.findMany({
        where: { userId }
    });

    const totalIncome = transactions
        .filter(t => t.type === 'INCOME')
        .reduce((sum, t) => sum + Number(t.amount), 0);
    
    const totalExpense = transactions
        .filter(t => t.type === 'EXPENSE')
        .reduce((sum, t) => sum + Number(t.amount), 0);

    // Hitung Total Alokasi yang sudah masuk ke seluruh Goals
    const allocations = await prisma.goalAllocation.findMany({
        where: { userId }
    });

    const totalAllocated = allocations.reduce((sum, a) => sum + Number(a.amount), 0);

    const availableSurplus = totalIncome - totalExpense - totalAllocated;

    return { surplus: availableSurplus > 0 ? availableSurplus : 0 };
}

export async function manualAllocate(goalId: string, amount: number, description?: string) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) throw new Error('Unauthorized');

        if (amount <= 0) return { error: 'Jumlah alokasi harus lebih dari 0' };

        const goal = await prisma.goal.findUnique({
            where: { id: goalId, userId: session.user.id }
        });

        if (!goal) return { error: 'Tabungan tidak ditemukan' };

        const tAmount = Number(goal.targetAmount);
        const cAmount = Number(goal.currentAmount);

        // Validasi Sisa Target
        const remainingTarget = (tAmount - cAmount);
        if (amount > remainingTarget) {
            return { error: `Jumlah melebihi sisa target goal. Sisa target: Rp ${remainingTarget.toLocaleString('id-ID')}` };
        }

        // Validasi Ketersediaan Saldo
        const { surplus } = await getAvailableSurplus();
        if (amount > surplus) {
            return { error: `Saldo tidak mencukupi untuk alokasi ini. Saldo tersedia: Rp ${surplus.toLocaleString('id-ID')}` };
        }

        const now = new Date();
        
        // Atomic Update
        await prisma.$transaction([
            prisma.goal.update({
                where: { id: goal.id },
                data: {
                    currentAmount: { increment: amount },
                    status: (cAmount + amount) >= tAmount ? 'COMPLETED' : 'ACTIVE'
                }
            }),
            prisma.goalAllocation.create({
                data: {
                    userId: session.user.id,
                    goalId: goal.id,
                    amount,
                    month: now.getMonth() + 1,
                    year: now.getFullYear(),
                    description: description || null
                }
            })
        ]);

        revalidatePath(`/goals/${goal.id}`);
        revalidatePath('/goals');
        revalidatePath('/dashboard');
        
        return { success: true };
    } catch (error: any) {
        console.error('Error manual allocation:', error);
        return { error: error.message || 'Gagal mengalokasikan tabungan' };
    }
}

export async function editAllocation(allocationId: string, newAmount: number) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) throw new Error('Unauthorized');

        if (newAmount <= 0) return { error: 'Jumlah alokasi harus lebih dari 0' };

        const allocation = await prisma.goalAllocation.findUnique({
            where: { id: allocationId, userId: session.user.id },
            include: { goal: true }
        });

        if (!allocation) return { error: 'Data alokasi tidak ditemukan' };

        const diffAmount = newAmount - Number(allocation.amount);

        // Jika alokasi nambah, pastikan saldo cukup & target gak terlampaui
        if (diffAmount > 0) {
            const { surplus } = await getAvailableSurplus();
            if (diffAmount > surplus) return { error: 'Saldo tabungan tidak mencukupi untuk menambah nominal ini' };

            const cAmount = Number(allocation.goal.currentAmount);
            const tAmount = Number(allocation.goal.targetAmount);
            const remainingTarget = tAmount - cAmount;

            if (diffAmount > remainingTarget) {
                return { error: 'Penambahan melebihi sisa target goal ini' };
            }
        }

        // Atomic Update
        await prisma.$transaction([
            prisma.goalAllocation.update({
                where: { id: allocation.id },
                data: { amount: newAmount }
            }),
            prisma.goal.update({
                where: { id: allocation.goal.id },
                data: {
                    currentAmount: { increment: diffAmount },
                    status: (Number(allocation.goal.currentAmount) + diffAmount) >= Number(allocation.goal.targetAmount) ? 'COMPLETED' : 'ACTIVE'
                }
            })
        ]);

        revalidatePath(`/goals/${allocation.goal.id}`);
        revalidatePath('/goals');
        revalidatePath('/dashboard');

        return { success: true };
    } catch (error: any) {
        console.error('Error edit allocation:', error);
        return { error: 'Gagal mengubah alokasi' };
    }
}

export async function deleteAllocation(allocationId: string) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) throw new Error('Unauthorized');

        const allocation = await prisma.goalAllocation.findUnique({
            where: { id: allocationId, userId: session.user.id },
            include: { goal: true }
        });

        if (!allocation) return { error: 'Data alokasi tidak ditemukan' };

        const amountToDeduct = Number(allocation.amount);

        await prisma.$transaction([
            prisma.goalAllocation.delete({
                where: { id: allocationId }
            }),
            prisma.goal.update({
                where: { id: allocation.goal.id },
                data: {
                    currentAmount: { decrement: amountToDeduct },
                    status: 'ACTIVE' // Jika didelete pastinya belum complete (atau target bisa aktif kembali)
                }
            })
        ]);

        revalidatePath(`/goals/${allocation.goal.id}`);
        revalidatePath('/goals');
        revalidatePath('/dashboard');

        return { success: true };
    } catch (error: any) {
        console.error('Error delete allocation:', error);
        return { error: 'Gagal menghapus alokasi' };
    }
}

export async function reallocateFunds(sourceAllocationId: string, targetGoalId: string, transferAmount: number) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) throw new Error('Unauthorized');

        if (transferAmount <= 0) return { error: 'Nominal pindah harus lebih dari 0' };

        // 1. Ambil alokasi sumber
        const sourceAllocation = await prisma.goalAllocation.findUnique({
            where: { id: sourceAllocationId, userId: session.user.id },
            include: { goal: true }
        });

        if (!sourceAllocation) return { error: 'Alokasi sumber tidak ditemukan' };
        if (transferAmount > Number(sourceAllocation.amount)) {
            return { error: 'Nominal transfer melebihi nominal alokasi sumber ini' };
        }

        // 2. Cek Goal target
        const targetGoal = await prisma.goal.findUnique({
            where: { id: targetGoalId, userId: session.user.id }
        });

        if (!targetGoal) return { error: 'Tabungan tujuan tidak ditemukan' };

        const remainingTarget = Number(targetGoal.targetAmount) - Number(targetGoal.currentAmount);
        
        if (transferAmount > remainingTarget) {
            return { error: 'Tujuan (Goal Baru) tidak dapat menampung karena melebihi sisa targetnya!' };
        }

        const now = new Date();

        const transactionUpdates: any[] = [];

        // 3. Edit atau hapus source allocation
        if (transferAmount === Number(sourceAllocation.amount)) {
            transactionUpdates.push(prisma.goalAllocation.delete({ where: { id: sourceAllocation.id } }));
        } else {
            transactionUpdates.push(prisma.goalAllocation.update({
                where: { id: sourceAllocation.id },
                data: { amount: { decrement: transferAmount } }
            }));
        }

        // 4. Kurangi currentAmount goal lama
        transactionUpdates.push(prisma.goal.update({
            where: { id: sourceAllocation.goalId },
            data: { currentAmount: { decrement: transferAmount }, status: 'ACTIVE' }
        }));

        // 5. Tambah allocation pada goal target
        transactionUpdates.push(prisma.goalAllocation.create({
            data: {
                userId: session.user.id,
                goalId: targetGoal.id,
                amount: transferAmount,
                month: now.getMonth() + 1,
                year: now.getFullYear(),
                description: `Pindahan dari: ${sourceAllocation.goal.name}`
            }
        }));

        // 6. Tambah currentAmount goal target
        transactionUpdates.push(prisma.goal.update({
            where: { id: targetGoal.id },
            data: { 
                currentAmount: { increment: transferAmount },
                status: (Number(targetGoal.currentAmount) + transferAmount) >= Number(targetGoal.targetAmount) ? 'COMPLETED' : 'ACTIVE'
             }
        }));

        await prisma.$transaction(transactionUpdates);

        revalidatePath(`/goals/${sourceAllocation.goalId}`);
        revalidatePath(`/goals/${targetGoal.id}`);
        revalidatePath('/goals');

        return { success: true };
    } catch (error: any) {
        console.error('Error reallocate funds:', error);
        return { error: 'Gagal mensimulasikan pemindahan tabungan' };
    }
}
