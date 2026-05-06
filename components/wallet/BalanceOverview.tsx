'use client';

import { useState, useEffect } from 'react';
import { formatCurrency } from '@/lib/utils';
import { Info, Eye, EyeOff } from 'lucide-react';

interface BalanceOverviewProps {
    mainBalance: number;
}

export function BalanceOverview({ mainBalance }: BalanceOverviewProps) {
    const [isVisible, setIsVisible] = useState(true);

    return (
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex items-center justify-between mb-8 transition-all hover:shadow-md">
            <div className="flex items-center gap-3">
                <h2 className="text-lg font-bold text-gray-900">My Assets</h2>
                <div className="group relative">
                    <Info size={18} className="text-gray-300 cursor-help" />
                    <div className="absolute left-0 bottom-full mb-2 hidden group-hover:block w-64 p-3 bg-gray-900 text-[10px] text-white rounded-xl shadow-2xl z-50 leading-relaxed">
                        Total saldo yang belum dialokasikan ke dalam pocket khusus.
                    </div>
                </div>
            </div>
            
            <div className="flex items-center gap-4">
                <span className="text-2xl font-bold text-gray-900 tracking-tight">
                    {isVisible ? formatCurrency(mainBalance) : 'Rp ••••••••'}
                </span>
                <button 
                    onClick={() => setIsVisible(!isVisible)}
                    className="p-2 hover:bg-gray-50 rounded-full text-gray-400 transition-colors"
                >
                    {isVisible ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
            </div>
        </div>
    );
}
