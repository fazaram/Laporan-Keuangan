import { prisma } from '@/lib/db';
import { TransactionType } from '@prisma/client';
import { FinancialAnalyzer } from '../analysis/analyzer';
import { MonthlyReport, CategorySummary } from '@/types';
import { getMonthName } from '@/lib/utils';

export class MonthlyReportService {
    /**
     * Generate complete monthly report with analysis
     */
    static async generateMonthlyReport(
        userId: string | null,
        year: number,
        month: number
    ): Promise<MonthlyReport> {
        // Get all transactions for the month
        const startDate = new Date(year, month - 1, 1);
        const endDate = new Date(year, month, 0, 23, 59, 59);

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

        // Calculate totals
        const totalIncome = transactions
            .filter((t) => t.type === TransactionType.INCOME)
            .reduce((sum, t) => sum + Number(t.amount), 0);

        const totalExpense = transactions
            .filter((t) => t.type === TransactionType.EXPENSE)
            .reduce((sum, t) => sum + Number(t.amount), 0);

        const balance = totalIncome - totalExpense;

        // Get previous month data for comparison
        const previousMonth = month === 1 ? 12 : month - 1;
        const previousYear = month === 1 ? year - 1 : year;
        const prevStartDate = new Date(previousYear, previousMonth - 1, 1);
        const prevEndDate = new Date(previousYear, previousMonth, 0, 23, 59, 59);

        // Build where clause for previous month
        const prevWhere: any = {
            date: {
                gte: prevStartDate,
                lte: prevEndDate,
            },
        };

        if (userId !== null) {
            prevWhere.userId = userId;
        }

        const previousTransactions = await prisma.transaction.findMany({
            where: prevWhere,
        });

        const previousMonthIncome = previousTransactions
            .filter((t) => t.type === TransactionType.INCOME)
            .reduce((sum, t) => sum + Number(t.amount), 0);

        const previousMonthExpense = previousTransactions
            .filter((t) => t.type === TransactionType.EXPENSE)
            .reduce((sum, t) => sum + Number(t.amount), 0);

        const previousMonthBalance = previousMonthIncome - previousMonthExpense;

        // Calculate changes
        const incomeChange =
            previousMonthIncome > 0
                ? ((totalIncome - previousMonthIncome) / previousMonthIncome) * 100
                : 0;
        const expenseChange =
            previousMonthExpense > 0
                ? ((totalExpense - previousMonthExpense) / previousMonthExpense) * 100
                : 0;
        const balanceChange =
            previousMonthBalance !== 0
                ? ((balance - previousMonthBalance) / Math.abs(previousMonthBalance)) * 100
                : 0;

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
            previousIncome: previousMonthIncome,
            previousExpense: previousMonthExpense,
            previousBalance: previousMonthBalance,
            incomeByCategory,
            expenseByCategory,
        };

        const analysis = FinancialAnalyzer.generateMonthlyAnalysis(analysisData, month, year);
        const recommendations = FinancialAnalyzer.generateMonthlyRecommendations(analysisData);

        // Prepare chart data
        const daysInMonth = new Date(year, month, 0).getDate();
        const dailyData = Array.from({ length: daysInMonth }, (_, i) => {
            const day = i + 1;
            const dayTransactions = transactions.filter(
                (t) => new Date(t.date).getDate() === day
            );

            const dayIncome = dayTransactions
                .filter((t) => t.type === TransactionType.INCOME)
                .reduce((sum, t) => sum + Number(t.amount), 0);

            const dayExpense = dayTransactions
                .filter((t) => t.type === TransactionType.EXPENSE)
                .reduce((sum, t) => sum + Number(t.amount), 0);

            return {
                day,
                income: dayIncome,
                expense: dayExpense,
            };
        });

        const chartData = {
            labels: dailyData.map((d) => d.day.toString()),
            income: dailyData.map((d) => d.income),
            expense: dailyData.map((d) => d.expense),
        };

        return {
            year,
            month,
            totalIncome,
            totalExpense,
            balance,
            previousMonthIncome,
            previousMonthExpense,
            previousMonthBalance,
            incomeChange,
            expenseChange,
            balanceChange,
            transactions: transactions.map((t) => ({
                ...t,
                amount: Number(t.amount),
            })) as any,
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
