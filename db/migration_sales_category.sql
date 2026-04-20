-- ============================================================
-- Migration: sales_category en catalog_items
-- ============================================================

ALTER TABLE catalog_items
ADD COLUMN sales_category text
CHECK (sales_category IN ('CASCO', 'ACCESORIO', 'SERVICIO'));

-- Backfill: P-* y M-* son Cascos
UPDATE catalog_items SET sales_category = 'CASCO'
WHERE name LIKE 'P-%' OR name LIKE 'M-%';

-- Backfill: tipo SERVICIO
UPDATE catalog_items SET sales_category = 'SERVICIO'
WHERE type = 'SERVICIO';

-- Backfill: resto de PRODUCTOS sin inventory_type → Accesorios
UPDATE catalog_items SET sales_category = 'ACCESORIO'
WHERE type = 'PRODUCTO'
  AND sales_category IS NULL
  AND inventory_type IS NULL;
