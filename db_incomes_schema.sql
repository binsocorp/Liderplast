-- ==========================================
-- 1. Crear tabla finance_incomes
-- ==========================================
CREATE TABLE IF NOT EXISTS public.finance_incomes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    issue_date DATE NOT NULL,
    amount NUMERIC(15,2) NOT NULL,
    currency TEXT DEFAULT 'ARS',
    income_type TEXT NOT NULL,        -- 'VENTA', 'EXTRAORDINARIO', 'REINTEGRO_RECUPERO', 'OTRO'
    order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
    payment_method_id UUID REFERENCES public.finance_payment_methods(id) ON DELETE SET NULL,
    description TEXT,
    notes TEXT,
    created_by_user_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_finance_incomes_order_id ON public.finance_incomes(order_id);
CREATE INDEX IF NOT EXISTS idx_finance_incomes_issue_date ON public.finance_incomes(issue_date);
CREATE INDEX IF NOT EXISTS idx_finance_incomes_income_type ON public.finance_incomes(income_type);

-- ==========================================
-- 2. Agregar paid_amount a orders si no existe
-- ==========================================
-- Este campo ya está definido en el código (database.ts, schemas.ts, OrdersClient, OrderDrawer)
-- pero aún no fue aplicado a la base de datos.
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'orders' AND column_name = 'paid_amount'
    ) THEN
        ALTER TABLE public.orders ADD COLUMN paid_amount NUMERIC(15,2) DEFAULT 0;
    END IF;
END $$;
