'use client';

import React, { useEffect, useState } from 'react';
import { StatCard } from '@/components/admin/StatCard';
interface AdminStats {
    totalUsers: number;
    totalTransactions: number;
    activeGoals: number;
    aiRequestsToday: number;
}

export default function AdminDashboard() {
    const [stats, setStats] = useState<AdminStats | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            const res = await fetch('/api/admin/stats');
            const data = await res.json();
            setStats(data);
        } catch (error) {
            console.error('Failed to fetch stats:', error);
        } finally {
            setLoading(false);
        }
    };

    const kpiCards = [
        {
            title: 'Total Users',
            value: stats?.totalUsers || 0,
            icon: (
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
            ),
            trend: { value: 12, isUp: true },
            description: 'Across all roles'
        },
        {
            title: 'Total Transactions',
            value: stats?.totalTransactions || 0,
            icon: (
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                </svg>
            ),
            description: 'System-wide history'
        },
        {
            title: 'Active Goals',
            value: stats?.activeGoals || 0,
            icon: (
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
            ),
            description: 'Current active goals'
        },
        {
            title: 'AI Requests Today',
            value: stats?.aiRequestsToday || 0,
            icon: (
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
            ),
            trend: { value: 45, isUp: true },
            description: 'Since 12:00 AM'
        }
    ];

    return (
        <div className="space-y-10">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-neutral-900 tracking-tight">System Overview</h1>
                <p className="text-neutral-500 mt-1">Real-time statistics across the Solvia Finance network.</p>
            </div>

            {/* KPI Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {kpiCards.map((card, idx) => (
                    <StatCard 
                        key={idx} 
                        {...card} 
                        loading={loading}
                    />
                ))}
            </div>


        </div>
    );
}
