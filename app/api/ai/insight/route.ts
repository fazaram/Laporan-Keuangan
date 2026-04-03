import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { TransactionType } from '@prisma/client';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        if (!process.env.GEMINI_API_KEY) {
            return NextResponse.json({ insights: [] });
        }

        // Ambil data keuangan user (30 hari terakhir)
        const now = new Date();
        const thirtyDaysAgo = new Date(now.setDate(now.getDate() - 30));
        
        const transactions = await (prisma as any).transaction.findMany({
            where: { userId: session.user.id, date: { gte: thirtyDaysAgo } },
            orderBy: { date: 'desc' }
        });

        const userData = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { name: true, bio: true }
        });

        const goals = await (prisma as any).goal.findMany({
            where: { userId: session.user.id, status: 'ACTIVE' }
        });

        const totalIncome = transactions.filter((t: any) => t.type === 'INCOME').reduce((a: any, b: any) => a + Number(b.amount), 0);
        const totalExpense = transactions.filter((t: any) => t.type === 'EXPENSE').reduce((a: any, b: any) => a + Number(b.amount), 0);
        const saldo = totalIncome - totalExpense;
        
        const goalsSummary = goals.map((g: any) => `- ${g.name}: Rp ${Number(g.targetAmount).toLocaleString('id-ID')}`).join('\n');

        const systemPrompt = `Anda adalah asisten keuangan pribadi bernama "Solvia Assistant". Anda bertugas memberikan analisis, saran, dan menjawab pertanyaan terkait keuangan pengguna berdasarkan data berikut:
        
USER PROFILE:
- Nama: ${userData?.name || 'User'}
- Bio: ${(userData as any)?.bio || '-'}

DATA KEUANGAN PENGGUNA (30 Hari Terakhir):
- Saldo: Rp ${saldo.toLocaleString('id-ID')}
- Total Pemasukan: Rp ${totalIncome.toLocaleString('id-ID')}
- Total Pengeluaran: Rp ${totalExpense.toLocaleString('id-ID')}
- Target Tabungan (Goals):
${goalsSummary || '- Belum ada tabungan'}

FORMAT:
- Balas HANYA dengan list JSON string array, contoh: ["Poin 1", "Poin 2", "Poin 3"]
- Gunakan Bahasa Indonesia.
- Jangan ada teks lain selain JSON array.
- Pastikan insight spesifik dan berikan apresiasi jika ada peningkatan atau saran jika pengeluaran terlalu tinggi.
`;

        const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
        const result = await model.generateContent(systemPrompt);
        const responseText = result.response.text();
        
        console.log('AI Raw Response:', responseText);

        // Robust extraction using Regex for JSON array [...]
        const jsonMatch = responseText.match(/\[[\s\S]*\]/);
        if (!jsonMatch) {
            console.error('Failed to find JSON array in AI response');
            throw new Error('Format respon AI tidak valid (JSON array tidak ditemukan)');
        }

        const insights = JSON.parse(jsonMatch[0]);

        return NextResponse.json({ insights });

    } catch (error: any) {
        console.error('Insight API Error:', error);
        
        // Handle Rate Limit Error (429)
        if (error.message?.includes('429') || error.status === 429) {
            return NextResponse.json({ 
                insights: ["Limit harian AI habis (Free Tier). Silakan coba lagi besok."] 
            });
        }

        return NextResponse.json({ 
            error: `Gagal memuat analisis: ${error.message}`,
            insights: ["Gagal memuat analisis AI saat ini. Silakan coba lagi nanti."] 
        });
    }
}
