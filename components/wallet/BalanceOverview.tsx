'use client';

import { useState } from 'react';
import { formatCurrency } from '@/lib/utils';
import { Info, Eye, EyeOff } from 'lucide-react';

interface BalanceOverviewProps {
    totalBalance: number;
    allocatedBalance: number;
    availableBalance: number;
}

export function BalanceOverview({ totalBalance, allocatedBalance, availableBalance }: BalanceOverviewProps) {
    const [isVisible, setIsVisible] = useState(true);

    return (
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 mb-8">
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h2 className="text-sm font-medium text-gray-500 mb-1 flex items-center gap-2">
                        Total Saldo (Unallocated)
                        <button 
                            onClick={() => setIsVisible(!isVisible)}
                            className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                        >
                            {isVisible ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                    </h2>
                    <p className="text-3xl font-black text-gray-900">
                        {isVisible ? formatCurrency(availableBalance) : '••••••••'}
                    </p>
                </div>
                <div className="text-right">
                    <p className="text-xs font-medium text-gray-400 mb-1">My Assets</p>
                    <p className="text-xl font-bold text-gray-700">{formatCurrency(totalBalance)}</p>
                </div>
            </div>

            <div className="space-y-2">
                <div className="flex justify-between text-xs font-medium text-gray-500">
                    <span>Allocated to Pockets</span>
                    <span>{formatCurrency(allocatedBalance)}</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div 
                        className="h-full bg-purple-600 transition-all duration-500"
                        style={{ width: `${(allocatedBalance / totalBalance) * 100}%` }}
                    />
                </div>
            </div>
        </div>
    );
}
