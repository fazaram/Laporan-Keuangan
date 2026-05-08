'use client';

import { useState, useEffect } from 'react';
import { Navbar } from '@/components/Navbar';
import { WalletCard } from '@/components/WalletCard';
import { formatCurrency } from '@/lib/utils';
import { CurrencyInput } from '@/components/CurrencyInput';
import { useToast } from '@/components/ToastProvider';

export default function SmartWalletPage() {
    const { showToast, showConfirm } = useToast();
    const [wallets, setWallets] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isAddingWallet, setIsAddingWallet] = useState(false);
    const [isAddingRule, setIsAddingRule] = useState<string | null>(null);

    // Form states
    const [newWallet, setNewWallet] = useState({ name: '', icon: '' });
    const [newRule, setNewRule] = useState({ percentage: '', fixedAmount: '' });

    const fetchWallets = async () => {
        setIsLoading(true);
        try {
            const response = await fetch('/api/wallets');
            const data = await response.json();
            if (data.wallets) setWallets(data.wallets);
        } catch (error) {
            showToast('Gagal memuat wallet', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchWallets();
    }, []);

    const handleCreateWallet = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const response = await fetch('/api/wallets', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newWallet)
            });
            const data = await response.json();
            if (data.error) throw new Error(data.error);
            
            showToast('Wallet berhasil dibuat', 'success');
            setNewWallet({ name: '', icon: '' });
            setIsAddingWallet(false);
            fetchWallets();
        } catch (error: any) {
            showToast(error.message, 'error');
        }
    };

    const handleCreateRule = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const response = await fetch('/api/wallets/rules', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    walletId: isAddingRule,
                    percentage: newRule.percentage ? Number(newRule.percentage) : null,
                    fixedAmount: newRule.fixedAmount ? Number(newRule.fixedAmount) : null,
                })
            });
            const data = await response.json();
            if (data.error) throw new Error(data.error);

            showToast('Aturan alokasi berhasil ditambahkan', 'success');
            setNewRule({ percentage: '', fixedAmount: '' });
            setIsAddingRule(null);
            fetchWallets();
        } catch (error: any) {
            showToast(error.message, 'error');
        }
    };

    const handleReset = async (resetBudget: boolean) => {
        const confirmed = await showConfirm({
            title: 'Reset Wallet',
            message: `Apakah Anda yakin ingin mereset ${resetBudget ? 'Anggaran & Pengeluaran' : 'Pengeluaran'} semua wallet?`,
            danger: true
        });
        if (!confirmed) return;
        
        try {
            const response = await fetch('/api/wallets/reset', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ resetBudget })
            });
            if (response.ok) {
                showToast('Wallet berhasil direset', 'success');
                fetchWallets();
            }
        } catch (error) {
            showToast('Gagal mereset wallet', 'error');
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <Navbar />

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">Smart Wallet</h1>
                        <p className="text-gray-600">Sistem alokasi anggaran otomatis untuk pengeluaran Anda.</p>
                    </div>
                    <div className="flex gap-3">
                        <button 
                            onClick={() => setIsAddingWallet(true)}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl font-semibold transition-all shadow-sm flex items-center gap-2"
                        >
                            <span>+ Wallet Baru</span>
                        </button>
                        <button 
                            onClick={() => handleReset(false)}
                            className="bg-white border border-gray-200 text-gray-700 px-4 py-2 rounded-xl font-semibold hover:bg-gray-50 transition-all shadow-sm"
                        >
                            Reset Bulan Ini
                        </button>
                    </div>
                </div>

                {isLoading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[1, 2, 3].map(n => (
                            <div key={n} className="bg-white rounded-2xl p-6 h-48 animate-pulse border border-gray-100 shadow-sm" />
                        ))}
                    </div>
                ) : wallets.length === 0 ? (
                    <div className="bg-white rounded-3xl p-12 text-center border-2 border-dashed border-gray-200">
                        <div className="text-5xl mb-4">👛</div>
                        <h2 className="text-xl font-bold text-gray-900 mb-2">Belum ada Smart Wallet</h2>
                        <p className="text-gray-500 mb-6">Buat wallet pertama Anda untuk mulai mengatur anggaran otomatis.</p>
                        <button 
                            onClick={() => setIsAddingWallet(true)}
                            className="text-blue-600 font-bold hover:underline"
                        >
                            Buat Wallet Sekarang →
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {wallets.map(wallet => (
                            <WalletCard 
                                key={wallet.id} 
                                wallet={wallet} 
                                onAddRule={(id) => setIsAddingRule(id)} 
                            />
                        ))}
                    </div>
                )}
            </main>

            {/* Modal Add Wallet */}
            {isAddingWallet && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl animate-in fade-in zoom-in duration-200">
                        <h2 className="text-2xl font-bold mb-6">Tambah Wallet Baru</h2>
                        <form onSubmit={handleCreateWallet} className="space-y-4">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Nama Wallet</label>
                                <input 
                                    type="text" 
                                    required
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                                    placeholder="Contoh: Makan, Transportasi, Hiburan..."
                                    value={newWallet.name}
                                    onChange={(e) => setNewWallet({...newWallet, name: e.target.value})}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Emoji / Icon (Opsional)</label>
                                <input 
                                    type="text" 
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                                    placeholder="🍔, 🚗, 🎮..."
                                    value={newWallet.icon}
                                    onChange={(e) => setNewWallet({...newWallet, icon: e.target.value})}
                                />
                            </div>
                            <div className="flex gap-3 mt-8">
                                <button 
                                    type="button"
                                    onClick={() => setIsAddingWallet(false)}
                                    className="flex-1 px-4 py-3 rounded-xl border border-gray-200 font-bold hover:bg-gray-50 transition-all text-gray-600"
                                >
                                    Batal
                                </button>
                                <button 
                                    type="submit"
                                    className="flex-1 px-4 py-3 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-200"
                                >
                                    Simpan
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal Add Rule */}
            {isAddingRule && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl animate-in fade-in zoom-in duration-200">
                        <h2 className="text-2xl font-bold mb-2">Aturan Alokasi</h2>
                        <p className="text-gray-500 text-sm mb-6">Tentukan bagaimana pemasukan akan dibagikan ke wallet ini.</p>
                        
                        <form onSubmit={handleCreateRule} className="space-y-4">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Persentase (%)</label>
                                <div className="relative">
                                    <input 
                                        type="number" 
                                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none pr-10"
                                        placeholder="0"
                                        value={newRule.percentage}
                                        onChange={(e) => setNewRule({...newRule, percentage: e.target.value, fixedAmount: ''})}
                                    />
                                    <span className="absolute right-4 top-3.5 text-gray-400">%</span>
                                </div>
                                <p className="text-[10px] text-gray-400 mt-1">Contoh: 10% dari tiap pemasukan.</p>
                            </div>
                            
                            <div className="relative flex items-center justify-center py-2">
                                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-100"></div></div>
                                <span className="relative px-3 bg-white text-xs text-gray-400 font-bold">ATAU</span>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Nominal Tetap (Rp)</label>
                                <CurrencyInput 
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none"
                                    placeholder="Rp 0"
                                    value={newRule.fixedAmount}
                                    onValueChange={(val) => setNewRule({...newRule, fixedAmount: val, percentage: ''})}
                                />
                                <p className="text-[10px] text-gray-400 mt-1">Setiap ada pemasukan, wallet akan diisi nominal ini.</p>
                            </div>

                            <div className="flex gap-3 mt-8">
                                <button 
                                    type="button"
                                    onClick={() => setIsAddingRule(null)}
                                    className="flex-1 px-4 py-3 rounded-xl border border-gray-200 font-bold hover:bg-gray-50 transition-all text-gray-600"
                                >
                                    Batal
                                </button>
                                <button 
                                    type="submit"
                                    className="flex-1 px-4 py-3 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-200"
                                >
                                    Simpan Rule
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
