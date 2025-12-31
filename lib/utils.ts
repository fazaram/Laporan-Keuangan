export function formatCurrency(amount: number | string): string {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(num);
}

export function formatDate(date: Date | string): string {
    const d = typeof date === 'string' ? new Date(date) : date;
    return new Intl.DateTimeFormat('id-ID', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    }).format(d);
}

export function formatDateShort(date: Date | string): string {
    const d = typeof date === 'string' ? new Date(date) : date;
    return new Intl.DateTimeFormat('id-ID', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
    }).format(d);
}

export function formatMonthYear(year: number, month: number): string {
    const date = new Date(year, month - 1);
    return new Intl.DateTimeFormat('id-ID', {
        year: 'numeric',
        month: 'long',
    }).format(date);
}

export function getMonthName(month: number): string {
    const date = new Date(2024, month - 1);
    return new Intl.DateTimeFormat('id-ID', { month: 'long' }).format(date);
}

export function calculatePercentageChange(current: number, previous: number): number {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
}

export function cn(...classes: (string | undefined | null | false)[]): string {
    return classes.filter(Boolean).join(' ');
}

export function getMonthsArray(): Array<{ value: number; label: string }> {
    return Array.from({ length: 12 }, (_, i) => ({
        value: i + 1,
        label: getMonthName(i + 1),
    }));
}

export function getYearsArray(startYear: number = 2020): Array<number> {
    const currentYear = new Date().getFullYear();
    const years: number[] = [];
    for (let year = currentYear; year >= startYear; year--) {
        years.push(year);
    }
    return years;
}

export function getCurrentMonth(): number {
    return new Date().getMonth() + 1;
}

export function getCurrentYear(): number {
    return new Date().getFullYear();
}
