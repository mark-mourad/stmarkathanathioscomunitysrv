-- Require a note for new and updated treasury transactions without rewriting
-- historical rows that may not have a description.
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

-- Update a family metric and write an adjustment for each changed support
-- category in the same transaction, so chart edits cannot bypass the ledger.
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
      family_value,
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
      family_value,
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
      family_value,
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

REVOKE ALL ON FUNCTION public.save_treasury_metric_with_audit(UUID, NUMERIC, NUMERIC, NUMERIC, TEXT)
  FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.save_treasury_metric_with_audit(UUID, NUMERIC, NUMERIC, NUMERIC, TEXT)
  TO authenticated;

CREATE OR REPLACE FUNCTION public.save_treasury_hidden_metric_with_audit(
  p_monthly NUMERIC,
  p_study NUMERIC,
  p_therapeutic NUMERIC,
  p_description TEXT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  metric_id UUID;
BEGIN
  IF NOT (public.is_admin() OR public.is_treasurer()) THEN
    RAISE EXCEPTION 'غير مصرح لك بتعديل القيم المالية';
  END IF;

  SELECT id
  INTO metric_id
  FROM public.dashboard_metrics
  WHERE sector = 'الأسر المستترة'
  FOR UPDATE;

  IF metric_id IS NULL THEN
    INSERT INTO public.dashboard_metrics (
      sector, monthly, study, therapeutic, display_order, updated_by
    )
    VALUES ('الأسر المستترة', 0, 0, 0, 0, auth.uid())
    RETURNING id INTO metric_id;
  END IF;

  PERFORM public.save_treasury_metric_with_audit(
    metric_id, p_monthly, p_study, p_therapeutic, p_description
  );
  RETURN metric_id;
END;
$$;

REVOKE ALL ON FUNCTION public.save_treasury_hidden_metric_with_audit(NUMERIC, NUMERIC, NUMERIC, TEXT)
  FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.save_treasury_hidden_metric_with_audit(NUMERIC, NUMERIC, NUMERIC, TEXT)
  TO authenticated;
