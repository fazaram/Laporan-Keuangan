"use client";

import { useState, useEffect } from "react";

export function AiInsightCard() {
    const [insights, setInsights] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchInsights = async () => {
        setIsLoading(true);
        try {
            const response = await fetch('/api/ai/insight');
            const data = await response.json();
            setInsights(data.insights || []);
        } catch (error) {
            console.error('Failed to fetch AI insights:', error);
            setInsights(["Maaf, gagal memuat analisis keuangan saat ini."]);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchInsights();
    }, []);

    if (isLoading) {
        return (
            <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6 animate-pulse">
                <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
                <div className="space-y-3">
                    <div className="h-4 bg-gray-100 rounded w-full"></div>
                    <div className="h-4 bg-gray-100 rounded w-5/6"></div>
                    <div className="h-4 bg-gray-100 rounded w-4/6"></div>
                </div>
            </div>
        );
    }

    if (insights.length === 0) return null;

    return (
        <div className="relative overflow-hidden bg-gradient-to-br from-indigo-50 via-white to-blue-50 rounded-2xl shadow-lg border border-indigo-100 p-6 transition-all hover:shadow-xl group">
            {/* Background Decoration */}
            <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 transition-transform duration-500">
                <span className="text-6xl">🤖</span>
            </div>

            <div className="flex items-center gap-2 mb-4">
                <div className="flex items-center justify-center p-2 bg-indigo-500 rounded-lg text-white">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900 tracking-tight">Solvia Insights</h3>
                <div className="ml-auto">
                    <button 
                        onClick={fetchInsights}
                        className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-white rounded-full transition-all"
                        title="Perbarui Analisis"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                    </button>
                </div>
            </div>

            <div className="space-y-4">
                {insights.map((point, index) => (
                    <div key={index} className="flex gap-4 group/point">
                        <div className="flex-shrink-0 w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-xs font-bold ring-4 ring-indigo-50">
                            {index + 1}
                        </div>
                        <p className="text-sm text-gray-700 leading-relaxed font-medium group-hover/point:text-indigo-900 transition-colors">
                            {point}
                        </p>
                    </div>
                ))}
            </div>

            <div className="mt-6 pt-4 border-t border-indigo-100/50 flex items-center justify-between">
                <p className="text-[10px] text-gray-400 font-medium italic">
                    *Analisis berdasarkan data 30 hari terakhir.
                </p>
                <div className="flex -space-x-1 overflow-hidden">
                    <span className="inline-block h-4 w-4 rounded-full ring-2 ring-white bg-blue-400"></span>
                    <span className="inline-block h-4 w-4 rounded-full ring-2 ring-white bg-indigo-400"></span>
                </div>
            </div>
        </div>
    );
}
