'use client';

import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export function Navbar() {
    const { data: session } = useSession();
    const pathname = usePathname();

    const navItems = [
        { href: '/dashboard', label: 'Dashboard', icon: '📊' },
        { href: '/transactions', label: 'Transaksi', icon: '💰' },
        { href: '/reports/monthly', label: 'Laporan Bulanan', icon: '📅' },
        { href: '/reports/yearly', label: 'Laporan Tahunan', icon: '📈' },
        { href: '/audit', label: 'Audit Log', icon: '📋', viewerAllowed: true },
    ];

    // Filter menu items based on user role
    // Audit Log: visible for VIEWER and ADMIN, hidden for USER
    const filteredNavItems = navItems.filter(item => {
        if (item.viewerAllowed) {
            // Show for VIEWER and ADMIN, hide for regular USER
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
                            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                                <span className="text-white text-xl font-bold">₿</span>
                            </div>
                            <span className="text-xl font-bold text-gray-900">Laporan Keuangan</span>
                        </Link>
                    </div>

                    <div className="flex items-center gap-1">
                        {filteredNavItems.map((item) => (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`px-4 py-2 rounded-lg font-medium transition-colors ${pathname.startsWith(item.href)
                                    ? 'bg-blue-50 text-blue-700'
                                    : 'text-gray-700 hover:bg-gray-50'
                                    }`}
                            >
                                <span className="mr-2">{item.icon}</span>
                                <span className="hidden md:inline">{item.label}</span>
                            </Link>
                        ))}
                    </div>

                    <div className="flex items-center gap-4">
                        {session?.user && (
                            <>
                                <div className="text-sm text-gray-700 hidden md:block">
                                    <div className="font-medium">{session.user.name}</div>
                                    <div className="text-xs text-gray-500">{session.user.email}</div>
                                </div>
                                <button
                                    onClick={() => signOut({ callbackUrl: '/login' })}
                                    className="px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                >
                                    Keluar
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </nav>
    );
}
