const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    console.log('Testing DB connection...');
    await prisma.$connect();
    console.log('Connected successfully!');
    const users = await prisma.user.count();
    console.log('User count:', users);
  } catch (err) {
    console.error('Connection failed:', err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
