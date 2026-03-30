-- ============================================================
-- LIDERPLAST — Upgrade Phase 13
-- ING-03: invoice_type en finance_incomes
-- CMP-02: purchase_id FK en finance_expenses
-- CMP-04: ANULADO en expense_status
-- CAJ-01: Tabla account_movements para módulo Caja
--
-- INSTRUCCIONES:
-- Ejecutar en 2 PASOS SEPARADOS en Supabase SQL Editor.
-- PASO 1 modifica ENUMs (requiere commit antes de usarse).
-- ============================================================

-- ============================================================
-- PASO 1: Agregar valor ANULADO al ENUM expense_status
-- ============================================================
ALTER TYPE public.expense_status ADD VALUE IF NOT EXISTS 'ANULADO';


-- ============================================================
-- PASO 2: Resto de cambios de esquema
--         (ejecutar DESPUÉS de que el paso 1 haya commiteado)
-- ============================================================

-- ING-03: Campo tipo comprobante en ingresos
ALTER TABLE public.finance_incomes
ADD COLUMN IF NOT EXISTS invoice_type TEXT;

-- CMP-02: Vincular gastos a compras (FK)
ALTER TABLE public.finance_expenses
ADD COLUMN IF NOT EXISTS purchase_id UUID REFERENCES public.purchases(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_expenses_purchase ON public.finance_expenses(purchase_id);

-- CAJ-01: Tabla de movimientos de caja por cuenta/medio de pago
CREATE TABLE IF NOT EXISTS public.account_movements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payment_method_id UUID NOT NULL REFERENCES public.finance_payment_methods(id),
    movement_type TEXT NOT NULL CHECK (movement_type IN ('INGRESO', 'EGRESO', 'TRANSFERENCIA_IN', 'TRANSFERENCIA_OUT', 'SALDO_INICIAL', 'AJUSTE')),
    amount NUMERIC(14,2) NOT NULL,
    description TEXT,
    reference_type TEXT,          -- 'income', 'expense', 'transfer', 'initial'
    reference_id UUID,            -- FK libre al registro origen
    transfer_to_method_id UUID REFERENCES public.finance_payment_methods(id),
    movement_date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ DEFAULT now(),
    created_by_user_id UUID REFERENCES auth.users(id)
);

CREATE INDEX IF NOT EXISTS idx_account_movements_method ON public.account_movements(payment_method_id);
CREATE INDEX IF NOT EXISTS idx_account_movements_date ON public.account_movements(movement_date);

-- ============================================================
-- FIN UPGRADE PHASE 13
-- ============================================================
