'use client';

import React, { useEffect, useState } from 'react';
import { StatCard } from '@/components/admin/StatCard';

interface UsageData {
    dailyUsage: { date: string; count: number }[];
    topUsers: { name: string; email: string; usageCount: number }[];
}

export default function AiUsagePage() {
    const [data, setData] = useState<UsageData | null>(null);
    const [loading, setLoading] = useState(true);
    const [animateBars, setAnimateBars] = useState(false);

    useEffect(() => {
        fetchUsage();
    }, []);

    const fetchUsage = async () => {
        try {
            const res = await fetch('/api/admin/ai/stats');
            const d = await res.json();
            setData(d);
        } catch (error) {
            console.error('Failed to fetch AI usage:', error);
        } finally {
            setLoading(false);
            setTimeout(() => setAnimateBars(true), 100);
        }
    };

    return (
        <div className="space-y-10">
            <div>
                <h1 className="text-3xl font-bold text-neutral-900 tracking-tight">AI Management</h1>
                <p className="text-neutral-500 mt-1">Monitor AI consumption and identify power users.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Daily Usage Chart Placeholder */}
                <div className="lg:col-span-2 bg-white p-8 rounded-2xl border border-neutral-100 shadow-sm flex flex-col h-[400px]">
                    <h3 className="text-lg font-bold text-neutral-900 mb-6 font-display">Daily Requests (Last 7 Days)</h3>
                    <div className="flex-1 flex items-stretch justify-between gap-2 pt-4">
                        {loading ? (
                            <div className="w-full flex items-center justify-center animate-pulse text-neutral-300">Loading metrics...</div>
                        ) : (
                            data?.dailyUsage.map((day, idx) => {
                                const maxCount = Math.max(...data.dailyUsage.map(d => d.count), 1);
                                const height = (day.count / maxCount) * 100;
                                return (
                                    <div key={idx} className="flex-1 flex flex-col justify-end items-center gap-2 group h-full">
                                            <div 
                                                className="w-full bg-emerald-100 rounded-t-md group-hover:bg-emerald-500 transition-all duration-1000 ease-out relative"
                                                style={{ 
                                                    height: animateBars ? `calc(${height}% - 24px)` : '0%', 
                                                    minHeight: animateBars ? '4px' : '0px',
                                                }}
                                            >
                                                <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-neutral-900 text-white text-[10px] py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                                                    {day.count}
                                                </div>
                                            </div>
                                            <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-tighter shrink-0">
                                                {day.date.split('-').slice(1).join('/')}
                                            </span>
                                        </div>
                                );
                            })
                        )}
                    </div>
                </div>

                {/* Top Users Card */}
                <div className="bg-white p-8 rounded-2xl border border-neutral-100 shadow-sm flex flex-col">
                    <h3 className="text-lg font-bold text-neutral-900 mb-6 font-display">Top Users</h3>
                    <div className="space-y-4 flex-1">
                        {loading ? (
                             [1, 2, 3, 4, 5].map((i) => (
                                <div key={i} className="flex items-center gap-3 animate-pulse">
                                    <div className="w-8 h-8 bg-neutral-100 rounded-full"></div>
                                    <div className="flex-1 space-y-2">
                                        <div className="h-3 bg-neutral-100 rounded w-1/2"></div>
                                        <div className="h-2 bg-neutral-50 rounded w-full"></div>
                                    </div>
                                </div>
                            ))
                        ) : data?.topUsers.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-center opacity-50">
                                <p className="text-sm font-medium text-neutral-400">No AI usage data yet</p>
                            </div>
                        ) : (
                            data?.topUsers.map((user, idx) => (
                                <div key={idx} className="flex items-center justify-between group">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-neutral-50 flex items-center justify-center text-[10px] font-bold text-neutral-400 group-hover:bg-emerald-50 group-hover:text-emerald-600 transition-colors">
                                            {idx + 1}
                                        </div>
                                        <div>
                                            <p className="text-sm font-semibold text-neutral-900 leading-none">{user.name || 'Anonymous'}</p>
                                            <p className="text-[10px] text-neutral-400 mt-1 truncate max-w-[120px]">{user.email}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm font-bold text-neutral-900">{user.usageCount}</p>
                                        <p className="text-[10px] text-neutral-400 font-bold uppercase tracking-widest">reqs</p>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                    <button className="mt-6 w-full py-2 bg-neutral-50 text-neutral-500 text-xs font-bold rounded-xl hover:bg-neutral-100 hover:text-neutral-900 transition-all uppercase tracking-widest">
                        View Full Report
                    </button>
                </div>
            </div>
        </div>
    );
}
