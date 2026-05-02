'use client';

import { useState } from 'react';
import { updateFixedIncome } from '@/app/actions/profile';
import { MAX_ALLOWED_AMOUNT } from '@/lib/utils';
import { CurrencyInput } from './CurrencyInput';

interface FixedIncomeModalProps {
    user: {
        fixedIncome?: number | null;
        fixedIncomeStartDate?: Date | null;
    };
    onClose: () => void;
}

export function FixedIncomeModal({ user, onClose }: FixedIncomeModalProps) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [amount, setAmount] = useState(user.fixedIncome?.toString() || '');

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        const formData = new FormData(e.currentTarget);
        const result = await updateFixedIncome(formData);

        if (result.error) {
            setError(result.error);
            setLoading(false);
        } else {
            onClose();
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
                <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                    <div>
                        <h3 className="text-lg font-bold text-gray-900">Penghasilan Tetap</h3>
                        <p className="text-xs text-gray-500">Gaji bulanan otomatis</p>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-2 rounded-lg text-sm">
                            {error}
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Nominal (Rp)</label>
                        <div className="relative">
                            <input type="hidden" name="amount" value={amount} />
                            <CurrencyInput
                                value={amount}
                                onValueChange={setAmount}
                                required
                                placeholder="Rp 0"
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                            />
                        </div>
                        <p className="mt-1 text-[10px] text-gray-500 italic">*Nilai ini akan ditambahkan ke pemasukan bulanan otomatis.</p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Berlaku Sejak</label>
                        <input
                            type="date"
                            name="startDate"
                            defaultValue={user.fixedIncomeStartDate ? new Date(user.fixedIncomeStartDate).toISOString().split('T')[0] : ''}
                            required
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                        />
                    </div>

                    <div className="pt-4 flex gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors"
                        >
                            Batal
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 px-4 py-2 text-white bg-blue-600 hover:bg-blue-700 rounded-lg font-medium transition-colors disabled:opacity-50"
                        >
                            {loading ? 'Simpan' : 'Simpan Settings'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
