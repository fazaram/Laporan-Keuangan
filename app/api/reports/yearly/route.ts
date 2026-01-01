import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { YearlyReportService } from '@/lib/reports/yearly';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || !session.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const year = parseInt(searchParams.get('year') || new Date().getFullYear().toString());

        if (!year) {
            return NextResponse.json(
                { error: 'Invalid year' },
                { status: 400 }
            );
        }

        // VIEWER sees all users' data (pass null for userId)
        // USER and ADMIN see only their own data
        const userId = session.user.role === 'VIEWER' ? null : session.user.id;

        const report = await YearlyReportService.generateYearlyReport(
            userId,
            year
        );

        return NextResponse.json({ report });
    } catch (error) {
        console.error('Error generating yearly report:', error);
        return NextResponse.json(
            { error: 'Failed to generate yearly report' },
            { status: 500 }
        );
    }
}
