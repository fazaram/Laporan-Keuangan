export const MAX_ALLOWED_AMOUNT = 100_000_000_000_000; // 100 Trillion IDR

export function formatCurrency(amount: number | string): string {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    const formatted = new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
    }).format(num);
    return formatted.replace(/^Rp\s?/, 'Rp.');
}

export function formatDate(date: Date | string): string {
    const d = typeof date === 'string' ? new Date(date) : date;
    return new Intl.DateTimeFormat('id-ID', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    }).format(d);
}

export function formatDateTime(date: Date | string): string {
    const d = typeof date === 'string' ? new Date(date) : date;
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const seconds = String(d.getSeconds()).padStart(2, '0');

    return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
}

export function getLocalDatetime(date?: Date | string): string {
    const d = date ? (typeof date === 'string' ? new Date(date) : date) : new Date();
    const tzOffset = d.getTimezoneOffset() * 60000;
    return new Date(d.getTime() - tzOffset).toISOString().slice(0, 19);
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
