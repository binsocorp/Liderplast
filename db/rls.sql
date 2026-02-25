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

CREATE POLICY "profiles_select_own"
  ON public.profiles FOR SELECT
  USING (id = auth.uid() OR public.is_admin());

CREATE POLICY "profiles_update_own"
  ON public.profiles FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

CREATE POLICY "profiles_admin_all"
  ON public.profiles FOR ALL
  USING (public.is_admin());

-- -----------------------------------------------
-- PROVINCES (maestro: admin write, todos leen)
-- -----------------------------------------------
ALTER TABLE public.provinces ENABLE ROW LEVEL SECURITY;

CREATE POLICY "provinces_select_all"
  ON public.provinces FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "provinces_admin_write"
  ON public.provinces FOR ALL
  USING (public.is_admin());

-- -----------------------------------------------
-- CLIENTS
-- -----------------------------------------------
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "clients_select_all"
  ON public.clients FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "clients_admin_write"
  ON public.clients FOR ALL
  USING (public.is_admin());

-- -----------------------------------------------
-- SELLERS
-- -----------------------------------------------
ALTER TABLE public.sellers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "sellers_select_all"
  ON public.sellers FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "sellers_admin_write"
  ON public.sellers FOR ALL
  USING (public.is_admin());

-- -----------------------------------------------
-- RESELLERS
-- -----------------------------------------------
ALTER TABLE public.resellers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "resellers_select_all"
  ON public.resellers FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "resellers_admin_write"
  ON public.resellers FOR ALL
  USING (public.is_admin());

-- -----------------------------------------------
-- SUPPLIERS
-- -----------------------------------------------
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "suppliers_select_all"
  ON public.suppliers FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "suppliers_admin_write"
  ON public.suppliers FOR ALL
  USING (public.is_admin());

-- -----------------------------------------------
-- CATALOG ITEMS
-- -----------------------------------------------
ALTER TABLE public.catalog_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "catalog_select_all"
  ON public.catalog_items FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "catalog_admin_write"
  ON public.catalog_items FOR ALL
  USING (public.is_admin());

-- -----------------------------------------------
-- PRICES
-- -----------------------------------------------
ALTER TABLE public.prices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "prices_select_all"
  ON public.prices FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "prices_admin_write"
  ON public.prices FOR ALL
  USING (public.is_admin());

-- -----------------------------------------------
-- INSTALLERS
-- -----------------------------------------------
ALTER TABLE public.installers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "installers_select_all"
  ON public.installers FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "installers_admin_write"
  ON public.installers FOR ALL
  USING (public.is_admin());

-- -----------------------------------------------
-- TRIPS
-- -----------------------------------------------
ALTER TABLE public.trips ENABLE ROW LEVEL SECURITY;

CREATE POLICY "trips_select_all"
  ON public.trips FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "trips_insert_auth"
  ON public.trips FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "trips_update_auth"
  ON public.trips FOR UPDATE
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "trips_delete_admin"
  ON public.trips FOR DELETE
  USING (public.is_admin());

-- -----------------------------------------------
-- TRUCK TYPES
-- -----------------------------------------------
ALTER TABLE public.truck_types ENABLE ROW LEVEL SECURITY;

CREATE POLICY "truck_types_select_all"
  ON public.truck_types FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "truck_types_admin_write"
  ON public.truck_types FOR ALL
  USING (public.is_admin());

-- -----------------------------------------------
-- ORDERS (sistema interno: todos CRUD)
-- -----------------------------------------------
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "orders_select_all"
  ON public.orders FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "orders_insert_auth"
  ON public.orders FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "orders_update_auth"
  ON public.orders FOR UPDATE
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "orders_delete_admin"
  ON public.orders FOR DELETE
  USING (public.is_admin());

-- -----------------------------------------------
-- ORDER ITEMS
-- -----------------------------------------------
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "order_items_select_all"
  ON public.order_items FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "order_items_insert_auth"
  ON public.order_items FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "order_items_update_auth"
  ON public.order_items FOR UPDATE
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "order_items_delete_auth"
  ON public.order_items FOR DELETE
  USING (auth.uid() IS NOT NULL);

-- -----------------------------------------------
-- USER SUBSCRIPTIONS (privado por usuario)
-- -----------------------------------------------
ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_subs_own"
  ON public.user_subscriptions FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- -----------------------------------------------
-- SUBSCRIPTION EXPENSES (privado por usuario)
-- -----------------------------------------------
ALTER TABLE public.subscription_expenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "sub_expenses_own"
  ON public.subscription_expenses FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ============================================================
-- FIN RLS
-- ============================================================
