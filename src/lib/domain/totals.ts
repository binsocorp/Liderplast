// ============================================================
// Domain logic: Totals calculation
// ============================================================

import type { OrderItem } from '@/lib/types/database';

export function calcItemSubtotal(quantity: number, unitPriceNet: number): number {
    return Math.round(quantity * unitPriceNet * 100) / 100;
}

export function calcOrderSubtotals(items: Pick<OrderItem, 'type' | 'subtotal_net'>[]) {
    let subtotalProducts = 0;
    let subtotalServices = 0;

    for (const item of items) {
        if (item.type === 'PRODUCTO') {
            subtotalProducts += item.subtotal_net;
        } else {
            subtotalServices += item.subtotal_net;
        }
    }

    return {
        subtotal_products: Math.round(subtotalProducts * 100) / 100,
        subtotal_services: Math.round(subtotalServices * 100) / 100,
    };
}

export function calcOrderTotal(
    subtotalProducts: number,
    subtotalServices: number,
    discountAmount: number,
    taxAmountManual: number
): number {
    return Math.round(
        (subtotalProducts + subtotalServices - discountAmount + taxAmountManual) * 100
    ) / 100;
}
