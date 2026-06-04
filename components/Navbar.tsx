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
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const navItems = [
        { href: '/dashboard', label: 'Dashboard', icon: '📊' },
        { href: '/wallet', label: 'Smart Wallet', icon: '👛' },
        { 
            href: '/transactions', 
            label: 'Transaksi', 
            icon: '💰',
            subItems: [
                { href: '/transactions', label: 'All Transactions', icon: '📋' },
                { href: '/transactions', label: 'Add Transaction', icon: '➕' },
                { href: '/transactions/import-excel', label: 'Import Excel', icon: '📊' },
                { href: '/transactions/import-ocr', label: 'Import OCR (NEW)', icon: '📸' }
            ]
        },
        { href: '/goals', label: 'Tabungan', icon: '🎯' },
        { href: '/reports/monthly', label: 'Laporan Bulanan', icon: '📅' },
        { href: '/reports/yearly', label: 'Laporan Tahunan', icon: '📈' },
        { href: '/audit', label: 'Audit Log', icon: '📋', viewerAllowed: true },
    ];

    // Close dropdown and mobile menu when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Close mobile menu on route change
    useEffect(() => {
        setIsMobileMenuOpen(false);
    }, [pathname]);

    // Filter menu items based on user role
    const filteredNavItems = navItems.filter(item => {
        if (item.viewerAllowed) {
            return session?.user?.role === 'VIEWER' || session?.user?.role === 'ADMIN';
        }
        return true;
    });

    return (
        <nav className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
            <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16">
                    <div className="flex items-center">
                        {/* Mobile Menu Button */}
                        <button 
                            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                            className="lg:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors mr-2"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                {isMobileMenuOpen ? (
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                ) : (
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                                )}
                            </svg>
                        </button>

                        <Link href="/dashboard" className="flex items-center gap-2 sm:gap-3">
                            <div className="w-8 h-8 sm:w-10 sm:h-10 overflow-hidden rounded-lg flex items-center justify-center">
                                <Image
                                    src="/logo.png"
                                    alt="Solvia Finance Logo"
                                    width={40}
                                    height={40}
                                    className="object-contain"
                                    priority
                                />
                            </div>
                            <span className="text-lg sm:text-xl font-bold text-gray-900 tracking-tight whitespace-nowrap">Solvia Finance</span>
                        </Link>
                    </div>

                    {/* Desktop Navigation */}
                    <div className="hidden lg:flex items-center gap-1 xl:gap-2">
                        {filteredNavItems.map((item) => (
                            <div key={item.href} className="relative group">
                                <Link
                                    href={item.href}
                                    className={`px-3 py-2 rounded-lg font-semibold text-xs transition-all duration-200 flex items-center gap-2 whitespace-nowrap ${
                                        pathname.startsWith(item.href) && (!item.subItems || pathname === item.href)
                                        ? 'bg-blue-50 text-blue-700'
                                        : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                                    }`}
                                >
                                    <span className="text-base">{item.icon}</span>
                                    <span>{item.label}</span>
                                    {item.subItems && (
                                        <svg className="w-3 h-3 ml-1 text-gray-400 group-hover:rotate-180 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                        </svg>
                                    )}
                                </Link>
                                
                                {item.subItems && (
                                    <div className="absolute left-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-100 py-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 transform origin-top translate-y-2 group-hover:translate-y-0">
                                        {item.subItems.map((sub) => (
                                            <Link
                                                key={sub.label}
                                                href={sub.href}
                                                className="block px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 flex items-center gap-2"
                                            >
                                                <span>{sub.icon}</span>
                                                <span>{sub.label}</span>
                                            </Link>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>

                    <div className="flex items-center gap-2 sm:gap-4">
                        {session?.user && (
                            <div className="relative" ref={dropdownRef}>
                                <button
                                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                    className="flex items-center gap-2 sm:gap-3 p-1 rounded-xl hover:bg-gray-100 transition-all duration-200 group"
                                >
                                    <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-xs sm:text-sm shadow-sm ring-2 ring-white overflow-hidden">
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
                                    <div className="text-left hidden lg:block">
                                        <div className="text-sm font-semibold text-gray-900 leading-tight whitespace-nowrap">{session.user.name}</div>
                                        <div className="text-[10px] text-gray-500 leading-tight whitespace-nowrap">{session.user.email}</div>
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

            {/* Mobile Navigation Drawer */}
            {isMobileMenuOpen && (
                <div className="lg:hidden border-t border-gray-100 bg-white animate-in slide-in-from-top duration-300">
                    <div className="px-4 pt-2 pb-6 space-y-1">
                        {filteredNavItems.map((item) => (
                            <div key={item.href} className="flex flex-col">
                                <Link
                                    href={item.href}
                                    className={`flex items-center p-3 rounded-xl font-semibold text-sm transition-all ${
                                        pathname.startsWith(item.href) && (!item.subItems || pathname === item.href)
                                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-200'
                                        : 'text-gray-600 hover:bg-gray-50'
                                    }`}
                                >
                                    <span className="text-xl mr-3">{item.icon}</span>
                                    <span>{item.label}</span>
                                </Link>
                                
                                {item.subItems && (
                                    <div className="ml-10 mt-1 flex flex-col gap-1 border-l-2 border-gray-100 pl-3">
                                        {item.subItems.map(sub => (
                                            <Link
                                                key={sub.href}
                                                href={sub.href}
                                                className={`flex items-center p-2 rounded-lg text-sm transition-all ${
                                                    pathname === sub.href
                                                    ? 'text-blue-700 bg-blue-50 font-bold'
                                                    : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
                                                }`}
                                            >
                                                <span className="mr-2">{sub.icon}</span>
                                                {sub.label}
                                            </Link>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </nav>
    );
}
