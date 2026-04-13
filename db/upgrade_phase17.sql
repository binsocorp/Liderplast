-- LIDERPLAST — Upgrade Phase 17
-- Agregar cuenta de pago a compras (FK a finance_payment_methods)
-- Ejecutar en Supabase SQL Editor

ALTER TABLE public.purchases
ADD COLUMN IF NOT EXISTS payment_method_id UUID REFERENCES public.finance_payment_methods(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_purchases_payment_method ON public.purchases(payment_method_id);
