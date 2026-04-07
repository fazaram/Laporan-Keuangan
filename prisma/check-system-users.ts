import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.findUnique({
    where: { email: 'admin@laporan.com' },
  });

  if (user) {
    console.log(`User found: ${user.email} (Role: ${user.role})`);
  } else {
    console.log('User admin@laporan.com NOT found in database.');
  }

  const allUsers = await prisma.user.findMany({
    select: { email: true, role: true }
  });
  console.log('Users in database:', allUsers);
}

main()
  .catch((e) => console.error(e))
  .finally(async () => await prisma.$disconnect());
