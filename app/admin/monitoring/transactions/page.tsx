'use client';

import React, { useEffect, useState } from 'react';
import { DataTable } from '@/components/admin/DataTable';
import { formatCurrency, formatDate, formatDateTime } from '@/lib/utils';

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
    
    const [typeFilter, setTypeFilter] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [sortConfig, setSortConfig] = useState<{
        key: keyof Transaction | 'userName';
        direction: 'asc' | 'desc';
    }>({ key: 'date', direction: 'desc' });

    const fetchTransactions = async () => {
        try {
            setLoading(true);
            const res = await fetch('/api/admin/monitoring/transactions');
            if (!res.ok) throw new Error('Failed to fetch transactions');
            const data = await res.json();
            setTransactions(data);
        } catch (error) {
            console.error('Error fetching transactions:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTransactions();
    }, []);

    const handleSort = (key: any) => {
        let direction: 'asc' | 'desc' = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const columns = [
        {
            header: 'User',
            sortKey: 'userName' as any,
            accessor: (tx: Transaction) => (
                <div>
                    <p className="font-semibold text-neutral-900 leading-none">{tx.user.name || 'N/A'}</p>
                    <p className="text-[10px] text-neutral-400 mt-1 uppercase tracking-wider">{tx.user.email}</p>
                </div>
            ),
        },
        {
            header: 'Type',
            sortKey: 'type' as any,
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
            sortKey: 'category' as any,
            accessor: 'category' as any,
        },
        {
            header: 'Amount',
            sortKey: 'amount' as any,
            className: 'font-bold text-neutral-900 text-right',
            accessor: (tx: Transaction) => formatCurrency(tx.amount),
        },
        {
            header: 'Date',
            sortKey: 'date' as any,
            accessor: (tx: Transaction) => formatDateTime(tx.date),
        },
    ];

    const filteredTransactions = transactions
        .filter(tx => {
            const matchesType = !typeFilter || tx.type === typeFilter;
            const matchesSearch = !searchQuery || 
                tx.category.toLowerCase().includes(searchQuery.toLowerCase()) || 
                (tx.user.name && tx.user.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
                tx.user.email.toLowerCase().includes(searchQuery.toLowerCase());
            return matchesType && matchesSearch;
        })
        .sort((a, b) => {
            let aValue: any;
            let bValue: any;
            
            if (sortConfig.key === 'userName') {
                aValue = a.user.name || a.user.email;
                bValue = b.user.name || b.user.email;
            } else {
                aValue = a[sortConfig.key as keyof Transaction];
                bValue = b[sortConfig.key as keyof Transaction];
            }
            
            if (aValue === bValue) return 0;
            
            if (sortConfig.direction === 'asc') {
                return aValue < bValue ? -1 : 1;
            } else {
                return aValue > bValue ? -1 : 1;
            }
        });

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold text-neutral-900 tracking-tight">Financial Monitoring</h1>
                <p className="text-neutral-500 mt-1">Global transaction feed across all users (Read-only).</p>
            </div>

            <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-neutral-100 shadow-sm">
                    <div className="flex items-center gap-2 flex-1 max-w-sm">
                        <div className="relative flex-1">
                            <input 
                                type="text"
                                placeholder="Search by user or category..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full bg-neutral-50 border-neutral-200 rounded-xl py-2 px-4 text-xs focus:bg-white focus:ring-2 focus:ring-emerald-500/10 outline-none transition-all"
                            />
                        </div>
                        <select 
                            value={typeFilter}
                            onChange={(e) => setTypeFilter(e.target.value)}
                            className="bg-neutral-50 border-neutral-200 rounded-xl py-2 px-4 text-xs font-semibold focus:bg-white focus:ring-2 focus:ring-emerald-500/10 outline-none transition-all"
                        >
                            <option value="">All Types</option>
                            <option value="INCOME">Income</option>
                            <option value="EXPENSE">Expense</option>
                        </select>
                    </div>
                    <div className="text-xs text-neutral-400 font-medium italic">
                        Showing latest 100 transactions
                    </div>
                </div>

                <DataTable 
                    data={filteredTransactions} 
                    columns={columns} 
                    loading={loading}
                    emptyMessage="No transactions found in the logs."
                    onSort={handleSort}
                    sortKey={sortConfig.key as any}
                    sortDirection={sortConfig.direction}
                />
            </div>
        </div>
    );
}

