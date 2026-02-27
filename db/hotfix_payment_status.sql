-- HOTFIX: Add missing columns to orders table
-- This script ensures payment_status exists and handles the type creation

DO $$ BEGIN
    CREATE TYPE public.payment_status AS ENUM ('PENDING', 'PAID', 'UNPAID', 'REFUNDED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS payment_status public.payment_status DEFAULT 'PENDING';

-- Optional: If you want to migrate existing data to 'PAID'
-- UPDATE public.orders SET payment_status = 'PAID' WHERE payment_status IS NULL;
