-- ============================================================
-- MIGRACIÓN: LOGÍSTICA V2 (Phase 13)
-- Ejecutar en el SQL Editor de Supabase
-- ============================================================

-- 1. Crear tablas maestras si no existen
CREATE TABLE IF NOT EXISTS public.drivers (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        TEXT NOT NULL,
  phone       TEXT DEFAULT '',
  is_active   BOOLEAN NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.vehicles (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        TEXT NOT NULL UNIQUE,
  capacity    INTEGER NOT NULL DEFAULT 1 CHECK (capacity >= 1),
  is_active   BOOLEAN NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Asegurar que la tabla "trips" (fletes) tenga la estructura nueva
-- NOTA: Esto elinará registros existentes en "trips" si la tabla ya existía
-- Si prefieres migrar datos manualmente, comenta estas líneas y usa ALTER TABLE.
DROP TABLE IF EXISTS public.trips CASCADE;

CREATE TABLE public.trips (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trip_code       TEXT UNIQUE,
  province_id     UUID NOT NULL REFERENCES public.provinces(id),
  exact_address   TEXT NOT NULL,
  trip_date       DATE NOT NULL,
  driver_id       UUID NOT NULL REFERENCES public.drivers(id),
  vehicle_id      UUID NOT NULL REFERENCES public.vehicles(id),
  description     TEXT DEFAULT '',
  cost            NUMERIC(12,2) NOT NULL DEFAULT 0,
  status          TEXT NOT NULL DEFAULT 'PLANIFICADO', 
  notes           TEXT DEFAULT '',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Crear tabla puente para pedidos
CREATE TABLE IF NOT EXISTS public.trip_orders (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trip_id         UUID NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  order_id        UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(trip_id, order_id)
);

CREATE INDEX IF NOT EXISTS idx_trip_orders_trip ON public.trip_orders(trip_id);
CREATE INDEX IF NOT EXISTS idx_trip_orders_order ON public.trip_orders(order_id);

-- 4. Generación automática de trip_code
CREATE SEQUENCE IF NOT EXISTS trip_code_seq START 1;

CREATE OR REPLACE FUNCTION public.generate_trip_code()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.trip_code IS NULL OR NEW.trip_code = '' THEN
    NEW.trip_code := 'VJ-' || LPAD(nextval('trip_code_seq')::TEXT, 5, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_trip_code ON public.trips;
CREATE TRIGGER trg_trip_code
  BEFORE INSERT ON public.trips
  FOR EACH ROW EXECUTE FUNCTION public.generate_trip_code();
