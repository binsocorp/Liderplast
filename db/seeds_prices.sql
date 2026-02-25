-- ============================================================
-- LIDERPLAST — Seeds para Precios Base (Fase 10)
-- Ejecutar DESPUÉS de upgrade_phase10.sql en el editor de Supabase
-- ============================================================

-- 1. Insertar Ítems Fijos (Cascos y Opcionales Base)
INSERT INTO public.catalog_items (name, type, sku, description) VALUES
  ('P-715300', 'PRODUCTO', 'FIJO_UI', 'Casco pileta'),
  ('P-700300', 'PRODUCTO', 'FIJO_UI', 'Casco pileta'),
  ('P-615300', 'PRODUCTO', 'FIJO_UI', 'Casco pileta'),
  ('P-600300', 'PRODUCTO', 'FIJO_UI', 'Casco pileta'),
  ('P-500315', 'PRODUCTO', 'FIJO_UI', 'Casco pileta'),
  ('P-570270', 'PRODUCTO', 'FIJO_UI', 'Casco pileta'),
  ('P-390230', 'PRODUCTO', 'FIJO_UI', 'Casco pileta'),
  ('Flete Base', 'SERVICIO', 'FIJO_UI', 'Flete'),
  ('Instalación Base', 'SERVICIO', 'FIJO_UI', 'Instalación'),
  ('Viáticos Base', 'SERVICIO', 'FIJO_UI', 'Viáticos'),
  ('Loseta Atérmica L', 'PRODUCTO', 'FIJO_UI', ''),
  ('Loseta Atérmica R', 'PRODUCTO', 'FIJO_UI', ''),
  ('Pastina (Kg)', 'PRODUCTO', 'FIJO_UI', ''),
  ('Casilla', 'PRODUCTO', 'FIJO_UI', ''),
  ('Kit Filtrado', 'PRODUCTO', 'FIJO_UI', ''),
  ('Accesorios Instalación', 'PRODUCTO', 'FIJO_UI', ''),
  ('Luces', 'PRODUCTO', 'FIJO_UI', ''),
  ('Prev. Climatización', 'PRODUCTO', 'FIJO_UI', ''),
  ('Prev. Cascada', 'PRODUCTO', 'FIJO_UI', ''),
  ('Cascada', 'PRODUCTO', 'FIJO_UI', ''),
  ('Kit Limpieza', 'PRODUCTO', 'FIJO_UI', '')
ON CONFLICT DO NOTHING;

DO $$
DECLARE
  v_prov_id UUID;
  v_item_id UUID;
  v_prov RECORD;
BEGIN

-- 2. Insertar precios base iguales en todas las provincias (Opcionales)
FOR v_prov IN SELECT id FROM public.provinces LOOP
  SELECT id INTO v_item_id FROM public.catalog_items WHERE name = 'Loseta Atérmica L';
  INSERT INTO public.prices (catalog_item_id, province_id, unit_price_net) VALUES (v_item_id, v_prov.id, 4800) ON CONFLICT (catalog_item_id, province_id) DO UPDATE SET unit_price_net = EXCLUDED.unit_price_net;

  SELECT id INTO v_item_id FROM public.catalog_items WHERE name = 'Loseta Atérmica R';
  INSERT INTO public.prices (catalog_item_id, province_id, unit_price_net) VALUES (v_item_id, v_prov.id, 4400) ON CONFLICT (catalog_item_id, province_id) DO UPDATE SET unit_price_net = EXCLUDED.unit_price_net;

  SELECT id INTO v_item_id FROM public.catalog_items WHERE name = 'Pastina (Kg)';
  INSERT INTO public.prices (catalog_item_id, province_id, unit_price_net) VALUES (v_item_id, v_prov.id, 1800) ON CONFLICT (catalog_item_id, province_id) DO UPDATE SET unit_price_net = EXCLUDED.unit_price_net;

  SELECT id INTO v_item_id FROM public.catalog_items WHERE name = 'Casilla';
  INSERT INTO public.prices (catalog_item_id, province_id, unit_price_net) VALUES (v_item_id, v_prov.id, 120000) ON CONFLICT (catalog_item_id, province_id) DO UPDATE SET unit_price_net = EXCLUDED.unit_price_net;

  SELECT id INTO v_item_id FROM public.catalog_items WHERE name = 'Kit Filtrado';
  INSERT INTO public.prices (catalog_item_id, province_id, unit_price_net) VALUES (v_item_id, v_prov.id, 460000) ON CONFLICT (catalog_item_id, province_id) DO UPDATE SET unit_price_net = EXCLUDED.unit_price_net;

  SELECT id INTO v_item_id FROM public.catalog_items WHERE name = 'Accesorios Instalación';
  INSERT INTO public.prices (catalog_item_id, province_id, unit_price_net) VALUES (v_item_id, v_prov.id, 140000) ON CONFLICT (catalog_item_id, province_id) DO UPDATE SET unit_price_net = EXCLUDED.unit_price_net;

  SELECT id INTO v_item_id FROM public.catalog_items WHERE name = 'Luces';
  INSERT INTO public.prices (catalog_item_id, province_id, unit_price_net) VALUES (v_item_id, v_prov.id, 180000) ON CONFLICT (catalog_item_id, province_id) DO UPDATE SET unit_price_net = EXCLUDED.unit_price_net;

  SELECT id INTO v_item_id FROM public.catalog_items WHERE name = 'Prev. Climatización';
  INSERT INTO public.prices (catalog_item_id, province_id, unit_price_net) VALUES (v_item_id, v_prov.id, 180000) ON CONFLICT (catalog_item_id, province_id) DO UPDATE SET unit_price_net = EXCLUDED.unit_price_net;

  SELECT id INTO v_item_id FROM public.catalog_items WHERE name = 'Prev. Cascada';
  INSERT INTO public.prices (catalog_item_id, province_id, unit_price_net) VALUES (v_item_id, v_prov.id, 180000) ON CONFLICT (catalog_item_id, province_id) DO UPDATE SET unit_price_net = EXCLUDED.unit_price_net;

  SELECT id INTO v_item_id FROM public.catalog_items WHERE name = 'Cascada';
  INSERT INTO public.prices (catalog_item_id, province_id, unit_price_net) VALUES (v_item_id, v_prov.id, 80000) ON CONFLICT (catalog_item_id, province_id) DO UPDATE SET unit_price_net = EXCLUDED.unit_price_net;

  SELECT id INTO v_item_id FROM public.catalog_items WHERE name = 'Kit Limpieza';
  INSERT INTO public.prices (catalog_item_id, province_id, unit_price_net) VALUES (v_item_id, v_prov.id, 180000) ON CONFLICT (catalog_item_id, province_id) DO UPDATE SET unit_price_net = EXCLUDED.unit_price_net;
END LOOP;

-- 3. Cargar Matriz de Precios Fijos de Cascos y Cargos por Provincia

-- JSON con la configuración exacta (ignora valores 0 o negativos o vacíos)
DECLARE
  v_data JSONB := '[
    {"prov": "Buenos Aires", "Flete Base": 500000, "Instalación Base": 1200000, "P-715300": 2364000, "P-700300": 2064000, "P-615300": 2064000, "P-600300": 1964000, "P-500315": 1764000, "P-570270": 1964000, "P-390230": 1464000},
    {"prov": "Catamarca", "Flete Base": 500000, "Instalación Base": 700000, "P-715300": 2957600, "P-700300": 2657600, "P-615300": 2657600, "P-600300": 2557600, "P-500315": 2357600, "P-570270": 2557600, "P-390230": 2057600},
    {"prov": "Chaco", "Flete Base": 800000, "Instalación Base": 2100000, "P-715300": 3258600, "P-700300": 2958600, "P-615300": 2958600, "P-600300": 2858600, "P-500315": 2658600, "P-570270": 2858600, "P-390230": 2358600},
    {"prov": "Ciudad Autónoma de Buenos Aires", "Flete Base": 500000, "Instalación Base": 580000, "P-715300": 2677600, "P-700300": 2377600, "P-615300": 2377600, "P-600300": 2277600, "P-500315": 2077600, "P-570270": 2277600, "P-390230": 1777600},
    {"prov": "Córdoba", "Flete Base": 400000, "Instalación Base": 700000, "P-715300": 2957600, "P-700300": 2657600, "P-615300": 2657600, "P-600300": 2557600, "P-500315": 2357600, "P-570270": 2557600, "P-390230": 2057600},
    {"prov": "Corrientes", "Flete Base": 500000, "Instalación Base": 700000, "P-715300": 2657600, "P-700300": 2357600, "P-615300": 2357600, "P-600300": 2257600, "P-500315": 2057600, "P-570270": 2257600, "P-390230": 1757600},
    {"prov": "Entre Ríos", "Flete Base": 500000, "Instalación Base": 700000, "P-715300": 3207600, "P-700300": 2907600, "P-615300": 2907600, "P-600300": 2807600, "P-500315": 2607600, "P-570270": 2807600, "P-390230": 2307600},
    {"prov": "Formosa", "Flete Base": 500000, "Instalación Base": 1200000, "P-715300": 2658600, "P-700300": 2358600, "P-615300": 2358600, "P-600300": 2258600, "P-500315": 2058600, "P-570270": 2258600, "P-390230": 1758600},
    {"prov": "Jujuy", "Flete Base": 500000, "Instalación Base": 900000, "P-715300": 2757600, "P-700300": 2457600, "P-615300": 2457600, "P-600300": 2357600, "P-500315": 2157600, "P-570270": 2357600, "P-390230": 1857600},
    {"prov": "La Pampa", "Flete Base": 500000, "Instalación Base": 1200000, "P-715300": 2658600, "P-700300": 2358600, "P-615300": 2358600, "P-600300": 2258600, "P-500315": 2058600, "P-570270": 2258600, "P-390230": 1758600},
    {"prov": "La Rioja", "Flete Base": 500000, "Instalación Base": 1000000, "P-715300": 3458600, "P-700300": 3158600, "P-615300": 3158600, "P-600300": 3058600, "P-500315": 2858600, "P-570270": 3058600, "P-390230": 2558600},
    {"prov": "Misiones", "Flete Base": 500000, "Instalación Base": 800000, "P-715300": 2857600, "P-700300": 2557600, "P-615300": 2557600, "P-600300": 2457600, "P-500315": 2257600, "P-570270": 2457600, "P-390230": 1957600},
    {"prov": "Mendoza", "Flete Base": 500000, "Instalación Base": 1500000, "P-715300": 2607600, "P-700300": 2307600, "P-615300": 2307600, "P-600300": 2207600, "P-500315": 2007600, "P-570270": 2207600, "P-390230": 1707600},
    {"prov": "Neuquén", "Flete Base": 500000, "Instalación Base": 1500000, "P-715300": 2607600, "P-700300": 2307600, "P-615300": 2307600, "P-600300": 2207600, "P-500315": 2007600, "P-570270": 2207600, "P-390230": 1707600},
    {"prov": "Río Negro", "Flete Base": 500000, "Instalación Base": 1200000, "P-715300": 2658600, "P-700300": 2358600, "P-615300": 2358600, "P-600300": 2258600, "P-500315": 2058600, "P-570270": 2258600, "P-390230": 1758600},
    {"prov": "Salta", "Flete Base": 500000, "Instalación Base": 800000, "P-715300": 2857600, "P-700300": 2557600, "P-615300": 2557600, "P-600300": 2457600, "P-500315": 2257600, "P-570270": 2457600, "P-390230": 1957600},
    {"prov": "San Juan", "Flete Base": 400000, "Instalación Base": 800000, "P-715300": 2857600, "P-700300": 2557600, "P-615300": 2557600, "P-600300": 2457600, "P-500315": 2257600, "P-570270": 2457600, "P-390230": 1957600},
    {"prov": "San Luis", "Flete Base": 500000, "Instalación Base": 700000, "P-715300": 2657600, "P-700300": 2357600, "P-615300": 2357600, "P-600300": 2257600, "P-500315": 2057600, "P-570270": 2257600, "P-390230": 1757600},
    {"prov": "Santa Fe", "Flete Base": 500000, "Instalación Base": 1200000, "P-715300": 2658600, "P-700300": 2358600, "P-615300": 2358600, "P-600300": 2258600, "P-500315": 2058600, "P-570270": 2258600, "P-390230": 1758600},
    {"prov": "Santiago del Estero", "Flete Base": 500000, "Instalación Base": 800000, "P-715300": 3058600, "P-700300": 2758600, "P-615300": 2758600, "P-600300": 2658600, "P-500315": 2458600, "P-570270": 2658600, "P-390230": 2158600},
    {"prov": "Tucumán", "P-715300": 3058600, "P-700300": 2758600, "P-615300": 2758600, "P-600300": 2658600, "P-500315": 2458600, "P-570270": 2658600, "P-390230": 2158600}
  ]'::jsonb;
  
  v_row JSONB;
  v_key TEXT;
  v_val NUMERIC;
BEGIN
  FOR v_row IN SELECT * FROM jsonb_array_elements(v_data) LOOP
    SELECT id INTO v_prov_id FROM public.provinces WHERE name = v_row->>'prov' LIMIT 1;
    IF FOUND THEN
      FOR v_key IN SELECT key FROM jsonb_each(v_row) WHERE key != 'prov' LOOP
        v_val := (v_row->>v_key)::NUMERIC;
        IF v_val IS NOT NULL AND v_val > 0 THEN
          SELECT id INTO v_item_id FROM public.catalog_items WHERE name = v_key LIMIT 1;
          IF FOUND THEN
            INSERT INTO public.prices (catalog_item_id, province_id, unit_price_net)
            VALUES (v_item_id, v_prov_id, v_val)
            ON CONFLICT (catalog_item_id, province_id) DO UPDATE SET unit_price_net = EXCLUDED.unit_price_net;
          END IF;
        END IF;
      END LOOP;
    END IF;
  END LOOP;
END;
END $$;
