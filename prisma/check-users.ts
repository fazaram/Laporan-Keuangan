import { prisma } from '../lib/db';

async function checkUsers() {
    try {
        console.log('📋 Checking users in database...\n');

        const users = await prisma.user.findMany({
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                createdAt: true,
            },
        });

        if (users.length === 0) {
            console.log('❌ No users found in database!\n');
            console.log('Run: npx tsx prisma/fix-users.ts to create users');
        } else {
            console.log(`✅ Found ${users.length} users:\n`);
            users.forEach((user, index) => {
                console.log(`${index + 1}. ${user.role.padEnd(7)} - ${user.email.padEnd(25)} - ${user.name}`);
            });
        }
    } catch (error) {
        console.error('❌ Error checking users:', error);
    } finally {
        await prisma.$disconnect();
    }
}

checkUsers();
