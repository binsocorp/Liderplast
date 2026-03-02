-- Add status column to orders if it doesn't exist
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'status') THEN
        ALTER TABLE orders ADD COLUMN status TEXT DEFAULT 'PENDIENTE';
    END IF;
END $$;

-- Add actual_cost column to trips if it doesn't exist
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'trips' AND column_name = 'actual_cost') THEN
        ALTER TABLE trips ADD COLUMN actual_cost NUMERIC DEFAULT 0;
    END IF;
END $$;
