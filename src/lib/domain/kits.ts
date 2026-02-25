// ============================================================
// Domain logic: Quick-add kits
// No son combos con descuento: solo agregan ítems separados
// ============================================================

export interface KitItem {
    catalogItemName: string;
    type: 'PRODUCTO' | 'SERVICIO';
    quantity: number;
}

export interface Kit {
    name: string;
    description: string;
    items: KitItem[];
}

export const KITS: Record<string, Kit> = {
    LOSETAS: {
        name: 'Kit Losetas',
        description: 'Agrega 3 líneas de losetas',
        items: [
            { catalogItemName: 'Loseta Atérmica', type: 'PRODUCTO', quantity: 1 },
            { catalogItemName: 'Adhesivo para Loseta', type: 'PRODUCTO', quantity: 1 },
            { catalogItemName: 'Instalación Losetas', type: 'SERVICIO', quantity: 1 },
        ],
    },
    ACCESORIOS: {
        name: 'Combo Accesorios',
        description: 'Agrega 4 líneas de accesorios estándar',
        items: [
            { catalogItemName: 'Escalera Inox', type: 'PRODUCTO', quantity: 1 },
            { catalogItemName: 'Iluminación LED', type: 'PRODUCTO', quantity: 1 },
            { catalogItemName: 'Skimmer', type: 'PRODUCTO', quantity: 1 },
            { catalogItemName: 'Retorno', type: 'PRODUCTO', quantity: 1 },
        ],
    },
    EXTRAS: {
        name: 'Kit Extras',
        description: 'Agrega 4 líneas de extras comunes',
        items: [
            { catalogItemName: 'Climatización Solar', type: 'PRODUCTO', quantity: 1 },
            { catalogItemName: 'Cobertor Térmico', type: 'PRODUCTO', quantity: 1 },
            { catalogItemName: 'Electrobomba', type: 'PRODUCTO', quantity: 1 },
            { catalogItemName: 'Filtro de Arena', type: 'PRODUCTO', quantity: 1 },
        ],
    },
};
