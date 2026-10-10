-- Dynamic Financial Data (البيانات المالية) — custom revenues & expenses.
-- Adds two JSONB arrays to the existing financials table so the Add/Edit forms
-- can persist an arbitrary number of user-defined line items:
--   [ { "name": text, "amount": number } ]
--
-- The standard columns (church_monthly, basic_salary, ... education_cost) remain
-- untouched; the application always writes custom_revenues/custom_expenses and
-- continues to read both standard and custom figures.

ALTER TABLE public.financials
  ADD COLUMN IF NOT EXISTS custom_revenues JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS custom_expenses JSONB NOT NULL DEFAULT '[]'::jsonb;

COMMENT ON COLUMN public.financials.custom_revenues IS
  'إيرادات مخصصة: [{ name, amount }]';

COMMENT ON COLUMN public.financials.custom_expenses IS
  'مصروفات مخصصة: [{ name, amount }]';

-- Guard the columns so they always hold a JSON array (defensive; app writes arrays).
ALTER TABLE public.financials
  DROP CONSTRAINT IF EXISTS financials_custom_revenues_is_array,
  DROP CONSTRAINT IF EXISTS financials_custom_expenses_is_array;

ALTER TABLE public.financials
  ADD CONSTRAINT financials_custom_revenues_is_array
    CHECK (jsonb_typeof(custom_revenues) = 'array'),
  ADD CONSTRAINT financials_custom_expenses_is_array
    CHECK (jsonb_typeof(custom_expenses) = 'array');
