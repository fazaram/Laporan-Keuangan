import { Client } from 'pg';

async function testLaragonPostgres() {
    console.log('🔄 Testing Laragon PostgreSQL connections...\n');

    // Common Laragon PostgreSQL configurations
    const configs = [
        {
            name: 'Laragon - No password',
            connectionString: 'postgresql://postgres@localhost:5432/laporanKeuangan'
        },
        {
            name: 'Laragon - Empty password',
            connectionString: 'postgresql://postgres:@localhost:5432/laporanKeuangan'
        },
        {
            name: 'Laragon - Password: root',
            connectionString: 'postgresql://postgres:root@localhost:5432/laporanKeuangan'
        },
        {
            name: 'Laragon - Port 5433',
            connectionString: 'postgresql://postgres@localhost:5433/laporanKeuangan'
        },
        {
            name: 'Laragon - Port 5433 + root',
            connectionString: 'postgresql://postgres:root@localhost:5433/laporanKeuangan'
        },
        {
            name: 'Trust authentication',
            connectionString: 'postgresql://postgres@localhost/laporanKeuangan'
        }
    ];

    for (const { name, connectionString } of configs) {
        const client = new Client({ connectionString });

        try {
            console.log(`Testing: ${name}...`);
            console.log(`Connection: ${connectionString}`);

            await client.connect();
            const result = await client.query('SELECT current_database(), version()');

            console.log('\n✅ ✅ ✅ SUCCESS! ✅ ✅ ✅');
            console.log(`Working configuration: ${name}`);
            console.log(`\nConnection string to use in .env:`);
            console.log(`DATABASE_URL="${connectionString}"\n`);
            console.log('Database:', result.rows[0].current_database);
            console.log('Version:', result.rows[0].version.split(',')[0]);

            await client.end();
            return;
        } catch (error: any) {
            console.log(`❌ Failed: ${error.message}\n`);
            try {
                await client.end();
            } catch { }
        }
    }

    console.log('❌ All connection attempts failed.');
    console.log('\nSuggestion: Check PostgreSQL service is running in Laragon');
}

testLaragonPostgres();
