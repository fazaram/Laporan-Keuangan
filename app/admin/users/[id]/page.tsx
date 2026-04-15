'use client';

import React, { useEffect, useState } from 'react';
import { formatCurrency, formatDate } from '@/lib/utils';
import Link from 'next/link';

interface UserDetail {
    id: string;
    name: string | null;
    email: string;
    role: string;
    status: string;
    bio: string | null;
    createdAt: string;
    stats: {
        balance: number;
        transactionsCount: number;
        goalsCount: number;
        walletCount: number;
        aiHistoryCount: number;
    };
}

export default function UserDetailPage({ params }: { params: { id: string } }) {
    const [user, setUser] = useState<UserDetail | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchUser();
    }, []);

    const fetchUser = async () => {
        try {
            const res = await fetch(`/api/admin/users/${params.id}`);
            const data = await res.json();
            setUser(data);
        } catch (error) {
            console.error('Failed to fetch user detail:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="p-8 text-neutral-400">Loading user profile...</div>;
    if (!user) return <div className="p-8 text-red-500">User not found</div>;

    const statsCards = [
        { label: 'Total Balance', value: formatCurrency(user.stats.balance), icon: '💰', color: 'bg-emerald-50 text-emerald-600' },
        { label: 'Transactions', value: user.stats.transactionsCount, icon: '📊', color: 'bg-blue-50 text-blue-600' },
        { label: 'Active Goals', value: user.stats.goalsCount, icon: '🎯', color: 'bg-purple-50 text-purple-600' },
        { label: 'Wallets', value: user.stats.walletCount, icon: '👛', color: 'bg-amber-50 text-amber-600' },
        { label: 'AI Usage', value: user.stats.aiHistoryCount, icon: '🤖', color: 'bg-neutral-900 text-white' },
    ];

    return (
        <div className="space-y-10">
            {/* Header & Back Button */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="flex items-center gap-4">
                    <Link 
                        href="/admin/users"
                        className="p-2 hover:bg-neutral-100 rounded-xl transition-all text-neutral-400 hover:text-neutral-900"
                    >
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                    </Link>
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-3xl font-bold text-neutral-900 tracking-tight">{user.name || 'Anonymous User'}</h1>
                            <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest ${
                                user.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'
                            }`}>
                                {user.status}
                            </span>
                        </div>
                        <p className="text-neutral-500 mt-1">{user.email}</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <button className="px-4 py-2 bg-neutral-100 text-neutral-600 text-xs font-bold rounded-xl hover:bg-neutral-200 transition-all uppercase tracking-widest">Suspend User</button>
                    <button className="px-4 py-2 bg-neutral-900 text-white text-xs font-bold rounded-xl hover:bg-neutral-800 transition-all shadow-lg shadow-neutral-200 uppercase tracking-widest">Reset Password</button>
                </div>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
                {statsCards.map((stat, idx) => (
                    <div key={idx} className="bg-white p-6 rounded-2xl border border-neutral-100 shadow-sm flex flex-col items-center text-center group hover:shadow-xl transition-all duration-300">
                        <div className={`w-12 h-12 ${stat.color} rounded-2xl flex items-center justify-center text-xl mb-4 group-hover:scale-110 transition-transform`}>
                            {stat.icon}
                        </div>
                        <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-1">{stat.label}</p>
                        <h4 className="text-xl font-bold text-neutral-900">{stat.value}</h4>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Profile Details */}
                <div className="lg:col-span-2 space-y-8">
                    <div className="bg-white p-8 rounded-2xl border border-neutral-100 shadow-sm">
                        <h3 className="text-lg font-bold text-neutral-900 mb-6 flex items-center gap-2 font-display">
                            <span className="w-2 h-6 bg-emerald-600 rounded-full"></span>
                            Account Information
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-y-8 gap-x-12">
                            <div>
                                <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-1">User ID</p>
                                <p className="text-sm font-mono text-neutral-600">{user.id}</p>
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-1">Role</p>
                                <p className="text-sm font-bold text-neutral-900">{user.role}</p>
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-1">Registration Date</p>
                                <p className="text-sm font-medium text-neutral-600">{formatDate(user.createdAt)}</p>
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-1">Bio/Description</p>
                                <p className="text-sm text-neutral-500">{user.bio || 'No biography provided.'}</p>
                            </div>
                        </div>
                    </div>
                    
                    <div className="bg-neutral-900 p-8 rounded-2xl border border-neutral-800 shadow-xl overflow-hidden relative group">
                        <div className="absolute right-0 top-0 w-32 h-32 bg-emerald-500/10 blur-3xl group-hover:bg-emerald-500/20 transition-all"></div>
                        <h3 className="text-lg font-bold text-white mb-4 relative z-10">Administrative Actions</h3>
                        <div className="flex flex-wrap gap-4 relative z-10">
                            <button className="px-4 py-2 bg-emerald-600/20 text-emerald-400 border border-emerald-600/30 text-[10px] font-bold rounded-lg hover:bg-emerald-600 hover:text-white transition-all uppercase tracking-widest">Force Sync Data</button>
                            <button className="px-4 py-2 bg-red-600/20 text-red-400 border border-red-600/30 text-[10px] font-bold rounded-lg hover:bg-red-600 hover:text-white transition-all uppercase tracking-widest">Wipe AI Threads</button>
                            <button className="px-4 py-2 bg-blue-600/20 text-blue-400 border border-blue-600/30 text-[10px] font-bold rounded-lg hover:bg-blue-600 hover:text-white transition-all uppercase tracking-widest">Impersonate User</button>
                        </div>
                    </div>
                </div>

                {/* Right Sidebar - Recent Activity Placeholder */}
                <div className="bg-white p-8 rounded-2xl border border-neutral-100 shadow-sm flex flex-col">
                     <h3 className="text-lg font-bold text-neutral-900 mb-6 font-display">Security Log</h3>
                     <div className="flex-1 space-y-6">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="flex gap-3">
                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0"></div>
                                <div>
                                    <p className="text-xs font-bold text-neutral-900 leading-tight">Successful Login</p>
                                    <p className="text-[10px] text-neutral-400 mt-1">Today at 10:4{i} AM from 192.168.1.{i}</p>
                                </div>
                            </div>
                        ))}
                     </div>
                     <Link href="/admin/logs/audit" className="mt-8 text-center text-[10px] font-black text-emerald-600 hover:text-emerald-700 uppercase tracking-widest transition-all">View All Activity</Link>
                </div>
            </div>
        </div>
    );
}
