import { ButtonHTMLAttributes, ReactNode } from 'react';

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: Variant;
    size?: Size;
    icon?: ReactNode;
    children: ReactNode;
}

const variantClasses: Record<Variant, string> = {
    primary:
        'bg-primary-600 hover:bg-primary-700 text-white border border-primary-600 shadow-sm',
    secondary:
        'bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 shadow-sm',
    danger:
        'bg-danger-500 hover:bg-danger-700 text-white border border-danger-500 shadow-sm',
    ghost:
        'bg-transparent hover:bg-gray-100 text-gray-600 border border-transparent',
};

const sizeClasses: Record<Size, string> = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2 text-sm',
    lg: 'px-5 py-2.5 text-sm',
};

export function Button({
    variant = 'primary',
    size = 'md',
    icon,
    children,
    className = '',
    disabled,
    ...props
}: ButtonProps) {
    return (
        <button
            className={`inline-flex items-center justify-center gap-2 font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
            disabled={disabled}
            {...props}
        >
            {icon}
            {children}
        </button>
    );
}
