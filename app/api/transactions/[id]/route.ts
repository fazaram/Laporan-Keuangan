import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { AuditLogger } from '@/lib/audit/logger';

export async function GET(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || !session.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const params = await context.params;
        const transaction = await prisma.transaction.findFirst({
            where: {
                id: params.id,
                userId: session.user.id,
            },
        });

        if (!transaction) {
            return NextResponse.json(
                { error: 'Transaction not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({
            transaction: {
                ...transaction,
                amount: Number(transaction.amount),
            },
        });
    } catch (error) {
        console.error('Error fetching transaction:', error);
        return NextResponse.json(
            { error: 'Failed to fetch transaction' },
            { status: 500 }
        );
    }
}

export async function PUT(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || !session.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Check if user has permission to update
        if (session.user.role === 'VIEWER') {
            return NextResponse.json(
                { error: 'Forbidden: Viewers cannot update transactions' },
                { status: 403 }
            );
        }

        const params = await context.params;

        // Get old data for audit log
        const oldTransaction = await prisma.transaction.findFirst({
            where: {
                id: params.id,
                userId: session.user.id,
            },
        });

        if (!oldTransaction) {
            return NextResponse.json(
                { error: 'Transaction not found' },
                { status: 404 }
            );
        }

        const body = await request.json();
        const { date, category, amount, type, description } = body;

        // Update transaction - properly handle all fields
        const transaction = await prisma.transaction.update({
            where: {
                id: params.id,
            },
            data: {
                date: new Date(date),
                category: category,
                amount: amount,
                type: type,
                description: description || null,
            },
        });

        // Log the update in audit log
        try {
            await AuditLogger.logUpdate(
                session.user.id,
                'Transaction',
                transaction.id,
                {
                    date: oldTransaction.date,
                    category: oldTransaction.category,
                    amount: Number(oldTransaction.amount),
                    type: oldTransaction.type,
                    description: oldTransaction.description,
                },
                {
                    date: transaction.date,
                    category: transaction.category,
                    amount: Number(transaction.amount),
                    type: transaction.type,
                    description: transaction.description,
                },
                request
            );
        } catch (auditError) {
            console.error('Audit log error:', auditError);
            // Continue even if audit fails
        }

        return NextResponse.json({
            transaction: {
                ...transaction,
                amount: Number(transaction.amount),
            },
        });
    } catch (error) {
        console.error('Error updating transaction:', error);
        return NextResponse.json(
            { error: 'Failed to update transaction' },
            { status: 500 }
        );
    }
}

export async function DELETE(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || !session.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Check if user has permission to delete
        if (session.user.role === 'VIEWER') {
            return NextResponse.json(
                { error: 'Forbidden: Viewers cannot delete transactions' },
                { status: 403 }
            );
        }

        const params = await context.params;

        // Get transaction data for audit log before deleting
        const transaction = await prisma.transaction.findFirst({
            where: {
                id: params.id,
                userId: session.user.id,
            },
        });

        if (!transaction) {
            return NextResponse.json(
                { error: 'Transaction not found' },
                { status: 404 }
            );
        }

        // Delete ONLY this single transaction by unique ID
        await prisma.transaction.delete({
            where: {
                id: params.id,
            },
        });

        // Log the deletion in audit log
        try {
            await AuditLogger.logDelete(
                session.user.id,
                'Transaction',
                transaction.id,
                {
                    date: transaction.date,
                    category: transaction.category,
                    amount: Number(transaction.amount),
                    type: transaction.type,
                    description: transaction.description,
                },
                request
            );
        } catch (auditError) {
            console.error('Audit log error:', auditError);
            // Continue even if audit fails
        }

        return NextResponse.json({
            success: true,
            message: 'Transaction deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting transaction:', error);
        return NextResponse.json(
            { error: 'Failed to delete transaction' },
            { status: 500 }
        );
    }
}
