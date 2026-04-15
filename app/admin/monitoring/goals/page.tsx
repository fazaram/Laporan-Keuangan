'use client';

import React, { useEffect, useState } from 'react';
import { DataTable } from '@/components/admin/DataTable';
import { formatCurrency, formatDate } from '@/lib/utils';

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

    useEffect(() => {
        fetchGoals();
    }, []);

    const fetchGoals = async () => {
        try {
            const res = await fetch('/api/admin/monitoring/goals');
            const data = await res.json();
            setGoals(data);
        } catch (error) {
            console.error('Failed to fetch goals:', error);
        } finally {
            setLoading(false);
        }
    };

    const columns = [
        {
            header: 'User',
            accessor: (goal: Goal) => (
                <div>
                    <p className="font-semibold text-neutral-900 leading-none">{goal.user.name || 'N/A'}</p>
                    <p className="text-[10px] text-neutral-400 mt-1 uppercase tracking-wider">{goal.user.email}</p>
                </div>
            ),
        },
        {
            header: 'Goal Name',
            accessor: 'name',
        },
        {
            header: 'Progress',
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
            accessor: (goal: Goal) => formatDate(goal.createdAt),
        },
    ];

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold text-neutral-900 tracking-tight">Financial Goals</h1>
                <p className="text-neutral-500 mt-1">Track financial progress and saving targets across all accounts.</p>
            </div>

            <DataTable 
                data={goals} 
                columns={columns} 
                loading={loading}
                emptyMessage="No financial goals found."
            />
        </div>
    );
}
