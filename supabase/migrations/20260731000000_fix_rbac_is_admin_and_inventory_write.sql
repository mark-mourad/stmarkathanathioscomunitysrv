-- =============================================================================
-- CRITICAL FIX: RLS is_admin() + inventory write access
-- -----------------------------------------------------------------------------
-- The legacy `app_role` enum was created as ('admin','viewer'). The RBAC
-- migration (20260730000000) added the canonical UPPERCASE roles
-- ('SUPER_ADMIN','ADMIN','SUPPLY_WAREHOUSE_MANAGER', ...), and user_roles rows
-- store those uppercase values. `is_admin()` still checked the legacy lowercase
-- 'admin' enum value, so every RLS policy that called it (inventory, individuals,
-- family_members, financials, dashboard_metrics, ...) evaluated FALSE for real
-- admins. Because those policies use `USING (public.is_admin())`, Postgres
-- silently skipped every row (0 rows affected, NO error returned) — writes
-- appeared to succeed ("Saved Successfully" toast) but nothing was persisted.
-- =============================================================================

-- 1) is_admin(): recognize canonical uppercase + legacy lowercase roles
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
      AND role IN (
        'SUPER_ADMIN'::public.app_role,
        'ADMIN'::public.app_role,
        'admin'::public.app_role
      )
  )
$$;

GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;

-- 2) Inventory managers: admins + supply warehouse manager
CREATE OR REPLACE FUNCTION public.is_inventory_manager()
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
      AND role IN (
        'SUPER_ADMIN'::public.app_role,
        'ADMIN'::public.app_role,
        'SUPPLY_WAREHOUSE_MANAGER'::public.app_role,
        'admin'::public.app_role
      )
  )
$$;

GRANT EXECUTE ON FUNCTION public.is_inventory_manager() TO authenticated;

-- 3) Inventory write policy: allow admins AND supply warehouse manager to persist
DROP POLICY IF EXISTS "inventory_write_admin" ON public.inventory;
DROP POLICY IF EXISTS "inventory_write_managers" ON public.inventory;
CREATE POLICY "inventory_write_managers" ON public.inventory FOR ALL
  TO authenticated
  USING (public.is_inventory_manager())
  WITH CHECK (public.is_inventory_manager());

NOTIFY pgrst, 'reload schema';
