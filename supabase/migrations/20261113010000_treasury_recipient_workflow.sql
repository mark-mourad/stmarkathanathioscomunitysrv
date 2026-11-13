-- =============================================================================
-- Treasury receipt / recipient workflow (الخزنة / صندوق الخدمة)
-- -----------------------------------------------------------------------------
-- 1) Add recipient_name (who received the funds) + ensure the audit columns
--    created_by, created_by_email, affects_metric and reference exist.
-- 2) Tighten the family-by-type constraint:
--      - expense  -> saint_family must be one of the five canonical families
--      - income   -> saint_family must be NULL (general church-wide income)
-- 3) Require a non-empty audit note (description) for every transaction.
-- 4) Update record_treasury_transaction / update_treasury_transaction to accept
--    p_recipient_name (required for expenses, forced to NULL for income).
-- 5) Keep the metric-edit audit trail compatible with the new income rule.
-- Safe to run multiple times.
-- =============================================================================

-- 1) Columns ------------------------------------------------------------------
ALTER TABLE public.treasury_transactions
  ADD COLUMN IF NOT EXISTS recipient_name TEXT,
  ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS created_by_email TEXT,
  ADD COLUMN IF NOT EXISTS affects_metric BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS reference TEXT;

COMMENT ON COLUMN public.treasury_transactions.recipient_name IS
  'اسم الخادم / المستلم الذي استلم مبلغ المصروف؛ NULL للإيرادات العامة';

-- 2) Normalise historical income rows, then enforce income/expense rules ------
-- Older dashboard-metric reversals stored income tied to a family. Income is
-- now always church-wide, so detach those rows before validating the constraint.
UPDATE public.treasury_transactions
SET saint_family = NULL
WHERE transaction_type = 'income'
  AND saint_family IS NOT NULL;

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
      AND saint_family IS NULL
    )
  );

COMMENT ON COLUMN public.treasury_transactions.saint_family IS
  'NULL = إيراد عام للخزنة؛ قيمة الأسرة مطلوبة للمصروفات المخصصة فقط';

-- 3) Audit note is mandatory for every new/updated transaction ----------------
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conrelid = 'public.treasury_transactions'::regclass
      AND conname = 'treasury_transactions_description_required'
  ) THEN
    ALTER TABLE public.treasury_transactions
      ADD CONSTRAINT treasury_transactions_description_required
      CHECK (description IS NOT NULL AND length(btrim(description)) > 0) NOT VALID;
  END IF;
END $$;

-- 4) Recreate the RPCs with the recipient argument ----------------------------
-- The old signatures must be dropped so PostgREST never sees two overloads.
DROP FUNCTION IF EXISTS public.record_treasury_transaction(
  TEXT, DATE, TEXT, TEXT, NUMERIC, TEXT, TEXT
);

CREATE OR REPLACE FUNCTION public.record_treasury_transaction(
  p_saint_family TEXT,
  p_transaction_date DATE,
  p_transaction_type TEXT,
  p_category TEXT,
  p_amount NUMERIC,
  p_description TEXT,
  p_reference TEXT,
  p_recipient_name TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_family TEXT;
  v_category TEXT;
  v_recipient TEXT;
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

    v_recipient := btrim(COALESCE(p_recipient_name, ''));
    IF v_recipient = '' THEN
      RAISE EXCEPTION 'برجاء إدخال اسم المستلم';
    END IF;
    IF length(v_recipient) > 200 THEN
      RAISE EXCEPTION 'اسم المستلم يجب ألا يتجاوز 200 حرف';
    END IF;

    v_family := p_saint_family;
  ELSE
    -- General treasury income is never tied to a family or a recipient.
    v_family := NULL;
    v_recipient := NULL;
  END IF;

  INSERT INTO public.treasury_transactions (
    saint_family,
    recipient_name,
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
    v_recipient,
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

DROP FUNCTION IF EXISTS public.update_treasury_transaction(
  UUID, TEXT, DATE, TEXT, TEXT, NUMERIC, TEXT, TEXT
);

CREATE OR REPLACE FUNCTION public.update_treasury_transaction(
  p_id UUID,
  p_saint_family TEXT,
  p_transaction_date DATE,
  p_transaction_type TEXT,
  p_category TEXT,
  p_amount NUMERIC,
  p_description TEXT,
  p_reference TEXT,
  p_recipient_name TEXT DEFAULT NULL
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
  v_recipient TEXT;
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

    v_recipient := btrim(COALESCE(p_recipient_name, ''));
    IF v_recipient = '' THEN
      RAISE EXCEPTION 'برجاء إدخال اسم المستلم';
    END IF;
    IF length(v_recipient) > 200 THEN
      RAISE EXCEPTION 'اسم المستلم يجب ألا يتجاوز 200 حرف';
    END IF;

    v_family := p_saint_family;
  ELSE
    v_family := NULL;
    v_recipient := NULL;
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
      recipient_name = v_recipient,
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

-- 5) Keep dashboard-metric audit rows compatible with the new income rule -----
-- Increases stay family-tied expenses; decreases become general income rows.
CREATE OR REPLACE FUNCTION public.save_treasury_metric_with_audit(
  p_metric_id UUID,
  p_monthly NUMERIC,
  p_study NUMERIC,
  p_therapeutic NUMERIC,
  p_description TEXT
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  metric_row public.dashboard_metrics%ROWTYPE;
  family_value TEXT;
  monthly_delta NUMERIC;
  study_delta NUMERIC;
  therapeutic_delta NUMERIC;
  changed_count INTEGER := 0;
BEGIN
  IF NOT (public.is_admin() OR public.is_treasurer()) THEN
    RAISE EXCEPTION 'غير مصرح لك بتعديل القيم المالية';
  END IF;

  IF p_description IS NULL OR length(btrim(p_description)) = 0 THEN
    RAISE EXCEPTION 'برجاء إدخال ملاحظات / وصف الحركة';
  END IF;
  IF length(btrim(p_description)) > 2000 THEN
    RAISE EXCEPTION 'ملاحظات الحركة يجب ألا تتجاوز 2000 حرف';
  END IF;
  IF p_monthly IS NULL OR p_study IS NULL OR p_therapeutic IS NULL
     OR p_monthly < 0 OR p_study < 0 OR p_therapeutic < 0 THEN
    RAISE EXCEPTION 'القيم المالية لا يمكن أن تكون سالبة';
  END IF;

  SELECT *
  INTO metric_row
  FROM public.dashboard_metrics
  WHERE id = p_metric_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'لم يتم العثور على القيمة المالية';
  END IF;

  family_value := CASE metric_row.sector
    WHEN 'القديس مرقس' THEN 'مرقس'
    WHEN 'القديس يوحنا' THEN 'يوحنا'
    WHEN 'القديس لوقا' THEN 'لوقا'
    WHEN 'القديس متى' THEN 'متى'
    WHEN 'الأسر المستترة' THEN 'أسر مستترة'
    ELSE NULL
  END;

  IF family_value IS NULL THEN
    RAISE EXCEPTION 'القطاع المالي غير مرتبط بأسرة معروفة';
  END IF;

  monthly_delta := p_monthly - metric_row.monthly;
  study_delta := p_study - metric_row.study;
  therapeutic_delta := p_therapeutic - metric_row.therapeutic;

  IF monthly_delta = 0 AND study_delta = 0 AND therapeutic_delta = 0 THEN
    RAISE EXCEPTION 'لم يتم تغيير أي قيمة مالية';
  END IF;

  UPDATE public.dashboard_metrics
  SET monthly = p_monthly,
      study = p_study,
      therapeutic = p_therapeutic,
      updated_by = auth.uid()
  WHERE id = p_metric_id;

  IF monthly_delta <> 0 THEN
    INSERT INTO public.treasury_transactions (
      saint_family, transaction_date, transaction_type, category, amount,
      description, created_by
    )
    VALUES (
      CASE WHEN monthly_delta > 0 THEN family_value ELSE NULL END,
      CURRENT_DATE,
      CASE WHEN monthly_delta > 0 THEN 'expense' ELSE 'income' END,
      'مساعدات شهرية',
      abs(monthly_delta),
      format('تعديل قيمة الشهريات من %s إلى %s. %s', metric_row.monthly, p_monthly, btrim(p_description)),
      auth.uid()
    );
    changed_count := changed_count + 1;
  END IF;

  IF study_delta <> 0 THEN
    INSERT INTO public.treasury_transactions (
      saint_family, transaction_date, transaction_type, category, amount,
      description, created_by
    )
    VALUES (
      CASE WHEN study_delta > 0 THEN family_value ELSE NULL END,
      CURRENT_DATE,
      CASE WHEN study_delta > 0 THEN 'expense' ELSE 'income' END,
      'مساعدات دراسية',
      abs(study_delta),
      format('تعديل قيمة المساعدات الدراسية من %s إلى %s. %s', metric_row.study, p_study, btrim(p_description)),
      auth.uid()
    );
    changed_count := changed_count + 1;
  END IF;

  IF therapeutic_delta <> 0 THEN
    INSERT INTO public.treasury_transactions (
      saint_family, transaction_date, transaction_type, category, amount,
      description, created_by
    )
    VALUES (
      CASE WHEN therapeutic_delta > 0 THEN family_value ELSE NULL END,
      CURRENT_DATE,
      CASE WHEN therapeutic_delta > 0 THEN 'expense' ELSE 'income' END,
      'مساعدات علاجية',
      abs(therapeutic_delta),
      format('تعديل قيمة المساعدات العلاجية من %s إلى %s. %s', metric_row.therapeutic, p_therapeutic, btrim(p_description)),
      auth.uid()
    );
    changed_count := changed_count + 1;
  END IF;

  RETURN changed_count;
END;
$$;

-- 6) Permissions ---------------------------------------------------------------
REVOKE ALL ON FUNCTION public.record_treasury_transaction(
  TEXT, DATE, TEXT, TEXT, NUMERIC, TEXT, TEXT, TEXT
) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.record_treasury_transaction(
  TEXT, DATE, TEXT, TEXT, NUMERIC, TEXT, TEXT, TEXT
) TO authenticated;

REVOKE ALL ON FUNCTION public.update_treasury_transaction(
  UUID, TEXT, DATE, TEXT, TEXT, NUMERIC, TEXT, TEXT, TEXT
) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.update_treasury_transaction(
  UUID, TEXT, DATE, TEXT, TEXT, NUMERIC, TEXT, TEXT, TEXT
) TO authenticated;

REVOKE ALL ON FUNCTION public.save_treasury_metric_with_audit(
  UUID, NUMERIC, NUMERIC, NUMERIC, TEXT
) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.save_treasury_metric_with_audit(
  UUID, NUMERIC, NUMERIC, NUMERIC, TEXT
) TO authenticated;

NOTIFY pgrst, 'reload schema';
