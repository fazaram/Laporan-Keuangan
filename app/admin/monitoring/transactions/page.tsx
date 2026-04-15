'use client';

import React, { useEffect, useState } from 'react';
import { DataTable } from '@/components/admin/DataTable';
import { formatCurrency, formatDate } from '@/lib/utils';

interface Transaction {
    id: string;
    date: string;
    category: string;
    amount: number;
    type: string;
    description: string | null;
    user: {
        name: string | null;
        email: string;
    };
}

export default function TransactionsMonitoringPage() {
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchTransactions();
    }, []);

    const fetchTransactions = async () => {
        try {
            const res = await fetch('/api/admin/monitoring/transactions');
            const data = await res.json();
            setTransactions(data);
        } catch (error) {
            console.error('Failed to fetch transactions:', error);
        } finally {
            setLoading(false);
        }
    };

    const columns = [
        {
            header: 'User',
            accessor: (tx: Transaction) => (
                <div>
                    <p className="font-semibold text-neutral-900 leading-none">{tx.user.name || 'N/A'}</p>
                    <p className="text-[10px] text-neutral-400 mt-1 uppercase tracking-wider">{tx.user.email}</p>
                </div>
            ),
        },
        {
            header: 'Type',
            accessor: (tx: Transaction) => (
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest ${
                    tx.type === 'INCOME' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'
                }`}>
                    {tx.type}
                </span>
            ),
        },
        {
            header: 'Category',
            accessor: 'category',
        },
        {
            header: 'Amount',
            className: 'font-bold text-neutral-900 text-right',
            accessor: (tx: Transaction) => formatCurrency(tx.amount),
        },
        {
            header: 'Date',
            accessor: (tx: Transaction) => formatDate(tx.date),
        },
    ];

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold text-neutral-900 tracking-tight">Financial Monitoring</h1>
                <p className="text-neutral-500 mt-1">Global transaction feed across all users (Read-only).</p>
            </div>

            <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-neutral-100 shadow-sm">
                    <div className="flex items-center gap-2">
                        <select className="bg-neutral-50 border-neutral-200 rounded-xl py-2 px-4 text-xs font-semibold focus:bg-white focus:ring-2 focus:ring-emerald-500/10 outline-none transition-all">
                            <option value="">All Types</option>
                            <option value="INCOME">Income</option>
                            <option value="EXPENSE">Expense</option>
                        </select>
                        <select className="bg-neutral-50 border-neutral-200 rounded-xl py-2 px-4 text-xs font-semibold focus:bg-white focus:ring-2 focus:ring-emerald-500/10 outline-none transition-all">
                            <option value="">All Categories</option>
                        </select>
                    </div>
                    <div className="text-xs text-neutral-400 font-medium italic">
                        Showing latest 100 transactions
                    </div>
                </div>

                <DataTable 
                    data={transactions} 
                    columns={columns} 
                    loading={loading}
                    emptyMessage="No transactions found in the logs."
                />
            </div>
        </div>
    );
}
