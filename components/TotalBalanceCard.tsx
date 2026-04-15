'use client';

import { useState, useEffect } from 'react';
import { formatCurrency } from '@/lib/utils';

interface TotalBalanceCardProps {
    amount: number;
}

export function TotalBalanceCard({ amount }: TotalBalanceCardProps) {
    const [isVisible, setIsVisible] = useState(true);
    const [isLoaded, setIsLoaded] = useState(false);

    useEffect(() => {
        const stored = localStorage.getItem('totalBalanceVisible');
        if (stored !== null) {
            setIsVisible(stored === 'true');
        }
        setIsLoaded(true);
    }, []);

    const toggleVisibility = () => {
        const newState = !isVisible;
        setIsVisible(newState);
        localStorage.setItem('totalBalanceVisible', String(newState));
    };

    if (!isLoaded) {
        // Hydration mismatch prevention - show skeleton
        return (
            <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-xl p-6 text-white shadow-lg relative overflow-hidden h-full">
                <div className="absolute right-0 top-0 opacity-10">
                    <svg className="w-32 h-32 transform translate-x-8 -translate-y-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                </div>
                <div className="animate-pulse">
                    <div className="h-5 bg-blue-400/30 rounded w-1/2 mb-2"></div>
                    <div className="h-9 bg-blue-400/50 rounded w-3/4 mb-4"></div>
                    <div className="h-4 bg-blue-400/20 rounded w-full"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-xl p-6 text-white shadow-lg relative overflow-hidden transition-all duration-300">
            <div className="absolute right-0 top-0 opacity-10">
                <svg className="w-32 h-32 transform translate-x-8 -translate-y-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            </div>
            <div className="relative z-10">
                <div className="flex items-center justify-between mb-1">
                    <h3 className="text-blue-100 font-medium">Total Saldo (Keseluruhan)</h3>
                    <button 
                        onClick={toggleVisibility}
                        className="p-1.5 hover:bg-white/20 rounded-lg transition-all active:scale-95"
                        title={isVisible ? 'Sembunyikan Saldo' : 'Tampilkan Saldo'}
                    >
                        {isVisible ? (
                            <svg className="w-5 h-5 text-blue-100" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                        ) : (
                            <svg className="w-5 h-5 text-blue-100" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                            </svg>
                        )}
                    </button>
                </div>
                <p className="text-3xl font-bold mb-4 tracking-tight min-h-[40px] flex items-center">
                    {isVisible ? formatCurrency(amount) : 'Rp ••••••••'}
                </p>
                <div className="text-sm text-blue-200">
                    Sisa tabungan dari keseluruhan transaksi
                </div>
            </div>
        </div>
    );
}
