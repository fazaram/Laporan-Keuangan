'use client';

import React from 'react';
import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';

export function AdminNavbar() {
    const { data: session } = useSession();

    return (
        <header className="fixed top-0 right-0 left-64 h-16 bg-white border-b border-neutral-100 px-8 flex items-center justify-between z-40 bg-white/80 backdrop-blur-md">
            <div className="flex-1 max-w-xl">
                <div className="relative group">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-neutral-400 group-focus-within:text-emerald-600 transition-colors">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    </span>
                    <input 
                        type="text" 
                        placeholder="Search anything..." 
                        className="w-full bg-neutral-50 border-neutral-200 rounded-xl py-2 pl-10 pr-4 text-sm focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                    />
                </div>
            </div>

            <div className="flex items-center gap-6">
                <button className="relative text-neutral-500 hover:text-neutral-900 transition-colors">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                    </svg>
                    <span className="absolute top-0 right-0 block h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-white"></span>
                </button>

                <div className="flex items-center gap-3 pl-6 border-l border-neutral-100">
                    <div className="text-right hidden sm:block">
                        <p className="text-sm font-semibold text-neutral-900 leading-none">{session?.user?.name || 'Admin'}</p>
                        <p className="text-xs text-neutral-500 mt-1 uppercase tracking-wider font-medium">{session?.user?.role || 'ADMIN'}</p>
                    </div>
                    
                    <div className="relative group">
                        <button className="w-10 h-10 rounded-xl bg-neutral-100 border border-neutral-200 overflow-hidden hover:ring-2 hover:ring-emerald-500/20 transition-all">
                            {session?.user?.image ? (
                                <img src={session.user.image} alt="Avatar" className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center bg-emerald-50 text-emerald-600 font-bold">
                                    {session?.user?.name?.[0] || 'A'}
                                </div>
                            )}
                        </button>
                        
                        <div className="absolute right-0 mt-2 w-48 bg-white border border-neutral-100 rounded-xl shadow-xl shadow-neutral-200/50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 p-2">
                            <Link 
                                href="/profile" 
                                className="flex items-center gap-2 px-3 py-2 text-sm text-neutral-600 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                            >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                                My Profile
                            </Link>
                            <button 
                                onClick={() => signOut({ callbackUrl: '/login' })}
                                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                </svg>
                                Sign Out
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </header>
    );
}
