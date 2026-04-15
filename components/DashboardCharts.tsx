"use client";

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

interface ChartsProps {
  income: number;
  expense: number;
  transactions: any[];
}

export function DashboardCharts({ income, expense, transactions }: ChartsProps) {
  // Data for Bar Chart (Current Month Overview)
  const barData = {
    labels: ['Keuangan Bulan Ini'],
    datasets: [
      {
        label: 'Pemasukan',
        data: [income],
        backgroundColor: 'rgba(59, 130, 246, 0.8)',
        borderRadius: 8,
      },
      {
        label: 'Pengeluaran',
        data: [expense],
        backgroundColor: 'rgba(239, 68, 68, 0.8)',
        borderRadius: 8,
      },
    ],
  };

  // Process Category Data for Donut Chart
  const categoryData: Record<string, number> = {};
  transactions
    .filter((t) => t.type === 'EXPENSE')
    .forEach((t) => {
      categoryData[t.category] = (categoryData[t.category] || 0) + Number(t.amount);
    });

  const donutLabels = Object.keys(categoryData);
  const donutValues = Object.values(categoryData);

  const donutData = {
    labels: donutLabels,
    datasets: [
      {
        data: donutValues,
        backgroundColor: [
          '#6366f1', '#f43f5e', '#10b981', '#f59e0b', '#3b82f6', '#8b5cf6', '#ec4899'
        ],
        borderWidth: 0,
        hoverOffset: 15,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          usePointStyle: true,
          padding: 20,
          font: { size: 12, family: 'Inter' }
        },
      },
    },
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
      {/* Bar Chart Card */}
      <div className="bg-white p-6 rounded-2xl shadow-md border border-gray-100 flex flex-col h-[300px] md:h-[400px]">
        <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
          <span className="w-2 h-6 bg-blue-600 rounded-full"></span>
          Perbandingan Arus Kas
        </h3>
        <div className="flex-1 relative">
          <Bar data={barData} options={{...chartOptions, scales: { y: { beginAtZero: true } }}} />
        </div>
      </div>

      {/* Donut Chart Card */}
      <div className="bg-white p-6 rounded-2xl shadow-md border border-gray-100 flex flex-col h-[400px]">
        <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
          <span className="w-2 h-6 bg-purple-600 rounded-full"></span>
          Alokasi Pengeluaran
        </h3>
        <div className="flex-1 relative">
          {donutValues.length > 0 ? (
            <Doughnut data={donutData} options={{
                ...chartOptions, 
                cutout: '70%',
                plugins: {
                    ...chartOptions.plugins,
                    tooltip: {
                        callbacks: {
                            label: (context: any) => {
                                const val = context.raw;
                                return ` Rp ${val.toLocaleString('id-ID')}`;
                            }
                        }
                    }
                }
            }} />
          ) : (
            <div className="h-full flex items-center justify-center text-gray-500 italic">
              Belum ada data pengeluaran bulan ini
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
