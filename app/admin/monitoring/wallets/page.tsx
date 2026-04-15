'use client';

import React, { useEffect, useState } from 'react';
import { DataTable } from '@/components/admin/DataTable';
import { formatCurrency } from '@/lib/utils';

interface Wallet {
    id: string;
    name: string;
    budgetAmount: number;
    spentAmount: number;
    user: {
        name: string | null;
        email: string;
    };
}

export default function WalletsMonitoringPage() {
    const [wallets, setWallets] = useState<Wallet[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchWallets();
    }, []);

    const fetchWallets = async () => {
        try {
            const res = await fetch('/api/admin/monitoring/wallets');
            const data = await res.json();
            setWallets(data);
        } catch (error) {
            console.error('Failed to fetch wallets:', error);
        } finally {
            setLoading(false);
        }
    };

    const columns = [
        {
            header: 'User',
            accessor: (w: Wallet) => (
                <div>
                    <p className="font-semibold text-neutral-900 leading-none">{w.user.name || 'N/A'}</p>
                    <p className="text-[10px] text-neutral-400 mt-1 uppercase tracking-wider">{w.user.email}</p>
                </div>
            ),
        },
        {
            header: 'Wallet Category',
            accessor: 'name',
        },
        {
            header: 'Budget / Spending',
            accessor: (w: Wallet) => {
                const budget = Number(w.budgetAmount);
                const spent = Number(w.spentAmount);
                const progress = budget > 0 ? Math.min(100, Math.round((spent / budget) * 100)) : 0;
                
                let barColor = 'bg-emerald-500';
                if (progress > 90) barColor = 'bg-red-500';
                else if (progress > 75) barColor = 'bg-yellow-500';

                return (
                    <div className="w-full max-w-[160px]">
                        <div className="flex justify-between items-center mb-1 text-[10px] font-bold uppercase tracking-tighter">
                            <span className={progress > 90 ? 'text-red-600' : 'text-neutral-400'}>{progress}% Used</span>
                            <span className="text-neutral-900">{formatCurrency(spent)} / {formatCurrency(budget)}</span>
                        </div>
                        <div className="w-full h-1.5 bg-neutral-100 rounded-full overflow-hidden">
                            <div 
                                className={`h-full transition-all duration-500 ${barColor}`} 
                                style={{ width: `${progress}%` }}
                            ></div>
                        </div>
                    </div>
                );
            },
        },
        {
            header: 'Remaining',
            className: 'text-right font-medium',
            accessor: (w: Wallet) => {
                const remaining = Number(w.budgetAmount) - Number(w.spentAmount);
                return (
                    <span className={remaining < 0 ? 'text-red-500 font-bold' : 'text-neutral-600'}>
                        {formatCurrency(remaining)}
                    </span>
                );
            },
        },
    ];

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold text-neutral-900 tracking-tight">Wallet Monitoring</h1>
                <p className="text-neutral-500 mt-1">Global view of budget allocations and actual spending per wallet.</p>
            </div>

            <DataTable 
                data={wallets} 
                columns={columns} 
                loading={loading}
                emptyMessage="No wallets found."
            />
        </div>
    );
}
