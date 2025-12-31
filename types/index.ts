import { TransactionType } from '@prisma/client';

export interface Transaction {
    id: string;
    date: Date | string;
    category: string;
    amount: number | string;
    type: TransactionType;
    description: string | null;
    userId: string;
    createdAt: Date | string;
    updatedAt: Date | string;
}

export interface TransactionFormData {
    date: string;
    category: string;
    amount: number | string;
    type: TransactionType;
    description?: string;
}

export interface MonthlyReport {
    year: number;
    month: number;
    totalIncome: number;
    totalExpense: number;
    balance: number;
    previousMonthIncome?: number;
    previousMonthExpense?: number;
    previousMonthBalance?: number;
    incomeChange?: number;
    expenseChange?: number;
    balanceChange?: number;
    transactions: Transaction[];
    incomeByCategory: CategorySummary[];
    expenseByCategory: CategorySummary[];
    analysis: string;
    recommendations: string[];
    chartData: ChartData;
}

export interface YearlyReport {
    year: number;
    totalIncome: number;
    totalExpense: number;
    balance: number;
    averageMonthlyIncome: number;
    averageMonthlyExpense: number;
    previousYearIncome?: number;
    previousYearExpense?: number;
    previousYearBalance?: number;
    incomeChange?: number;
    expenseChange?: number;
    balanceChange?: number;
    monthlyData: MonthlyData[];
    incomeByCategory: CategorySummary[];
    expenseByCategory: CategorySummary[];
    analysis: string;
    recommendations: string[];
    chartData: YearlyChartData;
}

export interface CategorySummary {
    category: string;
    amount: number;
    percentage: number;
    count: number;
}

export interface MonthlyData {
    month: number;
    monthName: string;
    income: number;
    expense: number;
    balance: number;
}

export interface ChartData {
    labels: string[];
    income: number[];
    expense: number[];
}

export interface YearlyChartData {
    labels: string[];
    income: number[];
    expense: number[];
    balance: number[];
}

export interface DashboardStats {
    currentMonthIncome: number;
    currentMonthExpense: number;
    currentMonthBalance: number;
    previousMonthIncome: number;
    previousMonthExpense: number;
    previousMonthBalance: number;
    incomeChange: number;
    expenseChange: number;
    balanceChange: number;
    ytdIncome: number;
    ytdExpense: number;
    ytdBalance: number;
}
