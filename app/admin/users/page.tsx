'use client';

import React, { useEffect, useState } from 'react';
import { DataTable } from '@/components/admin/DataTable';
import { formatDate, formatDateTime } from '@/lib/utils';
import Link from 'next/link';
import { useToast } from '@/components/ToastProvider';

interface User {
    id: string;
    name: string | null;
    email: string;
    role: string;
    status: string;
    createdAt: string;
}

export default function UsersPage() {
    const { showToast, showConfirm } = useToast();
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    
    const [searchQuery, setSearchQuery] = useState('');
    const [roleFilter, setRoleFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [sortConfig, setSortConfig] = useState<{
        key: keyof User;
        direction: 'asc' | 'desc';
    }>({ key: 'createdAt', direction: 'desc' });

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            const res = await fetch('/api/admin/users');
            const data = await res.json();
            setUsers(data);
        } catch (error) {
            console.error('Failed to fetch users:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSort = (key: keyof User) => {
        let direction: 'asc' | 'desc' = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const handleUpdateStatus = async (id: string, currentStatus: string) => {
        const action = currentStatus === 'ACTIVE' ? 'suspend' : 'activate';
        const confirmed = await showConfirm({
            title: `${action === 'suspend' ? 'Suspend' : 'Activate'} User`,
            message: `Are you sure you want to ${action} this user?`,
            danger: action === 'suspend',
            confirmText: action === 'suspend' ? 'Yes, Suspend' : 'Yes, Activate'
        });
        
        if (!confirmed) return;
        
        try {
            const res = await fetch(`/api/admin/users/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: currentStatus === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE' })
            });
            if (res.ok) {
                showToast(`User ${action === 'suspend' ? 'suspended' : 'activated'}`, 'success');
                fetchUsers();
            } else {
                showToast('Failed to update user status', 'error');
            }
        } catch (error) {
            showToast('An error occurred', 'error');
        }
    };

    const handleChangeRole = async (id: string, newRole: string) => {
        const confirmed = await showConfirm({
            title: 'Change User Role',
            message: `Change user role to ${newRole}?`,
        });
        if (!confirmed) return;
        
        try {
            const res = await fetch(`/api/admin/users/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ role: newRole })
            });
            if (res.ok) {
                showToast(`Role updated to ${newRole}`, 'success');
                fetchUsers();
            } else {
                showToast('Failed to update user role', 'error');
            }
        } catch (error) {
            showToast('An error occurred', 'error');
        }
    };

    const handleDeleteUser = async (id: string) => {
        const confirmed = await showConfirm({
            title: 'Delete User',
            message: 'Are you absolutely sure you want to delete this user? This cannot be undone.',
            danger: true,
            confirmText: 'Delete Permanently'
        });
        if (!confirmed) return;
        
        try {
            const res = await fetch(`/api/admin/users/${id}`, {
                method: 'DELETE'
            });
            if (res.ok) {
                showToast('User deleted successfully', 'success');
                fetchUsers();
            } else {
                showToast('Failed to delete user', 'error');
            }
        } catch (error) {
            showToast('An error occurred', 'error');
        }
    };

    const columns = [
        {
            header: 'User',
            sortKey: 'name' as keyof User,
            accessor: (user: User) => (
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-xs">
                        {user.name?.[0] || user.email[0].toUpperCase()}
                    </div>
                    <div>
                        <p className="font-semibold text-neutral-900 leading-none">{user.name || 'N/A'}</p>
                        <p className="text-xs text-neutral-400 mt-1">{user.email}</p>
                    </div>
                </div>
            ),
        },
        {
            header: 'Role',
            sortKey: 'role' as keyof User,
            accessor: (user: User) => (
                <span className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider ${
                    user.role === 'ADMIN' ? 'bg-purple-50 text-purple-600' : 
                    user.role === 'USER' ? 'bg-blue-50 text-blue-600' : 'bg-neutral-50 text-neutral-600'
                }`}>
                    {user.role}
                </span>
            ),
        },
        {
            header: 'Status',
            sortKey: 'status' as keyof User,
            accessor: (user: User) => (
                <span className={`flex items-center gap-1.5 text-xs font-semibold ${
                    user.status === 'ACTIVE' ? 'text-emerald-600' : 'text-red-500'
                }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${
                        user.status === 'ACTIVE' ? 'bg-emerald-600 animate-pulse' : 'bg-red-500'
                    }`}></span>
                    {user.status}
                </span>
            ),
        },
        {
            header: 'Joined At',
            sortKey: 'createdAt' as keyof User,
            accessor: (user: User) => formatDateTime(user.createdAt),
        },
        {
            header: 'Actions',
            className: 'text-right',
            accessor: (user: User) => (
                <div className="flex items-center justify-end gap-2">
                    <Link 
                        href={`/admin/users/${user.id}`}
                        className="p-2 text-neutral-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                    </Link>
                    <button 
                        onClick={() => handleUpdateStatus(user.id, user.status)}
                        className={`p-2 rounded-lg transition-all ${
                            user.status === 'ACTIVE' 
                            ? 'text-neutral-400 hover:text-red-600 hover:bg-red-50' 
                            : 'text-neutral-400 hover:text-emerald-600 hover:bg-emerald-50'
                        }`}
                    >
                        {user.status === 'ACTIVE' ? (
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                            </svg>
                        ) : (
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        )}
                    </button>
                    <button 
                        onClick={() => handleDeleteUser(user.id)}
                        className="p-2 text-neutral-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                        title="Delete User"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                    </button>
                    <div className="relative group/actions">
                        <button className="p-2 text-neutral-400 hover:text-neutral-900 hover:bg-neutral-100 rounded-lg transition-all">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                            </svg>
                        </button>
                        <div className="absolute right-0 mt-1 w-40 bg-white border border-neutral-100 rounded-xl shadow-xl shadow-neutral-200/40 opacity-0 invisible group-hover/actions:opacity-100 group-hover/actions:visible transition-all z-50 p-1">
                            <button onClick={() => handleChangeRole(user.id, 'ADMIN')} className="w-full text-left px-3 py-2 text-xs font-medium text-neutral-600 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg">Make Admin</button>
                            <button onClick={() => handleChangeRole(user.id, 'USER')} className="w-full text-left px-3 py-2 text-xs font-medium text-neutral-600 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg">Make User</button>
                            <button onClick={() => handleChangeRole(user.id, 'VIEWER')} className="w-full text-left px-3 py-2 text-xs font-medium text-neutral-600 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg">Make Viewer</button>
                        </div>
                    </div>
                </div>
            ),
        },
    ];

    const filteredUsers = users
        .filter(user => {
            const matchesSearch = !searchQuery || 
                user.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                user.email.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesRole = !roleFilter || user.role === roleFilter;
            const matchesStatus = !statusFilter || user.status === statusFilter;
            return matchesSearch && matchesRole && matchesStatus;
        })
        .sort((a, b) => {
            const aValue = a[sortConfig.key] || '';
            const bValue = b[sortConfig.key] || '';
            
            if (aValue === bValue) return 0;
            
            if (sortConfig.direction === 'asc') {
                return aValue < bValue ? -1 : 1;
            } else {
                return aValue > bValue ? -1 : 1;
            }
        });

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-neutral-900 tracking-tight">User Management</h1>
                    <p className="text-neutral-500 mt-1">Manage platform access, roles, and user status.</p>
                </div>
                <div className="flex items-center gap-3">
                    <button 
                        onClick={fetchUsers}
                        className="p-2.5 text-neutral-500 hover:text-emerald-600 hover:bg-emerald-50 border border-neutral-200 rounded-xl bg-white transition-all shadow-sm"
                    >
                        <svg className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                    </button>
                </div>
            </div>

            <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-neutral-100 shadow-sm">
                    <div className="relative flex-1 max-w-sm">
                        <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-neutral-400">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </span>
                        <input 
                            type="text" 
                            placeholder="Filter users by name or email..." 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-neutral-50 border-neutral-200 rounded-xl py-2 pl-9 pr-4 text-xs focus:bg-white focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all"
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <select 
                            value={roleFilter}
                            onChange={(e) => setRoleFilter(e.target.value)}
                            className="bg-white border-neutral-200 rounded-xl py-2 px-3 text-xs font-medium focus:ring-2 focus:ring-emerald-500/10 outline-none"
                        >
                            <option value="">All Roles</option>
                            <option value="ADMIN">Admin</option>
                            <option value="USER">User</option>
                            <option value="VIEWER">Viewer</option>
                        </select>
                        <select 
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="bg-white border-neutral-200 rounded-xl py-2 px-3 text-xs font-medium focus:ring-2 focus:ring-emerald-500/10 outline-none"
                        >
                            <option value="">All Stats</option>
                            <option value="ACTIVE">Active</option>
                            <option value="SUSPENDED">Suspended</option>
                        </select>
                    </div>
                </div>

                <DataTable 
                    data={filteredUsers} 
                    columns={columns} 
                    loading={loading}
                    emptyMessage="No users found in the system."
                    onSort={handleSort}
                    sortKey={sortConfig.key}
                    sortDirection={sortConfig.direction}
                />
            </div>
        </div>
    );
}
