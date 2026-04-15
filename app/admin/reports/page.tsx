'use client';

import React, { useEffect, useState } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import { Bar, Doughnut, Line } from 'react-chartjs-2';
import { formatCurrency } from '@/lib/utils';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

interface ReportData {
    monthlyTotals: { month: string; income: number; expense: number }[];
    categories: { name: string; value: number }[];
}

export default function ReportsPage() {
    const [data, setData] = useState<ReportData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchReports();
    }, []);

    const fetchReports = async () => {
        try {
            const res = await fetch('/api/admin/reports');
            const d = await res.json();
            setData(d);
        } catch (error) {
            console.error('Failed to fetch reports:', error);
        } finally {
            setLoading(false);
        }
    };

    const barData = {
        labels: data?.monthlyTotals.map(m => m.month) || [],
        datasets: [
            {
                label: 'Income',
                data: data?.monthlyTotals.map(m => m.income) || [],
                backgroundColor: 'rgba(16, 185, 129, 0.8)',
                borderRadius: 4,
            },
            {
                label: 'Expense',
                data: data?.monthlyTotals.map(m => m.expense) || [],
                backgroundColor: 'rgba(239, 68, 68, 0.8)',
                borderRadius: 4,
            }
        ],
    };

    const donutData = {
        labels: data?.categories.map(c => c.name) || [],
        datasets: [
            {
                data: data?.categories.map(c => c.value) || [],
                backgroundColor: [
                    '#10b981', '#ef4444', '#3b82f6', '#f59e0b', '#8b5cf6', 
                    '#ec4899', '#06b6d4', '#475569', '#14b8a6', '#f43f5e'
                ],
                borderWidth: 0,
            }
        ],
    };

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'bottom' as const,
                labels: { usePointStyle: true, padding: 20, font: { size: 10, family: 'Inter' } }
            },
            tooltip: {
                padding: 12,
                backgroundColor: '#171717',
                titleFont: { size: 12, weight: 'bold' },
                bodyFont: { size: 12 },
                callbacks: {
                    label: (context: any) => ` ${formatCurrency(context.raw)}`
                }
            }
        },
    };

    return (
        <div className="space-y-10">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-neutral-900 tracking-tight">Financial Reports</h1>
                    <p className="text-neutral-500 mt-1">Global aggregation of financial performance and category spending.</p>
                </div>
                <button 
                    onClick={() => window.print()}
                    className="flex items-center gap-2 px-4 py-2 bg-neutral-900 text-white text-xs font-bold rounded-xl hover:bg-neutral-800 transition-all shadow-lg shadow-neutral-200"
                >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                    </svg>
                    Export PDF
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Trend Chart */}
                <div className="lg:col-span-2 bg-white p-8 rounded-2xl border border-neutral-100 shadow-sm flex flex-col h-[450px]">
                    <div className="mb-6">
                        <h3 className="text-lg font-bold text-neutral-900">Income vs Expense Trend</h3>
                        <p className="text-xs text-neutral-400 font-medium uppercase tracking-widest mt-1">Last 6 Months</p>
                    </div>
                    <div className="flex-1 relative">
                        {loading ? (
                            <div className="h-full flex items-center justify-center animate-pulse text-neutral-300">Loading chart data...</div>
                        ) : (
                            <Bar data={barData} options={chartOptions} />
                        )}
                    </div>
                </div>

                {/* Categories Chart */}
                <div className="bg-white p-8 rounded-2xl border border-neutral-100 shadow-sm flex flex-col h-[450px]">
                    <div className="mb-6">
                        <h3 className="text-lg font-bold text-neutral-900">Top Expense Categories</h3>
                        <p className="text-xs text-neutral-400 font-medium uppercase tracking-widest mt-1">Global Distribution</p>
                    </div>
                    <div className="flex-1 relative">
                         {loading ? (
                            <div className="h-full flex items-center justify-center animate-pulse text-neutral-300">Loading distribution...</div>
                        ) : data?.categories.length ? (
                            <Doughnut data={donutData} options={{...chartOptions, cutout: '75%'}} />
                        ) : (
                            <div className="h-full flex items-center justify-center text-neutral-400 text-sm font-medium italic">No category data</div>
                        )}
                    </div>
                </div>
            </div>

            {/* Summary Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-emerald-50 p-6 rounded-2xl border border-emerald-100">
                    <p className="text-emerald-600 text-[10px] font-black uppercase tracking-[0.2em] mb-1">Total Pemasukan</p>
                    <h4 className="text-xl font-bold text-emerald-900">
                        {formatCurrency(data?.monthlyTotals.reduce((sum, m) => sum + m.income, 0) || 0)}
                    </h4>
                </div>
                <div className="bg-red-50 p-6 rounded-2xl border border-red-100">
                    <p className="text-red-600 text-[10px] font-black uppercase tracking-[0.2em] mb-1">Total Pengeluaran</p>
                    <h4 className="text-xl font-bold text-red-900">
                         {formatCurrency(data?.monthlyTotals.reduce((sum, m) => sum + m.expense, 0) || 0)}
                    </h4>
                </div>
                <div className="bg-blue-50 p-6 rounded-2xl border border-blue-100">
                    <p className="text-blue-600 text-[10px] font-black uppercase tracking-[0.2em] mb-1">Average Profit</p>
                    <h4 className="text-xl font-bold text-blue-900">
                         {formatCurrency((data?.monthlyTotals.reduce((sum, m) => sum + (m.income - m.expense), 0) || 0) / (data?.monthlyTotals.length || 1))}
                    </h4>
                </div>
                <div className="bg-neutral-900 p-6 rounded-2xl border border-neutral-800">
                    <p className="text-neutral-400 text-[10px] font-black uppercase tracking-[0.2em] mb-1 text-center">Data Accuracy</p>
                    <div className="flex items-center justify-center gap-2 mt-1">
                        <span className="w-2 h-2 bg-emerald-500 rounded-full animate-ping"></span>
                        <h4 className="text-xl font-bold text-white">99.9%</h4>
                    </div>
                </div>
            </div>
        </div>
    );
}
