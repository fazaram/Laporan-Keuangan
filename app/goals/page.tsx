import { getGoals, getMonthlyFinancials } from '@/app/actions/goal';
import GoalCard from './components/GoalCard';
import CreateGoalModal from './components/CreateGoalModal';
import AllocationPanel from './components/AllocationPanel';
import ManualAllocationModal from './components/ManualAllocationModal';
import { Navbar } from '@/components/Navbar';
import { getAvailableSurplus } from '@/app/actions/allocation';
import Link from 'next/link';

export const metadata = {
    title: 'Tabungan / Goals - Laporan Keuangan',
};

export default async function GoalsPage({ searchParams }: { searchParams: { tab?: string; page?: string } }) {
    const goals = await getGoals();
    const { surplus } = await getAvailableSurplus();
    
    const currentTab = searchParams?.tab || 'semua';
    const currentPage = Math.max(1, parseInt(searchParams?.page || '1'));
    const ITEMS_PER_PAGE = 6;
    const remainingSurplus = surplus;
    
    // Header for Smart Alert
    const activeGoals = goals.filter((g: any) => g.status === 'ACTIVE');
    
    // Hitung total kebutuhan bulanan semua active goals
    const now = new Date();
    const month = now.getMonth();
    const year = now.getFullYear();

    let totalNeededThisMonth = 0;
    activeGoals.forEach((goal: any) => {
        const startDate = new Date(goal.startDate);
        const monthsPassed = (year - startDate.getFullYear()) * 12 + (month - startDate.getMonth());
        const remainingMonths = Math.max(1, goal.durationMonths - monthsPassed);
        const needed = Math.max(0, goal.targetAmount - goal.currentAmount) / remainingMonths;
        totalNeededThisMonth += needed;
    });

    const isDeficit = surplus < totalNeededThisMonth;
    const isSurplus = surplus > totalNeededThisMonth;

    return (
        <div className="min-h-screen bg-gray-50">
            <Navbar />
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Tabungan / Goals</h1>
                    <p className="text-gray-600 mt-1">Kelola target tabungan masa depan Anda</p>
                </div>
                <CreateGoalModal />
            </div>

            {/* Smart Alerts */}
            {isDeficit && activeGoals.length > 0 && (
                <div className="mb-8 bg-red-50 border border-red-200 p-4 rounded-xl flex items-start gap-4">
                    <div className="p-2 bg-red-100 rounded-lg text-red-600">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                    </div>
                    <div>
                        <h4 className="font-semibold text-red-900">Peringatan Defisit Tabungan</h4>
                        <p className="text-red-700 mt-1 text-sm">
                            Sisa uang tabungan bebas (Rp {surplus.toLocaleString('id-ID')}) lebih kecil dari total 
                            kebutuhan tabungan bulan ini (Rp {totalNeededThisMonth.toLocaleString('id-ID')}). 
                            Target tabungan berpotensi tidak tercapai otomatis.
                        </p>
                    </div>
                </div>
            )}

            {isSurplus && activeGoals.length > 0 && (
                <div className="mb-8 bg-green-50 border border-green-200 p-4 rounded-xl flex items-start gap-4">
                    <div className="p-2 bg-green-100 rounded-lg text-green-600">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                        </svg>
                    </div>
                    <div>
                        <h4 className="font-semibold text-green-900">Kondisi Surplus!</h4>
                        <p className="text-green-700 mt-1 text-sm">
                            Sisa saldo Anda mencukupi untuk dialokasikan manual. Anda memiliki kelebihan dana tabungan sebesar 
                            Rp {(surplus).toLocaleString('id-ID')}. Anda bisa melimpahkannya ke target tabungan Anda.
                        </p>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Kiri: Daftar Goals */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                        <div className="flex items-center gap-3">
                            <h2 className="font-semibold text-gray-900">Daftar Target Tabungan</h2>
                            <span className="text-sm bg-blue-50 text-blue-700 px-3 py-1 rounded-full font-medium">
                                {activeGoals.length} Aktif
                            </span>
                        </div>
                        <ManualAllocationModal 
                            availableSurplus={surplus} 
                            activeGoals={JSON.parse(JSON.stringify(activeGoals))} 
                        />
                    </div>

                    {/* Secondary Navbar / Tabs */}
                    <div className="flex space-x-1 bg-gray-100/50 p-1 rounded-lg w-full max-w-sm border border-gray-200/50">
                        <a 
                            href="?tab=semua" 
                            className={`flex-1 text-center py-2 px-3 text-sm font-medium rounded-md transition-colors ${currentTab === 'semua' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200/50'}`}
                        >
                            Semua
                        </a>
                        <a 
                            href="?tab=aktif" 
                            className={`flex-1 text-center py-2 px-3 text-sm font-medium rounded-md transition-colors ${currentTab === 'aktif' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200/50'}`}
                        >
                            Aktif
                        </a>
                        <a 
                            href="?tab=selesai" 
                            className={`flex-1 text-center py-2 px-3 text-sm font-medium rounded-md transition-colors ${currentTab === 'selesai' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200/50'}`}
                        >
                            Selesai
                        </a>
                    </div>
                    
                    {goals.length === 0 ? (
                        <div className="text-center py-12 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <span className="text-2xl">🎯</span>
                            </div>
                            <h3 className="text-lg font-medium text-gray-900 mb-2">Belum Ada Goal</h3>
                            <p className="text-gray-500 mb-6 max-w-sm mx-auto">
                                Mulai buat target tabungan pertama Anda, misalnya untuk Dana Darurat, Liburan, atau Gadget baru.
                            </p>
                        </div>
                    ) : (() => {
                        const filtered = goals.filter((goal: any) => {
                            if (currentTab === 'aktif') return goal.status === 'ACTIVE';
                            if (currentTab === 'selesai') return goal.status === 'COMPLETED';
                            return true;
                        });
                        const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
                        const safePage = Math.min(currentPage, totalPages);
                        const paginated = filtered.slice((safePage - 1) * ITEMS_PER_PAGE, safePage * ITEMS_PER_PAGE);
                        
                        const buildHref = (p: number) => `?tab=${currentTab}&page=${p}`;

                        return (
                            <>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {paginated.map((goal: any) => (
                                        <GoalCard key={goal.id} goal={goal} />
                                    ))}
                                </div>

                                {/* Pagination Controls */}
                                {totalPages > 1 && (
                                    <div className="flex items-center justify-between pt-4 border-t border-gray-100 mt-2">
                                        <p className="text-sm text-gray-500">
                                            Menampilkan {(safePage - 1) * ITEMS_PER_PAGE + 1}–{Math.min(safePage * ITEMS_PER_PAGE, filtered.length)} dari {filtered.length} tabungan
                                        </p>
                                        <div className="flex items-center gap-1">
                                            {/* Prev */}
                                            {safePage > 1 ? (
                                                <a href={buildHref(safePage - 1)} className="px-3 py-1.5 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-1">
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
                                                    Prev
                                                </a>
                                            ) : (
                                                <span className="px-3 py-1.5 text-sm font-medium text-gray-300 bg-gray-50 border border-gray-100 rounded-lg cursor-not-allowed flex items-center gap-1">
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
                                                    Prev
                                                </span>
                                            )}

                                            {/* Page Numbers */}
                                            {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                                                <a
                                                    key={p}
                                                    href={buildHref(p)}
                                                    className={`w-9 h-9 flex items-center justify-center text-sm font-medium rounded-lg transition-colors ${
                                                        p === safePage
                                                            ? 'bg-blue-600 text-white'
                                                            : 'text-gray-600 bg-white border border-gray-200 hover:bg-gray-50'
                                                    }`}
                                                >
                                                    {p}
                                                </a>
                                            ))}

                                            {/* Next */}
                                            {safePage < totalPages ? (
                                                <a href={buildHref(safePage + 1)} className="px-3 py-1.5 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-1">
                                                    Next
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
                                                </a>
                                            ) : (
                                                <span className="px-3 py-1.5 text-sm font-medium text-gray-300 bg-gray-50 border border-gray-100 rounded-lg cursor-not-allowed flex items-center gap-1">
                                                    Next
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </>
                        );
                    })()}
                </div>

                {/* Kanan: Panel Alokasi (Optional Auto) */}
                <div>
                    <AllocationPanel 
                        availableSurplus={Math.max(0, surplus)} 
                        totalNeeded={totalNeededThisMonth}
                        hasActiveGoals={activeGoals.length > 0}
                    />
                </div>
            </div>
        </div>
        </div>
    );
}
