'use client';

import { MasterCrud } from '../MasterCrud';

export function ResellerPriceListsClient({ lists }: { lists: any[] }) {
    return (
        <MasterCrud
            title="Listas de Precios (Revendedores)"
            entityTable="reseller_price_lists"
            data={lists ?? []}
            columns={[
                { key: 'name', label: 'Nombre' },
                {
                    key: 'is_active',
                    label: 'Estado',
                    renderType: 'boolean'
                },
            ]}
            fields={[
                { key: 'name', label: 'Nombre de la Lista', type: 'text', required: true },
                { key: 'is_active', label: 'Activo', type: 'checkbox', defaultValue: true },
            ]}
        />
    );
}
