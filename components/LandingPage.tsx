'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import ReactMarkdown from 'react-markdown';

const CATEGORIES = {
    'Rumah Tangga': [
        { label: 'Makanan', key: 'makanan' },
        { label: 'Sewa/cicilan rumah', key: 'sewa' },
        { label: 'Air, telepon, listrik', key: 'tagihan' },
        { label: 'Lainnya', key: 'rumah_tangga_lainnya' },
    ],
    'Gaya Hidup': [
        { label: 'Belanja', key: 'belanja' },
        { label: 'Hiburan', key: 'hiburan' },
        { label: 'Langganan', key: 'langganan' },
        { label: 'Liburan', key: 'liburan' },
    ],
    'Transportasi': [
        { label: 'Transportasi umum harian', key: 'transport_umum' },
        { label: 'Bensin, parkir, tol', key: 'kendaraan_operasional' },
        { label: 'Perawatan kendaraan', key: 'servis_kendaraan' },
        { label: 'Lainnya', key: 'transport_lainnya' },
    ],
    'Pendidikan': [
        { label: 'Uang sekolah bulanan', key: 'sekolah' },
        { label: 'Uang saku anak', key: 'saku_anak' },
        { label: 'Kegiatan ekstrakurikuler', key: 'ekstra' },
        { label: 'Lainnya', key: 'pendidikan_lainnya' },
    ],
    'Pengeluaran Tetap Lainnya': [
        { label: 'Membantu keluarga', key: 'keluarga' },
        { label: 'Asuransi', key: 'asuransi' },
        { label: 'Lainnya', key: 'tetap_lainnya' },
    ]
};

export default function LandingPage() {
    const { data: session } = useSession();
    const [income, setIncome] = useState<number>(0);
    const [expenses, setExpenses] = useState<Record<string, number>>({});
    const [insight, setInsight] = useState<string>('');
    const [loading, setLoading] = useState(false);
    const [modal, setModal] = useState<{ show: boolean; title: string; message: string } | null>(null);

    const totalExpense = useMemo(() => {
        return Object.values(expenses).reduce((sum, val) => sum + (val || 0), 0);
    }, [expenses]);

    const savings = useMemo(() => {
        return income - totalExpense;
    }, [income, totalExpense]);

    const handleInputChange = (key: string, value: string) => {
        const numValue = parseInt(value.replace(/\D/g, '')) || 0;
        if (key === 'income') {
            setIncome(numValue);
        } else {
            setExpenses(prev => ({ ...prev, [key]: numValue }));
        }
    };

    const formatIDR = (val: number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            maximumFractionDigits: 0
        }).format(val);
    };

    const getAiInsight = async () => {
        if (income <= 0) {
            setModal({
                show: true,
                title: 'Data Belum Lengkap',
                message: 'Silakan masukkan penghasilan bulanan Anda terlebih dahulu agar Solvia AI dapat memberikan analisis yang akurat.'
            });
            return;
        }
        setLoading(true);
        try {
            // Group expenses for API
            const groupedExpenses: any = {};
            Object.entries(CATEGORIES).forEach(([group, items]) => {
                groupedExpenses[group] = {};
                items.forEach(item => {
                    groupedExpenses[group][item.label] = expenses[item.key] || 0;
                });
            });

            const res = await fetch('/api/simulate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    income,
                    expenses: groupedExpenses,
                    totalExpense,
                    savings
                })
            });
            const data = await res.json();
            setInsight(data.insight);
        } catch (error) {
            console.error(error);
            setInsight('Maaf, gagal memproses insight saat ini. Silakan coba lagi nanti.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
            {/* Nav */}
            <nav className="fixed top-0 w-full bg-white/80 backdrop-blur-md border-b border-slate-200 z-50">
                <div className="max-w-7xl mx-auto px-4 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white text-xl font-bold italic shadow-lg shadow-blue-200">S</div>
                        <span className="text-xl font-black tracking-tighter text-slate-800 uppercase">Solvia Finance</span>
                    </div>
                    <div className="flex items-center gap-4">
                        {session ? (
                            <Link href="/dashboard" className="px-6 py-2.5 bg-blue-600 text-white rounded-xl font-bold text-sm shadow-xl shadow-blue-100 hover:bg-blue-700 transition-all">Dashboard</Link>
                        ) : (
                            <>
                                <Link href="/login" className="text-sm font-bold text-slate-600 hover:text-blue-600 transition-colors">Masuk</Link>
                                <Link href="/register" className="px-6 py-2.5 bg-slate-900 text-white rounded-xl font-bold text-sm hover:bg-slate-800 transition-all shadow-xl shadow-slate-200">Coba Gratis</Link>
                            </>
                        )}
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <header className="pt-24 md:pt-32 pb-12 md:pb-20 px-4 text-center">
                <div className="inline-block px-4 py-1.5 bg-blue-50 text-blue-600 rounded-full text-[10px] md:text-xs font-black uppercase tracking-widest mb-6">Simulation Tool 2.0</div>
                <h1 className="text-3xl sm:text-5xl md:text-7xl font-black text-slate-900 tracking-tight leading-[1.1] mb-6">
                    Mulai Hidup Lebih <br />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 italic">Financial-Healthy.</span>
                </h1>
                <p className="text-base md:text-lg text-slate-500 max-w-2xl mx-auto leading-relaxed">
                    Ukur kesehatan finansialmu dalam hitungan detik. Cukup masukkan angka, biarkan AI kami memberikan wawasan mendalam untuk masa depanmu.
                </p>
            </header>

            {/* Simulator Section */}
            <section className="max-w-6xl mx-auto px-4 pb-20 md:pb-32">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12 items-start">

                    {/* Inputs Card */}
                    <div className="bg-white rounded-[2rem] md:rounded-[2.5rem] p-6 md:p-12 shadow-2xl shadow-slate-200/60 border border-slate-100">
                        <div className="mb-10 md:mb-12">
                            <label className="block text-[10px] md:text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Pemasukan Utama</label>
                            <div className="relative group">
                                <span className="absolute left-6 top-1/2 -translate-y-1/2 text-xl md:text-2xl font-bold text-slate-300 transition-colors group-focus-within:text-blue-600">Rp</span>
                                <input
                                    type="text"
                                    value={income ? income.toLocaleString('id-ID') : ''}
                                    onChange={(e) => handleInputChange('income', e.target.value)}
                                    placeholder="0"
                                    className="w-full bg-slate-50 border-0 rounded-2xl py-5 md:py-6 pl-14 md:pl-16 pr-6 md:pr-8 text-2xl md:text-3xl font-black text-slate-900 focus:ring-4 focus:ring-blue-100 focus:bg-white outline-none transition-all placeholder:text-slate-200"
                                />
                                <p className="mt-3 text-[10px] md:text-xs font-bold text-slate-400">Total penghasilan rumah tangga bulanan Anda.</p>
                            </div>
                        </div>

                        <div className="space-y-8 md:space-y-10">
                            {Object.entries(CATEGORIES).map(([group, items]) => (
                                <div key={group}>
                                    <h3 className="text-xs md:text-sm font-black text-slate-800 uppercase tracking-[0.2em] mb-4 md:mb-6 flex items-center gap-2">
                                        <span className="w-1.5 h-6 bg-slate-200 rounded-full"></span>
                                        {group}
                                    </h3>
                                    <div className="space-y-4 md:space-y-5">
                                        {items.map((item) => (
                                            <div key={item.key} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4">
                                                <label className="text-xs md:text-sm font-semibold text-slate-500">{item.label}</label>
                                                <div className="relative w-full sm:w-48 md:w-64 group">
                                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xs md:text-sm font-bold text-slate-300">Rp</span>
                                                    <input
                                                        type="text"
                                                        value={expenses[item.key] ? expenses[item.key].toLocaleString('id-ID') : ''}
                                                        onChange={(e) => handleInputChange(item.key, e.target.value)}
                                                        placeholder="0"
                                                        className="w-full bg-slate-50 border-0 rounded-xl py-2.5 md:py-3 pl-10 md:pl-12 pr-4 text-xs md:text-sm font-bold text-slate-900 focus:ring-4 focus:ring-slate-100 focus:bg-white outline-none transition-all placeholder:text-slate-200"
                                                    />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Results & AI Insight */}
                    <div className="lg:sticky lg:top-32 space-y-6 md:space-y-8">
                        {/* Summary Card */}
                        <div className="bg-slate-900 rounded-[2rem] md:rounded-[2.5rem] p-8 md:p-10 text-white shadow-2xl overflow-hidden relative group">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/20 blur-[100px] -mr-32 -mt-32"></div>
                            <h3 className="text-[10px] md:text-sm font-black text-slate-400 uppercase tracking-[0.2em] mb-8 md:mb-10 relative z-10">Ringkasan Simulasi</h3>

                            <div className="space-y-6 md:space-y-8 relative z-10">
                                <div>
                                    <p className="text-[10px] md:text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Total Pengeluaran</p>
                                    <p className="text-3xl md:text-4xl font-black">{formatIDR(totalExpense)}</p>
                                </div>
                                <div className="pt-6 md:pt-8 border-t border-slate-800">
                                    <p className="text-[10px] md:text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Potensi Tabungan</p>
                                    <div className="inline-block px-6 md:px-8 py-3 md:py-4 bg-yellow-400 text-slate-900 rounded-xl md:rounded-2xl">
                                        <p className="text-3xl md:text-4xl font-black">{formatIDR(savings)}</p>
                                    </div>
                                    <p className="mt-4 text-[10px] md:text-xs font-medium text-slate-400 leading-relaxed italic">
                                        Area kuning ini adalah dana yang dapat Anda maksimalkan untuk investasi atau dana darurat.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* AI Button */}
                        {!insight ? (
                            <button
                                onClick={getAiInsight}
                                disabled={loading}
                                className="w-full py-6 bg-blue-600 text-white rounded-[1.5rem] font-black text-lg hover:bg-blue-700 transition-all shadow-xl shadow-blue-200 flex items-center justify-center gap-3 disabled:opacity-50 group"
                            >
                                {loading ? (
                                    <span className="flex items-center gap-2">
                                        <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Menganalisis...
                                    </span>
                                ) : (
                                    <>
                                        Get AI Insight ✨
                                    </>
                                )}
                            </button>
                        ) : (
                            <div className="bg-white rounded-[2.5rem] p-10 shadow-2xl border border-slate-100 animate-in fade-in slide-in-from-bottom-5 duration-700">
                                <div className="space-y-6">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                                            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-100 italic font-black">S</div>
                                            Solvia Intelligence
                                        </h3>
                                        <button
                                            onClick={() => setInsight('')}
                                            className="text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-blue-600 transition-colors flex items-center gap-1.5"
                                        >
                                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                            </svg>
                                            Reset
                                        </button>
                                    </div>

                                    {/* Scrollable Insight Area */}
                                    <div className="relative group/scroll">
                                        <div className="max-h-[500px] overflow-y-auto pr-4 scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent hover:scrollbar-thumb-blue-200 transition-colors">
                                            <div className="prose prose-slate max-w-none 
                                                prose-p:text-slate-600 prose-p:leading-relaxed prose-p:mb-4
                                                prose-headings:text-slate-900 prose-headings:font-black prose-headings:tracking-tight prose-headings:mb-4 prose-headings:mt-8 first:prose-headings:mt-0
                                                prose-strong:text-blue-600 prose-strong:font-bold
                                                prose-ul:list-disc prose-ul:pl-4 prose-li:text-slate-600 prose-li:mb-2
                                                text-sm md:text-base">
                                                <ReactMarkdown>{insight}</ReactMarkdown>
                                            </div>
                                        </div>
                                        {/* Bottom Fade Gradient */}
                                        <div className="absolute bottom-0 left-0 right-4 h-12 bg-gradient-to-t from-white to-transparent pointer-events-none"></div>
                                    </div>

                                    <div className="pt-8 border-t border-slate-50">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-center mb-6">Mulai kelola realitas keuanganmu</p>
                                        <Link href="/register" className="block w-full text-center py-5 bg-slate-900 text-white rounded-2xl font-black text-sm hover:bg-slate-800 transition-all shadow-2xl shadow-slate-200 uppercase tracking-widest">Bergabung Gratis Sekarang</Link>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-white border-t border-slate-100 py-12 text-center text-slate-400 italic text-sm">
                &copy; 2026 PT Solvia Global Solutions. Dirancang untuk kebebasan finansial Anda.
            </footer>

            {/* Premium Alert Modal */}
            {modal?.show && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300">
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setModal(null)}></div>
                    <div className="relative bg-white rounded-[2rem] p-8 md:p-10 max-w-md w-full shadow-2xl animate-in zoom-in-95 duration-300 border border-slate-100">
                        <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center text-3xl mb-6 mx-auto">⚠️</div>
                        <h3 className="text-xl font-black text-slate-900 text-center mb-4 tracking-tight">{modal.title}</h3>
                        <p className="text-slate-500 text-center text-sm leading-relaxed mb-8">
                            {modal.message}
                        </p>
                        <button
                            onClick={() => setModal(null)}
                            className="w-full py-4 bg-blue-600 text-white rounded-xl font-black text-sm hover:bg-blue-700 transition-all shadow-xl shadow-blue-100 uppercase tracking-widest"
                        >
                            Saya Mengerti
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
