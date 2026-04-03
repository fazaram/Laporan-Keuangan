'use server';

import { prisma } from '@/lib/db';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import nodemailer from 'nodemailer';

export async function registerUser(formData: FormData) {
    try {
        const name = formData.get('name') as string;
        const email = formData.get('email') as string;
        const password = formData.get('password') as string;

        if (!email || !password) {
            return { error: 'Email dan password wajib diisi' };
        }

        if (password.length < 6) {
            return { error: 'Password minimal 6 karakter' };
        }

        // Cek email unique
        const existingUser = await prisma.user.findUnique({
            where: { email },
        });

        if (existingUser) {
            return { error: 'Email sudah terdaftar' };
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        await prisma.user.create({
            data: {
                name: name || null,
                email,
                password: hashedPassword,
                role: 'USER',
            },
        });

        return { success: true };
    } catch (error: any) {
        console.error('Action registerUser failed:', error);
        return { error: 'Gagal membuat pengguna baru' };
    }
}

export async function requestPasswordReset(email: string) {
    try {
        const user = await prisma.user.findUnique({
            where: { email },
        });

        if (!user) {
            // Unutk keamanan, pura-pura sukses meski email tidak ada
            return { success: true };
        }

        // Generate token and expiry
        const token = crypto.randomBytes(32).toString('hex');
        const expiry = new Date(Date.now() + 3600000); // 1 jam dari sekarang

        await prisma.user.update({
            where: { id: user.id },
            data: {
                resetToken: token,
                resetTokenExpiry: expiry,
            },
        });

        const resetUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/reset-password?token=${token}`;

        // SIMULASI EMAIL via Konsol 
        // Anda dapat mengganti ini menggunakan NodeMailer (Ethereal test / Resend)
        console.log('=============================================');
        console.log('SIMULASI EMAIL TERKIRIM KE:', email);
        console.log('Isi Email:');
        console.log(`Klik link ini untuk reset password Anda: \n${resetUrl}`);
        console.log('=============================================');

        try {
            // Simple Nodemailer Ethereal for dev
            const testAccount = await nodemailer.createTestAccount();
            const transporter = nodemailer.createTransport({
                host: "smtp.ethereal.email",
                port: 587,
                secure: false, // true for 465, false for other ports
                auth: {
                    user: testAccount.user, // generated ethereal user
                    pass: testAccount.pass, // generated ethereal password
                },
            });

            const info = await transporter.sendMail({
                from: '"Solvia Finance" <no-reply@solvia-finance.local>',
                to: email,
                subject: "Reset Password - Solvia Finance",
                html: `
                    <h2>Permintaan Reset Password</h2>
                    <p>Halo, kami menerima permintaan untuk mereset kata sandi akun Anda.</p>
                    <p>Silakan klik link di bawah ini untuk mengatur kata sandi baru (berlaku 1 jam):</p>
                    <a href="${resetUrl}" style="background:#2563eb;color:white;padding:10px 20px;text-decoration:none;border-radius:5px;display:inline-block;">Reset Password Sekarang</a>
                    <br/><br/>
                    <p>Atau URL manual: <a href="${resetUrl}">${resetUrl}</a></p>
                `,
            });
            console.log("Email Preview URL (Ethereal): %s", nodemailer.getTestMessageUrl(info));
        } catch(mailErr) {
            console.error('Nodemailer error (bisa diabaikan jika tes):', mailErr);
        }

        return { success: true };
    } catch (error) {
        console.error('Action requestPasswordReset failed:', error);
        return { error: 'Gagal memproses permintaan' };
    }
}

export async function resetPassword(formData: FormData) {
    try {
        const token = formData.get('token') as string;
        const password = formData.get('password') as string;

        if (!token || !password) {
            return { error: 'Token dan password wajib disi' };
        }

        if (password.length < 6) {
            return { error: 'Password minimal 6 karakter' };
        }

        const user = await prisma.user.findUnique({
            where: { resetToken: token },
        });

        if (!user || !user.resetTokenExpiry) {
            return { error: 'Token tidak valid' };
        }

        if (new Date() > user.resetTokenExpiry) {
            return { error: 'Token sudah kadaluarsa (expired). Silakan buat permintaan reset baru.' };
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        await prisma.user.update({
            where: { id: user.id },
            data: {
                password: hashedPassword,
                resetToken: null,
                resetTokenExpiry: null,
            },
        });

        return { success: true };
    } catch (error) {
        console.error('Action resetPassword failed:', error);
        return { error: 'Gagal mengatur ulang kata sandi' };
    }
}
