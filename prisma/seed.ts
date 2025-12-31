import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Create default user
  const hashedPassword = await bcrypt.hash(process.env.DEFAULT_USER_PASSWORD || 'admin123', 10);
  
  const user = await prisma.user.upsert({
    where: { email: process.env.DEFAULT_USER_EMAIL || 'admin@laporan.com' },
    update: {},
    create: {
      email: process.env.DEFAULT_USER_EMAIL || 'admin@laporan.com',
      password: hashedPassword,
      name: 'Administrator',
    },
  });

  console.log('✅ Created user:', user.email);

  // Create sample transactions for demonstration
  const sampleTransactions = [
    // December 2024
    { date: new Date('2024-12-01'), category: 'Gaji', amount: 15000000, type: 'INCOME', description: 'Gaji bulanan' },
    { date: new Date('2024-12-05'), category: 'Freelance', amount: 5000000, type: 'INCOME', description: 'Proyek website' },
    { date: new Date('2024-12-03'), category: 'Belanja', amount: 2000000, type: 'EXPENSE', description: 'Belanja bulanan' },
    { date: new Date('2024-12-10'), category: 'Transportasi', amount: 500000, type: 'EXPENSE', description: 'Bensin dan transportasi' },
    { date: new Date('2024-12-15'), category: 'Makan', amount: 1500000, type: 'EXPENSE', description: 'Makan siang dan makan malam' },
    { date: new Date('2024-12-20'), category: 'Utilitas', amount: 800000, type: 'EXPENSE', description: 'Listrik dan air' },
    
    // November 2024
    { date: new Date('2024-11-01'), category: 'Gaji', amount: 15000000, type: 'INCOME', description: 'Gaji bulanan' },
    { date: new Date('2024-11-08'), category: 'Freelance', amount: 3000000, type: 'INCOME', description: 'Proyek mobile app' },
    { date: new Date('2024-11-05'), category: 'Belanja', amount: 2200000, type: 'EXPENSE', description: 'Belanja bulanan' },
    { date: new Date('2024-11-12'), category: 'Transportasi', amount: 600000, type: 'EXPENSE', description: 'Bensin dan transportasi' },
    { date: new Date('2024-11-18'), category: 'Makan', amount: 1800000, type: 'EXPENSE', description: 'Makan siang dan makan malam' },
    { date: new Date('2024-11-25'), category: 'Utilitas', amount: 750000, type: 'EXPENSE', description: 'Listrik dan air' },
    
    // October 2024
    { date: new Date('2024-10-01'), category: 'Gaji', amount: 15000000, type: 'INCOME', description: 'Gaji bulanan' },
    { date: new Date('2024-10-10'), category: 'Freelance', amount: 4000000, type: 'INCOME', description: 'Konsultasi IT' },
    { date: new Date('2024-10-05'), category: 'Belanja', amount: 1900000, type: 'EXPENSE', description: 'Belanja bulanan' },
    { date: new Date('2024-10-15'), category: 'Transportasi', amount: 550000, type: 'EXPENSE', description: 'Bensin dan transportasi' },
    { date: new Date('2024-10-20'), category: 'Makan', amount: 1600000, type: 'EXPENSE', description: 'Makan siang dan makan malam' },
    { date: new Date('2024-10-28'), category: 'Utilitas', amount: 700000, type: 'EXPENSE', description: 'Listrik dan air' },
  ];

  for (const transaction of sampleTransactions) {
    await prisma.transaction.create({
      data: {
        ...transaction,
        userId: user.id,
      },
    });
  }

  console.log(`✅ Created ${sampleTransactions.length} sample transactions`);
  console.log('🎉 Database seeding completed!');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
