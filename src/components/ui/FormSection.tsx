import { ReactNode } from 'react';

interface FormSectionProps {
    title: string;
    description?: string;
    children: ReactNode;
}

export function FormSection({ title, description, children }: FormSectionProps) {
    return (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="mb-4">
                <h3 className="text-base font-semibold text-gray-900">{title}</h3>
                {description && (
                    <p className="text-sm text-gray-500 mt-0.5">{description}</p>
                )}
            </div>
            <div className="space-y-4">{children}</div>
        </div>
    );
}

// -----------------------------------------------
// Form field with label
// -----------------------------------------------

interface FormFieldProps {
    label: string;
    error?: string;
    required?: boolean;
    children: ReactNode;
}

export function FormField({ label, error, required, children }: FormFieldProps) {
    return (
        <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
                {label}
                {required && <span className="text-danger-500 ml-0.5">*</span>}
            </label>
            {children}
            {error && (
                <p className="mt-1 text-xs text-danger-500">{error}</p>
            )}
        </div>
    );
}

// -----------------------------------------------
// Form grid
// -----------------------------------------------

export function FormGrid({ children, cols = 2 }: { children: ReactNode; cols?: 2 | 3 | 4 }) {
    const colClass = {
        2: 'grid-cols-1 md:grid-cols-2',
        3: 'grid-cols-1 md:grid-cols-3',
        4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
    };

    return (
        <div className={`grid ${colClass[cols]} gap-4`}>{children}</div>
    );
}
