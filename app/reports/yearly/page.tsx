'use client';

import { useState, useEffect } from 'react';
import { Navbar } from '@/components/Navbar';
import { LineChart } from '@/components/charts/LineChart';
import { formatCurrency, getYearsArray, getCurrentYear } from '@/lib/utils';

interface YearlyReport {
    year: number;
    totalIncome: number;
    totalExpense: number;
    balance: number;
    averageMonthlyIncome: number;
    averageMonthlyExpense: number;
    incomeChange?: number;
    expenseChange?: number;
    analysis: string;
    recommendations: string[];
    chartData: {
        labels: string[];
        income: number[];
        expense: number[];
        balance: number[];
    };
    monthlyData: Array<{
        month: number;
        monthName: string;
        income: number;
        expense: number;
        balance: number;
    }>;
    incomeByCategory: Array<{ category: string; amount: number; percentage: number }>;
    expenseByCategory: Array<{ category: string; amount: number; percentage: number }>;
}

export default function YearlyReportPage() {
    const [year, setYear] = useState(getCurrentYear());
    const [report, setReport] = useState<YearlyReport | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchReport();
    }, [year]);

    const fetchReport = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/reports/yearly?year=${year}`);
            const data = await res.json();
            setReport(data.report);
        } catch (error) {
            console.error('Error fetching report:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleExport = () => {
        window.open(`/api/export/yearly?year=${year}`, '_blank');
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <Navbar />

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">Laporan Tahunan</h1>
                        <p className="text-gray-600">Analisis keuangan tahunan mendalam</p>
                    </div>

                    <div className="flex gap-4 mt-4 md:mt-0">
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
                        Tidak ada data untuk tahun ini
                    </div>
                ) : (
                    <>
                        {/* Summary Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                            <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6">
                                <h3 className="text-sm font-medium text-gray-600 mb-2">Total Pemasukan</h3>
                                <p className="text-2xl font-bold text-gray-900 mb-1">
                                    {formatCurrency(report.totalIncome)}
                                </p>
                                {report.incomeChange !== undefined && (
                                    <p className={`text-xs ${report.incomeChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                        {report.incomeChange >= 0 ? '↑' : '↓'} {Math.abs(report.incomeChange).toFixed(1)}% YoY
                                    </p>
                                )}
                            </div>

                            <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6">
                                <h3 className="text-sm font-medium text-gray-600 mb-2">Total Pengeluaran</h3>
                                <p className="text-2xl font-bold text-gray-900 mb-1">
                                    {formatCurrency(report.totalExpense)}
                                </p>
                                {report.expenseChange !== undefined && (
                                    <p className={`text-xs ${report.expenseChange <= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                        {report.expenseChange >= 0 ? '↑' : '↓'} {Math.abs(report.expenseChange).toFixed(1)}% YoY
                                    </p>
                                )}
                            </div>

                            <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6">
                                <h3 className="text-sm font-medium text-gray-600 mb-2">Surplus/Defisit</h3>
                                <p className={`text-2xl font-bold mb-1 ${report.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                    {formatCurrency(report.balance)}
                                </p>
                                <p className="text-xs text-gray-500">
                                    {report.balance >= 0 ? 'Surplus' : 'Defisit'} Tahunan
                                </p>
                            </div>

                            <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6">
                                <h3 className="text-sm font-medium text-gray-600 mb-2">Rata-rata Bulanan</h3>
                                <p className="text-xl font-bold text-green-600">
                                    {formatCurrency(report.averageMonthlyIncome)}
                                </p>
                                <p className="text-xs text-gray-500 mb-2">Pemasukan</p>
                                <p className="text-xl font-bold text-red-600">
                                    {formatCurrency(report.averageMonthlyExpense)}
                                </p>
                                <p className="text-xs text-gray-500">Pengeluaran</p>
                            </div>
                        </div>

                        {/* Chart */}
                        <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6 mb-8">
                            <h2 className="text-xl font-bold text-gray-900 mb-6">
                                Tren 12 Bulan - {year}
                            </h2>
                            <div className="h-96">
                                <LineChart
                                    labels={report.chartData.labels}
                                    income={report.chartData.income}
                                    expense={report.chartData.expense}
                                />
                            </div>
                        </div>

                        {/* Monthly Breakdown */}
                        <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6 mb-8">
                            <h2 className="text-xl font-bold text-gray-900 mb-6">Rincian Bulanan</h2>
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Bulan</th>
                                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Pemasukan</th>
                                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Pengeluaran</th>
                                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Saldo</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {report.monthlyData.map((data) => (
                                            <tr key={data.month} className="hover:bg-gray-50">
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                    {data.monthName}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-green-600 font-semibold">
                                                    {formatCurrency(data.income)}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-red-600 font-semibold">
                                                    {formatCurrency(data.expense)}
                                                </td>
                                                <td className={`px-6 py-4 whitespace-nowrap text-sm text-right font-bold ${data.balance >= 0 ? 'text-blue-600' : 'text-orange-600'
                                                    }`}>
                                                    {formatCurrency(data.balance)}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Category Summary */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                            <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6">
                                <h3 className="text-lg font-bold text-gray-900 mb-4">Top 5 Sumber Pemasukan</h3>
                                <div className="space-y-4">
                                    {report.incomeByCategory.slice(0, 5).map((cat, idx) => (
                                        <div key={idx}>
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="text-sm font-medium text-gray-700">{cat.category}</span>
                                                <span className="text-sm font-bold text-gray-900">{formatCurrency(cat.amount)}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <div className="flex-1 bg-gray-200 rounded-full h-2.5">
                                                    <div
                                                        className="bg-green-500 h-2.5 rounded-full"
                                                        style={{ width: `${cat.percentage}%` }}
                                                    />
                                                </div>
                                                <span className="text-xs text-gray-500 w-12 text-right">
                                                    {cat.percentage.toFixed(1)}%
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6">
                                <h3 className="text-lg font-bold text-gray-900 mb-4">Top 5 Kategori Pengeluaran</h3>
                                <div className="space-y-4">
                                    {report.expenseByCategory.slice(0, 5).map((cat, idx) => (
                                        <div key={idx}>
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="text-sm font-medium text-gray-700">{cat.category}</span>
                                                <span className="text-sm font-bold text-gray-900">{formatCurrency(cat.amount)}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <div className="flex-1 bg-gray-200 rounded-full h-2.5">
                                                    <div
                                                        className="bg-red-500 h-2.5 rounded-full"
                                                        style={{ width: `${cat.percentage}%` }}
                                                    />
                                                </div>
                                                <span className="text-xs text-gray-500 w-12 text-right">
                                                    {cat.percentage.toFixed(1)}%
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Analysis */}
                        <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6 mb-8">
                            <h2 className="text-xl font-bold text-gray-900 mb-4">📊 Analisis Mendalam</h2>
                            <div className="prose max-w-none">
                                <pre className="whitespace-pre-wrap font-sans text-gray-700 leading-relaxed">
                                    {report.analysis}
                                </pre>
                            </div>
                        </div>

                        {/* Recommendations */}
                        <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border border-blue-200 p-6">
                            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                                <span>🎯</span>
                                Rekomendasi Strategis Tahunan
                            </h2>
                            <div className="space-y-2">
                                {report.recommendations.map((rec, idx) => (
                                    <p key={idx} className="text-gray-700 leading-relaxed">
                                        {rec}
                                    </p>
                                ))}
                            </div>
                        </div>
                    </>
                )}
            </main>
        </div>
    );
}
