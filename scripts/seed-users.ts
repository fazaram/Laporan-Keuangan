import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function createDefaultUsers() {
    console.log('\n🚀 Creating Default Users\n');
    console.log('='.repeat(50));

    const defaultUsers = [
        {
            email: 'admin@example.com',
            password: 'admin123',
            name: 'Admin User',
            role: 'ADMIN' as const,
        },
        {
            email: 'user@example.com',
            password: 'user123',
            name: 'Regular User',
            role: 'USER' as const,
        },
    ];

    try {
        for (const userData of defaultUsers) {
            // Check if user exists
            const existing = await prisma.user.findUnique({
                where: { email: userData.email },
            });

            if (existing) {
                console.log(`⏭️  Skipped ${userData.email} (already exists)`);
                continue;
            }

            // Hash password
            const hashedPassword = await bcrypt.hash(userData.password, 10);

            // Create user
            const user = await prisma.user.create({
                data: {
                    email: userData.email,
                    password: hashedPassword,
                    name: userData.name,
                    role: userData.role,
                },
            });

            console.log(`✅ Created ${user.email} (${user.role})`);
        }

        console.log('\n' + '='.repeat(50));
        console.log('✅ Default users created!\n');
        console.log('Login credentials:\n');
        console.log('1. Admin Account:');
        console.log('   Email: admin@example.com');
        console.log('   Password: admin123');
        console.log('   Role: ADMIN\n');
        console.log('2. User Account:');
        console.log('   Email: user@example.com');
        console.log('   Password: user123');
        console.log('   Role: USER\n');
        console.log('You can now login at http://localhost:3000/login');

    } catch (error) {
        console.error('❌ Error creating users:', error);
    } finally {
        await prisma.$disconnect();
    }
}

createDefaultUsers();
