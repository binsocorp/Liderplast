-- ============================================================
-- LIDERPLAST — Migration: Descuento de stock en Pedidos
-- Requerimiento: Cada venta descuenta stock desde que está confirmada.
-- Si es eliminada o cancelada, debe volver a aparecer en stock.
-- ============================================================

-- Función centralizada para aplicar salidas/entradas de stock
CREATE OR REPLACE FUNCTION public.process_order_stock_movement(
    p_order_id UUID,
    p_catalog_item_id UUID,
    p_qty NUMERIC,
    p_order_num TEXT,
    p_user_id UUID,
    p_is_reversal BOOLEAN
) RETURNS VOID AS $$
DECLARE
    v_inventory_id UUID;
    v_type movement_type;
    v_desc TEXT;
BEGIN
    -- Solo procesar cascos (por ahora). Buscar inventario ligado al catálogo
    SELECT ii.id INTO v_inventory_id
    FROM public.inventory_items ii
    JOIN public.catalog_items ci ON ci.id = ii.catalog_item_id
    WHERE ii.catalog_item_id = p_catalog_item_id
      AND ci.sales_category = 'CASCO'
    LIMIT 1;

    -- Si no es un casco trackeado en inventario, salir
    IF v_inventory_id IS NULL THEN
        RETURN;
    END IF;

    -- Determinar el tipo de movimiento
    IF p_is_reversal THEN
        v_type := 'ENTRADA'::movement_type;
        v_desc := 'Devolución de stock por pedido cancelado/eliminado/editado';
    ELSE
        v_type := 'SALIDA'::movement_type;
        v_desc := 'Consumo de stock por pedido confirmado';
    END IF;

    -- Crear el movimiento (el trigger de inventario actualizará el stock real)
    INSERT INTO public.inventory_movements (
        item_id, type, quantity, description, reference, created_by
    ) VALUES (
        v_inventory_id,
        v_type,
        p_qty,
        v_desc,
        p_order_num,
        p_user_id
    );
END;
$$ LANGUAGE plpgsql;


-- -----------------------------------------------------------------------------
-- 1) TRIGGER EN ORDERS (Para manejar cambios de estado y borrados)
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.trg_order_stock_status_change()
RETURNS TRIGGER AS $$
DECLARE
    item RECORD;
    v_was_active BOOLEAN;
    v_is_active BOOLEAN;
BEGIN
    -- Determinar si el pedido estaba/está en estado de "descuento de stock"
    v_was_active := (TG_OP = 'UPDATE' OR TG_OP = 'DELETE') AND OLD.status NOT IN ('BORRADOR', 'CANCELADO');
    
    IF TG_OP = 'DELETE' THEN
        v_is_active := FALSE;
    ELSE
        v_is_active := NEW.status NOT IN ('BORRADOR', 'CANCELADO');
    END IF;

    -- Caso A: Pasa de no-activo a activo (Ej: Borrador -> Confirmado) -> DESCONTAR
    IF NOT v_was_active AND v_is_active THEN
        FOR item IN SELECT catalog_item_id, quantity FROM public.order_items WHERE order_id = NEW.id LOOP
            PERFORM public.process_order_stock_movement(NEW.id, item.catalog_item_id, item.quantity, NEW.order_number, NEW.created_by, FALSE);
        END LOOP;
    
    -- Caso B: Pasa de activo a no-activo (Ej: Confirmado -> Cancelado) -> DEVOLVER
    ELSIF v_was_active AND NOT v_is_active THEN
        FOR item IN SELECT catalog_item_id, quantity FROM public.order_items WHERE order_id = OLD.id LOOP
            PERFORM public.process_order_stock_movement(OLD.id, item.catalog_item_id, item.quantity, OLD.order_number, OLD.created_by, TRUE);
        END LOOP;
    END IF;

    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_orders_stock_update
AFTER UPDATE OF status OR DELETE
ON public.orders
FOR EACH ROW EXECUTE FUNCTION public.trg_order_stock_status_change();


-- -----------------------------------------------------------------------------
-- 2) TRIGGER EN ORDER_ITEMS (Para manejar ediciones en pedidos YA confirmados)
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.trg_order_items_stock_change()
RETURNS TRIGGER AS $$
DECLARE
    v_order RECORD;
    v_is_active BOOLEAN;
    v_diff NUMERIC;
BEGIN
    -- Obtener la orden afectada
    IF TG_OP = 'DELETE' THEN
        SELECT order_number, status, created_by INTO v_order FROM public.orders WHERE id = OLD.order_id;
    ELSE
        SELECT order_number, status, created_by INTO v_order FROM public.orders WHERE id = NEW.order_id;
    END IF;

    -- Si la orden no se encontró (edge case: eliminación no-standard), salir sin error.
    -- Nota: durante DELETE en cascade el pedido AÚN EXISTE cuando este trigger corre,
    -- por lo que v_order sí se encuentra y devuelve el stock correctamente.
    IF v_order IS NULL THEN
        IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
        RETURN NEW;
    END IF;

    v_is_active := v_order.status NOT IN ('BORRADOR', 'CANCELADO');

    -- Solo procesamos esto si el pedido YA ESTÁ confirmando/activo
    -- Si es borrador, no se toca el stock hasta que se confirme.
    IF NOT v_is_active THEN
        IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
        RETURN NEW;
    END IF;

    IF TG_OP = 'INSERT' THEN
        -- Se agregó un ítem nuevo a una orden confirmada -> DESCONTAR
        PERFORM public.process_order_stock_movement(NEW.order_id, NEW.catalog_item_id, NEW.quantity, v_order.order_number, v_order.created_by, FALSE);

    ELSIF TG_OP = 'DELETE' THEN
        -- Se eliminó un ítem de una orden confirmada -> DEVOLVER
        PERFORM public.process_order_stock_movement(OLD.order_id, OLD.catalog_item_id, OLD.quantity, v_order.order_number, v_order.created_by, TRUE);

    ELSIF TG_OP = 'UPDATE' THEN
        -- Cambió la cantidad o el producto
        IF OLD.catalog_item_id != NEW.catalog_item_id THEN
            -- Cambió el producto literal: devolver el viejo, descontar el nuevo
            PERFORM public.process_order_stock_movement(OLD.order_id, OLD.catalog_item_id, OLD.quantity, v_order.order_number, v_order.created_by, TRUE);
            PERFORM public.process_order_stock_movement(NEW.order_id, NEW.catalog_item_id, NEW.quantity, v_order.order_number, v_order.created_by, FALSE);
        ELSIF OLD.quantity != NEW.quantity THEN
            -- Mismo producto, diferente cantidad
            v_diff := NEW.quantity - OLD.quantity;
            IF v_diff > 0 THEN
                -- Aumentó -> DESCONTAR diferencia
                PERFORM public.process_order_stock_movement(NEW.order_id, NEW.catalog_item_id, v_diff, v_order.order_number, v_order.created_by, FALSE);
            ELSE
                -- Disminuyó -> DEVOLVER diferencia abs
                PERFORM public.process_order_stock_movement(NEW.order_id, NEW.catalog_item_id, abs(v_diff), v_order.order_number, v_order.created_by, TRUE);
            END IF;
        END IF;
    END IF;

    IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_order_items_stock_update
AFTER INSERT OR UPDATE OR DELETE
ON public.order_items
FOR EACH ROW EXECUTE FUNCTION public.trg_order_items_stock_change();
