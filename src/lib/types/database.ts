// ============================================================
// Database type definitions derived from schema.sql
// ============================================================

export type UserRole = 'ADMIN' | 'USER';
export type SalesChannel = 'INTERNO' | 'REVENDEDOR';
// export type OrderStatus = ... (removed)
export type PaymentStatus = 'PENDING' | 'PAID' | 'UNPAID' | 'REFUNDED';
export type ItemType = 'PRODUCTO' | 'SERVICIO';
export type SellerType = 'INTERNO' | 'REVENDEDOR';
export type BillingCycle = 'MONTHLY' | 'YEARLY' | 'OTHER';
export type SubscriptionStatus = 'ACTIVE' | 'PAUSED' | 'CANCELLED';

// -----------------------------------------------
// Row types
// -----------------------------------------------

export interface Profile {
    id: string;
    full_name: string;
    role: UserRole;
    can_override_prices: boolean;
    created_at: string;
    updated_at: string;
}

export interface Province {
    id: string;
    name: string;
    is_sellable: boolean;
    created_at: string;
}

export interface Client {
    id: string;
    name: string;
    phone: string;
    email: string;
    address: string;
    city: string;
    province_id: string | null;
    notes: string;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

export interface Seller {
    id: string;
    name: string;
    type: SellerType;
    phone: string;
    email: string;
    is_active: boolean;
    created_at: string;
}

export interface Reseller {
    id: string;
    name: string;
    contact: string;
    phone: string;
    email: string;
    province_id: string | null;
    is_active: boolean;
    created_at: string;
}

export interface Supplier {
    id: string;
    name: string;
    contact: string;
    phone: string;
    email: string;
    category: string;
    is_active: boolean;
    created_at: string;
}

export interface CatalogItem {
    id: string;
    name: string;
    type: ItemType;
    description: string;
    sku: string;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

export interface Price {
    id: string;
    catalog_item_id: string;
    province_id: string;
    unit_price_net: number;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

export interface Installer {
    id: string;
    name: string;
    phone: string;
    email: string;
    zone: string;
    is_active: boolean;
    created_at: string;
}

export interface Driver {
    id: string;
    name: string;
    phone: string;
    is_active: boolean;
    created_at: string;
}

export interface Vehicle {
    id: string;
    name: string;
    capacity: number;
    is_active: boolean;
    created_at: string;
}

export interface Trip {
    id: string;
    trip_code: string;
    province_id: string;
    exact_address: string;
    trip_date: string;
    driver_id: string;
    vehicle_id: string;
    cost: number;
    description: string;
    status: 'PLANIFICADO' | 'EN_RUTA' | 'ENTREGADO' | 'CANCELADO';
    notes: string;
    created_at: string;
    updated_at: string;
}

export interface TripOrder {
    id: string;
    trip_id: string;
    order_id: string;
    created_at: string;
}

export interface Order {
    id: string;
    order_number: string;
    client_id: string | null;
    client_name: string;
    client_document: string;
    client_phone: string;
    delivery_address: string;
    city: string;
    distance_km: number;
    province_id: string;
    channel: SalesChannel;
    seller_id: string | null;
    reseller_id: string | null;
    status: 'PENDIENTE' | 'CONFIRMADO' | 'EN_VIAJE' | 'ESPERANDO_INSTALACION' | 'COMPLETADO';
    payment_status: PaymentStatus;
    subtotal_products: number;
    subtotal_services: number;
    discount_amount: number;
    freight_amount: number;
    installation_amount: number;
    travel_amount: number;
    other_amount: number;
    tax_amount_manual: number;
    total_net: number;
    trip_id: string | null;
    installer_id: string | null;
    notes: string;
    created_by: string | null;
    created_at: string;
    updated_at: string;
}

export interface OrderItem {
    id: string;
    order_id: string;
    catalog_item_id: string;
    type: ItemType;
    description: string;
    quantity: number;
    unit_price_net: number;
    subtotal_net: number;
    sort_order: number;
    created_at: string;
}

export interface UserSubscription {
    id: string;
    user_id: string;
    name: string;
    vendor: string;
    category: string;
    status: SubscriptionStatus;
    billing_cycle: BillingCycle;
    currency: string;
    amount: number;
    start_date: string | null;
    renewal_date: string | null;
    payment_method: string;
    notes: string;
    created_at: string;
    updated_at: string;
}

export interface SubscriptionExpense {
    id: string;
    user_id: string;
    subscription_id: string | null;
    expense_date: string;
    period_year: number;
    period_month: number;
    amount: number;
    currency: string;
    vendor_snapshot: string;
    note: string;
    created_at: string;
}

// -----------------------------------------------
// Joined types for UI
// -----------------------------------------------

export interface OrderWithRelations extends Order {
    province?: Province;
    client?: Client;
    seller?: Seller;
    reseller?: Reseller;
    trip?: Trip;
    installer?: Installer;
    items?: OrderItem[];
}

export interface PriceWithRelations extends Price {
    catalog_item?: CatalogItem;
    province?: Province;
}

// -----------------------------------------------
// Supabase Database type (minimal for client)
// -----------------------------------------------

export interface Database {
    public: {
        Tables: {
            profiles: { Row: Profile; Insert: Partial<Profile> & { id: string }; Update: Partial<Profile> };
            provinces: { Row: Province; Insert: Partial<Province>; Update: Partial<Province> };
            clients: { Row: Client; Insert: Partial<Client>; Update: Partial<Client> };
            sellers: { Row: Seller; Insert: Partial<Seller>; Update: Partial<Seller> };
            resellers: { Row: Reseller; Insert: Partial<Reseller>; Update: Partial<Reseller> };
            suppliers: { Row: Supplier; Insert: Partial<Supplier>; Update: Partial<Supplier> };
            catalog_items: { Row: CatalogItem; Insert: Partial<CatalogItem>; Update: Partial<CatalogItem> };
            prices: { Row: Price; Insert: Partial<Price>; Update: Partial<Price> };
            installers: { Row: Installer; Insert: Partial<Installer>; Update: Partial<Installer> };
            drivers: { Row: Driver; Insert: Partial<Driver>; Update: Partial<Driver> };
            vehicles: { Row: Vehicle; Insert: Partial<Vehicle>; Update: Partial<Vehicle> };
            trips: { Row: Trip; Insert: Partial<Trip>; Update: Partial<Trip> };
            trip_orders: { Row: TripOrder; Insert: Partial<TripOrder>; Update: Partial<TripOrder> };
            orders: { Row: Order; Insert: Partial<Order>; Update: Partial<Order> };
            order_items: { Row: OrderItem; Insert: Partial<OrderItem>; Update: Partial<OrderItem> };
            user_subscriptions: { Row: UserSubscription; Insert: Partial<UserSubscription>; Update: Partial<UserSubscription> };
            subscription_expenses: { Row: SubscriptionExpense; Insert: Partial<SubscriptionExpense>; Update: Partial<SubscriptionExpense> };
        };
        Enums: {
            user_role: UserRole;
            sales_channel: SalesChannel;
            // order_status: OrderStatus; (removed)
            payment_status: PaymentStatus;
            item_type: ItemType;
            seller_type: SellerType;
            billing_cycle: BillingCycle;
            subscription_status: SubscriptionStatus;
        };
    };
}
