'use client';

import { useState, useEffect } from 'react';
import { Navbar } from '@/components/Navbar';
import { EditProfileModal } from '@/components/EditProfileModal';
import { FixedIncomeModal } from '@/components/FixedIncomeModal';
import { formatCurrency } from '@/lib/utils';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default function ProfilePage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [userData, setUserData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [showEditProfile, setShowEditProfile] = useState(false);
    const [showEditFixedIncome, setShowEditFixedIncome] = useState(false);

    const fetchUserData = async () => {
        try {
            const res = await fetch('/api/user/profile');
            const data = await res.json();
            setUserData(data);
        } catch (error) {
            console.error('Failed to fetch profile:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push('/login');
        } else if (status === 'authenticated') {
            fetchUserData();
        }
    }, [status, router]);

    if (loading || status === 'loading') {
        return (
            <div className="min-h-screen bg-gray-50">
                <Navbar />
                <div className="flex items-center justify-center h-[calc(100-64px)] py-20">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                </div>
            </div>
        );
    }

    const birthDateStr = userData?.birthDate 
        ? new Date(userData.birthDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
        : 'Belum diatur';

    const incomeStartDateStr = userData?.fixedIncomeStartDate
        ? new Date(userData.fixedIncomeStartDate).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })
        : '-';

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            <Navbar />

            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-10">
                {/* Profile Header (Portfolio Style) */}
                <div className="bg-white rounded-3xl shadow-xl overflow-hidden mb-8 border border-gray-100">
                    <div className="h-32 bg-gradient-to-r from-blue-600 to-purple-600"></div>
                    <div className="px-8 pb-8 relative">
                        <div className="flex flex-col sm:flex-row items-center sm:items-end gap-6 -mt-16 mb-6">
                            <div className="w-32 h-32 rounded-3xl border-4 border-white bg-white shadow-lg overflow-hidden flex items-center justify-center group relative cursor-pointer">
                                {userData?.profileImage ? (
                                    <img src={userData.profileImage} alt="Profile" className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full bg-blue-50 flex items-center justify-center text-blue-600">
                                        <span className="text-4xl font-bold">{userData?.name?.charAt(0) || 'U'}</span>
                                    </div>
                                )}
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                                    </svg>
                                </div>
                            </div>
                            <div className="flex-1 text-center sm:text-left">
                                <h1 className="text-3xl font-extrabold text-gray-900 mb-1">{userData?.name}</h1>
                                <p className="text-gray-500 font-medium">{userData?.email}</p>
                            </div>
                            <button 
                                onClick={() => setShowEditProfile(true)}
                                className="px-6 py-2 bg-white border-2 border-gray-100 hover:border-blue-500 hover:text-blue-600 rounded-xl font-bold transition-all shadow-sm"
                            >
                                Edit Profile
                            </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
                            <div className="space-y-6">
                                <div>
                                    <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-2">Biografi</h3>
                                    <p className="text-gray-700 leading-relaxed italic">
                                        {userData?.bio || "Belum ada biografi. Tambahkan sedikit cerita tentang diri Anda."}
                                    </p>
                                </div>

                                <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl border border-gray-100">
                                    <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600">
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                        </svg>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500 font-bold mb-0.5">TANGGAL LAHIR</p>
                                        <p className="text-sm font-bold text-gray-900">{birthDateStr}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-6">
                                <div className="bg-gradient-to-br from-indigo-50 to-blue-50 rounded-3xl p-6 border border-indigo-100 shadow-sm relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                                        <svg className="w-20 h-20" fill="currentColor" viewBox="0 0 20 20">
                                            <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4z" />
                                            <path fillRule="evenodd" d="M18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z" clipRule="evenodd" />
                                        </svg>
                                    </div>
                                    <div className="relative z-10">
                                        <div className="flex justify-between items-start mb-4">
                                            <h3 className="text-sm font-bold text-indigo-900 uppercase tracking-wider">Penghasilan Tetap</h3>
                                            <button 
                                                onClick={() => setShowEditFixedIncome(true)}
                                                className="text-indigo-600 hover:text-indigo-800 text-xs font-bold underline"
                                            >
                                                Edit
                                            </button>
                                        </div>
                                        <p className="text-3xl font-black text-gray-900 mb-1">
                                            {formatCurrency(Number(userData?.fixedIncome || 0))}
                                        </p>
                                        <p className="text-xs text-indigo-700 font-medium">
                                            Mulai sejak: <span className="font-bold">{incomeStartDateStr}</span>
                                        </p>
                                        <div className="mt-4 bg-white/50 backdrop-blur-sm rounded-xl p-3 border border-white/50">
                                            <p className="text-[10px] text-gray-600 leading-tight">
                                                Nominal ini akan otomatis dihitung sebagai pemasukan rutin pada dashboard dan analisis AI setiap bulannya.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Modals */}
            {showEditProfile && (
                <EditProfileModal user={userData} onClose={() => { setShowEditProfile(false); fetchUserData(); }} />
            )}
            {showEditFixedIncome && (
                <FixedIncomeModal user={userData} onClose={() => { setShowEditFixedIncome(false); fetchUserData(); }} />
            )}
        </div>
    );
}
