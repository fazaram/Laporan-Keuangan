import { prisma } from '@/lib/db';
import { TransactionType } from '@prisma/client';
import { FinancialAnalyzer } from '../analysis/analyzer';
import { YearlyReport, CategorySummary, MonthlyData } from '@/types';
import { getMonthName } from '@/lib/utils';

export class YearlyReportService {
    /**
     * Generate complete yearly report with deep analysis
     */
    static async generateYearlyReport(userId: string | null, year: number): Promise<YearlyReport> {
        // Get all transactions for the year
        const startDate = new Date(year, 0, 1);
        const endDate = new Date(year, 11, 31, 23, 59, 59);

        // Build where clause - if userId is null (VIEWER), show all users' data
        const where: any = {
            date: {
                gte: startDate,
                lte: endDate,
            },
        };

        if (userId !== null) {
            where.userId = userId;
        }

        const transactions = await prisma.transaction.findMany({
            where,
            orderBy: { date: 'asc' },
        });

        // Calculate yearly totals
        const totalIncome = transactions
            .filter((t) => t.type === TransactionType.INCOME)
            .reduce((sum, t) => sum + Number(t.amount), 0);

        const totalExpense = transactions
            .filter((t) => t.type === TransactionType.EXPENSE)
            .reduce((sum, t) => sum + Number(t.amount), 0);

        const balance = totalIncome - totalExpense;
        const averageMonthlyIncome = totalIncome / 12;
        const averageMonthlyExpense = totalExpense / 12;

        // Get previous year data
        // Build where clause for previous year
        const prevWhere: any = {
            date: {
                gte: new Date(year - 1, 0, 1),
                lte: new Date(year - 1, 11, 31, 23, 59, 59),
            },
        };

        if (userId !== null) {
            prevWhere.userId = userId;
        }

        const prevYearTransactions = await prisma.transaction.findMany({
            where: prevWhere,
        });

        const previousYearIncome = prevYearTransactions
            .filter((t) => t.type === TransactionType.INCOME)
            .reduce((sum, t) => sum + Number(t.amount), 0);

        const previousYearExpense = prevYearTransactions
            .filter((t) => t.type === TransactionType.EXPENSE)
            .reduce((sum, t) => sum + Number(t.amount), 0);

        const previousYearBalance = previousYearIncome - previousYearExpense;

        // Calculate YoY changes
        const incomeChange =
            previousYearIncome > 0
                ? ((totalIncome - previousYearIncome) / previousYearIncome) * 100
                : 0;
        const expenseChange =
            previousYearExpense > 0
                ? ((totalExpense - previousYearExpense) / previousYearExpense) * 100
                : 0;
        const balanceChange =
            previousYearBalance !== 0
                ? ((balance - previousYearBalance) / Math.abs(previousYearBalance)) * 100
                : 0;

        // Calculate monthly data
        const monthlyData: MonthlyData[] = Array.from({ length: 12 }, (_, i) => {
            const month = i + 1;
            const monthTransactions = transactions.filter(
                (t) => new Date(t.date).getMonth() + 1 === month
            );

            const monthIncome = monthTransactions
                .filter((t) => t.type === TransactionType.INCOME)
                .reduce((sum, t) => sum + Number(t.amount), 0);

            const monthExpense = monthTransactions
                .filter((t) => t.type === TransactionType.EXPENSE)
                .reduce((sum, t) => sum + Number(t.amount), 0);

            return {
                month,
                monthName: getMonthName(month),
                income: monthIncome,
                expense: monthExpense,
                balance: monthIncome - monthExpense,
            };
        });

        // Calculate category summaries
        const incomeByCategory = this.calculateCategoryBreakdown(
            transactions.filter((t) => t.type === TransactionType.INCOME),
            totalIncome
        );

        const expenseByCategory = this.calculateCategoryBreakdown(
            transactions.filter((t) => t.type === TransactionType.EXPENSE),
            totalExpense
        );

        // Generate analysis
        const analysisData = {
            totalIncome,
            totalExpense,
            balance,
            previousIncome: previousYearIncome,
            previousExpense: previousYearExpense,
            previousBalance: previousYearBalance,
            monthlyData,
            incomeByCategory,
            expenseByCategory,
        };

        const analysis = FinancialAnalyzer.generateYearlyAnalysis(analysisData, year);
        const recommendations = FinancialAnalyzer.generateYearlyRecommendations(analysisData);

        // Prepare chart data
        const chartData = {
            labels: monthlyData.map((m) => m.monthName),
            income: monthlyData.map((m) => m.income),
            expense: monthlyData.map((m) => m.expense),
            balance: monthlyData.map((m) => m.balance),
        };

        return {
            year,
            totalIncome,
            totalExpense,
            balance,
            averageMonthlyIncome,
            averageMonthlyExpense,
            previousYearIncome,
            previousYearExpense,
            previousYearBalance,
            incomeChange,
            expenseChange,
            balanceChange,
            monthlyData,
            incomeByCategory,
            expenseByCategory,
            analysis,
            recommendations,
            chartData,
        };
    }

    /**
     * Calculate category breakdown
     */
    private static calculateCategoryBreakdown(
        transactions: any[],
        total: number
    ): CategorySummary[] {
        const categoryMap = new Map<string, { amount: number; count: number }>();

        transactions.forEach((t) => {
            const existing = categoryMap.get(t.category) || { amount: 0, count: 0 };
            categoryMap.set(t.category, {
                amount: existing.amount + Number(t.amount),
                count: existing.count + 1,
            });
        });

        const categories: CategorySummary[] = Array.from(categoryMap.entries())
            .map(([category, data]) => ({
                category,
                amount: data.amount,
                percentage: total > 0 ? (data.amount / total) * 100 : 0,
                count: data.count,
            }))
            .sort((a, b) => b.amount - a.amount);

        return categories;
    }
}
