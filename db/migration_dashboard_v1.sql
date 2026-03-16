-- Migration Dashboard V1
-- Redesign and expansion of dashboards, including financial income tracking.

-- 1. Enum for category nature
DO $$ BEGIN
    CREATE TYPE public.category_nature AS ENUM ('OPERATIVO', 'NO_OPERATIVO', 'FINANCIERO', 'EXTRAORDINARIO');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. Update finance_categories with nature
ALTER TABLE public.finance_categories ADD COLUMN IF NOT EXISTS nature public.category_nature DEFAULT 'OPERATIVO';

-- 3. Income Master Tables
CREATE TABLE IF NOT EXISTS public.finance_income_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    nature public.category_nature DEFAULT 'OPERATIVO',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Main Income Table
CREATE TABLE IF NOT EXISTS public.finance_income (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
    amount NUMERIC(15,2) NOT NULL,
    currency TEXT NOT NULL DEFAULT 'ARS',
    category_id UUID NOT NULL REFERENCES public.finance_income_categories(id),
    payment_method_id UUID NOT NULL REFERENCES public.finance_payment_methods(id),
    description TEXT NOT NULL,
    notes TEXT,
    client_id UUID REFERENCES public.clients(id), -- Optional client reference
    created_by_user_id UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 5. Indexes for income
CREATE INDEX IF NOT EXISTS idx_income_category ON public.finance_income(category_id);
CREATE INDEX IF NOT EXISTS idx_income_issue_date ON public.finance_income(issue_date);

-- 6. Initial Seed for Income Categories
INSERT INTO public.finance_income_categories (name, nature) VALUES 
('Ventas de Productos', 'OPERATIVO'),
('Ventas de Servicios', 'OPERATIVO'),
('Intereses Ganados', 'FINANCIERO'),
('Aportes de Capital', 'FINANCIERO'),
('Reintegros', 'EXTRAORDINARIO'),
('Otros Ingresos', 'EXTRAORDINARIO')
ON CONFLICT DO NOTHING;

-- 7. RLS for new tables
ALTER TABLE public.finance_income_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.finance_income ENABLE ROW LEVEL SECURITY;

CREATE POLICY "finance_income_categories_select_all" ON public.finance_income_categories FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "finance_income_categories_admin_all" ON public.finance_income_categories FOR ALL USING (public.is_admin());

CREATE POLICY "finance_income_select_all" ON public.finance_income FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "finance_income_admin_all" ON public.finance_income FOR ALL USING (public.is_admin());
