-- Phase 11: Fletes & Navigation Updates

-- 1. Create truck_types table
CREATE TABLE public.truck_types (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        TEXT NOT NULL UNIQUE,
  capacity    INTEGER NOT NULL DEFAULT 1 CHECK (capacity >= 1),
  is_active   BOOLEAN NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Add truck_type_id and cost to trips
ALTER TABLE public.trips 
ADD COLUMN truck_type_id UUID REFERENCES public.truck_types(id),
ADD COLUMN cost NUMERIC(12,2) NOT NULL DEFAULT 0;

-- 3. Update orders to allow null trip_id (just in case)
-- (trip_id is already nullable)

-- End of upgrade
