-- Assistance/Aid Module (مساعدات)

-- Main assistance logs table
CREATE TABLE public.assistance_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  individual_id UUID NOT NULL REFERENCES public.individuals(id) ON DELETE CASCADE,
  family_member_id UUID REFERENCES public.family_members(id) ON DELETE SET NULL,
  assistance_type TEXT NOT NULL CHECK (assistance_type IN ('bridal_prep', 'medical_aid')),
  total_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id)
);
GRANT SELECT, INSERT, UPDATE ON public.assistance_logs TO authenticated;
GRANT ALL ON public.assistance_logs TO service_role;
ALTER TABLE public.assistance_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "assistance_select_auth" ON public.assistance_logs FOR SELECT TO authenticated USING (true);
CREATE POLICY "assistance_write_admin" ON public.assistance_logs FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Bridal preparation details (تجهيز عرايس)
CREATE TABLE public.bridal_prep_details (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assistance_log_id UUID NOT NULL REFERENCES public.assistance_logs(id) ON DELETE CASCADE,
  category TEXT NOT NULL CHECK (category IN ('appliances', 'furniture', 'clothing', 'kitchenware', 'bedding')),
  item_type TEXT,
  quantity INTEGER DEFAULT 1,
  unit_price NUMERIC(12,2) DEFAULT 0,
  total_price NUMERIC(12,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.bridal_prep_details TO authenticated;
GRANT ALL ON public.bridal_prep_details TO service_role;
ALTER TABLE public.bridal_prep_details ENABLE ROW LEVEL SECURITY;
CREATE POLICY "bridal_select_auth" ON public.bridal_prep_details FOR SELECT TO authenticated USING (true);
CREATE POLICY "bridal_write_admin" ON public.bridal_prep_details FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Medical aid details (مساعدة علاجية)
CREATE TABLE public.medical_aid_details (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assistance_log_id UUID NOT NULL REFERENCES public.assistance_logs(id) ON DELETE CASCADE,
  category TEXT NOT NULL CHECK (category IN ('operation', 'radiology', 'lab_test', 'medication', 'checkup', 'external_treatment')),
  service_name TEXT NOT NULL,
  total_price NUMERIC(12,2) NOT NULL DEFAULT 0,
  church_percentage INTEGER DEFAULT 0 CHECK (church_percentage >= 0 AND church_percentage <= 100),
  church_amount NUMERIC(12,2) GENERATED ALWAYS AS (total_price * church_percentage / 100) STORED,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.medical_aid_details TO authenticated;
GRANT ALL ON public.medical_aid_details TO service_role;
ALTER TABLE public.medical_aid_details ENABLE ROW LEVEL SECURITY;
CREATE POLICY "medical_select_auth" ON public.medical_aid_details FOR SELECT TO authenticated USING (true);
CREATE POLICY "medical_write_admin" ON public.medical_aid_details FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Triggers for updated_at
CREATE TRIGGER touch_assistance_logs BEFORE UPDATE ON public.assistance_logs FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Audit triggers
CREATE TRIGGER audit_assistance_logs AFTER INSERT OR UPDATE OR DELETE ON public.assistance_logs FOR EACH ROW EXECUTE FUNCTION public.log_audit();
CREATE TRIGGER audit_bridal_prep_details AFTER INSERT OR UPDATE OR DELETE ON public.bridal_prep_details FOR EACH ROW EXECUTE FUNCTION public.log_audit();
CREATE TRIGGER audit_medical_aid_details AFTER INSERT OR UPDATE OR DELETE ON public.medical_aid_details FOR EACH ROW EXECUTE FUNCTION public.log_audit();

-- Indexes for better performance
CREATE INDEX idx_assistance_individual ON public.assistance_logs (individual_id);
CREATE INDEX idx_assistance_family_member ON public.assistance_logs (family_member_id);
CREATE INDEX idx_assistance_type ON public.assistance_logs (assistance_type);
CREATE INDEX idx_assistance_date ON public.assistance_logs (created_at);
CREATE INDEX idx_bridal_assistance_log ON public.bridal_prep_details (assistance_log_id);
CREATE INDEX idx_medical_assistance_log ON public.medical_aid_details (assistance_log_id);
