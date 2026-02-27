-- ============================================================
-- LIDERPLAST — RLS Policies
-- Ejecutar DESPUÉS de schema.sql
-- ============================================================

-- Helper: verificar si el usuario es admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'ADMIN'
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Helper: verificar si puede override precios
CREATE OR REPLACE FUNCTION public.can_override_prices()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND can_override_prices = TRUE
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- -----------------------------------------------
-- PROFILES
-- -----------------------------------------------
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
CREATE POLICY "profiles_select_own"
  ON public.profiles FOR SELECT
  USING (id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
CREATE POLICY "profiles_update_own"
  ON public.profiles FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

DROP POLICY IF EXISTS "profiles_admin_all" ON public.profiles;
CREATE POLICY "profiles_admin_all"
  ON public.profiles FOR ALL
  USING (public.is_admin());

-- -----------------------------------------------
-- PROVINCES (maestro: admin write, todos leen)
-- -----------------------------------------------
ALTER TABLE public.provinces ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "provinces_select_all" ON public.provinces;
CREATE POLICY "provinces_select_all"
  ON public.provinces FOR SELECT
  USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "provinces_admin_write" ON public.provinces;
CREATE POLICY "provinces_admin_write"
  ON public.provinces FOR ALL
  USING (public.is_admin());

-- -----------------------------------------------
-- CLIENTS
-- -----------------------------------------------
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "clients_select_all" ON public.clients;
CREATE POLICY "clients_select_all"
  ON public.clients FOR SELECT
  USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "clients_admin_write" ON public.clients;
CREATE POLICY "clients_admin_write"
  ON public.clients FOR ALL
  USING (public.is_admin());

-- -----------------------------------------------
-- SELLERS
-- -----------------------------------------------
ALTER TABLE public.sellers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "sellers_select_all" ON public.sellers;
CREATE POLICY "sellers_select_all"
  ON public.sellers FOR SELECT
  USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "sellers_admin_write" ON public.sellers;
CREATE POLICY "sellers_admin_write"
  ON public.sellers FOR ALL
  USING (public.is_admin());

-- -----------------------------------------------
-- RESELLERS
-- -----------------------------------------------
ALTER TABLE public.resellers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "resellers_select_all" ON public.resellers;
CREATE POLICY "resellers_select_all"
  ON public.resellers FOR SELECT
  USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "resellers_admin_write" ON public.resellers;
CREATE POLICY "resellers_admin_write"
  ON public.resellers FOR ALL
  USING (public.is_admin());

-- -----------------------------------------------
-- SUPPLIERS
-- -----------------------------------------------
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "suppliers_select_all" ON public.suppliers;
CREATE POLICY "suppliers_select_all"
  ON public.suppliers FOR SELECT
  USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "suppliers_admin_write" ON public.suppliers;
CREATE POLICY "suppliers_admin_write"
  ON public.suppliers FOR ALL
  USING (public.is_admin());

-- -----------------------------------------------
-- CATALOG ITEMS
-- -----------------------------------------------
ALTER TABLE public.catalog_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "catalog_select_all" ON public.catalog_items;
CREATE POLICY "catalog_select_all"
  ON public.catalog_items FOR SELECT
  USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "catalog_admin_write" ON public.catalog_items;
CREATE POLICY "catalog_admin_write"
  ON public.catalog_items FOR ALL
  USING (public.is_admin());

-- -----------------------------------------------
-- PRICES
-- -----------------------------------------------
ALTER TABLE public.prices ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "prices_select_all" ON public.prices;
CREATE POLICY "prices_select_all"
  ON public.prices FOR SELECT
  USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "prices_admin_write" ON public.prices;
CREATE POLICY "prices_admin_write"
  ON public.prices FOR ALL
  USING (public.is_admin());

-- -----------------------------------------------
-- INSTALLERS
-- -----------------------------------------------
ALTER TABLE public.installers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "installers_select_all" ON public.installers;
CREATE POLICY "installers_select_all"
  ON public.installers FOR SELECT
  USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "installers_admin_write" ON public.installers;
CREATE POLICY "installers_admin_write"
  ON public.installers FOR ALL
  USING (public.is_admin());

-- -----------------------------------------------
-- DRIVERS (Fleteros)
-- -----------------------------------------------
ALTER TABLE public.drivers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "drivers_select_all" ON public.drivers;
CREATE POLICY "drivers_select_all"
  ON public.drivers FOR SELECT
  USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "drivers_admin_write" ON public.drivers;
CREATE POLICY "drivers_admin_write"
  ON public.drivers FOR ALL
  USING (public.is_admin());

-- -----------------------------------------------
-- VEHICLES (Tipos de Vehículo)
-- -----------------------------------------------
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "vehicles_select_all" ON public.vehicles;
CREATE POLICY "vehicles_select_all"
  ON public.vehicles FOR SELECT
  USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "vehicles_admin_write" ON public.vehicles;
CREATE POLICY "vehicles_admin_write"
  ON public.vehicles FOR ALL
  USING (public.is_admin());

-- -----------------------------------------------
-- TRIPS
-- -----------------------------------------------
ALTER TABLE public.trips ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "trips_select_all" ON public.trips;
CREATE POLICY "trips_select_all"
  ON public.trips FOR SELECT
  USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "trips_insert_auth" ON public.trips;
CREATE POLICY "trips_insert_auth"
  ON public.trips FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "trips_update_auth" ON public.trips;
CREATE POLICY "trips_update_auth"
  ON public.trips FOR UPDATE
  USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "trips_delete_admin" ON public.trips;
CREATE POLICY "trips_delete_admin"
  ON public.trips FOR DELETE
  USING (public.is_admin());

-- -----------------------------------------------
-- TRIP ORDERS (Bridge)
-- -----------------------------------------------
ALTER TABLE public.trip_orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "trip_orders_select_all" ON public.trip_orders;
CREATE POLICY "trip_orders_select_all"
  ON public.trip_orders FOR SELECT
  USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "trip_orders_insert_auth" ON public.trip_orders;
CREATE POLICY "trip_orders_insert_auth"
  ON public.trip_orders FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "trip_orders_update_auth" ON public.trip_orders;
CREATE POLICY "trip_orders_update_auth"
  ON public.trip_orders FOR UPDATE
  USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "trip_orders_delete_auth" ON public.trip_orders;
CREATE POLICY "trip_orders_delete_auth"
  ON public.trip_orders FOR DELETE
  USING (auth.uid() IS NOT NULL);

-- -----------------------------------------------
-- ORDERS (sistema interno: todos CRUD)
-- -----------------------------------------------
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "orders_select_all" ON public.orders;
CREATE POLICY "orders_select_all"
  ON public.orders FOR SELECT
  USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "orders_insert_auth" ON public.orders;
CREATE POLICY "orders_insert_auth"
  ON public.orders FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "orders_update_auth" ON public.orders;
CREATE POLICY "orders_update_auth"
  ON public.orders FOR UPDATE
  USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "orders_delete_admin" ON public.orders;
CREATE POLICY "orders_delete_admin"
  ON public.orders FOR DELETE
  USING (public.is_admin());

-- -----------------------------------------------
-- ORDER ITEMS
-- -----------------------------------------------
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "order_items_select_all" ON public.order_items;
CREATE POLICY "order_items_select_all"
  ON public.order_items FOR SELECT
  USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "order_items_insert_auth" ON public.order_items;
CREATE POLICY "order_items_insert_auth"
  ON public.order_items FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "order_items_update_auth" ON public.order_items;
CREATE POLICY "order_items_update_auth"
  ON public.order_items FOR UPDATE
  USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "order_items_delete_auth" ON public.order_items;
CREATE POLICY "order_items_delete_auth"
  ON public.order_items FOR DELETE
  USING (auth.uid() IS NOT NULL);

-- -----------------------------------------------
-- USER SUBSCRIPTIONS (privado por usuario)
-- -----------------------------------------------
ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "user_subs_own" ON public.user_subscriptions;
CREATE POLICY "user_subs_own"
  ON public.user_subscriptions FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- -----------------------------------------------
-- SUBSCRIPTION EXPENSES (privado por usuario)
-- -----------------------------------------------
ALTER TABLE public.subscription_expenses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "sub_expenses_own" ON public.subscription_expenses;
CREATE POLICY "sub_expenses_own"
  ON public.subscription_expenses FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- -----------------------------------------------
-- FINANCE TABLES
-- -----------------------------------------------
ALTER TABLE public.finance_categories ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "finance_categories_all" ON public.finance_categories;
CREATE POLICY "finance_categories_all" ON public.finance_categories FOR ALL TO authenticated USING (true);

ALTER TABLE public.finance_subcategories ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "finance_subcategories_all" ON public.finance_subcategories;
CREATE POLICY "finance_subcategories_all" ON public.finance_subcategories FOR ALL TO authenticated USING (true);

ALTER TABLE public.finance_payment_methods ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "finance_payment_methods_all" ON public.finance_payment_methods;
CREATE POLICY "finance_payment_methods_all" ON public.finance_payment_methods FOR ALL TO authenticated USING (true);

ALTER TABLE public.finance_vendors ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "finance_vendors_all" ON public.finance_vendors;
CREATE POLICY "finance_vendors_all" ON public.finance_vendors FOR ALL TO authenticated USING (true);

ALTER TABLE public.finance_cost_centers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "finance_cost_centers_all" ON public.finance_cost_centers;
CREATE POLICY "finance_cost_centers_all" ON public.finance_cost_centers FOR ALL TO authenticated USING (true);

ALTER TABLE public.finance_expenses ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "finance_expenses_all" ON public.finance_expenses;
CREATE POLICY "finance_expenses_all" ON public.finance_expenses FOR ALL TO authenticated USING (true);

-- ============================================================
-- FIN RLS
-- ============================================================
