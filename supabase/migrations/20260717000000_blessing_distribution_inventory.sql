-- Blessing Distribution and Inventory System

-- Inventory table (المخزن)
CREATE TABLE public.inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  weekly_total INTEGER NOT NULL DEFAULT 0,
  details TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by UUID REFERENCES auth.users(id)
);
GRANT SELECT, INSERT, UPDATE ON public.inventory TO authenticated;
GRANT ALL ON public.inventory TO service_role;
ALTER TABLE public.inventory ENABLE ROW LEVEL SECURITY;
CREATE POLICY "inventory_select_auth" ON public.inventory FOR SELECT TO authenticated USING (true);
CREATE POLICY "inventory_write_admin" ON public.inventory FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Blessing Distribution records (توزيع البركة)
CREATE TABLE public.blessing_distribution (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  saint_family TEXT NOT NULL,
  individual_id UUID NOT NULL REFERENCES public.individuals(id) ON DELETE CASCADE,
  received BOOLEAN NOT NULL DEFAULT false,
  distribution_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(saint_family, individual_id, distribution_date)
);
GRANT SELECT, INSERT, UPDATE ON public.blessing_distribution TO authenticated;
GRANT ALL ON public.blessing_distribution TO service_role;
ALTER TABLE public.blessing_distribution ENABLE ROW LEVEL SECURITY;
CREATE POLICY "blessing_select_auth" ON public.blessing_distribution FOR SELECT TO authenticated USING (true);
CREATE POLICY "blessing_write_auth" ON public.blessing_distribution FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "blessing_update_auth" ON public.blessing_distribution FOR UPDATE TO authenticated USING (true);

-- Trigger for inventory updated_at
CREATE TRIGGER touch_inventory BEFORE UPDATE ON public.inventory FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Trigger for blessing_distribution updated_at
CREATE TRIGGER touch_blessing_distribution BEFORE UPDATE ON public.blessing_distribution FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Audit triggers for new tables
CREATE TRIGGER audit_inventory AFTER INSERT OR UPDATE OR DELETE ON public.inventory FOR EACH ROW EXECUTE FUNCTION public.log_audit();
CREATE TRIGGER audit_blessing_distribution AFTER INSERT OR UPDATE OR DELETE ON public.blessing_distribution FOR EACH ROW EXECUTE FUNCTION public.log_audit();

-- Index for better performance
CREATE INDEX idx_blessing_saint_family ON public.blessing_distribution (saint_family);
CREATE INDEX idx_blessing_distribution_date ON public.blessing_distribution (distribution_date);
CREATE INDEX idx_blessing_individual ON public.blessing_distribution (individual_id);
