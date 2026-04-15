'use client';

import { formatCurrency } from '@/lib/utils';

interface WalletCardProps {
    wallet: {
        id: string;
        name: string;
        icon: string | null;
        budgetAmount: number;
        spentAmount: number;
    };
    onAddRule: (walletId: string) => void;
}

export function WalletCard({ wallet, onAddRule }: WalletCardProps) {
    const percentage = wallet.budgetAmount > 0 
        ? Math.min(100, (wallet.spentAmount / wallet.budgetAmount) * 100)
        : 0;

    const getProgressColor = () => {
        if (percentage < 70) return 'bg-green-500';
        if (percentage < 90) return 'bg-yellow-500';
        return 'bg-red-500';
    };

    const getTextColor = () => {
        if (percentage < 70) return 'text-green-600';
        if (percentage < 90) return 'text-yellow-600';
        return 'text-red-600';
    };

    return (
        <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-6 hover:shadow-lg transition-all group">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-2xl">
                        {wallet.icon || '💼'}
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                            {wallet.name}
                        </h3>
                        <p className="text-xs text-gray-500 uppercase font-semibold tracking-wider">Smart Wallet</p>
                    </div>
                </div>
                <button 
                    onClick={() => onAddRule(wallet.id)}
                    className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                    title="Tambah Aturan Alokasi"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                    </svg>
                </button>
            </div>

            <div className="space-y-4">
                <div className="flex justify-between items-end">
                    <div>
                        <p className="text-sm text-gray-500 mb-1">Terpakai</p>
                        <p className={`text-xl font-bold ${getTextColor()}`}>
                            {formatCurrency(wallet.spentAmount)}
                        </p>
                    </div>
                    <div className="text-right">
                        <p className="text-sm text-gray-500 mb-1">Anggaran</p>
                        <p className="text-lg font-semibold text-gray-900">
                            {formatCurrency(wallet.budgetAmount)}
                        </p>
                    </div>
                </div>

                <div className="relative pt-1">
                    <div className="flex mb-2 items-center justify-between">
                        <div>
                            <span className={`text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full ${percentage >= 90 ? 'text-red-600 bg-red-100' : 'text-blue-600 bg-blue-100'}`}>
                                {percentage.toFixed(0)}% Digunakan
                            </span>
                        </div>
                    </div>
                    <div className="overflow-hidden h-2 mb-4 text-xs flex rounded-full bg-gray-100">
                        <div
                            style={{ width: `${percentage}%` }}
                            className={`shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center transition-all duration-500 ${getProgressColor()}`}
                        ></div>
                    </div>
                </div>
            </div>

            {wallet.budgetAmount === 0 && (
                <div className="mt-4 p-3 bg-blue-50 border border-blue-100 rounded-lg text-xs text-blue-700 flex items-start gap-2">
                    <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p>Belum ada anggaran. Tambahkan aturan alokasi atau input pemasukan untuk mengisi wallet ini.</p>
                </div>
            )}
        </div>
    );
}
