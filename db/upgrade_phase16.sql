-- LIDERPLAST — Upgrade Phase 16
-- 1. Fix product names: P-390230mix → P-390230 Mix (space + capitalize suffix)
-- 2. Add catalog_item_id FK to inventory_items (PRODUCTO_FINAL ↔ catalog_items)
-- Ejecutar en Supabase SQL Editor

-- -----------------------------------------------
-- PASO 1: Corregir nombres en catalog_items
-- -----------------------------------------------
UPDATE public.catalog_items
SET name = regexp_replace(name, '([a-z]+)$', '')
         || ' '
         || initcap(substring(name FROM '[a-z]+$'))
WHERE name ~ 'P-[0-9]+[a-z]+$';

-- -----------------------------------------------
-- PASO 2: Corregir nombres en inventory_items (PRODUCTO_FINAL)
-- -----------------------------------------------
UPDATE public.inventory_items
SET name = regexp_replace(name, '([a-z]+)$', '')
         || ' '
         || initcap(substring(name FROM '[a-z]+$'))
WHERE name ~ 'P-[0-9]+[a-z]+$'
  AND type = 'PRODUCTO_FINAL';

-- -----------------------------------------------
-- PASO 3: Agregar FK catalog_item_id a inventory_items
-- -----------------------------------------------
ALTER TABLE public.inventory_items
ADD COLUMN IF NOT EXISTS catalog_item_id UUID REFERENCES public.catalog_items(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_inventory_catalog ON public.inventory_items(catalog_item_id);

-- -----------------------------------------------
-- PASO 4: Vincular registros existentes por nombre
-- -----------------------------------------------
UPDATE public.inventory_items ii
SET catalog_item_id = ci.id
FROM public.catalog_items ci
WHERE ii.type = 'PRODUCTO_FINAL'
  AND ii.name = ci.name
  AND ii.catalog_item_id IS NULL;
