-- =============================================================================
-- FIX: family servants must be able to DELETE child rows they own
-- -----------------------------------------------------------------------------
-- Bug: updateIndividual() synchronizes child rows by deleting the rows that
-- were removed from the form and re-inserting the rest. Family servants
-- (ST_MATTHEW / ST_MARK / ST_JOHN / ST_LUKE / ST_HIDDEN_FAMILIES) had INSERT
-- and UPDATE policies (from 20260731000001_family_servant_write_rls) but NO
-- DELETE policy, so RLS silently filtered every DELETE to 0 rows while the
-- subsequent INSERT still ran — duplicating the family members (and church
-- support) arrays on every save. Admins were unaffected because their
-- `*_write_admin` FOR ALL policies already cover DELETE.
--
-- Fix: grant family servants a scoped DELETE on family_members and
-- monthly_church_support, matching their existing INSERT/UPDATE scope (the
-- parent individual's saint_family equals the servant's assigned family).
-- =============================================================================

-- family_members: scoped via the parent individual's saint_family
DROP POLICY IF EXISTS "fam_delete_family_servant" ON public.family_members;
CREATE POLICY "fam_delete_family_servant" ON public.family_members FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.individuals i
      WHERE i.id = family_members.individual_id
        AND i.saint_family = public.get_user_saint_family()
    )
  );

-- monthly_church_support: scoped via the parent individual's saint_family
DROP POLICY IF EXISTS "support_delete_family_servant" ON public.monthly_church_support;
CREATE POLICY "support_delete_family_servant" ON public.monthly_church_support FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.individuals i
      WHERE i.id = monthly_church_support.individual_id
        AND i.saint_family = public.get_user_saint_family()
    )
  );

NOTIFY pgrst, 'reload schema';
