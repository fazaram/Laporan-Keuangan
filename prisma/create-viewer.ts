import { prisma } from '../lib/db';
import bcrypt from 'bcryptjs';

/**
 * Script to create a viewer user (read-only access)
 * Usage: npx tsx prisma/create-viewer.ts <email> <password> <name>
 */

async function createViewer(email: string, password: string, name: string) {
    try {
        // Check if user already exists
        const existingUser = await prisma.user.findUnique({
            where: { email },
        });

        if (existingUser) {
            console.error(`❌ User dengan email ${email} sudah ada`);
            process.exit(1);
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create viewer user
        const user = await prisma.user.create({
            data: {
                email,
                password: hashedPassword,
                name,
                role: 'VIEWER',
            },
        });

        console.log(`✅ Viewer user berhasil dibuat!`);
        console.log(`Email: ${user.email}`);
        console.log(`Name: ${user.name}`);
        console.log(`Role: ${user.role}`);
        console.log(`\n📖 User ini hanya bisa VIEW data, tidak bisa CREATE/UPDATE/DELETE`);
    } catch (error) {
        console.error('❌ Error membuat viewer user:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

const email = process.argv[2];
const password = process.argv[3];
const name = process.argv[4];

if (!email || !password || !name) {
    console.error('❌ Parameter tidak lengkap');
    console.log('Usage: npx tsx prisma/create-viewer.ts <email> <password> <name>');
    console.log('Example: npx tsx prisma/create-viewer.ts viewer@laporan.com viewer123 "View Only User"');
    process.exit(1);
}

createViewer(email, password, name).catch((error) => {
    console.error(error);
    process.exit(1);
});
