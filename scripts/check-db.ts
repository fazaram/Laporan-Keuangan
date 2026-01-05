/**
 * Quick script to verify database connection and check if users exist
 * Run with: npx tsx scripts/check-db.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    try {
        console.log('🔍 Checking database connection...\n');

        // Test connection
        await prisma.$connect();
        console.log('✅ Database connected successfully\n');

        // Count users
        const userCount = await prisma.user.count();
        console.log(`📊 Total users in database: ${userCount}\n`);

        if (userCount > 0) {
            // Get all users (without password)
            const users = await prisma.user.findMany({
                select: {
                    id: true,
                    email: true,
                    name: true,
                    role: true,
                    createdAt: true,
                },
            });

            console.log('👥 Users in database:\n');
            users.forEach((user, index) => {
                console.log(`${index + 1}. ${user.email}`);
                console.log(`   Name: ${user.name}`);
                console.log(`   Role: ${user.role}`);
                console.log(`   Created: ${user.createdAt}`);
                console.log('');
            });
        } else {
            console.log('⚠️  No users found in database!');
            console.log('   You need to create users first.');
            console.log('   Run: npx prisma db seed\n');
        }

    } catch (error) {
        console.error('❌ Error:', error);

        if (error instanceof Error) {
            if (error.message.includes('connect')) {
                console.log('\n💡 Database connection failed!');
                console.log('   Check your DATABASE_URL in .env file');
            }
        }
    } finally {
        await prisma.$disconnect();
    }
}

main();
