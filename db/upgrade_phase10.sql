-- ============================================================
-- LIDERPLAST — Upgrade Script Phase 10 (Cotización Pileta)
-- Ejecutar en Supabase SQL Editor para actualizar la base de datos
-- ============================================================

-- 1. Agregar nuevas columnas a la tabla orders
ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS client_document TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS client_phone TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS distance_km NUMERIC(10,2) NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS freight_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS installation_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS travel_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS other_amount NUMERIC(12,2) NOT NULL DEFAULT 0;

-- 1b. Agregar columna document a clients
ALTER TABLE public.clients
ADD COLUMN IF NOT EXISTS document TEXT DEFAULT '';

-- 2. Actualizar el trigger de recalcular total (para incluir los nuevos cargos de servicio)
CREATE OR REPLACE FUNCTION public.recalc_order_total()
RETURNS TRIGGER AS $$
BEGIN
  -- Total Neto = Subtotales Items + Cargos Adicionales - Descuento + Impuestos Manuales
  NEW.total_net := NEW.subtotal_products + NEW.subtotal_services
                   + NEW.freight_amount + NEW.installation_amount 
                   + NEW.travel_amount + NEW.other_amount
                   - NEW.discount_amount + NEW.tax_amount_manual;
  NEW.updated_at := now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. Forzar recalculo en todas las ordenes existentes
UPDATE public.orders SET updated_at = now();

