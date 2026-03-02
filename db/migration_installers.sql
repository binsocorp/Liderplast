-- 1. Agregar columna de notas
ALTER TABLE public.installers ADD COLUMN IF NOT EXISTS notes TEXT DEFAULT '';

-- 2. Agregar arreglo de UUIDs para soportar múltiples provincias (es más robusto que un texto)
ALTER TABLE public.installers ADD COLUMN IF NOT EXISTS provinces UUID[] DEFAULT '{}'::UUID[];

-- 3. Solucionar el error al eliminar: "violates foreign key constraint on table orders"
-- Cambiamos la FK de orders.installer_id para que haga un ON DELETE SET NULL
ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_installer_id_fkey;

ALTER TABLE public.orders 
  ADD CONSTRAINT orders_installer_id_fkey 
  FOREIGN KEY (installer_id) 
  REFERENCES public.installers(id) 
  ON DELETE SET NULL;
