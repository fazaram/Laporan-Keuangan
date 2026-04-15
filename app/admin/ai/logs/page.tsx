'use client';

import React, { useEffect, useState } from 'react';
import { DataTable } from '@/components/admin/DataTable';
import { formatDate } from '@/lib/utils';

interface AiLog {
    id: string;
    userId: string;
    role: string;
    content: string;
    createdAt: string;
    user: {
        name: string | null;
        email: string;
    };
}

export default function AiLogsPage() {
    const [logs, setLogs] = useState<AiLog[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchLogs();
    }, []);

    const fetchLogs = async () => {
        try {
            const res = await fetch('/api/admin/ai/logs');
            const data = await res.json();
            setLogs(data);
        } catch (error) {
            console.error('Failed to fetch AI logs:', error);
        } finally {
            setLoading(false);
        }
    };

    const columns = [
        {
            header: 'User',
            accessor: (log: AiLog) => (
                <div>
                    <p className="font-semibold text-neutral-900 leading-none">{log.user.name || 'N/A'}</p>
                    <p className="text-[10px] text-neutral-400 mt-1 uppercase tracking-wider">{log.user.email}</p>
                </div>
            ),
        },
        {
            header: 'Role',
            accessor: (log: AiLog) => (
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest ${
                    log.role === 'user' ? 'bg-blue-50 text-blue-600' : 'bg-emerald-50 text-emerald-600'
                }`}>
                    {log.role}
                </span>
            ),
        },
        {
            header: 'Content',
            className: 'max-w-md',
            accessor: (log: AiLog) => (
                <div className="truncate text-xs text-neutral-500" title={log.content}>
                    {log.content}
                </div>
            ),
        },
        {
            header: 'Timestamp',
            accessor: (log: AiLog) => formatDate(log.createdAt),
        },
    ];

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold text-neutral-900 tracking-tight">AI Interaction Logs</h1>
                <p className="text-neutral-500 mt-1">Audit the prompts and responses between users and Solvia AI.</p>
            </div>

            <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-neutral-100 shadow-sm">
                    <div className="relative flex-1 max-w-sm">
                        <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-neutral-400">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </span>
                        <input 
                            type="text" 
                            placeholder="Search logs..." 
                            className="w-full bg-neutral-50 border-neutral-200 rounded-xl py-2 pl-9 pr-4 text-xs focus:bg-white focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all"
                        />
                    </div>
                </div>

                <DataTable 
                    data={logs} 
                    columns={columns} 
                    loading={loading}
                    emptyMessage="No AI logs found in the system."
                />
            </div>
        </div>
    );
}
