-- LIDERPLAST — Upgrade Phase 18
-- Función para listar usuarios con emails (admin only)
-- Ejecutar en Supabase SQL Editor

CREATE OR REPLACE FUNCTION public.get_users_with_profiles()
RETURNS TABLE (
    id              UUID,
    email           TEXT,
    full_name       TEXT,
    role            TEXT,
    can_override_prices BOOLEAN,
    created_at      TIMESTAMPTZ,
    last_sign_in_at TIMESTAMPTZ
)
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
    SELECT
        p.id,
        u.email,
        p.full_name,
        p.role::TEXT,
        p.can_override_prices,
        p.created_at,
        u.last_sign_in_at
    FROM public.profiles p
    JOIN auth.users u ON u.id = p.id
    WHERE public.is_admin()
    ORDER BY p.created_at ASC;
$$;

-- Solo admins pueden ejecutar la función
REVOKE EXECUTE ON FUNCTION public.get_users_with_profiles() FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.get_users_with_profiles() TO authenticated;
