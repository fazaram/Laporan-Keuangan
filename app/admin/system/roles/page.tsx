'use client';

import React from 'react';
import { useToast } from '@/components/ToastProvider';

const roles = [
    {
        name: 'ADMIN',
        description: 'Full system access, including financial monitoring, user management, and system settings.',
        permissions: ['READ_ALL', 'WRITE_ALL', 'MANAGE_USERS', 'MANAGE_SYSTEM', 'BROADCAST'],
        color: 'bg-purple-50 text-purple-600',
        borderColor: 'border-purple-100'
    },
    {
        name: 'USER',
        description: 'Standard access for personal finance management. Can manage own data only.',
        permissions: ['READ_OWN', 'WRITE_OWN', 'USE_AI'],
        color: 'bg-blue-50 text-blue-600',
        borderColor: 'border-blue-100'
    },
    {
        name: 'VIEWER',
        description: 'Read-only access to all financial data. Typically used for auditing or family oversight.',
        permissions: ['READ_ALL'],
        color: 'bg-neutral-50 text-neutral-600',
        borderColor: 'border-neutral-100'
    }
];

export default function RolesPermissionsPage() {
    const { showToast } = useToast();
    return (
        <div className="space-y-10">
            <div>
                <h1 className="text-3xl font-bold text-neutral-900 tracking-tight">Roles & Permissions</h1>
                <p className="text-neutral-500 mt-1">Define access levels and system capabilities for different user types.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {roles.map((role) => (
                    <div key={role.name} className={`bg-white p-8 rounded-2xl border ${role.borderColor} shadow-sm flex flex-col hover:shadow-xl transition-all duration-300`}>
                        <div className="mb-6">
                            <span className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest ${role.color}`}>
                                {role.name}
                            </span>
                        </div>
                        
                        <div className="flex-1">
                            <h3 className="text-lg font-bold text-neutral-900 mb-2">{role.name} Role</h3>
                            <p className="text-sm text-neutral-500 leading-relaxed">{role.description}</p>
                        </div>
                        
                        <div className="mt-8 space-y-3">
                            <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">Capabilties</p>
                            <div className="flex flex-wrap gap-2">
                                {role.permissions.map((p) => (
                                    <span key={p} className="px-2 py-1 bg-neutral-50 text-neutral-600 text-[10px] font-bold rounded-lg border border-neutral-100">
                                        {p.replace('_', ' ')}
                                    </span>
                                ))}
                            </div>
                        </div>

                        <button 
                            onClick={() => showToast('Fitur Enterprise: Role scope management segera hadir.', 'info')}
                            className="mt-8 w-full py-3 bg-neutral-900 text-white text-[10px] font-black rounded-xl hover:bg-neutral-800 transition-all uppercase tracking-[0.2em]"
                        >
                            Manage Scope
                        </button>
                    </div>
                ))}

                <div 
                    onClick={() => showToast('Fitur Enterprise: Pembuatan role custom saat ini terkunci.', 'info')}
                    className="bg-neutral-50 p-8 rounded-2xl border border-dashed border-neutral-200 flex flex-col items-center justify-center text-center group cursor-pointer hover:border-emerald-300 transition-all"
                >
                    <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-neutral-400 group-hover:text-emerald-500 shadow-sm transition-all mb-4">
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                    </div>
                    <h3 className="text-sm font-bold text-neutral-500 group-hover:text-neutral-900">Create Custom Role</h3>
                    <p className="text-[10px] text-neutral-400 mt-1 uppercase tracking-widest">Enterprise Feature</p>
                </div>
            </div>

            <div className="bg-white p-8 rounded-2xl border border-neutral-100 shadow-sm overflow-hidden relative">
                <div className="flex flex-col md:flex-row items-center justify-between gap-8">
                    <div className="flex-1">
                        <h3 className="text-xl font-bold text-neutral-900">Permission Matrix</h3>
                        <p className="text-sm text-neutral-500 mt-2">A detailed breakdown of which roles can perform specific actions in the system.</p>
                        <div className="mt-6 flex flex-wrap gap-4">
                            <div className="flex items-center gap-2">
                                <span className="w-3 h-3 bg-emerald-500 rounded-full"></span>
                                <span className="text-xs font-bold text-neutral-600 uppercase tracking-widest">Full Access</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="w-3 h-3 bg-blue-500 rounded-full"></span>
                                <span className="text-xs font-bold text-neutral-600 uppercase tracking-widest">Read Only</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="w-3 h-3 bg-neutral-200 rounded-full"></span>
                                <span className="text-xs font-bold text-neutral-400 uppercase tracking-widest">No Access</span>
                            </div>
                        </div>
                    </div>
                    <div className="relative w-64 h-64 opacity-20 hover:opacity-100 transition-opacity duration-500 grayscale hover:grayscale-0">
                         <div className="absolute inset-0 bg-gradient-to-br from-emerald-500 to-blue-500 rounded-full blur-3xl"></div>
                         <div className="relative h-full flex items-center justify-center text-8xl">🔐</div>
                    </div>
                </div>
            </div>
        </div>
    );
}
