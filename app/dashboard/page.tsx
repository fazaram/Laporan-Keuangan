import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { Navbar } from '@/components/Navbar';
import { KPICard } from '@/components/KPICard';
import { prisma } from '@/lib/db';
import { TransactionType } from '@prisma/client';
import { formatCurrency, getCurrentMonth, getCurrentYear } from '@/lib/utils';
import Link from 'next/link';

export default async function DashboardPage() {
    const session = await getServerSession(authOptions);

    if (!session) {
        redirect('/login');
    }

    // Get current month data
    const currentYear = getCurrentYear();
    const currentMonth = getCurrentMonth();
    const startDate = new Date(currentYear, currentMonth - 1, 1);
    const endDate = new Date(currentYear, currentMonth, 0, 23, 59, 59);

    // VIEWER sees all users' data, USER/ADMIN see only their own
    const transactionFilter: any = {
        date: {
            gte: startDate,
            lte: endDate,
        },
    };

    if (session.user.role !== 'VIEWER') {
        transactionFilter.userId = session.user.id;
    }

    const transactions = await prisma.transaction.findMany({
        where: transactionFilter,
        orderBy: { date: 'desc' },
        take: 10,
    });

    const currentIncome = transactions
        .filter((t) => t.type === TransactionType.INCOME)
        .reduce((sum, t) => sum + Number(t.amount), 0);

    const currentExpense = transactions
        .filter((t) => t.type === TransactionType.EXPENSE)
        .reduce((sum, t) => sum + Number(t.amount), 0);

    const currentBalance = currentIncome - currentExpense;

    // Get previous month for comparison
    const prevMonth = currentMonth === 1 ? 12 : currentMonth - 1;
    const prevYear = currentMonth === 1 ? currentYear - 1 : currentYear;
    const prevStartDate = new Date(prevYear, prevMonth - 1, 1);
    const prevEndDate = new Date(prevYear, prevMonth, 0, 23, 59, 59);

    const prevTransactionFilter: any = {
        date: {
            gte: prevStartDate,
            lte: prevEndDate,
        },
    };

    if (session.user.role !== 'VIEWER') {
        prevTransactionFilter.userId = session.user.id;
    }

    const prevTransactions = await prisma.transaction.findMany({
        where: prevTransactionFilter,
    });

    const prevIncome = prevTransactions
        .filter((t) => t.type === TransactionType.INCOME)
        .reduce((sum, t) => sum + Number(t.amount), 0);

    const prevExpense = prevTransactions
        .filter((t) => t.type === TransactionType.EXPENSE)
        .reduce((sum, t) => sum + Number(t.amount), 0);

    const incomeChange = prevIncome > 0 ? ((currentIncome - prevIncome) / prevIncome) * 100 : 0;
    const expenseChange = prevExpense > 0 ? ((currentExpense - prevExpense) / prevExpense) * 100 : 0;

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

                    <KPICard
                        title="Saldo"
                        value={formatCurrency(currentBalance)}
                        trend={currentBalance > 0 ? 'up' : currentBalance < 0 ? 'down' : 'neutral'}
                        icon={
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                            </svg>
                        }
                    />
                </div>

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
                                <p className="text-gray-600">Analisis keuangan bulanan & tahunan</p>
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
                            transactions.map((tx) => (
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
            </main>
        </div>
    );
}
