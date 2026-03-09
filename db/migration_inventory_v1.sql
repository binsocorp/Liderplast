-- ============================================================
-- LIDERPLAST — Migration: Inventory Module v1
-- Ejecutar en Supabase SQL Editor
-- ============================================================

-- -----------------------------------------------
-- 1) ENUM TYPES
-- -----------------------------------------------
CREATE TYPE inventory_item_type AS ENUM ('MATERIA_PRIMA', 'INSUMO', 'PRODUCTO_FINAL');
CREATE TYPE movement_type       AS ENUM ('ENTRADA', 'SALIDA', 'AJUSTE');
CREATE TYPE purchase_status     AS ENUM ('BORRADOR', 'CONFIRMADA', 'ANULADA');

-- -----------------------------------------------
-- 2) INVENTORY ITEMS
-- -----------------------------------------------
CREATE TABLE public.inventory_items (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name          TEXT NOT NULL,
  type          inventory_item_type NOT NULL DEFAULT 'MATERIA_PRIMA',
  unit          TEXT NOT NULL DEFAULT 'unidad',
  current_stock NUMERIC(12,2) NOT NULL DEFAULT 0,
  min_stock     NUMERIC(12,2) NOT NULL DEFAULT 0,
  last_cost     NUMERIC(12,2) NOT NULL DEFAULT 0,
  is_active     BOOLEAN NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_inventory_items_type   ON public.inventory_items(type);
CREATE INDEX idx_inventory_items_active ON public.inventory_items(is_active);

-- -----------------------------------------------
-- 3) INVENTORY MOVEMENTS
-- -----------------------------------------------
CREATE TABLE public.inventory_movements (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  item_id     UUID NOT NULL REFERENCES public.inventory_items(id) ON DELETE CASCADE,
  type        movement_type NOT NULL,
  quantity    NUMERIC(12,2) NOT NULL CHECK (quantity > 0),
  description TEXT DEFAULT '',
  reference   TEXT DEFAULT '',
  created_by  UUID REFERENCES auth.users(id),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_inv_movements_item ON public.inventory_movements(item_id);
CREATE INDEX idx_inv_movements_type ON public.inventory_movements(type);
CREATE INDEX idx_inv_movements_date ON public.inventory_movements(created_at);

-- -----------------------------------------------
-- 4) PURCHASES (cabecera)
-- -----------------------------------------------
CREATE TABLE public.purchases (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  purchase_number TEXT UNIQUE,
  supplier_name   TEXT NOT NULL DEFAULT '',
  purchase_date   DATE NOT NULL DEFAULT CURRENT_DATE,
  voucher_type    TEXT DEFAULT '',
  voucher_number  TEXT DEFAULT '',
  notes           TEXT DEFAULT '',
  total           NUMERIC(12,2) NOT NULL DEFAULT 0,
  status          purchase_status NOT NULL DEFAULT 'CONFIRMADA',
  created_by      UUID REFERENCES auth.users(id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_purchases_date   ON public.purchases(purchase_date);
CREATE INDEX idx_purchases_status ON public.purchases(status);

-- Auto-number purchase_number
CREATE SEQUENCE IF NOT EXISTS purchase_number_seq START 1;

CREATE OR REPLACE FUNCTION public.generate_purchase_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.purchase_number IS NULL OR NEW.purchase_number = '' THEN
    NEW.purchase_number := 'CMP-' || LPAD(nextval('purchase_number_seq')::TEXT, 6, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_purchase_number
  BEFORE INSERT ON public.purchases
  FOR EACH ROW EXECUTE FUNCTION public.generate_purchase_number();

-- -----------------------------------------------
-- 5) PURCHASE ITEMS (líneas de compra)
-- -----------------------------------------------
CREATE TABLE public.purchase_items (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  purchase_id UUID NOT NULL REFERENCES public.purchases(id) ON DELETE CASCADE,
  item_id     UUID NOT NULL REFERENCES public.inventory_items(id),
  quantity    NUMERIC(12,2) NOT NULL CHECK (quantity > 0),
  unit_price  NUMERIC(12,2) NOT NULL DEFAULT 0,
  subtotal    NUMERIC(12,2) NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_purchase_items_purchase ON public.purchase_items(purchase_id);
CREATE INDEX idx_purchase_items_item     ON public.purchase_items(item_id);

-- -----------------------------------------------
-- 6) TRIGGERS
-- -----------------------------------------------

-- 6a) Calcular subtotal de purchase_item
CREATE OR REPLACE FUNCTION public.calc_purchase_item_subtotal()
RETURNS TRIGGER AS $$
BEGIN
  NEW.subtotal := NEW.quantity * NEW.unit_price;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_calc_purchase_item_subtotal
  BEFORE INSERT OR UPDATE ON public.purchase_items
  FOR EACH ROW EXECUTE FUNCTION public.calc_purchase_item_subtotal();

-- 6b) Recalcular total de la compra cuando cambian items
CREATE OR REPLACE FUNCTION public.update_purchase_total()
RETURNS TRIGGER AS $$
DECLARE
  v_purchase_id UUID;
BEGIN
  IF TG_OP = 'DELETE' THEN
    v_purchase_id := OLD.purchase_id;
  ELSE
    v_purchase_id := NEW.purchase_id;
  END IF;

  UPDATE public.purchases
  SET total = COALESCE((
    SELECT SUM(subtotal) FROM public.purchase_items WHERE purchase_id = v_purchase_id
  ), 0),
  updated_at = now()
  WHERE id = v_purchase_id;

  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_purchase_total
  AFTER INSERT OR UPDATE OR DELETE ON public.purchase_items
  FOR EACH ROW EXECUTE FUNCTION public.update_purchase_total();

-- 6c) Actualizar stock al registrar un movimiento manual
CREATE OR REPLACE FUNCTION public.update_stock_on_movement()
RETURNS TRIGGER AS $$
DECLARE
  v_new_stock NUMERIC(12,2);
BEGIN
  IF NEW.type = 'ENTRADA' THEN
    UPDATE public.inventory_items
    SET current_stock = current_stock + NEW.quantity,
        updated_at = now()
    WHERE id = NEW.item_id;

  ELSIF NEW.type = 'SALIDA' THEN
    -- Verificar stock suficiente
    SELECT current_stock INTO v_new_stock
    FROM public.inventory_items WHERE id = NEW.item_id;

    IF v_new_stock < NEW.quantity THEN
      RAISE EXCEPTION 'Stock insuficiente. Stock actual: %, Cantidad solicitada: %', v_new_stock, NEW.quantity;
    END IF;

    UPDATE public.inventory_items
    SET current_stock = current_stock - NEW.quantity,
        updated_at = now()
    WHERE id = NEW.item_id;

  ELSIF NEW.type = 'AJUSTE' THEN
    UPDATE public.inventory_items
    SET current_stock = NEW.quantity,
        updated_at = now()
    WHERE id = NEW.item_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_stock_on_movement
  AFTER INSERT ON public.inventory_movements
  FOR EACH ROW EXECUTE FUNCTION public.update_stock_on_movement();

-- 6d) Al insertar purchase_item, crear movimiento de entrada y actualizar last_cost
CREATE OR REPLACE FUNCTION public.purchase_item_stock_entry()
RETURNS TRIGGER AS $$
DECLARE
  v_user_id UUID;
  v_purchase_num TEXT;
BEGIN
  -- Obtener created_by y purchase_number de la cabecera
  SELECT p.created_by, p.purchase_number
  INTO v_user_id, v_purchase_num
  FROM public.purchases p WHERE p.id = NEW.purchase_id;

  -- Crear movimiento de entrada (esto dispara trg_update_stock_on_movement)
  INSERT INTO public.inventory_movements (item_id, type, quantity, description, reference, created_by)
  VALUES (
    NEW.item_id,
    'ENTRADA',
    NEW.quantity,
    'Compra automática',
    v_purchase_num,
    v_user_id
  );

  -- Actualizar último costo
  UPDATE public.inventory_items
  SET last_cost = NEW.unit_price,
      updated_at = now()
  WHERE id = NEW.item_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_purchase_item_stock_entry
  AFTER INSERT ON public.purchase_items
  FOR EACH ROW EXECUTE FUNCTION public.purchase_item_stock_entry();

-- ============================================================
-- FIN MIGRATION INVENTORY V1
-- ============================================================
