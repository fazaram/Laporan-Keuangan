import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { OCRService } from '@/lib/services/ocr-service';

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { image } = body; // This should be base64 string without data:image/... prefix

        if (!image) {
            return NextResponse.json({ error: 'Gambar tidak ditemukan' }, { status: 400 });
        }

        const scanResult = await OCRService.scanReceipt(image);

        return NextResponse.json(scanResult);
    } catch (error: any) {
        console.error('API Scan Error Details:', error);
        return NextResponse.json({ 
            error: error.message || 'Internal Server Error',
            details: error.toString()
        }, { status: 500 });
    }
}
