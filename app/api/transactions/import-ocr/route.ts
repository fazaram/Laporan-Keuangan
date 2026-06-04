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

        const prompt = `Anda adalah AI financial parser.
Tugas Anda adalah mengubah data OCR menjadi transaksi keuangan.

Rules:
* Tentukan apakah transaksi merupakan INCOME atau EXPENSE.
* Jika nominal masuk ke rekening maka INCOME.
* Jika pembayaran, transfer keluar, QRIS, pembelian atau debit maka EXPENSE.
* Jika tidak yakin gunakan EXPENSE.
* Tentukan kategori yang paling relevan.
* Jangan membuat transaksi yang tidak ada pada data.
* Output JSON ONLY berupa ARRAY of objects.
* Tidak boleh ada penjelasan tambahan.

Format:
[
  {
    "date": "YYYY-MM-DD",
    "description": "string",
    "amount": number,
    "type": "INCOME" | "EXPENSE",
    "category": "string"
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
                    model: "llama3-70b-8192", // Fast text model
                    temperature: 0,
                    response_format: { type: "json_object" },
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
        
        // Strip markdown backticks if any
        if (responseText.includes('```')) {
            responseText = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
        }

        let parsedData: any;
        try {
            parsedData = JSON.parse(responseText);
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

        return NextResponse.json({ transactions: parsedData });

    } catch (error: any) {
        console.error('Import OCR API Error:', error);
        return NextResponse.json({ 
            error: 'Gagal memproses transaksi. Silakan coba lagi.',
            details: error.message 
        }, { status: 500 });
    }
}
