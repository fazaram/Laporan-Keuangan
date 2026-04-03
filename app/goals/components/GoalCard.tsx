'use client';

import { useState } from 'react';
import { deleteGoal } from '@/app/actions/goal';

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
    const [isDeleting, setIsDeleting] = useState(false);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
        }).format(amount);
    };

    const progress = Math.min(100, Math.round((goal.currentAmount / goal.targetAmount) * 100));
    
    // Hitung sisa bulan
    const now = new Date();
    const startDate = new Date(goal.startDate);
    const monthsPassed = (now.getFullYear() - startDate.getFullYear()) * 12 + (now.getMonth() - startDate.getMonth());
    const remainingMonths = Math.max(0, goal.durationMonths - monthsPassed);

    const neededPerMonth = remainingMonths > 0 
        ? Math.max(0, goal.targetAmount - goal.currentAmount) / remainingMonths 
        : 0;

    const handleDelete = async () => {
        if (!confirm('Apakah Anda yakin ingin menghapus goal ini?')) return;
        setIsDeleting(true);
        await deleteGoal(goal.id);
        setIsDeleting(false);
    };

    const priorityColors = {
        HIGH: 'bg-red-100 text-red-800 border-red-200',
        MEDIUM: 'bg-yellow-100 text-yellow-800 border-yellow-200',
        LOW: 'bg-green-100 text-green-800 border-green-200',
    };

    return (
        <div className={`bg-white rounded-xl shadow-sm border p-5 transition-all hover:shadow-md ${goal.status === 'COMPLETED' ? 'border-green-400 bg-green-50' : 'border-gray-200'}`}>
            <div className="flex justify-between items-start mb-4">
                <div>
                    <h3 className="font-semibold text-lg text-gray-900">{goal.name}</h3>
                    <div className="flex gap-2 mt-2">
                        <span className={`text-xs px-2.5 py-1 rounded-full font-medium border ${priorityColors[goal.priority]}`}>
                            {goal.priority} Priority
                        </span>
                        {goal.status === 'COMPLETED' && (
                            <span className="text-xs px-2.5 py-1 rounded-full font-medium bg-green-500 text-white">
                                Selesai
                            </span>
                        )}
                    </div>
                </div>
                <button 
                    onClick={handleDelete}
                    disabled={isDeleting}
                    className="text-gray-400 hover:text-red-500 transition-colors p-1"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                </button>
            </div>

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
                        ></div>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-100 text-sm">
                    <div>
                        <p className="text-gray-500 text-xs">Sisa Waktu</p>
                        <p className="font-medium text-gray-900">{remainingMonths} Bulan</p>
                    </div>
                    <div>
                        <p className="text-gray-500 text-xs">Kebutuhan per Bulan</p>
                        <p className="font-medium text-gray-900">{formatCurrency(neededPerMonth)}</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
