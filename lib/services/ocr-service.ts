import Groq from "groq-sdk";

export interface ScanResult {
    merchant?: string;
    amount?: number;
    date?: string;
    category?: string;
    description?: string;
    type: 'INCOME' | 'EXPENSE';
}

export class OCRService {
    static async scanReceipt(base64Image: string): Promise<ScanResult> {
        const apiKey = process.env.GROQ_API_KEY;
        if (!apiKey) {
            throw new Error('GROQ_API_KEY belum dikonfigurasi di .env');
        }

        const groq = new Groq({ apiKey });

        const prompt = `
            Analyze this receipt/invoice image and extract transaction details.
            Return ONLY a JSON object with the following fields:
            {
                "merchant": "string (name of the store/place)",
                "amount": number (total amount paid),
                "date": "string (ISO date format YYYY-MM-DD or empty)",
                "category": "string (one word category like Food, Transport, Shopping, Medical, Utilities, etc.)",
                "description": "string (brief summary of items)",
                "type": "EXPENSE"
            }
            If the image is an income proof, set type to "INCOME".
            Be accurate with the total amount.
        `;

        try {
            const chatCompletion = await groq.chat.completions.create({
                messages: [
                    {
                        role: "user",
                        content: [
                            { type: "text", text: prompt },
                            {
                                type: "image_url",
                                image_url: {
                                    url: `data:image/jpeg;base64,${base64Image}`,
                                },
                            },
                        ],
                    },
                ],
                model: "llama-3.2-11b-vision-preview",
                temperature: 0,
                response_format: { type: "json_object" },
            });

            const text = chatCompletion.choices[0]?.message?.content || "{}";
            return JSON.parse(text);
        } catch (error: any) {
            console.error('OCR Service Error:', error);
            const errorMessage = error.message || 'Unknown OCR Error';
            throw new Error(`Gagal membaca struk dengan Groq: ${errorMessage}`);
        }
    }
}
