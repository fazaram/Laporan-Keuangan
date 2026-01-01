import { Client } from 'pg';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Use DIRECT_URL for data import (not pooler)
const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL;

if (!connectionString) {
    console.error('❌ DATABASE_URL or DIRECT_URL not found in .env');
    process.exit(1);
}

const pgClient = new Client({ connectionString });

async function importToSupabase(backupFile: string) {
    console.log('🔄 Starting Supabase data import...\n');
    console.log('📡 Connecting to Supabase...');

    try {
        await pgClient.connect();
        console.log('✅ Connected to Supabase PostgreSQL\n');

        // Read backup file
        const filepath = path.join(__dirname, 'backups', backupFile);
        if (!fs.existsSync(filepath)) {
            throw new Error(`Backup file not found: ${filepath}`);
        }

        const backupData = JSON.parse(fs.readFileSync(filepath, 'utf-8'));
        console.log(`📁 Loading backup from: ${backupData.exportDate}\n`);

        // Import Users
        console.log(`🔄 Importing ${backupData.users.length} users...`);
        for (const user of backupData.users) {
            await pgClient.query(
                `INSERT INTO users (id, email, password, name, role, "createdAt", "updatedAt")
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT (id) DO NOTHING`,
                [user.id, user.email, user.password, user.name, user.role, user.createdAt, user.updatedAt]
            );
        }
        console.log(`✅ ${backupData.users.length} users imported\n`);

        // Import Transactions
        console.log(`🔄 Importing ${backupData.transactions.length} transactions...`);
        for (const transaction of backupData.transactions) {
            await pgClient.query(
                `INSERT INTO transactions (id, date, category, amount, type, description, "userId", "createdAt", "updatedAt")
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         ON CONFLICT (id) DO NOTHING`,
                [
                    transaction.id,
                    transaction.date,
                    transaction.category,
                    transaction.amount,
                    transaction.type,
                    transaction.description,
                    transaction.userId,
                    transaction.createdAt,
                    transaction.updatedAt
                ]
            );
        }
        console.log(`✅ ${backupData.transactions.length} transactions imported\n`);

        // Import MonthlyAnalyses
        console.log(`🔄 Importing ${backupData.monthlyAnalyses.length} monthly analyses...`);
        for (const analysis of backupData.monthlyAnalyses) {
            await pgClient.query(
                `INSERT INTO monthly_analyses (id, year, month, "totalIncome", "totalExpense", balance, 
          "previousMonthIncome", "previousMonthExpense", "previousMonthBalance", 
          analysis, recommendations, "userId", "createdAt", "updatedAt")
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
         ON CONFLICT (id) DO NOTHING`,
                [
                    analysis.id, analysis.year, analysis.month,
                    analysis.totalIncome, analysis.totalExpense, analysis.balance,
                    analysis.previousMonthIncome, analysis.previousMonthExpense, analysis.previousMonthBalance,
                    analysis.analysis, analysis.recommendations, analysis.userId,
                    analysis.createdAt, analysis.updatedAt
                ]
            );
        }
        console.log(`✅ ${backupData.monthlyAnalyses.length} monthly analyses imported\n`);

        // Import YearlyAnalyses
        console.log(`🔄 Importing ${backupData.yearlyAnalyses.length} yearly analyses...`);
        for (const analysis of backupData.yearlyAnalyses) {
            await pgClient.query(
                `INSERT INTO yearly_analyses (id, year, "totalIncome", "totalExpense", balance,
          "averageMonthlyIncome", "averageMonthlyExpense",
          "previousYearIncome", "previousYearExpense", "previousYearBalance",
          analysis, recommendations, "userId", "createdAt", "updatedAt")
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
         ON CONFLICT (id) DO NOTHING`,
                [
                    analysis.id, analysis.year,
                    analysis.totalIncome, analysis.totalExpense, analysis.balance,
                    analysis.averageMonthlyIncome, analysis.averageMonthlyExpense,
                    analysis.previousYearIncome, analysis.previousYearExpense, analysis.previousYearBalance,
                    analysis.analysis, analysis.recommendations, analysis.userId,
                    analysis.createdAt, analysis.updatedAt
                ]
            );
        }
        console.log(`✅ ${backupData.yearlyAnalyses.length} yearly analyses imported\n`);

        // Import AuditLogs
        console.log(`🔄 Importing ${backupData.auditLogs.length} audit logs...`);
        for (const log of backupData.auditLogs) {
            await pgClient.query(
                `INSERT INTO audit_logs (id, "userId", action, "entityType", "entityId",
          "oldData", "newData", "ipAddress", "userAgent", "createdAt")
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
         ON CONFLICT (id) DO NOTHING`,
                [
                    log.id, log.userId, log.action, log.entityType, log.entityId,
                    log.oldData, log.newData, log.ipAddress, log.userAgent, log.createdAt
                ]
            );
        }
        console.log(`✅ ${backupData.auditLogs.length} audit logs imported\n`);

        console.log(`✅✅✅ Supabase import completed successfully!\n`);
        console.log(`📊 Summary:`);
        console.log(`   - Users: ${backupData.users.length}`);
        console.log(`   - Transactions: ${backupData.transactions.length}`);
        console.log(`   - Monthly Analyses: ${backupData.monthlyAnalyses.length}`);
        console.log(`   - Yearly Analyses: ${backupData.yearlyAnalyses.length}`);
        console.log(`   - Audit Logs: ${backupData.auditLogs.length}`);

        console.log(`\n🎉 Data berhasil di-import ke Supabase!`);
    } catch (error) {
        console.error('❌ Error during import:', error);
        throw error;
    } finally {
        await pgClient.end();
    }
}

// Get backup filename from command line argument
const backupFile = process.argv[2];
if (!backupFile) {
    console.error('❌ Please provide backup filename as argument');
    console.log('Usage: npx tsx prisma/import-supabase.ts <backup-filename.json>');
    process.exit(1);
}

importToSupabase(backupFile)
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
