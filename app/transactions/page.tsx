'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Navbar } from '@/components/Navbar';
import { useToast } from '@/components/ToastProvider';
import { formatCurrency, formatDateTime, getLocalDatetime } from '@/lib/utils';
import { CurrencyInput } from '@/components/CurrencyInput';
import { Camera, Loader2, Sparkles, X } from 'lucide-react';

export const dynamic = 'force-dynamic';

interface Transaction {
    id: string;
    date: string;
    category: string;
    amount: number;
    type: 'INCOME' | 'EXPENSE';
    description: string | null;
    walletId: string | null;
    wallet?: { name: string; color: string };
}

interface Wallet {
    id: string;
    name: string;
    balance: number;
}

export default function TransactionsPage() {
    const router = useRouter();
    const { data: session } = useSession();
    const { showToast, showConfirm } = useToast();
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [typeFilter, setTypeFilter] = useState('');
    const [sortConfig, setSortConfig] = useState<{
        key: keyof Transaction;
        direction: 'asc' | 'desc';
    }>({ key: 'date', direction: 'desc' });
    const [scanLoading, setScanLoading] = useState(false);
    const [scanImage, setScanImage] = useState<string | null>(null);

    const [wallets, setWallets] = useState<Wallet[]>([]);
    const [formData, setFormData] = useState({
        date: getLocalDatetime(),
        category: '',
        amount: '',
        type: 'INCOME' as 'INCOME' | 'EXPENSE',
        description: '',
        walletId: '',
    });

    useEffect(() => {
        fetchTransactions();
        fetchWallets();
    }, [currentPage]); // Re-fetch when page changes

    const fetchWallets = async () => {
        try {
            const res = await fetch('/api/wallets');
            const data = await res.json();
            setWallets(data.wallets || []);
        } catch (error) {
            console.error('Error fetching wallets:', error);
        }
    };

    const fetchTransactions = async () => {
        try {
            setLoading(true);
            const query = new URLSearchParams({
                page: currentPage.toString(),
                limit: '10',
                search: searchQuery,
                type: typeFilter
            });
            const res = await fetch(`/api/transactions?${query.toString()}`);
            const data = await res.json();
            setTransactions(data.transactions || []);
            if (data.pagination) {
                setTotalPages(data.pagination.totalPages);
            }
        } catch (error) {
            console.error('Error fetching transactions:', error);
        } finally {
            setLoading(false);
        }
    };

    // Trigger fetch on filter change
    useEffect(() => {
        if (currentPage !== 1) {
            setCurrentPage(1);
        } else {
            fetchTransactions();
        }
    }, [searchQuery, typeFilter]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            const url = editingId ? `/api/transactions/${editingId}` : '/api/transactions';
            const method = editingId ? 'PUT' : 'POST';

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...formData,
                    amount: parseFloat(formData.amount),
                    walletId: formData.type === 'EXPENSE' ? (formData.walletId || null) : null,
                }),
            });

            if (res.ok) {
                setShowForm(false);
                setEditingId(null);
                setFormData({
                    date: getLocalDatetime(),
                    category: '',
                    amount: '',
                    type: 'INCOME',
                    description: '',
                    walletId: '',
                });
                showToast('Transaksi berhasil disimpan', 'success');
                fetchTransactions();
            } else {
                const errorData = await res.json();
                showToast(errorData.error || 'Gagal menyimpan transaksi', 'error');
            }
        } catch (error) {
            console.error('Error saving transaction:', error);
        }
    };

    const handleScan = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            setScanLoading(true);
            showToast('Sedang membaca struk...', 'info');

            // Convert to base64
            const reader = new FileReader();
            const base64Promise = new Promise<string>((resolve) => {
                reader.onload = () => {
                    const result = reader.result as string;
                    setScanImage(result); // Set preview image
                    const base64 = result.split(',')[1];
                    resolve(base64);
                };
            });
            reader.readAsDataURL(file);
            const base64 = await base64Promise;

            const res = await fetch('/api/transactions/scan', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ image: base64 }),
            });

            const data = await res.json();
            if (data.error) throw new Error(data.error);

            // Auto-fill form
            setFormData(prev => ({
                ...prev,
                amount: data.amount ? data.amount.toString() : prev.amount,
                category: data.category || prev.category,
                description: data.description || data.merchant || prev.description,
                type: data.type || prev.type,
                date: data.date ? `${data.date}T${new Date().toLocaleTimeString('en-GB')}` : prev.date
            }));

            showToast('Struk berhasil dibaca!', 'success');
        } catch (error: any) {
            console.error('Scan Error:', error);
            showToast(error.message || 'Gagal membaca struk', 'error');
        } finally {
            setScanLoading(false);
            // Reset input
            if (e.target) e.target.value = '';
        }
    };

    const handleEdit = (tx: Transaction) => {
        setFormData({
            date: getLocalDatetime(tx.date),
            category: tx.category,
            amount: tx.amount.toString(),
            type: tx.type,
            description: tx.description || '',
            walletId: tx.walletId || '',
        });
        setEditingId(tx.id);
        setShowForm(true);
    };

    const handleDelete = async (id: string, isWallet?: boolean) => {
        const confirmed = await showConfirm({
            title: 'Hapus Transaksi',
            message: 'Hapus transaksi ini?',
            danger: true
        });
        if (!confirmed) return;

        try {
            const res = await fetch(`/api/transactions/${id}`, {
                method: 'DELETE',
            });

            if (res.ok) {
                showToast('Transaksi dihapus', 'success');
                fetchTransactions();
            } else {
                const err = await res.json();
                showToast(err.error || 'Gagal menghapus', 'error');
            }
        } catch (error) {
            console.error('Error deleting transaction:', error);
            showToast('Terjadi kesalahan saat menghapus', 'error');
        }
    };

    const handleBulkDelete = async () => {
        if (selectedIds.length === 0) return;
        const confirmed = await showConfirm({
            title: 'Hapus Massal',
            message: `Hapus ${selectedIds.length} transaksi terpilih?`,
            danger: true
        });
        if (!confirmed) return;

        try {
            const res = await fetch('/api/transactions', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ids: selectedIds }),
            });

            if (res.ok) {
                setSelectedIds([]);
                showToast(`${selectedIds.length} transaksi berhasil dihapus`, 'success');
                fetchTransactions();
            } else {
                const error = await res.json();
                showToast(error.error || 'Gagal menghapus transaksi', 'error');
            }
        } catch (error) {
            console.error('Error in bulk delete:', error);
            showToast('Terjadi kesalahan saat menghapus transaksi', 'error');
        }
    };

    const handleSort = (key: keyof Transaction) => {
        let direction: 'asc' | 'desc' = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const getSortIcon = (key: keyof Transaction) => {
        if (sortConfig.key !== key) {
            return (
                <svg className="w-3 h-3 ml-1 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                </svg>
            );
        }
        return sortConfig.direction === 'asc' ? (
            <svg className="w-3 h-3 ml-1 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
            </svg>
        ) : (
            <svg className="w-3 h-3 ml-1 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
        );
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <Navbar />

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-8">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Transaksi</h1>
                        <p className="text-sm sm:text-base text-gray-600">Kelola pemasukan dan pengeluaran Anda</p>
                    </div>
                    {session?.user?.role !== 'VIEWER' && (
                        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                            {selectedIds.length > 0 && (
                                <button
                                    onClick={handleBulkDelete}
                                    className="w-full sm:w-auto px-6 py-3 bg-red-600 text-white font-semibold rounded-lg shadow-md hover:bg-red-700 transition-all text-sm sm:text-base flex items-center justify-center gap-2"
                                >
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                    Hapus {selectedIds.length}
                                </button>
                            )}
                            <button
                                onClick={() => {
                                    setShowForm(!showForm);
                                    setEditingId(null);
                                    setFormData({
                                        date: getLocalDatetime(),
                                        category: '',
                                        amount: '',
                                        type: 'INCOME',
                                        description: '',
                                        walletId: '',
                                    });
                                    setScanImage(null);
                                }}
                                className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-lg shadow-md hover:shadow-lg transition-all text-sm sm:text-base"
                            >
                                {showForm ? 'Tutup Form' : '+ Tambah Transaksi'}
                            </button>
                        </div>
                    )}
                </div>

                {/* Form */}
                {showForm && (
                    <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6 mb-8">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold text-gray-900">
                                {editingId ? 'Edit Transaksi' : 'Tambah Transaksi Baru'}
                            </h2>
                            {!editingId && (
                                <div className="relative">
                                    <input 
                                        type="file" 
                                        id="receipt-scan" 
                                        className="hidden" 
                                        accept="image/*"
                                        onChange={handleScan}
                                        disabled={scanLoading}
                                    />
                                    <label 
                                        htmlFor="receipt-scan"
                                        className={`flex items-center gap-2 px-4 py-2 bg-purple-50 text-purple-700 rounded-full text-sm font-bold cursor-pointer hover:bg-purple-100 transition-all border border-purple-100 ${scanLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    >
                                        {scanLoading ? (
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                        ) : (
                                            <Sparkles className="w-4 h-4 text-purple-500" />
                                        )}
                                        {scanLoading ? 'Membaca...' : 'Scan Struk (AI)'}
                                    </label>
                                </div>
                            )}
                        </div>

                        <form onSubmit={handleSubmit} className="flex flex-col lg:flex-row gap-8">
                            {/* Image Preview Area */}
                            {scanImage && (
                                <div className="w-full lg:w-1/3 flex flex-col gap-4 animate-in fade-in slide-in-from-left-4 duration-500">
                                    <div className="relative rounded-2xl overflow-hidden border-2 border-purple-100 shadow-inner bg-gray-50 aspect-[3/4]">
                                        <img 
                                            src={scanImage} 
                                            alt="Receipt Preview" 
                                            className="w-full h-full object-contain"
                                        />
                                        {scanLoading && (
                                            <div className="absolute inset-0 bg-purple-900/20 backdrop-blur-[2px] flex items-center justify-center">
                                                <div className="flex flex-col items-center gap-3">
                                                    <Loader2 className="w-10 h-10 text-white animate-spin" />
                                                    <span className="text-white font-bold text-sm drop-shadow-md">Menganalisis...</span>
                                                </div>
                                                {/* Scanning Laser Effect */}
                                                <div className="absolute top-0 left-0 w-full h-1 bg-purple-400 shadow-[0_0_15px_rgba(168,85,247,0.8)] animate-scan-laser"></div>
                                            </div>
                                        )}
                                    </div>
                                    <button 
                                        type="button"
                                        onClick={() => setScanImage(null)}
                                        className="text-xs font-bold text-red-500 hover:text-red-600 flex items-center justify-center gap-1 uppercase tracking-wider"
                                    >
                                        <X size={14} /> Hapus Gambar
                                    </button>
                                </div>
                            )}

                            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Tanggal & Waktu
                                </label>
                                <input
                                    type="datetime-local"
                                    step="1"
                                    value={formData.date}
                                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                    required
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Kategori
                                </label>
                                <input
                                    type="text"
                                    value={formData.category}
                                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                    required
                                    placeholder="Contoh: Gaji, Belanja, Transportasi"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Nominal
                                </label>
                                <CurrencyInput
                                    value={formData.amount}
                                    onValueChange={(val) => setFormData({ ...formData, amount: val })}
                                    required
                                    placeholder="Rp 0"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Tipe
                                </label>
                                <select
                                    value={formData.type}
                                    onChange={(e) => setFormData({ ...formData, type: e.target.value as 'INCOME' | 'EXPENSE' })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                >
                                    <option value="INCOME">Pemasukan</option>
                                </select>
                            </div>

                            {formData.type === 'EXPENSE' && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Pilih Wallet (Pocket)
                                    </label>
                                    <select
                                        value={formData.walletId}
                                        onChange={(e) => setFormData({ ...formData, walletId: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    >
                                        <option value="">Saldo Utama (Tanpa Wallet)</option>
                                        {wallets.map(w => (
                                            <option key={w.id} value={w.id}>{w.name} (Tersedia: {formatCurrency(w.balance)})</option>
                                        ))}
                                    </select>
                                    <p className="mt-1 text-xs text-gray-400">Pilih pocket untuk memotong saldo dari wallet tertentu.</p>
                                </div>
                            )}

                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Keterangan (Opsional)
                                </label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    rows={3}
                                    placeholder="Catatan tambahan..."
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>

                            <div className="md:col-span-2 flex gap-4">
                                <button
                                    type="submit"
                                    className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
                                >
                                    {editingId ? 'Update Transaksi' : 'Simpan Transaksi'}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowForm(false);
                                        setEditingId(null);
                                    }}
                                    className="px-6 py-3 bg-gray-200 text-gray-700 font-semibold rounded-lg hover:bg-gray-300 transition-colors"
                                >
                                    Batal
                                </button>
                            </div>
                        </div>
                    </form>
                    </div>
                )}

                {/* Transaction List */}
                <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden">
                    <div className="p-6 border-b border-gray-200 flex flex-col md:flex-row gap-4 justify-between items-center bg-gray-50/50">
                        <h2 className="text-xl font-bold text-gray-900">Daftar Transaksi</h2>
                        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                            <div className="relative">
                                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-500">
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                    </svg>
                                </span>
                                <input 
                                    type="text"
                                    placeholder="Cari kategori atau deskripsi..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-9 pr-4 py-2 border border-gray-300 rounded-lg w-full sm:w-64 focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                                />
                            </div>
                            <select 
                                value={typeFilter}
                                onChange={(e) => setTypeFilter(e.target.value)}
                                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                            >
                                <option value="">Semua Tipe</option>
                                <option value="INCOME">Pemasukan</option>
                                <option value="EXPENSE">Pengeluaran</option>
                            </select>
                        </div>
                    </div>

                    {loading ? (
                        <div className="p-8 text-center text-gray-500">Loading...</div>
                    ) : transactions.length === 0 ? (
                        <div className="p-8 text-center text-gray-500">Belum ada transaksi</div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50">
                                    <tr>
                                        {session?.user?.role !== 'VIEWER' && (
                                            <th className="px-6 py-3 text-left w-12">
                                                <input
                                                    type="checkbox"
                                                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                                    checked={transactions.length > 0 && selectedIds.length === transactions.length}
                                                    onChange={(e) => {
                                                        if (e.target.checked) {
                                                            setSelectedIds(transactions.map(t => t.id));
                                                        } else {
                                                            setSelectedIds([]);
                                                        }
                                                    }}
                                                />
                                            </th>
                                        )}
                                        <th 
                                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                                            onClick={() => handleSort('date')}
                                        >
                                            <div className="flex items-center">
                                                Tanggal {getSortIcon('date')}
                                            </div>
                                        </th>
                                        <th 
                                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                                            onClick={() => handleSort('category')}
                                        >
                                            <div className="flex items-center">
                                                Kategori {getSortIcon('category')}
                                            </div>
                                        </th>
                                        <th 
                                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                                            onClick={() => handleSort('type')}
                                        >
                                            <div className="flex items-center">
                                                Tipe {getSortIcon('type')}
                                            </div>
                                        </th>
                                        <th 
                                            className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                                            onClick={() => handleSort('amount')}
                                        >
                                            <div className="flex items-center justify-end">
                                                Nominal {getSortIcon('amount')}
                                            </div>
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Keterangan</th>
                                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {transactions.map((tx: any) => (
                                         <tr key={tx.id} className="hover:bg-gray-50">
                                             {session?.user?.role !== 'VIEWER' && (
                                                 <td className="px-6 py-4 whitespace-nowrap w-12">
                                                     <input
                                                         type="checkbox"
                                                         className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                                         checked={selectedIds.includes(tx.id)}
                                                         onChange={(e) => {
                                                             if (e.target.checked) {
                                                                 setSelectedIds([...selectedIds, tx.id]);
                                                             } else {
                                                                 setSelectedIds(selectedIds.filter(id => id !== tx.id));
                                                             }
                                                         }}
                                                     />
                                                 </td>
                                             )}
                                             <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                 {formatDateTime(tx.date)}
                                             </td>
                                             <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                 <div className="flex flex-col">
                                                     <span>{tx.category}</span>
                                                     {tx.wallet && (
                                                         <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">
                                                             Pocket: {tx.wallet.name}
                                                         </span>
                                                     )}
                                                     {tx.isWalletTransaction && (
                                                         <span className="text-[10px] font-bold text-purple-400 uppercase tracking-widest mt-0.5">
                                                             Wallet Move
                                                         </span>
                                                     )}
                                                 </div>
                                             </td>
                                             <td className="px-6 py-4 whitespace-nowrap">
                                                 <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${tx.type === 'INCOME' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                                     }`}>
                                                     {tx.type === 'INCOME' ? 'Pemasukan' : 'Pengeluaran'}
                                                 </span>
                                             </td>
                                             <td className={`px-6 py-4 whitespace-nowrap text-sm text-right font-semibold ${tx.type === 'INCOME' ? 'text-green-600' : 'text-red-600'
                                                 }`}>
                                                 {formatCurrency(tx.amount)}
                                             </td>
                                             <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                                                 {tx.description || '-'}
                                             </td>
                                             <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                                                 {session?.user?.role !== 'VIEWER' && (
                                                     <>
                                                         {!tx.isWalletTransaction && (
                                                            <button
                                                                onClick={() => handleEdit(tx)}
                                                                className="text-blue-600 hover:text-blue-900 mr-4"
                                                            >
                                                                Edit
                                                            </button>
                                                         )}
                                                         <button
                                                             onClick={() => handleDelete(tx.id)}
                                                             className="text-red-600 hover:text-red-900"
                                                         >
                                                             Hapus
                                                         </button>
                                                     </>
                                                 )}
                                                 {session?.user?.role === 'VIEWER' && (
                                                     <span className="text-gray-400">-</span>
                                                 )}
                                             </td>
                                         </tr>
                                     ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* Pagination Controls */}
                    {!loading && totalPages > 1 && (
                        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
                            <div className="text-sm text-gray-500">
                                Menampilkan Halaman <span className="font-medium text-gray-900">{currentPage}</span> dari <span className="font-medium text-gray-900">{totalPages}</span>
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                    disabled={currentPage === 1}
                                    className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    Sebelumnya
                                </button>
                                <button
                                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                    disabled={currentPage === totalPages}
                                    className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    Selanjutnya
                                </button>
                            </div>
                        </div>
                    )}

                </div>
            </main>
        </div>
    );
}
