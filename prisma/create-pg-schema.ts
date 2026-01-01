import { Client } from 'pg';

async function createSchema() {
  console.log('🔄 Creating PostgreSQL schema with explicit credentials...\n');

  const client = new Client({
    user: 'postgres',
    host: '127.0.0.1',
    database: 'laporanKeuangan',
    password: 'root',
    port: 5432,
  });

  try {
    await client.connect();
    console.log('✅ Connected to PostgreSQL\n');

    // Create enums
    console.log('Creating enums...');
    await client.query(`DO $$ BEGIN CREATE TYPE "UserRole" AS ENUM ('VIEWER', 'USER', 'ADMIN'); EXCEPTION WHEN duplicate_object THEN null; END $$;`);
    await client.query(`DO $$ BEGIN CREATE TYPE "TransactionType" AS ENUM ('INCOME', 'EXPENSE'); EXCEPTION WHEN duplicate_object THEN null; END $$;`);
    await client.query(`DO $$ BEGIN CREATE TYPE "AuditAction" AS ENUM ('CREATE', 'UPDATE', 'DELETE'); EXCEPTION WHEN duplicate_object THEN null; END $$;`);
    console.log('✅ Enums created\n');

    // Create users table
    console.log('Creating users table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        name TEXT,
        role "UserRole" NOT NULL DEFAULT 'USER',
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL
      );
    `);
    console.log('✅ users table created');

    // Create transactions table
    console.log('Creating transactions table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS transactions (
        id TEXT PRIMARY KEY,
        date TIMESTAMP(3) NOT NULL,
        category TEXT NOT NULL,
        amount DECIMAL(15, 2) NOT NULL,
        type "TransactionType" NOT NULL,
        description TEXT,
        "userId" TEXT NOT NULL,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL,
        CONSTRAINT transactions_userId_fkey FOREIGN KEY ("userId") REFERENCES users(id) ON DELETE CASCADE
      );
    `);
    await client.query(`CREATE INDEX IF NOT EXISTS transactions_userId_date_idx ON transactions("userId", date);`);
    await client.query(`CREATE INDEX IF NOT EXISTS transactions_userId_type_idx ON transactions("userId", type);`);
    console.log('✅ transactions table created');

    // Create monthly_analyses table
    console.log('Creating monthly_analyses table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS monthly_analyses (
        id TEXT PRIMARY KEY,
        year INTEGER NOT NULL,
        month INTEGER NOT NULL,
        "totalIncome" DECIMAL(15, 2) NOT NULL,
        "totalExpense" DECIMAL(15, 2) NOT NULL,
        balance DECIMAL(15, 2) NOT NULL,
        "previousMonthIncome" DECIMAL(15, 2),
        "previousMonthExpense" DECIMAL(15, 2),
        "previousMonthBalance" DECIMAL(15, 2),
        analysis TEXT,
        recommendations TEXT,
        "userId" TEXT NOT NULL,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL,
        CONSTRAINT monthly_analyses_userId_fkey FOREIGN KEY ("userId") REFERENCES users(id) ON DELETE CASCADE,
        UNIQUE ("userId", year, month)
      );
    `);
    await client.query(`CREATE INDEX IF NOT EXISTS monthly_analyses_userId_idx ON monthly_analyses("userId");`);
    console.log('✅ monthly_analyses table created');

    // Create yearly_analyses table
    console.log('Creating yearly_analyses table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS yearly_analyses (
        id TEXT PRIMARY KEY,
        year INTEGER NOT NULL,
        "totalIncome" DECIMAL(15, 2) NOT NULL,
        "totalExpense" DECIMAL(15, 2) NOT NULL,
        balance DECIMAL(15, 2) NOT NULL,
        "averageMonthlyIncome" DECIMAL(15, 2) NOT NULL,
        "averageMonthlyExpense" DECIMAL(15, 2) NOT NULL,
        "previousYearIncome" DECIMAL(15, 2),
        "previousYearExpense" DECIMAL(15, 2),
        "previousYearBalance" DECIMAL(15, 2),
        analysis TEXT,
        recommendations TEXT,
        "userId" TEXT NOT NULL,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL,
        CONSTRAINT yearly_analyses_userId_fkey FOREIGN KEY ("userId") REFERENCES users(id) ON DELETE CASCADE,
        UNIQUE ("userId", year)
      );
    `);
    await client.query(`CREATE INDEX IF NOT EXISTS yearly_analyses_userId_idx ON yearly_analyses("userId");`);
    console.log('✅ yearly_analyses table created');

    // Create audit_logs table
    console.log('Creating audit_logs table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS audit_logs (
        id TEXT PRIMARY KEY,
        "userId" TEXT NOT NULL,
        action "AuditAction" NOT NULL,
        "entityType" TEXT NOT NULL,
        "entityId" TEXT NOT NULL,
        "oldData" JSONB,
        "newData" JSONB,
        "ipAddress" TEXT,
        "userAgent" TEXT,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT audit_logs_userId_fkey FOREIGN KEY ("userId") REFERENCES users(id) ON DELETE CASCADE
      );
    `);
    await client.query(`CREATE INDEX IF NOT EXISTS audit_logs_userId_idx ON audit_logs("userId");`);
    await client.query(`CREATE INDEX IF NOT EXISTS audit_logs_entityType_entityId_idx ON audit_logs("entityType", "entityId");`);
    await client.query(`CREATE INDEX IF NOT EXISTS audit_logs_createdAt_idx ON audit_logs("createdAt");`);
    console.log('✅ audit_logs table created');

    console.log('\n✅ Schema creation completed successfully!\n');

    // Verify
    const tables = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `);

    console.log('Tables in database:');
    tables.rows.forEach(row => console.log(`  ✓ ${row.table_name}`));

    await client.end();
    console.log('\n✅ Done!');

  } catch (error: any) {
    console.error('\n❌ Error:', error.message);
    console.error('Stack:', error.stack);
    try { await client.end(); } catch {}
    process.exit(1);
  }
}

createSchema();
