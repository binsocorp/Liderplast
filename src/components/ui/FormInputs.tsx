import { InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react';

// -----------------------------------------------
// Input
// -----------------------------------------------

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
    error?: boolean;
}

export function Input({ error, className = '', ...props }: InputProps) {
    return (
        <input
            className={`w-full px-4 py-2.5 border rounded-lg text-sm outline-none transition-colors ${error
                ? 'border-danger-500 focus:ring-2 focus:ring-danger-500/20'
                : 'border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-primary-500'
                } ${className}`}
            {...props}
        />
    );
}

// -----------------------------------------------
// Select
// -----------------------------------------------

interface SelectOption {
    value: string;
    label: string;
}

interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'children'> {
    options: SelectOption[];
    placeholder?: string;
    error?: boolean;
}

export function Select({ options, placeholder, error, className = '', ...props }: SelectProps) {
    return (
        <select
            className={`w-full px-4 py-2.5 border rounded-lg text-sm outline-none transition-colors bg-white text-ellipsis overflow-hidden whitespace-nowrap pr-8 ${error
                ? 'border-danger-500 focus:ring-2 focus:ring-danger-500/20'
                : 'border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-primary-500'
                } ${className}`}
            {...props}
        >
            {placeholder && (
                <option value="">{placeholder}</option>
            )}
            {options.map((opt) => (
                <option key={opt.value} value={opt.value}>
                    {opt.label}
                </option>
            ))}
        </select>
    );
}

// -----------------------------------------------
// Textarea
// -----------------------------------------------

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
    error?: boolean;
}

export function Textarea({ error, className = '', ...props }: TextareaProps) {
    return (
        <textarea
            className={`w-full px-4 py-2.5 border rounded-lg text-sm outline-none transition-colors resize-y min-h-[80px] ${error
                ? 'border-danger-500 focus:ring-2 focus:ring-danger-500/20'
                : 'border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-primary-500'
                } ${className}`}
            {...props}
        />
    );
}

// -----------------------------------------------
// Checkbox
// -----------------------------------------------

interface CheckboxProps extends InputHTMLAttributes<HTMLInputElement> {
    label: string;
}

export function Checkbox({ label, className = '', ...props }: CheckboxProps) {
    return (
        <label className={`flex items-center gap-2 cursor-pointer ${className}`}>
            <input
                type="checkbox"
                className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                {...props}
            />
            <span className="text-sm text-gray-700">{label}</span>
        </label>
    );
}
