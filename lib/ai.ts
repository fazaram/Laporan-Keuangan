import { GoogleGenerativeAI } from "@google/generative-ai";

export type Message = {
  role: 'system' | 'user' | 'assistant';
  content: string;
};

// Inisialisasi Google Generative AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function generateAIResponse(messages: Message[], modelName: string = 'gemini-flash-latest') {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured in .env');
  }

  try {
    const model = genAI.getGenerativeModel({ model: modelName });

    // Fail-safe: Masukkan instruksi sistem ke dalam history
    // karena beberapa versi API menolak parameter systemInstruction secara terpisah
    const systemInstruction = messages.find(m => m.role === 'system')?.content;
    const contents: any[] = [];

    if (systemInstruction) {
      contents.push({
        role: 'user',
        parts: [{ text: `CONTEXT/INSTRUCTION: ${systemInstruction}` }]
      });
      contents.push({
        role: 'model',
        parts: [{ text: 'Baik, saya mengerti. Saya adalah Solvia Assistant dan siap membantu Anda berdasarkan konteks tersebut.' }]
      });
    }
    
    // Ambil pesan selain sistem dan pastikan perannya bergantian (user, model, user...)
    const chatMessages = messages.filter(m => m.role !== 'system');
    
    chatMessages.forEach((msg) => {
      const role = msg.role === 'user' ? 'user' : 'model';
      if (contents.length > 0 && contents[contents.length - 1].role === role) {
        // Gabungkan jika ada pesan beruntun dengan peran yang sama
        contents[contents.length - 1].parts[0].text += '\n' + msg.content;
      } else {
        contents.push({
          role,
          parts: [{ text: msg.content }]
        });
      }
    });

    if (contents.length === 0) {
        throw new Error('Pesan tidak boleh kosong.');
    }

    // Ambil pesan terakhir untuk sendMessage, sisanya menjadi history
    const lastMessage = contents.pop();
    
    const chat = model.startChat({
      history: contents,
    });

    const result = await chat.sendMessage(lastMessage.parts[0].text);
    const response = await result.response;
    return response.text();
    
  } catch (error: any) {
    console.error('Gemini SDK Error:', error);
    
    // Tangani error quota/rate limit (429)
    if (error.message?.includes('429') || error.status === 429) {
      throw new Error('Limit harian Free Tier Gemini telah tercapai. Silakan coba lagi nanti.');
    }
    
    // Tangani error model tidak ditemukan (404)
    if (error.message?.includes('404') || error.status === 404) {
      throw new Error(`Model AI '${modelName}' tidak ditemukan atau tidak didukung di wilayah Anda. Pastikan API Key benar.`);
    }

    throw new Error(error.message || 'Gagal memproses permintaan AI.');
  }
}
