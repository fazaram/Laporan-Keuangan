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

        const goals = await (prisma as any).goal.findMany({
            where: { userId: session.user.id, status: 'ACTIVE' }
        });

        const income = transactions.filter((t: any) => t.type === 'INCOME').reduce((a: any, b: any) => a + Number(b.amount), 0);
        const expense = transactions.filter((t: any) => t.type === 'EXPENSE').reduce((a: any, b: any) => a + Number(b.amount), 0);
        
        // Kategori pengeluaran terbesar
        const expenseCategories = transactions
            .filter((t: any) => t.type === 'EXPENSE')
            .reduce((acc: any, t: any) => {
                acc[t.category] = (acc[t.category] || 0) + Number(t.amount);
                return acc;
            }, {});
        
        const topCategory = Object.entries(expenseCategories)
            .sort((a: any, b: any) => b[1] - a[1])[0] || ['-', 0];

        const systemPrompt = `Anda adalah Solvia Assistant, analis keuangan pribadi yang handal. Berikan 3-4 poin insight (saran/analisis) singkat dan tajam berdasarkan data 30 hari terakhir.
        
DATA:
- Pemasukan: Rp ${income.toLocaleString('id-ID')}
- Pengeluaran: Rp ${expense.toLocaleString('id-ID')}
- Kategori Pengeluaran Terbesar: ${topCategory[0]} (Rp ${Number(topCategory[1]).toLocaleString('id-ID')})
- Goals Aktif: ${goals.length} buah

FORMAT:
- Balas HANYA dengan list JSON string array, contoh: ["Poin 1", "Poin 2", "Poin 3"]
- Gunakan Bahasa Indonesia.
- Jangan ada teks lain selain JSON array.
- Pastikan insight spesifik (misal: "Pengeluaran di kategori X cukup tinggi, coba kurangi").
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
