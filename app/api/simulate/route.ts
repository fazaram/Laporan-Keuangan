import { NextRequest, NextResponse } from 'next/server';
import { generateAIResponse } from '@/lib/ai';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { income, expenses, totalExpense, savings } = body;

        const prompt = `
            Anda adalah Solvia Assistant, seorang perencana keuangan profesional.
            Bantulah pengguna menganalisis simulasi keuangan bulanan mereka dengan gaya bahasa yang santai namun tetap formal, solutif, dan memberikan wawasan mendalam.

            DATA SIMULASI:
            - Penghasilan Bulanan: Rp ${income.toLocaleString('id-ID')}
            - Total Pengeluaran: Rp ${totalExpense.toLocaleString('id-ID')}
            - Potensi Tabungan: Rp ${savings.toLocaleString('id-ID')}
            
            RINCIAN PENGELUARAN:
            ${Object.entries(expenses).map(([group, items]: [string, any]) => {
                return `- ${group}: ${Object.entries(items).map(([name, val]: [string, any]) => `${name} (Rp ${val.toLocaleString('id-ID')})`).join(', ')}`;
            }).join('\n')}

            TUGAS ANDA:
            1. Berikan skor kesehatan keuangan (0-100).
            2. Analisis apakah pengeluaran mereka sehat dibandingkan dengan penghasilan.
            3. Berikan saran konkret untuk mengoptimalkan potensi tabungan.
            4. Gunakan gaya bahasa Indonesia yang modern, ramah, namun berwibawa.
            
            Format jawaban harus dalam Markdown yang rapi.
        `;

        const response = await generateAIResponse([
            { role: 'system', content: 'Anda adalah seorang Coach Keuangan yang handal dan ramah.' },
            { role: 'user', content: prompt }
        ]);

        return NextResponse.json({ insight: response });
    } catch (error: any) {
        console.error('Simulation API Error:', error);
        return NextResponse.json(
            { error: error.message || 'Gagal memproses simulasi.' },
            { status: 500 }
        );
    }
}
