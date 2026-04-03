import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { Navbar } from '@/components/Navbar';
import Link from 'next/link';
import GoalDetailClient from '../components/GoalDetailClient';
import { getAvailableSurplus } from '@/app/actions/allocation';

export default async function GoalDetailPage({ params }: { params: { id: string } }) {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
        redirect('/login');
    }

    const goal = await prisma.goal.findUnique({
        where: { id: params.id, userId: session.user.id },
        include: {
            allocations: {
                orderBy: { createdAt: 'desc' }
            }
        }
    });

    if (!goal) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center">
                <h1 className="text-2xl font-bold mb-4">Tabungan tidak ditemukan.</h1>
                <Link href="/goals" className="text-blue-600 hover:underline">Kembali ke daftar Tabungan</Link>
            </div>
        );
    }

    // Ambil daftar goal lain untuk target Reallocation
    const otherGoals = await prisma.goal.findMany({
        where: { userId: session.user.id, id: { not: goal.id }, status: 'ACTIVE' }
    });

    const { surplus } = await getAvailableSurplus();

    return (
        <div className="min-h-screen bg-gray-50">
            <Navbar />
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="mb-6 flex items-center justify-between">
                    <Link href="/goals" className="inline-flex items-center text-gray-500 hover:text-gray-900 transition-colors">
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                        Kembali
                    </Link>
                </div>

                {/* Info Card */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-8">
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <span className="text-xs font-bold text-gray-500 bg-gray-100 px-2 py-1 rounded-full uppercase mb-2 block w-max">
                                Prioritas: {goal.priority}
                            </span>
                            <h1 className="text-3xl font-bold text-gray-900">{goal.name}</h1>
                        </div>
                        {goal.status === 'COMPLETED' && (
                            <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-semibold flex items-center gap-1">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                                </svg>
                                Tercapai
                            </span>
                        )}
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6 pt-6 border-t border-gray-100">
                        <div>
                            <p className="text-sm text-gray-500 mb-1">Target</p>
                            <p className="text-xl font-bold text-gray-900">Rp {Number(goal.targetAmount).toLocaleString('id-ID')}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-500 mb-1">Terkumpul</p>
                            <p className="text-xl font-bold text-blue-600">Rp {Number(goal.currentAmount).toLocaleString('id-ID')}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-500 mb-1">Sisa Target</p>
                            <p className="text-xl font-bold text-orange-600">
                                Rp {Math.max(0, Number(goal.targetAmount) - Number(goal.currentAmount)).toLocaleString('id-ID')}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Client Component untuk Daftar Alokasi & Rekayasa Moda */}
                {/* Kita butuh stringify data prisma krn Number Decimal tdk serialize scr native */}
                <GoalDetailClient 
                    goal={JSON.parse(JSON.stringify(goal))} 
                    otherGoals={JSON.parse(JSON.stringify(otherGoals))}
                    availableSurplus={surplus}
                />

            </div>
        </div>
    );
}
