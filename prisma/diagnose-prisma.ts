import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
    log: ['query', 'info', 'warn', 'error'],
});

async function diagnoseConnection() {
    console.log('🔍 Diagnosing Prisma PostgreSQL connection...\n');
    console.log('Environment DATABASE_URL:', process.env.DATABASE_URL);
    console.log('');

    try {
        console.log('Step 1: Attempting to connect...');
        await prisma.$connect();
        console.log('✅ Connected successfully!\n');

        console.log('Step 2: Testing query...');
        const result = await prisma.$queryRaw`SELECT current_database(), version()`;
        console.log('✅ Query successful!');
        console.log('Result:', result);
        console.log('');

        console.log('Step 3: Checking database schema...');
        const tables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `;
        console.log('✅ Tables in database:', tables);

    } catch (error: any) {
        console.error('\n❌ Error occurred:');
        console.error('Error type:', error.constructor.name);
        console.error('Error message:', error.message);
        console.error('Error code:', error.code);
        console.error('');
        console.error('Full error:', JSON.stringify(error, null, 2));
    } finally {
        await prisma.$disconnect();
        console.log('\n✅ Disconnected');
    }
}

diagnoseConnection();
