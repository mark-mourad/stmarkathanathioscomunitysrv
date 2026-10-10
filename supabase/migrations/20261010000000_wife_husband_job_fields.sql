-- Rename/repurpose beneficiary occupation fields:
--   individuals.job    -> وظيفة الزوج (husband job, already TEXT)
--   individuals.salary -> وظيفة الزوجة (wife job, converted from NUMERIC to TEXT)

ALTER TABLE public.individuals
  ALTER COLUMN salary TYPE TEXT USING salary::text;

COMMENT ON COLUMN public.individuals.job IS 'وظيفة الزوج';
COMMENT ON COLUMN public.individuals.salary IS 'وظيفة الزوجة';
