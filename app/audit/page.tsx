'use client';

import { useState, useEffect } from 'react';
import { Navbar } from '@/components/Navbar';
import { AuditLogItem } from '@/components/AuditLogItem';

interface AuditLog {
    id: string;
    action: 'CREATE' | 'UPDATE' | 'DELETE';
    entityType: string;
    entityId: string;
    oldData: any;
    newData: any;
    ipAddress: string | null;
    userAgent: string | null;
    createdAt: string;
    user: {
        id: string;
        name: string | null;
        email: string;
    };
}

export default function AuditPage() {
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [total, setTotal] = useState(0);
    const [filters, setFilters] = useState({
        action: '',
        entityType: 'Transaction',
        startDate: '',
        endDate: '',
        limit: 50,
        offset: 0,
    });

    useEffect(() => {
        fetchLogs();
    }, [filters]);

    const fetchLogs = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (filters.action) params.append('action', filters.action);
            if (filters.entityType) params.append('entityType', filters.entityType);
            if (filters.startDate) params.append('startDate', filters.startDate);
            if (filters.endDate) params.append('endDate', filters.endDate);
            params.append('limit', filters.limit.toString());
            params.append('offset', filters.offset.toString());

            const res = await fetch(`/api/audit?${params.toString()}`);
            const data = await res.json();

            setLogs(data.logs || []);
            setTotal(data.total || 0);
        } catch (error) {
            console.error('Error fetching audit logs:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleFilterChange = (key: string, value: any) => {
        setFilters((prev) => ({
            ...prev,
            [key]: value,
            offset: 0, // Reset to first page when filter changes
        }));
    };

    const handleLoadMore = () => {
        setFilters((prev) => ({
            ...prev,
            offset: prev.offset + prev.limit,
        }));
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <Navbar />

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Audit Log & Riwayat Perubahan</h1>
                    <p className="text-gray-600">Lacak semua perubahan data transaksi</p>
                </div>

                {/* Filters */}
                <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6 mb-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Filter</h2>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Aksi
                            </label>
                            <select
                                value={filters.action}
                                onChange={(e) => handleFilterChange('action', e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                                <option value="">Semua Aksi</option>
                                <option value="CREATE">Dibuat</option>
                                <option value="UPDATE">Diubah</option>
                                <option value="DELETE">Dihapus</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Tanggal Mulai
                            </label>
                            <input
                                type="date"
                                value={filters.startDate}
                                onChange={(e) => handleFilterChange('startDate', e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Tanggal Akhir
                            </label>
                            <input
                                type="date"
                                value={filters.endDate}
                                onChange={(e) => handleFilterChange('endDate', e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>

                        <div className="flex items-end">
                            <button
                                onClick={() => {
                                    setFilters({
                                        action: '',
                                        entityType: 'Transaction',
                                        startDate: '',
                                        endDate: '',
                                        limit: 50,
                                        offset: 0,
                                    });
                                }}
                                className="w-full px-4 py-2 bg-gray-200 text-gray-700 font-medium rounded-lg hover:bg-gray-300 transition-colors"
                            >
                                Reset Filter
                            </button>
                        </div>
                    </div>
                </div>

                {/* Stats */}
                <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6 mb-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600">Total Riwayat</p>
                            <p className="text-3xl font-bold text-gray-900">{total}</p>
                        </div>
                        <div className="w-16 h-16 bg-blue-100 rounded-lg flex items-center justify-center text-4xl">
                            📋
                        </div>
                    </div>
                </div>

                {/* Logs List */}
                <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6">
                    <h2 className="text-xl font-bold text-gray-900 mb-6">Riwayat Aktivitas</h2>

                    {loading && filters.offset === 0 ? (
                        <div className="text-center py-12">
                            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                            <p className="mt-4 text-gray-600">Memuat riwayat...</p>
                        </div>
                    ) : logs.length === 0 ? (
                        <div className="text-center py-12">
                            <p className="text-gray-500">Tidak ada riwayat yang ditemukan</p>
                        </div>
                    ) : (
                        <>
                            <div className="space-y-4">
                                {logs.map((log) => (
                                    <AuditLogItem key={log.id} log={log} />
                                ))}
                            </div>

                            {/* Load More */}
                            {logs.length < total && (
                                <div className="mt-6 text-center">
                                    <button
                                        onClick={handleLoadMore}
                                        disabled={loading}
                                        className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {loading ? 'Memuat...' : `Muat Lebih Banyak (${logs.length} dari ${total})`}
                                    </button>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </main>
        </div>
    );
}
