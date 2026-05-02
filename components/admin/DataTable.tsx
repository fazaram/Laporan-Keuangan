'use client';

import React, { useState } from 'react';

interface Column<T> {
    header: string;
    accessor: keyof T | ((item: T) => React.ReactNode);
    className?: string;
    sortKey?: keyof T;
}

interface DataTableProps<T> {
    data: T[];
    columns: Column<T>[];
    loading?: boolean;
    emptyMessage?: string;
    onSort?: (key: keyof T) => void;
    sortKey?: keyof T;
    sortDirection?: 'asc' | 'desc';
    pageSize?: number;
}

export function DataTable<T extends { id: string | number }>({ 
    data, 
    columns, 
    loading, 
    emptyMessage = 'No data available',
    onSort,
    sortKey,
    sortDirection,
    pageSize = 10
}: DataTableProps<T>) {
    const [currentPage, setCurrentPage] = useState(1);

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
            <div className="w-full bg-white rounded-2xl border border-neutral-100 p-12 text-center shadow-sm">
                <div className="w-16 h-16 bg-neutral-50 rounded-full flex items-center justify-center mx-auto mb-4 text-neutral-400">
                    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-3.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                    </svg>
                </div>
                <p className="text-neutral-500 font-medium">{emptyMessage}</p>
            </div>
        );
    }

    // Pagination logic
    const totalPages = Math.ceil(data.length / pageSize);
    const paginatedData = data.slice((currentPage - 1) * pageSize, currentPage * pageSize);

    return (
        <div className="w-full bg-white rounded-2xl border border-neutral-100 overflow-hidden shadow-sm flex flex-col">
            <div className="overflow-x-auto flex-1">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-neutral-50/50 border-b border-neutral-100">
                            {columns.map((col, idx) => (
                                <th 
                                    key={idx} 
                                    className={`px-6 py-4 text-xs font-bold text-neutral-500 uppercase tracking-wider ${col.sortKey ? 'cursor-pointer hover:bg-neutral-100 transition-colors' : ''} ${col.className || ''}`}
                                    onClick={() => col.sortKey && onSort?.(col.sortKey)}
                                >
                                    <div className="flex items-center gap-1">
                                        {col.header}
                                        {col.sortKey && (
                                            <div className="flex flex-col">
                                                {sortKey === col.sortKey ? (
                                                    sortDirection === 'asc' ? (
                                                        <svg className="w-3 h-3 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 15l7-7 7 7" />
                                                        </svg>
                                                    ) : (
                                                        <svg className="w-3 h-3 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" />
                                                        </svg>
                                                    )
                                                ) : (
                                                    <svg className="w-3 h-3 text-neutral-300 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                                                    </svg>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-100">
                        {paginatedData.map((item) => (
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

            {/* Pagination Controls */}
            {totalPages > 1 && (
                <div className="p-4 border-t border-neutral-100 bg-neutral-50/30 flex items-center justify-between">
                    <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">
                        Showing {(currentPage - 1) * pageSize + 1} to {Math.min(currentPage * pageSize, data.length)} of {data.length} entries
                    </p>
                    <div className="flex items-center gap-2">
                        <button 
                            disabled={currentPage === 1}
                            onClick={() => setCurrentPage(prev => prev - 1)}
                            className="p-2 text-neutral-400 hover:text-emerald-600 disabled:opacity-30 disabled:hover:text-neutral-400 transition-colors"
                        >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                        </button>
                        <div className="flex items-center gap-1">
                            {Array.from({ length: totalPages }).map((_, i) => (
                                <button
                                    key={i}
                                    onClick={() => setCurrentPage(i + 1)}
                                    className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${
                                        currentPage === i + 1 
                                        ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-200' 
                                        : 'text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600'
                                    }`}
                                >
                                    {i + 1}
                                </button>
                            ))}
                        </div>
                        <button 
                            disabled={currentPage === totalPages}
                            onClick={() => setCurrentPage(prev => prev + 1)}
                            className="p-2 text-neutral-400 hover:text-emerald-600 disabled:opacity-30 disabled:hover:text-neutral-400 transition-colors"
                        >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

