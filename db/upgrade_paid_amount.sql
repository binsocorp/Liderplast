-- Add paid_amount to orders
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS paid_amount NUMERIC(12,2) NOT NULL DEFAULT 0;
