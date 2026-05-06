'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { DataTable } from '@/components/admin/DataTable';
import { formatCurrency, formatDate, formatDateTime } from '@/lib/utils';
import { useSearchParams } from 'next/navigation';

interface AuditLog {
    id: string;
    action: string;
    entityType: string;
    entityId: string;
    oldData: any;
    newData: any;
    createdAt: string;
    user: {
        name: string | null;
        email: string;
    };
}

function AuditLogsContent() {
    const searchParams = useSearchParams();
    const userIdParam = searchParams.get('userId');

    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [total, setTotal] = useState(0);
    const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
    const [filters, setFilters] = useState({
        action: '',
        entityType: 'Transaction',
        userId: userIdParam || '',
        limit: 50,
        offset: 0
    });
    const [sortConfig, setSortConfig] = useState<{
        key: keyof AuditLog | 'adminName';
        direction: 'asc' | 'desc';
    }>({ key: 'createdAt', direction: 'desc' });

    useEffect(() => {
        fetchLogs();
    }, [filters]);

    const fetchLogs = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                action: filters.action,
                entityType: filters.entityType,
                userId: filters.userId,
                limit: filters.limit.toString(),
                offset: filters.offset.toString(),
            });

            const res = await fetch(`/api/audit?${params.toString()}`);
            const data = await res.json();
            setLogs(data.logs || []);
            setTotal(data.total || 0);
        } catch (error) {
            console.error('Failed to fetch audit logs:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSort = (key: any) => {
        let direction: 'asc' | 'desc' = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const columns = [
        {
            header: 'Admin',
            sortKey: 'adminName' as any,
            accessor: (log: AuditLog) => (
                <div>
                    <p className="font-semibold text-neutral-900 leading-none">{log.user.name || 'Admin'}</p>
                    <p className="text-[10px] text-neutral-400 mt-1 uppercase tracking-wider">{log.user.email}</p>
                </div>
            ),
        },
        {
            header: 'Action',
            sortKey: 'action' as any,
            accessor: (log: AuditLog) => (
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest ${
                    log.action === 'CREATE' ? 'bg-emerald-50 text-emerald-600' : 
                    log.action === 'UPDATE' ? 'bg-blue-50 text-blue-600' : 'bg-red-50 text-red-600'
                }`}>
                    {log.action}
                </span>
            ),
        },
        {
            header: 'Resource',
            sortKey: 'entityType' as any,
            accessor: (log: AuditLog) => (
                <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-neutral-900">{log.entityType}</span>
                    <span className="text-[10px] text-neutral-400 font-mono">#{log.entityId.slice(0, 8)}</span>
                </div>
            ),
        },
        {
            header: 'Timestamp',
            sortKey: 'createdAt' as any,
            accessor: (log: AuditLog) => formatDateTime(log.createdAt),
        },
        {
            header: 'Details',
            className: 'text-right',
            accessor: (log: AuditLog) => (
                <button 
                    onClick={() => setSelectedLog(log)}
                    className="text-xs font-bold text-emerald-600 hover:text-emerald-700 hover:underline transition-all"
                >
                    View Diff
                </button>
            ),
        },
    ];

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-neutral-900 tracking-tight">System Audit logs</h1>
                    <p className="text-neutral-500 mt-1">Detailed record of every administrative action and data modification.</p>
                </div>
                <div className="bg-neutral-900 text-white px-4 py-2 rounded-xl">
                    <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Total Events</p>
                    <p className="text-xl font-bold">{total}</p>
                </div>
            </div>

            <div className="flex flex-col gap-4">
                <div className="bg-white p-4 rounded-2xl border border-neutral-100 shadow-sm flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <select 
                            value={filters.action}
                            onChange={(e) => setFilters(f => ({ ...f, action: e.target.value, offset: 0 }))}
                            className="bg-neutral-50 border-neutral-200 rounded-xl py-2 px-4 text-xs font-semibold outline-none"
                        >
                            <option value="">All Actions</option>
                            <option value="CREATE">Create</option>
                            <option value="UPDATE">Update</option>
                            <option value="DELETE">Delete</option>
                        </select>
                        <select 
                            value={filters.entityType}
                            onChange={(e) => setFilters(f => ({ ...f, entityType: e.target.value, offset: 0 }))}
                            className="bg-neutral-50 border-neutral-200 rounded-xl py-2 px-4 text-xs font-semibold outline-none"
                        >
                            <option value="Transaction">Transactions</option>
                            <option value="Goal">Goals</option>
                            <option value="Wallet">Wallets</option>
                            <option value="User">Users</option>
                        </select>
                    </div>
                </div>

                <DataTable 
                    data={[...logs].sort((a, b) => {
                        let aValue: any;
                        let bValue: any;
                        
                        if (sortConfig.key === 'adminName') {
                            aValue = a.user.name || a.user.email;
                            bValue = b.user.name || b.user.email;
                        } else {
                            aValue = a[sortConfig.key as keyof AuditLog];
                            bValue = b[sortConfig.key as keyof AuditLog];
                        }
                        
                        if (aValue === bValue) return 0;
                        
                        if (sortConfig.direction === 'asc') {
                            return aValue < bValue ? -1 : 1;
                        } else {
                            return aValue > bValue ? -1 : 1;
                        }
                    })} 
                    columns={columns} 
                    loading={loading}
                    emptyMessage="No audit logs match your filters."
                    onSort={handleSort}
                    sortKey={sortConfig.key as any}
                    sortDirection={sortConfig.direction}
                />
            </div>

            {/* Diff Modal */}
            {selectedLog && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-neutral-900/60 backdrop-blur-sm" onClick={() => setSelectedLog(null)}></div>
                    <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl relative z-10 overflow-hidden flex flex-col max-h-[80vh]">
                        <div className="p-6 border-b border-neutral-100 flex items-center justify-between bg-neutral-50/50">
                            <div>
                                <h3 className="text-xl font-bold text-neutral-900">Changeset Detail</h3>
                                <p className="text-xs text-neutral-500 mt-1 uppercase tracking-widest font-semibold">
                                    {selectedLog.action} {selectedLog.entityType} #{selectedLog.entityId.slice(0, 8)}
                                </p>
                            </div>
                            <button 
                                onClick={() => setSelectedLog(null)}
                                className="p-2 hover:bg-neutral-200 rounded-xl transition-all text-neutral-400"
                            >
                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        
                        <div className="flex-1 overflow-y-auto p-8 space-y-8">
                            <div className="grid grid-cols-2 gap-8">
                                <div className="space-y-4">
                                    <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">Original Data</p>
                                    <pre className="bg-neutral-50 p-4 rounded-xl text-[10px] font-mono text-neutral-600 overflow-x-auto whitespace-pre-wrap leading-relaxed border border-neutral-100">
                                        {selectedLog.oldData ? JSON.stringify(selectedLog.oldData, null, 2) : 'No previous data'}
                                    </pre>
                                </div>
                                <div className="space-y-4">
                                    <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Modified Data</p>
                                    <pre className="bg-emerald-50/30 p-4 rounded-xl text-[10px] font-mono text-neutral-900 overflow-x-auto whitespace-pre-wrap leading-relaxed border border-emerald-100">
                                        {selectedLog.newData ? JSON.stringify(selectedLog.newData, null, 2) : 'No data recorded'}
                                    </pre>
                                </div>
                            </div>
                            
                            <div className="pt-6 border-t border-neutral-100">
                                <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-widest text-neutral-400">
                                    <span>Modified by: {selectedLog.user.name || selectedLog.user.email}</span>
                                    <span>Date: {formatDateTime(selectedLog.createdAt)}</span>
                                </div>
                            </div>
                        </div>
                        
                        <div className="p-6 bg-neutral-50/50 border-t border-neutral-100 flex justify-end">
                            <button 
                                onClick={() => setSelectedLog(null)}
                                className="px-6 py-2.5 bg-neutral-900 text-white text-xs font-bold rounded-xl hover:bg-neutral-800 transition-all uppercase tracking-widest"
                            >
                                Close Details
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default function AuditLogsPage() {
    return (
        <Suspense fallback={
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
            </div>
        }>
            <AuditLogsContent />
        </Suspense>
    );
}

