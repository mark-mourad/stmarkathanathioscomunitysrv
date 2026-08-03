-- =============================================================================
-- Family-servant write RLS policies
-- -----------------------------------------------------------------------------
-- Family servants (ST_MATTHEW / ST_MARK / ST_JOHN / ST_LUKE / ST_HIDDEN_FAMILIES)
-- must be able to CREATE and EDIT beneficiaries (individuals) and their related
-- records (family_members, financials, monthly_church_support), plus their own
-- sector's dashboard_metrics — but ONLY for rows belonging to their own family.
--
-- This mapping is the DB mirror of FAMILY_SCOPE_BY_ROLE in
-- src/lib/permissions.ts (single source of truth, role-derived, NO fallback):
--   ST_MATTHEW         -> sector 'القديس متى',      saint_family 'متى'
--   ST_MARK            -> sector 'القديس مرقس',     saint_family 'مرقس'
--   ST_JOHN            -> sector 'القديس يوحنا',    saint_family 'يوحنا'
--   ST_LUKE            -> sector 'القديس لوقا',     saint_family 'لوقا'
--   ST_HIDDEN_FAMILIES -> sector 'الأسر المستترة',  saint_family 'أسر مستترة'
--
-- Servants may INSERT/UPDATE (never DELETE) their own family's rows. Admins keep
-- the existing admin write policies (multiple policies are OR'd per command).
--
-- NOTE: PostgreSQL forbids set-returning functions inside policy expressions
-- ("set-returning functions are not allowed in policy expressions"), so we use
-- two SCALAR helpers (get_user_saint_family / get_user_sector) instead of a
-- single RETURNS TABLE helper.
-- =============================================================================

-- 1) Helpers: current user's family scope (strictly role-derived, scalar)
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

CREATE OR REPLACE FUNCTION public.get_user_sector()
RETURNS TEXT LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT CASE
    WHEN public.has_any_role(auth.uid(), 'ST_MATTHEW') THEN 'القديس متى'
    WHEN public.has_any_role(auth.uid(), 'ST_MARK') THEN 'القديس مرقس'
    WHEN public.has_any_role(auth.uid(), 'ST_JOHN') THEN 'القديس يوحنا'
    WHEN public.has_any_role(auth.uid(), 'ST_LUKE') THEN 'القديس لوقا'
    WHEN public.has_any_role(auth.uid(), 'ST_HIDDEN_FAMILIES') THEN 'الأسر المستترة'
    ELSE NULL
  END;
$$;

GRANT EXECUTE ON FUNCTION public.get_user_sector() TO authenticated;

-- 2) individuals: servants INSERT/UPDATE only their own saint_family
DROP POLICY IF EXISTS "ind_insert_family_servant" ON public.individuals;
CREATE POLICY "ind_insert_family_servant" ON public.individuals FOR INSERT TO authenticated
  WITH CHECK (saint_family = public.get_user_saint_family());

DROP POLICY IF EXISTS "ind_update_family_servant" ON public.individuals;
CREATE POLICY "ind_update_family_servant" ON public.individuals FOR UPDATE TO authenticated
  USING (saint_family = public.get_user_saint_family())
  WITH CHECK (saint_family = public.get_user_saint_family());

-- 3) family_members: scoped via the parent individual's saint_family
DROP POLICY IF EXISTS "fam_insert_family_servant" ON public.family_members;
CREATE POLICY "fam_insert_family_servant" ON public.family_members FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.individuals i
      WHERE i.id = family_members.individual_id
        AND i.saint_family = public.get_user_saint_family()
    )
  );

DROP POLICY IF EXISTS "fam_update_family_servant" ON public.family_members;
CREATE POLICY "fam_update_family_servant" ON public.family_members FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.individuals i
      WHERE i.id = family_members.individual_id
        AND i.saint_family = public.get_user_saint_family()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.individuals i
      WHERE i.id = family_members.individual_id
        AND i.saint_family = public.get_user_saint_family()
    )
  );

-- 4) financials: scoped via the parent individual's saint_family
DROP POLICY IF EXISTS "fin_insert_family_servant" ON public.financials;
CREATE POLICY "fin_insert_family_servant" ON public.financials FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.individuals i
      WHERE i.id = financials.individual_id
        AND i.saint_family = public.get_user_saint_family()
    )
  );

DROP POLICY IF EXISTS "fin_update_family_servant" ON public.financials;
CREATE POLICY "fin_update_family_servant" ON public.financials FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.individuals i
      WHERE i.id = financials.individual_id
        AND i.saint_family = public.get_user_saint_family()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.individuals i
      WHERE i.id = financials.individual_id
        AND i.saint_family = public.get_user_saint_family()
    )
  );

-- 5) monthly_church_support: scoped via the parent individual's saint_family
DROP POLICY IF EXISTS "support_insert_family_servant" ON public.monthly_church_support;
CREATE POLICY "support_insert_family_servant" ON public.monthly_church_support FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.individuals i
      WHERE i.id = monthly_church_support.individual_id
        AND i.saint_family = public.get_user_saint_family()
    )
  );

DROP POLICY IF EXISTS "support_update_family_servant" ON public.monthly_church_support;
CREATE POLICY "support_update_family_servant" ON public.monthly_church_support FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.individuals i
      WHERE i.id = monthly_church_support.individual_id
        AND i.saint_family = public.get_user_saint_family()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.individuals i
      WHERE i.id = monthly_church_support.individual_id
        AND i.saint_family = public.get_user_saint_family()
    )
  );

-- 6) dashboard_metrics: servants UPDATE/INSERT only their own sector
DROP POLICY IF EXISTS "dm_insert_family_servant" ON public.dashboard_metrics;
CREATE POLICY "dm_insert_family_servant" ON public.dashboard_metrics FOR INSERT TO authenticated
  WITH CHECK (sector = public.get_user_sector());

DROP POLICY IF EXISTS "dm_update_family_servant" ON public.dashboard_metrics;
CREATE POLICY "dm_update_family_servant" ON public.dashboard_metrics FOR UPDATE TO authenticated
  USING (sector = public.get_user_sector())
  WITH CHECK (sector = public.get_user_sector());

NOTIFY pgrst, 'reload schema';
