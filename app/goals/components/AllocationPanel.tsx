'use client';

import { useState } from 'react';
import { allocateFunds } from '@/app/actions/goal';

interface AllocationPanelProps {
    availableSurplus: number;
    totalNeeded: number;
    hasActiveGoals: boolean;
}

export default function AllocationPanel({ availableSurplus, totalNeeded, hasActiveGoals }: AllocationPanelProps) {
    const [allocateAmount, setAllocateAmount] = useState<number>(availableSurplus);
    const [isLoading, setIsLoading] = useState(false);
    
    // Custom Modal/Popup State
    const [confirmModal, setConfirmModal] = useState(false);
    const [feedback, setFeedback] = useState<{message: string, type: 'error'|'success' | null}>({message: '', type: null});

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
        }).format(amount);
    };

    const handleAllocateClick = () => {
        if (allocateAmount <= 0) {
            setFeedback({ message: 'Jumlah alokasi harus lebih besar dari 0', type: 'error' });
            return;
        }
        
        if (allocateAmount > availableSurplus) {
            setFeedback({ message: 'Jumlah alokasi tidak boleh melebihi sisa uang bulan ini.', type: 'error' });
            return;
        }

        setConfirmModal(true);
    };

    const confirmAllocation = async () => {
        setConfirmModal(false);
        setIsLoading(true);
        setFeedback({ message: '', type: null });
        
        const res = await allocateFunds(allocateAmount);
        setIsLoading(false);

        if (res.success) {
            setFeedback({ message: 'Alokasi otomatis berhasil ditambahkan!', type: 'success' });
        } else {
            setFeedback({ message: res.error || 'Gagal mengalokasikan', type: 'error' });
        }
    };

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sticky top-24">
            <h3 className="font-semibold text-lg text-gray-900 mb-6 flex items-center gap-2">
                <span className="p-1.5 bg-blue-100 text-blue-600 rounded-lg">💼</span> 
                Alokasi Tabungan
            </h3>

            <div className="space-y-5">
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                    <p className="text-sm text-gray-500 mb-1">Sisa Uang Bulan Ini</p>
                    <p className="text-2xl font-bold text-gray-900">{formatCurrency(availableSurplus)}</p>
                    <p className="text-xs text-gray-400 mt-2">Berdasarkan Total Pemasukan - Pengeluaran bulan berjalan</p>
                </div>

                <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600">Total Kebutuhan Tabungan</span>
                    <span className="font-medium text-gray-900">{formatCurrency(totalNeeded)}</span>
                </div>

                <hr className="border-gray-100" />

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Simulasikan Alokasi Manual (Rp)</label>
                    <input 
                        type="number" 
                        value={allocateAmount}
                        onChange={(e) => setAllocateAmount(Number(e.target.value))}
                        max={availableSurplus > 0 ? availableSurplus : undefined}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    />
                </div>

                <button 
                    onClick={handleAllocateClick}
                    disabled={isLoading || !hasActiveGoals || allocateAmount <= 0}
                    className="w-full bg-blue-600 text-white font-medium py-3 px-4 rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2"
                >
                    {isLoading ? 'Mengalokasikan...' : 'Alokasikan Otomatis Sekarang'}
                </button>

                {availableSurplus > totalNeeded && totalNeeded > 0 && (
                    <div className="mt-4 p-3 bg-blue-50 rounded-lg text-sm text-blue-800">
                        💡 Terdapat <strong>surplus</strong> dari alokasi Anda. Saldo berlebih akan dibiarkan tersisa sebagai dana bebas atau bisa dialokasikan lebih untuk mempercepat durasi.
                    </div>
                )}
            </div>

            {/* Custom Confirm Modal */}
            {confirmModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="p-6 text-center">
                            <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                                </svg>
                            </div>
                            <h3 className="text-lg font-bold text-gray-900 mb-2">Konfirmasi Alokasi</h3>
                            <p className="text-sm text-gray-600 mb-6">
                                Anda akan mengalokasikan <strong>{formatCurrency(allocateAmount)}</strong> secara otomatis ke target tabungan Anda. Sistem akan mengutamakan prioritas yang paling tinggi.
                                Lanjutkan?
                            </p>
                            <div className="flex gap-3">
                                <button 
                                    onClick={() => setConfirmModal(false)}
                                    className="flex-1 py-2.5 px-4 bg-gray-100 text-gray-700 font-medium rounded-xl hover:bg-gray-200 transition"
                                >
                                    Batal
                                </button>
                                <button 
                                    onClick={confirmAllocation}
                                    className="flex-1 py-2.5 px-4 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition"
                                >
                                    Ya, Lanjutkan
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Custom Feedback Alert/Toast */}
            {feedback.type && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in duration-200 text-center p-6">
                        <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${feedback.type === 'success' ? 'bg-green-100 text-green-500' : 'bg-red-100 text-red-500'}`}>
                            {feedback.type === 'success' ? (
                                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
                            ) : (
                                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                            )}
                        </div>
                        <h3 className={`text-lg font-bold mb-2 ${feedback.type === 'success' ? 'text-green-700' : 'text-red-700'}`}>
                            {feedback.type === 'success' ? 'Berhasil' : 'Gagal'}
                        </h3>
                        <p className="text-gray-600 text-sm mb-6">{feedback.message}</p>
                        <button 
                            onClick={() => {
                                setFeedback({message: '', type: null});
                                if (feedback.type === 'success') {
                                    window.location.reload();
                                }
                            }}
                            className="w-full py-2.5 px-4 bg-gray-100 text-gray-800 font-bold rounded-xl hover:bg-gray-200 transition"
                        >
                            Tutup
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
