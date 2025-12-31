import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { MonthlyReportService } from '@/lib/reports/monthly';
import { ExcelExportService } from '@/lib/excel/exporter';

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

        // Generate report
        const report = await MonthlyReportService.generateMonthlyReport(
            session.user.id,
            year,
            month
        );

        // Export to Excel
        const buffer = await ExcelExportService.exportMonthlyReport(report);

        const monthNames = [
            'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
            'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
        ];
        const filename = `Laporan_Keuangan_${monthNames[month - 1]}_${year}.xlsx`;

        return new NextResponse(new Uint8Array(buffer), {
            headers: {
                'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                'Content-Disposition': `attachment; filename="${filename}"`,
            },
        });
    } catch (error) {
        console.error('Error exporting monthly report:', error);
        return NextResponse.json(
            { error: 'Failed to export monthly report' },
            { status: 500 }
        );
    }
}
