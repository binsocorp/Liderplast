import { z } from 'zod';

// -----------------------------------------------
// Orders
// -----------------------------------------------

export const orderSchema = z.object({
    client_id: z.string().uuid().nullable().optional(),
    client_name: z.string().min(1, 'El nombre del cliente es obligatorio'),
    client_document: z.string().optional().default(''),
    client_phone: z.string().optional().default(''),
    delivery_address: z.string().min(1, 'La dirección de entrega es obligatoria'),
    city: z.string().min(1, 'La localidad es obligatoria'),
    distance_km: z.coerce.number().min(0).default(0),
    province_id: z.string().uuid('Seleccione una provincia'),
    channel: z.enum(['INTERNO', 'REVENDEDOR']),
    seller_id: z.string().uuid().nullable().optional(),
    reseller_id: z.string().uuid().nullable().optional(),
    status: z.enum([
        'BORRADOR',
        'CONFIRMADO',
        'EN_PRODUCCION',
        'PRODUCIDO',
        'VIAJE_ASIGNADO',
        'ENTREGADO',
        'CANCELADO',
    ]).default('BORRADOR'),
    discount_amount: z.coerce.number().min(0).default(0),
    freight_amount: z.coerce.number().min(0).default(0),
    installation_amount: z.coerce.number().min(0).default(0),
    travel_amount: z.coerce.number().min(0).default(0),
    other_amount: z.coerce.number().min(0).default(0),
    tax_amount_manual: z.coerce.number().min(0).default(0),
    trip_id: z.string().uuid().nullable().optional(),
    installer_id: z.string().uuid().nullable().optional(),
    notes: z.string().optional().default(''),
}).refine(
    (data) => {
        if (data.channel === 'REVENDEDOR' && !data.reseller_id) {
            return false;
        }
        return true;
    },
    {
        message: 'El revendedor es obligatorio cuando el canal es REVENDEDOR',
        path: ['reseller_id'],
    }
);

export type OrderFormData = z.infer<typeof orderSchema>;

// -----------------------------------------------
// Order Items
// -----------------------------------------------

export const orderItemSchema = z.object({
    order_id: z.string().uuid(),
    catalog_item_id: z.string().uuid('Seleccione un producto/servicio'),
    type: z.enum(['PRODUCTO', 'SERVICIO']),
    description: z.string().default(''),
    quantity: z.coerce.number().int().min(1, 'La cantidad debe ser al menos 1'),
    unit_price_net: z.coerce.number().min(0, 'El precio no puede ser negativo'),
});

export type OrderItemFormData = z.infer<typeof orderItemSchema>;

// -----------------------------------------------
// Clients
// -----------------------------------------------

export const clientSchema = z.object({
    name: z.string().min(1, 'El nombre es obligatorio'),
    phone: z.string().optional().default(''),
    email: z.string().email('Email inválido').or(z.literal('')).default(''),
    address: z.string().optional().default(''),
    city: z.string().optional().default(''),
    province_id: z.string().uuid().nullable().optional(),
    notes: z.string().optional().default(''),
    is_active: z.boolean().default(true),
});

export type ClientFormData = z.infer<typeof clientSchema>;

// -----------------------------------------------
// Sellers
// -----------------------------------------------

export const sellerSchema = z.object({
    name: z.string().min(1, 'El nombre es obligatorio'),
    type: z.enum(['INTERNO', 'REVENDEDOR']).default('INTERNO'),
    phone: z.string().optional().default(''),
    email: z.string().email('Email inválido').or(z.literal('')).default(''),
    is_active: z.boolean().default(true),
});

export type SellerFormData = z.infer<typeof sellerSchema>;

// -----------------------------------------------
// Resellers
// -----------------------------------------------

export const resellerSchema = z.object({
    name: z.string().min(1, 'El nombre es obligatorio'),
    contact: z.string().optional().default(''),
    phone: z.string().optional().default(''),
    email: z.string().email('Email inválido').or(z.literal('')).default(''),
    province_id: z.string().uuid().nullable().optional(),
    is_active: z.boolean().default(true),
});

export type ResellerFormData = z.infer<typeof resellerSchema>;

// -----------------------------------------------
// Suppliers
// -----------------------------------------------

export const supplierSchema = z.object({
    name: z.string().min(1, 'El nombre es obligatorio'),
    contact: z.string().optional().default(''),
    phone: z.string().optional().default(''),
    email: z.string().email('Email inválido').or(z.literal('')).default(''),
    category: z.string().optional().default(''),
    is_active: z.boolean().default(true),
});

export type SupplierFormData = z.infer<typeof supplierSchema>;

// -----------------------------------------------
// Catalog Items
// -----------------------------------------------

export const catalogItemSchema = z.object({
    name: z.string().min(1, 'El nombre es obligatorio'),
    type: z.enum(['PRODUCTO', 'SERVICIO']),
    description: z.string().optional().default(''),
    sku: z.string().optional().default(''),
    is_active: z.boolean().default(true),
});

export type CatalogItemFormData = z.infer<typeof catalogItemSchema>;

// -----------------------------------------------
// Prices
// -----------------------------------------------

export const priceSchema = z.object({
    catalog_item_id: z.string().uuid('Seleccione un producto/servicio'),
    province_id: z.string().uuid('Seleccione una provincia'),
    unit_price_net: z.coerce.number().min(0, 'El precio no puede ser negativo'),
    is_active: z.boolean().default(true),
});

export type PriceFormData = z.infer<typeof priceSchema>;

// -----------------------------------------------
// Installers
// -----------------------------------------------

export const installerSchema = z.object({
    name: z.string().min(1, 'El nombre es obligatorio'),
    phone: z.string().optional().default(''),
    email: z.string().email('Email inválido').or(z.literal('')).default(''),
    zone: z.string().optional().default(''),
    is_active: z.boolean().default(true),
});

export type InstallerFormData = z.infer<typeof installerSchema>;

// -----------------------------------------------
// Trips
// -----------------------------------------------

export const tripSchema = z.object({
    truck_type_id: z.string().uuid('Seleccione un tipo de camión').nullable().optional(),
    cost: z.coerce.number().min(0, 'El costo no puede ser negativo').default(0),
    description: z.string().optional().default(''),
    destination: z.string().min(1, 'El destino es obligatorio'),
    date: z.string().optional().nullable(),
    status: z.string().default('PENDIENTE'),
    notes: z.string().optional().default(''),
});

export type TripFormData = z.infer<typeof tripSchema>;

// -----------------------------------------------
// Provinces
// -----------------------------------------------

export const provinceSchema = z.object({
    name: z.string().min(1, 'El nombre es obligatorio'),
    is_sellable: z.boolean().default(true),
});

export type ProvinceFormData = z.infer<typeof provinceSchema>;

// -----------------------------------------------
// Subscriptions
// -----------------------------------------------

export const subscriptionSchema = z.object({
    name: z.string().min(1, 'El nombre es obligatorio'),
    vendor: z.string().optional().default(''),
    category: z.string().optional().default(''),
    status: z.enum(['ACTIVE', 'PAUSED', 'CANCELLED']).default('ACTIVE'),
    billing_cycle: z.enum(['MONTHLY', 'YEARLY', 'OTHER']).default('MONTHLY'),
    currency: z.enum(['ARS', 'USD']).default('ARS'),
    amount: z.coerce.number().min(0).default(0),
    start_date: z.string().optional().nullable(),
    renewal_date: z.string().optional().nullable(),
    payment_method: z.string().optional().default(''),
    notes: z.string().optional().default(''),
});

export type SubscriptionFormData = z.infer<typeof subscriptionSchema>;

export const subscriptionExpenseSchema = z.object({
    subscription_id: z.string().uuid().nullable().optional(),
    expense_date: z.string().min(1, 'La fecha es obligatoria'),
    period_year: z.coerce.number().int().min(2020).max(2100),
    period_month: z.coerce.number().int().min(1).max(12),
    amount: z.coerce.number().min(0),
    currency: z.enum(['ARS', 'USD']).default('ARS'),
    vendor_snapshot: z.string().optional().default(''),
    note: z.string().optional().default(''),
});

export type SubscriptionExpenseFormData = z.infer<typeof subscriptionExpenseSchema>;
