'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Navbar } from '@/components/Navbar';
import { formatCurrency, formatDate } from '@/lib/utils';

interface Transaction {
    id: string;
    date: string;
    category: string;
    amount: number;
    type: 'INCOME' | 'EXPENSE';
    description: string | null;
}

export default function TransactionsPage() {
    const router = useRouter();
    const { data: session } = useSession();
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);

    const [formData, setFormData] = useState({
        date: new Date().toISOString().split('T')[0],
        category: '',
        amount: '',
        type: 'INCOME' as 'INCOME' | 'EXPENSE',
        description: '',
    });

    useEffect(() => {
        fetchTransactions();
    }, []);

    const fetchTransactions = async () => {
        try {
            const res = await fetch('/api/transactions');
            const data = await res.json();
            setTransactions(data.transactions || []);
        } catch (error) {
            console.error('Error fetching transactions:', error);
        } finally {
            setLoading(false);
        }
    };

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
                }),
            });

            if (res.ok) {
                setShowForm(false);
                setEditingId(null);
                setFormData({
                    date: new Date().toISOString().split('T')[0],
                    category: '',
                    amount: '',
                    type: 'INCOME',
                    description: '',
                });
                fetchTransactions();
            }
        } catch (error) {
            console.error('Error saving transaction:', error);
        }
    };

    const handleEdit = (tx: Transaction) => {
        setFormData({
            date: new Date(tx.date).toISOString().split('T')[0],
            category: tx.category,
            amount: tx.amount.toString(),
            type: tx.type,
            description: tx.description || '',
        });
        setEditingId(tx.id);
        setShowForm(true);
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Hapus transaksi ini?')) return;

        try {
            const res = await fetch(`/api/transactions/${id}`, {
                method: 'DELETE',
            });

            if (res.ok) {
                fetchTransactions();
            }
        } catch (error) {
            console.error('Error deleting transaction:', error);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <Navbar />

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">Transaksi</h1>
                        <p className="text-gray-600">Kelola pemasukan dan pengeluaran Anda</p>
                    </div>
                    {session?.user?.role !== 'VIEWER' && (
                        <button
                            onClick={() => {
                                setShowForm(!showForm);
                                setEditingId(null);
                                setFormData({
                                    date: new Date().toISOString().split('T')[0],
                                    category: '',
                                    amount: '',
                                    type: 'INCOME',
                                    description: '',
                                });
                            }}
                            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-lg shadow-md hover:shadow-lg transition-all"
                        >
                            {showForm ? 'Tutup Form' : '+ Tambah Transaksi'}
                        </button>
                    )}
                </div>

                {/* Form */}
                {showForm && (
                    <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6 mb-8">
                        <h2 className="text-xl font-bold text-gray-900 mb-6">
                            {editingId ? 'Edit Transaksi' : 'Tambah Transaksi Baru'}
                        </h2>

                        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Tanggal
                                </label>
                                <input
                                    type="date"
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
                                <input
                                    type="number"
                                    value={formData.amount}
                                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                                    required
                                    min="0"
                                    step="1000"
                                    placeholder="0"
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
                                    <option value="EXPENSE">Pengeluaran</option>
                                </select>
                            </div>

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
                        </form>
                    </div>
                )}

                {/* Transaction List */}
                <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden">
                    <div className="p-6 border-b border-gray-200">
                        <h2 className="text-xl font-bold text-gray-900">Daftar Transaksi</h2>
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
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tanggal</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Kategori</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipe</th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Nominal</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Keterangan</th>
                                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {transactions.map((tx) => (
                                        <tr key={tx.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                {formatDate(tx.date)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                {tx.category}
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
                                                        <button
                                                            onClick={() => handleEdit(tx)}
                                                            className="text-blue-600 hover:text-blue-900 mr-4"
                                                        >
                                                            Edit
                                                        </button>
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
                </div>
            </main>
        </div>
    );
}
