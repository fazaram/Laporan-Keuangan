import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || !session.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Check if current user is admin
        if (session.user.role !== 'ADMIN') {
            return NextResponse.json(
                { error: 'Forbidden: Admin access required' },
                { status: 403 }
            );
        }

        const { email, role } = await request.json();

        if (!email || !role) {
            return NextResponse.json(
                { error: 'Email and role are required' },
                { status: 400 }
            );
        }

        if (role !== 'USER' && role !== 'ADMIN') {
            return NextResponse.json(
                { error: 'Invalid role. Must be USER or ADMIN' },
                { status: 400 }
            );
        }

        const user = await prisma.user.update({
            where: { email },
            data: { role },
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
            },
        });

        return NextResponse.json({
            message: `User ${email} role updated to ${role}`,
            user,
        });
    } catch (error: any) {
        console.error('Error updating user role:', error);

        if (error.code === 'P2025') {
            return NextResponse.json(
                { error: 'User not found' },
                { status: 404 }
            );
        }

        return NextResponse.json(
            { error: 'Failed to update user role' },
            { status: 500 }
        );
    }
}
