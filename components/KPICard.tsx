'use client';

import { ReactNode } from 'react';

interface KPICardProps {
    title: string;
    value: string;
    change?: number;
    changeLabel?: string;
    icon?: ReactNode;
    trend?: 'up' | 'down' | 'neutral';
}

export function KPICard({ title, value, change, changeLabel, icon, trend }: KPICardProps) {
    const getTrendColor = () => {
        if (!trend) return 'text-gray-600';
        if (trend === 'up') return 'text-green-600';
        if (trend === 'down') return 'text-red-600';
        return 'text-gray-600';
    };

    const getChangeIcon = () => {
        if (!change) return null;
        if (change > 0) return '↑';
        if (change < 0) return '↓';
        return '→';
    };

    return (
        <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-start justify-between">
                <div className="flex-1">
                    <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
                    <p className="text-2xl font-bold text-gray-900 mb-2">{value}</p>

                    {change !== undefined && (
                        <div className="flex items-center gap-2">
                            <span className={`text-sm font-semibold ${getTrendColor()}`}>
                                {getChangeIcon()} {Math.abs(change).toFixed(1)}%
                            </span>
                            {changeLabel && (
                                <span className="text-xs text-gray-500">{changeLabel}</span>
                            )}
                        </div>
                    )}
                </div>

                {icon && (
                    <div className="flex-shrink-0 ml-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-purple-100 rounded-lg flex items-center justify-center text-blue-600">
                            {icon}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
