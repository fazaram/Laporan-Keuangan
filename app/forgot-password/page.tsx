'use client';

import { useState, FormEvent } from 'react';
import Link from 'next/link';
import { requestPasswordReset } from '@/app/actions/auth';

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState('');
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [message, setMessage] = useState('');

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setStatus('loading');
        
        try {
            const res = await requestPasswordReset(email);
            if (res.error) {
                setStatus('error');
                setMessage(res.error);
            } else {
                setStatus('success');
                setMessage('Instruksi pemulihan kata sandi telah dikirim ke email Anda. (Silakan cek konsol terminal jika dalam mode development).');
            }
        } catch (err) {
            setStatus('error');
            setMessage('Terjadi kesalahan yang tidak terduga.');
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50 py-12 px-4">
            <div className="w-full max-w-md">
                <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
                    <div className="text-center mb-8">
                        <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 text-blue-600 rounded-2xl mb-4">
                            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                            </svg>
                        </div>
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">Lupa Password?</h1>
                        <p className="text-gray-600 text-sm">Masukkan email Anda untuk menerima link reset kata sandi.</p>
                    </div>

                    {status === 'success' ? (
                        <div className="text-center">
                            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-6 rounded-xl text-sm mb-6">
                                <svg className="w-10 h-10 mx-auto mb-3 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                {message}
                            </div>
                            <Link href="/login" className="text-blue-600 font-semibold hover:text-blue-700">
                                Kembali ke halaman Login
                            </Link>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {status === 'error' && (
                                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                                    {message}
                                </div>
                            )}

                            <div>
                                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                                    Email Terdaftar
                                </label>
                                <input
                                    id="email"
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
                                    placeholder="email@example.com"
                                    disabled={status === 'loading'}
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={status === 'loading' || !email}
                                className="w-full bg-blue-600 text-white font-semibold py-3 px-4 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {status === 'loading' ? 'Memproses...' : 'Kirim Link Reset'}
                            </button>

                            <div className="text-center mt-6">
                                <Link href="/login" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">
                                    Kembali ke halaman Login
                                </Link>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}
