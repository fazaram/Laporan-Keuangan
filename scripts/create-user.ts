import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import * as readline from 'readline';

const prisma = new PrismaClient();

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
});

function question(query: string): Promise<string> {
    return new Promise((resolve) => {
        rl.question(query, resolve);
    });
}

async function createUser() {
    console.log('\n👤 Create New User\n');
    console.log('='.repeat(50));

    try {
        // Get user input
        const email = await question('\n📧 Email: ');
        const password = await question('🔐 Password: ');
        const name = await question('👤 Name (optional): ');

        console.log('\n📋 Select Role:');
        console.log('1. VIEWER - Can only view data');
        console.log('2. USER - Can view and edit own data');
        console.log('3. ADMIN - Full access');

        const roleChoice = await question('\nChoice (1-3) [default: 2]: ');

        let role: 'VIEWER' | 'USER' | 'ADMIN' = 'USER';
        if (roleChoice === '1') role = 'VIEWER';
        else if (roleChoice === '3') role = 'ADMIN';

        // Validate input
        if (!email || !password) {
            console.log('\n❌ Email and password are required!');
            rl.close();
            return;
        }

        // Check if user already exists
        const existingUser = await prisma.user.findUnique({
            where: { email },
        });

        if (existingUser) {
            console.log('\n❌ User with this email already exists!');
            rl.close();
            return;
        }

        // Hash password
        console.log('\n🔄 Creating user...');
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create user
        const user = await prisma.user.create({
            data: {
                email,
                password: hashedPassword,
                name: name || null,
                role,
            },
        });

        console.log('\n✅ User created successfully!\n');
        console.log('User Details:');
        console.log(`- Email: ${user.email}`);
        console.log(`- Name: ${user.name || 'N/A'}`);
        console.log(`- Role: ${user.role}`);
        console.log(`- ID: ${user.id}`);

        console.log('\n🎉 You can now login at http://localhost:3000/login');
        console.log(`   Email: ${user.email}`);
        console.log(`   Password: [the password you entered]`);

    } catch (error) {
        console.error('\n❌ Error creating user:', error);
    } finally {
        rl.close();
        await prisma.$disconnect();
    }
}

createUser();
