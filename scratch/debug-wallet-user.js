const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    const wallets = await prisma.wallet.findMany();
    const rules = await prisma.walletRule.findMany();
    const transactions = await prisma.transaction.findMany({
        where: { type: 'INCOME' },
        orderBy: { createdAt: 'desc' },
        take: 5
    });

    console.log('Wallets:', wallets.map(w => ({ name: w.name, userId: w.userId, budget: w.budgetAmount })));
    console.log('Rules:', rules.map(r => ({ walletId: r.walletId, userId: r.userId })));
    console.log('Recent Incomes:', transactions.map(t => ({ category: t.category, userId: t.userId, amount: t.amount })));

  } catch (err) {
    console.error('Error:', err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
