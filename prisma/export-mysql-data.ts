import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

async function exportData() {
    console.log('🔄 Starting MySQL data export...');

    try {
        // Export Users
        const users = await prisma.user.findMany();
        console.log(`✅ Found ${users.length} users`);

        // Export Transactions
        const transactions = await prisma.transaction.findMany();
        console.log(`✅ Found ${transactions.length} transactions`);

        // Export MonthlyAnalysis
        const monthlyAnalyses = await prisma.monthlyAnalysis.findMany();
        console.log(`✅ Found ${monthlyAnalyses.length} monthly analyses`);

        // Export YearlyAnalysis
        const yearlyAnalyses = await prisma.yearlyAnalysis.findMany();
        console.log(`✅ Found ${yearlyAnalyses.length} yearly analyses`);

        // Export AuditLogs
        const auditLogs = await prisma.auditLog.findMany();
        console.log(`✅ Found ${auditLogs.length} audit logs`);

        // Create backup object
        const backup = {
            exportDate: new Date().toISOString(),
            users,
            transactions,
            monthlyAnalyses,
            yearlyAnalyses,
            auditLogs,
        };

        // Save to file
        const backupDir = path.join(__dirname, 'backups');
        if (!fs.existsSync(backupDir)) {
            fs.mkdirSync(backupDir, { recursive: true });
        }

        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `mysql-backup-${timestamp}.json`;
        const filepath = path.join(backupDir, filename);

        fs.writeFileSync(filepath, JSON.stringify(backup, null, 2));

        console.log(`\n✅ Export completed successfully!`);
        console.log(`📁 Backup saved to: ${filepath}`);
        console.log(`\n📊 Summary:`);
        console.log(`   - Users: ${users.length}`);
        console.log(`   - Transactions: ${transactions.length}`);
        console.log(`   - Monthly Analyses: ${monthlyAnalyses.length}`);
        console.log(`   - Yearly Analyses: ${yearlyAnalyses.length}`);
        console.log(`   - Audit Logs: ${auditLogs.length}`);
    } catch (error) {
        console.error('❌ Error during export:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

exportData()
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
