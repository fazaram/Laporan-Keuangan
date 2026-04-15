'use client';

import React from 'react';
import { Sidebar } from '@/components/admin/Sidebar';
import { AdminNavbar } from '@/components/admin/AdminNavbar';

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen bg-neutral-50 flex">
            {/* Sidebar - Fixed */}
            <Sidebar />

            {/* Main Content Area */}
            <div className="flex-1 ml-64 min-h-screen flex flex-col">
                <AdminNavbar />
                
                <main className="flex-1 mt-16 p-8">
                    <div className="max-w-7xl mx-auto">
                        {children}
                    </div>
                </main>
                
                <footer className="py-6 px-8 text-center text-neutral-400 text-xs border-t border-neutral-100">
                    &copy; {new Date().getFullYear()} Solvia Finance Administrative Panel. All rights reserved.
                </footer>
            </div>
        </div>
    );
}
