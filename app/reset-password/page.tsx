'use client';

import { useState, FormEvent, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { PasswordInput } from '@/components/PasswordInput';
import { resetPassword } from '@/app/actions/auth';

function ResetPasswordForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const token = searchParams.get('token');

    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [message, setMessage] = useState('');

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        
        if (!token) {
            setStatus('error');
            setMessage('Token reset tidak ditemukan.');
            return;
        }

        if (password !== confirmPassword) {
            setStatus('error');
            setMessage('Password dan Konfirmasi Password tidak cocok.');
            return;
        }

        setStatus('loading');
        
        try {
            const formData = new FormData();
            formData.append('token', token);
            formData.append('password', password);

            const res = await resetPassword(formData);
            
            if (res.error) {
                setStatus('error');
                setMessage(res.error);
            } else {
                setStatus('success');
                setMessage('Kata sandi berhasil diubah! Silakan login dengan kata sandi baru Anda.');
            }
        } catch (err) {
            setStatus('error');
            setMessage('Terjadi kesalahan yang tidak terduga.');
        }
    };

    if (!token) {
        return (
            <div className="text-center py-8">
                <div className="bg-red-50 text-red-700 p-4 rounded-xl mb-4">
                    Link reset password tidak valid atau tidak memiliki token.
                </div>
                <Link href="/forgot-password" className="text-blue-600 hover:text-blue-700 font-medium">
                    Minta link reset baru
                </Link>
            </div>
        );
    }

    if (status === 'success') {
        return (
            <div className="text-center py-4">
                <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-8 rounded-xl mb-6">
                    <svg className="w-12 h-12 mx-auto mb-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <h3 className="font-bold text-lg mb-2">Berhasil!</h3>
                    <p className="text-sm">{message}</p>
                </div>
                <Link href="/login" className="inline-block bg-blue-600 text-white font-semibold py-3 px-8 rounded-lg hover:bg-blue-700 transition">
                    Ke Halaman Login
                </Link>
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {status === 'error' && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                    {message}
                </div>
            )}

            <div>
                <PasswordInput
                    id="password"
                    label="Kata Sandi Baru"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="Min. 6 Karakter"
                    disabled={status === 'loading'}
                />
            </div>

            <div>
                <PasswordInput
                    id="confirmPassword"
                    label="Konfirmasi Kata Sandi Baru"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    placeholder="Ketik ulang kata sandi"
                    disabled={status === 'loading'}
                />
            </div>

            <button
                type="submit"
                disabled={status === 'loading' || !password || !confirmPassword}
                className="w-full bg-blue-600 text-white font-semibold py-3 px-4 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {status === 'loading' ? 'Menyimpan...' : 'Simpan Kata Sandi'}
            </button>
        </form>
    );
}

export default function ResetPasswordPage() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50 py-12 px-4">
            <div className="w-full max-w-md">
                <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
                    <div className="text-center mb-8">
                        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-500 text-white rounded-2xl mb-4">
                            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                        </div>
                        <h1 className="text-2xl font-bold text-gray-900 mb-2">Reset Password</h1>
                        <p className="text-gray-600 text-sm">Silakan masukkan kata sandi baru untuk akun Anda.</p>
                    </div>

                    <Suspense fallback={<div className="text-center">Memuat...</div>}>
                        <ResetPasswordForm />
                    </Suspense>
                </div>
            </div>
        </div>
    );
}
