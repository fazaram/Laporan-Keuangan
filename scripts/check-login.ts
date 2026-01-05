import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function checkLogin() {
    console.log('\n🔍 Login Diagnostic Tool\n');
    console.log('='.repeat(50));

    try {
        // 1. Test database connection
        console.log('\n1️⃣ Testing database connection...');
        await prisma.$connect();
        console.log('✅ Database connected successfully');

        // 2. Check all users
        console.log('\n2️⃣ Checking users in database...');
        const users = await prisma.user.findMany({
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                password: true,
                createdAt: true,
            },
        });

        if (users.length === 0) {
            console.log('❌ No users found in database!');
            console.log('   You need to create a user first.');
            return;
        }

        console.log(`✅ Found ${users.length} user(s):\n`);
        users.forEach((user, index) => {
            console.log(`   User ${index + 1}:`);
            console.log(`   - Email: ${user.email}`);
            console.log(`   - Name: ${user.name || 'N/A'}`);
            console.log(`   - Role: ${user.role}`);
            console.log(`   - Password Hash: ${user.password.substring(0, 20)}...`);
            console.log(`   - Created: ${user.createdAt}`);
            console.log('');
        });

        // 3. Test password for each user
        console.log('\n3️⃣ Testing password hashing...');

        // Common test passwords
        const testPasswords = ['password', '123456', 'admin', 'user123', 'test123'];

        for (const user of users) {
            console.log(`\n   Testing user: ${user.email}`);

            // Check if password is hashed
            const isBcryptHash = user.password.startsWith('$2a$') ||
                user.password.startsWith('$2b$') ||
                user.password.startsWith('$2y$');

            if (!isBcryptHash) {
                console.log('   ❌ WARNING: Password is NOT bcrypt hashed!');
                console.log('   Password should start with $2a$, $2b$, or $2y$');
                console.log(`   Current password: ${user.password}`);
                continue;
            }

            console.log('   ✅ Password is properly bcrypt hashed');

            // Try common passwords
            console.log('   Testing common passwords...');
            for (const testPwd of testPasswords) {
                const isMatch = await bcrypt.compare(testPwd, user.password);
                if (isMatch) {
                    console.log(`   ✅ FOUND! Password is: "${testPwd}"`);
                    break;
                }
            }
        }

        // 4. Test manual login simulation
        console.log('\n\n4️⃣ Manual Login Simulation');
        console.log('='.repeat(50));

        if (users.length > 0) {
            const testUser = users[0];
            console.log(`\nAttempting login for: ${testUser.email}`);
            console.log('\nTo test login, try these steps:');
            console.log('1. Go to http://localhost:3000/login');
            console.log(`2. Email: ${testUser.email}`);
            console.log('3. Password: [try the passwords listed above]');
            console.log('\nIf none work, you may need to reset the password.');
        }

        // 5. Environment check
        console.log('\n\n5️⃣ Environment Variables Check');
        console.log('='.repeat(50));
        console.log(`DATABASE_URL: ${process.env.DATABASE_URL ? '✅ Set' : '❌ Missing'}`);
        console.log(`NEXTAUTH_SECRET: ${process.env.NEXTAUTH_SECRET ? '✅ Set' : '❌ Missing'}`);
        console.log(`NEXTAUTH_URL: ${process.env.NEXTAUTH_URL || '❌ Not set (using default)'}`);

    } catch (error) {
        console.error('\n❌ Error during diagnostic:', error);

        if (error instanceof Error) {
            if (error.message.includes('connect')) {
                console.log('\n💡 Database connection failed!');
                console.log('   Check your DATABASE_URL in .env file');
            }
        }
    } finally {
        await prisma.$disconnect();
    }
}

// Run the diagnostic
checkLogin()
    .then(() => {
        console.log('\n' + '='.repeat(50));
        console.log('✅ Diagnostic complete\n');
        process.exit(0);
    })
    .catch((error) => {
        console.error('Fatal error:', error);
        process.exit(1);
    });
