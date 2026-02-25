import type { OrderStatus } from '@/lib/types/database';

// -----------------------------------------------
// Status Badge
// -----------------------------------------------

const STATUS_CONFIG: Record<string, { label: string; bg: string; text: string }> = {
    BORRADOR: { label: 'Borrador', bg: 'bg-gray-100', text: 'text-gray-700' },
    CONFIRMADO: { label: 'Confirmado', bg: 'bg-primary-50', text: 'text-primary-700' },
    EN_PRODUCCION: { label: 'En Producción', bg: 'bg-warning-50', text: 'text-warning-700' },
    PRODUCIDO: { label: 'Producido', bg: 'bg-success-50', text: 'text-success-700' },
    VIAJE_ASIGNADO: { label: 'Viaje Asignado', bg: 'bg-purple-50', text: 'text-purple-700' },
    ENTREGADO: { label: 'Entregado', bg: 'bg-success-50', text: 'text-success-700' },
    CANCELADO: { label: 'Cancelado', bg: 'bg-danger-50', text: 'text-danger-700' },
    // General use
    ACTIVE: { label: 'Activo', bg: 'bg-success-50', text: 'text-success-700' },
    PAUSED: { label: 'Pausado', bg: 'bg-warning-50', text: 'text-warning-700' },
    CANCELLED: { label: 'Cancelado', bg: 'bg-danger-50', text: 'text-danger-700' },
    INTERNO: { label: 'Interno', bg: 'bg-primary-50', text: 'text-primary-700' },
    REVENDEDOR: { label: 'Revendedor', bg: 'bg-purple-50', text: 'text-purple-700' },
    PENDIENTE: { label: 'Pendiente', bg: 'bg-warning-50', text: 'text-warning-700' },
    EN_CURSO: { label: 'En Curso', bg: 'bg-primary-50', text: 'text-primary-700' },
    COMPLETADO: { label: 'Completado', bg: 'bg-success-50', text: 'text-success-700' },
    PRODUCTO: { label: 'Producto', bg: 'bg-primary-50', text: 'text-primary-700' },
    SERVICIO: { label: 'Servicio', bg: 'bg-purple-50', text: 'text-purple-700' },
};

interface BadgeProps {
    status: string;
    className?: string;
}

export function Badge({ status, className = '' }: BadgeProps) {
    const config = STATUS_CONFIG[status] || {
        label: status,
        bg: 'bg-gray-100',
        text: 'text-gray-700',
    };

    return (
        <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.text} ${className}`}
        >
            {config.label}
        </span>
    );
}

// Boolean badges
export function BoolBadge({ value, trueLabel = 'Sí', falseLabel = 'No' }: {
    value: boolean;
    trueLabel?: string;
    falseLabel?: string;
}) {
    return value ? (
        <Badge status="ACTIVE" className="" />
    ) : (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-500">
            {falseLabel}
        </span>
    );
}
