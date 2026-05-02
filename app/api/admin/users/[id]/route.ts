import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export const dynamic = "force-dynamic";

export async function GET(
    req: Request,
    { params }: { params: { id: string } }
) {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'ADMIN') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const userId = params.id;

        const [user, transactionsCount, goalsCount, walletCount, aiHistoryCount] = await Promise.all([
            prisma.user.findUnique({
                where: { id: userId },
                select: {
                    id: true,
                    name: true,
                    email: true,
                    role: true,
                    status: true,
                    bio: true,
                    createdAt: true,
                }
            }),
            prisma.transaction.count({ where: { userId } }),
            (prisma as any).goal.count({ where: { userId } }),
            (prisma as any).wallet.count({ where: { userId } }),
            (prisma as any).chatHistory?.count({ where: { userId } }) || 0
        ]);

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // Get total balance
        const transactions = await prisma.transaction.findMany({
            where: { userId },
            select: { amount: true, type: true }
        });

        const totalIncome = transactions
            .filter(t => t.type === 'INCOME')
            .reduce((sum, t) => sum + Number(t.amount), 0);
        const totalExpense = transactions
            .filter(t => t.type === 'EXPENSE')
            .reduce((sum, t) => sum + Number(t.amount), 0);
        
        const balance = totalIncome - totalExpense;

        return NextResponse.json({
            ...user,
            stats: {
                balance,
                transactionsCount,
                goalsCount,
                walletCount,
                aiHistoryCount
            }
        });
    } catch (error) {
        console.error('Error fetching admin user detail:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function PATCH(
    req: Request,
    { params }: { params: { id: string } }
) {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'ADMIN') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const userId = params.id;
        const body = await req.json();
        const { role, status } = body;

        // Prevent self-modification
        if (userId === session.user.id) {
            return NextResponse.json({ error: 'Cannot modify your own account' }, { status: 403 });
        }

        const dataToUpdate: any = {};
        if (role) dataToUpdate.role = role;
        if (status) dataToUpdate.status = status;

        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: dataToUpdate,
            select: { id: true, role: true, status: true }
        });

        return NextResponse.json(updatedUser);
    } catch (error) {
        console.error('Error updating admin user:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function DELETE(
    req: Request,
    { params }: { params: { id: string } }
) {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'ADMIN') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const userId = params.id;

        // Prevent self-deletion
        if (userId === session.user.id) {
            return NextResponse.json({ error: 'Cannot delete your own account' }, { status: 403 });
        }

        await prisma.user.delete({
            where: { id: userId }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting admin user:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

