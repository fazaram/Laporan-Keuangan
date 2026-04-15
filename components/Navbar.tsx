'use client';

import { useState, useRef, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';

export function Navbar() {
    const { data: session } = useSession();
    const pathname = usePathname();
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const navItems = [
        { href: '/dashboard', label: 'Dashboard', icon: '📊' },
        { href: '/transactions', label: 'Transaksi', icon: '💰' },
        { href: '/goals', label: 'Tabungan', icon: '🎯' },
        { href: '/reports/monthly', label: 'Laporan Bulanan', icon: '📅' },
        { href: '/reports/yearly', label: 'Laporan Tahunan', icon: '📈' },
        { href: '/audit', label: 'Audit Log', icon: '📋', viewerAllowed: true },
    ];

    // Close dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Filter menu items based on user role
    const filteredNavItems = navItems.filter(item => {
        if (item.viewerAllowed) {
            return session?.user?.role === 'VIEWER' || session?.user?.role === 'ADMIN';
        }
        return true;
    });

    return (
        <nav className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16">
                    <div className="flex items-center">
                        <Link href="/dashboard" className="flex items-center gap-3">
                            <div className="w-10 h-10 overflow-hidden rounded-lg flex items-center justify-center">
                                <Image
                                    src="/logo.png"
                                    alt="Solvia Finance Logo"
                                    width={40}
                                    height={40}
                                    className="object-contain"
                                    priority
                                />
                            </div>
                            <span className="text-xl font-bold text-gray-900 tracking-tight">Solvia Finance</span>
                        </Link>
                    </div>

                    <div className="hidden lg:flex items-center gap-1">
                        {filteredNavItems.map((item) => (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 ${pathname.startsWith(item.href)
                                    ? 'bg-blue-50 text-blue-700'
                                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                    }`}
                            >
                                <span className="mr-2">{item.icon}</span>
                                <span>{item.label}</span>
                            </Link>
                        ))}
                    </div>

                    <div className="flex items-center gap-4">
                        {session?.user && (
                            <div className="relative" ref={dropdownRef}>
                                <button
                                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                    className="flex items-center gap-3 p-1.5 rounded-xl hover:bg-gray-100 transition-all duration-200 group"
                                >
                                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm shadow-sm ring-2 ring-white overflow-hidden">
                                        {(session.user as any).profileImage ? (
                                            <Image
                                                src={(session.user as any).profileImage}
                                                alt="Profile"
                                                width={36}
                                                height={36}
                                                className="object-cover w-full h-full"
                                            />
                                        ) : (
                                            session.user.name?.charAt(0) || 'U'
                                        )}
                                    </div>
                                    <div className="text-left hidden sm:block">
                                        <div className="text-sm font-semibold text-gray-900 leading-tight">{session.user.name}</div>
                                        <div className="text-xs text-gray-500 leading-tight">{session.user.email}</div>
                                    </div>
                                    <svg 
                                        className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} 
                                        fill="none" 
                                        stroke="currentColor" 
                                        viewBox="0 0 24 24"
                                    >
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                </button>

                                {isDropdownOpen && (
                                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-gray-100 py-2 animate-in fade-in zoom-in duration-200 origin-top-right">
                                        <div className="px-4 py-2 border-b border-gray-50 mb-1">
                                            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Menu Pengguna</p>
                                        </div>
                                        
                                        <Link
                                            href="/profile"
                                            onClick={() => setIsDropdownOpen(false)}
                                            className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-colors"
                                        >
                                            <span className="text-lg">👤</span>
                                            <div>
                                                <p className="font-semibold">Profil Saya</p>
                                                <p className="text-[10px] text-gray-500">Lihat & edit portfolio</p>
                                            </div>
                                        </Link>

                                        {session.user.role === 'ADMIN' && (
                                            <Link
                                                href="/admin/dashboard"
                                                onClick={() => setIsDropdownOpen(false)}
                                                className="flex items-center gap-3 px-4 py-2.5 text-sm text-emerald-700 hover:bg-emerald-50 transition-colors"
                                            >
                                                <span className="text-lg">🛡️</span>
                                                <div>
                                                    <p className="font-bold text-emerald-800">Admin Panel</p>
                                                    <p className="text-[10px] text-emerald-600">Sistem & Monitoring</p>
                                                </div>
                                            </Link>
                                        )}

                                        <div className="h-px bg-gray-100 my-1 mx-2"></div>

                                        <button
                                            onClick={() => signOut({ callbackUrl: '/login' })}
                                            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors text-left"
                                        >
                                            <span className="text-lg">🚪</span>
                                            <p className="font-semibold">Keluar</p>
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </nav>
    );
}
