'use client';

import React, { useEffect, useState } from 'react';
import { DataTable } from '@/components/admin/DataTable';
import { formatDate } from '@/lib/utils';

interface AuditLog {
    id: string;
    action: string;
    entityType: string;
    entityId: string;
    createdAt: string;
    user: {
        name: string | null;
        email: string;
    };
}

export default function AuditLogsPage() {
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [total, setTotal] = useState(0);
    const [filters, setFilters] = useState({
        action: '',
        entityType: 'Transaction',
        limit: 50,
        offset: 0
    });

    useEffect(() => {
        fetchLogs();
    }, [filters]);

    const fetchLogs = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                action: filters.action,
                entityType: filters.entityType,
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

    const columns = [
        {
            header: 'Admin',
            accessor: (log: AuditLog) => (
                <div>
                    <p className="font-semibold text-neutral-900 leading-none">{log.user.name || 'Admin'}</p>
                    <p className="text-[10px] text-neutral-400 mt-1 uppercase tracking-wider">{log.user.email}</p>
                </div>
            ),
        },
        {
            header: 'Action',
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
            accessor: (log: AuditLog) => (
                <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-neutral-900">{log.entityType}</span>
                    <span className="text-[10px] text-neutral-400 font-mono">#{log.entityId.slice(0, 8)}</span>
                </div>
            ),
        },
        {
            header: 'Timestamp',
            accessor: (log: AuditLog) => formatDate(log.createdAt),
        },
        {
            header: 'Details',
            className: 'text-right',
            accessor: (log: AuditLog) => (
                <button className="text-xs font-bold text-emerald-600 hover:text-emerald-700 hover:underline transition-all">
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
                    data={logs} 
                    columns={columns} 
                    loading={loading}
                    emptyMessage="No audit logs match your filters."
                />
            </div>
        </div>
    );
}
