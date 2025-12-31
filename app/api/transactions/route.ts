import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { AuditLogger } from '@/lib/audit/logger';

export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || !session.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const type = searchParams.get('type') as 'INCOME' | 'EXPENSE' | null;
        const startDate = searchParams.get('startDate');
        const endDate = searchParams.get('endDate');
        const category = searchParams.get('category');

        const where: any = {};

        // VIEWER can see all transactions (shared view for monitoring/audit)
        // USER and ADMIN only see their own data
        if (session.user.role !== 'VIEWER') {
            where.userId = session.user.id;
        }

        if (type) {
            where.type = type;
        }

        if (category) {
            where.category = category;
        }

        if (startDate && endDate) {
            where.date = {
                gte: new Date(startDate),
                lte: new Date(endDate),
            };
        }

        const transactions = await prisma.transaction.findMany({
            where,
            orderBy: { date: 'desc' },
        });

        return NextResponse.json({
            transactions: transactions.map((t) => ({
                ...t,
                amount: Number(t.amount),
            })),
        });
    } catch (error) {
        console.error('Error fetching transactions:', error);
        return NextResponse.json(
            { error: 'Failed to fetch transactions' },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || !session.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Check if user has permission to create
        if (session.user.role === 'VIEWER') {
            return NextResponse.json(
                { error: 'Forbidden: Viewers cannot create transactions' },
                { status: 403 }
            );
        }

        const body = await request.json();
        const { date, category, amount, type, description } = body;

        if (!date || !category || !amount || !type) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        const transaction = await prisma.transaction.create({
            data: {
                date: new Date(date),
                category,
                amount,
                type,
                description: description || null,
                userId: session.user.id,
            },
        });

        // Log the creation in audit log
        await AuditLogger.logCreate(
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

        return NextResponse.json({
            transaction: {
                ...transaction,
                amount: Number(transaction.amount),
            },
        });
    } catch (error) {
        console.error('Error creating transaction:', error);
        return NextResponse.json(
            { error: 'Failed to create transaction' },
            { status: 500 }
        );
    }
}
