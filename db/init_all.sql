-- ============================================================
-- LIDERPLAST — Master Initialization Script
-- Fábrica de piletas de fibra — Sistema de gestión
-- Ejecutar TODO LA VEZ en Supabase SQL Editor
-- (Combina Schema, RLS policies y Provincias)
-- ============================================================

-- -----------------------------------------------
-- 0) EXTENSIONES
-- -----------------------------------------------
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- -----------------------------------------------
-- 1) ENUM TYPES
-- -----------------------------------------------
CREATE TYPE user_role       AS ENUM ('ADMIN', 'USER');
CREATE TYPE sales_channel   AS ENUM ('INTERNO', 'REVENDEDOR');
CREATE TYPE order_status    AS ENUM (
  'BORRADOR',
  'CONFIRMADO',
  'EN_PRODUCCION',
  'PRODUCIDO',
  'VIAJE_ASIGNADO',
  'ENTREGADO',
  'CANCELADO'
);
CREATE TYPE item_type       AS ENUM ('PRODUCTO', 'SERVICIO');
CREATE TYPE seller_type     AS ENUM ('INTERNO', 'REVENDEDOR');
CREATE TYPE billing_cycle   AS ENUM ('MONTHLY', 'YEARLY', 'OTHER');
CREATE TYPE subscription_status AS ENUM ('ACTIVE', 'PAUSED', 'CANCELLED');

-- -----------------------------------------------
-- 2) PROFILES (extiende auth.users)
-- -----------------------------------------------
CREATE TABLE public.profiles (
  id                  UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name           TEXT NOT NULL DEFAULT '',
  role                user_role NOT NULL DEFAULT 'USER',
  can_override_prices BOOLEAN NOT NULL DEFAULT FALSE,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Trigger: crear profile al registrarse
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', ''));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- -----------------------------------------------
-- 3) PROVINCES
-- -----------------------------------------------
CREATE TABLE public.provinces (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        TEXT NOT NULL UNIQUE,
  is_sellable BOOLEAN NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_provinces_sellable ON public.provinces(is_sellable);

-- -----------------------------------------------
-- 4) CLIENTS
-- -----------------------------------------------
CREATE TABLE public.clients (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name            TEXT NOT NULL,
  phone           TEXT DEFAULT '',
  email           TEXT DEFAULT '',
  address         TEXT DEFAULT '',
  city            TEXT DEFAULT '',
  province_id     UUID REFERENCES public.provinces(id),
  notes           TEXT DEFAULT '',
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_clients_province ON public.clients(province_id);

-- -----------------------------------------------
-- 5) SELLERS
-- -----------------------------------------------
CREATE TABLE public.sellers (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        TEXT NOT NULL,
  type        seller_type NOT NULL DEFAULT 'INTERNO',
  phone       TEXT DEFAULT '',
  email       TEXT DEFAULT '',
  is_active   BOOLEAN NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- -----------------------------------------------
-- 6) RESELLERS
-- -----------------------------------------------
CREATE TABLE public.resellers (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        TEXT NOT NULL,
  contact     TEXT DEFAULT '',
  phone       TEXT DEFAULT '',
  email       TEXT DEFAULT '',
  province_id UUID REFERENCES public.provinces(id),
  is_active   BOOLEAN NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- -----------------------------------------------
-- 7) SUPPLIERS
-- -----------------------------------------------
CREATE TABLE public.suppliers (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        TEXT NOT NULL,
  contact     TEXT DEFAULT '',
  phone       TEXT DEFAULT '',
  email       TEXT DEFAULT '',
  category    TEXT DEFAULT '',
  is_active   BOOLEAN NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- -----------------------------------------------
-- 8) CATALOG ITEMS (productos y servicios)
-- -----------------------------------------------
CREATE TABLE public.catalog_items (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        TEXT NOT NULL,
  type        item_type NOT NULL,
  description TEXT DEFAULT '',
  sku         TEXT DEFAULT '',
  is_active   BOOLEAN NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_catalog_type ON public.catalog_items(type);

-- -----------------------------------------------
-- 9) PRICES (matriz item × provincia)
-- -----------------------------------------------
CREATE TABLE public.prices (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  catalog_item_id UUID NOT NULL REFERENCES public.catalog_items(id) ON DELETE CASCADE,
  province_id     UUID NOT NULL REFERENCES public.provinces(id) ON DELETE CASCADE,
  unit_price_net  NUMERIC(12,2) NOT NULL DEFAULT 0,
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(catalog_item_id, province_id)
);

CREATE INDEX idx_prices_catalog ON public.prices(catalog_item_id);
CREATE INDEX idx_prices_province ON public.prices(province_id);

-- -----------------------------------------------
-- 10) INSTALLERS
-- -----------------------------------------------
CREATE TABLE public.installers (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        TEXT NOT NULL,
  phone       TEXT DEFAULT '',
  email       TEXT DEFAULT '',
  zone        TEXT DEFAULT '',
  is_active   BOOLEAN NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- -----------------------------------------------
-- 11) TRIPS
-- -----------------------------------------------
CREATE TABLE public.trips (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trip_code   TEXT UNIQUE,
  description TEXT DEFAULT '',
  destination TEXT DEFAULT '',
  date        DATE,
  status      TEXT NOT NULL DEFAULT 'PENDIENTE',
  notes       TEXT DEFAULT '',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Auto-number trip_code
CREATE SEQUENCE IF NOT EXISTS trip_code_seq START 1;

CREATE OR REPLACE FUNCTION public.generate_trip_code()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.trip_code IS NULL OR NEW.trip_code = '' THEN
    NEW.trip_code := 'VJ-' || LPAD(nextval('trip_code_seq')::TEXT, 5, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_trip_code
  BEFORE INSERT ON public.trips
  FOR EACH ROW EXECUTE FUNCTION public.generate_trip_code();

-- -----------------------------------------------
-- 12) ORDERS
-- -----------------------------------------------
CREATE TABLE public.orders (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_number        TEXT UNIQUE,
  
  -- Cliente y entrega
  client_id           UUID REFERENCES public.clients(id),
  client_name         TEXT NOT NULL DEFAULT '',
  delivery_address    TEXT NOT NULL DEFAULT '',
  city                TEXT NOT NULL DEFAULT '',
  province_id         UUID NOT NULL REFERENCES public.provinces(id),
  
  -- Info comercial
  channel             sales_channel NOT NULL DEFAULT 'INTERNO',
  seller_id           UUID REFERENCES public.sellers(id),
  reseller_id         UUID REFERENCES public.resellers(id),
  
  -- Estado
  status              order_status NOT NULL DEFAULT 'BORRADOR',
  
  -- Totales
  subtotal_products   NUMERIC(12,2) NOT NULL DEFAULT 0,
  subtotal_services   NUMERIC(12,2) NOT NULL DEFAULT 0,
  discount_amount     NUMERIC(12,2) NOT NULL DEFAULT 0,
  tax_amount_manual   NUMERIC(12,2) NOT NULL DEFAULT 0,
  total_net           NUMERIC(12,2) NOT NULL DEFAULT 0,
  
  -- Operativo
  trip_id             UUID REFERENCES public.trips(id),
  installer_id        UUID REFERENCES public.installers(id),
  
  -- Notas
  notes               TEXT DEFAULT '',
  
  -- Auditoría
  created_by          UUID REFERENCES auth.users(id),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_orders_status     ON public.orders(status);
CREATE INDEX idx_orders_province   ON public.orders(province_id);
CREATE INDEX idx_orders_channel    ON public.orders(channel);
CREATE INDEX idx_orders_trip       ON public.orders(trip_id);
CREATE INDEX idx_orders_reseller   ON public.orders(reseller_id);
CREATE INDEX idx_orders_created_at ON public.orders(created_at);

-- Auto-number order_number
CREATE SEQUENCE IF NOT EXISTS order_number_seq START 1;

CREATE OR REPLACE FUNCTION public.generate_order_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.order_number IS NULL OR NEW.order_number = '' THEN
    NEW.order_number := 'PED-' || LPAD(nextval('order_number_seq')::TEXT, 6, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_order_number
  BEFORE INSERT ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.generate_order_number();

-- Validar provincia vendible
CREATE OR REPLACE FUNCTION public.validate_order_province()
RETURNS TRIGGER AS $$
DECLARE
  v_sellable BOOLEAN;
BEGIN
  SELECT is_sellable INTO v_sellable
  FROM public.provinces WHERE id = NEW.province_id;
  
  IF v_sellable IS NULL THEN
    RAISE EXCEPTION 'Provincia no encontrada';
  END IF;
  
  IF NOT v_sellable THEN
    RAISE EXCEPTION 'No se puede crear un pedido en una provincia no vendible';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_validate_order_province
  BEFORE INSERT OR UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.validate_order_province();

-- Validar reseller requerido cuando canal = REVENDEDOR
CREATE OR REPLACE FUNCTION public.validate_order_reseller()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.channel = 'REVENDEDOR' AND NEW.reseller_id IS NULL THEN
    RAISE EXCEPTION 'El campo revendedor es obligatorio cuando el canal es REVENDEDOR';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_validate_order_reseller
  BEFORE INSERT OR UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.validate_order_reseller();

-- Validar VIAJE_ASIGNADO requiere trip_id
CREATE OR REPLACE FUNCTION public.validate_order_trip_status()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'VIAJE_ASIGNADO' AND NEW.trip_id IS NULL THEN
    RAISE EXCEPTION 'Un pedido con estado VIAJE_ASIGNADO requiere un viaje asignado';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_validate_order_trip_status
  BEFORE INSERT OR UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.validate_order_trip_status();

-- Recalcular total_net
CREATE OR REPLACE FUNCTION public.recalc_order_total()
RETURNS TRIGGER AS $$
BEGIN
  NEW.total_net := NEW.subtotal_products + NEW.subtotal_services
                   - NEW.discount_amount + NEW.tax_amount_manual;
  NEW.updated_at := now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_recalc_order_total
  BEFORE INSERT OR UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.recalc_order_total();

-- -----------------------------------------------
-- 13) ORDER ITEMS
-- -----------------------------------------------
CREATE TABLE public.order_items (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id        UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  catalog_item_id UUID NOT NULL REFERENCES public.catalog_items(id),
  type            item_type NOT NULL,
  description     TEXT NOT NULL DEFAULT '',
  quantity        INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
  unit_price_net  NUMERIC(12,2) NOT NULL DEFAULT 0,
  subtotal_net    NUMERIC(12,2) NOT NULL DEFAULT 0,
  sort_order      INTEGER NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_order_items_order ON public.order_items(order_id);
CREATE INDEX idx_order_items_type  ON public.order_items(type);

-- Calcular subtotal_net del item
CREATE OR REPLACE FUNCTION public.calc_item_subtotal()
RETURNS TRIGGER AS $$
BEGIN
  NEW.subtotal_net := NEW.quantity * NEW.unit_price_net;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_calc_item_subtotal
  BEFORE INSERT OR UPDATE ON public.order_items
  FOR EACH ROW EXECUTE FUNCTION public.calc_item_subtotal();

-- Actualizar subtotales del pedido cuando cambian items
CREATE OR REPLACE FUNCTION public.update_order_subtotals()
RETURNS TRIGGER AS $$
DECLARE
  v_order_id UUID;
  v_sub_products NUMERIC(12,2);
  v_sub_services NUMERIC(12,2);
BEGIN
  -- Determinar order_id según operación
  IF TG_OP = 'DELETE' THEN
    v_order_id := OLD.order_id;
  ELSE
    v_order_id := NEW.order_id;
  END IF;

  -- Recalcular subtotales
  SELECT
    COALESCE(SUM(CASE WHEN type = 'PRODUCTO' THEN subtotal_net ELSE 0 END), 0),
    COALESCE(SUM(CASE WHEN type = 'SERVICIO' THEN subtotal_net ELSE 0 END), 0)
  INTO v_sub_products, v_sub_services
  FROM public.order_items
  WHERE order_id = v_order_id;

  -- Actualizar orden (esto dispara recalc_order_total)
  UPDATE public.orders
  SET subtotal_products = v_sub_products,
      subtotal_services = v_sub_services
  WHERE id = v_order_id;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_order_subtotals
  AFTER INSERT OR UPDATE OR DELETE ON public.order_items
  FOR EACH ROW EXECUTE FUNCTION public.update_order_subtotals();

-- -----------------------------------------------
-- 14) USER SUBSCRIPTIONS (personal)
-- -----------------------------------------------
CREATE TABLE public.user_subscriptions (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  vendor          TEXT DEFAULT '',
  category        TEXT DEFAULT '',
  status          subscription_status NOT NULL DEFAULT 'ACTIVE',
  billing_cycle   billing_cycle NOT NULL DEFAULT 'MONTHLY',
  currency        TEXT NOT NULL DEFAULT 'ARS' CHECK (currency IN ('ARS', 'USD')),
  amount          NUMERIC(12,2) NOT NULL DEFAULT 0,
  start_date      DATE,
  renewal_date    DATE,
  payment_method  TEXT DEFAULT '',
  notes           TEXT DEFAULT '',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_user_subs_user ON public.user_subscriptions(user_id);

-- -----------------------------------------------
-- 15) SUBSCRIPTION EXPENSES (personal)
-- -----------------------------------------------
CREATE TABLE public.subscription_expenses (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id           UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subscription_id   UUID REFERENCES public.user_subscriptions(id) ON DELETE SET NULL,
  expense_date      DATE NOT NULL DEFAULT CURRENT_DATE,
  period_year       INTEGER NOT NULL,
  period_month      INTEGER NOT NULL CHECK (period_month BETWEEN 1 AND 12),
  amount            NUMERIC(12,2) NOT NULL DEFAULT 0,
  currency          TEXT NOT NULL DEFAULT 'ARS' CHECK (currency IN ('ARS', 'USD')),
  vendor_snapshot   TEXT DEFAULT '',
  note              TEXT DEFAULT '',
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_sub_expenses_user ON public.subscription_expenses(user_id);
CREATE INDEX idx_sub_expenses_sub  ON public.subscription_expenses(subscription_id);

-- ============================================================
-- 16) RLS POLICIES (Row Level Security)
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

CREATE POLICY "trips_admin_write"
  ON public.trips FOR ALL
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
-- 17) SEED DATA (Provincias)
-- ============================================================
INSERT INTO public.provinces (name, is_sellable) VALUES
  ('Buenos Aires', true),
  ('Ciudad Autónoma de Buenos Aires', true),
  ('Catamarca', true),
  ('Chaco', true),
  ('Chubut', true),
  ('Córdoba', true),
  ('Corrientes', true),
  ('Entre Ríos', true),
  ('Formosa', true),
  ('Jujuy', true),
  ('La Pampa', true),
  ('La Rioja', true),
  ('Mendoza', true),
  ('Misiones', true),
  ('Neuquén', true),
  ('Río Negro', true),
  ('Salta', true),
  ('San Juan', true),
  ('San Luis', true),
  ('Santa Cruz', true),
  ('Santa Fe', true),
  ('Santiago del Estero', true),
  ('Tierra del Fuego', true),
  ('Tucumán', true)
ON CONFLICT (name) DO NOTHING;
