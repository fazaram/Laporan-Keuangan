'use client';

import { signIn } from 'next-auth/react';
import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { PasswordInput } from '@/components/PasswordInput';
import Link from 'next/link';

export default function LoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [errors, setErrors] = useState<{ email?: string; password?: string; general?: string }>({});
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setErrors({});
        
        // Client-side validation
        const newErrors: { email?: string; password?: string } = {};
        if (!email) newErrors.email = 'Email wajib diisi';
        if (!password) newErrors.password = 'Password wajib diisi';
        
        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        setLoading(true);

        console.log('[Login] Starting login process...');

        try {
            console.log('[Login] Calling signIn with credentials...');
            const result = await signIn('credentials', {
                email,
                password,
                redirect: false,
            });

            console.log('[Login] SignIn result:', result);

            if (result?.error) {
                console.error('[Login] SignIn error:', result.error);
                setErrors({ general: 'Email atau password salah' });
            } else if (result?.ok) {
                console.log('[Login] SignIn successful, redirecting to dashboard...');
                router.push('/dashboard');
                router.refresh();
            } else {
                console.warn('[Login] SignIn returned unexpected result:', result);
                setErrors({ general: 'Terjadi kesalahan yang tidak diketahui' });
            }
        } catch (error) {
            console.error('[Login] Exception during signIn:', error);
            setErrors({ general: 'Terjadi kesalahan. Silakan coba lagi.' });
        } finally {
            setLoading(false);
            console.log('[Login] Login process completed');
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50">
            <div className="w-full max-w-md">
                <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
                    {/* Logo/Header */}
                    <div className="text-center mb-8">
                        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl mb-4">
                            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                            </svg>
                        </div>
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">Solvia Finance</h1>
                        <p className="text-gray-600">Sistem Manajemen Keuangan Pribadi</p>
                    </div>

                    {/* Login Form */}
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
                                className={`w-full px-4 py-3 border rounded-lg transition-all outline-none ${
                                    errors.email ? 'border-red-500 focus:ring-red-500/20' : 'border-gray-300 focus:ring-blue-500'
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

                        <div className="flex flex-col gap-1">
                            <PasswordInput
                                id="password"
                                label="Password"
                                name="password"
                                value={password}
                                onChange={(e) => {
                                    setPassword(e.target.value);
                                    if (errors.password) setErrors({ ...errors, password: '' });
                                }}
                                placeholder="••••••••"
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
                            <div className="text-right mt-1">
                                <Link href="/forgot-password" className="text-sm font-medium text-blue-600 hover:text-blue-500 transition-colors">
                                    Lupa password?
                                </Link>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold py-3 px-4 rounded-lg hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? (
                                <span className="flex items-center justify-center">
                                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Memproses...
                                </span>
                            ) : (
                                'Masuk'
                            )}
                        </button>
                    </form>

                        <div className="mt-6 text-center text-sm text-gray-600">
                            Belum punya akun?{' '}
                            <Link href="/register" className="font-semibold text-blue-600 hover:text-blue-500 transition-colors">
                                Daftar Sekarang
                            </Link>
                        </div>

                </div>

                {/* Footer */}
                <p className="text-center text-sm text-gray-500 mt-8">
                    © 2026 Solvia Finance. All rights reserved.
                </p>
            </div>
        </div>
    );
}
