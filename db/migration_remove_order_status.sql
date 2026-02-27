-- Migration: Remove Order Status
-- Desc: Removes the 'status' column from orders and associated logic/types

BEGIN;

-- 1. Drop trigger that depends on status
DROP TRIGGER IF EXISTS trg_validate_order_trip_status ON public.orders;

-- 2. Drop function used by the trigger
DROP FUNCTION IF EXISTS public.validate_order_trip_status();

-- 3. Drop index on status column
DROP INDEX IF EXISTS public.idx_orders_status;

-- 4. Remove status column from orders table
ALTER TABLE public.orders DROP COLUMN IF EXISTS status;

-- 5. Drop the order_status enum type
DROP TYPE IF EXISTS order_status;

COMMIT;
