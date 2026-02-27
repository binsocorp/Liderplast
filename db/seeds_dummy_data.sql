-- ==============================================================================
-- Liderplast - Dummy Data Seeder para Testing de UI
-- Este script inserta datos de prueba en las tablas maestras.
-- ==============================================================================

DO $$
DECLARE
    v_prov_ba UUID;
    v_prov_cba UUID;
    v_prov_sf UUID;
    v_seller_1 UUID;
    v_seller_2 UUID;
    v_reseller_1 UUID;
    v_client_1 UUID;
    v_client_2 UUID;
    v_installer_1 UUID;
    v_installer_2 UUID;
    v_trip_1 UUID;
BEGIN
    -- Obtener IDs de provincias populares para asignaciones
    SELECT id INTO v_prov_ba FROM public.provinces WHERE name = 'Buenos Aires' LIMIT 1;
    SELECT id INTO v_prov_cba FROM public.provinces WHERE name = 'Córdoba' LIMIT 1;
    SELECT id INTO v_prov_sf FROM public.provinces WHERE name = 'Santa Fe' LIMIT 1;

    -- =====================================
    -- SELLERS (VENDEDORES)
    -- =====================================
    INSERT INTO public.sellers (name, type, phone, email) VALUES
        ('Juan Pérez', 'INTERNO', '1122334455', 'juan.vendedor@liderplast.com.ar') RETURNING id INTO v_seller_1;
    INSERT INTO public.sellers (name, type, phone, email) VALUES
        ('María Gómez', 'INTERNO', '1133445566', 'maria.ventas@liderplast.com.ar') RETURNING id INTO v_seller_2;

    -- =====================================
    -- RESELLERS (REVENDEDORES)
    -- =====================================
    INSERT INTO public.resellers (name, contact, phone, email, province_id) VALUES
        ('Distribuidora Piscinas Sur', 'Carlos Ruiz', '1144556677', 'ventas@piscinassur.com', v_prov_ba) RETURNING id INTO v_reseller_1;
    INSERT INTO public.resellers (name, contact, phone, email, province_id) VALUES
        ('AquaCenter Córdoba', 'Laura Martínez', '3514455667', 'info@aquacentercba.com.ar', v_prov_cba);

    -- =====================================
    -- CLIENTS (CLIENTES)
    -- =====================================
    INSERT INTO public.clients (name, phone, email, address, city, province_id, document, notes) VALUES
        ('Fernando Sánchez', '1155667788', 'fernando.s@gmail.com', 'Av. del Libertador 1234', 'San Isidro', v_prov_ba, '29444555', 'Cliente VIP') RETURNING id INTO v_client_1;
    INSERT INTO public.clients (name, phone, email, address, city, province_id, document) VALUES
        ('Julieta Fernández', '3515566778', 'julieta.f@hotmail.com', 'San Martín 456', 'Villa Carlos Paz', v_prov_cba, '32111222') RETURNING id INTO v_client_2;
    INSERT INTO public.clients (name, phone, email, address, city, province_id, document) VALUES
        ('Martín López', '3416677889', 'mlopez89@yahoo.com.ar', 'Urquiza 789', 'Rosario', v_prov_sf, '35666777');
    INSERT INTO public.clients (name, phone, email, address, city, province_id, document) VALUES
        ('Constructora Edificar SA', '1166778899', 'compras@edificarsa.com.ar', 'Ruta Panamericana Km 30', 'Pilar', v_prov_ba, '30712233445');

    -- =====================================
    -- INSTALLERS (INSTALADORES)
    -- =====================================
    INSERT INTO public.installers (name, phone, email, zone) VALUES
        ('Pedro Instalaciones', '1177889900', 'pedro.instala@gmail.com', 'GBA Norte') RETURNING id INTO v_installer_1;
    INSERT INTO public.installers (name, phone, email, zone) VALUES
        ('Equipo Piscinas Ok', '1188990011', 'piscinasok@hotmail.com', 'GBA Oeste - Sur') RETURNING id INTO v_installer_2;
    INSERT INTO public.installers (name, phone, email, zone) VALUES
        ('Carlos "El Rápido" González', '3518899001', '', 'Córdoba Capital y alrededores');

    -- =====================================
    -- TRIPS (VIAJES)
    -- =====================================
    INSERT INTO public.trips (trip_code, destination, date, description, status, notes) VALUES
        ('VJ-001', 'San Isidro - Pilar', CURRENT_DATE + INTERVAL '2 days', 'Entrega de 2 cascos P-715300 y P-800400', 'PENDIENTE', 'Llamar a los clientes 1 hora antes') RETURNING id INTO v_trip_1;
    INSERT INTO public.trips (trip_code, destination, date, description, status) VALUES
        ('VJ-002', 'Rosario, SF', CURRENT_DATE + INTERVAL '5 days', 'Entrega casco y accesorios completos', 'PENDIENTE');
    INSERT INTO public.trips (trip_code, destination, date, description, status) VALUES
        ('VJ-003', 'Villa Carlos Paz', CURRENT_DATE - INTERVAL '1 day', 'Entrega casco estándar', 'COMPLETADO');

    -- =====================================
    -- SUPPLIERS (PROVEEDORES)
    -- =====================================
    INSERT INTO public.suppliers (name, contact, phone, email, category) VALUES
        ('Fibra Glass Arg', 'Roberto Sánchez', '1199001122', 'ventas@fibraglass.com.ar', 'Materia Prima (Fibra)');
    INSERT INTO public.suppliers (name, contact, phone, email, category) VALUES
        ('Resinas Químicas SA', 'Ana Lucero', '3419900112', 'pedidos@resinasquimicas.com', 'Materia Prima (Resina)');
    INSERT INTO public.suppliers (name, contact, phone, email, category) VALUES
        ('Filtros Aqua', 'Diego Torres', '1122112211', 'dtorres@filtrosaqua.com.ar', 'Accesorios (Filtros y Bombas)');

END $$;
 