'use client';

import { useState, useEffect } from 'react';
import { formatCurrency } from '@/lib/utils';
import { 
    X, ArrowLeft, Search, Plus, ArrowUpRight, Send, 
    Calendar, MoreHorizontal, Copy, Link2, Info, Loader2, Trash2, AlertCircle
} from 'lucide-react';

interface WalletHistoryViewProps {
    wallet: any;
    allWallets: any[];
    availableBalance: number;
    onClose: () => void;
    onRefresh: () => void;
}

export function WalletHistoryView({ wallet, allWallets, availableBalance, onClose, onRefresh }: WalletHistoryViewProps) {
    const [history, setHistory] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    
    // Inline Action States
    const [activeAction, setActiveAction] = useState<'TOPUP' | 'WITHDRAW' | 'TRANSFER' | null>(null);
    const [amount, setAmount] = useState('');
    const [sourceId, setSourceId] = useState('MAIN'); // For TOPUP
    const [targetId, setTargetId] = useState(''); // For TRANSFER
    const [actionLoading, setActionLoading] = useState(false);
    const [error, setError] = useState('');
    const [deletingId, setDeletingId] = useState<string | null>(null);

    const fetchHistory = async () => {
        try {
            setLoading(true);
            const res = await fetch(`/api/wallets/${wallet.id}/history`);
            const data = await res.json();
            setHistory(data.history || []);
        } catch (error) {
            console.error('Error fetching history:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchHistory();
    }, [wallet.id]);

    const handleDelete = async (item: any) => {
        if (!confirm('Hapus transaksi ini? Saldo akan dikembalikan secara otomatis.')) return;
        
        try {
            setDeletingId(item.id);
            const endpoint = item.isInternal 
                ? `/api/wallets/transactions/${item.id}` 
                : `/api/transactions/${item.id}`;

            const res = await fetch(endpoint, {
                method: 'DELETE'
            });
            
            const data = await res.json();
            if (data.error) throw new Error(data.error);
            
            onRefresh(); // Refresh wallets in parent
            fetchHistory(); // Refresh local history
        } catch (err: any) {
            alert(err.message);
        } finally {
            setDeletingId(null);
        }
    };

    const handleAction = async () => {
        if (!amount || isNaN(Number(amount))) return;
        
        try {
            setActionLoading(true);
            setError('');
            
            let endpoint = '';
            let body: any = { amount: Number(amount) };

            if (activeAction === 'TOPUP') {
                if (sourceId === 'MAIN') {
                    endpoint = '/api/wallets/topup';
                    body.walletId = wallet.id;
                } else {
                    endpoint = '/api/wallets/transfer';
                    body.fromWalletId = sourceId;
                    body.toWalletId = wallet.id;
                }
            } else if (activeAction === 'TRANSFER') {
                endpoint = '/api/wallets/transfer';
                body.fromWalletId = wallet.id;
                body.toWalletId = targetId;
            } else {
                endpoint = '/api/wallets/withdraw';
                body.walletId = wallet.id;
            }

            const res = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });
            
            const data = await res.json();
            if (data.error) throw new Error(data.error);
            
            // Success!
            setAmount('');
            setSourceId('MAIN');
            setActiveAction(null);
            onRefresh(); // Refresh wallets in parent
            fetchHistory(); // Refresh local history
        } catch (err: any) {
            setError(err.message);
        } finally {
            setActionLoading(false);
        }
    };

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
        <div className="fixed inset-0 z-[60] flex justify-end overflow-hidden">
            {/* Backdrop */}
            <div 
                className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm animate-in fade-in duration-300"
                onClick={onClose}
            />

            {/* Slide-over Panel */}
            <div className="relative w-full max-w-2xl bg-[#F8FAFC] shadow-2xl flex flex-col h-full animate-in slide-in-from-right duration-500 ease-out">
                {/* Header */}
                <header className="bg-white px-8 py-6 flex items-center justify-between border-b border-gray-100 z-10 shadow-sm">
                    <div className="flex items-center gap-5">
                        <div 
                            className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shadow-sm"
                            style={{ backgroundColor: wallet.color + '20', color: wallet.color }}
                        >
                            <span>{wallet.icon || '💼'}</span>
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-gray-900 tracking-tight">{wallet.name}</h2>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-0.5">Pocket Management</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-3 hover:bg-gray-50 rounded-full transition-all active:scale-95 text-gray-400">
                        <X size={24} strokeWidth={2.5} />
                    </button>
                </header>

                <div className="flex-1 overflow-y-auto no-scrollbar">
                    <div className="p-6 space-y-6">
                        {/* Section 1: Balance Summary */}
                        <section className="bg-white rounded-[2.5rem] p-8 shadow-[0_8px_30px_rgb(0,0,0,0.02)] border border-gray-100/50 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-500/5 to-blue-500/5 rounded-full -mr-16 -mt-16 blur-2xl group-hover:scale-110 transition-transform duration-700" />
                            
                            <div className="relative z-10 text-center">
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.25em] mb-4">Current Balance</p>
                                <p className="text-5xl font-black text-gray-900 tracking-tighter drop-shadow-sm">
                                    {formatCurrency(wallet.balance)}
                                </p>
                            </div>
                        </section>

                        {/* Section 2: Quick Actions */}
                        <section className="space-y-6">
                            {!activeAction ? (
                                <div className="grid grid-cols-3 gap-4">
                                    <QuickActionButton icon={<Plus size={22} />} label="Top Up" color="green" onClick={() => setActiveAction('TOPUP')} />
                                    <QuickActionButton icon={<ArrowUpRight size={22} />} label="Withdraw" color="red" onClick={() => setActiveAction('WITHDRAW')} />
                                    <QuickActionButton icon={<Send size={22} />} label="Transfer" color="blue" onClick={() => {
                                        setActiveAction('TRANSFER');
                                        const firstOther = allWallets.find(w => w.id !== wallet.id);
                                        if (firstOther) setTargetId(firstOther.id);
                                    }} />
                                </div>
                            ) : (
                                <div className="bg-white rounded-[2.5rem] p-8 shadow-[0_30px_80px_rgba(0,0,0,0.1)] border border-gray-100 animate-in zoom-in-95 fade-in duration-300">
                                    <div className="flex items-center justify-between mb-8">
                                        <div>
                                            <h3 className="font-black text-gray-900 text-xl tracking-tighter uppercase">
                                                {activeAction === 'TOPUP' ? 'Top Up' : activeAction === 'WITHDRAW' ? 'Withdraw' : 'Transfer'}
                                            </h3>
                                        </div>
                                        <button onClick={() => { setActiveAction(null); setAmount(''); setError(''); }} className="p-2 hover:bg-gray-100 rounded-full transition-all text-gray-400">
                                            <X size={20} strokeWidth={2.5} />
                                        </button>
                                    </div>
                                    
                                    <div className="space-y-6">
                                        {activeAction === 'TOPUP' && (
                                            <div>
                                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-3 px-1">Source</label>
                                                <select 
                                                    value={sourceId}
                                                    onChange={(e) => setSourceId(e.target.value)}
                                                    className="w-full px-6 py-4 bg-gray-50 border-2 border-transparent focus:border-gray-900 focus:bg-white rounded-2xl outline-none transition-all font-black text-gray-900 appearance-none"
                                                >
                                                    <option value="MAIN">Saldo: {formatCurrency(availableBalance)}</option>
                                                    {allWallets.filter(w => w.id !== wallet.id).map(w => (
                                                        <option key={w.id} value={w.id}>{w.name}: {formatCurrency(w.balance)}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        )}

                                        {activeAction === 'TRANSFER' && (
                                            <div>
                                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-3 px-1">Target Pocket</label>
                                                <select 
                                                    value={targetId}
                                                    onChange={(e) => setTargetId(e.target.value)}
                                                    className="w-full px-6 py-4 bg-gray-50 border-2 border-transparent focus:border-gray-900 focus:bg-white rounded-2xl outline-none transition-all font-black text-gray-900 appearance-none"
                                                >
                                                    {allWallets.filter(w => w.id !== wallet.id).map(w => (
                                                        <option key={w.id} value={w.id}>{w.name}: {formatCurrency(w.balance)}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        )}

                                        <div>
                                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-3 px-1">Amount</label>
                                            <div className="relative group">
                                                <span className="absolute left-6 top-1/2 -translate-y-1/2 font-black text-gray-300 group-focus-within:text-gray-900 text-xl transition-colors">Rp</span>
                                                <input 
                                                    type="number" 
                                                    value={amount}
                                                    onChange={(e) => setAmount(e.target.value)}
                                                    placeholder="0"
                                                    autoFocus
                                                    className="w-full pl-16 pr-6 py-5 bg-gray-50 border-2 border-transparent focus:border-gray-900 focus:bg-white rounded-2xl outline-none transition-all text-2xl font-black"
                                                />
                                            </div>
                                        </div>
                                        
                                        {error && <p className="text-red-500 text-[10px] font-black uppercase tracking-widest px-1">{error}</p>}
                                        
                                        <button 
                                            onClick={handleAction}
                                            disabled={actionLoading || !amount}
                                            className="w-full py-5 bg-gray-900 text-white rounded-2xl font-black shadow-lg hover:bg-black transition-all active:scale-[0.98] disabled:opacity-30 flex items-center justify-center gap-3"
                                        >
                                            {actionLoading ? <Loader2 className="animate-spin" size={24} /> : <span>Confirm Transaction</span>}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </section>

                        {/* Section 3: History Feed */}
                        <section className="bg-white rounded-[2.5rem] p-6 shadow-[0_8px_30px_rgb(0,0,0,0.02)] border border-gray-100/50">
                            <div className="flex items-center justify-between mb-8 px-2">
                                <h3 className="text-[11px] font-black text-gray-900 uppercase tracking-[0.2em]">Transaction History</h3>
                                <div className="flex items-center gap-4">
                                    <div className="relative group">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-gray-900 transition-colors" size={14} />
                                        <input 
                                            type="text" 
                                            placeholder="Search..."
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            className="w-32 pl-9 pr-4 py-2 bg-gray-50 border-none rounded-xl outline-none text-[10px] font-bold focus:w-48 transition-all"
                                        />
                                    </div>
                                </div>
                            </div>

                            {loading ? (
                                <div className="flex flex-col items-center justify-center py-20 text-gray-400 gap-4">
                                    <Loader2 className="animate-spin" size={32} />
                                    <p className="text-[10px] font-black uppercase tracking-widest">Updating Feed</p>
                                </div>
                            ) : (
                                <div className="space-y-10">
                                    {Object.entries(groupedHistory).map(([month, items]: any) => (
                                        <div key={month} className="space-y-4">
                                            <div className="flex items-center gap-4 px-2">
                                                <span className="text-[9px] font-black text-gray-300 uppercase tracking-[0.3em] whitespace-nowrap">{month}</span>
                                                <div className="h-px w-full bg-gray-50" />
                                            </div>
                                            <div className="space-y-2">
                                                {items.map((item: any) => (
                                                    <HistoryItem 
                                                        key={item.id} 
                                                        item={item} 
                                                        onDelete={() => handleDelete(item)}
                                                        isDeleting={deletingId === item.id}
                                                    />
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                    
                                    {!loading && filteredHistory.length === 0 && (
                                        <div className="text-center py-20 text-gray-300">
                                            <p className="text-xs font-black uppercase tracking-widest">No matching history</p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </section>
                    </div>
                </div>
            </div>
        </div>
    );
}



function QuickActionButton({ icon, label, color, onClick }: { icon: any, label: string, color: 'green' | 'red' | 'blue', onClick: () => void }) {
    const themes = {
        green: 'bg-green-50 text-green-600 hover:bg-green-600 hover:text-white ring-green-100',
        red: 'bg-red-50 text-red-600 hover:bg-red-600 hover:text-white ring-red-100',
        blue: 'bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white ring-blue-100'
    };

    return (
        <button 
            onClick={onClick}
            className="flex-1 max-w-[140px] flex flex-col items-center justify-center gap-3 py-6 bg-white rounded-[2rem] shadow-[0_10px_25px_rgba(0,0,0,0.03)] border border-gray-100 transition-all hover:-translate-y-1 hover:shadow-xl active:scale-95 group"
        >
            <div className={`w-12 h-12 rounded-[1.25rem] flex items-center justify-center transition-all duration-300 ring-4 ${themes[color]}`}>
                {icon}
            </div>
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 group-hover:text-gray-900 transition-colors">{label}</span>
        </button>
    );
}

function HistoryItem({ item, onDelete, isDeleting }: { item: any, onDelete: () => void, isDeleting: boolean }) {
    const isPositive = item.isPositive;
    const date = new Date(item.date);
    const day = date.getDate();
    const month = date.toLocaleString('default', { month: 'short' });

    return (
        <div className="bg-white p-5 rounded-[2rem] flex items-center justify-between hover:shadow-[0_15px_35px_rgba(0,0,0,0.05)] transition-all duration-500 group border border-transparent hover:border-gray-50 relative overflow-hidden">
            <div className="flex items-center gap-5">
                <div className="w-14 h-14 bg-gray-50 rounded-[1.5rem] flex items-center justify-center text-2xl group-hover:bg-gray-900 group-hover:text-white transition-all duration-500 shadow-inner">
                    {item.type === 'TRANSFER' ? '🔄' : item.type === 'TOPUP' ? '💰' : item.type === 'WITHDRAW' ? '🏧' : '📉'}
                </div>
                <div>
                    <div className="flex items-center gap-2">
                        <h4 className="font-black text-gray-900 leading-tight tracking-tight">{item.description}</h4>
                        {isDeleting && <Loader2 size={12} className="animate-spin text-gray-400" />}
                    </div>
                    <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">{day} {month} • {item.isInternal ? 'Pocket Move' : 'External'}</p>
                </div>
            </div>
            
            <div className="flex items-center gap-6">
                <div className="text-right">
                    <p className={`font-black text-xl tracking-tighter ${isPositive ? 'text-green-600' : 'text-gray-900'}`}>
                        {isPositive ? '+' : '-'}{formatCurrency(item.amount)}
                    </p>
                    <div className="flex items-center justify-end gap-1.5 mt-1">
                        <div className={`w-1.5 h-1.5 rounded-full ${isPositive ? 'bg-green-500' : 'bg-gray-300'}`} />
                        <p className="text-[9px] font-black text-gray-300 uppercase tracking-tighter">Verified</p>
                    </div>
                </div>

                <button 
                    onClick={(e) => { e.stopPropagation(); onDelete(); }}
                    disabled={isDeleting}
                    className="p-3 bg-red-50 text-red-400 rounded-2xl opacity-0 group-hover:opacity-100 hover:bg-red-500 hover:text-white transition-all active:scale-90 disabled:opacity-30"
                >
                    <Trash2 size={18} />
                </button>
            </div>
        </div>
    );
}
