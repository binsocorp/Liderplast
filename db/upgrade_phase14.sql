-- ============================================================
-- LIDERPLAST — upgrade_phase14.sql
-- PPP (Precio Promedio Ponderado) + Reversión de stock al anular PRD
-- Ejecutar en Supabase SQL Editor
-- ============================================================

-- -----------------------------------------------
-- PASO 1: Agregar columna average_cost a inventory_items
-- (Ejecutar primero, en transacción separada si es necesario)
-- -----------------------------------------------
ALTER TABLE public.inventory_items
  ADD COLUMN IF NOT EXISTS average_cost NUMERIC(12,4) NOT NULL DEFAULT 0;

COMMENT ON COLUMN public.inventory_items.average_cost IS 'Precio Promedio Ponderado (PPP). Se recalcula automáticamente con cada compra.';

-- Inicializar con last_cost para registros existentes
UPDATE public.inventory_items
SET average_cost = last_cost
WHERE average_cost = 0 AND last_cost > 0;

-- -----------------------------------------------
-- PASO 2: Reescribir purchase_item_stock_entry con PPP
-- Reemplaza la versión de migration_inventory_v2.sql
-- -----------------------------------------------
CREATE OR REPLACE FUNCTION public.purchase_item_stock_entry()
RETURNS TRIGGER AS $$
DECLARE
  v_user_id       UUID;
  v_purchase_num  TEXT;
  v_factor        NUMERIC(12,4);
  v_current_stock NUMERIC(12,2);
  v_current_avg   NUMERIC(12,4);
  v_stock_qty     NUMERIC(12,2);
  v_unit_cost     NUMERIC(12,4);
  v_new_avg       NUMERIC(12,4);
BEGIN
  -- Obtener created_by y purchase_number de la cabecera
  SELECT p.created_by, p.purchase_number
  INTO v_user_id, v_purchase_num
  FROM public.purchases p WHERE p.id = NEW.purchase_id;

  -- Obtener factor de conversión, stock actual y costo promedio actual
  -- Se lee ANTES de insertar el movimiento para que el cálculo PPP sea correcto
  SELECT
    COALESCE(conversion_factor, 1),
    current_stock,
    COALESCE(NULLIF(average_cost, 0), NULLIF(last_cost, 0), 0)
  INTO v_factor, v_current_stock, v_current_avg
  FROM public.inventory_items WHERE id = NEW.item_id;

  -- Convertir cantidad de compra a unidades de consumo
  v_stock_qty := NEW.quantity * v_factor;

  -- Costo por unidad de consumo
  v_unit_cost := CASE WHEN v_factor > 0 THEN NEW.unit_price / v_factor ELSE NEW.unit_price END;

  -- Calcular PPP:
  -- PPP = (stock_actual × costo_prom_actual + qty_nueva × costo_unit) / (stock_actual + qty_nueva)
  IF (v_current_stock + v_stock_qty) > 0 THEN
    v_new_avg := (v_current_stock * v_current_avg + v_stock_qty * v_unit_cost) / (v_current_stock + v_stock_qty);
  ELSE
    v_new_avg := v_unit_cost;
  END IF;

  -- Crear movimiento ENTRADA (dispara trg_update_stock_on_movement que actualiza current_stock)
  INSERT INTO public.inventory_movements (item_id, type, quantity, description, reference, created_by)
  VALUES (
    NEW.item_id,
    'ENTRADA',
    v_stock_qty,
    'Compra automática',
    v_purchase_num,
    v_user_id
  );

  -- Actualizar last_cost y average_cost (PPP)
  UPDATE public.inventory_items
  SET last_cost    = v_unit_cost,
      average_cost = v_new_avg,
      updated_at   = now()
  WHERE id = NEW.item_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- -----------------------------------------------
-- PASO 3: Trigger de reversión de stock al anular producción
-- Cuando status cambia a 'ANULADA':
--   A) SALIDA del producto final
--   B) ENTRADA de cada materia prima del BOM × cantidad producida
-- -----------------------------------------------
CREATE OR REPLACE FUNCTION public.production_stock_revert()
RETURNS TRIGGER AS $$
DECLARE
  v_bom         RECORD;
  v_consumption NUMERIC(12,2);
BEGIN
  -- Solo procesar si status cambia a ANULADA desde otro estado
  IF NEW.status != 'ANULADA' OR OLD.status = 'ANULADA' THEN
    RETURN NEW;
  END IF;

  -- A) SALIDA del producto final (revierte la entrada original)
  INSERT INTO public.inventory_movements (item_id, type, quantity, description, reference, created_by)
  VALUES (
    NEW.product_id,
    'SALIDA',
    NEW.quantity,
    'Anulación de producción',
    NEW.production_number,
    NEW.created_by
  );

  -- B) ENTRADA de cada componente BOM (devuelve las materias primas)
  FOR v_bom IN
    SELECT bi.material_id, bi.quantity_per_unit
    FROM public.bom_items bi
    WHERE bi.product_id = NEW.product_id
  LOOP
    v_consumption := v_bom.quantity_per_unit * NEW.quantity;

    INSERT INTO public.inventory_movements (item_id, type, quantity, description, reference, created_by)
    VALUES (
      v_bom.material_id,
      'ENTRADA',
      v_consumption,
      'Devolución por anulación de producción',
      NEW.production_number,
      NEW.created_by
    );
  END LOOP;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_production_stock_revert
  AFTER UPDATE ON public.production_records
  FOR EACH ROW EXECUTE FUNCTION public.production_stock_revert();

-- ============================================================
-- FIN upgrade_phase14.sql
-- ============================================================
