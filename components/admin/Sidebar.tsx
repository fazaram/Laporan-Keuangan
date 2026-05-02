'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface SidebarItemProps {
    href: string;
    label: string;
    icon: React.ReactNode;
    active: boolean;
    subItems?: { href: string; label: string; active: boolean }[];
}

const SidebarItem = ({ href, label, icon, active, subItems }: SidebarItemProps) => {
    const [isOpen, setIsOpen] = useState(active);

    return (
        <div className="mb-2">
            <Link
                href={subItems ? '#' : href}
                onClick={() => subItems && setIsOpen(!isOpen)}
                className={`flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-200 group ${
                    active 
                    ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-200' 
                    : 'text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900'
                }`}
            >
                <div className="flex items-center gap-3">
                    <div className={`${active ? 'text-white' : 'text-neutral-400 group-hover:text-neutral-600'}`}>
                        {icon}
                    </div>
                    <span className="font-medium text-sm">{label}</span>
                </div>
                {subItems && (
                    <svg 
                        className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} 
                        fill="none" viewBox="0 0 24 24" stroke="currentColor"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                )}
            </Link>
            
            {subItems && isOpen && (
                <div className="mt-1 ml-9 space-y-1">
                    {subItems.map((sub) => (
                        <Link
                            key={sub.href}
                            href={sub.href}
                            className={`block px-4 py-2 text-sm rounded-lg transition-colors ${
                                sub.active 
                                ? 'text-emerald-600 font-semibold border-l-2 border-emerald-600 pl-3' 
                                : 'text-neutral-500 hover:text-neutral-900 pl-4'
                            }`}
                        >
                            {sub.label}
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
};

export function Sidebar() {
    const pathname = usePathname();

    const menuItems = [
        {
            href: '/admin/dashboard',
            label: 'Dashboard',
            icon: (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2v-4zM14 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2v-4z" />
                </svg>
            ),
            active: pathname === '/admin/dashboard'
        },
        {
            href: '/admin/users',
            label: 'Users',
            icon: (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
            ),
            active: pathname.startsWith('/admin/users'),
            subItems: [
                { href: '/admin/users', label: 'User Management', active: pathname === '/admin/users' }
            ]
        },


        {
            href: '/admin/ai',
            label: 'AI Management',
            icon: (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
            ),
            active: pathname.startsWith('/admin/ai'),
            subItems: [
                { href: '/admin/ai/usage', label: 'AI Usage', active: pathname === '/admin/ai/usage' },
                { href: '/admin/ai/logs', label: 'AI Logs', active: pathname === '/admin/ai/logs' }
            ]
        },
        {
            href: '/admin/reports',
            label: 'Reports',
            icon: (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
                </svg>
            ),
            active: pathname === '/admin/reports'
        },
        {
            href: '/admin/system',
            label: 'System',
            icon: (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
            ),
            active: pathname.startsWith('/admin/system'),
            subItems: [
                { href: '/admin/system/settings', label: 'Settings', active: pathname === '/admin/system/settings' },
                { href: '/admin/system/notifications', label: 'Notifications', active: pathname === '/admin/system/notifications' },
                { href: '/admin/system/roles', label: 'Roles & Permissions', active: pathname === '/admin/system/roles' }
            ]
        },
        {
            href: '/admin/logs/audit',
            label: 'Audit Logs',
            icon: (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            ),
            active: pathname === '/admin/logs/audit'
        }
    ];

    return (
        <aside className="fixed left-0 top-0 h-full w-64 bg-white border-r border-neutral-100 p-6 flex flex-col z-50">
            <div className="mb-10 px-4">
                <Link href="/admin/dashboard" className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center text-white font-bold text-xl">
                        S
                    </div>
                    <span className="text-xl font-bold text-neutral-900 tracking-tight">Solvia Admin</span>
                </Link>
            </div>

            <nav className="flex-1 overflow-y-auto custom-scrollbar">
                {menuItems.map((item) => (
                    <SidebarItem key={item.label} {...item} />
                ))}
            </nav>

            <div className="mt-auto pt-4 border-t border-neutral-100 overflow-hidden">
                {/* Return to Site link was removed since admin role is restricted to admin panel */}
            </div>
        </aside>
    );
}
