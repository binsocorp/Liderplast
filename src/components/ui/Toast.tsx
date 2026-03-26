'use client';

import { useState, useEffect, createContext, useContext, useCallback, useRef } from 'react';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';
import Link from 'next/link';

// -----------------------------------------------
// Types
// -----------------------------------------------

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastAction {
    label: string;
    href: string;
}

interface Toast {
    id: string;
    type: ToastType;
    title: string;
    message?: string;
    action?: ToastAction;
    duration?: number;
}

interface ToastContextType {
    addToast: (toast: Omit<Toast, 'id'>) => void;
}

// -----------------------------------------------
// Context
// -----------------------------------------------

const ToastContext = createContext<ToastContextType | null>(null);

export function useToast() {
    const ctx = useContext(ToastContext);
    if (!ctx) throw new Error('useToast must be used within ToastProvider');
    return ctx;
}

// -----------------------------------------------
// Individual Toast
// -----------------------------------------------

const toastConfig: Record<ToastType, { icon: typeof CheckCircle; bg: string; border: string; text: string; iconColor: string }> = {
    success: { icon: CheckCircle, bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-800', iconColor: 'text-green-500' },
    error: { icon: XCircle, bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-800', iconColor: 'text-red-500' },
    warning: { icon: AlertTriangle, bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-800', iconColor: 'text-amber-500' },
    info: { icon: Info, bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-800', iconColor: 'text-blue-500' },
};

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: (id: string) => void }) {
    const [exiting, setExiting] = useState(false);
    const cfg = toastConfig[toast.type];
    const Icon = cfg.icon;

    useEffect(() => {
        const duration = toast.duration ?? 5000;
        const timer = setTimeout(() => {
            setExiting(true);
            setTimeout(() => onDismiss(toast.id), 300);
        }, duration);
        return () => clearTimeout(timer);
    }, [toast, onDismiss]);

    function handleDismiss() {
        setExiting(true);
        setTimeout(() => onDismiss(toast.id), 300);
    }

    return (
        <div
            className={`
                flex items-start gap-3 px-4 py-3 rounded-xl border shadow-lg backdrop-blur-sm
                ${cfg.bg} ${cfg.border}
                transition-all duration-300 ease-in-out
                ${exiting ? 'opacity-0 translate-x-8' : 'opacity-100 translate-x-0'}
            `}
            style={{ minWidth: 320, maxWidth: 420 }}
        >
            <Icon className={`w-5 h-5 mt-0.5 flex-shrink-0 ${cfg.iconColor}`} />
            <div className="flex-1 min-w-0">
                <p className={`text-sm font-bold ${cfg.text}`}>{toast.title}</p>
                {toast.message && (
                    <p className={`text-xs mt-0.5 ${cfg.text} opacity-80`}>{toast.message}</p>
                )}
                {toast.action && (
                    <Link
                        href={toast.action.href}
                        className={`inline-flex items-center gap-1 text-xs font-bold mt-1.5 underline underline-offset-2 ${cfg.iconColor} hover:opacity-80 transition-opacity`}
                    >
                        {toast.action.label} →
                    </Link>
                )}
            </div>
            <button
                onClick={handleDismiss}
                className={`p-0.5 rounded hover:bg-black/5 transition-colors ${cfg.text} opacity-50 hover:opacity-100`}
            >
                <X className="w-3.5 h-3.5" />
            </button>
        </div>
    );
}

// -----------------------------------------------
// Provider
// -----------------------------------------------

export function ToastProvider({ children }: { children: React.ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([]);
    const counterRef = useRef(0);

    const addToast = useCallback((toast: Omit<Toast, 'id'>) => {
        const id = `toast-${++counterRef.current}-${Date.now()}`;
        setToasts(prev => [...prev, { ...toast, id }]);
    }, []);

    const dismissToast = useCallback((id: string) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    }, []);

    return (
        <ToastContext.Provider value={{ addToast }}>
            {children}
            {/* Toast container */}
            <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-auto">
                {toasts.map(toast => (
                    <ToastItem key={toast.id} toast={toast} onDismiss={dismissToast} />
                ))}
            </div>
        </ToastContext.Provider>
    );
}
