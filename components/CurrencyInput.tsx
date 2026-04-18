import React, { InputHTMLAttributes } from 'react';

interface CurrencyInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
    value: string | number;
    onValueChange: (value: string) => void;
}

export function CurrencyInput({ value, onValueChange, className, placeholder, ...props }: CurrencyInputProps) {
    const formatValue = (val: string | number) => {
        if (val === undefined || val === null || val === '') return '';
        
        let strVal = val.toString();
        // If it's a standard JS number string (uses dot), convert to comma to match UI expectations
        if (!strVal.includes(',') && strVal.includes('.')) {
            strVal = strVal.replace('.', ',');
        }

        // Handle string inputs which might already have currency prefix
        strVal = strVal.replace('Rp ', '').replace(/\./g, '');
        const parts = strVal.split(',');
        
        // Format the part before the decimal
        const beforeDecimal = parts[0].replace(/[^0-9]/g, '');
        const formattedBefore = beforeDecimal ? Number(beforeDecimal).toLocaleString('id-ID') : '0';
        
        // Reconstruct with decimal if present
        return 'Rp ' + formattedBefore + (parts.length > 1 ? ',' + parts[1].slice(0, 2) : '');
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        // Remove currency prefix and thousand separators (.) but keep decimal separator (,)
        const rawValue = e.target.value.replace('Rp ', '').replace(/\./g, '');
        
        // Only allow digits and one comma
        const sanitized = rawValue.replace(/[^0-9,]/g, '');
        const parts = sanitized.split(',');
        const finalValue = parts[0] + (parts.length > 1 ? ',' + parts[1].slice(0, 2) : '');
        
        // Convert to internal format (standard number with point) for the parent
        const parentValue = finalValue.replace(',', '.');
        onValueChange(parentValue);
    };

    return (
        <input
            {...props}
            type="text"
            inputMode="numeric"
            value={formatValue(value)}
            onChange={handleChange}
            placeholder={placeholder || 'Rp 0'}
            className={className}
        />
    );
}
