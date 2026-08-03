-- =============================================================================
-- Blessing Distribution write RLS + manual toggle support
-- -----------------------------------------------------------------------------
-- Fixes:
--   1) blessing_distribution: scoped INSERT/UPDATE policies so Admins
--      (SUPER_ADMIN / ADMIN / BLESSING_DISTRIBUTOR) may update any family, and
--      assigned family servants (ST_MATTHEW / ST_MARK / ST_JOHN / ST_LUKE /
--      ST_HIDDEN_FAMILIES) may only update their own saint_family. This is what
--      lets admins manually check/uncheck any checkbox across all families and
--      lets family servants toggle their own family's rows.
--   2) inventory: allow blessing managers (admins + distributor + family
--      servants) to UPDATE weekly_total so QR scanning / manual toggles can
--      persist without "تعذر تحديث المخزون: لم يتم تحديث أي صف".
--   3) Add distributed_at TIMESTAMPTZ to blessing_distribution so the
--      distribution timestamp is recorded alongside received.
--
-- NOTE: family scoping uses the scalar helper public.get_user_saint_family()
-- (defined in 20260731000001_family_servant_write_rls.sql). PostgreSQL does not
-- allow set-returning functions inside policy expressions.
-- =============================================================================

-- 1) distributed_at column (null when not yet received)
ALTER TABLE public.blessing_distribution ADD COLUMN IF NOT EXISTS distributed_at TIMESTAMPTZ;

-- 2) Helper: admin + blessing distributor (global blessing write)
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

-- 3) blessing_distribution: drop permissive write/update policies
DROP POLICY IF EXISTS "blessing_write_auth" ON public.blessing_distribution;
DROP POLICY IF EXISTS "blessing_update_auth" ON public.blessing_distribution;
DROP POLICY IF EXISTS "blessing_insert_blessing_manager" ON public.blessing_distribution;
DROP POLICY IF EXISTS "blessing_insert_family_servant" ON public.blessing_distribution;
DROP POLICY IF EXISTS "blessing_update_blessing_manager" ON public.blessing_distribution;
DROP POLICY IF EXISTS "blessing_update_family_servant" ON public.blessing_distribution;

-- Admins / distributor: any family
CREATE POLICY "blessing_insert_blessing_manager" ON public.blessing_distribution FOR INSERT TO authenticated
  WITH CHECK (public.is_blessing_manager());

CREATE POLICY "blessing_update_blessing_manager" ON public.blessing_distribution FOR UPDATE TO authenticated
  USING (public.is_blessing_manager())
  WITH CHECK (public.is_blessing_manager());

-- Family servants: only their own saint_family
CREATE POLICY "blessing_insert_family_servant" ON public.blessing_distribution FOR INSERT TO authenticated
  WITH CHECK (saint_family = public.get_user_saint_family());

CREATE POLICY "blessing_update_family_servant" ON public.blessing_distribution FOR UPDATE TO authenticated
  USING (saint_family = public.get_user_saint_family())
  WITH CHECK (saint_family = public.get_user_saint_family());

-- 4) inventory: blessing managers + any family servant may update weekly_total
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
