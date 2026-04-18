'use client';

import { useState } from 'react';
import { editAllocation, deleteAllocation, reallocateFunds } from '@/app/actions/allocation';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/ToastProvider';
import { CurrencyInput } from '@/components/CurrencyInput';

export default function GoalDetailClient({ goal, otherGoals, availableSurplus }: { goal: any, otherGoals: any[], availableSurplus: number }) {
    const router = useRouter();
    const { showToast, showConfirm } = useToast();
    
    // UI State
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    
    // Modals state
    const [editMode, setEditMode] = useState<any>(null); // holds the allocation taking edit
    const [editAmount, setEditAmount] = useState('');
    
    const [reallocateMode, setReallocateMode] = useState<any>(null); // holds source allocation
    const [targetGoalId, setTargetGoalId] = useState('');
    const [transferAmount, setTransferAmount] = useState('');

    const targetNum = Number(goal.targetAmount);
    const currentNum = Number(goal.currentAmount);
    const remainingTarget = targetNum - currentNum;

    // Handlers
    const handleEditSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        
        const newAmt = parseFloat(editAmount);
        if (isNaN(newAmt) || newAmt <= 0) return setError('Nominal tidak valid');

        setLoading(true);
        const res = await editAllocation(editMode.id, newAmt);
        if (res.error) {
            setError(res.error);
        } else {
            setEditMode(null);
            router.refresh();
        }
        setLoading(false);
    };

    const handleDelete = async (allocationId: string) => {
        const confirmed = await showConfirm({
            title: 'Hapus Alokasi',
            message: 'Anda yakin ingin menghapus alokasi ini? Dana akan dikembalikan ke saldo bebas.',
            confirmText: 'Ya, Hapus',
            danger: true,
        });
        if (!confirmed) return;
        setLoading(true);
        const res = await deleteAllocation(allocationId);
        if (res.error) showToast(res.error, 'error');
        else { showToast('Alokasi berhasil dihapus', 'success'); router.refresh(); }
        setLoading(false);
    };

    const handleReallocateSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        
        const trfAmount = parseFloat(transferAmount);
        if (!targetGoalId) return setError('Pilih tabungan tujuan');
        if (isNaN(trfAmount) || trfAmount <= 0) return setError('Nominal transfer tidak valid');

        setLoading(true);
        const res = await reallocateFunds(reallocateMode.id, targetGoalId, trfAmount);
        
        if (res.error) {
            setError(res.error);
        } else {
            setReallocateMode(null);
            showToast('Dana berhasil dipindahkan!', 'success');
            router.refresh();
        }
        setLoading(false);
    };

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                <h2 className="font-bold text-gray-800">Riwayat Alokasi Dana</h2>
                <div className="text-sm font-medium text-gray-500">Total Transaksi: {goal.allocations.length}</div>
            </div>

            {/* ERROR ALERT */}
            {error && (
                <div className="m-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm">
                    {error}
                </div>
            )}

            {goal.allocations.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                    <div className="text-4xl mb-3">📭</div>
                    Belum ada dana yang dialokasikan ke tabungan ini.
                </div>
            ) : (
                <ul className="divide-y divide-gray-100">
                    {goal.allocations.map((alloc: any) => (
                        <li key={alloc.id} className="p-6 hover:bg-gray-50/50 transition-colors">
                            {/* NORMAL VIEW */}
                            {editMode?.id !== alloc.id && reallocateMode?.id !== alloc.id && (
                                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                                    <div>
                                        <p className="font-bold text-gray-900 text-lg">Rp {Number(alloc.amount).toLocaleString('id-ID')}</p>
                                        <div className="text-sm text-gray-500 mt-1 flex items-center gap-2">
                                            <span>
                                                {new Date(alloc.createdAt).toLocaleDateString('id-ID', {
                                                    day: 'numeric', month: 'long', year: 'numeric'
                                                })}
                                            </span>
                                            {alloc.description && (
                                                <>
                                                    <span>•</span>
                                                    <span className="italic">"{alloc.description}"</span>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 w-full sm:w-auto">
                                        <button 
                                            onClick={() => { setEditMode(alloc); setEditAmount(alloc.amount); setReallocateMode(null); }}
                                            className="px-3 py-1.5 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors flex-1 sm:flex-none text-center"
                                        >
                                            Edit
                                        </button>
                                        <button 
                                            onClick={() => { setReallocateMode(alloc); setTransferAmount(alloc.amount); setEditMode(null); }}
                                            className="px-3 py-1.5 text-sm font-medium text-purple-600 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors flex-1 sm:flex-none text-center"
                                        >
                                            Pindahkan
                                        </button>
                                        <button 
                                            onClick={() => handleDelete(alloc.id)}
                                            className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                            title="Hapus Alokasi"
                                        >
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                            </svg>
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* EDIT VIEW */}
                            {editMode?.id === alloc.id && (
                                <form onSubmit={handleEditSubmit} className="bg-blue-50/50 p-4 rounded-xl border border-blue-100">
                                    <h4 className="font-bold text-blue-900 mb-3 text-sm">Ubah Nominal Alokasi</h4>
                                    <div className="flex flex-col sm:flex-row gap-3">
                                        <div className="flex-1">
                                            <div className="relative">
                                                <CurrencyInput 
                                                    value={editAmount}
                                                    onValueChange={setEditAmount}
                                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                                    required
                                                />
                                            </div>
                                            <p className="text-xs text-gray-500 mt-1">Saldo tersedia maksimal untuk penambahan: Rp {availableSurplus.toLocaleString('id-ID')}</p>
                                        </div>
                                        <div className="flex gap-2">
                                            <button type="submit" disabled={loading} className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition">
                                                Simpan
                                            </button>
                                            <button type="button" onClick={() => setEditMode(null)} className="px-4 py-2 bg-gray-200 text-gray-700 font-medium rounded-lg hover:bg-gray-300 transition">
                                                Batal
                                            </button>
                                        </div>
                                    </div>
                                </form>
                            )}

                            {/* REALLOCATE VIEW */}
                            {reallocateMode?.id === alloc.id && (
                                <form onSubmit={handleReallocateSubmit} className="bg-purple-50/50 p-4 rounded-xl border border-purple-100">
                                    <h4 className="font-bold text-purple-900 mb-3 text-sm flex items-center gap-2">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>
                                        Pindahkan (Realokasi) Dana
                                    </h4>
                                    
                                    {otherGoals.length === 0 ? (
                                        <div className="text-sm text-red-600 mb-3">Tidak ada tabungan (goal) lain yang berstatus aktif untuk menerima pindahan ini.</div>
                                    ) : (
                                        <div className="space-y-4">
                                            {/* Baris 1: Nominal */}
                                            <div>
                                                <label className="block text-xs font-medium text-gray-700 mb-1">Nominal yang ingin dipindah</label>
                                                <div className="relative">
                                                    <CurrencyInput 
                                                        value={transferAmount}
                                                        onValueChange={setTransferAmount}
                                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                                                        required
                                                    />
                                                </div>
                                                <p className="text-xs text-gray-500 mt-1">Maksimal yang bisa dipindah dari alokasi ini: Rp {alloc.amount.toLocaleString('id-ID')}</p>
                                            </div>

                                            {/* Baris 2: Tujuan */}
                                            <div>
                                                <label className="block text-xs font-medium text-gray-700 mb-1">Pilih Tabungan Tujuan</label>
                                                <select 
                                                    value={targetGoalId}
                                                    onChange={e => setTargetGoalId(e.target.value)}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                                                    required
                                                >
                                                    <option value="" disabled>-- Pilih Tabungan --</option>
                                                    {otherGoals.map(og => {
                                                        const sisaTgt = Math.max(0, Number(og.targetAmount) - Number(og.currentAmount));
                                                        return (
                                                            <option key={og.id} value={og.id}>
                                                                {og.name} (Sisa Kebutuhan: Rp {sisaTgt.toLocaleString('id-ID')})
                                                            </option>
                                                        )
                                                    })}
                                                </select>
                                            </div>

                                            <div className="flex gap-2">
                                                <button type="submit" disabled={loading || !targetGoalId} className="px-4 py-2 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 transition">
                                                    Proses Pindah
                                                </button>
                                                <button type="button" onClick={() => setReallocateMode(null)} className="px-4 py-2 bg-gray-200 text-gray-700 font-medium rounded-lg hover:bg-gray-300 transition">
                                                    Batal
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </form>
                            )}

                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
