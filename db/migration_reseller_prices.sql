-- -----------------------------------------------
-- 1. Tablas para Listas de Precios de Revendedores
-- -----------------------------------------------

CREATE TABLE IF NOT EXISTS public.reseller_price_lists (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        TEXT NOT NULL UNIQUE,
  is_active   BOOLEAN NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.reseller_prices (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  price_list_id   UUID NOT NULL REFERENCES public.reseller_price_lists(id) ON DELETE CASCADE,
  catalog_item_id UUID NOT NULL REFERENCES public.catalog_items(id) ON DELETE CASCADE,
  unit_price_net  NUMERIC(12,2) NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(price_list_id, catalog_item_id)
);

-- -----------------------------------------------
-- 2. Modificaciones en la tabla Resellers y Orders
-- -----------------------------------------------

-- Permitir asociar una lista de precios por defecto a un revendedor
ALTER TABLE public.resellers ADD COLUMN IF NOT EXISTS default_price_list_id UUID REFERENCES public.reseller_price_lists(id);

-- En orders ya existe reseller_id, pero agregamos explícitamente el canal si no estuviera bien definido o para asegurar consistencia
-- El tipo sales_channel ya existe: 'INTERNO', 'REVENDEDOR'

-- -----------------------------------------------
-- 3. RLS Policies
-- -----------------------------------------------

ALTER TABLE public.reseller_price_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reseller_prices ENABLE ROW LEVEL SECURITY;

-- Select: Todos los autenticados pueden leer (para el formulario)
CREATE POLICY "reseller_price_lists_select_all" ON public.reseller_price_lists FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "reseller_prices_select_all" ON public.reseller_prices FOR SELECT USING (auth.uid() IS NOT NULL);

-- Admin: Todo el control
CREATE POLICY "reseller_price_lists_admin_all" ON public.reseller_price_lists FOR ALL USING (public.is_admin());
CREATE POLICY "reseller_prices_admin_all" ON public.reseller_prices FOR ALL USING (public.is_admin());
