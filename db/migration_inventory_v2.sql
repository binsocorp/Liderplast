-- ============================================================
-- LIDERPLAST — Migration: Inventory Module v2
-- Phase 2: BOM, Production, Unit Conversion
-- Ejecutar en Supabase SQL Editor DESPUÉS de migration_inventory_v1
-- ============================================================

-- -----------------------------------------------
-- 1) ALTER inventory_items: purchase_unit + conversion_factor
-- -----------------------------------------------
ALTER TABLE public.inventory_items
  ADD COLUMN purchase_unit TEXT DEFAULT NULL,
  ADD COLUMN conversion_factor NUMERIC(12,4) NOT NULL DEFAULT 1;

COMMENT ON COLUMN public.inventory_items.unit IS 'Unidad de consumo (kg, litro, unidad, etc.)';
COMMENT ON COLUMN public.inventory_items.purchase_unit IS 'Unidad de compra (bolsa, bidón, rollo...). NULL = misma que unit';
COMMENT ON COLUMN public.inventory_items.conversion_factor IS '1 purchase_unit = X unit. Ej: 1 bolsa = 25 kg → factor=25';

-- -----------------------------------------------
-- 2) BOM ITEMS (Lista de materiales)
-- -----------------------------------------------
CREATE TABLE public.bom_items (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id        UUID NOT NULL REFERENCES public.inventory_items(id) ON DELETE CASCADE,
  material_id       UUID NOT NULL REFERENCES public.inventory_items(id) ON DELETE CASCADE,
  quantity_per_unit  NUMERIC(12,4) NOT NULL CHECK (quantity_per_unit > 0),
  notes             TEXT DEFAULT '',
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(product_id, material_id)
);

CREATE INDEX idx_bom_product  ON public.bom_items(product_id);
CREATE INDEX idx_bom_material ON public.bom_items(material_id);

-- Constraint: product_id must be PRODUCTO_FINAL
CREATE OR REPLACE FUNCTION public.validate_bom_product_type()
RETURNS TRIGGER AS $$
DECLARE
  v_type inventory_item_type;
BEGIN
  SELECT type INTO v_type FROM public.inventory_items WHERE id = NEW.product_id;
  IF v_type != 'PRODUCTO_FINAL' THEN
    RAISE EXCEPTION 'El producto de la BOM debe ser de tipo PRODUCTO_FINAL';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_validate_bom_product_type
  BEFORE INSERT OR UPDATE ON public.bom_items
  FOR EACH ROW EXECUTE FUNCTION public.validate_bom_product_type();

-- -----------------------------------------------
-- 3) PRODUCTION RECORDS
-- -----------------------------------------------
CREATE TABLE public.production_records (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  production_number TEXT UNIQUE,
  product_id        UUID NOT NULL REFERENCES public.inventory_items(id),
  quantity          NUMERIC(12,2) NOT NULL CHECK (quantity > 0),
  production_date   DATE NOT NULL DEFAULT CURRENT_DATE,
  notes             TEXT DEFAULT '',
  status            TEXT NOT NULL DEFAULT 'CONFIRMADA',
  created_by        UUID REFERENCES auth.users(id),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_production_product ON public.production_records(product_id);
CREATE INDEX idx_production_date    ON public.production_records(production_date);
CREATE INDEX idx_production_status  ON public.production_records(status);

-- Auto-number production_number
CREATE SEQUENCE IF NOT EXISTS production_number_seq START 1;

CREATE OR REPLACE FUNCTION public.generate_production_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.production_number IS NULL OR NEW.production_number = '' THEN
    NEW.production_number := 'PRD-' || LPAD(nextval('production_number_seq')::TEXT, 6, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_production_number
  BEFORE INSERT ON public.production_records
  FOR EACH ROW EXECUTE FUNCTION public.generate_production_number();

-- -----------------------------------------------
-- 4) TRIGGER: Production stock impact
-- Al insertar production_record:
--   a) ENTRADA del producto final
--   b) SALIDA de cada material BOM × cantidad producida
-- -----------------------------------------------
CREATE OR REPLACE FUNCTION public.production_stock_impact()
RETURNS TRIGGER AS $$
DECLARE
  v_bom RECORD;
  v_consumption NUMERIC(12,2);
  v_current NUMERIC(12,2);
BEGIN
  -- Solo procesar si estado es CONFIRMADA
  IF NEW.status != 'CONFIRMADA' THEN
    RETURN NEW;
  END IF;

  -- A) ENTRADA del producto final
  INSERT INTO public.inventory_movements (item_id, type, quantity, description, reference, created_by)
  VALUES (
    NEW.product_id,
    'ENTRADA',
    NEW.quantity,
    'Producción automática',
    NEW.production_number,
    NEW.created_by
  );

  -- B) SALIDA de cada componente BOM
  FOR v_bom IN
    SELECT bi.material_id, bi.quantity_per_unit, ii.name, ii.current_stock
    FROM public.bom_items bi
    JOIN public.inventory_items ii ON ii.id = bi.material_id
    WHERE bi.product_id = NEW.product_id
  LOOP
    v_consumption := v_bom.quantity_per_unit * NEW.quantity;

    -- Check stock (the movement trigger also checks, but we give a better message here)
    IF v_bom.current_stock < v_consumption THEN
      RAISE EXCEPTION 'Stock insuficiente de "%". Necesario: %, Disponible: %',
        v_bom.name, v_consumption, v_bom.current_stock;
    END IF;

    INSERT INTO public.inventory_movements (item_id, type, quantity, description, reference, created_by)
    VALUES (
      v_bom.material_id,
      'SALIDA',
      v_consumption,
      'Consumo por producción',
      NEW.production_number,
      NEW.created_by
    );
  END LOOP;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_production_stock_impact
  AFTER INSERT ON public.production_records
  FOR EACH ROW EXECUTE FUNCTION public.production_stock_impact();

-- -----------------------------------------------
-- 5) UPDATE purchase trigger: apply conversion_factor
-- When purchasing, convert purchase quantity to consumption units
-- -----------------------------------------------
CREATE OR REPLACE FUNCTION public.purchase_item_stock_entry()
RETURNS TRIGGER AS $$
DECLARE
  v_user_id UUID;
  v_purchase_num TEXT;
  v_factor NUMERIC(12,4);
  v_stock_qty NUMERIC(12,2);
BEGIN
  -- Get purchase header info
  SELECT p.created_by, p.purchase_number
  INTO v_user_id, v_purchase_num
  FROM public.purchases p WHERE p.id = NEW.purchase_id;

  -- Get conversion factor
  SELECT COALESCE(conversion_factor, 1)
  INTO v_factor
  FROM public.inventory_items WHERE id = NEW.item_id;

  -- Convert: if purchase is in purchase_units, multiply by factor to get consumption units
  v_stock_qty := NEW.quantity * v_factor;

  -- Create stock entry in consumption units (triggers trg_update_stock_on_movement)
  INSERT INTO public.inventory_movements (item_id, type, quantity, description, reference, created_by)
  VALUES (
    NEW.item_id,
    'ENTRADA',
    v_stock_qty,
    'Compra automática',
    v_purchase_num,
    v_user_id
  );

  -- Update last cost (per consumption unit)
  UPDATE public.inventory_items
  SET last_cost = CASE WHEN v_factor > 0 THEN NEW.unit_price / v_factor ELSE NEW.unit_price END,
      updated_at = now()
  WHERE id = NEW.item_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- FIN MIGRATION INVENTORY V2
-- ============================================================
