const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  try {
    const goals = await prisma.goal.findMany({
      include: { allocations: true }
    });

    console.log('--- Goal Sync Check ---');
    let outOfSync = 0;
    for (const goal of goals) {
      const sumAllocated = goal.allocations.reduce((sum, a) => sum + Number(a.amount), 0);
      const currentAmount = Number(goal.currentAmount);

      if (Math.abs(sumAllocated - currentAmount) > 0.01) {
        console.log(`Goal ID: ${goal.id} (${goal.name})`);
        console.log(`  Current Amount: ${currentAmount}`);
        console.log(`  Sum Allocated: ${sumAllocated}`);
        console.log(`  Difference: ${currentAmount - sumAllocated}`);
        outOfSync++;
      }
    }

    if (outOfSync === 0) {
      console.log('All goals are in sync.');
    } else {
      console.log(`Found ${outOfSync} goals out of sync.`);
    }
  } catch (error) {
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

check();
