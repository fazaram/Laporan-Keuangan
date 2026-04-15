'use client';

import React, { useEffect, useState } from 'react';

export default function SystemSettingsPage() {
    const [config, setConfig] = useState<any>({
        default_currency: 'IDR',
        threshold_danger: '90',
        threshold_warning: '75',
        default_categories: 'Food, Transport, Bills, Health, Entertainment'
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchConfig();
    }, []);

    const fetchConfig = async () => {
        try {
            const res = await fetch('/api/admin/system/config');
            const data = await res.json();
            if (Object.keys(data).length > 0) {
                setConfig((prev: any) => ({ ...prev, ...data }));
            }
        } catch (error) {
            console.error('Failed to fetch config:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (key: string, value: string) => {
        setSaving(true);
        try {
            await fetch('/api/admin/system/config', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ key, value }),
            });
            setConfig((prev: any) => ({ ...prev, [key]: value }));
        } catch (error) {
            console.error('Failed to save config:', error);
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="p-8 text-neutral-400">Loading system settings...</div>;

    return (
        <div className="space-y-10 max-w-4xl">
            <div>
                <h1 className="text-3xl font-bold text-neutral-900 tracking-tight">System Configuration</h1>
                <p className="text-neutral-500 mt-1">Adjust global parameters, default settings, and business logic.</p>
            </div>

            <div className="grid grid-cols-1 gap-8">
                {/* Visual Settings */}
                <div className="bg-white p-8 rounded-2xl border border-neutral-100 shadow-sm">
                    <h3 className="text-lg font-bold text-neutral-900 mb-6 flex items-center gap-2">
                        <svg className="w-5 h-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                        </svg>
                        Financial Defaults
                    </h3>
                    
                    <div className="space-y-6">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div className="flex-1">
                                <label className="block text-sm font-bold text-neutral-700">Default Currency</label>
                                <p className="text-xs text-neutral-400 mt-1">Universal currency for all reports and transactions.</p>
                            </div>
                            <div className="flex gap-2">
                                <input 
                                    type="text" 
                                    value={config.default_currency} 
                                    disabled
                                    className="bg-neutral-50 border-neutral-200 rounded-xl py-2 px-4 text-sm font-medium w-32 cursor-not-allowed opacity-60"
                                />
                                <span className="bg-emerald-50 text-emerald-600 px-3 py-2 rounded-xl text-[10px] font-black uppercase flex items-center">Locked</span>
                            </div>
                        </div>

                        <div className="pt-6 border-t border-neutral-50 flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div className="flex-1">
                                <label className="block text-sm font-bold text-neutral-700">Budget Threshold: Danger</label>
                                <p className="text-xs text-neutral-400 mt-1">Percentage of budget used to trigger RED alert.</p>
                            </div>
                            <div className="flex items-center gap-3">
                                <input 
                                    type="number" 
                                    defaultValue={config.threshold_danger} 
                                    onBlur={(e) => handleSave('threshold_danger', e.target.value)}
                                    className="bg-neutral-50 border-neutral-200 rounded-xl py-2 px-4 text-sm font-medium w-32 focus:bg-white focus:ring-2 focus:ring-emerald-500/10 outline-none transition-all"
                                />
                                <span className="text-sm font-bold text-neutral-400">%</span>
                            </div>
                        </div>

                        <div className="pt-6 border-t border-neutral-50 flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div className="flex-1">
                                <label className="block text-sm font-bold text-neutral-700">Budget Threshold: Warning</label>
                                <p className="text-xs text-neutral-400 mt-1">Percentage of budget used to trigger YELLOW alert.</p>
                            </div>
                            <div className="flex items-center gap-3">
                                <input 
                                    type="number" 
                                    defaultValue={config.threshold_warning} 
                                    onBlur={(e) => handleSave('threshold_warning', e.target.value)}
                                    className="bg-neutral-50 border-neutral-200 rounded-xl py-2 px-4 text-sm font-medium w-32 focus:bg-white focus:ring-2 focus:ring-emerald-500/10 outline-none transition-all"
                                />
                                <span className="text-sm font-bold text-neutral-400">%</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Categories */}
                <div className="bg-white p-8 rounded-2xl border border-neutral-100 shadow-sm">
                    <h3 className="text-lg font-bold text-neutral-900 mb-6 flex items-center gap-2">
                        <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                        </svg>
                        Default Categories
                    </h3>
                    <div>
                        <textarea 
                            defaultValue={config.default_categories}
                            onBlur={(e) => handleSave('default_categories', e.target.value)}
                            rows={4}
                            className="w-full bg-neutral-50 border-neutral-200 rounded-xl py-3 px-4 text-sm font-medium focus:bg-white focus:ring-2 focus:ring-emerald-500/10 outline-none transition-all"
                            placeholder="Comma separated categories..."
                        ></textarea>
                        <p className="text-[10px] text-neutral-400 mt-2 font-medium uppercase tracking-widest italic text-right">Settings are auto-saved on field blur</p>
                    </div>
                </div>

                {/* Danger Zone */}
                <div className="bg-red-50 p-8 rounded-2xl border border-red-100">
                    <h3 className="text-lg font-bold text-red-900 mb-2">Danger Zone</h3>
                    <p className="text-sm text-red-600/70 mb-6">Irreversible actions that affect the entire platform.</p>
                    <div className="flex flex-wrap gap-4">
                        <button className="px-6 py-3 bg-red-600 text-white text-xs font-bold rounded-xl hover:bg-red-700 transition-all shadow-lg shadow-red-200/50 uppercase tracking-widest">Reset System Config</button>
                    </div>
                </div>
            </div>
            
            {saving && (
                <div className="fixed bottom-8 right-8 bg-emerald-600 text-white px-4 py-2 rounded-lg text-xs font-bold shadow-xl animate-bounce">
                    Saving changes...
                </div>
            )}
        </div>
    );
}
