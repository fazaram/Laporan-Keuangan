import { prisma } from '../lib/db';

/**
 * Script to promote a user to admin role
 * Usage: npx tsx prisma/promote-admin.ts <email>
 */

async function promoteToAdmin(email: string) {
    try {
        const user = await prisma.user.update({
            where: { email },
            data: { role: 'ADMIN' },
        });

        console.log(`✅ User ${user.email} has been promoted to ADMIN`);
        console.log(`User ID: ${user.id}`);
        console.log(`Name: ${user.name || 'N/A'}`);
    } catch (error) {
        console.error('❌ Error promoting user to admin:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

const email = process.argv[2];

if (!email) {
    console.error('❌ Please provide an email address');
    console.log('Usage: npx tsx prisma/promote-admin.ts <email>');
    process.exit(1);
}

promoteToAdmin(email).catch((error) => {
    console.error(error);
    process.exit(1);
});
