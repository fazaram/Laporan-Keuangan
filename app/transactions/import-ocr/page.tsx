'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useDropzone } from 'react-dropzone';
import { Navbar } from '@/components/Navbar';
import { useToast } from '@/components/ToastProvider';
import { formatCurrency } from '@/lib/utils';
import { UploadCloud, FileText, Loader2, CheckCircle2, Trash2 } from 'lucide-react';

interface ParsedTransaction {
    id: string; // generated locally for list management
    date: string;
    description: string;
    category: string;
    type: 'INCOME' | 'EXPENSE';
    amount: number;
    selected: boolean;
}

interface Wallet {
    id: string;
    name: string;
    balance: number;
}

export default function ImportOCRPage() {
    const router = useRouter();
    const { showToast } = useToast();
    const [wallets, setWallets] = useState<Wallet[]>([]);
    const [selectedWalletId, setSelectedWalletId] = useState<string>('');
    
    const [file, setFile] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);
    const [importing, setImporting] = useState(false);
    
    const [transactions, setTransactions] = useState<ParsedTransaction[]>([]);
    const [step, setStep] = useState<'UPLOAD' | 'PREVIEW'>('UPLOAD');

    useEffect(() => {
        const fetchWallets = async () => {
            try {
                const res = await fetch('/api/wallets');
                if (res.ok) {
                    const data = await res.json();
                    const fetchedWallets = data.wallets || [];
                    setWallets(fetchedWallets);
                    
                    if (fetchedWallets.length > 0) {
                        // Coba cari dompet yang namanya mengandung "main" atau "utama"
                        const mainWallet = fetchedWallets.find((w: Wallet) => 
                            w.name.toLowerCase().includes('main') || 
                            w.name.toLowerCase().includes('utama')
                        );
                        
                        if (mainWallet) {
                            setSelectedWalletId(mainWallet.id);
                        } else {
                            // Jika tidak ada, pilih dompet pertama secara otomatis
                            setSelectedWalletId(fetchedWallets[0].id);
                        }
                    }
                }
            } catch (err) {
                console.error('Failed to fetch wallets:', err);
            }
        };
        fetchWallets();
    }, []);

    const onDrop = useCallback((acceptedFiles: File[]) => {
        if (acceptedFiles.length > 0) {
            setFile(acceptedFiles[0]);
        }
    }, []);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            'image/jpeg': ['.jpg', '.jpeg'],
            'image/png': ['.png'],
            'application/pdf': ['.pdf']
        },
        maxSize: 10 * 1024 * 1024, // 10MB
        multiple: false
    });

    const handleUpload = async () => {
        if (!file) return;

        setLoading(true);
        const formData = new FormData();
        formData.append('file', file);

        try {
            const res = await fetch('/api/transactions/import-ocr', {
                method: 'POST',
                body: formData,
            });

            const data = await res.json();

            if (res.ok && data.transactions) {
                // Add unique IDs and selection state
                const formattedTx = data.transactions.map((tx: any, index: number) => ({
                    ...tx,
                    id: `temp-${Date.now()}-${index}`,
                    selected: true, // Default all selected
                    amount: parseFloat(tx.amount) || 0
                }));
                
                setTransactions(formattedTx);
                setStep('PREVIEW');
                showToast('Berhasil membaca dokumen', 'success');
            } else {
                showToast(data.error || 'Gagal memproses dokumen', 'error');
            }
        } catch (error) {
            console.error('Upload error:', error);
            showToast('Terjadi kesalahan koneksi', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleImport = async () => {
        const selectedTxs = transactions.filter(t => t.selected);
        
        if (selectedTxs.length === 0) {
            showToast('Pilih setidaknya satu transaksi untuk diimport', 'error');
            return;
        }

        // Wallet validation removed, transactions can now be global (Total Amount)

        setImporting(true);
        try {
            const res = await fetch('/api/transactions/import-batch', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    transactions: selectedTxs,
                    walletId: null // Force global transaction for Total Amount integration
                }),
            });

            const data = await res.json();

            if (res.ok) {
                showToast(`${data.data.importedCount} transaksi berhasil diimport`, 'success');
                router.push('/transactions');
            } else {
                showToast(data.error || 'Gagal mengimport transaksi', 'error');
            }
        } catch (error) {
            console.error('Import error:', error);
            showToast('Terjadi kesalahan koneksi', 'error');
        } finally {
            setImporting(false);
        }
    };

    const toggleSelectAll = (checked: boolean) => {
        setTransactions(transactions.map(t => ({ ...t, selected: checked })));
    };

    const toggleSelect = (id: string) => {
        setTransactions(transactions.map(t => t.id === id ? { ...t, selected: !t.selected } : t));
    };

    const updateTransaction = (id: string, field: keyof ParsedTransaction, value: any) => {
        setTransactions(transactions.map(t => t.id === id ? { ...t, [field]: value } : t));
    };

    const removeTransaction = (id: string) => {
        setTransactions(transactions.filter(t => t.id !== id));
    };

    // Calculate Summaries
    const selectedTxs = transactions.filter(t => t.selected);
    const totalIncome = selectedTxs.filter(t => t.type === 'INCOME').reduce((sum, t) => sum + t.amount, 0);
    const totalExpense = selectedTxs.filter(t => t.type === 'EXPENSE').reduce((sum, t) => sum + t.amount, 0);

    return (
        <div className="min-h-screen bg-gray-50">
            <Navbar />

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="mb-8">
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Import OCR</h1>
                    <p className="text-gray-600">
                        Upload mutasi rekening, e-wallet, atau struk belanja. Sistem akan membaca dan mengubahnya menjadi transaksi secara otomatis.
                    </p>
                </div>

                {step === 'UPLOAD' ? (
                    <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 max-w-2xl mx-auto text-center">
                        <div 
                            {...getRootProps()} 
                            className={`border-2 border-dashed rounded-xl p-10 cursor-pointer transition-colors ${
                                isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'
                            }`}
                        >
                            <input {...getInputProps()} />
                            <div className="flex flex-col items-center justify-center gap-4">
                                <div className="p-4 bg-blue-100 text-blue-600 rounded-full">
                                    <UploadCloud size={40} />
                                </div>
                                <div>
                                    <p className="text-lg font-semibold text-gray-900">
                                        {isDragActive ? 'Lepaskan file di sini' : 'Drag & drop file di sini, atau klik untuk memilih'}
                                    </p>
                                    <p className="text-sm text-gray-500 mt-2">
                                        Mendukung PDF, JPG, PNG (Max. 10MB)
                                    </p>
                                </div>
                            </div>
                        </div>

                        {file && (
                            <div className="mt-6 flex flex-col p-4 bg-gray-50 rounded-xl border border-gray-200">
                                {file.type.startsWith('image/') && (
                                    <div className="mb-4 relative w-full h-48 sm:h-64 rounded-lg overflow-hidden border border-gray-200 bg-white shadow-sm">
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img 
                                            src={URL.createObjectURL(file)} 
                                            alt="Preview" 
                                            className="w-full h-full object-contain"
                                        />
                                    </div>
                                )}
                                <div className="flex items-center justify-between w-full">
                                    <div className="flex items-center gap-3">
                                        <FileText className="text-blue-500" />
                                        <div className="text-left">
                                            <p className="text-sm font-semibold text-gray-900 truncate max-w-[200px] sm:max-w-xs">{file.name}</p>
                                            <p className="text-xs text-gray-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setFile(null);
                                        }}
                                        className="p-2 text-gray-400 hover:text-red-500 transition-colors bg-white border border-gray-200 rounded-lg shadow-sm"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </div>
                        )}

                        <button
                            onClick={handleUpload}
                            disabled={!file || loading}
                            className="mt-6 w-full py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="animate-spin" size={20} />
                                    Membaca Dokumen (OCR)...
                                </>
                            ) : (
                                <>
                                    <CheckCircle2 size={20} />
                                    Proses File
                                </>
                            )}
                        </button>
                    </div>
                ) : (
                    <div className="space-y-6">
                        <div className="flex items-center gap-4">
                            <button 
                                onClick={() => {
                                    setStep('UPLOAD');
                                    setTransactions([]);
                                }}
                                className="text-sm font-semibold text-gray-500 hover:text-gray-900"
                            >
                                ← Kembali ke Upload
                            </button>
                        </div>

                        {/* Summary Cards */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col gap-2">
                                <span className="text-sm font-medium text-gray-500">Total Transaksi (Dipilih)</span>
                                <span className="text-2xl font-bold text-gray-900">{selectedTxs.length}</span>
                            </div>
                            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col gap-2">
                                <span className="text-sm font-medium text-gray-500">Total Pemasukan</span>
                                <span className="text-2xl font-bold text-emerald-600">{formatCurrency(totalIncome)}</span>
                            </div>
                            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col gap-2">
                                <span className="text-sm font-medium text-gray-500">Total Pengeluaran</span>
                                <span className="text-2xl font-bold text-red-600">{formatCurrency(totalExpense)}</span>
                            </div>
                        </div>

                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                            <div className="p-6 border-b border-gray-100 flex flex-col sm:flex-row gap-4 items-center justify-between">
                                <h2 className="text-xl font-bold text-gray-900">Preview Transaksi</h2>
                                <div className="flex items-center gap-4 w-full sm:w-auto">
                                    <div className="flex-1 sm:flex-none">
                                        {/* Wallet selection hidden by user request; auto-selected in background */}
                                    </div>
                                    <button
                                        onClick={handleImport}
                                        disabled={importing || selectedTxs.length === 0}
                                        className="px-6 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2 whitespace-nowrap"
                                    >
                                        {importing ? <Loader2 className="animate-spin" size={18} /> : 'Import Data'}
                                    </button>
                                </div>
                            </div>
                            
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-gray-50 border-b border-gray-200 text-sm font-semibold text-gray-600">
                                            <th className="p-4 w-12 text-center">
                                                <input 
                                                    type="checkbox" 
                                                    checked={transactions.length > 0 && transactions.every(t => t.selected)}
                                                    onChange={(e) => toggleSelectAll(e.target.checked)}
                                                    className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                                                />
                                            </th>
                                            <th className="p-4 w-40">Tanggal</th>
                                            <th className="p-4">Deskripsi</th>
                                            <th className="p-4 w-48">Kategori</th>
                                            <th className="p-4 w-40">Tipe</th>
                                            <th className="p-4 w-48 text-right">Nominal</th>
                                            <th className="p-4 w-16 text-center">Aksi</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {transactions.map((tx) => (
                                            <tr key={tx.id} className={`hover:bg-gray-50/50 transition-colors ${!tx.selected ? 'opacity-50 grayscale' : ''}`}>
                                                <td className="p-4 text-center">
                                                    <input 
                                                        type="checkbox" 
                                                        checked={tx.selected}
                                                        onChange={() => toggleSelect(tx.id)}
                                                        className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                                                    />
                                                </td>
                                                <td className="p-4">
                                                    <input 
                                                        type="date" 
                                                        value={tx.date} 
                                                        onChange={(e) => updateTransaction(tx.id, 'date', e.target.value)}
                                                        className="w-full p-2 text-sm border border-gray-200 rounded focus:ring-1 focus:ring-blue-500 outline-none"
                                                    />
                                                </td>
                                                <td className="p-4">
                                                    <input 
                                                        type="text" 
                                                        value={tx.description} 
                                                        onChange={(e) => updateTransaction(tx.id, 'description', e.target.value)}
                                                        className="w-full p-2 text-sm border border-gray-200 rounded focus:ring-1 focus:ring-blue-500 outline-none"
                                                    />
                                                </td>
                                                <td className="p-4">
                                                    <input 
                                                        type="text" 
                                                        value={tx.category} 
                                                        onChange={(e) => updateTransaction(tx.id, 'category', e.target.value)}
                                                        className="w-full p-2 text-sm border border-gray-200 rounded focus:ring-1 focus:ring-blue-500 outline-none"
                                                    />
                                                </td>
                                                <td className="p-4">
                                                    <select 
                                                        value={tx.type} 
                                                        onChange={(e) => updateTransaction(tx.id, 'type', e.target.value)}
                                                        className="w-full p-2 text-sm border border-gray-200 rounded focus:ring-1 focus:ring-blue-500 outline-none bg-white"
                                                    >
                                                        <option value="INCOME">Pemasukan</option>
                                                        <option value="EXPENSE">Pengeluaran</option>
                                                    </select>
                                                </td>
                                                <td className="p-4 text-right">
                                                    <input 
                                                        type="number" 
                                                        value={tx.amount} 
                                                        onChange={(e) => updateTransaction(tx.id, 'amount', parseFloat(e.target.value) || 0)}
                                                        className="w-full p-2 text-sm border border-gray-200 rounded focus:ring-1 focus:ring-blue-500 outline-none text-right"
                                                    />
                                                </td>
                                                <td className="p-4 text-center">
                                                    <button 
                                                        onClick={() => removeTransaction(tx.id)}
                                                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                        {transactions.length === 0 && (
                                            <tr>
                                                <td colSpan={7} className="p-8 text-center text-gray-500">
                                                    Tidak ada transaksi yang dapat ditampilkan.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
