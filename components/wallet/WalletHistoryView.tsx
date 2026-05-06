'use client';

import { useState, useEffect } from 'react';
import { formatCurrency } from '@/lib/utils';
import { 
    X, ArrowLeft, Search, Plus, ArrowUpRight, Send, 
    Calendar, MoreHorizontal, Copy, Link2, Info, Loader2
} from 'lucide-react';

interface WalletHistoryViewProps {
    wallet: any;
    onClose: () => void;
    onTopUp: () => void;
    onWithdraw: () => void;
    onTransfer: () => void;
}

export function WalletHistoryView({ wallet, onClose, onTopUp, onWithdraw, onTransfer }: WalletHistoryViewProps) {
    const [history, setHistory] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        const fetchHistory = async () => {
            try {
                const res = await fetch(`/api/wallets/${wallet.id}/history`);
                const data = await res.json();
                setHistory(data.history || []);
            } catch (error) {
                console.error('Error fetching history:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchHistory();
    }, [wallet.id]);

    const filteredHistory = history.filter(item => 
        item.description.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Group history by month
    const groupedHistory = filteredHistory.reduce((groups: any, item) => {
        const date = new Date(item.date);
        const monthYear = date.toLocaleString('default', { month: 'short', year: 'numeric' }).toUpperCase();
        if (!groups[monthYear]) groups[monthYear] = [];
        groups[monthYear].push(item);
        return groups;
    }, {});

    return (
        <div className="fixed inset-0 z-[60] bg-gray-50 flex flex-col h-screen animate-in slide-in-from-right duration-300">
            {/* Header */}
            <header className="bg-white px-6 py-4 flex items-center justify-between border-b border-gray-100">
                <div className="flex items-center gap-4">
                    <button onClick={onClose} className="p-2 hover:bg-gray-50 rounded-full transition-colors">
                        <ArrowLeft size={24} />
                    </button>
                    <h2 className="text-xl font-bold text-gray-900">Pocket Details</h2>
                </div>
                <button className="p-2 hover:bg-gray-50 rounded-full transition-colors">
                    <MoreHorizontal size={24} />
                </button>
            </header>

            <div className="flex-1 overflow-y-auto no-scrollbar">
                <div className="max-w-3xl mx-auto px-6 py-10">
                    {/* Hero Section */}
                    <div className="flex flex-col items-center text-center mb-10">
                        <div 
                            className="w-24 h-24 rounded-[2.5rem] flex items-center justify-center text-6xl mb-8 shadow-xl ring-8 ring-white"
                            style={{ backgroundColor: wallet.color }}
                        >
                            <span>{wallet.icon || '💼'}</span>
                        </div>
                        <h1 className="text-4xl font-black text-gray-900 mb-2 tracking-tight">{wallet.name}</h1>
                        <p className="text-5xl font-black text-gray-900 tracking-tighter">
                            {formatCurrency(wallet.balance)}
                        </p>
                    </div>

                    {/* Quick Actions */}
                    <div className="flex justify-center gap-4 mb-12">
                        <button 
                            onClick={onTopUp}
                            className="flex-1 max-w-[180px] flex items-center justify-center gap-3 py-4 bg-white rounded-2xl shadow-sm border border-gray-100 hover:border-green-200 hover:bg-green-50/30 transition-all font-bold text-gray-900 group"
                        >
                            <div className="w-10 h-10 bg-green-100 text-green-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                                <Plus size={20} />
                            </div>
                            <span>Top Up</span>
                        </button>
                        
                        <button 
                            onClick={onWithdraw}
                            className="flex-1 max-w-[180px] flex items-center justify-center gap-3 py-4 bg-white rounded-2xl shadow-sm border border-gray-100 hover:border-red-200 hover:bg-red-50/30 transition-all font-bold text-gray-900 group"
                        >
                            <div className="w-10 h-10 bg-red-100 text-red-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                                <ArrowUpRight size={20} />
                            </div>
                            <span>Withdraw</span>
                        </button>
                    </div>

                    {/* History Section */}
                    <div className="space-y-8">
                        {/* History Search & Filter */}
                        <div className="flex items-center gap-3">
                            <div className="relative flex-1">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                                <input 
                                    type="text" 
                                    placeholder="Search transactions"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-12 pr-4 py-4 bg-gray-100/50 border-transparent rounded-2xl outline-none focus:bg-white transition-all text-sm font-medium"
                                />
                            </div>
                            <button className="p-4 bg-gray-100/50 rounded-2xl text-gray-900 hover:bg-gray-200 transition-all">
                                <Search size={20} className="rotate-90" />
                            </button>
                        </div>

                        {loading ? (
                            <div className="flex flex-col items-center justify-center py-20 text-gray-400 gap-4">
                                <Loader2 className="animate-spin" size={40} />
                                <p className="font-medium">Loading history...</p>
                            </div>
                        ) : (
                            Object.entries(groupedHistory).map(([month, items]: any) => (
                                <div key={month} className="space-y-4">
                                    <div className="flex justify-between items-center px-2">
                                        <h3 className="text-xs font-black text-gray-400 tracking-widest">{month}</h3>
                                        <span className="text-[10px] text-gray-300 font-bold">Updated Today, 23:05</span>
                                    </div>
                                    <div className="space-y-1">
                                        {items.map((item: any) => (
                                            <HistoryItem key={item.id} item={item} />
                                        ))}
                                    </div>
                                </div>
                            ))
                        )}
                        
                        {!loading && filteredHistory.length === 0 && (
                            <div className="text-center py-20 text-gray-400">
                                <p className="font-bold">No transactions found</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}


function HistoryItem({ item }: { item: any }) {
    const isPositive = item.isPositive;
    const date = new Date(item.date);
    const day = date.getDate();
    const month = date.toLocaleString('default', { month: 'short' });
    const year = date.getFullYear();

    return (
        <div className="bg-white p-4 rounded-2xl flex items-center justify-between hover:bg-gray-50 transition-colors group">
            <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center text-2xl group-hover:bg-white transition-colors">
                    {item.type === 'TRANSFER' ? '🔄' : item.type === 'TOPUP' ? '💰' : item.type === 'WITHDRAW' ? '🏧' : '📉'}
                </div>
                <div>
                    <h4 className="font-bold text-gray-900 leading-tight">{item.description}</h4>
                    <p className="text-xs text-gray-400 font-medium">{day} {month} {year}</p>
                </div>
            </div>
            <div className="text-right">
                <p className={`font-black text-lg ${isPositive ? 'text-green-600' : 'text-gray-900'}`}>
                    {isPositive ? '+' : '-'}{formatCurrency(item.amount)}
                </p>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">
                    {item.isInternal ? 'Pocket Move' : 'Outgoing'}
                </p>
            </div>
        </div>
    );
}
