-- Dedicated dashboard row for الأسر المستترة pie chart (independent from sector totals)
INSERT INTO public.dashboard_metrics (sector, monthly, study, therapeutic, display_order)
SELECT 'الأسر المستترة', 1750, 1150, 290, 0
WHERE NOT EXISTS (
  SELECT 1 FROM public.dashboard_metrics WHERE sector = 'الأسر المستترة'
);
