-- =============================================================================
-- Treasury accounting & auditing workflow (الخزنة / صندوق الخدمة)
-- -----------------------------------------------------------------------------
-- 1) Allow general treasury income (saint_family IS NULL) and keep expenses
--    tied to one of the five canonical families.
-- 2) Track who created each movement + whether it already affected a family
--    metric (so edits/deletes reverse the right amount exactly once).
-- 3) Atomic RPCs:
--      - record_treasury_transaction
--      - update_treasury_transaction
--      - delete_treasury_transaction
--    An expense automatically increments the family's category total in
--    dashboard_metrics; income never touches the family metrics.
-- Safe to run multiple times.
-- =============================================================================

-- 1) General income + family targeting -----------------------------------------
ALTER TABLE public.treasury_transactions
  ALTER COLUMN saint_family DROP NOT NULL;

ALTER TABLE public.treasury_transactions
  DROP CONSTRAINT IF EXISTS treasury_transactions_saint_family_check;

ALTER TABLE public.treasury_transactions
  DROP CONSTRAINT IF EXISTS treasury_transactions_family_by_type_check;

ALTER TABLE public.treasury_transactions
  ADD CONSTRAINT treasury_transactions_family_by_type_check
  CHECK (
    (
      transaction_type = 'expense'
      AND saint_family IS NOT NULL
      AND saint_family IN ('متى', 'مرقس', 'لوقا', 'يوحنا', 'أسر مستترة')
    )
    OR (
      transaction_type = 'income'
      AND (
        saint_family IS NULL
        OR saint_family IN ('متى', 'مرقس', 'لوقا', 'يوحنا', 'أسر مستترة')
      )
    )
  );

COMMENT ON COLUMN public.treasury_transactions.saint_family IS
  'NULL = إيراد عام للخزنة؛ قيمة الأسرة مطلوبة للمصروفات المخصصة';

-- 2) Creator snapshot + metric-effect tracking ---------------------------------
ALTER TABLE public.treasury_transactions
  ADD COLUMN IF NOT EXISTS created_by_email TEXT;

ALTER TABLE public.treasury_transactions
  ADD COLUMN IF NOT EXISTS affects_metric BOOLEAN NOT NULL DEFAULT false;

UPDATE public.treasury_transactions AS tt
SET created_by_email = u.email
FROM auth.users AS u
WHERE tt.created_by = u.id
  AND (tt.created_by_email IS NULL OR tt.created_by_email = '');

-- `save_treasury_metric_with_audit` (dashboard chart edits) already applied its
-- delta to dashboard_metrics, so those rows must be reversible exactly once by
-- the new RPCs. Older rows from the legacy free-form treasury form were never
-- reflected in the metrics and must stay `false`.
UPDATE public.treasury_transactions
SET affects_metric = true
WHERE transaction_type = 'expense'
  AND description LIKE 'تعديل قيمة%'
  AND category IN (
    'شهريات', 'مساعدات شهرية', 'الشهريات', 'مساعدات علاجية', 'مساعدات دراسية'
  )
  AND saint_family IN ('متى', 'مرقس', 'لوقا', 'يوحنا', 'أسر مستترة');

CREATE OR REPLACE FUNCTION public.set_treasury_created_by_email()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.created_by IS NULL THEN
    NEW.created_by := auth.uid();
  END IF;

  IF TG_OP = 'INSERT'
     OR NEW.created_by IS DISTINCT FROM OLD.created_by
     OR NEW.created_by_email IS NULL THEN
    SELECT email INTO NEW.created_by_email
    FROM auth.users
    WHERE id = NEW.created_by;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS set_treasury_created_by_email_trigger ON public.treasury_transactions;
CREATE TRIGGER set_treasury_created_by_email_trigger
  BEFORE INSERT OR UPDATE ON public.treasury_transactions
  FOR EACH ROW EXECUTE FUNCTION public.set_treasury_created_by_email();

-- 3) Metric helper -------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.apply_treasury_expense_delta(
  p_saint_family TEXT,
  p_category TEXT,
  p_delta NUMERIC
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_metric_key TEXT;
  v_sector TEXT;
  v_metric_id UUID;
  v_next_order INTEGER;
BEGIN
  IF NOT (public.is_admin() OR public.is_treasurer()) THEN
    RAISE EXCEPTION 'غير مصرح لك بتعديل القيم المالية';
  END IF;

  v_metric_key := CASE
    WHEN p_category IN ('شهريات', 'مساعدات شهرية', 'الشهريات') THEN 'monthly'
    WHEN p_category IN ('مساعدات علاجية') THEN 'therapeutic'
    WHEN p_category IN ('مساعدات دراسية') THEN 'study'
    ELSE NULL
  END;

  v_sector := CASE p_saint_family
    WHEN 'مرقس' THEN 'القديس مرقس'
    WHEN 'يوحنا' THEN 'القديس يوحنا'
    WHEN 'لوقا' THEN 'القديس لوقا'
    WHEN 'متى' THEN 'القديس متى'
    WHEN 'أسر مستترة' THEN 'الأسر المستترة'
    ELSE NULL
  END;

  -- Legacy rows may use a category/family that was never linked to a metric.
  IF v_metric_key IS NULL OR v_sector IS NULL THEN
    RETURN;
  END IF;

  SELECT id INTO v_metric_id
  FROM public.dashboard_metrics
  WHERE sector = v_sector
  FOR UPDATE;

  IF v_metric_id IS NULL THEN
    SELECT COALESCE(MAX(display_order), 0) + 1
    INTO v_next_order
    FROM public.dashboard_metrics;

    INSERT INTO public.dashboard_metrics (
      sector, monthly, study, therapeutic, display_order, updated_by
    )
    VALUES (v_sector, 0, 0, 0, v_next_order, auth.uid())
    RETURNING id INTO v_metric_id;
  END IF;

  UPDATE public.dashboard_metrics
  SET monthly = CASE
        WHEN v_metric_key = 'monthly' THEN GREATEST(0, monthly + p_delta)
        ELSE monthly
      END,
      study = CASE
        WHEN v_metric_key = 'study' THEN GREATEST(0, study + p_delta)
        ELSE study
      END,
      therapeutic = CASE
        WHEN v_metric_key = 'therapeutic' THEN GREATEST(0, therapeutic + p_delta)
        ELSE therapeutic
      END,
      updated_by = auth.uid()
  WHERE id = v_metric_id;
END;
$$;

-- 4) Atomic transaction RPCs ---------------------------------------------------
CREATE OR REPLACE FUNCTION public.record_treasury_transaction(
  p_saint_family TEXT,
  p_transaction_date DATE,
  p_transaction_type TEXT,
  p_category TEXT,
  p_amount NUMERIC,
  p_description TEXT,
  p_reference TEXT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_family TEXT;
  v_category TEXT;
  v_id UUID;
BEGIN
  IF NOT (public.is_admin() OR public.is_treasurer()) THEN
    RAISE EXCEPTION 'غير مصرح لك بتسجيل الحركات المالية';
  END IF;

  IF p_transaction_type NOT IN ('income', 'expense') THEN
    RAISE EXCEPTION 'نوع الحركة غير صحيح';
  END IF;
  IF p_amount IS NULL OR p_amount <= 0 THEN
    RAISE EXCEPTION 'المبلغ يجب أن يكون أكبر من صفر';
  END IF;
  IF p_description IS NULL OR length(btrim(p_description)) = 0 THEN
    RAISE EXCEPTION 'برجاء إدخال ملاحظات / وصف الحركة';
  END IF;
  IF length(btrim(p_description)) > 2000 THEN
    RAISE EXCEPTION 'ملاحظات الحركة يجب ألا تتجاوز 2000 حرف';
  END IF;

  v_category := CASE
    WHEN p_category = 'مساعدات شهرية' THEN 'شهريات'
    ELSE btrim(COALESCE(p_category, ''))
  END;

  IF v_category = '' THEN
    RAISE EXCEPTION 'برجاء إدخال البند';
  END IF;

  IF p_transaction_type = 'expense' THEN
    IF p_saint_family IS NULL
       OR p_saint_family NOT IN ('متى', 'مرقس', 'لوقا', 'يوحنا', 'أسر مستترة') THEN
      RAISE EXCEPTION 'برجاء اختيار الأسرة المستفيدة';
    END IF;
    IF v_category NOT IN ('شهريات', 'مساعدات علاجية', 'مساعدات دراسية') THEN
      RAISE EXCEPTION 'برجاء اختيار البند: شهريات أو مساعدات علاجية أو مساعدات دراسية';
    END IF;
    v_family := p_saint_family;
  ELSE
    -- General treasury income is never tied to a family.
    v_family := NULL;
  END IF;

  INSERT INTO public.treasury_transactions (
    saint_family,
    transaction_date,
    transaction_type,
    category,
    amount,
    description,
    reference,
    created_by,
    affects_metric
  )
  VALUES (
    v_family,
    COALESCE(p_transaction_date, CURRENT_DATE),
    p_transaction_type,
    v_category,
    p_amount,
    btrim(p_description),
    NULLIF(btrim(COALESCE(p_reference, '')), ''),
    auth.uid(),
    p_transaction_type = 'expense'
  )
  RETURNING id INTO v_id;

  IF p_transaction_type = 'expense' THEN
    PERFORM public.apply_treasury_expense_delta(v_family, v_category, p_amount);
  END IF;

  RETURN v_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_treasury_transaction(
  p_id UUID,
  p_saint_family TEXT,
  p_transaction_date DATE,
  p_transaction_type TEXT,
  p_category TEXT,
  p_amount NUMERIC,
  p_description TEXT,
  p_reference TEXT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_old public.treasury_transactions%ROWTYPE;
  v_family TEXT;
  v_category TEXT;
BEGIN
  IF NOT (public.is_admin() OR public.is_treasurer()) THEN
    RAISE EXCEPTION 'غير مصرح لك بتعديل الحركات المالية';
  END IF;

  SELECT * INTO v_old
  FROM public.treasury_transactions
  WHERE id = p_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'لم يتم العثور على الحركة المالية';
  END IF;

  IF p_transaction_type NOT IN ('income', 'expense') THEN
    RAISE EXCEPTION 'نوع الحركة غير صحيح';
  END IF;
  IF p_amount IS NULL OR p_amount <= 0 THEN
    RAISE EXCEPTION 'المبلغ يجب أن يكون أكبر من صفر';
  END IF;
  IF p_description IS NULL OR length(btrim(p_description)) = 0 THEN
    RAISE EXCEPTION 'برجاء إدخال ملاحظات / وصف الحركة';
  END IF;
  IF length(btrim(p_description)) > 2000 THEN
    RAISE EXCEPTION 'ملاحظات الحركة يجب ألا تتجاوز 2000 حرف';
  END IF;

  v_category := CASE
    WHEN p_category = 'مساعدات شهرية' THEN 'شهريات'
    ELSE btrim(COALESCE(p_category, ''))
  END;

  IF v_category = '' THEN
    RAISE EXCEPTION 'برجاء إدخال البند';
  END IF;

  IF p_transaction_type = 'expense' THEN
    IF p_saint_family IS NULL
       OR p_saint_family NOT IN ('متى', 'مرقس', 'لوقا', 'يوحنا', 'أسر مستترة') THEN
      RAISE EXCEPTION 'برجاء اختيار الأسرة المستفيدة';
    END IF;
    IF v_category NOT IN ('شهريات', 'مساعدات علاجية', 'مساعدات دراسية') THEN
      RAISE EXCEPTION 'برجاء اختيار البند: شهريات أو مساعدات علاجية أو مساعدات دراسية';
    END IF;
    v_family := p_saint_family;
  ELSE
    v_family := NULL;
  END IF;

  -- Reverse the old effect (only if that row actually changed a metric).
  IF v_old.affects_metric AND v_old.transaction_type = 'expense' THEN
    PERFORM public.apply_treasury_expense_delta(
      v_old.saint_family,
      v_old.category,
      -v_old.amount
    );
  END IF;

  UPDATE public.treasury_transactions
  SET saint_family = v_family,
      transaction_date = COALESCE(p_transaction_date, CURRENT_DATE),
      transaction_type = p_transaction_type,
      category = v_category,
      amount = p_amount,
      description = btrim(p_description),
      reference = NULLIF(btrim(COALESCE(p_reference, '')), ''),
      affects_metric = p_transaction_type = 'expense'
  WHERE id = p_id;

  IF p_transaction_type = 'expense' THEN
    PERFORM public.apply_treasury_expense_delta(v_family, v_category, p_amount);
  END IF;

  RETURN p_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.delete_treasury_transaction(p_id UUID)
RETURNS UUID
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_old public.treasury_transactions%ROWTYPE;
BEGIN
  IF NOT (public.is_admin() OR public.is_treasurer()) THEN
    RAISE EXCEPTION 'غير مصرح لك بحذف الحركات المالية';
  END IF;

  SELECT * INTO v_old
  FROM public.treasury_transactions
  WHERE id = p_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'لم يتم العثور على الحركة المالية';
  END IF;

  IF v_old.affects_metric AND v_old.transaction_type = 'expense' THEN
    PERFORM public.apply_treasury_expense_delta(
      v_old.saint_family,
      v_old.category,
      -v_old.amount
    );
  END IF;

  DELETE FROM public.treasury_transactions WHERE id = p_id;

  RETURN p_id;
END;
$$;

-- 5) Permissions ---------------------------------------------------------------
REVOKE ALL ON FUNCTION public.apply_treasury_expense_delta(TEXT, TEXT, NUMERIC)
  FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.apply_treasury_expense_delta(TEXT, TEXT, NUMERIC)
  TO authenticated;

REVOKE ALL ON FUNCTION public.record_treasury_transaction(TEXT, DATE, TEXT, TEXT, NUMERIC, TEXT, TEXT)
  FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.record_treasury_transaction(TEXT, DATE, TEXT, TEXT, NUMERIC, TEXT, TEXT)
  TO authenticated;

REVOKE ALL ON FUNCTION public.update_treasury_transaction(UUID, TEXT, DATE, TEXT, TEXT, NUMERIC, TEXT, TEXT)
  FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.update_treasury_transaction(UUID, TEXT, DATE, TEXT, TEXT, NUMERIC, TEXT, TEXT)
  TO authenticated;

REVOKE ALL ON FUNCTION public.delete_treasury_transaction(UUID)
  FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.delete_treasury_transaction(UUID)
  TO authenticated;

NOTIFY pgrst, 'reload schema';
