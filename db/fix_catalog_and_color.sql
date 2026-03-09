-- Fix missing category column and add default items
ALTER TABLE public.catalog_items ADD COLUMN IF NOT EXISTS category TEXT DEFAULT '';

-- Add color extra item
INSERT INTO public.catalog_items (name, type, category, description)
VALUES ('Adicional por Color', 'PRODUCTO', 'Adicionales', 'Recargo por elección de color (Arena, Verde, Gris, etc)')
ON CONFLICT (name) DO NOTHING;
