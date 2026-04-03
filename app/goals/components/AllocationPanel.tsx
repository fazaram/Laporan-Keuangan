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

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
        }).format(amount);
    };

    const handleAllocate = async () => {
        if (allocateAmount <= 0) {
            alert('Jumlah alokasi harus lebih besar dari 0');
            return;
        }

        if (!confirm(`Alokasikan ${formatCurrency(allocateAmount)} ke target tabungan Anda? Sistem akan mengutamakan prioritas High (Tinggi).`)) return;

        setIsLoading(true);
        const res = await allocateFunds(allocateAmount);
        setIsLoading(false);

        if (res.success) {
            alert('Alokasi berhasil ditambahkan!');
        } else {
            alert(res.error || 'Gagal mengalokasikan');
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
                    onClick={handleAllocate}
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
        </div>
    );
}
