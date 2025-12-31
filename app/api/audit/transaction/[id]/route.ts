import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
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

        // Check if user is VIEWER or ADMIN
        if (session.user.role !== 'VIEWER' && session.user.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Forbidden: Audit log access restricted' }, { status: 403 });
        }

        const params = await context.params;
        const logs = await AuditLogger.getEntityLogs('Transaction', params.id);

        return NextResponse.json({ logs });
    } catch (error) {
        console.error('Error fetching transaction audit logs:', error);
        return NextResponse.json(
            { error: 'Failed to fetch transaction audit logs' },
            { status: 500 }
        );
    }
}
