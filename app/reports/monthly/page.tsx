'use client';

import { useState, useEffect } from 'react';
import { Navbar } from '@/components/Navbar';
import { LineChart } from '@/components/charts/LineChart';
import { formatCurrency, getMonthsArray, getYearsArray, getCurrentMonth, getCurrentYear } from '@/lib/utils';

interface MonthlyReport {
    year: number;
    month: number;
    totalIncome: number;
    totalExpense: number;
    balance: number;
    incomeChange?: number;
    expenseChange?: number;
    analysis: string;
    recommendations: string[];
    chartData: {
        labels: string[];
        income: number[];
        expense: number[];
    };
    incomeByCategory: Array<{ category: string; amount: number; percentage: number }>;
    expenseByCategory: Array<{ category: string; amount: number; percentage: number }>;
}

export default function MonthlyReportPage() {
    const [year, setYear] = useState(getCurrentYear());
    const [month, setMonth] = useState(getCurrentMonth());
    const [report, setReport] = useState<MonthlyReport | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchReport();
    }, [year, month]);

    const fetchReport = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/reports/monthly?year=${year}&month=${month}`);
            const data = await res.json();
            setReport(data.report);
        } catch (error) {
            console.error('Error fetching report:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleExport = () => {
        window.open(`/api/export/monthly?year=${year}&month=${month}`, '_blank');
    };

    const monthNames = [
        'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
        'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];

    return (
        <div className="min-h-screen bg-gray-50">
            <Navbar />

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">Laporan Bulanan</h1>
                        <p className="text-gray-600">Analisis keuangan per bulan</p>
                    </div>

                    <div className="flex gap-4 mt-4 md:mt-0">
                        <select
                            value={month}
                            onChange={(e) => setMonth(parseInt(e.target.value))}
                            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                            {getMonthsArray().map((m) => (
                                <option key={m.value} value={m.value}>
                                    {m.label}
                                </option>
                            ))}
                        </select>

                        <select
                            value={year}
                            onChange={(e) => setYear(parseInt(e.target.value))}
                            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                            {getYearsArray().map((y) => (
                                <option key={y} value={y}>
                                    {y}
                                </option>
                            ))}
                        </select>

                        <button
                            onClick={handleExport}
                            disabled={!report}
                            className="px-6 py-2 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            Export Excel
                        </button>
                    </div>
                </div>

                {loading ? (
                    <div className="text-center py-12">
                        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                        <p className="mt-4 text-gray-600">Memuat laporan...</p>
                    </div>
                ) : !report ? (
                    <div className="text-center py-12 text-gray-500">
                        Tidak ada data untuk periode ini
                    </div>
                ) : (
                    <>
                        {/* Summary Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                            <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-sm font-medium text-gray-600">Total Pemasukan</h3>
                                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center text-green-600">
                                        ↑
                                    </div>
                                </div>
                                <p className="text-3xl font-bold text-gray-900 mb-2">
                                    {formatCurrency(report.totalIncome)}
                                </p>
                                {report.incomeChange !== undefined && (
                                    <p className={`text-sm ${report.incomeChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                        {report.incomeChange >= 0 ? '↑' : '↓'} {Math.abs(report.incomeChange).toFixed(1)}% vs bulan lalu
                                    </p>
                                )}
                            </div>

                            <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-sm font-medium text-gray-600">Total Pengeluaran</h3>
                                    <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center text-red-600">
                                        ↓
                                    </div>
                                </div>
                                <p className="text-3xl font-bold text-gray-900 mb-2">
                                    {formatCurrency(report.totalExpense)}
                                </p>
                                {report.expenseChange !== undefined && (
                                    <p className={`text-sm ${report.expenseChange <= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                        {report.expenseChange >= 0 ? '↑' : '↓'} {Math.abs(report.expenseChange).toFixed(1)}% vs bulan lalu
                                    </p>
                                )}
                            </div>

                            <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-sm font-medium text-gray-600">Saldo</h3>
                                    <div className={`w-10 h-10 ${report.balance >= 0 ? 'bg-blue-100 text-blue-600' : 'bg-orange-100 text-orange-600'} rounded-lg flex items-center justify-center`}>
                                        =
                                    </div>
                                </div>
                                <p className={`text-3xl font-bold mb-2 ${report.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                    {formatCurrency(report.balance)}
                                </p>
                                <p className="text-sm text-gray-500">
                                    {report.balance >= 0 ? 'Surplus' : 'Defisit'}
                                </p>
                            </div>
                        </div>

                        {/* Chart */}
                        <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6 mb-8">
                            <h2 className="text-xl font-bold text-gray-900 mb-6">
                                Grafik Pemasukan vs Pengeluaran - {monthNames[month - 1]} {year}
                            </h2>
                            <div className="h-80">
                                <LineChart
                                    labels={report.chartData.labels}
                                    income={report.chartData.income}
                                    expense={report.chartData.expense}
                                />
                            </div>
                        </div>

                        {/* Category Breakdown */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                            <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6">
                                <h3 className="text-lg font-bold text-gray-900 mb-4">Kategori Pemasukan</h3>
                                <div className="space-y-3">
                                    {report.incomeByCategory.slice(0, 5).map((cat, idx) => (
                                        <div key={idx} className="flex items-center justify-between">
                                            <div className="flex-1">
                                                <div className="flex items-center justify-between mb-1">
                                                    <span className="text-sm font-medium text-gray-700">{cat.category}</span>
                                                    <span className="text-sm text-gray-500">{cat.percentage.toFixed(1)}%</span>
                                                </div>
                                                <div className="w-full bg-gray-200 rounded-full h-2">
                                                    <div
                                                        className="bg-green-500 h-2 rounded-full"
                                                        style={{ width: `${cat.percentage}%` }}
                                                    />
                                                </div>
                                            </div>
                                            <span className="ml-4 text-sm font-semibold text-gray-900">
                                                {formatCurrency(cat.amount)}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6">
                                <h3 className="text-lg font-bold text-gray-900 mb-4">Kategori Pengeluaran</h3>
                                <div className="space-y-3">
                                    {report.expenseByCategory.slice(0, 5).map((cat, idx) => (
                                        <div key={idx} className="flex items-center justify-between">
                                            <div className="flex-1">
                                                <div className="flex items-center justify-between mb-1">
                                                    <span className="text-sm font-medium text-gray-700">{cat.category}</span>
                                                    <span className="text-sm text-gray-500">{cat.percentage.toFixed(1)}%</span>
                                                </div>
                                                <div className="w-full bg-gray-200 rounded-full h-2">
                                                    <div
                                                        className="bg-red-500 h-2 rounded-full"
                                                        style={{ width: `${cat.percentage}%` }}
                                                    />
                                                </div>
                                            </div>
                                            <span className="ml-4 text-sm font-semibold text-gray-900">
                                                {formatCurrency(cat.amount)}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Analysis */}
                        <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6 mb-8">
                            <h2 className="text-xl font-bold text-gray-900 mb-4">Analisis Keuangan</h2>
                            <div className="prose max-w-none">
                                <pre className="whitespace-pre-wrap font-sans text-gray-700 leading-relaxed">
                                    {report.analysis}
                                </pre>
                            </div>
                        </div>

                        {/* Recommendations */}
                        <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border border-blue-200 p-6">
                            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                                <span>💡</span>
                                Rekomendasi Strategis
                            </h2>
                            <ul className="space-y-3">
                                {report.recommendations.map((rec, idx) => (
                                    <li key={idx} className="flex gap-3">
                                        <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                                            {idx + 1}
                                        </span>
                                        <span className="text-gray-700 leading-relaxed">{rec}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </>
                )}
            </main>
        </div>
    );
}
