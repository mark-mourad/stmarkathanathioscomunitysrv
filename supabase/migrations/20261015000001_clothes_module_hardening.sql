-- =============================================================================
-- Holiday & School Clothes module hardening
-- -----------------------------------------------------------------------------
-- 1) Register the Arabic label for the exclusive CLOTHES_MANAGER role.
-- 2) Enforce "one request per child per category" with a partial unique index.
-- 3) Replace the blanket clothes_requests policies with scoped policies:
--      - admins                       -> all rows
--      - CLOTHES_MANAGER              -> read-only, all rows
--      - family servants              -> read/write only their own family
--    This keeps the manager out of every other module at the database layer.
-- 4) Add a composite index that supports the manager's family/category filters.
-- Safe to run multiple times.
-- =============================================================================

-- 1) Role label (Arabic + English)
INSERT INTO public.role_labels (role, label_ar, label_en)
VALUES (
  'CLOTHES_MANAGER',
  'مسؤول ملابس الأعياد والمدارس',
  'Holiday & School Clothes Manager'
)
ON CONFLICT (role) DO UPDATE
SET label_ar = EXCLUDED.label_ar,
    label_en = EXCLUDED.label_en;

-- 2) De-duplicate any pre-existing rows before creating the unique index.
--    We keep the most recently updated request for each child + category.
WITH ranked AS (
  SELECT
    id,
    ROW_NUMBER() OVER (
      PARTITION BY family_member_id, request_category
      ORDER BY updated_at DESC, created_at DESC, id DESC
    ) AS row_number
  FROM public.clothes_requests
  WHERE family_member_id IS NOT NULL
)
DELETE FROM public.clothes_requests
WHERE id IN (SELECT id FROM ranked WHERE row_number > 1);

CREATE UNIQUE INDEX IF NOT EXISTS uq_clothes_requests_child_category
  ON public.clothes_requests (family_member_id, request_category)
  WHERE family_member_id IS NOT NULL;

-- 3) Scoped RLS policies
DROP POLICY IF EXISTS "clothes_requests_select_auth" ON public.clothes_requests;
DROP POLICY IF EXISTS "clothes_requests_insert_auth" ON public.clothes_requests;
DROP POLICY IF EXISTS "clothes_requests_update_auth" ON public.clothes_requests;
DROP POLICY IF EXISTS "clothes_requests_delete_auth" ON public.clothes_requests;

DROP POLICY IF EXISTS "clothes_requests_select_scoped" ON public.clothes_requests;
CREATE POLICY "clothes_requests_select_scoped"
  ON public.clothes_requests
  FOR SELECT
  TO authenticated
  USING (
    public.is_admin()
    OR public.has_any_role(auth.uid(), 'CLOTHES_MANAGER')
    OR saint_family = public.get_user_saint_family()
  );

DROP POLICY IF EXISTS "clothes_requests_insert_family_scoped" ON public.clothes_requests;
CREATE POLICY "clothes_requests_insert_family_scoped"
  ON public.clothes_requests
  FOR INSERT
  TO authenticated
  WITH CHECK (
    public.is_admin()
    OR saint_family = public.get_user_saint_family()
  );

DROP POLICY IF EXISTS "clothes_requests_update_family_scoped" ON public.clothes_requests;
CREATE POLICY "clothes_requests_update_family_scoped"
  ON public.clothes_requests
  FOR UPDATE
  TO authenticated
  USING (
    public.is_admin()
    OR saint_family = public.get_user_saint_family()
  )
  WITH CHECK (
    public.is_admin()
    OR saint_family = public.get_user_saint_family()
  );

DROP POLICY IF EXISTS "clothes_requests_delete_family_scoped" ON public.clothes_requests;
CREATE POLICY "clothes_requests_delete_family_scoped"
  ON public.clothes_requests
  FOR DELETE
  TO authenticated
  USING (
    public.is_admin()
    OR saint_family = public.get_user_saint_family()
  );

-- 4) Manager filter index
CREATE INDEX IF NOT EXISTS idx_clothes_requests_family_category
  ON public.clothes_requests (saint_family, request_category);

NOTIFY pgrst, 'reload schema';
