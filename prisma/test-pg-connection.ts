import { Client } from 'pg';

async function testRawConnection() {
    console.log('🔄 Testing PostgreSQL connection with different configurations...\n');

    const configs = [
        {
            name: 'No password',
            config: {
                user: 'postgres',
                host: 'localhost',
                database: 'laporanKeuangan',
                port: 5432,
            }
        },
        {
            name: 'Empty password',
            config: {
                user: 'postgres',
                host: 'localhost',
                database: 'laporanKeuangan',
                password: '',
                port: 5432,
            }
        },
        {
            name: 'Password: root',
            config: {
                user: 'postgres',
                host: 'localhost',
                database: 'laporanKeuangan',
                password: 'root',
                port: 5432,
            }
        },
        {
            name: 'Password: postgres',
            config: {
                user: 'postgres',
                host: 'localhost',
                database: 'laporanKeuangan',
                password: 'postgres',
                port: 5432,
            }
        }
    ];

    for (const { name, config } of configs) {
        const client = new Client(config);

        try {
            console.log(`Testing: ${name}...`);
            await client.connect();
            const result = await client.query('SELECT current_database(), version()');
            console.log(`✅ SUCCESS with: ${name}`);
            console.log('Connection string:',
                config.password
                    ? `postgresql://${config.user}:${config.password}@${config.host}:${config.port}/${config.database}`
                    : `postgresql://${config.user}@${config.host}:${config.port}/${config.database}`
            );
            console.log('Database:', result.rows[0].current_database);
            await client.end();
            break;
        } catch (error: any) {
            console.log(`❌ Failed with: ${name} - ${error.message}\n`);
            try {
                await client.end();
            } catch { }
        }
    }
}

testRawConnection();
