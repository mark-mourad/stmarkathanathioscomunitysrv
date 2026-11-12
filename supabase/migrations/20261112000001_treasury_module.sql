-- =============================================================================
-- Treasury & Fund Manager module (الخزنة / صندوق الخدمة)
-- -----------------------------------------------------------------------------
-- 1) Register the Arabic/English label for the exclusive TREASURER role.
-- 2) Add public.is_treasurer() helper.
-- 3) Create public.treasury_transactions ("سجل الحركات المالية") with strict RLS:
--      - admins + treasurer -> all rows (read/write)
--      - family servants    -> read-only, own family only
-- 4) Let the treasurer update the financial chart rows in dashboard_metrics
--    (four saint families + الأسر المستترة).
-- 5) Restrictive RLS policies that keep the treasurer completely away from
--    beneficiary / medical / inventory / clothes data.
-- 6) Enforce TREASURER mutual exclusivity with every other operational role.
-- Safe to run multiple times.
-- =============================================================================

-- 1) Role label -----------------------------------------------------------------
INSERT INTO public.role_labels (role, label_ar, label_en)
VALUES (
  'TREASURER',
  'خادم الصندوق / مسؤول الخزنة',
  'Treasurer & Fund Manager'
)
ON CONFLICT (role) DO UPDATE
SET label_ar = EXCLUDED.label_ar,
    label_en = EXCLUDED.label_en;

-- 2) Helper ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_treasurer()
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
      AND role = 'TREASURER'::public.app_role
  )
$$;

GRANT EXECUTE ON FUNCTION public.is_treasurer() TO authenticated;

-- 3) Treasury transactions ------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.treasury_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  saint_family TEXT NOT NULL
    CHECK (saint_family IN ('متى', 'مرقس', 'لوقا', 'يوحنا', 'أسر مستترة')),
  transaction_date DATE NOT NULL DEFAULT CURRENT_DATE,
  transaction_type TEXT NOT NULL
    CHECK (transaction_type IN ('income', 'expense')),
  category TEXT NOT NULL,
  amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
  description TEXT,
  reference TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.treasury_transactions IS
  'سجل حركات الخزنة: إيرادات ومصروفات صندوق الخدمة لكل أسرة';
COMMENT ON COLUMN public.treasury_transactions.transaction_type IS
  'income = إيراد / expense = مصروف';
COMMENT ON COLUMN public.treasury_transactions.saint_family IS
  'قيمة individuals.saint_family؛ أسر مستترة مخفية عن غير المصرح لهم';

GRANT SELECT, INSERT, UPDATE, DELETE ON public.treasury_transactions TO authenticated;
GRANT ALL ON public.treasury_transactions TO service_role;
ALTER TABLE public.treasury_transactions ENABLE ROW LEVEL SECURITY;

-- Read: admins + treasurer see every family; a family servant sees only their own.
DROP POLICY IF EXISTS "treasury_select_scoped" ON public.treasury_transactions;
CREATE POLICY "treasury_select_scoped"
  ON public.treasury_transactions
  FOR SELECT
  TO authenticated
  USING (
    public.is_admin()
    OR public.is_treasurer()
    OR saint_family = public.get_user_saint_family()
  );

-- Write: only admins and the exclusive treasurer may record financial movements.
DROP POLICY IF EXISTS "treasury_insert_managers" ON public.treasury_transactions;
CREATE POLICY "treasury_insert_managers"
  ON public.treasury_transactions
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin() OR public.is_treasurer());

DROP POLICY IF EXISTS "treasury_update_managers" ON public.treasury_transactions;
CREATE POLICY "treasury_update_managers"
  ON public.treasury_transactions
  FOR UPDATE
  TO authenticated
  USING (public.is_admin() OR public.is_treasurer())
  WITH CHECK (public.is_admin() OR public.is_treasurer());

DROP POLICY IF EXISTS "treasury_delete_managers" ON public.treasury_transactions;
CREATE POLICY "treasury_delete_managers"
  ON public.treasury_transactions
  FOR DELETE
  TO authenticated
  USING (public.is_admin() OR public.is_treasurer());

-- Filter/export indexes (date range, type, category, family).
CREATE INDEX IF NOT EXISTS idx_treasury_transactions_family_date
  ON public.treasury_transactions (saint_family, transaction_date DESC);
CREATE INDEX IF NOT EXISTS idx_treasury_transactions_type_category
  ON public.treasury_transactions (transaction_type, category);
CREATE INDEX IF NOT EXISTS idx_treasury_transactions_date
  ON public.treasury_transactions (transaction_date DESC);
CREATE INDEX IF NOT EXISTS idx_treasury_transactions_created
  ON public.treasury_transactions (created_at DESC);

-- Keep updated_at fresh + write every movement to the audit trail.
DROP TRIGGER IF EXISTS touch_treasury_transactions ON public.treasury_transactions;
CREATE TRIGGER touch_treasury_transactions
  BEFORE UPDATE ON public.treasury_transactions
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

DROP TRIGGER IF EXISTS audit_treasury_transactions ON public.treasury_transactions;
CREATE TRIGGER audit_treasury_transactions
  AFTER INSERT OR UPDATE OR DELETE ON public.treasury_transactions
  FOR EACH ROW EXECUTE FUNCTION public.log_audit();

-- 4) Financial charts: treasurer may update every sector ------------------------
DROP POLICY IF EXISTS "dm_write_treasurer" ON public.dashboard_metrics;
CREATE POLICY "dm_write_treasurer"
  ON public.dashboard_metrics
  FOR ALL
  TO authenticated
  USING (public.is_treasurer())
  WITH CHECK (public.is_treasurer());

-- 5) Keep the treasurer out of unrelated sensitive modules ----------------------
--    These are RESTRICTIVE policies, so they AND with the existing permissive
--    policies and remove access without changing behaviour for any other role.
DO $$
DECLARE
  tbl TEXT;
  blocked TEXT[] := ARRAY[
    'individuals',
    'family_members',
    'financials',
    'monthly_church_support',
    'assistance_logs',
    'bridal_prep_details',
    'medical_aid_details',
    'inventory',
    'blessing_distribution',
    'clothes_requests',
    'furniture_inventory',
    'furniture_requests',
    'supplies_inventory',
    'pharmacy_inventory',
    'pharmacy_requests',
    'audit_log'
  ];
BEGIN
  FOREACH tbl IN ARRAY blocked LOOP
    IF EXISTS (
      SELECT 1 FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = tbl
    ) THEN
      EXECUTE format(
        'DROP POLICY IF EXISTS %I ON public.%I',
        'treasurer_block_' || tbl,
        tbl
      );
      EXECUTE format(
        'CREATE POLICY %I ON public.%I AS RESTRICTIVE FOR ALL TO authenticated USING (NOT public.is_treasurer()) WITH CHECK (NOT public.is_treasurer())',
        'treasurer_block_' || tbl,
        tbl
      );
    END IF;
  END LOOP;
END $$;

-- 6) TREASURER is mutually exclusive with every other operational role ---------
CREATE OR REPLACE FUNCTION public.enforce_treasurer_exclusivity()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.role = 'TREASURER'::public.app_role THEN
    IF EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = NEW.user_id
        AND id <> NEW.id
        AND role <> 'TREASURER'::public.app_role
    ) THEN
      RAISE EXCEPTION 'TREASURER role must be exclusive: remove the other roles first';
    END IF;
  ELSE
    IF EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = NEW.user_id
        AND role = 'TREASURER'::public.app_role
    ) THEN
      RAISE EXCEPTION 'TREASURER role must be exclusive: remove it before assigning another role';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enforce_treasurer_exclusivity_trigger ON public.user_roles;
CREATE TRIGGER enforce_treasurer_exclusivity_trigger
  BEFORE INSERT OR UPDATE ON public.user_roles
  FOR EACH ROW EXECUTE FUNCTION public.enforce_treasurer_exclusivity();

NOTIFY pgrst, 'reload schema';
