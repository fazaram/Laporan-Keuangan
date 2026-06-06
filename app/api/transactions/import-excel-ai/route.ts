import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import Groq from 'groq-sdk';

export const maxDuration = 60; // Allow more time for AI
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { rawRows } = body;

        if (!rawRows || !Array.isArray(rawRows)) {
            return NextResponse.json({ error: 'No valid data provided' }, { status: 400 });
        }

        const apiKey = process.env.GROQ_API_KEY;
        if (!apiKey) {
            throw new Error('GROQ_API_KEY belum dikonfigurasi di .env');
        }

        const groq = new Groq({ apiKey });

        // Convert the 2D array of rows into a readable format for the AI
        let csvString = '';
        for (const row of rawRows) {
            if (Array.isArray(row) && row.length > 0) {
                // Ignore completely empty rows
                if (row.every(cell => cell === null || cell === undefined || cell === '')) continue;
                csvString += JSON.stringify(row) + '\n';
            }
        }

        // Limit string size to avoid token limits (150k chars is approx 35k tokens, safe for Llama 3)
        const truncatedCsv = csvString.substring(0, 150000);

        const prompt = `Anda adalah AI parser laporan keuangan tingkat lanjut.
Tugas Anda adalah membedah dan mengekstrak tabel transaksi keuangan berantakan (seperti laporan Excel mutasi bank, rekening koran, atau catatan harian) menjadi data transaksi JSON yang terstruktur.

DATA INPUT:
Berikut adalah baris-baris data yang diambil dari file Excel (direpresentasikan sebagai array JSON tiap barisnya agar Anda dapat melihat indeks sel kosong dengan jelas):
${truncatedCsv}

ATURAN UTAMA:
1. Posisikan diri Anda sebagai nasabah/pemilik catatan.
2. Tentukan TIPE transaksi secara cermat berdasarkan NAMA KOLOM (indeks array) tempat angka itu berada:
   - Jika nominal berada di indeks kolom yang sama dengan "Pemasukan", "Kredit", "Masuk", atau sejenisnya, maka itu MUTLAK "INCOME".
   - BACA STRUKTUR MERGED CELLS EXCEL: Jika Anda melihat nilai uang pada indeks array yang tadinya merupakan sub-header (seperti "Lunas" atau "Dp") di bawah payung "Pemasukan", maka itu adalah "INCOME". Karena kami menggunakan format array, sel yang kosong (null) tidak akan menggeser urutan indeks.
   - Jika nominal berada di bawah indeks kolom "Pengeluaran", "Debit", "Keluar", atau sejenisnya, maka itu MUTLAK "EXPENSE".
   - PROSES SEMUA SHEET: Data input mungkin terdiri dari banyak lembar/sheet (ditandai dengan "--- SHEET: Nama ---"). Anda WAJIB memproses transaksi dari SEMUA sheet dan menggabungkannya dalam satu array output, jangan berhenti di sheet pertama!
   - Abaikan baris saldo akhir (Saldo/Balance/Total) yang bukan mutasi nyata.
3. MATA UANG & NOMINAL:
   - Nilai \`amount\` HARUS berupa ANGKA MURNI tanpa simbol (contoh: 150000). Jika ada DP dan Lunas dalam baris yang sama, jumlahkan keduanya menjadi satu nominal (amount).
   - Bersihkan teks pemisah ribuan (titik/koma).
4. KATEGORI & DESKRIPSI: 
   - Tentukan kategori umum yang masuk akal (Makan, Transportasi, Tagihan, Transfer, Gaji, Belanja, Pekerjaan, dll).
   - Gunakan uraian/keterangan yang ada di baris tersebut sebagai deskripsi.
5. TANGGAL: 
   - Konversi format tanggal menjadi YYYY-MM-DD. Jika tahun tidak tertera eksplisit, asumsikan tahun berjalan.

FORMAT OUTPUT:
Keluarkan STRICT JSON berupa ARRAY OF OBJECTS tanpa teks pengantar apapun.
Format Array Object:
[
  {
    "date": "YYYY-MM-DD",
    "description": "Deskripsi singkat",
    "amount": 250000,
    "type": "EXPENSE",
    "category": "Belanja"
  }
]
`;

        const chatCompletion = await groq.chat.completions.create({
            messages: [
                { role: "user", content: prompt },
            ],
            model: "llama-3.3-70b-versatile", // Fast logic model
            temperature: 0,
            max_tokens: 8000,
        });

        let responseText = chatCompletion.choices[0]?.message?.content || "[]";
        
        console.log("=== EXCEL AI DEBUG ===");
        console.log("AI Response:", responseText);
        console.log("======================");
        
        // Write to log file for debugging
        try {
            const fs = require('fs');
            fs.appendFileSync('C:\\Users\\fazar\\.gemini\\antigravity\\brain\\9d123c72-35c9-4877-bd37-5bc7be65be8d\\scratch\\ai-debug.log', '\n\n--- NEW AI EXCEL PARSE ---\n' + responseText);
        } catch (e) {}

        let jsonString = responseText;
        const firstBracket = responseText.indexOf('[');
        const lastBracket = responseText.lastIndexOf(']');
        
        if (firstBracket !== -1 && lastBracket !== -1 && lastBracket > firstBracket) {
            jsonString = responseText.substring(firstBracket, lastBracket + 1);
        } else {
            // fallback: maybe it returned an object {} instead of array []
            const firstBrace = responseText.indexOf('{');
            const lastBrace = responseText.lastIndexOf('}');
            if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
                jsonString = responseText.substring(firstBrace, lastBrace + 1);
            }
        }
        
        let parsedData: any;
        try {
            parsedData = JSON.parse(jsonString);
            if (!Array.isArray(parsedData)) {
                // Find array prop inside object
                const arrayProp = Object.values(parsedData).find(val => Array.isArray(val));
                parsedData = arrayProp || [];
            }
        } catch (e: any) {
            console.error("JSON Parse Error:", e, responseText);
            try {
                const fs = require('fs');
                fs.appendFileSync('C:\\Users\\fazar\\.gemini\\antigravity\\brain\\9d123c72-35c9-4877-bd37-5bc7be65be8d\\scratch\\ai-debug.log', '\n[PARSE ERROR]: ' + e.message + '\n[JSON EXTRACTED]: ' + jsonString);
            } catch(err) {}
            return NextResponse.json({ error: 'Gagal memproses AI JSON. Silakan coba lagi.' }, { status: 500 });
        }

        if (!parsedData || parsedData.length === 0) {
            return NextResponse.json({ error: 'AI tidak dapat mendeteksi adanya data transaksi.' }, { status: 400 });
        }

        return NextResponse.json({ transactions: parsedData });

    } catch (error: any) {
        console.error('Import Excel AI Error:', error);
        return NextResponse.json({ 
            error: 'Gagal memproses transaksi. Silakan coba lagi.',
            details: error.message 
        }, { status: 500 });
    }
}
