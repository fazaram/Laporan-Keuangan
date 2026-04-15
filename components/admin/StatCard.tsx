'use client';

import React from 'react';

interface StatCardProps {
    title: string;
    value: string | number;
    description?: string;
    icon: React.ReactNode;
    trend?: {
        value: number;
        isUp: boolean;
    };
    loading?: boolean;
}

export function StatCard({ title, value, description, icon, trend, loading }: StatCardProps) {
    if (loading) {
        return (
            <div className="bg-white p-6 rounded-2xl border border-neutral-100 animate-pulse">
                <div className="flex justify-between items-start mb-4">
                    <div className="w-10 h-10 bg-neutral-100 rounded-xl"></div>
                    <div className="w-16 h-4 bg-neutral-100 rounded-lg"></div>
                </div>
                <div className="w-24 h-8 bg-neutral-100 rounded-lg mb-2"></div>
                <div className="w-32 h-4 bg-neutral-100 rounded-lg"></div>
            </div>
        );
    }

    return (
        <div className="bg-white p-6 rounded-2xl border border-neutral-100 hover:shadow-xl hover:shadow-neutral-200/40 transition-all duration-300 group">
            <div className="flex justify-between items-start mb-4">
                <div className="w-12 h-12 bg-neutral-50 rounded-xl flex items-center justify-center text-neutral-600 group-hover:bg-emerald-50 group-hover:text-emerald-600 transition-colors duration-300">
                    {icon}
                </div>
                {trend && (
                    <div className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold ${
                        trend.isUp ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'
                    }`}>
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path 
                                strokeLinecap="round" 
                                strokeLinejoin="round" 
                                strokeWidth={3} 
                                d={trend.isUp ? "M5 10l7-7m0 0l7 7m-7-7v18" : "M19 14l-7 7m0 0l-7-7m7 7V3"} 
                            />
                        </svg>
                        {trend.value}%
                    </div>
                )}
            </div>
            
            <div>
                <p className="text-sm font-medium text-neutral-500 mb-1">{title}</p>
                <h3 className="text-2xl font-bold text-neutral-900 tracking-tight">{value}</h3>
                {description && (
                    <p className="text-xs text-neutral-400 mt-2 flex items-center gap-1">
                        {description}
                    </p>
                )}
            </div>
        </div>
    );
}
