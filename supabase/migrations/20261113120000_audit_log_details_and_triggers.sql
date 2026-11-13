-- =============================================================================
-- Audit trail (سجل التعديلات) improvements
-- -----------------------------------------------------------------------------
-- 1) Store a human readable entity label (e.g. the beneficiary name) next to
--    every audit row so leadership can review the log without raw UUIDs.
-- 2) Store UPDATE rows as an explicit before/after diff (with the list of
--    changed fields) and INSERT/DELETE rows as a single snapshot, so the UI can
--    show exactly what changed and what the previous value was.
-- 3) Cover every operational table with the audit trigger (clothes requests,
--    furniture, supplies and pharmacy tables were previously not logged).
-- Safe to run multiple times.
-- =============================================================================

-- 1) Columns -------------------------------------------------------------------
ALTER TABLE public.audit_log
  ADD COLUMN IF NOT EXISTS entity_label TEXT;

COMMENT ON COLUMN public.audit_log.entity_label IS
  'اسم مقروء للجهة المتأثرة (اسم المخدوم / الحركة / الطلب) بدل الاعتماد على المعرف فقط';

-- 2) Entity label resolver -----------------------------------------------------
-- Resolves the most meaningful human readable name from a row. Explicit name
-- columns win, then the linked beneficiary (individual_id), then category-like
-- fallbacks. SECURITY DEFINER so triggers can resolve beneficiary names even
-- for roles that cannot read the individuals table directly.
CREATE OR REPLACE FUNCTION public.audit_entity_label(p_table TEXT, p_row JSONB)
RETURNS TEXT
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_label TEXT;
  v_individual_id UUID;
BEGIN
  IF p_row IS NULL THEN
    RETURN NULL;
  END IF;

  -- 2.1) Explicit name columns.
  v_label := COALESCE(
    NULLIF(btrim(p_row ->> 'beneficiary_name'), ''),
    NULLIF(btrim(p_row ->> 'full_name'), ''),
    NULLIF(btrim(p_row ->> 'name'), ''),
    NULLIF(btrim(p_row ->> 'item_name'), ''),
    NULLIF(btrim(p_row ->> 'medicine_name'), ''),
    NULLIF(btrim(p_row ->> 'service_name'), ''),
    NULLIF(btrim(p_row ->> 'sector'), ''),
    NULLIF(btrim(p_row ->> 'metric_key'), ''),
    NULLIF(btrim(p_row ->> 'title'), '')
  );

  IF v_label IS NOT NULL THEN
    -- Family members keep their own name, but mention the beneficiary family.
    IF p_table = 'family_members'
       AND NULLIF(btrim(p_row ->> 'relation'), '') IS NOT NULL THEN
      RETURN v_label || ' (' || btrim(p_row ->> 'relation') || ')';
    END IF;
    RETURN v_label;
  END IF;

  -- 2.2) Link to the beneficiary (financials, clothing, blessings, aid...).
  BEGIN
    v_individual_id := NULLIF(p_row ->> 'individual_id', '')::UUID;
  EXCEPTION WHEN others THEN
    v_individual_id := NULL;
  END;

  IF v_individual_id IS NOT NULL THEN
    SELECT full_name INTO v_label
    FROM public.individuals
    WHERE id = v_individual_id;

    IF v_label IS NOT NULL THEN
      RETURN v_label;
    END IF;
  END IF;

  -- 2.3) Generic fallbacks (treasury, inventory, requests...).
  RETURN COALESCE(
    NULLIF(btrim(p_row ->> 'saint_family'), ''),
    NULLIF(btrim(p_row ->> 'church_name'), ''),
    NULLIF(btrim(p_row ->> 'category'), ''),
    NULLIF(btrim(p_row ->> 'disease_category'), ''),
    NULLIF(btrim(p_row ->> 'description'), ''),
    NULLIF(btrim(p_row ->> 'notes'), ''),
    NULLIF(btrim(p_row ->> 'details'), ''),
    NULLIF(btrim(p_row ->> 'status'), '')
  );
END $$;

REVOKE ALL ON FUNCTION public.audit_entity_label(TEXT, JSONB) FROM PUBLIC, anon, authenticated;

-- 3) Audit trigger -------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.log_audit()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_email TEXT;
  v_row JSONB;
  v_entity TEXT;
  v_changes JSONB;
  v_changed TEXT[];
BEGIN
  SELECT email INTO v_email FROM auth.users WHERE id = auth.uid();

  IF TG_OP = 'DELETE' THEN
    v_row := to_jsonb(OLD);
    v_entity := public.audit_entity_label(TG_TABLE_NAME, v_row);
    v_changes := jsonb_build_object('before', v_row, 'changed', '[]'::jsonb);
  ELSIF TG_OP = 'UPDATE' THEN
    v_row := to_jsonb(NEW);
    v_entity := public.audit_entity_label(TG_TABLE_NAME, v_row);

    SELECT COALESCE(array_agg(k ORDER BY k), ARRAY[]::TEXT[])
    INTO v_changed
    FROM jsonb_object_keys(to_jsonb(NEW)) AS k
    WHERE (to_jsonb(NEW) -> k) IS DISTINCT FROM (to_jsonb(OLD) -> k);

    v_changes := jsonb_build_object(
      'before', to_jsonb(OLD),
      'after', to_jsonb(NEW),
      'changed', to_jsonb(v_changed)
    );
  ELSE
    v_row := to_jsonb(NEW);
    v_entity := public.audit_entity_label(TG_TABLE_NAME, v_row);
    v_changes := jsonb_build_object('after', v_row, 'changed', '[]'::jsonb);
  END IF;

  INSERT INTO public.audit_log (
    user_id,
    user_email,
    action,
    table_name,
    record_id,
    entity_label,
    changes
  )
  VALUES (
    auth.uid(),
    COALESCE(NULLIF(v_email, ''), 'unknown'),
    TG_OP,
    TG_TABLE_NAME,
    COALESCE(
      CASE WHEN TG_OP = 'DELETE' THEN OLD.id::TEXT ELSE NEW.id::TEXT END,
      NULL
    ),
    v_entity,
    v_changes
  );

  RETURN COALESCE(NEW, OLD);
END $$;

REVOKE EXECUTE ON FUNCTION public.log_audit() FROM PUBLIC, anon, authenticated;

-- 4) Trigger coverage for tables that were missing it ---------------------------
DO $$
DECLARE
  tbl TEXT;
  audited_tables TEXT[] := ARRAY[
    'clothes_requests',
    'furniture_inventory',
    'furniture_requests',
    'supplies_inventory',
    'pharmacy_inventory',
    'pharmacy_requests'
  ];
BEGIN
  FOREACH tbl IN ARRAY audited_tables LOOP
    IF to_regclass('public.' || tbl) IS NOT NULL THEN
      EXECUTE format(
        'DROP TRIGGER IF EXISTS %I ON public.%I',
        'audit_' || tbl,
        tbl
      );
      EXECUTE format(
        'CREATE TRIGGER %I AFTER INSERT OR UPDATE OR DELETE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.log_audit()',
        'audit_' || tbl,
        tbl
      );
    END IF;
  END LOOP;
END $$;

-- 5) Backfill entity labels for existing rows ----------------------------------
UPDATE public.audit_log
SET entity_label = public.audit_entity_label(table_name, changes)
WHERE entity_label IS NULL
  AND changes IS NOT NULL;

-- 6) Read indexes for the audit screen -----------------------------------------
CREATE INDEX IF NOT EXISTS idx_audit_log_created_at
  ON public.audit_log (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_audit_log_table_created
  ON public.audit_log (table_name, created_at DESC);

NOTIFY pgrst, 'reload schema';
