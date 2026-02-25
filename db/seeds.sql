-- ============================================================
-- LIDERPLAST — Seeds
-- Provincias de Argentina (23 + CABA)
-- Todas con is_sellable = true por defecto
-- ============================================================

INSERT INTO public.provinces (name, is_sellable) VALUES
  ('Buenos Aires', true),
  ('Ciudad Autónoma de Buenos Aires', true),
  ('Catamarca', true),
  ('Chaco', true),
  ('Chubut', true),
  ('Córdoba', true),
  ('Corrientes', true),
  ('Entre Ríos', true),
  ('Formosa', true),
  ('Jujuy', true),
  ('La Pampa', true),
  ('La Rioja', true),
  ('Mendoza', true),
  ('Misiones', true),
  ('Neuquén', true),
  ('Río Negro', true),
  ('Salta', true),
  ('San Juan', true),
  ('San Luis', true),
  ('Santa Cruz', true),
  ('Santa Fe', true),
  ('Santiago del Estero', true),
  ('Tierra del Fuego', true),
  ('Tucumán', true)
ON CONFLICT (name) DO NOTHING;

-- ============================================================
-- FIN SEEDS
-- ============================================================
