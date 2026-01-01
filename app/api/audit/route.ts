import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { AuditLogger } from '@/lib/audit/logger';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || !session.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Check if user is VIEWER or ADMIN
        if (session.user.role !== 'VIEWER' && session.user.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Forbidden: Audit log access restricted' }, { status: 403 });
        }

        const { searchParams } = new URL(request.url);
        const action = searchParams.get('action') as 'CREATE' | 'UPDATE' | 'DELETE' | null;
        const entityType = searchParams.get('entityType');
        const startDate = searchParams.get('startDate');
        const endDate = searchParams.get('endDate');
        const limit = parseInt(searchParams.get('limit') || '50');
        const offset = parseInt(searchParams.get('offset') || '0');

        const filters: any = {
            limit,
            offset,
        };

        // VIEWER and ADMIN can see all audit logs
        // Regular USER would be restricted (but currently audit is VIEWER+ADMIN only)
        if (session.user.role !== 'VIEWER' && session.user.role !== 'ADMIN') {
            filters.userId = session.user.id;
        }

        if (action) filters.action = action;
        if (entityType) filters.entityType = entityType;
        if (startDate) filters.startDate = new Date(startDate);
        if (endDate) filters.endDate = new Date(endDate);

        const { logs, total } = await AuditLogger.getLogs(filters);

        return NextResponse.json({
            logs,
            total,
            limit,
            offset,
        });
    } catch (error) {
        console.error('Error fetching audit logs:', error);
        return NextResponse.json(
            { error: 'Failed to fetch audit logs' },
            { status: 500 }
        );
    }
}
