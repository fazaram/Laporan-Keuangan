'use client';

import { useState, useEffect } from 'react';
import { Navbar } from '@/components/Navbar';
import { BalanceOverview } from '@/components/wallet/BalanceOverview';
import { WalletCard } from '@/components/wallet/WalletCard';
import { WalletHistoryView } from '@/components/wallet/WalletHistoryView';
import { Plus, X, ArrowRight, Wallet as WalletIcon, RefreshCw, Loader2, MoreVertical, Search } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { useToast } from '@/components/ToastProvider';

export default function WalletPage() {
    const { showToast, showConfirm } = useToast();
    const [wallets, setWallets] = useState<any[]>([]);
    const [mainBalance, setMainBalance] = useState(0);
    const [availableBalance, setAvailableBalance] = useState(0);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Modal states
    const [modalType, setModalType] = useState<'CREATE' | 'EDIT' | 'TOPUP' | 'WITHDRAW' | 'TRANSFER' | null>(null);
    const [selectedWallet, setSelectedWallet] = useState<any>(null);
    const [historyWallet, setHistoryWallet] = useState<any>(null);

    // Keep historyWallet in sync with wallets array
    useEffect(() => {
        if (historyWallet) {
            const updated = wallets.find(w => w.id === historyWallet.id);
            if (updated) setHistoryWallet(updated);
        }
    }, [wallets, historyWallet?.id]);

    // Form states
    const [formData, setFormData] = useState({
        name: '',
        icon: '💰',
        color: '#3B82F6',
        amount: '',
        toWalletId: '',
        autoAllocateEnabled: false,
        autoAllocateDay: '',
        autoAllocateAmount: ''
    });

    const [searchQuery, setSearchQuery] = useState('');

    // Derived balances for Overview
    const totalBalance = mainBalance;
    const allocatedBalance = mainBalance - availableBalance;

    const fetchWallets = async () => {
        try {
            setLoading(true);
            const res = await fetch('/api/wallets');
            const data = await res.json();
            if (data.error) throw new Error(data.error);
            setWallets(data.wallets);
            setMainBalance(data.mainBalance);
            setAvailableBalance(data.availableBalance);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const triggerAutoAllocation = async () => {
        try {
            const res = await fetch('/api/wallets/auto-allocate', { method: 'POST' });
            const data = await res.json();
            if (data.processed > 0) {
                showToast(`Berhasil alokasi otomatis untuk ${data.processed} pocket`, 'success');
                fetchWallets();
            }
            if (data.errors?.length > 0) {
                data.errors.forEach((err: string) => showToast(err, 'error'));
            }
        } catch (err) {
            console.error('Failed to trigger auto allocation:', err);
        }
    };

    useEffect(() => {
        fetchWallets();
        triggerAutoAllocation();
    }, []);

    const resetForm = () => {
        setFormData({
            name: '',
            icon: '💰',
            color: '#3B82F6',
            amount: '',
            toWalletId: '',
            autoAllocateEnabled: false,
            autoAllocateDay: '',
            autoAllocateAmount: ''
        });
        setError(null);
    };

    const handleAction = async (e: React.FormEvent) => {
        e.preventDefault();
        setActionLoading(true);
        setError(null);

        try {
            let url = '';
            let method = 'POST';
            let body: any = {};

            switch (modalType) {
                case 'CREATE':
                    url = '/api/wallets';
                    body = { 
                        name: formData.name, 
                        icon: formData.icon, 
                        color: formData.color,
                        initialAmount: formData.amount,
                        autoAllocateEnabled: formData.autoAllocateEnabled,
                        autoAllocateDay: formData.autoAllocateDay,
                        autoAllocateAmount: formData.autoAllocateAmount
                    };
                    break;
                case 'EDIT':
                    url = `/api/wallets/${selectedWallet.id}`;
                    method = 'PATCH';
                    body = { 
                        name: formData.name, 
                        icon: formData.icon, 
                        color: formData.color,
                        autoAllocateEnabled: formData.autoAllocateEnabled,
                        autoAllocateDay: formData.autoAllocateDay,
                        autoAllocateAmount: formData.autoAllocateAmount
                    };
                    break;
                case 'TOPUP':
                    url = '/api/wallets/topup';
                    body = { walletId: selectedWallet.id, amount: formData.amount };
                    break;
                case 'WITHDRAW':
                    url = '/api/wallets/withdraw';
                    body = { walletId: selectedWallet.id, amount: formData.amount };
                    break;
                case 'TRANSFER':
                    url = '/api/wallets/transfer';
                    body = { 
                        fromWalletId: selectedWallet.id, 
                        toWalletId: formData.toWalletId, 
                        amount: formData.amount 
                    };
                    break;
            }

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });

            const data = await res.json();
            if (data.error) throw new Error(data.error);

            await fetchWallets();
            setModalType(null);
            resetForm();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setActionLoading(false);
        }
    };

    const handleDeleteWallet = async () => {
        if (!selectedWallet) {
            showToast('No wallet selected', 'warning');
            return;
        }
        
        const confirmMsg = `Hapus pocket "${selectedWallet.name}"? Saldo ${formatCurrency(selectedWallet.balance)} akan dikembalikan ke Saldo Utama.`;
        const confirmed = await showConfirm({
            title: 'Hapus Pocket',
            message: confirmMsg,
            danger: true,
            confirmText: 'Ya, Hapus',
            cancelText: 'Batal'
        });
        
        if (!confirmed) return;

        setActionLoading(true);
        setError(null);

        try {
            const res = await fetch(`/api/wallets/${selectedWallet.id}`, {
                method: 'DELETE'
            });

            const data = await res.json();
            if (data.error) throw new Error(data.error);

            await fetchWallets();
            setModalType(null);
            resetForm();
            showToast('Pocket berhasil dihapus', 'success');
        } catch (err: any) {
            setError(err.message);
            showToast('Gagal menghapus pocket: ' + err.message, 'error');
        } finally {
            setActionLoading(false);
        }
    };

    const openCreate = () => {
        resetForm();
        setModalType('CREATE');
    };

    const openEdit = (wallet: any) => {
        setFormData({
            name: wallet.name,
            icon: wallet.icon || '💰',
            color: wallet.color || '#3B82F6',
            amount: '',
            toWalletId: '',
            autoAllocateEnabled: wallet.autoAllocateEnabled || false,
            autoAllocateDay: wallet.autoAllocateDay?.toString() || '',
            autoAllocateAmount: wallet.autoAllocateAmount?.toString() || ''
        });
        setSelectedWallet(wallet);
        setModalType('EDIT');
    };

    const colors = [
        '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', 
        '#EC4899', '#06B6D4', '#F97316', '#6366F1', '#14B8A6'
    ];

    const icons = ['💰', '🍔', '🚗', '🏠', '🎮', '🏥', '✈️', '🎓', '🛍️', '🎁'];

    const filteredWallets = wallets.filter(w => w.name.toLowerCase().includes(searchQuery.toLowerCase()));

    if (loading && wallets.length === 0) {
        return (
            <div className="min-h-screen bg-gray-50">
                <Navbar />
                <div className="flex items-center justify-center h-[calc(100-64px)]">
                    <Loader2 className="animate-spin text-blue-600" size={48} />
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            <Navbar />

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
                {/* Header Section */}
                <div className="flex items-center justify-between mb-8">
                    <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">Pockets</h1>
                    <button 
                        onClick={openCreate}
                        className="p-3 bg-white hover:bg-gray-50 rounded-2xl text-gray-400 transition-all border border-gray-100 shadow-sm"
                    >
                        <Plus size={24} />
                    </button>
                </div>

                {/* Search Bar */}
                <div className="relative mb-8">
                    <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none text-gray-400">
                        <Search size={20} />
                    </div>
                    <input 
                        type="text" 
                        placeholder="Find Pockets"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-14 pr-6 py-4 bg-white border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-purple-500 transition-all text-sm font-medium shadow-sm"
                    />
                </div>

                <BalanceOverview 
                    totalBalance={totalBalance}
                    allocatedBalance={allocatedBalance}
                    availableBalance={availableBalance}
                />

                {/* Wallets Grid - Optimized for Desktop */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {filteredWallets.map((wallet) => (
                        <WalletCard 
                            key={wallet.id} 
                            wallet={wallet}
                            onTopUp={(w) => { setSelectedWallet(w); setModalType('TOPUP'); }}
                            onWithdraw={(w) => { setSelectedWallet(w); setModalType('WITHDRAW'); }}
                            onTransfer={(w) => { setSelectedWallet(w); setModalType('TRANSFER'); }}
                            onEdit={openEdit}
                            onOpen={setHistoryWallet}
                        />
                    ))}

                    {/* Create New Pocket Card */}
                    <button 
                        onClick={openCreate}
                        className="rounded-[2rem] p-6 border-2 border-dashed border-gray-200 hover:border-purple-400 hover:bg-purple-50/30 transition-all group flex flex-col items-center justify-center min-h-[220px]"
                    >
                        <div className="w-14 h-14 bg-gray-50 rounded-full flex items-center justify-center mb-4 group-hover:bg-purple-100 group-hover:scale-110 transition-all text-gray-300 group-hover:text-purple-600">
                            <Plus size={28} />
                        </div>
                        <p className="text-sm font-bold text-gray-400 group-hover:text-purple-600">Create Pocket</p>
                    </button>
                </div>
            </main>

            {/* Wallet Details View */}
            {historyWallet && (
                <WalletHistoryView 
                    wallet={historyWallet}
                    allWallets={wallets}
                    availableBalance={availableBalance}
                    onClose={() => setHistoryWallet(null)}
                    onRefresh={fetchWallets}
                />
            )}

            {/* Modal Overlay */}
            {modalType && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
                    <div className="bg-white rounded-[2.5rem] w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
                        <div className="p-8">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-2xl font-bold text-gray-900">
                                    {modalType === 'CREATE' && 'Buat Pocket Baru'}
                                    {modalType === 'EDIT' && 'Edit Pocket'}
                                    {modalType === 'TOPUP' && 'Top Up Pocket'}
                                    {modalType === 'WITHDRAW' && 'Tarik dari Pocket'}
                                    {modalType === 'TRANSFER' && 'Transfer Pocket'}
                                </h3>
                                <button 
                                    onClick={() => setModalType(null)}
                                    className="p-2 hover:bg-gray-100 rounded-full text-gray-400 transition-colors"
                                >
                                    <X size={24} />
                                </button>
                            </div>

                            <form onSubmit={handleAction} className="space-y-6">
                                {(modalType === 'CREATE' || modalType === 'EDIT') && (
                                    <>
                                        <div>
                                            <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wider">Nama Pocket</label>
                                            <input 
                                                type="text" 
                                                required
                                                value={formData.name}
                                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                                placeholder="Misal: Makan Siang, Tabungan Liburan"
                                                className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wider">Pilih Icon</label>
                                            <div className="flex flex-wrap gap-2">
                                                {icons.map((icon) => (
                                                    <button 
                                                        key={icon}
                                                        type="button"
                                                        onClick={() => setFormData({ ...formData, icon })}
                                                        className={`w-12 h-12 flex items-center justify-center text-xl rounded-xl transition-all ${formData.icon === icon ? 'bg-blue-600 shadow-lg scale-110' : 'bg-gray-50 hover:bg-gray-100'}`}
                                                    >
                                                        {icon}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wider">Warna Pocket</label>
                                            <div className="flex flex-wrap gap-3">
                                                {colors.map((color) => (
                                                    <button 
                                                        key={color}
                                                        type="button"
                                                        onClick={() => setFormData({ ...formData, color })}
                                                        className={`w-8 h-8 rounded-full transition-all ${formData.color === color ? 'ring-4 ring-offset-2 ring-gray-300 scale-110' : 'hover:scale-105'}`}
                                                        style={{ backgroundColor: color }}
                                                    ></button>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Auto Allocation Settings */}
                                        <div className="bg-blue-50/50 p-6 rounded-3xl border border-blue-100 space-y-4">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <h4 className="font-bold text-blue-900 flex items-center gap-2">
                                                        <RefreshCw size={16} className={formData.autoAllocateEnabled ? 'animate-spin-slow' : ''} />
                                                        Alokasi Otomatis
                                                    </h4>
                                                    <p className="text-xs text-blue-700/70">Top up otomatis dari Saldo Utama</p>
                                                </div>
                                                <button 
                                                    type="button"
                                                    onClick={() => setFormData({ ...formData, autoAllocateEnabled: !formData.autoAllocateEnabled })}
                                                    className={`w-12 h-6 rounded-full transition-all relative ${formData.autoAllocateEnabled ? 'bg-blue-600' : 'bg-gray-300'}`}
                                                >
                                                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${formData.autoAllocateEnabled ? 'left-7' : 'left-1'}`}></div>
                                                </button>
                                            </div>

                                            {formData.autoAllocateEnabled && (
                                                <div className="grid grid-cols-2 gap-4 pt-2 animate-in fade-in slide-in-from-top-2 duration-300">
                                                    <div>
                                                        <label className="block text-[10px] font-black text-blue-900/50 uppercase tracking-widest mb-1.5">Tanggal (1-31)</label>
                                                        <input 
                                                            type="number" 
                                                            min="1"
                                                            max="31"
                                                            required={formData.autoAllocateEnabled}
                                                            value={formData.autoAllocateDay}
                                                            onChange={(e) => setFormData({ ...formData, autoAllocateDay: e.target.value })}
                                                            placeholder="Contoh: 25"
                                                            className="w-full px-4 py-3 bg-white border border-blue-100 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm font-bold"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-[10px] font-black text-blue-900/50 uppercase tracking-widest mb-1.5">Jumlah (Rp)</label>
                                                        <input 
                                                            type="number" 
                                                            required={formData.autoAllocateEnabled}
                                                            value={formData.autoAllocateAmount}
                                                            onChange={(e) => setFormData({ ...formData, autoAllocateAmount: e.target.value })}
                                                            placeholder="0"
                                                            className="w-full px-4 py-3 bg-white border border-blue-100 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm font-bold"
                                                        />
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </>
                                )}

                                {modalType === 'CREATE' && (
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wider">Setoran Awal (Opsional)</label>
                                        <div className="relative">
                                            <span className="absolute left-5 top-1/2 -translate-y-1/2 font-bold text-gray-400">Rp</span>
                                            <input 
                                                type="number" 
                                                value={formData.amount}
                                                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                                                placeholder="0"
                                                className="w-full pl-12 pr-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all font-bold text-lg"
                                            />
                                        </div>
                                        <p className="mt-2 text-xs text-gray-400">Tersedia: {formatCurrency(availableBalance)}</p>
                                    </div>
                                )}

                                {(modalType === 'TOPUP' || modalType === 'WITHDRAW' || modalType === 'TRANSFER') && (
                                    <div className="bg-gray-50 rounded-3xl p-6 border border-gray-100 mb-6">
                                        <div className="flex items-center gap-4 mb-4">
                                            <div 
                                                className="w-12 h-12 rounded-xl flex items-center justify-center text-xl text-white shadow-sm"
                                                style={{ backgroundColor: selectedWallet?.color }}
                                            >
                                                {selectedWallet?.icon || '💰'}
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-gray-900">{selectedWallet?.name}</h4>
                                                <p className="text-sm text-gray-500">Saldo: {formatCurrency(selectedWallet?.balance || 0)}</p>
                                            </div>
                                        </div>

                                        {modalType === 'TRANSFER' && (
                                            <div className="flex flex-col items-center gap-4 py-4">
                                                <ArrowRight className="text-gray-300 rotate-90" />
                                                <div className="w-full">
                                                    <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wider">Kirim Ke</label>
                                                    <select 
                                                        required
                                                        value={formData.toWalletId}
                                                        onChange={(e) => setFormData({ ...formData, toWalletId: e.target.value })}
                                                        className="w-full px-5 py-4 bg-white border border-gray-100 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all appearance-none"
                                                    >
                                                        <option value="">Pilih Pocket Tujuan</option>
                                                        {wallets
                                                            .filter(w => w.id !== selectedWallet?.id)
                                                            .map(w => (
                                                                <option key={w.id} value={w.id}>{w.name} ({formatCurrency(w.balance)})</option>
                                                            ))
                                                        }
                                                    </select>
                                                </div>
                                            </div>
                                        )}

                                        <div>
                                            <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wider">Nominal</label>
                                            <div className="relative">
                                                <span className="absolute left-5 top-1/2 -translate-y-1/2 font-bold text-gray-400">Rp</span>
                                                <input 
                                                    type="number" 
                                                    required
                                                    autoFocus
                                                    value={formData.amount}
                                                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                                                    placeholder="0"
                                                    className="w-full pl-12 pr-5 py-4 bg-white border border-gray-100 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all font-bold text-lg"
                                                />
                                            </div>
                                            {modalType === 'TOPUP' && (
                                                <p className="mt-2 text-xs text-gray-400">Saldo Utama Tersedia: {formatCurrency(availableBalance)}</p>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {error && (
                                    <div className="p-4 bg-red-50 text-red-600 rounded-2xl text-sm font-medium flex items-start gap-2 animate-in slide-in-from-top-2">
                                        <X size={16} className="mt-0.5" />
                                        {error}
                                    </div>
                                )}

                                <button 
                                    type="submit"
                                    disabled={actionLoading}
                                    className="w-full py-4 bg-blue-600 text-white rounded-2xl font-bold shadow-lg shadow-blue-200 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                                >
                                    {actionLoading ? (
                                        <RefreshCw className="animate-spin" size={20} />
                                    ) : (
                                        <>
                                            {modalType === 'CREATE' && 'Buat Pocket'}
                                            {modalType === 'EDIT' && 'Simpan Perubahan'}
                                            {modalType === 'TOPUP' && 'Konfirmasi Top Up'}
                                            {modalType === 'WITHDRAW' && 'Konfirmasi Penarikan'}
                                            {modalType === 'TRANSFER' && 'Konfirmasi Transfer'}
                                        </>
                                    )}
                                </button>

                                {modalType === 'EDIT' && (
                                    <button 
                                        type="button"
                                        onClick={handleDeleteWallet}
                                        disabled={actionLoading}
                                        className="w-full py-4 bg-red-50 text-red-600 rounded-2xl font-bold hover:bg-red-100 disabled:opacity-50 transition-all flex items-center justify-center gap-2 mt-4"
                                    >
                                        Hapus Pocket
                                    </button>
                                )}
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
