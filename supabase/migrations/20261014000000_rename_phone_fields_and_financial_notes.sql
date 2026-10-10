-- Beneficiary phone-field relabeling + financial notes.
--
-- Rename the two mobile columns on public.individuals to reflect what they now
-- represent in the UI:
--   individuals.phone  -> wife_mobile     (رقم موبايل الزوجة)
--   individuals.mobile -> husband_mobile  (رقم موبايل الزوج)
--
-- Add a free-text financial notes column to public.financials:
--   financials.financial_notes TEXT       (ملاحظات مالية)

-- Rename phone -> wife_mobile (idempotent).
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'individuals'
      AND column_name = 'phone'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'individuals'
      AND column_name = 'wife_mobile'
  ) THEN
    ALTER TABLE public.individuals RENAME COLUMN phone TO wife_mobile;
  END IF;
END $$;

-- Rename mobile -> husband_mobile (idempotent).
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'individuals'
      AND column_name = 'mobile'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'individuals'
      AND column_name = 'husband_mobile'
  ) THEN
    ALTER TABLE public.individuals RENAME COLUMN mobile TO husband_mobile;
  END IF;
END $$;

COMMENT ON COLUMN public.individuals.wife_mobile IS 'رقم موبايل الزوجة';
COMMENT ON COLUMN public.individuals.husband_mobile IS 'رقم موبايل الزوج';

-- Financial notes (ملاحظات مالية) — free text summary about the family's finances.
ALTER TABLE public.financials
  ADD COLUMN IF NOT EXISTS financial_notes TEXT;

COMMENT ON COLUMN public.financials.financial_notes IS 'ملاحظات مالية';
