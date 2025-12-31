import { prisma } from '../lib/db';
import bcrypt from 'bcryptjs';

/**
 * Script to fix user passwords
 * This will delete and recreate users with correct passwords
 */

async function fixUsers() {
    try {
        console.log('🔧 Fixing user accounts...\n');

        // Delete existing users
        await prisma.user.deleteMany({
            where: {
                OR: [
                    { email: 'admin@laporan.com' },
                    { email: 'viewer@laporan.com' }
                ]
            }
        });
        console.log('✅ Deleted old users\n');

        // Create admin user
        const adminPassword = await bcrypt.hash('admin123', 10);
        const admin = await prisma.user.create({
            data: {
                email: 'admin@laporan.com',
                password: adminPassword,
                name: 'Administrator',
                role: 'ADMIN',
            },
        });
        console.log(`✅ Created ADMIN user`);
        console.log(`   Email: ${admin.email}`);
        console.log(`   Password: admin123`);
        console.log(`   Role: ${admin.role}\n`);

        // Create viewer user
        const viewerPassword = await bcrypt.hash('viewer123', 10);
        const viewer = await prisma.user.create({
            data: {
                email: 'viewer@laporan.com',
                password: viewerPassword,
                name: 'View Only User',
                role: 'VIEWER',
            },
        });
        console.log(`✅ Created VIEWER user`);
        console.log(`   Email: ${viewer.email}`);
        console.log(`   Password: viewer123`);
        console.log(`   Role: ${viewer.role}\n`);

        // Create regular user
        const userPassword = await bcrypt.hash('user123', 10);
        const user = await prisma.user.create({
            data: {
                email: 'user@laporan.com',
                password: userPassword,
                name: 'Regular User',
                role: 'USER',
            },
        });
        console.log(`✅ Created USER user`);
        console.log(`   Email: ${user.email}`);
        console.log(`   Password: user123`);
        console.log(`   Role: ${user.role}\n`);

        console.log('🎉 All users fixed successfully!');
        console.log('\n📋 Summary:');
        console.log('1. ADMIN   - admin@laporan.com   / admin123   (Full access)');
        console.log('2. VIEWER  - viewer@laporan.com  / viewer123  (Read only)');
        console.log('3. USER    - user@laporan.com    / user123    (CRUD own data)');

    } catch (error) {
        console.error('❌ Error fixing users:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

fixUsers().catch((error) => {
    console.error(error);
    process.exit(1);
});
