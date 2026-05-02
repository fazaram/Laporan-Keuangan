'use server';

import { prisma } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { revalidatePath } from 'next/cache';
import { syncFixedIncomeTransactions } from './fixed-income-sync';
import { MAX_ALLOWED_AMOUNT } from '@/lib/utils';

export async function updateProfile(formData: FormData) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return { error: 'Unauthorized' };
        }

        const name = formData.get('name') as string;
        const bio = formData.get('bio') as string;
        const birthDateStr = formData.get('birthDate') as string;

        if (name && name.length > 50) {
            return { error: 'Nama maksimal 50 karakter' };
        }
        if (bio && bio.length > 200) {
            return { error: 'Bio maksimal 200 karakter' };
        }

        const updateData: any = {
            name,
            bio,
        };

        if (birthDateStr) {
            updateData.birthDate = new Date(birthDateStr);
        }

        await prisma.user.update({
            where: { id: session.user.id },
            data: updateData,
        });

        revalidatePath('/profile');
        revalidatePath('/dashboard');
        return { success: true };
    } catch (error: any) {
        console.error('Action updateProfile failed:', error);
        return { error: 'Gagal memperbarui profil: ' + error.message };
    }
}

export async function updateFixedIncome(formData: FormData) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return { error: 'Unauthorized' };
        }

        const amount = Number(formData.get('amount'));
        const startDateStr = formData.get('startDate') as string;

        if (isNaN(amount) || amount < 0) {
            return { error: 'Nominal tidak valid' };
        }
        
        if (amount > MAX_ALLOWED_AMOUNT) {
            return { error: `Nominal tidak boleh melebihi Rp ${MAX_ALLOWED_AMOUNT.toLocaleString('id-ID')}` };
        }

        await prisma.user.update({
            where: { id: session.user.id },
            data: {
                fixedIncome: amount,
                fixedIncomeStartDate: startDateStr ? new Date(startDateStr) : null,
            },
        });

        // Sync transactions immediately
        await syncFixedIncomeTransactions(session.user.id);

        revalidatePath('/profile');
        revalidatePath('/dashboard');
        return { success: true };
    } catch (error: any) {
        console.error('Action updateFixedIncome failed:', error);
        return { error: 'Gagal memperbarui penghasilan tetap: ' + error.message };
    }
}
