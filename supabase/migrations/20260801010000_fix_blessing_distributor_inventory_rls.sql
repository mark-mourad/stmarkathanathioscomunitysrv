-- =============================================================================
-- CRITICAL FIX: Blessing Distributor & Family Servant inventory write access
-- -----------------------------------------------------------------------------
-- Root cause: the linked Supabase project never received the scoped blessing /
-- inventory RLS policies (supabase_migrations.schema_migrations is empty and
-- `inventory` only had `inventory_write_managers` = SUPER_ADMIN/ADMIN/
-- SUPPLY_WAREHOUSE_MANAGER). So BLESSING_DISTRIBUTOR and ST_* scans/checkboxes
-- updated blessing_distribution (permissive policy) but the inventory UPDATE
-- was silently skipped by RLS → server functions threw
-- "تعذر تحديث المخزون: لم يتم تحديث أي صف (تحقق من الصلاحيات)".
--
-- NOTE: a set-returning helper (RETURNS TABLE) CANNOT be used inside a policy
-- expression in PostgreSQL ("set-returning functions are not allowed in policy
-- expressions"), so we use scalar helper functions here.
--
-- This migration is self-contained and idempotent (safe to re-run):
--   1) get_user_saint_family() – scalar role→saint_family helper (mirrors
--                                src/lib/permissions.ts FAMILY_SCOPE_BY_ROLE).
--   2) is_blessing_manager()    – SUPER_ADMIN / ADMIN / BLESSING_DISTRIBUTOR.
--   3) blessing_distribution    – scoped INSERT/UPDATE policies: blessing
--                                 managers may write any family; the assigned
--                                 family servant only their own saint_family.
--   4) inventory UPDATE         – blessing managers OR any family servant may
--                                 decrement weekly_total while distributing.
-- =============================================================================

-- 1) Family scope helper (scalar, strictly role-derived, NO fallback).
CREATE OR REPLACE FUNCTION public.get_user_saint_family()
RETURNS TEXT LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT CASE
    WHEN public.has_any_role(auth.uid(), 'ST_MATTHEW') THEN 'متى'
    WHEN public.has_any_role(auth.uid(), 'ST_MARK') THEN 'مرقس'
    WHEN public.has_any_role(auth.uid(), 'ST_JOHN') THEN 'يوحنا'
    WHEN public.has_any_role(auth.uid(), 'ST_LUKE') THEN 'لوقا'
    WHEN public.has_any_role(auth.uid(), 'ST_HIDDEN_FAMILIES') THEN 'أسر مستترة'
    ELSE NULL
  END;
$$;

GRANT EXECUTE ON FUNCTION public.get_user_saint_family() TO authenticated;

-- 2) Blessing manager helper (global blessing write for admins + distributor).
CREATE OR REPLACE FUNCTION public.is_blessing_manager()
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
      AND role::text IN (
        'SUPER_ADMIN', 'ADMIN', 'admin',
        'BLESSING_DISTRIBUTOR'
      )
  );
$$;

GRANT EXECUTE ON FUNCTION public.is_blessing_manager() TO authenticated;

-- 3) blessing_distribution: replace the permissive write policies with scoped
--    ones so every write is authorized (manager: any family; servant: own).
DROP POLICY IF EXISTS "blessing_write_auth" ON public.blessing_distribution;
DROP POLICY IF EXISTS "blessing_update_auth" ON public.blessing_distribution;
DROP POLICY IF EXISTS "blessing_insert_blessing_manager" ON public.blessing_distribution;
DROP POLICY IF EXISTS "blessing_insert_family_servant" ON public.blessing_distribution;
DROP POLICY IF EXISTS "blessing_update_blessing_manager" ON public.blessing_distribution;
DROP POLICY IF EXISTS "blessing_update_family_servant" ON public.blessing_distribution;

-- Blessing managers (SUPER_ADMIN / ADMIN / BLESSING_DISTRIBUTOR): any family.
CREATE POLICY "blessing_insert_blessing_manager" ON public.blessing_distribution FOR INSERT TO authenticated
  WITH CHECK (public.is_blessing_manager());

CREATE POLICY "blessing_update_blessing_manager" ON public.blessing_distribution FOR UPDATE TO authenticated
  USING (public.is_blessing_manager())
  WITH CHECK (public.is_blessing_manager());

-- Family servants (ST_*): only their own saint_family.
CREATE POLICY "blessing_insert_family_servant" ON public.blessing_distribution FOR INSERT TO authenticated
  WITH CHECK (saint_family = public.get_user_saint_family());

CREATE POLICY "blessing_update_family_servant" ON public.blessing_distribution FOR UPDATE TO authenticated
  USING (saint_family = public.get_user_saint_family())
  WITH CHECK (saint_family = public.get_user_saint_family());

-- 4) inventory: blessing managers + any family servant may update weekly_total
--    so barcode scans / manual toggles can persist the deduction.
DROP POLICY IF EXISTS "inventory_update_blessing" ON public.inventory;
CREATE POLICY "inventory_update_blessing" ON public.inventory FOR UPDATE TO authenticated
  USING (
    public.is_blessing_manager()
    OR public.get_user_saint_family() IS NOT NULL
  )
  WITH CHECK (
    public.is_blessing_manager()
    OR public.get_user_saint_family() IS NOT NULL
  );

NOTIFY pgrst, 'reload schema';
