'use client';

import { formatCurrency } from '@/lib/utils';
import { MoreVertical, Settings2, Plus, ArrowUpRight, Send } from 'lucide-react';
import { useState } from 'react';

interface WalletCardProps {
    wallet: {
        id: string;
        name: string;
        balance: number;
        color: string;
        icon: string | null;
    };
    onTopUp: (wallet: any) => void;
    onWithdraw: (wallet: any) => void;
    onTransfer: (wallet: any) => void;
    onEdit: (wallet: any) => void;
    onOpen: (wallet: any) => void;
}

export function WalletCard({ wallet, onTopUp, onWithdraw, onTransfer, onEdit, onOpen }: WalletCardProps) {
    const [showMenu, setShowMenu] = useState(false);

    return (
        <div 
            onClick={() => onOpen(wallet)}
            className="rounded-[2rem] p-6 shadow-sm border border-gray-100 transition-all hover:shadow-lg hover:-translate-y-1 relative group cursor-pointer"
            style={{ 
                backgroundColor: wallet.color + '15', // Ultra light version of the color
            }}
        >
            {/* Action Menu Trigger */}
            <div className="absolute right-4 top-4" onClick={(e) => e.stopPropagation()}>
                <button 
                    onClick={(e) => {
                        e.stopPropagation();
                        setShowMenu(!showMenu);
                    }}
                    className="p-1.5 hover:bg-black/5 rounded-full transition-colors text-gray-400 group-hover:text-gray-600"
                >
                    <MoreVertical size={18} />
                </button>
                
                {showMenu && (
                    <>
                        <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)}></div>
                        <div className="absolute right-0 mt-2 w-44 bg-white rounded-2xl shadow-xl border border-gray-100 z-20 overflow-hidden py-1">
                            <button 
                                onClick={() => { onTopUp(wallet); setShowMenu(false); }}
                                className="w-full px-4 py-2 text-left text-xs font-bold text-gray-700 hover:bg-gray-50 flex items-center gap-2 uppercase tracking-wider"
                            >
                                <Plus size={14} className="text-green-600" /> Top Up
                            </button>
                            <button 
                                onClick={() => { onWithdraw(wallet); setShowMenu(false); }}
                                className="w-full px-4 py-2 text-left text-xs font-bold text-gray-700 hover:bg-gray-50 flex items-center gap-2 uppercase tracking-wider"
                            >
                                <ArrowUpRight size={14} className="text-red-600" /> Withdraw
                            </button>
                            <button 
                                onClick={() => { onTransfer(wallet); setShowMenu(false); }}
                                className="w-full px-4 py-2 text-left text-xs font-bold text-gray-700 hover:bg-gray-50 flex items-center gap-2 uppercase tracking-wider"
                            >
                                <Send size={14} className="text-blue-600" /> Transfer
                            </button>
                            <div className="h-px bg-gray-100 my-1"></div>
                            <button 
                                onClick={() => { onEdit(wallet); setShowMenu(false); }}
                                className="w-full px-4 py-2 text-left text-xs font-bold text-gray-500 hover:bg-gray-50 flex items-center gap-2 uppercase tracking-wider"
                            >
                                <Settings2 size={14} /> Edit Pocket
                            </button>
                        </div>
                    </>
                )}
            </div>

            <div className="flex flex-col h-full">
                {/* Large Icon */}
                <div 
                    className="w-16 h-16 rounded-3xl flex items-center justify-center text-4xl mb-6 shadow-sm ring-4 ring-white"
                    style={{ backgroundColor: wallet.color }}
                >
                    <span className="drop-shadow-sm">{wallet.icon || '💼'}</span>
                </div>

                <div className="mt-auto">
                    <h3 className="text-xl font-bold text-gray-800 mb-1 tracking-tight leading-tight">
                        {wallet.name}
                    </h3>
                    <p className="text-lg font-extrabold text-gray-900 mb-1">
                        {formatCurrency(wallet.balance)}
                    </p>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                        Spending Pocket
                    </p>
                </div>
            </div>
        </div>
    );
}
