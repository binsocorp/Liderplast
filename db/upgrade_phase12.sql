-- ============================================================
-- LIDERPLAST — Upgrade Phase 12
-- BUG-01: payment_status PARTIAL
-- BUG-03: purchases.supplier_id FK
-- COT-01: quotation_status CANCELADA → RECHAZADA
--
-- INSTRUCCIONES:
-- Ejecutar los 3 bloques en PASOS SEPARADOS en Supabase SQL Editor.
-- Postgres requiere que ADD VALUE se commiteé antes de usarse.
-- ============================================================

-- ============================================================
-- PASO 1: Agregar valor PARTIAL al ENUM (ejecutar solo esto primero)
-- ============================================================
ALTER TYPE public.payment_status ADD VALUE IF NOT EXISTS 'PARTIAL';


-- ============================================================
-- PASO 2: Recalcular registros existentes + otros cambios de esquema
--         (ejecutar DESPUÉS de que el paso 1 haya commiteado)
-- ============================================================

-- BUG-01: Recalcular pedidos con pago parcial
-- Usamos cast a text para evitar dependencia del commit anterior en el mismo script
UPDATE public.orders
SET payment_status = 'PARTIAL'::public.payment_status
WHERE paid_amount > 0
  AND paid_amount < total_net
  AND payment_status::text != 'PARTIAL';

-- BUG-03: Agregar supplier_id FK a purchases
ALTER TABLE public.purchases
ADD COLUMN IF NOT EXISTS supplier_id UUID REFERENCES public.suppliers(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_purchases_supplier ON public.purchases(supplier_id);

-- COT-01: Renombrar CANCELADA → RECHAZADA en quotation_status
-- (PostgreSQL 14+ soporta RENAME VALUE directamente)
ALTER TYPE public.quotation_status RENAME VALUE 'CANCELADA' TO 'RECHAZADA';

-- ============================================================
-- FIN UPGRADE PHASE 12
-- ============================================================
