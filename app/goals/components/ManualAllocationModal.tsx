'use client';

import { useState } from 'react';
import { manualAllocate } from '@/app/actions/allocation';
import { useRouter } from 'next/navigation';

export default function ManualAllocationModal({ 
    availableSurplus, 
    activeGoals 
}: { 
    availableSurplus: number, 
    activeGoals: any[] 
}) {
    const router = useRouter();
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const [selectedGoalId, setSelectedGoalId] = useState('');
    const [amount, setAmount] = useState('');
    const [description, setDescription] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        const allocAmount = parseFloat(amount);
        if (!selectedGoalId) return setError('Pilih tabungan tujuan terlebih dahulu.');
        if (isNaN(allocAmount) || allocAmount <= 0) return setError('Nominal alokasi tidak valid.');
        
        if (allocAmount > availableSurplus) {
            return setError(`Saldo tidak mencukupi untuk alokasi ini. Saldo: Rp ${availableSurplus.toLocaleString('id-ID')}`);
        }

        const goal = activeGoals.find(g => g.id === selectedGoalId);
        if (goal) {
            const sisaTarget = Math.max(0, Number(goal.targetAmount) - Number(goal.currentAmount));
            if (allocAmount > sisaTarget) {
                return setError(`Jumlah melebihi sisa target goal. Sisa target: Rp ${sisaTarget.toLocaleString('id-ID')}`);
            }
        }

        setLoading(true);
        const res = await manualAllocate(selectedGoalId, allocAmount, description);
        
        if (res.error) {
            setError(res.error);
        } else {
            setIsOpen(false);
            setAmount('');
            setDescription('');
            setSelectedGoalId('');
            router.refresh();
        }
        setLoading(false);
    };

    return (
        <>
            <button 
                onClick={() => setIsOpen(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-lg transition-colors flex items-center gap-2"
            >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Alokasi Manual
            </button>

            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                            <h3 className="font-bold text-gray-900 text-lg">Alokasikan Dana Manual</h3>
                            <button 
                                onClick={() => setIsOpen(false)}
                                className="text-gray-400 hover:text-gray-600 transition-colors"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>
                        
                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            {error && (
                                <div className="bg-red-50 text-red-700 px-4 py-3 rounded-lg text-sm border border-red-200">
                                    {error}
                                </div>
                            )}

                            <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl flex justify-between items-center">
                                <span className="text-sm font-medium text-blue-800">Saldo Tersedia:</span>
                                <span className="text-lg font-bold text-blue-600">Rp {availableSurplus.toLocaleString('id-ID')}</span>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Tabungan Tujuan</label>
                                <select 
                                    value={selectedGoalId}
                                    onChange={e => setSelectedGoalId(e.target.value)}
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                    required
                                >
                                    <option value="" disabled>-- Pilih Tabungan --</option>
                                    {activeGoals.map(g => {
                                        const sisa = Math.max(0, Number(g.targetAmount) - Number(g.currentAmount));
                                        return (
                                            <option key={g.id} value={g.id}>
                                                {g.name} (Sisa Target: Rp {sisa.toLocaleString('id-ID')})
                                            </option>
                                        )
                                    })}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Nominal Alokasi</label>
                                <div className="relative">
                                    <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-gray-500 font-medium">Rp</span>
                                    <input 
                                        type="number"
                                        value={amount}
                                        onChange={e => setAmount(e.target.value)}
                                        className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                        placeholder="0"
                                        required
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Catatan Tambahan <span className="text-gray-400 font-normal">(opsional)</span></label>
                                <input 
                                    type="text"
                                    value={description}
                                    onChange={e => setDescription(e.target.value)}
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                    placeholder="Bonus bulanan..."
                                />
                            </div>

                            <div className="pt-4 border-t border-gray-100 flex gap-3">
                                <button 
                                    type="button" 
                                    onClick={() => setIsOpen(false)}
                                    className="flex-1 px-4 py-3 bg-white border border-gray-200 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition"
                                >
                                    Batal
                                </button>
                                <button 
                                    type="submit" 
                                    disabled={loading || !selectedGoalId || !amount}
                                    className="flex-1 px-4 py-3 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition disabled:opacity-50"
                                >
                                    {loading ? 'Memproses...' : 'Alokasikan'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
}
