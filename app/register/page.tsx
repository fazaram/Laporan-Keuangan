'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/ToastProvider';
import Link from 'next/link';
import { PasswordInput } from '@/components/PasswordInput';
import { registerUser } from '@/app/actions/auth';

export default function RegisterPage() {
    const router = useRouter();
    const { showToast, showConfirm } = useToast();
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [errors, setErrors] = useState<{ name?: string; email?: string; password?: string; general?: string }>({});
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setErrors({});

        const newErrors: typeof errors = {};
        if (!name) newErrors.name = 'Nama lengkap wajib diisi';
        if (!email) newErrors.email = 'Email wajib diisi';
        if (!password) {
            newErrors.password = 'Password wajib diisi';
        } else if (password.length < 6) {
            newErrors.password = 'Password minimal 6 karakter';
        }

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        setLoading(true);

        try {
            const formData = new FormData();
            formData.append('name', name);
            formData.append('email', email);
            formData.append('password', password);

            const result = await registerUser(formData);

            if (result?.error) {
                setErrors({ general: result.error });
            } else if (result?.success) {
                showToast('Pendaftaran berhasil! Silakan login.', 'success');
                router.push('/login');
            }
        } catch (error) {
            console.error('Registration exception:', error);
            setErrors({ general: 'Terjadi kesalahan. Silakan coba lagi.' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col items-center bg-gradient-to-br from-blue-50 via-white to-purple-50 py-12 px-4 pt-12 md:pt-24">
            {/* Back Button */}
            <div className="w-full max-w-md mb-6">
                <Link
                    href="/"
                    className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-blue-600 transition-colors group"
                >
                    <div className="w-8 h-8 rounded-full bg-white shadow-sm flex items-center justify-center group-hover:bg-blue-50 transition-colors border border-slate-100">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
                        </svg>
                    </div>
                    Kembali ke Beranda
                </Link>
            </div>

            <div className="w-full max-w-md">
                <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
                    <div className="text-center mb-8">
                        <div className="inline-flex items-center justify-center w-16 h-16 overflow-hidden rounded-2xl mb-4">
                            <img src="/logo.png" alt="Solvia Finance Logo" className="w-full h-full object-cover" />
                        </div>
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">Daftar Akun Baru</h1>
                        <p className="text-gray-600">Buat akun Solvia Finance Anda</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {errors.general && (
                            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm flex items-center gap-2 animate-shake">
                                <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                {errors.general}
                            </div>
                        )}

                        <div>
                            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                                Nama Lengkap
                            </label>
                            <input
                                id="name"
                                type="text"
                                value={name}
                                onChange={(e) => {
                                    setName(e.target.value);
                                    if (errors.name) setErrors({ ...errors, name: '' });
                                }}
                                className={`w-full px-4 py-3 border rounded-lg transition-all outline-none ${errors.name ? 'border-red-500 focus:ring-red-500/20' : 'border-gray-300 focus:ring-blue-500'
                                    } focus:ring-2 focus:border-transparent`}
                                placeholder="Username"
                                disabled={loading}
                            />
                            {errors.name && (
                                <p className="mt-1.5 text-xs font-medium text-red-600 flex items-center gap-1 animate-fadeIn">
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                    </svg>
                                    {errors.name}
                                </p>
                            )}
                        </div>

                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                                Email
                            </label>
                            <input
                                id="email"
                                type="email"
                                value={email}
                                onChange={(e) => {
                                    setEmail(e.target.value);
                                    if (errors.email) setErrors({ ...errors, email: '' });
                                }}
                                className={`w-full px-4 py-3 border rounded-lg transition-all outline-none ${errors.email ? 'border-red-500 focus:ring-red-500/20' : 'border-gray-300 focus:ring-blue-500'
                                    } focus:ring-2 focus:border-transparent`}
                                placeholder="email@example.com"
                                disabled={loading}
                            />
                            {errors.email && (
                                <p className="mt-1.5 text-xs font-medium text-red-600 flex items-center gap-1 animate-fadeIn">
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                    </svg>
                                    {errors.email}
                                </p>
                            )}
                        </div>

                        <div>
                            <PasswordInput
                                id="password"
                                label="Password"
                                name="password"
                                value={password}
                                onChange={(e) => {
                                    setPassword(e.target.value);
                                    if (errors.password) setErrors({ ...errors, password: '' });
                                }}
                                placeholder="Min. 6 Karakter"
                                disabled={loading}
                                className={errors.password ? 'border-red-500 focus:ring-red-500/20' : ''}
                            />
                            {errors.password && (
                                <p className="mt-1.5 text-xs font-medium text-red-600 flex items-center gap-1 animate-fadeIn">
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                    </svg>
                                    {errors.password}
                                </p>
                            )}
                            <p className="text-[10px] text-gray-500 mt-2">Password minimal 6 karakter.</p>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold py-3 px-4 rounded-lg hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Memproses...' : 'Daftar Sekarang'}
                        </button>
                    </form>

                    <div className="mt-6 text-center text-sm text-gray-600">
                        Sudah punya akun?{' '}
                        <Link href="/login" className="font-semibold text-blue-600 hover:text-blue-500 transition-colors">
                            Masuk di sini
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
