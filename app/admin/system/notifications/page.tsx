'use client';

import React, { useEffect, useState } from 'react';
import { DataTable } from '@/components/admin/DataTable';
import { formatCurrency, formatDate, formatDateTime } from '@/lib/utils';
import { useToast } from '@/components/ToastProvider';

interface Broadcast {
    id: string;
    title: string;
    message: string;
    createdAt: string;
    author: { name: string | null };
}

export default function NotificationsPage() {
    const { showToast } = useToast();
    const [broadcasts, setBroadcasts] = useState<Broadcast[]>([]);
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [sortConfig, setSortConfig] = useState<{
        key: keyof Broadcast;
        direction: 'asc' | 'desc';
    }>({ key: 'createdAt', direction: 'desc' });
    
    // Form state
    const [title, setTitle] = useState('');
    const [message, setMessage] = useState('');

    useEffect(() => {
        fetchBroadcasts();
    }, []);

    const fetchBroadcasts = async () => {
        try {
            const res = await fetch('/api/admin/broadcasts');
            const data = await res.json();
            setBroadcasts(data);
        } catch (error) {
            console.error('Failed to fetch broadcasts:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title || !message) return;
        
        setSending(true);
        try {
            const res = await fetch('/api/admin/broadcasts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title, message }),
            });
            if (res.ok) {
                setTitle('');
                setMessage('');
                fetchBroadcasts();
                showToast('Broadcast sent successfully!', 'success');
            } else {
                const errorData = await res.json();
                showToast(`Failed to send broadcast: ${errorData.error || 'Unknown error'}`, 'error');
            }
        } catch (error) {
            console.error('Failed to send broadcast:', error);
            showToast('An error occurred while sending the broadcast.', 'error');
        } finally {
            setSending(false);
        }
    };

    const handleSort = (key: keyof Broadcast) => {
        let direction: 'asc' | 'desc' = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const columns = [
        {
            header: 'Title',
            sortKey: 'title' as keyof Broadcast,
            accessor: (b: Broadcast) => (
                <div className="max-w-xs">
                    <p className="font-bold text-neutral-900 truncate">{b.title}</p>
                    <p className="text-[10px] text-neutral-400 mt-1 uppercase tracking-widest font-black">ID: {b.id.slice(0, 8)}</p>
                </div>
            ),
        },
        {
            header: 'Message',
            sortKey: 'message' as keyof Broadcast,
            className: 'max-w-sm',
            accessor: (b: Broadcast) => (
                <p className="text-xs text-neutral-500 line-clamp-2">{b.message}</p>
            ),
        },
        {
            header: 'Sent By',
            accessor: (b: Broadcast) => (
                <span className="text-xs font-semibold text-neutral-600 italic">@{b.author.name || 'Admin'}</span>
            ),
        },
        {
            header: 'Date',
            sortKey: 'createdAt' as keyof Broadcast,
            accessor: (b: Broadcast) => formatDateTime(b.createdAt),
        },
    ];

    const filteredBroadcasts = broadcasts
        .filter(b => {
            return !searchQuery || 
                b.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                b.message.toLowerCase().includes(searchQuery.toLowerCase());
        })
        .sort((a, b) => {
            const aValue = a[sortConfig.key] || '';
            const bValue = b[sortConfig.key] || '';
            
            if (aValue === bValue) return 0;
            
            if (sortConfig.direction === 'asc') {
                return aValue < bValue ? -1 : 1;
            } else {
                return aValue > bValue ? -1 : 1;
            }
        });

    return (
        <div className="space-y-12">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-neutral-900 tracking-tight">Broadcast System</h1>
                    <p className="text-neutral-500 mt-1">Send global announcements to all Solvia Finance users.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-5 gap-10">
                {/* Form Section */}
                <div className="xl:col-span-2 space-y-6">
                    <div className="bg-white p-8 rounded-2xl border border-neutral-100 shadow-sm">
                        <h3 className="text-lg font-bold text-neutral-900 mb-6 flex items-center gap-2">
                            <span className="w-2 h-6 bg-emerald-600 rounded-full"></span>
                            New Announcement
                        </h3>
                        
                        <form onSubmit={handleSend} className="space-y-5">
                            <div>
                                <label className="block text-xs font-black text-neutral-400 uppercase tracking-[0.2em] mb-2">Announcement Title</label>
                                <input 
                                    type="text" 
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    placeholder="e.g. System Maintenance Update"
                                    className="w-full bg-neutral-50 border-neutral-200 rounded-xl py-3 px-4 text-sm font-semibold focus:bg-white focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-black text-neutral-400 uppercase tracking-[0.2em] mb-2">Message Body</label>
                                <textarea 
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                    placeholder="Describe the update or announcement details here..."
                                    rows={6}
                                    className="w-full bg-neutral-50 border-neutral-200 rounded-xl py-3 px-4 text-sm font-medium focus:bg-white focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all resize-none"
                                    required
                                ></textarea>
                            </div>
                            <button 
                                type="submit" 
                                disabled={sending}
                                className="w-full py-4 bg-emerald-600 text-white text-sm font-black rounded-xl hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-200/50 uppercase tracking-[0.2em] flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                                {sending ? (
                                    <span className="animate-pulse">Broadcasting...</span>
                                ) : (
                                    <>
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                                        </svg>
                                        Send Broadcast
                                    </>
                                )}
                            </button>
                        </form>
                    </div>
                </div>

                {/* History Section */}
                <div className="xl:col-span-3 space-y-4">
                    <div className="flex items-center justify-between">
                         <div className="flex items-center gap-3">
                             <h3 className="text-lg font-bold text-neutral-900 font-display">Broadcast History</h3>
                             <span className="text-[10px] font-black text-neutral-400 uppercase tracking-widest bg-neutral-100 px-2 py-1 rounded">{broadcasts.length} Sent</span>
                         </div>
                         <div className="relative max-w-xs w-full">
                             <input 
                                 type="text"
                                 placeholder="Search titles or messages..."
                                 value={searchQuery}
                                 onChange={(e) => setSearchQuery(e.target.value)}
                                 className="w-full bg-white border border-neutral-200 rounded-xl py-2 px-4 text-xs focus:ring-2 focus:ring-emerald-500/10 outline-none transition-all shadow-sm"
                             />
                         </div>
                    </div>
                    
                    <DataTable 
                        data={filteredBroadcasts} 
                        columns={columns} 
                        loading={loading}
                        emptyMessage="No announcements have been broadcasted yet."
                        onSort={handleSort}
                        sortKey={sortConfig.key}
                        sortDirection={sortConfig.direction}
                    />
                </div>
            </div>
        </div>
    );
}

