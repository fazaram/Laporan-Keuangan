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

    console.log('Wallets:', wallets.length);
    wallets.forEach(w => console.log(`- ${w.name}: Budget=${w.budgetAmount}, Spent=${w.spentAmount}`));
    
    console.log('\nRules:', rules.length);
    rules.forEach(r => console.log(`- WalletId: ${r.walletId}, %=${r.percentage}, Fixed=${r.fixedAmount}`));

    console.log('\nRecent Incomes:', transactions.length);
    transactions.forEach(t => console.log(`- ${t.category}: ${t.amount}`));

  } catch (err) {
    console.error('Error:', err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
