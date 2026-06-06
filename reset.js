require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function reset() {
  try {
    const hash = await bcrypt.hash('faza123', 10);
    await prisma.user.update({
      where: { email: 'faza@gmail.com' },
      data: { password: hash }
    });
    console.log('Password reset success!');
  } catch (error) {
    console.error('Failed:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}
reset();
