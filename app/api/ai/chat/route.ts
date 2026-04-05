import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { generateAIResponse, Message } from '@/lib/ai';

export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        if (!process.env.GEMINI_API_KEY) {
            return NextResponse.json({ 
                error: 'API Key Gemini belum dikonfigurasi. Tambahkan GEMINI_API_KEY di file .env' 
            }, { status: 400 });
        }

        const { message, history = [] } = await req.json();
        
        if (!message) {
            return NextResponse.json({ error: 'Pesan tidak boleh kosong' }, { status: 400 });
        }

        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        // Ambil data keuangan user
        const transactions = await (prisma as any).transaction.findMany({
            where: { userId: session.user.id, date: { gte: thirtyDaysAgo } },
            orderBy: { date: 'desc' }
        });

        const goals = await (prisma as any).goal.findMany({
            where: { userId: session.user.id, status: 'ACTIVE' }
        });

        const userData = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { name: true, bio: true }
        });

        const totalIncome = transactions.filter((t: any) => t.type === 'INCOME').reduce((a: any, b: any) => a + Number(b.amount), 0);
        const totalExpense = transactions.filter((t: any) => t.type === 'EXPENSE').reduce((a: any, b: any) => a + Number(b.amount), 0);
        const saldo = totalIncome - totalExpense;

        const goalsSummary = goals.map((g: any) => 
            `- ${g.name}: Target Rp ${Number(g.targetAmount).toLocaleString('id-ID')}, Terkumpul Rp ${Number(g.currentAmount).toLocaleString('id-ID')} (${Math.round((Number(g.currentAmount)/Number(g.targetAmount))*100)}%)`
        ).join('\n');

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

ATURAN PENTING:
1. Jawab HANYA menggunakan Bahasa Indonesia dengan nada ramah, profesional, dan empatik.
2. Jika pengguna bertanya di luar konteks keuangan, tabungan, pengeluaran, pemasukan, atau budgeting, tolak dengan sopan dan katakan: "Maaf, saya hanya dapat membantu Anda terkait manajemen keuangan pribadi."
3. Berikan jawaban yang ringkas dan mudah dipahami, gunakan bullet points jika perlu.
4. Selalu mendasari saran Anda pada data keuangan pengguna di atas.
`;

        const messages: Message[] = [
            { role: 'system', content: systemPrompt },
            ...history.map((msg: any) => ({
                role: msg.role === 'user' ? 'user' : 'assistant',
                content: msg.content
            })),
            { role: 'user', content: message }
        ];

        const reply = await generateAIResponse(messages);

        // Simpan ke database
        try {
            await (prisma as any).chatHistory.create({
                data: {
                    userId: session.user.id,
                    role: 'user',
                    content: message,
                }
            });
            await (prisma as any).chatHistory.create({
                data: {
                    userId: session.user.id,
                    role: 'assistant',
                    content: reply,
                }
            });
        } catch (e) {
            console.error('Failed to save chat history:', e);
        }

        return NextResponse.json({ reply });

    } catch (error: any) {
        console.error('Chat API Error:', error);
        
        // Handle Rate Limit Error (429)
        if (error.message?.includes('429') || error.status === 429) {
            return NextResponse.json({ 
                error: 'Limit harian AI habis. Silakan coba lagi beberapa saat lagi atau besok.' 
            }, { status: 429 });
        }

        return NextResponse.json({ 
            error: `Gagal memproses AI: ${error.message}` 
        }, { status: 500 });
    }
}

