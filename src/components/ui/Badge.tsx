// -----------------------------------------------
// Status Badge
// -----------------------------------------------

const STATUS_CONFIG: Record<string, { label: string; bg: string; text: string; dot?: string }> = {
    // Estado de pedido (4 estados principales)
    CONFIRMADO: { label: 'Confirmado', bg: 'bg-primary-50', text: 'text-primary-700', dot: 'bg-primary-500' },
    EN_VIAJE: { label: 'En viaje', bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-500' },
    ESPERANDO_INSTALACION: { label: 'Esperando instalación', bg: 'bg-violet-50', text: 'text-violet-700', dot: 'bg-violet-500' },
    COMPLETADO: { label: 'Completado', bg: 'bg-success-50', text: 'text-success-700', dot: 'bg-success-500' },

    // Estado de pago
    PENDING: { label: 'Pendiente', bg: 'bg-warning-50', text: 'text-warning-600', dot: 'bg-warning-500' },
    PAID: { label: 'Pagado', bg: 'bg-success-50', text: 'text-success-600', dot: 'bg-success-500' },
    UNPAID: { label: 'Impago', bg: 'bg-danger-50', text: 'text-danger-600', dot: 'bg-danger-500' },
    REFUNDED: { label: 'Reembolsado', bg: 'bg-sky-50', text: 'text-sky-600', dot: 'bg-sky-500' },

    // Estados antiguos de pedido (mantener compatibilidad)
    BORRADOR: { label: 'Borrador', bg: 'bg-gray-100', text: 'text-gray-700' },
    EN_PRODUCCION: { label: 'En Producción', bg: 'bg-warning-50', text: 'text-warning-700' },
    PRODUCIDO: { label: 'Producido', bg: 'bg-success-50', text: 'text-success-700' },
    VIAJE_ASIGNADO: { label: 'Viaje Asignado', bg: 'bg-purple-50', text: 'text-purple-700' },
    ENTREGADO: { label: 'Entregado', bg: 'bg-success-50', text: 'text-success-700' },
    CANCELADO: { label: 'Cancelado', bg: 'bg-danger-50', text: 'text-danger-700' },

    // Uso general
    ACTIVE: { label: 'Activo', bg: 'bg-success-50', text: 'text-success-700' },
    PAUSED: { label: 'Pausado', bg: 'bg-warning-50', text: 'text-warning-700' },
    CANCELLED: { label: 'Cancelado', bg: 'bg-danger-50', text: 'text-danger-700' },
    INTERNO: { label: 'Interno', bg: 'bg-primary-50', text: 'text-primary-700' },
    REVENDEDOR: { label: 'Revendedor', bg: 'bg-purple-50', text: 'text-purple-700' },
    PENDIENTE: { label: 'Pendiente', bg: 'bg-warning-50', text: 'text-warning-700' },
    EN_CURSO: { label: 'En Curso', bg: 'bg-primary-50', text: 'text-primary-700' },
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
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${config.bg} ${config.text} ${className}`}
        >
            {config.dot && (
                <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
            )}
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
        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-500">
            {falseLabel}
        </span>
    );
}
