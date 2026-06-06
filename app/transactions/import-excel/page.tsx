'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useDropzone } from 'react-dropzone';
import { Navbar } from '@/components/Navbar';
import { useToast } from '@/components/ToastProvider';
import { formatCurrency } from '@/lib/utils';
import { UploadCloud, FileText, Loader2, CheckCircle2, Trash2, Download } from 'lucide-react';
import * as XLSX from 'xlsx';

interface ParsedTransaction {
    id: string; // generated locally for list management
    date: string;
    description: string;
    category: string;
    type: 'INCOME' | 'EXPENSE';
    amount: number;
    selected: boolean;
}

export default function ImportExcelPage() {
    const router = useRouter();
    const { showToast } = useToast();
    
    const [file, setFile] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);
    const [importing, setImporting] = useState(false);
    
    const [transactions, setTransactions] = useState<ParsedTransaction[]>([]);
    const [step, setStep] = useState<'UPLOAD' | 'PREVIEW'>('UPLOAD');

    const onDrop = useCallback((acceptedFiles: File[]) => {
        if (acceptedFiles.length > 0) {
            setFile(acceptedFiles[0]);
        }
    }, []);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
            'application/vnd.ms-excel': ['.xls'],
            'text/csv': ['.csv']
        },
        maxSize: 10 * 1024 * 1024, // 10MB
        multiple: false
    });

    const handleDownloadTemplate = () => {
        const templateData = [
            {
                Tanggal: '2023-10-25',
                Keterangan: 'Gaji Bulanan',
                Kategori: 'Gaji',
                Tipe: 'INCOME',
                Nominal: 5000000
            },
            {
                Tanggal: '2023-10-26',
                Keterangan: 'Makan Siang',
                Kategori: 'Makan',
                Tipe: 'EXPENSE',
                Nominal: 35000
            }
        ];
        
        // Define column widths for better formatting
        const ws = XLSX.utils.json_to_sheet(templateData);
        ws['!cols'] = [
            { wch: 12 }, // Tanggal
            { wch: 30 }, // Keterangan
            { wch: 15 }, // Kategori
            { wch: 10 }, // Tipe
            { wch: 15 }, // Nominal
        ];

        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Template Transaksi");
        XLSX.writeFile(wb, "template_transaksi_keuangan.xlsx");
    };

    const parseDateFromExcel = (excelDate: any): string => {
        if (!excelDate) return new Date().toISOString().split('T')[0];
        
        // Handle Excel serial date
        if (typeof excelDate === 'number') {
            const date = new Date(Math.round((excelDate - 25569) * 86400 * 1000));
            return date.toISOString().split('T')[0];
        }
        
        // Handle string date
        const parsed = new Date(excelDate);
        if (!isNaN(parsed.getTime())) {
            return parsed.toISOString().split('T')[0];
        }

        return new Date().toISOString().split('T')[0];
    };

    const handleProcessExcel = () => {
        if (!file) return;

        setLoading(true);
        const reader = new FileReader();

        reader.onload = async (e) => {
            try {
                const data = e.target?.result;
                const workbook = XLSX.read(data, { type: 'binary' });
                // Accumulate data from all sheets
                let allRawRowsForAI: any[][] = [];
                let allParsedTxs: ParsedTransaction[] = [];
                let overallBestMatchScore = 0;

                for (const sheetName of workbook.SheetNames) {
                    const sheet = workbook.Sheets[sheetName];
                    const rawRows: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, raw: false });
                    
                    if (rawRows.length <= 1) continue; // Skip empty sheets or sheets with only 1 row

                    allRawRowsForAI.push([`--- SHEET: ${sheetName} ---`]);
                    allRawRowsForAI.push(...rawRows);

                    let headerRowIdx = 0;
                    let bestMatchScore = 0;
                    
                    for (let i = 0; i < Math.min(rawRows.length, 20); i++) {
                        const row = rawRows[i];
                        if (!row || !Array.isArray(row)) continue;
                        
                        const text = row.map(cell => String(cell).toLowerCase()).join(' ');
                        let score = 0;
                        if (text.includes('tanggal') || text.includes('date') || text.includes('tgl')) score++;
                        if (text.includes('keterangan') || text.includes('uraian') || text.includes('deskripsi')) score++;
                        if (text.includes('nominal') || text.includes('amount') || text.includes('mutasi') || text.includes('debit') || text.includes('kredit')) score++;
                        
                        if (score > bestMatchScore) {
                            bestMatchScore = score;
                            headerRowIdx = i;
                        }
                    }

                    if (bestMatchScore > overallBestMatchScore) {
                        overallBestMatchScore = bestMatchScore;
                    }

                    if (bestMatchScore >= 2) {
                        const rawJson = XLSX.utils.sheet_to_json(sheet, { range: headerRowIdx });
                        const parsedTxs: ParsedTransaction[] = rawJson.map((row: any, index: number) => {
                            const rawDate = row['Tanggal'] || row['Date'] || row['Tanggal Transaksi'] || row['TGL'] || row['tanggal'] || row['date'];
                            const rawDesc = row['Keterangan'] || row['Description'] || row['Deskripsi'] || row['Uraian'] || row['Keterangan Transaksi'] || row['keterangan'];
                            const rawCat = row['Kategori'] || row['Category'] || row['kategori'];
                            const rawType = row['Tipe'] || row['Type'] || row['tipe'];
                            
                            let rawAmount = row['Nominal'] || row['Amount'] || row['Mutasi'] || row['nominal'];
                            let typeValue: 'INCOME' | 'EXPENSE' = 'EXPENSE';

                            const debit = row['Debit'] || row['DB'] || row['Keluar'] || row['Pengeluaran'];
                            const kredit = row['Kredit'] || row['CR'] || row['Masuk'] || row['Pemasukan'];

                            if (debit !== undefined && debit !== null && debit !== '') {
                                rawAmount = debit;
                                typeValue = 'EXPENSE';
                            } else if (kredit !== undefined && kredit !== null && kredit !== '') {
                                rawAmount = kredit;
                                typeValue = 'INCOME';
                            } else if (rawType) {
                                const t = String(rawType).toUpperCase();
                                if (t === 'INCOME' || t === 'PEMASUKAN' || t === 'MASUK' || t === 'CREDIT' || t === 'CR') {
                                    typeValue = 'INCOME';
                                }
                            } else if (Number(rawAmount) > 0 && String(rawAmount).trim().startsWith('+')) {
                                typeValue = 'INCOME';
                            } else if (Number(rawAmount) < 0) {
                                typeValue = 'EXPENSE';
                            }

                            let cleanAmount = 0;
                            if (typeof rawAmount === 'number') {
                                cleanAmount = Math.abs(rawAmount);
                            } else if (typeof rawAmount === 'string') {
                                const cleanedStr = rawAmount.replace(/[^0-9.,-]/g, '');
                                const parsedFloat = parseFloat(cleanedStr.replace(/\./g, '').replace(',', '.'));
                                cleanAmount = isNaN(parsedFloat) ? 0 : Math.abs(parsedFloat);
                            }

                            return {
                                id: `tx-${sheetName}-${Date.now()}-${index}`,
                                date: parseDateFromExcel(rawDate),
                                description: String(rawDesc || `Transaksi Excel #${index + 1}`),
                                category: String(rawCat || 'Lainnya'),
                                type: typeValue,
                                amount: cleanAmount,
                                selected: cleanAmount > 0 
                            };
                        });
                        allParsedTxs.push(...parsedTxs);
                    }
                }

                // AI Fallback function
                const parseWithAI = async (rows: any[][]) => {
                    showToast('Format tabel kompleks, mengidentifikasi dengan AI...', 'info');
                    
                    const aiRes = await fetch('/api/transactions/import-excel-ai', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ rawRows: rows })
                    });
                    
                    const aiData = await aiRes.json();
                    
                    if (!aiRes.ok) {
                        throw new Error(aiData.error || 'Gagal membaca file Excel dengan AI.');
                    }
                    
                    const parsedTxs: ParsedTransaction[] = aiData.transactions.map((t: any, index: number) => ({
                        id: `tx-ai-${Date.now()}-${index}`,
                        date: t.date || new Date().toISOString().split('T')[0],
                        description: t.description || 'Transaksi',
                        category: t.category || 'Lainnya',
                        type: t.type === 'INCOME' ? 'INCOME' : 'EXPENSE',
                        amount: Number(t.amount) || 0,
                        selected: Number(t.amount) > 0
                    }));
                    
                    setTransactions(parsedTxs);
                    setStep('PREVIEW');
                    showToast('Berhasil dideteksi oleh AI!', 'success');
                };

                // Trigger AI if overall score < 3 OR no valid amounts found in standard parsing
                const validAmounts = allParsedTxs.filter(t => t.amount > 0).length;
                if (overallBestMatchScore < 3 || (validAmounts === 0 && allRawRowsForAI.length > 0)) {
                    await parseWithAI(allRawRowsForAI);
                    return;
                }

                if (allParsedTxs.length === 0) {
                    throw new Error('Tidak dapat menemukan data transaksi di semua sheet Excel yang ada.');
                }

                setTransactions(allParsedTxs);
                setStep('PREVIEW');
                showToast('File Excel berhasil dibaca', 'success');
            } catch (err: any) {
                console.error("Excel parse error:", err);
                showToast(err.message || 'Gagal membaca file Excel. Pastikan format sesuai template.', 'error');
            } finally {
                setLoading(false);
            }
        };

        reader.onerror = () => {
            setLoading(false);
            showToast('Gagal membaca file', 'error');
        };

        reader.readAsBinaryString(file);
    };

    const handleImportSelected = async () => {
        const selectedTxs = transactions.filter(t => t.selected);
        if (selectedTxs.length === 0) {
            showToast('Pilih minimal satu transaksi untuk diimport', 'error');
            return;
        }

        setImporting(true);

        try {
            const payload = {
                transactions: selectedTxs.map(t => ({
                    date: t.date,
                    description: t.description,
                    category: t.category,
                    amount: t.amount,
                    type: t.type
                }))
            };

            const res = await fetch('/api/transactions/import-batch', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const result = await res.json();

            if (res.ok) {
                showToast(`Berhasil menyimpan ${result.data.importedCount} transaksi`, 'success');
                router.push('/transactions');
                router.refresh();
            } else {
                throw new Error(result.error || 'Gagal menyimpan transaksi');
            }
        } catch (error: any) {
            console.error('Import Error:', error);
            showToast(error.message, 'error');
        } finally {
            setImporting(false);
        }
    };

    const toggleSelection = (id: string) => {
        setTransactions(txs => txs.map(t => 
            t.id === id ? { ...t, selected: !t.selected } : t
        ));
    };

    const toggleAll = (checked: boolean) => {
        setTransactions(txs => txs.map(t => ({ ...t, selected: checked })));
    };

    const selectedTxs = transactions.filter(t => t.selected);
    const totalIncome = selectedTxs.filter(t => t.type === 'INCOME').reduce((sum, t) => sum + t.amount, 0);
    const totalExpense = selectedTxs.filter(t => t.type === 'EXPENSE').reduce((sum, t) => sum + t.amount, 0);

    return (
        <div className="min-h-screen bg-gray-50">
            <Navbar />

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Import Excel</h1>
                        <p className="text-gray-600">
                            Unggah file Excel berisi daftar transaksi untuk dimasukkan ke sistem secara otomatis.
                        </p>
                    </div>
                    {step === 'UPLOAD' && (
                        <button
                            onClick={handleDownloadTemplate}
                            className="inline-flex items-center gap-2 bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors font-medium shadow-sm"
                        >
                            <Download size={18} />
                            Download Template
                        </button>
                    )}
                </div>

                {step === 'UPLOAD' ? (
                    <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 max-w-2xl mx-auto text-center">
                        <div 
                            {...getRootProps()} 
                            className={`border-2 border-dashed rounded-xl p-10 cursor-pointer transition-colors ${
                                isDragActive ? 'border-green-500 bg-green-50' : 'border-gray-300 hover:border-green-400 hover:bg-gray-50'
                            }`}
                        >
                            <input {...getInputProps()} />
                            <div className="flex flex-col items-center justify-center gap-4">
                                <div className="p-4 bg-green-100 text-green-600 rounded-full">
                                    <UploadCloud size={40} />
                                </div>
                                <div>
                                    <p className="text-lg font-semibold text-gray-900">
                                        {isDragActive ? 'Lepaskan file Excel di sini' : 'Drag & drop file Excel di sini, atau klik untuk memilih'}
                                    </p>
                                    <p className="text-sm text-gray-500 mt-2">
                                        Mendukung format .xlsx, .xls, .csv (Max. 10MB)
                                    </p>
                                </div>
                            </div>
                        </div>

                        {file && (
                            <div className="mt-6 flex flex-col p-4 bg-gray-50 rounded-xl border border-gray-200">
                                <div className="flex items-center justify-between w-full">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-green-100 rounded-lg text-green-600">
                                            <FileText size={24} />
                                        </div>
                                        <div className="text-left">
                                            <p className="text-sm font-semibold text-gray-900 truncate max-w-[200px] sm:max-w-xs">{file.name}</p>
                                            <p className="text-xs text-gray-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setFile(null);
                                        }}
                                        className="p-2 text-gray-400 hover:text-red-500 transition-colors bg-white border border-gray-200 rounded-lg shadow-sm"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </div>
                        )}

                        <button
                            onClick={handleProcessExcel}
                            disabled={!file || loading}
                            className="mt-6 w-full py-3 bg-green-600 text-white font-semibold rounded-xl hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors shadow-sm"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="animate-spin" size={20} />
                                    Membaca Data Excel...
                                </>
                            ) : (
                                'Proses Data Excel'
                            )}
                        </button>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {/* Summary & Actions */}
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                            <div className="flex gap-6">
                                <div>
                                    <p className="text-sm text-gray-500">Pemasukan Dipilih</p>
                                    <p className="text-xl font-bold text-green-600">+{formatCurrency(totalIncome)}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Pengeluaran Dipilih</p>
                                    <p className="text-xl font-bold text-red-600">-{formatCurrency(totalExpense)}</p>
                                </div>
                            </div>
                            
                            <div className="flex gap-3 w-full sm:w-auto">
                                <button
                                    onClick={() => {
                                        setStep('UPLOAD');
                                        setFile(null);
                                        setTransactions([]);
                                    }}
                                    disabled={importing}
                                    className="flex-1 sm:flex-none px-6 py-2 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-50"
                                >
                                    Batal
                                </button>
                                <button
                                    onClick={handleImportSelected}
                                    disabled={selectedTxs.length === 0 || importing}
                                    className="flex-1 sm:flex-none px-6 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    {importing ? (
                                        <Loader2 className="animate-spin" size={20} />
                                    ) : (
                                        <CheckCircle2 size={20} />
                                    )}
                                    Simpan ({selectedTxs.length})
                                </button>
                            </div>
                        </div>

                        {/* Preview Table */}
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-gray-50 text-gray-600 font-medium border-b border-gray-200">
                                        <tr>
                                            <th className="px-6 py-4 w-12">
                                                <input
                                                    type="checkbox"
                                                    className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                                                    checked={transactions.length > 0 && selectedTxs.length === transactions.length}
                                                    onChange={(e) => toggleAll(e.target.checked)}
                                                />
                                            </th>
                                            <th className="px-6 py-4">Tanggal</th>
                                            <th className="px-6 py-4">Kategori</th>
                                            <th className="px-6 py-4">Tipe</th>
                                            <th className="px-6 py-4">Keterangan</th>
                                            <th className="px-6 py-4 text-right">Nominal</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {transactions.map((tx) => (
                                            <tr key={tx.id} className={`hover:bg-gray-50 transition-colors ${!tx.selected ? 'opacity-50' : ''}`}>
                                                <td className="px-6 py-4">
                                                    <input
                                                        type="checkbox"
                                                        className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                                                        checked={tx.selected}
                                                        onChange={() => toggleSelection(tx.id)}
                                                    />
                                                </td>
                                                <td className="px-6 py-4 font-medium text-gray-900">
                                                    {tx.date}
                                                </td>
                                                <td className="px-6 py-4 text-gray-600">
                                                    {tx.category}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                                                        tx.type === 'INCOME' 
                                                            ? 'bg-green-100 text-green-700' 
                                                            : 'bg-red-100 text-red-700'
                                                    }`}>
                                                        {tx.type}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-gray-600">
                                                    {tx.description}
                                                </td>
                                                <td className={`px-6 py-4 text-right font-bold ${
                                                    tx.type === 'INCOME' ? 'text-green-600' : 'text-red-600'
                                                }`}>
                                                    {formatCurrency(tx.amount)}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
