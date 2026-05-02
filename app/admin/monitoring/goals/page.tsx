'use client';

import React, { useEffect, useState } from 'react';
import { DataTable } from '@/components/admin/DataTable';
import { formatCurrency, formatDate, formatDateTime } from '@/lib/utils';

interface Goal {
    id: string;
    name: string;
    targetAmount: number;
    currentAmount: number;
    status: string;
    createdAt: string;
    user: {
        name: string | null;
        email: string;
    };
}

export default function GoalsMonitoringPage() {
    const [goals, setGoals] = useState<Goal[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [sortConfig, setSortConfig] = useState<{
        key: keyof Goal | 'userName' | 'progress';
        direction: 'asc' | 'desc';
    }>({ key: 'createdAt', direction: 'desc' });

    const fetchGoals = async () => {
        try {
            setLoading(true);
            const res = await fetch('/api/admin/monitoring/goals');
            if (!res.ok) throw new Error('Failed to fetch goals');
            const data = await res.json();
            setGoals(data);
        } catch (error) {
            console.error('Error fetching goals:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchGoals();
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
            accessor: (goal: Goal) => (
                <div>
                    <p className="font-semibold text-neutral-900 leading-none">{goal.user.name || 'N/A'}</p>
                    <p className="text-[10px] text-neutral-400 mt-1 uppercase tracking-wider">{goal.user.email}</p>
                </div>
            ),
        },
        {
            header: 'Goal Name',
            sortKey: 'name' as any,
            accessor: 'name' as any,
        },
        {
            header: 'Progress',
            sortKey: 'progress' as any,
            accessor: (goal: Goal) => {
                const progress = Math.min(100, Math.round((Number(goal.currentAmount) / Number(goal.targetAmount)) * 100));
                return (
                    <div className="w-full max-w-[120px]">
                        <div className="flex justify-between items-center mb-1 text-[10px] font-bold text-neutral-400 uppercase tracking-tighter">
                            <span>{progress}%</span>
                            <span>{formatCurrency(goal.targetAmount)}</span>
                        </div>
                        <div className="w-full h-1 bg-neutral-100 rounded-full overflow-hidden">
                            <div 
                                className={`h-full transition-all duration-500 ${progress === 100 ? 'bg-emerald-500' : 'bg-emerald-400'}`} 
                                style={{ width: `${progress}%` }}
                            ></div>
                        </div>
                    </div>
                );
            },
        },
        {
            header: 'Status',
            sortKey: 'status' as any,
            accessor: (goal: Goal) => (
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest ${
                    goal.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-blue-600'
                }`}>
                    {goal.status}
                </span>
            ),
        },
        {
            header: 'Created At',
            sortKey: 'createdAt' as any,
            accessor: (goal: Goal) => formatDateTime(goal.createdAt),
        },
    ];

    const filteredGoals = goals
        .filter(goal => {
            const matchesSearch = !searchQuery || 
                goal.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                (goal.user.name && goal.user.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
                goal.user.email.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesStatus = !statusFilter || goal.status === statusFilter;
            return matchesSearch && matchesStatus;
        })
        .sort((a, b) => {
            let aValue: any;
            let bValue: any;
            
            if (sortConfig.key === 'userName') {
                aValue = a.user.name || a.user.email;
                bValue = b.user.name || b.user.email;
            } else if (sortConfig.key === 'progress') {
                aValue = (Number(a.currentAmount) / Number(a.targetAmount));
                bValue = (Number(b.currentAmount) / Number(b.targetAmount));
            } else {
                aValue = a[sortConfig.key as keyof Goal];
                bValue = b[sortConfig.key as keyof Goal];
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
                <h1 className="text-3xl font-bold text-neutral-900 tracking-tight">Financial Goals</h1>
                <p className="text-neutral-500 mt-1">Track financial progress and saving targets across all accounts.</p>
            </div>

            <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-neutral-100 shadow-sm">
                    <div className="flex items-center gap-2 flex-1 max-w-sm">
                        <div className="relative flex-1">
                            <input 
                                type="text"
                                placeholder="Search goals or users..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full bg-neutral-50 border-neutral-200 rounded-xl py-2 px-4 text-xs focus:bg-white focus:ring-2 focus:ring-emerald-500/10 outline-none transition-all"
                            />
                        </div>
                        <select 
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="bg-neutral-50 border-neutral-200 rounded-xl py-2 px-4 text-xs font-semibold focus:bg-white focus:ring-2 focus:ring-emerald-500/10 outline-none transition-all"
                        >
                            <option value="">All Statuses</option>
                            <option value="ACTIVE">Active</option>
                            <option value="COMPLETED">Completed</option>
                        </select>
                    </div>
                </div>

                <DataTable 
                    data={filteredGoals} 
                    columns={columns} 
                    loading={loading}
                    emptyMessage="No financial goals found."
                    onSort={handleSort}
                    sortKey={sortConfig.key as any}
                    sortDirection={sortConfig.direction}
                />
            </div>
        </div>
    );
}

