import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testConnection() {
    try {
        console.log('🔄 Testing PostgreSQL connection...');

        // Try to connect to the database
        await prisma.$connect();
        console.log('✅ Successfully connected to PostgreSQL database!');

        // Try a simple query
        const result = await prisma.$queryRaw`SELECT current_database(), version()`;
        console.log('📊 Connection details:', result);

        await prisma.$disconnect();
        console.log('✅ Test completed successfully!');
    } catch (error) {
        console.error('❌ Connection test failed:');
        console.error('Error details:', error);
        await prisma.$disconnect();
        process.exit(1);
    }
}

testConnection();
