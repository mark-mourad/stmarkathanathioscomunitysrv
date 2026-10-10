-- =============================================================================
-- Family Condition Notes (ملحوظات عن حالة الأسرة)
-- -----------------------------------------------------------------------------
-- Adds a new dynamic section shown right before Household Goods across the
-- Add form, Edit form, and Beneficiary Profile.
--
-- Stored as a JSONB array on public.individuals, mirroring the existing
-- household_goods column, where each entry is:
--   {
--     "member_name": text,   -- family member name (الفرد)
--     "category":    text,   -- 'diseases' | 'disabilities' | 'other'
--     "title":       text,   -- اسم المرض / الإعاقة / الظرف
--     "notes":       text    -- الملاحظات
--   }
--
-- RLS: no new policies are required. This is a column on an existing table, so
-- it is already covered by the individuals table policies (ind_select,
-- ind_insert_admin, ind_update_admin, ind_delete_admin and the family-servant
-- policies ind_insert_family_servant / ind_update_family_servant defined in
-- 20260731000001_family_servant_write_rls.sql).
-- =============================================================================

ALTER TABLE public.individuals
  ADD COLUMN IF NOT EXISTS family_conditions JSONB NOT NULL DEFAULT '[]'::jsonb;

COMMENT ON COLUMN public.individuals.family_conditions IS
  'ملحوظات عن حالة الأسرة: [{ member_name, category, title, notes }]';

-- Ensure the column is exposed to PostgREST / the Supabase API immediately.
NOTIFY pgrst, 'reload schema';
