'use client';

import { useState } from 'react';
import { allocateFunds, syncGoalsAction } from '@/app/actions/goal';
import { CurrencyInput } from '@/components/CurrencyInput';
import { formatCurrency } from '@/lib/utils';

interface AllocationPanelProps {
    availableSurplus: number;
    totalNeeded: number;
    hasActiveGoals: boolean;
}

export default function AllocationPanel({ availableSurplus, totalNeeded, hasActiveGoals }: AllocationPanelProps) {
    const [useMaxSurplus, setUseMaxSurplus] = useState(false);
    const [allocateAmount, setAllocateAmount] = useState<number>(totalNeeded);
    const [isLoading, setIsLoading] = useState(false);
    
    // Custom Modal/Popup State
    const [confirmModal, setConfirmModal] = useState(false);
    const [feedback, setFeedback] = useState<{message: string, type: 'error'|'success' | null}>({message: '', type: null});

    const handleMaxSurplusToggle = (checked: boolean) => {
        setUseMaxSurplus(checked);
        if (checked) {
            setAllocateAmount(availableSurplus);
        } else {
            setAllocateAmount(totalNeeded);
        }
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
            setFeedback({ message: (res as any).error || 'Gagal mengalokasikan', type: 'error' });
        }
    };

    const handleSyncClick = async () => {
        setIsLoading(true);
        const res = await syncGoalsAction();
        setIsLoading(false);

        if (res.success) {
            setFeedback({ message: `Sinkronisasi berhasil! ${(res as any).syncedCount} goal diperbarui.`, type: 'success' });
        } else {
            setFeedback({ message: (res as any).error || 'Gagal sinkronisasi', type: 'error' });
        }
    };

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 md:sticky md:top-24">
            <div className="flex justify-between items-center mb-6">
                <h3 className="font-semibold text-lg text-gray-900 flex items-center gap-2">
                    <span className="p-1.5 bg-blue-100 text-blue-600 rounded-lg">💼</span> 
                    Alokasi Tabungan
                </h3>
                <button 
                    onClick={handleSyncClick}
                    disabled={isLoading}
                    title="Sinkronkan Data"
                    className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                >
                    <svg className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                </button>
            </div>

            <div className="space-y-5">
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                    <div className="flex justify-between items-start mb-1">
                        <p className="text-sm text-gray-500">Sisa Uang Bulan Ini</p>
                        <div className="flex items-center gap-2 cursor-pointer group" onClick={() => handleMaxSurplusToggle(!useMaxSurplus)}>
                            <input 
                                type="checkbox" 
                                checked={useMaxSurplus}
                                onChange={(e) => handleMaxSurplusToggle(e.target.checked)}
                                className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 cursor-pointer"
                            />
                            <span className="text-[10px] font-bold text-gray-600 group-hover:text-blue-600 transition-colors">Pakai Semua</span>
                        </div>
                    </div>
                    <p className={`text-2xl font-bold transition-colors ${useMaxSurplus ? 'text-blue-600' : 'text-gray-900'}`}>
                        {formatCurrency(availableSurplus)}
                    </p>
                    <p className="text-[10px] text-gray-400 mt-2">Berdasarkan Total Pemasukan - Pengeluaran bulan berjalan</p>
                </div>

                <hr className="border-gray-100" />

                <div>
                    <div className="flex justify-between items-center mb-2">
                        <label className="block text-sm font-medium text-gray-700">Total Alokasi Tabungan</label>
                        {!useMaxSurplus && allocateAmount !== totalNeeded && (
                            <button 
                                onClick={() => setAllocateAmount(totalNeeded)}
                                className="text-[10px] text-blue-600 hover:underline font-medium"
                            >
                                Reset ke Kebutuhan
                            </button>
                        )}
                        {useMaxSurplus && (
                            <span className="text-[10px] text-blue-600 font-bold animate-pulse">Mode Maksimal ✨</span>
                        )}
                    </div>
                    <CurrencyInput 
                        value={allocateAmount}
                        onValueChange={(val) => !useMaxSurplus && setAllocateAmount(Number(val))}
                        disabled={useMaxSurplus}
                        className={`w-full px-4 py-2.5 border rounded-lg outline-none font-bold transition-all ${
                            useMaxSurplus 
                            ? 'bg-blue-50 border-blue-200 text-blue-600 cursor-not-allowed' 
                            : 'border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-blue-600'
                        }`}
                    />
                    <p className="text-[10px] text-gray-400 mt-1 italic">
                        {useMaxSurplus 
                         ? '*Seluruh sisa uang akan dihabiskan untuk mempercepat tabungan Anda.'
                         : '*Nilai ini akan dibagikan secara otomatis ke seluruh target tabungan Anda.'}
                    </p>
                </div>

                <button 
                    onClick={handleAllocateClick}
                    disabled={isLoading || !hasActiveGoals || allocateAmount <= 0}
                    className="w-full bg-blue-600 text-white font-medium py-3 px-4 rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2"
                >
                    {isLoading ? 'Mengalokasikan...' : 'Alokasikan Sekarang'}
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
