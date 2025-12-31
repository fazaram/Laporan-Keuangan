import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { MonthlyReportService } from '@/lib/reports/monthly';

export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || !session.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const year = parseInt(searchParams.get('year') || new Date().getFullYear().toString());
        const month = parseInt(searchParams.get('month') || (new Date().getMonth() + 1).toString());

        if (!year || !month || month < 1 || month > 12) {
            return NextResponse.json(
                { error: 'Invalid year or month' },
                { status: 400 }
            );
        }

        // VIEWER sees all users' data (pass null for userId)
        // USER and ADMIN see only their own data
        const userId = session.user.role === 'VIEWER' ? null : session.user.id;

        const report = await MonthlyReportService.generateMonthlyReport(
            userId,
            year,
            month
        );

        return NextResponse.json({ report });
    } catch (error) {
        console.error('Error generating monthly report:', error);
        return NextResponse.json(
            { error: 'Failed to generate monthly report' },
            { status: 500 }
        );
    }
}
