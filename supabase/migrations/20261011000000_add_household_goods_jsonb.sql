-- Redesign of the Household Goods (المنقولات المنزلية) section.
-- Stores the full editable list of items (default + custom) with a checkbox
-- state and a numeric quantity as a JSONB array of:
--   { "item_name": text, "exists": boolean, "quantity": number }
--
-- The legacy boolean columns (has_washing_machine, has_fridge, ...) are kept in
-- sync by the application for backward compatibility, but household_goods is
-- now the source of truth.

ALTER TABLE public.individuals
  ADD COLUMN IF NOT EXISTS household_goods JSONB NOT NULL DEFAULT '[]'::jsonb;

COMMENT ON COLUMN public.individuals.household_goods IS
  'قائمة المنقولات المنزلية: [{ item_name, exists, quantity }]';

-- Backfill household_goods from the legacy boolean columns for existing rows
-- that do not yet have the new data.
UPDATE public.individuals AS i
SET household_goods = sub.items
FROM (
  SELECT
    id,
    jsonb_agg(
      jsonb_build_object(
        'item_name', item_name,
        'exists', has_it,
        'quantity', CASE WHEN has_it THEN 1 ELSE 0 END
      )
      ORDER BY ord
    ) AS items
  FROM (
    SELECT id, 1 AS ord, 'غسالة'::text AS item_name, COALESCE(has_washing_machine, false) AS has_it FROM public.individuals
    UNION ALL SELECT id, 2, 'ثلاجة', COALESCE(has_fridge, false) FROM public.individuals
    UNION ALL SELECT id, 3, 'بوتاجاز', COALESCE(has_stove, false) FROM public.individuals
    UNION ALL SELECT id, 4, 'مرتبة', COALESCE(has_mattress, false) FROM public.individuals
    UNION ALL SELECT id, 5, 'كمبيوتر', COALESCE(has_computer, false) FROM public.individuals
    UNION ALL SELECT id, 6, 'كنبة', COALESCE(has_sofa, false) FROM public.individuals
    UNION ALL SELECT id, 7, 'سفرة', COALESCE(has_dining, false) FROM public.individuals
    UNION ALL SELECT id, 8, 'تلفزيون', COALESCE(has_tv, false) FROM public.individuals
    UNION ALL SELECT id, 9, 'دولاب', COALESCE(has_wardrobe, false) FROM public.individuals
  ) t
  GROUP BY id
) sub
WHERE i.id = sub.id
  AND (i.household_goods IS NULL OR i.household_goods = '[]'::jsonb);
