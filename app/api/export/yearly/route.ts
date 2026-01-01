import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { YearlyReportService } from '@/lib/reports/yearly';
import { ExcelExportService } from '@/lib/excel/exporter';

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

        // Generate report
        const report = await YearlyReportService.generateYearlyReport(
            session.user.id,
            year
        );

        // Export to Excel
        const buffer = await ExcelExportService.exportYearlyReport(report);

        const filename = `Laporan_Keuangan_Tahunan_${year}.xlsx`;

        return new NextResponse(new Uint8Array(buffer), {
            headers: {
                'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                'Content-Disposition': `attachment; filename="${filename}"`,
            },
        });
    } catch (error) {
        console.error('Error exporting yearly report:', error);
        return NextResponse.json(
            { error: 'Failed to export yearly report' },
            { status: 500 }
        );
    }
}
