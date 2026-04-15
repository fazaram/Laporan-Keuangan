'use client';

import React from 'react';

interface Column<T> {
    header: string;
    accessor: keyof T | ((item: T) => React.ReactNode);
    className?: string;
}

interface DataTableProps<T> {
    data: T[];
    columns: Column<T>[];
    loading?: boolean;
    emptyMessage?: string;
}

export function DataTable<T extends { id: string | number }>({ 
    data, 
    columns, 
    loading, 
    emptyMessage = 'No data available' 
}: DataTableProps<T>) {
    if (loading) {
        return (
            <div className="w-full bg-white rounded-2xl border border-neutral-100 overflow-hidden">
                <div className="p-4 border-b border-neutral-100 bg-neutral-50/50">
                    <div className="h-6 w-48 bg-neutral-200 animate-pulse rounded-lg"></div>
                </div>
                <div className="p-8 space-y-4">
                    {[1, 2, 3, 4, 5].map((i) => (
                        <div key={i} className="flex gap-4">
                            <div className="h-4 flex-1 bg-neutral-100 animate-pulse rounded"></div>
                            <div className="h-4 flex-1 bg-neutral-100 animate-pulse rounded"></div>
                            <div className="h-4 flex-1 bg-neutral-100 animate-pulse rounded"></div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    if (data.length === 0) {
        return (
            <div className="w-full bg-white rounded-2xl border border-neutral-100 p-12 text-center">
                <div className="w-16 h-16 bg-neutral-50 rounded-full flex items-center justify-center mx-auto mb-4 text-neutral-400">
                    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-3.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                    </svg>
                </div>
                <p className="text-neutral-500 font-medium">{emptyMessage}</p>
            </div>
        );
    }

    return (
        <div className="w-full bg-white rounded-2xl border border-neutral-100 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-neutral-50/50 border-b border-neutral-100">
                            {columns.map((col, idx) => (
                                <th 
                                    key={idx} 
                                    className={`px-6 py-4 text-xs font-bold text-neutral-500 uppercase tracking-wider ${col.className || ''}`}
                                >
                                    {col.header}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-100">
                        {data.map((item) => (
                            <tr key={item.id} className="hover:bg-neutral-50/50 transition-colors group">
                                {columns.map((col, idx) => (
                                    <td key={idx} className={`px-6 py-4 text-sm text-neutral-600 ${col.className || ''}`}>
                                        {typeof col.accessor === 'function' 
                                            ? col.accessor(item) 
                                            : (item[col.accessor] as React.ReactNode)}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
