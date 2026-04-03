'use client';

import { useState } from 'react';
import { createGoal } from '@/app/actions/goal';
import { useToast } from '@/components/ToastProvider';

export default function CreateGoalModal() {
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const { showToast } = useToast();

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsLoading(true);
        
        const formData = new FormData(e.currentTarget);
        const res = await createGoal(formData);
        
        setIsLoading(false);
        if (res.success) {
            setIsOpen(false);
            showToast('Tabungan baru berhasil dibuat! 🎯', 'success');
        } else {
            showToast(res.error || 'Terjadi kesalahan', 'error');
        }
    };

    return (
        <>
            <button 
                onClick={() => setIsOpen(true)}
                className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-5 py-2.5 rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 transition flex items-center gap-2 shadow-sm"
            >
                <span>+</span> Tambah Goal 
            </button>

            {isOpen && (
                <div className="fixed inset-0 z-50 overflow-y-auto">
                    <div className="flex min-h-screen items-center justify-center p-4 text-center sm:p-0">
                        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setIsOpen(false)}></div>

                        <div className="relative transform overflow-hidden rounded-2xl bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg">
                            <form onSubmit={handleSubmit} className="px-6 py-6 p-8">
                                <div>
                                    <h3 className="text-xl font-semibold leading-6 text-gray-900 mb-6">
                                        Buat Target Tabungan Baru
                                    </h3>
                                    
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Nama Goal</label>
                                            <input required name="name" type="text" placeholder="Contoh: Dana Darurat" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Target Nominal (Rp)</label>
                                            <input required name="targetAmount" type="number" min="0" placeholder="5000000" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Durasi Mencapai Target (Bulan)</label>
                                            <input required name="durationMonths" type="number" min="1" placeholder="12" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" />
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Tanggal Mulai</label>
                                                <input required name="startDate" type="date" defaultValue={new Date().toISOString().split('T')[0]} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Prioritas</label>
                                                <select name="priority" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none">
                                                    <option value="HIGH">High</option>
                                                    <option value="MEDIUM" selected>Medium</option>
                                                    <option value="LOW">Low</option>
                                                </select>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="mt-8 flex justify-end gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setIsOpen(false)}
                                        className="rounded-lg bg-white px-4 py-2.5 text-sm font-medium text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
                                    >
                                        Batal
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isLoading}
                                        className="inline-flex justify-center rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-blue-500 disabled:opacity-50"
                                    >
                                        {isLoading ? 'Menyimpan...' : 'Simpan Goal'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
