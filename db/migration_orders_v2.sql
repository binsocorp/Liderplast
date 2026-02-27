-- Add payment_status to orders

DO $$ BEGIN
    CREATE TYPE public.payment_status AS ENUM ('PENDING', 'PAID', 'UNPAID', 'REFUNDED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS payment_status public.payment_status DEFAULT 'PENDING';

-- Seed some orders if none exist (or just update existing ones)
-- We need some clients and provinces first
DO $$
DECLARE
    v_client_id UUID;
    v_province_id UUID;
BEGIN
    SELECT id INTO v_province_id FROM public.provinces WHERE is_sellable = true LIMIT 1;
    SELECT id INTO v_client_id FROM public.clients LIMIT 1;

    IF v_client_id IS NOT NULL AND v_province_id IS NOT NULL THEN
        -- Link existing orders to a payment status
        UPDATE public.orders SET payment_status = 'PAID' WHERE payment_status IS NULL;

        -- Insert a few more if needed for the mockup look
        INSERT INTO public.orders (
            order_number, client_id, client_name, client_document, client_phone, 
            delivery_address, city, province_id, channel, status, total_net, payment_status
        ) VALUES 
        ('PED-9001', v_client_id, 'Alex Carter', '12345678', '11223344', 'Calle Falsa 123', 'CABA', v_province_id, 'INTERNO', 'CONFIRMADO', 199000, 'PENDING'),
        ('PED-9002', v_client_id, 'Dannie Trap', '23456789', '22334455', 'Av Siempre Viva 742', 'CABA', v_province_id, 'INTERNO', 'EN_PRODUCCION', 399000, 'PAID'),
        ('PED-9003', v_client_id, 'Maria Lopez', '34567890', '33445566', 'Rivadavia 1000', 'CABA', v_province_id, 'INTERNO', 'PRODUCIDO', 99000, 'UNPAID')
        ON CONFLICT (order_number) DO NOTHING;
    END IF;
END $$;
