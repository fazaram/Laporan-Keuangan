import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { Navbar } from '@/components/Navbar';
import { KPICard } from '@/components/KPICard';
import { prisma } from '@/lib/db';
import { TransactionType } from '@prisma/client';
import { formatCurrency, getCurrentMonth, getCurrentYear } from '@/lib/utils';
import Link from 'next/link';
import nextDynamic from 'next/dynamic';
import { syncFixedIncomeTransactions } from '@/app/actions/fixed-income-sync';

export const dynamic = 'force-dynamic';

// Lazy load heavy client components — tidak block first paint
const AiInsightCard = nextDynamic(
    () => import('@/components/AiInsightCard').then((m) => ({ default: m.AiInsightCard })),
    {
        ssr: false,
        loading: () => (
            <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6 animate-pulse">
                <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
                <div className="space-y-3">
                    <div className="h-4 bg-gray-100 rounded w-full"></div>
                    <div className="h-4 bg-gray-100 rounded w-5/6"></div>
                    <div className="h-4 bg-gray-100 rounded w-4/6"></div>
                </div>
            </div>
        ),
    }
);

const DashboardCharts = nextDynamic(
    () => import('@/components/DashboardCharts').then((m) => ({ default: m.DashboardCharts })),
    {
        ssr: false,
        loading: () => (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                <div className="bg-white p-6 rounded-2xl shadow-md border border-gray-100 h-[400px] animate-pulse">
                    <div className="h-6 bg-gray-200 rounded w-1/2 mb-6"></div>
                    <div className="h-full bg-gray-100 rounded-xl"></div>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-md border border-gray-100 h-[400px] animate-pulse">
                    <div className="h-6 bg-gray-200 rounded w-1/2 mb-6"></div>
                    <div className="h-full bg-gray-100 rounded-xl"></div>
                </div>
            </div>
        ),
    }
);

export default async function DashboardPage() {
    const session = await getServerSession(authOptions);

    if (!session) {
        redirect('/login');
    }

    // Sync fixed income transactions every time dashboard is loaded
    await syncFixedIncomeTransactions(session.user.id);

    // Get current month data
    const currentYear = getCurrentYear();
    const currentMonth = getCurrentMonth();
    const startDate = new Date(currentYear, currentMonth - 1, 1);
    const endDate = new Date(currentYear, currentMonth, 0, 23, 59, 59);

    // Get previous month dates
    const prevMonth = currentMonth === 1 ? 12 : currentMonth - 1;
    const prevYear = currentMonth === 1 ? currentYear - 1 : currentYear;
    const prevStartDate = new Date(prevYear, prevMonth - 1, 1);
    const prevEndDate = new Date(prevYear, prevMonth, 0, 23, 59, 59);

    const isViewer = session.user.role === 'VIEWER';
    const userId = session.user.id;

    // ✅ Run ALL database queries in parallel — 4x faster than sequential
    const [transactionsRaw, prevTransactions, allTransactions, topGoalsRaw] = await Promise.all([
        // Query 1: Current month transactions (latest 10)
        prisma.transaction.findMany({
            where: {
                date: { gte: startDate, lte: endDate },
                ...(!isViewer && { userId }),
            },
            orderBy: { date: 'desc' },
            take: 10,
        }),
        // Query 2: Previous month transactions (for comparison)
        prisma.transaction.findMany({
            where: {
                date: { gte: prevStartDate, lte: prevEndDate },
                ...(!isViewer && { userId }),
            },
        }),
        // Query 3: All-time transactions (for total balance)
        prisma.transaction.findMany({
            where: isViewer ? {} : { userId },
        }),
        // Query 4: Top active goals
        (prisma as any).goal.findMany({
            where: isViewer
                ? { status: 'ACTIVE' }
                : { userId, status: 'ACTIVE' },
            orderBy: { targetAmount: 'desc' },
            take: 3,
        }),
    ]);

    // Serialize transactions (convert Date & Decimal to plain JS types)
    const transactions = transactionsRaw.map((t: any) => ({
        ...t,
        amount: Number(t.amount),
        date: t.date.toISOString(),
    }));

    const topGoals = topGoalsRaw.map((g: any) => ({
        ...g,
        targetAmount: Number(g.targetAmount),
        currentAmount: Number(g.currentAmount),
    }));

    // Calculate KPI values
    const currentIncome = transactions
        .filter((t) => t.type === TransactionType.INCOME)
        .reduce((sum, t) => sum + Number(t.amount), 0);

    const currentExpense = transactions
        .filter((t) => t.type === TransactionType.EXPENSE)
        .reduce((sum, t) => sum + Number(t.amount), 0);

    const prevIncome = prevTransactions
        .filter((t: any) => t.type === TransactionType.INCOME)
        .reduce((sum: number, t: any) => sum + Number(t.amount), 0);

    const prevExpense = prevTransactions
        .filter((t: any) => t.type === TransactionType.EXPENSE)
        .reduce((sum: number, t: any) => sum + Number(t.amount), 0);

    const incomeChange = prevIncome > 0 ? ((currentIncome - prevIncome) / prevIncome) * 100 : 0;
    const expenseChange = prevExpense > 0 ? ((currentExpense - prevExpense) / prevExpense) * 100 : 0;

    const totalIncomeAllTime = allTransactions
        .filter((t) => t.type === TransactionType.INCOME)
        .reduce((sum, t) => sum + Number(t.amount), 0);

    const totalExpenseAllTime = allTransactions
        .filter((t) => t.type === TransactionType.EXPENSE)
        .reduce((sum, t) => sum + Number(t.amount), 0);

    const totalSaldo = totalIncomeAllTime - totalExpenseAllTime;

    return (
        <div className="min-h-screen bg-gray-50">
            <Navbar />

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h1>
                    <p className="text-gray-600">Ringkasan keuangan bulan ini</p>
                </div>

                {/* KPI Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <KPICard
                        title="Total Pemasukan"
                        value={formatCurrency(currentIncome)}
                        change={incomeChange}
                        changeLabel="vs bulan lalu"
                        trend={incomeChange > 0 ? 'up' : incomeChange < 0 ? 'down' : 'neutral'}
                        icon={
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        }
                    />

                    <KPICard
                        title="Total Pengeluaran"
                        value={formatCurrency(currentExpense)}
                        change={expenseChange}
                        changeLabel="vs bulan lalu"
                        trend={expenseChange < 0 ? 'up' : expenseChange > 0 ? 'down' : 'neutral'}
                        icon={
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                            </svg>
                        }
                    />

                    <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-xl p-6 text-white shadow-lg relative overflow-hidden">
                        <div className="absolute right-0 top-0 opacity-10">
                            <svg className="w-32 h-32 transform translate-x-8 -translate-y-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <div className="relative z-10">
                            <h3 className="text-blue-100 font-medium mb-1">Total Saldo (Keseluruhan)</h3>
                            <p className="text-3xl font-bold mb-4">{formatCurrency(totalSaldo)}</p>
                            <div className="text-sm text-blue-200">
                                Sisa tabungan dari keseluruhan transaksi
                            </div>
                        </div>
                    </div>
                </div>

                {/* AI Insight Section — lazy loaded */}
                <div className="mb-8">
                    <AiInsightCard />
                </div>

                {/* Charts Section — lazy loaded */}
                <DashboardCharts
                    income={currentIncome}
                    expense={currentExpense}
                    transactions={transactions}
                />

                {/* Quick Actions */}
                <div className={`grid grid-cols-1 ${session.user.role !== 'VIEWER' ? 'md:grid-cols-2' : ''} gap-6 mb-8`}>
                    {session.user.role !== 'VIEWER' && (
                        <Link
                            href="/transactions"
                            className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-all group"
                        >
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="text-xl font-bold mb-2">Tambah Transaksi</h3>
                                    <p className="text-blue-100">Catat pemasukan atau pengeluaran baru</p>
                                </div>
                                <svg className="w-8 h-8 group-hover:translate-x-2 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                </svg>
                            </div>
                        </Link>
                    )}

                    <Link
                        href="/reports/monthly"
                        className="bg-white border-2 border-gray-200 rounded-xl p-6 shadow-md hover:shadow-lg transition-all group"
                    >
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-xl font-bold text-gray-900 mb-2">Lihat Laporan</h3>
                                <p className="text-gray-600">Analisis keuangan bulanan &amp; tahunan</p>
                            </div>
                            <svg className="w-8 h-8 text-blue-600 group-hover:translate-x-2 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                            </svg>
                        </div>
                    </Link>
                </div>

                {/* Recent Transactions */}
                <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl font-bold text-gray-900">Transaksi Terbaru</h2>
                        <Link href="/transactions" className="text-blue-600 hover:text-blue-700 font-medium text-sm">
                            Lihat Semua →
                        </Link>
                    </div>

                    <div className="space-y-3">
                        {transactions.length === 0 ? (
                            <p className="text-gray-500 text-center py-8">Belum ada transaksi bulan ini</p>
                        ) : (
                            transactions.map((tx: any) => (
                                <div key={tx.id} className="flex items-center justify-between p-4 hover:bg-gray-50 rounded-lg transition-colors">
                                    <div className="flex items-center gap-4">
                                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${tx.type === TransactionType.INCOME ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                                            }`}>
                                            {tx.type === TransactionType.INCOME ? '↓' : '↑'}
                                        </div>
                                        <div>
                                            <p className="font-medium text-gray-900">{tx.category}</p>
                                            <p className="text-sm text-gray-500">
                                                {new Date(tx.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                                            </p>
                                        </div>
                                    </div>
                                    <div className={`text-right ${tx.type === TransactionType.INCOME ? 'text-green-600' : 'text-red-600'}`}>
                                        <p className="font-bold">
                                            {tx.type === TransactionType.INCOME ? '+' : '-'} {formatCurrency(Number(tx.amount))}
                                        </p>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Top Goals Section */}
                <div className="mt-8 bg-white rounded-xl shadow-md border border-gray-100 p-6">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h2 className="text-xl font-bold text-gray-900">Top Goals (Tabungan)</h2>
                            <p className="text-gray-500 text-sm mt-1">Target tabungan terbesar Anda</p>
                        </div>
                        <Link href="/goals" className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-700 font-medium text-sm bg-blue-50 px-4 py-2 rounded-lg transition-colors">
                            Lihat Semua
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                        </Link>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {topGoals.length === 0 ? (
                            <div className="col-span-full text-center py-8 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                                <p className="text-gray-500 mb-2">Belum ada Tabungan/Goals</p>
                                <Link href="/goals" className="text-blue-600 font-medium hover:underline">
                                    Buat Target Tabungan Baru
                                </Link>
                            </div>
                        ) : (
                            topGoals.map((goal: any) => {
                                const progress = Math.min(100, Math.round((goal.currentAmount / goal.targetAmount) * 100));
                                return (
                                    <div key={goal.id} className="border border-gray-200 rounded-xl p-5 hover:shadow-md transition-shadow">
                                        <div className="flex justify-between items-start mb-4">
                                            <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                                                </svg>
                                            </div>
                                            <span className="text-xs font-bold text-gray-500 bg-gray-100 px-2 py-1 rounded-full uppercase">
                                                {goal.priority}
                                            </span>
                                        </div>
                                        <h3 className="font-bold text-gray-900 mb-1">{goal.name}</h3>
                                        <div className="text-xs text-gray-500 mb-4 truncate">Target: {formatCurrency(goal.targetAmount)}</div>

                                        <div className="mb-2 flex justify-between items-end">
                                            <span className="font-semibold text-blue-600">{formatCurrency(goal.currentAmount)}</span>
                                            <span className="text-xs font-medium text-gray-500">{progress}%</span>
                                        </div>

                                        <div className="w-full bg-gray-100 rounded-full h-2">
                                            <div
                                                className={`h-2 rounded-full transition-all duration-500 ${progress === 100 ? 'bg-green-500' : 'bg-blue-600'}`}
                                                style={{ width: `${progress}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}
