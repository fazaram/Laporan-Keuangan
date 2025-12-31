import { CategorySummary } from '@/types';

interface AnalysisData {
    totalIncome: number;
    totalExpense: number;
    balance: number;
    previousIncome?: number;
    previousExpense?: number;
    previousBalance?: number;
    incomeByCategory: CategorySummary[];
    expenseByCategory: CategorySummary[];
}

export class FinancialAnalyzer {
    /**
     * Generate comprehensive financial analysis for monthly reports
     */
    static generateMonthlyAnalysis(data: AnalysisData, month: number, year: number): string {
        const {
            totalIncome,
            totalExpense,
            balance,
            previousIncome = 0,
            previousExpense = 0,
            previousBalance = 0,
            expenseByCategory,
        } = data;

        const incomeChange = previousIncome > 0 ? ((totalIncome - previousIncome) / previousIncome) * 100 : 0;
        const expenseChange = previousExpense > 0 ? ((totalExpense - previousExpense) / previousExpense) * 100 : 0;
        const balanceStatus = balance > 0 ? 'surplus' : balance < 0 ? 'defisit' : 'seimbang';

        const monthNames = [
            'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
            'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
        ];

        let analysis = `📊 Analisis Keuangan ${monthNames[month - 1]} ${year}\n\n`;

        // Overall  Status
        analysis += `Status Keuangan: Bulan ini Anda mengalami ${balanceStatus} sebesar Rp ${Math.abs(balance).toLocaleString('id-ID')}. `;

        if (balance > 0) {
            const savingsRate = (balance / totalIncome) * 100;
            analysis += `Tingkat tabungan Anda mencapai ${savingsRate.toFixed(1)}% dari total pendapatan.\n\n`;
        } else if (balance < 0) {
            analysis += `Pengeluaran melebihi pendapatan, perlu perhatian khusus.\n\n`;
        } else {
            analysis += `Pendapatan dan pengeluaran berimbang.\n\n`;
        }

        // Income Analysis
        if (previousIncome > 0) {
            if (incomeChange > 5) {
                analysis += `📈 Pendapatan: Mengalami peningkatan signifikan sebesar ${incomeChange.toFixed(1)}% dibanding bulan sebelumnya. Ini menunjukkan tren positif dalam perolehan pendapatan.\n\n`;
            } else if (incomeChange < -5) {
                analysis += `📉 Pendapatan: Terjadi penurunan sebesar ${Math.abs(incomeChange).toFixed(1)}% dibanding bulan sebelumnya. Perlu evaluasi sumber pendapatan.\n\n`;
            } else {
                analysis += `➡️ Pendapatan: Relatif stabil dengan perubahan ${incomeChange.toFixed(1)}% dibanding bulan sebelumnya.\n\n`;
            }
        }

        // Expense Analysis
        if (previousExpense > 0) {
            if (expenseChange > 10) {
                analysis += `⚠️ Pengeluaran: Meningkat drastis sebesar ${expenseChange.toFixed(1)}% dibanding bulan sebelumnya. Evaluasi kategori pengeluaran diperlukan.\n\n`;
            } else if (expenseChange < -10) {
                analysis += `✅ Pengeluaran: Berhasil ditekan sebesar ${Math.abs(expenseChange).toFixed(1)}% dibanding bulan sebelumnya. Manajemen keuangan yang baik!\n\n`;
            } else {
                analysis += `➡️ Pengeluaran: Relatif konsisten dengan perubahan ${expenseChange.toFixed(1)}% dibanding bulan sebelumnya.\n\n`;
            }
        }

        // Top Expense Categories
        if (expenseByCategory.length > 0) {
            const topExpenses = expenseByCategory.slice(0, 3);
            analysis += `💰 Kategori Pengeluaran Terbesar:\n`;
            topExpenses.forEach((cat, idx) => {
                analysis += `${idx + 1}. ${cat.category}: Rp ${cat.amount.toLocaleString('id-ID')} (${cat.percentage.toFixed(1)}%)\n`;
            });
            analysis += '\n';
        }

        // Expense to Income Ratio
        const expenseRatio = (totalExpense / totalIncome) * 100;
        if (expenseRatio < 50) {
            analysis += `🎯 Rasio Pengeluaran: Sangat baik! Anda hanya menggunakan ${expenseRatio.toFixed(1)}% dari pendapatan untuk pengeluaran.\n`;
        } else if (expenseRatio < 80) {
            analysis += `👌 Rasio Pengeluaran: Cukup baik dengan ${expenseRatio.toFixed(1)}% dari pendapatan digunakan untuk pengeluaran.\n`;
        } else if (expenseRatio < 100) {
            analysis += `⚠️ Rasio Pengeluaran: Perlu hati-hati! ${expenseRatio.toFixed(1)}% pendapatan terpakai untuk pengeluaran.\n`;
        } else {
            analysis += `🚨 Rasio Pengeluaran: Kritis! Pengeluaran mencapai ${expenseRatio.toFixed(1)}% dari pendapatan.\n`;
        }

        return analysis;
    }

    /**
     * Generate strategic recommendations for monthly reports
     */
    static generateMonthlyRecommendations(data: AnalysisData): string[] {
        const {
            totalIncome,
            totalExpense,
            balance,
            previousIncome = 0,
            previousExpense = 0,
            expenseByCategory,
        } = data;

        const recommendations: string[] = [];
        const expenseRatio = (totalExpense / totalIncome) * 100;
        const incomeChange = previousIncome > 0 ? ((totalIncome - previousIncome) / previousIncome) * 100 : 0;
        const expenseChange = previousExpense > 0 ? ((totalExpense - previousExpense) / previousExpense) * 100 : 0;

        // Income-based recommendations
        if (incomeChange < -10) {
            recommendations.push('Fokuskan upaya untuk meningkatkan sumber pendapatan. Pertimbangkan untuk mencari peluang tambahan seperti freelance atau investasi pendapatan pasif.');
        } else if (incomeChange < 0) {
            recommendations.push('Pendapatan mengalami sedikit penurunan. Evaluasi strategi bisnis atau karir untuk mempertahankan tingkat pendapatan.');
        }

        // Expense-based recommendations
        if (balance < 0) {
            recommendations.push('Segera kurangi pengeluaran non-esensial dan buat budget ketat untuk bulan berikutnya. Prioritaskan kebutuhan dasar.');
            recommendations.push('Pertimbangkan untuk menunda pembelian besar dan fokus pada stabilisasi keuangan terlebih dahulu.');
        } else if (expenseRatio > 90) {
            recommendations.push('Pengeluaran terlalu tinggi. Identifikasi pos-pos yang bisa dikurangi minimal 20% untuk meningkatkan tabungan.');
        } else if (expenseRatio > 70) {
            recommendations.push('Tingkatkan kontrol pengeluaran untuk mencapai rasio ideal 50-70%. Buat anggaran detail per kategori.');
        }

        if (expenseChange > 15) {
            recommendations.push('Pengeluaran meningkat signifikan. Lakukan audit menyeluruh terhadap semua kategori pengeluaran dan eliminasi yang tidak perlu.');
        }

        // Category-specific recommendations
        if (expenseByCategory.length > 0) {
            const topExpense = expenseByCategory[0];
            if (topExpense.percentage > 40) {
                recommendations.push(`Kategori "${topExpense.category}" mendominasi ${topExpense.percentage.toFixed(1)}% pengeluaran. Cari cara untuk mengoptimalkan atau mengurangi biaya di kategori ini.`);
            }
        }

        // Savings recommendations
        if (balance > 0) {
            const savingsRate = (balance / totalIncome) * 100;
            if (savingsRate < 10) {
                recommendations.push('Tingkatkan tabungan hingga minimal 20% dari pendapatan. Otomatiskan transfer ke rekening tabungan setiap terima pendapatan.');
            } else if (savingsRate >= 20 && savingsRate < 30) {
                recommendations.push('Tabungan sudah cukup baik. Pertimbangkan untuk mengalokasikan sebagian ke investasi jangka panjang.');
            } else if (savingsRate >= 30) {
                recommendations.push('Excellent! Tingkat tabungan sangat baik. Diversifikasikan ke instrumen investasi untuk pertumbuhan optimal.');
            }
        }

        // Growth recommendations
        if (balance > totalIncome * 0.3) {
            recommendations.push('Surplus keuangan yang baik! Ini waktu yang tepat untuk memulai atau menambah investasi dalam portofolio Anda.');
        }

        // Default recommendation if none generated
        if (recommendations.length === 0) {
            recommendations.push('Pertahankan pola keuangan yang sehat. Terus pantau dan evaluasi budget secara berkala.');
            recommendations.push('Siapkan dana darurat minimal 3-6 bulan pengeluaran untuk antisipasi situasi tak terduga.');
        }

        return recommendations;
    }

    /**
     * Generate comprehensive yearly analysis
     */
    static generateYearlyAnalysis(data: AnalysisData & { monthlyData: any[] }, year: number): string {
        const {
            totalIncome,
            totalExpense,
            balance,
            previousIncome = 0,
            previousExpense = 0,
            monthlyData,
            incomeByCategory,
            expenseByCategory,
        } = data;

        const incomeChange = previousIncome > 0 ? ((totalIncome - previousIncome) / previousIncome) * 100 : 0;
        const expenseChange = previousExpense > 0 ? ((totalExpense - previousExpense) / previousExpense) * 100 : 0;
        const avgMonthlyIncome = totalIncome / 12;
        const avgMonthlyExpense = totalExpense / 12;

        let analysis = `📊 Analisis Keuangan Tahunan ${year}\n\n`;

        // Overall Performance
        analysis += `=== RINGKASAN KINERJA TAHUNAN ===\n\n`;
        analysis += `Total Pendapatan: Rp ${totalIncome.toLocaleString('id-ID')}\n`;
        analysis += `Total Pengeluaran: Rp ${totalExpense.toLocaleString('id-ID')}\n`;
        analysis += `Surplus/Defisit: Rp ${balance.toLocaleString('id-ID')}\n`;
        analysis += `Rata-rata Bulanan: Rp ${avgMonthlyIncome.toLocaleString('id-ID')} (pendapatan) / Rp ${avgMonthlyExpense.toLocaleString('id-ID')} (pengeluaran)\n\n`;

        // Year-over-Year Comparison
        if (previousIncome > 0) {
            analysis += `=== PERBANDINGAN TAHUN KE TAHUN (YoY) ===\n\n`;

            if (incomeChange > 0) {
                analysis += `📈 Pendapatan naik ${incomeChange.toFixed(1)}% dibanding tahun sebelumnya (+Rp ${(totalIncome - previousIncome).toLocaleString('id-ID')})\n`;
            } else if (incomeChange < 0) {
                analysis += `📉 Pendapatan turun ${Math.abs(incomeChange).toFixed(1)}% dibanding tahun sebelumnya (-Rp ${(previousIncome - totalIncome).toLocaleString('id-ID')})\n`;
            }

            if (expenseChange > 0) {
                analysis += `📈 Pengeluaran naik ${expenseChange.toFixed(1)}% dibanding tahun sebelumnya (+Rp ${(totalExpense - previousExpense).toLocaleString('id-ID')})\n`;
            } else if (expenseChange < 0) {
                analysis += `📉 Pengeluaran turun ${Math.abs(expenseChange).toFixed(1)}% dibanding tahun sebelumnya (-Rp ${(previousExpense - totalExpense).toLocaleString('id-ID')})\n`;
            }
            analysis += '\n';
        }

        // Trend Analysis
        if (monthlyData && monthlyData.length >= 6) {
            const firstHalf = monthlyData.slice(0, 6);
            const secondHalf = monthlyData.slice(6, 12);

            const firstHalfIncome = firstHalf.reduce((sum, m) => sum + m.income, 0);
            const secondHalfIncome = secondHalf.reduce((sum, m) => sum + m.income, 0);
            const firstHalfExpense = firstHalf.reduce((sum, m) => sum + m.expense, 0);
            const secondHalfExpense = secondHalf.reduce((sum, m) => sum + m.expense, 0);

            analysis += `=== TREN SEMESTER ===\n\n`;

            const incomeGrowth = ((secondHalfIncome - firstHalfIncome) / firstHalfIncome) * 100;
            if (incomeGrowth > 5) {
                analysis += `✅ Pendapatan semester 2 lebih tinggi ${incomeGrowth.toFixed(1)}% dari semester 1. Tren positif!\n`;
            } else if (incomeGrowth < -5) {
                analysis += `⚠️ Pendapatan semester 2 lebih rendah ${Math.abs(incomeGrowth).toFixed(1)}% dari semester 1.\n`;
            } else {
                analysis += `➡️ Pendapatan relatif stabil sepanjang tahun.\n`;
            }

            const expenseGrowth = ((secondHalfExpense - firstHalfExpense) / firstHalfExpense) * 100;
            if (expenseGrowth > 10) {
                analysis += `⚠️ Pengeluaran semester 2 meningkat ${expenseGrowth.toFixed(1)}% dari semester 1.\n`;
            } else if (expenseGrowth < -10) {
                analysis += `✅ Pengeluaran semester 2 berhasil ditekan ${Math.abs(expenseGrowth).toFixed(1)}% dari semester 1.\n`;
            } else {
                analysis += `➡️ Pengeluaran relatif konsisten sepanjang tahun.\n`;
            }
            analysis += '\n';
        }

        // Top Categories
        if (incomeByCategory.length > 0) {
            analysis += `=== SUMBER PENDAPATAN UTAMA ===\n\n`;
            incomeByCategory.slice(0, 5).forEach((cat, idx) => {
                analysis += `${idx + 1}. ${cat.category}: Rp ${cat.amount.toLocaleString('id-ID')} (${cat.percentage.toFixed(1)}%)\n`;
            });
            analysis += '\n';
        }

        if (expenseByCategory.length > 0) {
            analysis += `=== KATEGORI PENGELUARAN TERBESAR ===\n\n`;
            expenseByCategory.slice(0, 5).forEach((cat, idx) => {
                analysis += `${idx + 1}. ${cat.category}: Rp ${cat.amount.toLocaleString('id-ID')} (${cat.percentage.toFixed(1)}%)\n`;
            });
            analysis += '\n';
        }

        // Financial Health Score
        const savingsRate = (balance / totalIncome) * 100;
        analysis += `=== SKOR KESEHATAN KEUANGAN ===\n\n`;

        if (savingsRate >= 30) {
            analysis += `🏆 EXCELLENT (${savingsRate.toFixed(1)}%) - Manajemen keuangan sangat baik!\n`;
        } else if (savingsRate >= 20) {
            analysis += `✅ BAIK (${savingsRate.toFixed(1)}%) - Keuangan dalam kondisi sehat.\n`;
        } else if (savingsRate >= 10) {
            analysis += `👌 CUKUP (${savingsRate.toFixed(1)}%) - Ada ruang untuk perbaikan.\n`;
        } else if (savingsRate > 0) {
            analysis += `⚠️ PERLU PERBAIKAN (${savingsRate.toFixed(1)}%) - Tingkatkan manajemen keuangan.\n`;
        } else {
            analysis += `🚨 KRITIS - Pengeluaran melebihi pendapatan, perlu tindakan segera.\n`;
        }

        return analysis;
    }

    /**
     * Generate strategic yearly recommendations
     */
    static generateYearlyRecommendations(data: AnalysisData & { monthlyData: any[] }): string[] {
        const {
            totalIncome,
            totalExpense,
            balance,
            previousIncome = 0,
            previousExpense = 0,
            monthlyData,
            expenseByCategory,
        } = data;

        const recommendations: string[] = [];
        const savingsRate = (balance / totalIncome) * 100;
        const incomeChange = previousIncome > 0 ? ((totalIncome - previousIncome) / previousIncome) * 100 : 0;

        // Strategic Growth Recommendations
        recommendations.push('📈 STRATEGI PERTUMBUHAN:');

        if (incomeChange < 0) {
            recommendations.push('• Diversifikasi sumber pendapatan untuk mengurangi risiko. Pertimbangkan 2-3 aliran pendapatan berbeda.');
            recommendations.push('• Investasikan dalam pengembangan skill yang dapat meningkatkan nilai pasar Anda.');
        } else if (incomeChange > 20) {
            recommendations.push('• Pertahankan momentum pertumbuhan pendapatan. Reinvestasikan sebagian profit untuk ekspansi lebih lanjut.');
            recommendations.push('• Dokumentasikan strategi yang berhasil untuk replikasi di tahun mendatang.');
        } else {
            recommendations.push('• Targetkan pertumbuhan pendapatan 15-25% untuk tahun depan dengan strategi yang terukur.');
            recommendations.push('• Eksplorasi peluang passive income untuk stabilitas jangka panjang.');
        }

        // Expense Optimization
        recommendations.push('\n💰 OPTIMASI PENGELUARAN:');

        if (expenseByCategory.length > 0) {
            const topExpense = expenseByCategory[0];
            recommendations.push(`• Review mendalam kategori "${topExpense.category}" yang menyumbang ${topExpense.percentage.toFixed(1)}% total pengeluaran tahunan.`);
        }

        recommendations.push('• Lakukan audit tahunan untuk eliminasi langganan atau biaya berulang yang tidak terpakai.');
        recommendations.push('• Terapkan prinsip 50/30/20: 50% kebutuhan, 30% keinginan, 20% tabungan & investasi.');

        // Investment & Savings
        recommendations.push('\n🎯 INVESTASI & TABUNGAN:');

        if (savingsRate < 15) {
            recommendations.push('• PRIORITAS UTAMA: Naikkan tingkat tabungan ke minimal 20% melalui automatic saving setiap terima pendapatan.');
            recommendations.push('• Bangun dana darurat minimal 6 bulan pengeluaran sebelum investasi agresif.');
        } else if (savingsRate >= 20) {
            recommendations.push('• Alokasikan surplus ke portofolio investasi seimbang: 40% deposito/bonds, 40% saham/reksa dana, 20% high-risk high-return.');
            recommendations.push('• Pertimbangkan investasi properti atau instrumen yang menghasilkan passive income.');
        }

        // Tax & Planning
        recommendations.push('\n📋 PERENCANAAN KEUANGAN:');
        recommendations.push('• Konsultasikan dengan financial planner untuk optimasi pajak dan strategi wealth building.');
        recommendations.push('• Siapkan rencana keuangan 5 tahun dengan target yang spesifik, measurable, dan realistis.');
        recommendations.push('• Review dan update asuransi (kesehatan, jiwa) sesuai kondisi finansial terkini.');

        // Year-ahead planning
        const nextYearTarget = totalIncome * 1.15; // 15% growth target
        recommendations.push('\n🚀 TARGET TAHUN DEPAN:');
        recommendations.push(`• Target pendapatan: Rp ${nextYearTarget.toLocaleString('id-ID')} (growth 15%)`);
        recommendations.push(`• Target tabungan: Rp ${(nextYearTarget * 0.25).toLocaleString('id-ID')} (25% dari pendapatan)`);
        recommendations.push('• Evaluasi progress setiap quarter untuk adjustment strategi real-time.');

        return recommendations;
    }
}
