-- =============================================
-- MIGRACIÓN: Módulo de Cotizaciones
-- Fecha: 2026-03-19
-- =============================================

-- =============================================
-- TIPOS
-- =============================================
CREATE TYPE public.quotation_status AS ENUM (
  'COTIZACION',   -- activa / pendiente de respuesta
  'ACEPTADA',     -- aceptada por el cliente, convertida a pedido
  'CANCELADA'     -- rechazada / descartada
  -- VENCIDA se deriva en UI: status=COTIZACION AND expires_at < CURRENT_DATE
);

-- =============================================
-- SECUENCIA PROPIA  COT-000001
-- =============================================
CREATE SEQUENCE public.quotation_number_seq START 1;

-- =============================================
-- TABLA PRINCIPAL
-- =============================================
CREATE TABLE public.quotations (
  id                  UUID          PRIMARY KEY DEFAULT uuid_generate_v4(),
  quotation_number    TEXT          UNIQUE,

  -- Cliente (snapshot, igual que en orders)
  client_id           UUID          REFERENCES public.clients(id) ON DELETE SET NULL,
  client_name         TEXT          NOT NULL DEFAULT '',
  client_phone        TEXT          NOT NULL DEFAULT '',
  client_document     TEXT          NOT NULL DEFAULT '',
  delivery_address    TEXT          NOT NULL DEFAULT '',
  city                TEXT          NOT NULL DEFAULT '',
  province_id         UUID          NOT NULL REFERENCES public.provinces(id),

  -- Comercial
  channel             public.sales_channel NOT NULL DEFAULT 'INTERNO',
  seller_id           UUID          REFERENCES public.sellers(id) ON DELETE SET NULL,
  reseller_id         UUID          REFERENCES public.resellers(id) ON DELETE SET NULL,

  -- Estado y validez
  status              public.quotation_status NOT NULL DEFAULT 'COTIZACION',
  expires_at          DATE,

  -- Cargos de servicio (paralelo a orders)
  freight_amount      NUMERIC(12,2) NOT NULL DEFAULT 0,
  installation_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  travel_amount       NUMERIC(12,2) NOT NULL DEFAULT 0,
  other_amount        NUMERIC(12,2) NOT NULL DEFAULT 0,

  -- Totales (recalculados automáticamente por triggers)
  subtotal_products   NUMERIC(12,2) NOT NULL DEFAULT 0,
  subtotal_services   NUMERIC(12,2) NOT NULL DEFAULT 0,
  discount_amount     NUMERIC(12,2) NOT NULL DEFAULT 0,
  tax_amount_manual   NUMERIC(12,2) NOT NULL DEFAULT 0,
  total_net           NUMERIC(12,2) NOT NULL DEFAULT 0,

  -- Conversión: enlace al pedido creado al aceptar
  converted_order_id  UUID          REFERENCES public.orders(id) ON DELETE SET NULL,

  notes               TEXT          DEFAULT '',
  created_by          UUID          REFERENCES auth.users(id),
  created_at          TIMESTAMPTZ   NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ   NOT NULL DEFAULT now()
);

-- =============================================
-- TABLA DE ÍTEMS
-- =============================================
CREATE TABLE public.quotation_items (
  id               UUID          PRIMARY KEY DEFAULT uuid_generate_v4(),
  quotation_id     UUID          NOT NULL REFERENCES public.quotations(id) ON DELETE CASCADE,
  catalog_item_id  UUID          NOT NULL REFERENCES public.catalog_items(id),
  type             public.item_type NOT NULL,
  description      TEXT          NOT NULL DEFAULT '',
  quantity         INTEGER       NOT NULL DEFAULT 1 CHECK (quantity > 0),
  unit_price_net   NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (unit_price_net >= 0),
  subtotal_net     NUMERIC(12,2) NOT NULL DEFAULT 0,
  sort_order       INTEGER       NOT NULL DEFAULT 0,
  created_at       TIMESTAMPTZ   NOT NULL DEFAULT now()
);

-- =============================================
-- TRIGGERS
-- =============================================

-- 1. Auto-numeración COT-000001
CREATE OR REPLACE FUNCTION public.set_quotation_number()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.quotation_number IS NULL THEN
    NEW.quotation_number := 'COT-' || LPAD(nextval('public.quotation_number_seq')::TEXT, 6, '0');
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_set_quotation_number
  BEFORE INSERT ON public.quotations
  FOR EACH ROW EXECUTE FUNCTION public.set_quotation_number();

-- 2. Validar reseller cuando canal = REVENDEDOR
CREATE OR REPLACE FUNCTION public.validate_quotation_reseller()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.channel = 'REVENDEDOR' AND NEW.reseller_id IS NULL THEN
    RAISE EXCEPTION 'El revendedor es obligatorio cuando el canal es REVENDEDOR';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_validate_quotation_reseller
  BEFORE INSERT OR UPDATE ON public.quotations
  FOR EACH ROW EXECUTE FUNCTION public.validate_quotation_reseller();

-- 3. Calcular subtotal por ítem
CREATE OR REPLACE FUNCTION public.calc_quotation_item_subtotal()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.subtotal_net := NEW.quantity * NEW.unit_price_net;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_calc_quotation_item_subtotal
  BEFORE INSERT OR UPDATE ON public.quotation_items
  FOR EACH ROW EXECUTE FUNCTION public.calc_quotation_item_subtotal();

-- 4. Actualizar subtotales en quotations cuando cambian los ítems
CREATE OR REPLACE FUNCTION public.update_quotation_subtotals()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE
  v_quotation_id UUID;
BEGIN
  v_quotation_id := COALESCE(NEW.quotation_id, OLD.quotation_id);
  UPDATE public.quotations SET
    subtotal_products = COALESCE((
      SELECT SUM(subtotal_net) FROM public.quotation_items
      WHERE quotation_id = v_quotation_id AND type = 'PRODUCTO'
    ), 0),
    subtotal_services = COALESCE((
      SELECT SUM(subtotal_net) FROM public.quotation_items
      WHERE quotation_id = v_quotation_id AND type = 'SERVICIO'
    ), 0),
    updated_at = now()
  WHERE id = v_quotation_id;
  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER trg_update_quotation_subtotals
  AFTER INSERT OR UPDATE OR DELETE ON public.quotation_items
  FOR EACH ROW EXECUTE FUNCTION public.update_quotation_subtotals();

-- 5. Recalcular total_net en quotations
CREATE OR REPLACE FUNCTION public.recalc_quotation_total()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.total_net := NEW.subtotal_products + NEW.subtotal_services
                   + NEW.freight_amount + NEW.installation_amount
                   + NEW.travel_amount + NEW.other_amount
                   + NEW.tax_amount_manual - NEW.discount_amount;
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_recalc_quotation_total
  BEFORE INSERT OR UPDATE ON public.quotations
  FOR EACH ROW EXECUTE FUNCTION public.recalc_quotation_total();

-- =============================================
-- ÍNDICES
-- =============================================
CREATE INDEX idx_quotations_status     ON public.quotations(status);
CREATE INDEX idx_quotations_channel    ON public.quotations(channel);
CREATE INDEX idx_quotations_expires_at ON public.quotations(expires_at);
CREATE INDEX idx_quotations_created_at ON public.quotations(created_at);
CREATE INDEX idx_quotations_reseller   ON public.quotations(reseller_id);
CREATE INDEX idx_quotation_items_qid   ON public.quotation_items(quotation_id);

-- =============================================
-- ROW LEVEL SECURITY
-- =============================================
ALTER TABLE public.quotations      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quotation_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "quotations_select"       ON public.quotations      FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "quotation_items_select"  ON public.quotation_items FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "quotations_insert"       ON public.quotations      FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "quotation_items_insert"  ON public.quotation_items FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "quotations_update"       ON public.quotations      FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "quotation_items_update"  ON public.quotation_items FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "quotations_delete"       ON public.quotations      FOR DELETE USING (auth.role() = 'authenticated');
CREATE POLICY "quotation_items_delete"  ON public.quotation_items FOR DELETE USING (auth.role() = 'authenticated');

-- =============================================
-- ROLLBACK (ejecutar en Supabase si necesitás revertir)
-- =============================================
-- DROP TABLE IF EXISTS public.quotation_items CASCADE;
-- DROP TABLE IF EXISTS public.quotations CASCADE;
-- DROP TYPE  IF EXISTS public.quotation_status;
-- DROP SEQUENCE IF EXISTS public.quotation_number_seq;
-- DROP FUNCTION IF EXISTS public.set_quotation_number();
-- DROP FUNCTION IF EXISTS public.validate_quotation_reseller();
-- DROP FUNCTION IF EXISTS public.calc_quotation_item_subtotal();
-- DROP FUNCTION IF EXISTS public.update_quotation_subtotals();
-- DROP FUNCTION IF EXISTS public.recalc_quotation_total();
