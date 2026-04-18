import { prisma } from '@/lib/db';
import { GoalPriority } from '@prisma/client';

export class GoalService {
    /**
     * Automatically allocates a portion of income to active goals.
     * Logic: Distributes money based on "monthly needed" to stay on track.
     * This method preserves decimal precision for "kriting" numbers.
     */
    static async allocateAutomatically(userId: string, amountToAllocate: number) {
        if (!amountToAllocate || amountToAllocate <= 0) return { success: true, remaining: 0 };

        // Fetch active goals
        const activeGoals = await prisma.goal.findMany({
            where: { userId, status: 'ACTIVE' },
        });

        if (activeGoals.length === 0) return { success: true, remaining: amountToAllocate };

        // Priority weighting: HIGH (3) > MEDIUM (2) > LOW (1)
        const priorityOrder: Record<string, number> = { HIGH: 3, MEDIUM: 2, LOW: 1 };
        activeGoals.sort((a, b) => priorityOrder[b.priority] - priorityOrder[a.priority]);

        let remainingAmount = amountToAllocate;
        const now = new Date();
        const month = now.getMonth() + 1;
        const year = now.getFullYear();

        // Track allocations per goal for this session
        const sessionAllocations: Record<string, number> = {};
        activeGoals.forEach(g => { sessionAllocations[g.id] = 0; });

        // PASS 1: Fill Monthly Requirements (Schedule)
        for (const goal of activeGoals) {
            if (remainingAmount <= 0) break;

            const tAmount = Number(goal.targetAmount);
            const cAmount = Number(goal.currentAmount);

            if (cAmount >= tAmount) continue;

            const startDate = new Date(goal.startDate);
            const monthsPassed = (year - startDate.getFullYear()) * 12 + (month - (startDate.getMonth() + 1));
            const remainingMonths = Math.max(1, goal.durationMonths - monthsPassed);
            
            const remainingTarget = Math.max(0, tAmount - cAmount);
            const neededThisMonth = remainingTarget / remainingMonths;

            const allocated = Math.min(neededThisMonth, remainingAmount);
            sessionAllocations[goal.id] += allocated;
            remainingAmount -= allocated;
        }

        // PASS 2: Accelerate Progress (Full Distribution)
        // If there's still money left, distribute it to reach total target faster starting from highest priority
        if (remainingAmount > 0) {
            for (const goal of activeGoals) {
                if (remainingAmount <= 0) break;

                const tAmount = Number(goal.targetAmount);
                const currentTotal = Number(goal.currentAmount) + sessionAllocations[goal.id];
                const distanceToGoal = Math.max(0, tAmount - currentTotal);

                if (distanceToGoal <= 0) continue;

                const extraAllocated = Math.min(distanceToGoal, remainingAmount);
                sessionAllocations[goal.id] += extraAllocated;
                remainingAmount -= extraAllocated;
            }
        }

        // DB Transactions
        const updates = [];
        for (const goal of activeGoals) {
            const amount = sessionAllocations[goal.id];
            if (amount > 0) {
                const finalAmount = Number(goal.currentAmount) + amount;
                updates.push(
                    prisma.goal.update({
                        where: { id: goal.id },
                        data: {
                            currentAmount: finalAmount,
                            status: finalAmount >= Number(goal.targetAmount) ? 'COMPLETED' : 'ACTIVE'
                        }
                    })
                );

                updates.push(
                    prisma.goalAllocation.create({
                        data: {
                            userId,
                            goalId: goal.id,
                            amount: amount,
                            month,
                            year,
                            description: 'Alokasi Otomatis (Percepatan)'
                        }
                    })
                );
            }
        }

        if (updates.length > 0) {
            await prisma.$transaction(updates);
        }

        return { success: true, remaining: remainingAmount };
    }

    /**
     * Sync Goal currentAmount with the sum of its GoalAllocation records.
     * Addresses the "sinkron kan" requirement by ensuring data integrity.
     */
    static async syncGoalAmounts(userId: string) {
        const goals = await prisma.goal.findMany({
            where: { userId },
            include: { allocations: true }
        });

        const updates = [];
        for (const goal of goals) {
            const sumAllocated = goal.allocations.reduce((sum, a) => sum + Number(a.amount), 0);
            
            // If discrepancy found (allowing for tiny float precision errors)
            if (Math.abs(sumAllocated - Number(goal.currentAmount)) > 0.001) {
                updates.push(
                    prisma.goal.update({
                        where: { id: goal.id },
                        data: { 
                            currentAmount: sumAllocated,
                            status: sumAllocated >= Number(goal.targetAmount) ? 'COMPLETED' : 'ACTIVE'
                        }
                    })
                );
            }
        }

        if (updates.length > 0) {
            await prisma.$transaction(updates);
        }

        return { success: true, syncedCount: updates.length };
    }
}
