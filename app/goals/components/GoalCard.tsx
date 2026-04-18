'use client';

import { useState } from 'react';
import { deleteGoal, updateGoal } from '@/app/actions/goal';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useToast } from '@/components/ToastProvider';
import { CurrencyInput } from '@/components/CurrencyInput';
import { formatCurrency } from '@/lib/utils';

interface GoalCardProps {
    goal: {
        id: string;
        name: string;
        targetAmount: number;
        currentAmount: number;
        durationMonths: number;
        startDate: Date;
        priority: 'LOW' | 'MEDIUM' | 'HIGH';
        status: 'ACTIVE' | 'COMPLETED';
    };
}

export default function GoalCard({ goal }: GoalCardProps) {
    const router = useRouter();
    const { showToast, showConfirm } = useToast();
    const [isDeleting, setIsDeleting] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [editLoading, setEditLoading] = useState(false);
    const [editError, setEditError] = useState('');

    const [editName, setEditName] = useState(goal.name);
    const [editTarget, setEditTarget] = useState(goal.targetAmount.toString());
    const [editPriority, setEditPriority] = useState<'LOW' | 'MEDIUM' | 'HIGH'>(goal.priority);
    const [editDuration, setEditDuration] = useState(goal.durationMonths.toString());



    const progress = Math.min(100, Math.round((goal.currentAmount / goal.targetAmount) * 100));
    const now = new Date();
    const startDate = new Date(goal.startDate);
    const monthsPassed = (now.getFullYear() - startDate.getFullYear()) * 12 + (now.getMonth() - startDate.getMonth());
    const remainingMonths = Math.max(0, goal.durationMonths - monthsPassed);
    const neededPerMonth = remainingMonths > 0 ? Math.max(0, goal.targetAmount - goal.currentAmount) / remainingMonths : 0;

    const handleDelete = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        const confirmed = await showConfirm({
            title: 'Hapus Tabungan',
            message: 'Apakah Anda yakin ingin menghapus tabungan ini? Semua riwayat alokasi akan ikut terhapus.',
            confirmText: 'Ya, Hapus',
            danger: true,
        });
        if (!confirmed) return;
        setIsDeleting(true);
        const res = await deleteGoal(goal.id);
        if ((res as any)?.error) showToast((res as any).error, 'error');
        else showToast('Tabungan berhasil dihapus', 'success');
        setIsDeleting(false);
    };

    const openEdit = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setEditName(goal.name);
        setEditTarget(goal.targetAmount.toString());
        setEditPriority(goal.priority);
        setEditDuration(goal.durationMonths.toString());
        setEditError('');
        setShowEditModal(true);
    };

    const handleEditSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setEditError('');
        const targetNum = parseFloat(editTarget);
        const durationNum = parseInt(editDuration);
        if (!editName.trim()) return setEditError('Nama goal tidak boleh kosong');
        if (isNaN(targetNum) || targetNum <= 0) return setEditError('Target nominal harus lebih dari 0');
        if (isNaN(durationNum) || durationNum <= 0) return setEditError('Durasi harus lebih dari 0');

        setEditLoading(true);
        const res = await updateGoal(goal.id, {
            name: editName.trim(),
            targetAmount: targetNum,
            priority: editPriority,
            durationMonths: durationNum,
        });
        setEditLoading(false);

        if (res.error) {
            setEditError(res.error);
        } else {
            setShowEditModal(false);
            showToast('Tabungan berhasil diperbarui!', 'success');
            router.refresh();
        }
    };

    const priorityColors = {
        HIGH: 'bg-red-100 text-red-800 border-red-200',
        MEDIUM: 'bg-yellow-100 text-yellow-800 border-yellow-200',
        LOW: 'bg-green-100 text-green-800 border-green-200',
    };
    const priorityLabels = { HIGH: 'Tinggi', MEDIUM: 'Sedang', LOW: 'Rendah' };

    return (
        <>
            <div className={`bg-white rounded-xl shadow-sm border transition-all hover:shadow-md hover:-translate-y-0.5 overflow-hidden ${goal.status === 'COMPLETED' ? 'border-green-400 bg-green-50' : 'border-gray-200'}`}>
                {/* Header: nama + tombol edit/hapus */}
                <div className="flex justify-between items-start p-5 pb-3">
                    <div className="flex-1 min-w-0 pr-2">
                        <h3 className="font-semibold text-lg text-gray-900 truncate">{goal.name}</h3>
                        <div className="flex gap-2 mt-2 flex-wrap">
                            <span className={`text-xs px-2.5 py-1 rounded-full font-medium border ${priorityColors[goal.priority]}`}>
                                {priorityLabels[goal.priority]}
                            </span>
                            {goal.status === 'COMPLETED' && (
                                <span className="text-xs px-2.5 py-1 rounded-full font-medium bg-green-500 text-white">
                                    Selesai
                                </span>
                            )}
                        </div>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                        <button
                            onClick={openEdit}
                            className="text-gray-400 hover:text-blue-500 transition-colors p-1.5 rounded-lg hover:bg-blue-50"
                            title="Edit Goal"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                        </button>
                        <button
                            onClick={handleDelete}
                            disabled={isDeleting}
                            className="text-gray-400 hover:text-red-500 transition-colors p-1.5 rounded-lg hover:bg-red-50"
                            title="Hapus Goal"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Body — klik untuk ke halaman detail alokasi */}
                <Link href={`/goals/${goal.id}`} className="block px-5 pb-5 group">
                    <div className="space-y-4">
                        <div>
                            <div className="flex justify-between text-sm mb-1">
                                <span className="text-gray-600">Progres ({progress}%)</span>
                                <span className="font-medium text-gray-900">{formatCurrency(goal.currentAmount)} / {formatCurrency(goal.targetAmount)}</span>
                            </div>
                            <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                                <div
                                    className={`h-2.5 rounded-full transition-all duration-500 ${goal.status === 'COMPLETED' ? 'bg-green-500' : 'bg-gradient-to-r from-blue-500 to-blue-600'}`}
                                    style={{ width: `${progress}%` }}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 pt-3 border-t border-gray-100 text-sm">
                            <div>
                                <p className="text-gray-500 text-xs">Sisa Waktu</p>
                                <p className="font-medium text-gray-900">{remainingMonths} Bulan</p>
                            </div>
                            <div>
                                <p className="text-gray-500 text-xs">Kebutuhan per Bulan</p>
                                <p className="font-medium text-gray-900">{formatCurrency(neededPerMonth)}</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-1 text-xs text-blue-500 font-medium group-hover:text-blue-700 transition-colors">
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                            </svg>
                            Kelola alokasi dana
                        </div>
                    </div>
                </Link>
            </div>

            {/* Edit Modal */}
            {showEditModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
                            <h3 className="font-bold text-gray-900 text-lg">Edit Target Tabungan</h3>
                            <button
                                onClick={() => setShowEditModal(false)}
                                className="text-gray-400 hover:text-gray-600 transition-colors p-1"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <form onSubmit={handleEditSubmit} className="p-6 space-y-4">
                            {editError && (
                                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                                    {editError}
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Nama Goal</label>
                                <input
                                    type="text"
                                    value={editName}
                                    onChange={e => setEditName(e.target.value)}
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                    placeholder="Contoh: Dana Darurat"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Target Nominal</label>
                                <div className="relative">
                                    <CurrencyInput
                                        value={editTarget}
                                        onValueChange={setEditTarget}
                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                        placeholder="Rp 0"
                                        required
                                    />
                                </div>
                                {parseFloat(editTarget) < goal.currentAmount && (
                                    <p className="text-xs text-amber-600 mt-1">⚠️ Target lebih kecil dari dana terkumpul. Tabungan akan otomatis ditandai Selesai.</p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Prioritas</label>
                                <div className="grid grid-cols-3 gap-2">
                                    {(['HIGH', 'MEDIUM', 'LOW'] as const).map(p => (
                                        <button
                                            key={p}
                                            type="button"
                                            onClick={() => setEditPriority(p)}
                                            className={`py-2.5 px-3 rounded-lg text-sm font-medium border transition-all ${
                                                editPriority === p
                                                    ? p === 'HIGH' ? 'bg-red-500 text-white border-red-500'
                                                    : p === 'MEDIUM' ? 'bg-yellow-500 text-white border-yellow-500'
                                                    : 'bg-green-500 text-white border-green-500'
                                                    : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                                            }`}
                                        >
                                            {priorityLabels[p]}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Durasi (Bulan)</label>
                                <input
                                    type="number"
                                    value={editDuration}
                                    onChange={e => setEditDuration(e.target.value)}
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                    min={1}
                                    required
                                />
                            </div>

                            <div className="pt-4 border-t border-gray-100 flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => setShowEditModal(false)}
                                    className="flex-1 py-3 px-4 bg-white border border-gray-200 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={editLoading}
                                    className="flex-1 py-3 px-4 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition disabled:opacity-50"
                                >
                                    {editLoading ? 'Menyimpan...' : 'Simpan Perubahan'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
}
