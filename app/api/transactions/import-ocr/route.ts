import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
const pdf = require('pdf-parse');
import Groq from 'groq-sdk';

export const maxDuration = 60; // Allow more time for OCR and AI
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const formData = await request.formData();
        const file = formData.get('file') as File | null;

        if (!file) {
            return NextResponse.json({ error: 'No file provided' }, { status: 400 });
        }

        // Check file size (max 10MB)
        if (file.size > 10 * 1024 * 1024) {
            return NextResponse.json({ error: 'File size exceeds 10MB limit' }, { status: 400 });
        }

        const buffer = Buffer.from(await file.arrayBuffer());
        const mimeType = file.type;
        
        const apiKey = process.env.GROQ_API_KEY;
        if (!apiKey) {
            throw new Error('GROQ_API_KEY belum dikonfigurasi di .env');
        }

        const groq = new Groq({ apiKey });

        let exchangeRatesData: any = null;
        try {
            const ratesRes = await fetch('https://open.er-api.com/v6/latest/IDR', { next: { revalidate: 3600 } });
            if (ratesRes.ok) {
                exchangeRatesData = await ratesRes.json();
            }
        } catch (e) {
            console.error("Gagal mengambil kurs:", e);
        }

        const prompt = `Anda adalah AI parser keuangan tingkat lanjut.
Tugas Anda adalah mengubah gambar struk belanja atau dokumen mutasi rekening menjadi data transaksi terstruktur.

ATURAN UTAMA:
1. Posisikan diri Anda sebagai pembeli atau pemilik rekening (nasabah), BUKAN sebagai kasir atau toko.
2. Tentukan TIPE transaksi:
   - STRUK BELANJA (dari toko, restoran, minimarket) SELALU "EXPENSE".
   - MUTASI REKENING: Istilah Debit (DB) atau uang keluar adalah "EXPENSE". Istilah Credit (CR) atau uang masuk adalah "INCOME".
   - Jika tidak yakin, default ke "EXPENSE".
3. MATA UANG & FORMAT ANGKA:
   - JANGAN PERNAH MELAKUKAN KONVERSI KURS / MATEMATIKA! Ambil nominal murni persis seperti yang tertera di struk. Jika tertera 150,500.00, maka outputkan 150500. Abaikan simbol mata uang dalam angka.
   - Ekstrak kode mata uang (contoh: IDR, USD, JPY, EUR, SGD) dan masukkan ke field \`currency\`. Jika tidak ada keterangan mata uang, default ke "IDR".
   - Nilai \`amount\` HARUS berupa ANGKA MURNI tanpa simbol dan tanpa titik/koma ribuan (contoh benar: 150500).
4. PENGGABUNGAN ITEM (PENTING):
   - Untuk STRUK BELANJA: JANGAN memasukkan setiap item barang menjadi transaksi terpisah! Gabungkan seluruh belanjaan menjadi SATU transaksi saja menggunakan nominal "Total" (termasuk pajak). Deskripsinya gunakan nama toko/tempat (misal: "Belanja di Indomaret" atau "Makan di KFC").
   - Untuk MUTASI REKENING: Pisahkan setiap baris mutasi menjadi transaksi terpisah sesuai tanggalnya.
5. KATEGORI: Tentukan kategori yang masuk akal (Makan, Belanja, Transportasi, Tagihan, Transfer, Gaji, dll).
6. TANGGAL: Gunakan format YYYY-MM-DD. Jika tahun tidak tertera, gunakan tahun saat ini.

FORMAT OUTPUT:
Keluarkan output STRICT JSON berupa ARRAY OF OBJECTS tanpa teks pengantar atau penutup apapun.

CONTOH OUTPUT JSON:
[
  {
    "date": "2023-10-25",
    "description": "Belanja di Superindo",
    "amount": 250500,
    "currency": "IDR",
    "type": "EXPENSE",
    "category": "Belanja"
  }
]
`;

        let chatCompletion;

        if (mimeType === 'application/pdf') {
            try {
                const pdfData = await pdf(buffer);
                const extractedText = pdfData.text;

                if (!extractedText || extractedText.trim().length === 0) {
                    return NextResponse.json({ error: 'Tidak ada teks yang dapat diekstrak dari file PDF.' }, { status: 400 });
                }

                // Limit text size
                const truncatedText = extractedText.substring(0, 25000);

                chatCompletion = await groq.chat.completions.create({
                    messages: [
                        { role: "user", content: `${prompt}\n\nData Teks:\n${truncatedText}` },
                    ],
                    model: "llama-3.3-70b-versatile", // Fast text model
                    temperature: 0,
                });
            } catch (err) {
                console.error("PDF Parse Error:", err);
                return NextResponse.json({ error: 'Tidak dapat membaca file PDF. Pastikan file valid.' }, { status: 400 });
            }
        } else if (mimeType.startsWith('image/')) {
            try {
                // Convert buffer to base64
                const base64Image = buffer.toString('base64');
                const dataUri = `data:${mimeType};base64,${base64Image}`;

                chatCompletion = await groq.chat.completions.create({
                    messages: [
                        {
                            role: "user",
                            content: [
                                { type: "text", text: prompt },
                                { type: "image_url", image_url: { url: dataUri } },
                            ],
                        },
                    ],
                    model: "meta-llama/llama-4-scout-17b-16e-instruct", // Groq's new primary vision model
                    temperature: 0,
                    // response_format: { type: "json_object" }, // Not supported in vision models
                });
            } catch (err: any) {
                console.error("Groq Vision Error:", err);
                return NextResponse.json({ error: 'Tidak dapat menganalisis gambar dengan AI: ' + err.message }, { status: 400 });
            }
        } else {
            return NextResponse.json({ error: 'Format file tidak didukung (Gunakan JPG, PNG, atau PDF)' }, { status: 400 });
        }

        let responseText = chatCompletion.choices[0]?.message?.content || "[]";
        
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
            // In JSON mode, Llama might wrap the array in an object like { "transactions": [...] }
            // So we need to normalize it to an array
            if (!Array.isArray(parsedData)) {
                // Find the first array property
                const arrayProp = Object.values(parsedData).find(val => Array.isArray(val));
                parsedData = arrayProp || [];
            }
        } catch (e) {
            console.error("JSON Parse Error:", e, responseText);
            return NextResponse.json({ error: 'Gagal memproses transaksi (Output AI tidak valid). Silakan coba lagi.' }, { status: 500 });
        }

        if (!parsedData || parsedData.length === 0) {
            return NextResponse.json({ error: 'Tidak ada transaksi yang berhasil dikenali.' }, { status: 400 });
        }

        // Perform backend currency conversion
        if (exchangeRatesData && exchangeRatesData.rates) {
            for (let t of parsedData) {
                if (t.currency && t.currency.toUpperCase() !== 'IDR') {
                    const currencyCode = t.currency.toUpperCase();
                    const rateToUSD = exchangeRatesData.rates[currencyCode];
                    const idrToUSD = exchangeRatesData.rates['IDR']; // Technically 1 since base is IDR in this API
                    
                    if (rateToUSD) {
                        // Math: (Amount / currencyRate) * IDR rate
                        // Since base is IDR, rate is actually '1 IDR = X Currency'
                        // Wait, ER-API with /latest/IDR means base is IDR.
                        // So exchangeRatesData.rates.USD = 0.0000625. To get IDR from USD: 1 / 0.0000625 = 16000.
                        const rateToIDR = 1 / rateToUSD;
                        t.amount = Math.round(t.amount * rateToIDR);
                    }
                }
            }
        }

        return NextResponse.json({ transactions: parsedData });

    } catch (error: any) {
        console.error('Import OCR API Error:', error);
        return NextResponse.json({ 
            error: 'Gagal memproses transaksi. Silakan coba lagi.',
            details: error.message 
        }, { status: 500 });
    }
}
