import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET() {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'ADMIN') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const configs = await (prisma as any).systemConfig.findMany();
        const configMap = configs.reduce((acc: any, curr: any) => {
            acc[curr.key] = curr.value;
            return acc;
        }, {});

        return NextResponse.json(configMap);
    } catch (error) {
        console.error('Error fetching system config:', error);
        return NextResponse.json({});
    }
}

export async function POST(req: Request) {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'ADMIN') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await req.json();
        const { key, value } = body;

        const config = await (prisma as any).systemConfig.upsert({
            where: { key },
            update: { value },
            create: { key, value },
        });

        return NextResponse.json(config);
    } catch (error) {
        console.error('Error updating system config:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
