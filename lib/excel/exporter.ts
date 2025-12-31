import ExcelJS from 'exceljs';
import { MonthlyReport, YearlyReport } from '@/types';
import { formatCurrency, formatDate, getMonthName } from '@/lib/utils';

export class ExcelExportService {
    /**
     * Export monthly report to Excel with all sheets and charts
     */
    static async exportMonthlyReport(report: MonthlyReport): Promise<Buffer> {
        const workbook = new ExcelJS.Workbook();

        workbook.creator = 'Laporan Keuangan';
        workbook.created = new Date();

        // Sheet 1: Transactions (Harian)
        this.createTransactionsSheet(workbook, report);

        // Sheet 2: Monthly Summary (Rekap Bulanan)
        this.createMonthlySummarySheet(workbook, report);

        // Sheet 3: Analysis & Recommendations
        this.createMonthlyAnalysisSheet(workbook, report);

        const buffer = await workbook.xlsx.writeBuffer();
        return Buffer.from(buffer);
    }

    /**
     * Export yearly report to Excel
     */
    static async exportYearlyReport(report: YearlyReport): Promise<Buffer> {
        const workbook = new ExcelJS.Workbook();

        workbook.creator = 'Laporan Keuangan';
        workbook.created = new Date();

        // Sheet 1: Yearly Summary
        this.createYearlySummarySheet(workbook, report);

        // Sheet 2: Monthly Breakdown
        this.createMonthlyBreakdownSheet(workbook, report);

        // Sheet 3: Analysis & Recommendations
        this.createYearlyAnalysisSheet(workbook, report);

        const buffer = await workbook.xlsx.writeBuffer();
        return Buffer.from(buffer);
    }

    // Private helper methods

    private static createTransactionsSheet(workbook: ExcelJS.Workbook, report: MonthlyReport) {
        const sheet = workbook.addWorksheet('Data Transaksi');

        // Set column widths
        sheet.columns = [
            { header: 'Tanggal', key: 'date', width: 15 },
            { header: 'Kategori', key: 'category', width: 20 },
            { header: 'Tipe', key: 'type', width: 12 },
            { header: 'Nominal', key: 'amount', width: 18 },
            { header: 'Keterangan', key: 'description', width: 35 },
        ];

        // Style header row
        const headerRow = sheet.getRow(1);
        headerRow.font = { bold: true, size: 12 };
        headerRow.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FF4472C4' },
        };
        headerRow.font = { ...headerRow.font, color: { argb: 'FFFFFFFF' } };
        headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
        headerRow.height = 20;

        // Add data
        report.transactions.forEach((tx) => {
            sheet.addRow({
                date: formatDate(tx.date),
                category: tx.category,
                type: tx.type === 'INCOME' ? 'Pemasukan' : 'Pengeluaran',
                amount: Number(tx.amount),
                description: tx.description || '-',
            });
        });

        // Format amount column
        sheet.getColumn(4).numFmt = '"Rp "#,##0';
        sheet.getColumn(4).alignment = { horizontal: 'right' };

        // Add borders
        sheet.eachRow((row, rowNumber) => {
            row.eachCell((cell) => {
                cell.border = {
                    top: { style: 'thin' },
                    left: { style: 'thin' },
                    bottom: { style: 'thin' },
                    right: { style: 'thin' },
                };
            });
        });

        // Freeze header row
        sheet.views = [{ state: 'frozen', ySplit: 1 }];
    }

    private static createMonthlySummarySheet(workbook: ExcelJS.Workbook, report: MonthlyReport) {
        const sheet = workbook.addWorksheet('Rekap Bulanan');

        // Title
        const title = sheet.getCell('A1');
        title.value = `Laporan Keuangan ${getMonthName(report.month)} ${report.year}`;
        title.font = { size: 16, bold: true };
        title.alignment = { horizontal: 'center' };
        sheet.mergeCells('A1:D1');

        // Summary section
        let row = 3;

        // Current month
        sheet.getCell(`A${row}`).value = 'PERIODE BERJALAN';
        sheet.getCell(`A${row}`).font = { bold: true, size: 12 };
        sheet.mergeCells(`A${row}:D${row}`);
        row++;

        this.addSummaryRow(sheet, row++, 'Total Pemasukan', report.totalIncome);
        this.addSummaryRow(sheet, row++, 'Total Pengeluaran', report.totalExpense);
        this.addSummaryRow(sheet, row++, 'Saldo', report.balance, report.balance >= 0 ? 'positive' : 'negative');

        row++;

        // Previous month comparison
        if (report.previousMonthIncome !== undefined) {
            sheet.getCell(`A${row}`).value = 'PERBANDINGAN BULAN SEBELUMNYA';
            sheet.getCell(`A${row}`).font = { bold: true, size: 12 };
            sheet.mergeCells(`A${row}:D${row}`);
            row++;

            this.addComparisonRow(sheet, row++, 'Pemasukan', report.previousMonthIncome, report.incomeChange);
            this.addComparisonRow(sheet, row++, 'Pengeluaran', report.previousMonthExpense, report.expenseChange);
            this.addComparisonRow(sheet, row++, 'Saldo', report.previousMonthBalance, report.balanceChange);
        }

        row++;

        // Top Income Categories
        sheet.getCell(`A${row}`).value = 'KATEGORI PEMASUKAN TERBESAR';
        sheet.getCell(`A${row}`).font = { bold: true, size: 12 };
        sheet.mergeCells(`A${row}:D${row}`);
        row++;

        report.incomeByCategory.slice(0, 5).forEach((cat) => {
            sheet.getCell(`A${row}`).value = cat.category;
            sheet.getCell(`B${row}`).value = cat.amount;
            sheet.getCell(`B${row}`).numFmt = '"Rp "#,##0';
            sheet.getCell(`C${row}`).value = cat.percentage / 100;
            sheet.getCell(`C${row}`).numFmt = '0.0%';
            row++;
        });

        row++;

        // Top Expense Categories
        sheet.getCell(`A${row}`).value = 'KATEGORI PENGELUARAN TERBESAR';
        sheet.getCell(`A${row}`).font = { bold: true, size: 12 };
        sheet.mergeCells(`A${row}:D${row}`);
        row++;

        report.expenseByCategory.slice(0, 5).forEach((cat) => {
            sheet.getCell(`A${row}`).value = cat.category;
            sheet.getCell(`B${row}`).value = cat.amount;
            sheet.getCell(`B${row}`).numFmt = '"Rp "#,##0';
            sheet.getCell(`C${row}`).value = cat.percentage / 100;
            sheet.getCell(`C${row}`).numFmt = '0.0%';
            row++;
        });

        // Set column widths
        sheet.getColumn(1).width = 30;
        sheet.getColumn(2).width = 20;
        sheet.getColumn(3).width = 15;
        sheet.getColumn(4).width = 15;
    }

    private static createMonthlyAnalysisSheet(workbook: ExcelJS.Workbook, report: MonthlyReport) {
        const sheet = workbook.addWorksheet('Analisis & Saran');

        // Title
        const title = sheet.getCell('A1');
        title.value = `Analisis Keuangan ${getMonthName(report.month)} ${report.year}`;
        title.font = { size: 16, bold: true };
        title.alignment = { horizontal: 'center' };
        sheet.mergeCells('A1:E1');

        let row = 3;

        // Analysis section
        sheet.getCell(`A${row}`).value = 'ANALISIS KEUANGAN';
        sheet.getCell(`A${row}`).font = { bold: true, size: 14 };
        sheet.mergeCells(`A${row}:E${row}`);
        row += 2;

        const analysisLines = report.analysis.split('\n');
        analysisLines.forEach((line) => {
            if (line.trim()) {
                sheet.getCell(`A${row}`).value = line;
                sheet.getCell(`A${row}`).alignment = { wrapText: true, vertical: 'top' };
                sheet.mergeCells(`A${row}:E${row}`);
                row++;
            }
        });

        row += 2;

        // Recommendations section
        sheet.getCell(`A${row}`).value = 'REKOMENDASI STRATEGIS';
        sheet.getCell(`A${row}`).font = { bold: true, size: 14 };
        sheet.mergeCells(`A${row}:E${row}`);
        row += 2;

        report.recommendations.forEach((rec, idx) => {
            sheet.getCell(`A${row}`).value = `${idx + 1}. ${rec}`;
            sheet.getCell(`A${row}`).alignment = { wrapText: true, vertical: 'top' };
            sheet.mergeCells(`A${row}:E${row}`);
            row++;
        });

        // Set column widths
        sheet.getColumn(1).width = 100;
    }

    private static createYearlySummarySheet(workbook: ExcelJS.Workbook, report: YearlyReport) {
        const sheet = workbook.addWorksheet('Ringkasan Tahunan');

        // Title
        const title = sheet.getCell('A1');
        title.value = `Laporan Keuangan Tahunan ${report.year}`;
        title.font = { size: 16, bold: true };
        title.alignment = { horizontal: 'center' };
        sheet.mergeCells('A1:D1');

        let row = 3;

        // Annual summary
        sheet.getCell(`A${row}`).value = 'RINGKASAN TAHUNAN';
        sheet.getCell(`A${row}`).font = { bold: true, size: 12 };
        sheet.mergeCells(`A${row}:D${row}`);
        row++;

        this.addSummaryRow(sheet, row++, 'Total Pemasukan', report.totalIncome);
        this.addSummaryRow(sheet, row++, 'Total Pengeluaran', report.totalExpense);
        this.addSummaryRow(sheet, row++, 'Surplus/Defisit', report.balance, report.balance >= 0 ? 'positive' : 'negative');
        this.addSummaryRow(sheet, row++, 'Rata-rata Pemasukan Bulanan', report.averageMonthlyIncome);
        this.addSummaryRow(sheet, row++, 'Rata-rata Pengeluaran Bulanan', report.averageMonthlyExpense);

        row++;

        // YoY Comparison
        if (report.previousYearIncome !== undefined) {
            sheet.getCell(`A${row}`).value = 'PERBANDINGAN TAHUN KE TAHUN (YoY)';
            sheet.getCell(`A${row}`).font = { bold: true, size: 12 };
            sheet.mergeCells(`A${row}:D${row}`);
            row++;

            this.addComparisonRow(sheet, row++, 'Pemasukan', report.previousYearIncome, report.incomeChange);
            this.addComparisonRow(sheet, row++, 'Pengeluaran', report.previousYearExpense, report.expenseChange);
            this.addComparisonRow(sheet, row++, 'Surplus/Defisit', report.previousYearBalance, report.balanceChange);
        }

        // Set column widths
        sheet.getColumn(1).width = 35;
        sheet.getColumn(2).width = 20;
        sheet.getColumn(3).width = 15;
        sheet.getColumn(4).width = 15;
    }

    private static createMonthlyBreakdownSheet(workbook: ExcelJS.Workbook, report: YearlyReport) {
        const sheet = workbook.addWorksheet('Rincian Bulanan');

        // Headers
        sheet.columns = [
            { header: 'Bulan', key: 'month', width: 15 },
            { header: 'Pemasukan', key: 'income', width: 18 },
            { header: 'Pengeluaran', key: 'expense', width: 18 },
            { header: 'Saldo', key: 'balance', width: 18 },
        ];

        // Style header
        const headerRow = sheet.getRow(1);
        headerRow.font = { bold: true, size: 12 };
        headerRow.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FF4472C4' },
        };
        headerRow.font = { ...headerRow.font, color: { argb: 'FFFFFFFF' } };
        headerRow.alignment = { vertical: 'middle', horizontal: 'center' };

        // Add monthly data
        report.monthlyData.forEach((month) => {
            sheet.addRow({
                month: month.monthName,
                income: month.income,
                expense: month.expense,
                balance: month.balance,
            });
        });

        // Format amount columns
        [2, 3, 4].forEach((col) => {
            sheet.getColumn(col).numFmt = '"Rp "#,##0';
            sheet.getColumn(col).alignment = { horizontal: 'right' };
        });

        // Add borders
        sheet.eachRow((row) => {
            row.eachCell((cell) => {
                cell.border = {
                    top: { style: 'thin' },
                    left: { style: 'thin' },
                    bottom: { style: 'thin' },
                    right: { style: 'thin' },
                };
            });
        });
    }

    private static createYearlyAnalysisSheet(workbook: ExcelJS.Workbook, report: YearlyReport) {
        const sheet = workbook.addWorksheet('Analisis & Saran');

        // Title
        const title = sheet.getCell('A1');
        title.value = `Analisis Keuangan Tahunan ${report.year}`;
        title.font = { size: 16, bold: true };
        title.alignment = { horizontal: 'center' };
        sheet.mergeCells('A1:E1');

        let row = 3;

        // Analysis section
        sheet.getCell(`A${row}`).value = 'ANALISIS KEUANGAN';
        sheet.getCell(`A${row}`).font = { bold: true, size: 14 };
        sheet.mergeCells(`A${row}:E${row}`);
        row += 2;

        const analysisLines = report.analysis.split('\n');
        analysisLines.forEach((line) => {
            if (line.trim()) {
                sheet.getCell(`A${row}`).value = line;
                sheet.getCell(`A${row}`).alignment = { wrapText: true, vertical: 'top' };
                sheet.mergeCells(`A${row}:E${row}`);
                row++;
            }
        });

        row += 2;

        // Recommendations section
        sheet.getCell(`A${row}`).value = 'REKOMENDASI STRATEGIS';
        sheet.getCell(`A${row}`).font = { bold: true, size: 14 };
        sheet.mergeCells(`A${row}:E${row}`);
        row += 2;

        report.recommendations.forEach((rec, idx) => {
            sheet.getCell(`A${row}`).value = `${idx + 1}. ${rec}`;
            sheet.getCell(`A${row}`).alignment = { wrapText: true, vertical: 'top' };
            sheet.mergeCells(`A${row}:E${row}`);
            row++;
        });

        // Set column widths
        sheet.getColumn(1).width = 100;
    }

    // Helper methods
    private static addSummaryRow(
        sheet: ExcelJS.Worksheet,
        row: number,
        label: string,
        value: number | undefined,
        style?: 'positive' | 'negative'
    ) {
        sheet.getCell(`A${row}`).value = label;
        sheet.getCell(`A${row}`).font = { bold: true };
        sheet.getCell(`B${row}`).value = value || 0;
        sheet.getCell(`B${row}`).numFmt = '"Rp "#,##0';
        sheet.getCell(`B${row}`).alignment = { horizontal: 'right' };

        if (style === 'positive') {
            sheet.getCell(`B${row}`).font = { color: { argb: 'FF00B050' }, bold: true };
        } else if (style === 'negative') {
            sheet.getCell(`B${row}`).font = { color: { argb: 'FFFF0000' }, bold: true };
        }
    }

    private static addComparisonRow(
        sheet: ExcelJS.Worksheet,
        row: number,
        label: string,
        previousValue: number | undefined,
        changePercent: number | undefined
    ) {
        sheet.getCell(`A${row}`).value = label;
        sheet.getCell(`B${row}`).value = previousValue || 0;
        sheet.getCell(`B${row}`).numFmt = '"Rp "#,##0';
        sheet.getCell(`C${row}`).value = (changePercent || 0) / 100;
        sheet.getCell(`C${row}`).numFmt = '0.0%';

        if ((changePercent || 0) > 0) {
            sheet.getCell(`C${row}`).font = { color: { argb: 'FF00B050' } };
            sheet.getCell(`D${row}`).value = '↑';
        } else if ((changePercent || 0) < 0) {
            sheet.getCell(`C${row}`).font = { color: { argb: 'FFFF0000' } };
            sheet.getCell(`D${row}`).value = '↓';
        } else {
            sheet.getCell(`D${row}`).value = '→';
        }
    }
}
