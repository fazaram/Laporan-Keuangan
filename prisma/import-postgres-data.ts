import { PrismaClient } from '@prisma/client';
import { Client } from 'pg';
import * as fs from 'fs';
import * as path from 'path';

// Use direct pg client since Prisma has connection issues
const pgClient = new Client({
    user: 'postgres',
    host: '127.0.0.1',
    database: 'laporanKeuangan',
    password: 'root',
    port: 5432,
});

async function importData(backupFile: string) {
    console.log('🔄 Starting PostgreSQL data import...');

    try {
        // Read backup file
        const filepath = path.join(__dirname, 'backups', backupFile);
        if (!fs.existsSync(filepath)) {
            throw new Error(`Backup file not found: ${filepath}`);
        }

        const backupData = JSON.parse(fs.readFileSync(filepath, 'utf-8'));
        console.log(`📁 Loading backup from: ${backupData.exportDate}`);

        // Import Users
        console.log(`\n🔄 Importing ${backupData.users.length} users...`);
        for (const user of backupData.users) {
            await prisma.user.create({
                data: {
                    id: user.id,
                    email: user.email,
                    password: user.password,
                    name: user.name,
                    role: user.role,
                    createdAt: new Date(user.createdAt),
                    updatedAt: new Date(user.updatedAt),
                },
            });
        }
        console.log(`✅ Users imported`);

        // Import Transactions
        console.log(`\n🔄 Importing ${backupData.transactions.length} transactions...`);
        for (const transaction of backupData.transactions) {
            await prisma.transaction.create({
                data: {
                    id: transaction.id,
                    date: new Date(transaction.date),
                    category: transaction.category,
                    amount: transaction.amount,
                    type: transaction.type,
                    description: transaction.description,
                    userId: transaction.userId,
                    createdAt: new Date(transaction.createdAt),
                    updatedAt: new Date(transaction.updatedAt),
                },
            });
        }
        console.log(`✅ Transactions imported`);

        // Import MonthlyAnalyses
        console.log(`\n🔄 Importing ${backupData.monthlyAnalyses.length} monthly analyses...`);
        for (const analysis of backupData.monthlyAnalyses) {
            await prisma.monthlyAnalysis.create({
                data: {
                    id: analysis.id,
                    year: analysis.year,
                    month: analysis.month,
                    totalIncome: analysis.totalIncome,
                    totalExpense: analysis.totalExpense,
                    balance: analysis.balance,
                    previousMonthIncome: analysis.previousMonthIncome,
                    previousMonthExpense: analysis.previousMonthExpense,
                    previousMonthBalance: analysis.previousMonthBalance,
                    analysis: analysis.analysis,
                    recommendations: analysis.recommendations,
                    userId: analysis.userId,
                    createdAt: new Date(analysis.createdAt),
                    updatedAt: new Date(analysis.updatedAt),
                },
            });
        }
        console.log(`✅ Monthly analyses imported`);

        // Import YearlyAnalyses
        console.log(`\n🔄 Importing ${backupData.yearlyAnalyses.length} yearly analyses...`);
        for (const analysis of backupData.yearlyAnalyses) {
            await prisma.yearlyAnalysis.create({
                data: {
                    id: analysis.id,
                    year: analysis.year,
                    totalIncome: analysis.totalIncome,
                    totalExpense: analysis.totalExpense,
                    balance: analysis.balance,
                    averageMonthlyIncome: analysis.averageMonthlyIncome,
                    averageMonthlyExpense: analysis.averageMonthlyExpense,
                    previousYearIncome: analysis.previousYearIncome,
                    previousYearExpense: analysis.previousYearExpense,
                    previousYearBalance: analysis.previousYearBalance,
                    analysis: analysis.analysis,
                    recommendations: analysis.recommendations,
                    userId: analysis.userId,
                    createdAt: new Date(analysis.createdAt),
                    updatedAt: new Date(analysis.updatedAt),
                },
            });
        }
        console.log(`✅ Yearly analyses imported`);

        // Import AuditLogs
        console.log(`\n🔄 Importing ${backupData.auditLogs.length} audit logs...`);
        for (const log of backupData.auditLogs) {
            await prisma.auditLog.create({
                data: {
                    id: log.id,
                    userId: log.userId,
                    action: log.action,
                    entityType: log.entityType,
                    entityId: log.entityId,
                    oldData: log.oldData,
                    newData: log.newData,
                    ipAddress: log.ipAddress,
                    userAgent: log.userAgent,
                    createdAt: new Date(log.createdAt),
                },
            });
        }
        console.log(`✅ Audit logs imported`);

        console.log(`\n✅ Import completed successfully!`);
        console.log(`\n📊 Summary:`);
        console.log(`   - Users: ${backupData.users.length}`);
        console.log(`   - Transactions: ${backupData.transactions.length}`);
        console.log(`   - Monthly Analyses: ${backupData.monthlyAnalyses.length}`);
        console.log(`   - Yearly Analyses: ${backupData.yearlyAnalyses.length}`);
        console.log(`   - Audit Logs: ${backupData.auditLogs.length}`);
    } catch (error) {
        console.error('❌ Error during import:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

// Get backup filename from command line argument
const backupFile = process.argv[2];
if (!backupFile) {
    console.error('❌ Please provide backup filename as argument');
    console.log('Usage: npx ts-node prisma/import-postgres-data.ts <backup-filename.json>');
    process.exit(1);
}

importData(backupFile)
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
