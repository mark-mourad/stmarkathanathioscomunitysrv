-- CLOTHES_MANAGER has full authority in the clothes module only.
-- Keep the role isolated from beneficiary writes and every non-clothes module.

DROP POLICY IF EXISTS "clothes_manager_profile_scope" ON public.profiles;
CREATE POLICY "clothes_manager_profile_scope"
  ON public.profiles
  AS RESTRICTIVE
  FOR ALL
  TO authenticated
  USING (
    NOT public.has_any_role(auth.uid(), 'CLOTHES_MANAGER')
    OR auth.uid() = id
  )
  WITH CHECK (
    NOT public.has_any_role(auth.uid(), 'CLOTHES_MANAGER')
    OR auth.uid() = id
  );

DROP POLICY IF EXISTS "clothes_manager_role_scope" ON public.user_roles;
CREATE POLICY "clothes_manager_role_scope"
  ON public.user_roles
  AS RESTRICTIVE
  FOR ALL
  TO authenticated
  USING (
    NOT public.has_any_role(auth.uid(), 'CLOTHES_MANAGER')
    OR auth.uid() = user_id
  )
  WITH CHECK (
    NOT public.has_any_role(auth.uid(), 'CLOTHES_MANAGER')
    OR auth.uid() = user_id
  );

DO $$
DECLARE
  tbl TEXT;
  blocked TEXT[] := ARRAY[
    'individuals',
    'family_members',
    'financials',
    'monthly_church_support',
    'dashboard_metrics',
    'audit_log',
    'inventory',
    'blessing_distribution',
    'assistance_logs',
    'bridal_prep_details',
    'medical_aid_details',
    'furniture_inventory',
    'furniture_requests',
    'supplies_inventory',
    'pharmacy_inventory',
    'pharmacy_requests',
    'treasury_transactions'
  ];
BEGIN
  FOREACH tbl IN ARRAY blocked LOOP
    IF EXISTS (
      SELECT 1 FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = tbl
    ) THEN
      EXECUTE format(
        'DROP POLICY IF EXISTS %I ON public.%I',
        'clothes_manager_block_' || tbl,
        tbl
      );
      EXECUTE format(
        'CREATE POLICY %I ON public.%I AS RESTRICTIVE FOR ALL TO authenticated USING (NOT public.has_any_role(auth.uid(), ''CLOTHES_MANAGER'')) WITH CHECK (NOT public.has_any_role(auth.uid(), ''CLOTHES_MANAGER''))',
        'clothes_manager_block_' || tbl,
        tbl
      );
    END IF;
  END LOOP;
END $$;

CREATE OR REPLACE FUNCTION public.enforce_clothes_manager_exclusivity()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.role = 'CLOTHES_MANAGER'::public.app_role THEN
    IF EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = NEW.user_id
        AND id <> NEW.id
    ) THEN
      RAISE EXCEPTION 'CLOTHES_MANAGER must be exclusive: remove the other roles first';
    END IF;
  ELSIF EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = NEW.user_id
      AND id <> NEW.id
      AND role = 'CLOTHES_MANAGER'::public.app_role
  ) THEN
    RAISE EXCEPTION 'CLOTHES_MANAGER must be exclusive: remove it before assigning another role';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enforce_clothes_manager_exclusivity_trigger ON public.user_roles;
CREATE TRIGGER enforce_clothes_manager_exclusivity_trigger
  BEFORE INSERT OR UPDATE ON public.user_roles
  FOR EACH ROW EXECUTE FUNCTION public.enforce_clothes_manager_exclusivity();

CREATE OR REPLACE FUNCTION public.get_clothes_family_directory(
  p_saint_family TEXT DEFAULT NULL,
  p_family_member_id UUID DEFAULT NULL
)
RETURNS TABLE (
  family_member_id UUID,
  full_name TEXT,
  relation TEXT,
  individual_id UUID,
  parent_name TEXT,
  saint_family TEXT
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_any_role(auth.uid(), 'CLOTHES_MANAGER') THEN
    RAISE EXCEPTION 'غير مصرح لك بعرض دليل الملابس' USING ERRCODE = '42501';
  END IF;

  RETURN QUERY
  SELECT fm.id, fm.full_name, fm.relation, i.id, i.full_name, i.saint_family
  FROM public.family_members fm
  JOIN public.individuals i ON i.id = fm.individual_id
  WHERE fm.relation IN ('ابن', 'ابنة')
    AND (p_saint_family IS NULL OR i.saint_family = p_saint_family)
    AND (p_family_member_id IS NULL OR fm.id = p_family_member_id)
  ORDER BY i.full_name, fm.full_name;
END;
$$;

REVOKE ALL ON FUNCTION public.get_clothes_family_directory(TEXT, UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_clothes_family_directory(TEXT, UUID) TO authenticated;

CREATE OR REPLACE FUNCTION public.is_valid_clothes_manager_request(
  p_individual_id UUID,
  p_family_member_id UUID,
  p_saint_family TEXT
)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_any_role(auth.uid(), 'CLOTHES_MANAGER') AND EXISTS (
    SELECT 1
    FROM public.family_members fm
    JOIN public.individuals i ON i.id = fm.individual_id
    WHERE fm.id = p_family_member_id
      AND fm.individual_id = p_individual_id
      AND fm.relation IN ('ابن', 'ابنة')
      AND i.saint_family = p_saint_family
  );
$$;

REVOKE ALL ON FUNCTION public.is_valid_clothes_manager_request(UUID, UUID, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_valid_clothes_manager_request(UUID, UUID, TEXT) TO authenticated;

DROP POLICY IF EXISTS "clothes_manager_select_all" ON public.clothes_requests;
CREATE POLICY "clothes_manager_select_all"
  ON public.clothes_requests
  FOR SELECT
  TO authenticated
  USING (public.has_any_role(auth.uid(), 'CLOTHES_MANAGER'));

DROP POLICY IF EXISTS "clothes_manager_insert_all" ON public.clothes_requests;
CREATE POLICY "clothes_manager_insert_all"
  ON public.clothes_requests
  FOR INSERT
  TO authenticated
  WITH CHECK (
    public.has_any_role(auth.uid(), 'CLOTHES_MANAGER')
    AND public.is_valid_clothes_manager_request(individual_id, family_member_id, saint_family)
  );

DROP POLICY IF EXISTS "clothes_manager_update_all" ON public.clothes_requests;
CREATE POLICY "clothes_manager_update_all"
  ON public.clothes_requests
  FOR UPDATE
  TO authenticated
  USING (public.has_any_role(auth.uid(), 'CLOTHES_MANAGER'))
  WITH CHECK (
    public.has_any_role(auth.uid(), 'CLOTHES_MANAGER')
    AND public.is_valid_clothes_manager_request(individual_id, family_member_id, saint_family)
  );

DROP POLICY IF EXISTS "clothes_manager_delete_all" ON public.clothes_requests;
CREATE POLICY "clothes_manager_delete_all"
  ON public.clothes_requests
  FOR DELETE
  TO authenticated
  USING (public.has_any_role(auth.uid(), 'CLOTHES_MANAGER'));

NOTIFY pgrst, 'reload schema';