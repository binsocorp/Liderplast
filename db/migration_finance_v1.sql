-- Finance Module Migration V1

-- Types
DO $$ BEGIN
    CREATE TYPE public.expense_status AS ENUM ('PAGADO', 'PENDIENTE');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 1. Master Tables
CREATE TABLE IF NOT EXISTS public.finance_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.finance_subcategories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    category_id UUID NOT NULL REFERENCES public.finance_categories(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.finance_payment_methods (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.finance_vendors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    cuit TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.finance_cost_centers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Main Expenses Table
CREATE TABLE IF NOT EXISTS public.finance_expenses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
    payment_date DATE,
    status public.expense_status NOT NULL DEFAULT 'PAGADO',
    amount NUMERIC(15,2) NOT NULL,
    currency TEXT NOT NULL DEFAULT 'ARS',
    category_id UUID NOT NULL REFERENCES public.finance_categories(id),
    subcategory_id UUID REFERENCES public.finance_subcategories(id),
    payment_method_id UUID NOT NULL REFERENCES public.finance_payment_methods(id),
    description TEXT NOT NULL,
    notes TEXT,
    vendor_id UUID REFERENCES public.finance_vendors(id),
    document_type TEXT, -- Factura, Recibo, etc.
    document_number TEXT,
    cost_center_id UUID REFERENCES public.finance_cost_centers(id),
    created_by_user_id UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_expenses_category ON public.finance_expenses(category_id);
CREATE INDEX IF NOT EXISTS idx_expenses_issue_date ON public.finance_expenses(issue_date);
CREATE INDEX IF NOT EXISTS idx_expenses_status ON public.finance_expenses(status);
CREATE INDEX IF NOT EXISTS idx_expenses_vendor ON public.finance_expenses(vendor_id);

-- Initial Seed Data
INSERT INTO public.finance_payment_methods (name) VALUES 
('Efectivo'), ('Caja Local'), ('Mercado Pago'), ('Transferencia Bancaria'), ('Tarjeta de Crédito')
ON CONFLICT DO NOTHING;

INSERT INTO public.finance_categories (name) VALUES 
('Servicios'), ('Mantenimiento'), ('Sueldos'), ('Impuestos'), ('Compras'), ('Logística'), ('Otros')
ON CONFLICT DO NOTHING;
