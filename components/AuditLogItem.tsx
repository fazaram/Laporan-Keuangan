'use client';

import { formatDate, formatCurrency } from '@/lib/utils';

interface AuditLogItemProps {
    log: {
        id: string;
        action: 'CREATE' | 'UPDATE' | 'DELETE';
        entityType: string;
        entityId: string;
        oldData: any;
        newData: any;
        ipAddress: string | null;
        userAgent: string | null;
        createdAt: Date | string;
        user: {
            name: string | null;
            email: string;
        };
    };
}

export function AuditLogItem({ log }: AuditLogItemProps) {
    const getActionColor = () => {
        switch (log.action) {
            case 'CREATE':
                return 'bg-green-100 text-green-800 border-green-200';
            case 'UPDATE':
                return 'bg-blue-100 text-blue-800 border-blue-200';
            case 'DELETE':
                return 'bg-red-100 text-red-800 border-red-200';
            default:
                return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

    const getActionIcon = () => {
        switch (log.action) {
            case 'CREATE':
                return '➕';
            case 'UPDATE':
                return '✏️';
            case 'DELETE':
                return '🗑️';
            default:
                return '📝';
        }
    };

    const getActionLabel = () => {
        switch (log.action) {
            case 'CREATE':
                return 'Dibuat';
            case 'UPDATE':
                return 'Diubah';
            case 'DELETE':
                return 'Dihapus';
            default:
                return log.action;
        }
    };

    const renderDataDiff = () => {
        if (log.action === 'CREATE' && log.newData) {
            return (
                <div className="mt-3 p-3 bg-green-50 rounded-lg border border-green-200">
                    <p className="text-sm font-semibold text-green-900 mb-2">Data Baru:</p>
                    <div className="space-y-1 text-sm">
                        <p><span className="font-medium">Tanggal:</span> {formatDate(log.newData.date)}</p>
                        <p><span className="font-medium">Kategori:</span> {log.newData.category}</p>
                        <p><span className="font-medium">Nominal:</span> {formatCurrency(log.newData.amount)}</p>
                        <p><span className="font-medium">Tipe:</span> {log.newData.type === 'INCOME' ? 'Pemasukan' : 'Pengeluaran'}</p>
                        {log.newData.description && (
                            <p><span className="font-medium">Keterangan:</span> {log.newData.description}</p>
                        )}
                    </div>
                </div>
            );
        }

        if (log.action === 'DELETE' && log.oldData) {
            return (
                <div className="mt-3 p-3 bg-red-50 rounded-lg border border-red-200">
                    <p className="text-sm font-semibold text-red-900 mb-2">Data Terhapus:</p>
                    <div className="space-y-1 text-sm">
                        <p><span className="font-medium">Tanggal:</span> {formatDate(log.oldData.date)}</p>
                        <p><span className="font-medium">Kategori:</span> {log.oldData.category}</p>
                        <p><span className="font-medium">Nominal:</span> {formatCurrency(log.oldData.amount)}</p>
                        <p><span className="font-medium">Tipe:</span> {log.oldData.type === 'INCOME' ? 'Pemasukan' : 'Pengeluaran'}</p>
                        {log.oldData.description && (
                            <p><span className="font-medium">Keterangan:</span> {log.oldData.description}</p>
                        )}
                    </div>
                </div>
            );
        }

        if (log.action === 'UPDATE' && log.oldData && log.newData) {
            const changes: string[] = [];

            if (log.oldData.date !== log.newData.date) {
                changes.push(`Tanggal: ${formatDate(log.oldData.date)} → ${formatDate(log.newData.date)}`);
            }
            if (log.oldData.category !== log.newData.category) {
                changes.push(`Kategori: ${log.oldData.category} → ${log.newData.category}`);
            }
            if (log.oldData.amount !== log.newData.amount) {
                changes.push(`Nominal: ${formatCurrency(log.oldData.amount)} → ${formatCurrency(log.newData.amount)}`);
            }
            if (log.oldData.type !== log.newData.type) {
                const oldType = log.oldData.type === 'INCOME' ? 'Pemasukan' : 'Pengeluaran';
                const newType = log.newData.type === 'INCOME' ? 'Pemasukan' : 'Pengeluaran';
                changes.push(`Tipe: ${oldType} → ${newType}`);
            }
            if (log.oldData.description !== log.newData.description) {
                changes.push(`Keterangan: ${log.oldData.description || '-'} → ${log.newData.description || '-'}`);
            }

            return (
                <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <p className="text-sm font-semibold text-blue-900 mb-2">Perubahan:</p>
                    <ul className="space-y-1 text-sm">
                        {changes.map((change, idx) => (
                            <li key={idx} className="flex items-start gap-2">
                                <span className="text-blue-600">•</span>
                                <span>{change}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            );
        }

        return null;
    };

    return (
        <div className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
            <div className="flex items-start justify-between">
                <div className="flex items-start gap-3 flex-1">
                    <div className="flex-shrink-0">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xl ${getActionColor()} border`}>
                            {getActionIcon()}
                        </div>
                    </div>

                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                            <span className={`px-2 py-1 rounded-md text-xs font-semibold ${getActionColor()} border`}>
                                {getActionLabel()}
                            </span>
                            <span className="text-sm text-gray-600">
                                oleh <span className="font-medium text-gray-900">{log.user.name || log.user.email}</span>
                            </span>
                        </div>

                        <p className="text-sm text-gray-500">
                            {new Date(log.createdAt).toLocaleString('id-ID', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                            })}
                        </p>

                        {renderDataDiff()}
                    </div>
                </div>
            </div>
        </div>
    );
}
