-- Initial schema for the new Supabase project

-- Roles
CREATE TYPE public.app_role AS ENUM ('admin', 'viewer');

CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles_select_auth" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_roles_select_own" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.has_role(auth.uid(), 'admin')
$$;

GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;

-- Individuals (المخدومين)
CREATE TABLE public.individuals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  nickname TEXT,
  national_id TEXT UNIQUE,
  birth_date DATE,
  job TEXT,
  salary NUMERIC(12,2),
  phone TEXT,
  mobile TEXT,
  landline TEXT,
  confession_father TEXT,
  saint_family TEXT,
  address TEXT,
  household_count INT,
  housing_type TEXT,
  rooms INT,
  photo_url TEXT,
  has_washing_machine BOOLEAN DEFAULT FALSE,
  has_fridge BOOLEAN DEFAULT FALSE,
  has_stove BOOLEAN DEFAULT FALSE,
  has_mattress BOOLEAN DEFAULT FALSE,
  has_computer BOOLEAN DEFAULT FALSE,
  has_sofa BOOLEAN DEFAULT FALSE,
  has_dining BOOLEAN DEFAULT FALSE,
  has_tv BOOLEAN DEFAULT FALSE,
  has_wardrobe BOOLEAN DEFAULT FALSE,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.individuals TO authenticated;
GRANT ALL ON public.individuals TO service_role;
ALTER TABLE public.individuals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ind_select" ON public.individuals FOR SELECT TO authenticated USING (true);
CREATE POLICY "ind_insert_admin" ON public.individuals FOR INSERT TO authenticated WITH CHECK (public.is_admin());
CREATE POLICY "ind_update_admin" ON public.individuals FOR UPDATE TO authenticated USING (public.is_admin());
CREATE POLICY "ind_delete_admin" ON public.individuals FOR DELETE TO authenticated USING (public.is_admin());

-- Family members
CREATE TABLE public.family_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  individual_id UUID NOT NULL REFERENCES public.individuals(id) ON DELETE CASCADE,
  seq INT,
  full_name TEXT NOT NULL,
  national_id TEXT,
  relation TEXT,
  marital_status TEXT,
  confession_father TEXT,
  school_or_job TEXT,
  income NUMERIC(12,2),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.family_members TO authenticated;
GRANT ALL ON public.family_members TO service_role;
ALTER TABLE public.family_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "fam_select" ON public.family_members FOR SELECT TO authenticated USING (true);
CREATE POLICY "fam_write_admin" ON public.family_members FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Financials per individual
CREATE TABLE public.financials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  individual_id UUID NOT NULL REFERENCES public.individuals(id) ON DELETE CASCADE,
  church_monthly NUMERIC(12,2) DEFAULT 0,
  therapeutic_aid NUMERIC(12,2) DEFAULT 0,
  study_aid NUMERIC(12,2) DEFAULT 0,
  basic_salary NUMERIC(12,2) DEFAULT 0,
  extra_income NUMERIC(12,2) DEFAULT 0,
  electricity_gas_water NUMERIC(12,2) DEFAULT 0,
  phone_bill NUMERIC(12,2) DEFAULT 0,
  rent NUMERIC(12,2) DEFAULT 0,
  treatment_cost NUMERIC(12,2) DEFAULT 0,
  education_cost NUMERIC(12,2) DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.financials TO authenticated;
GRANT ALL ON public.financials TO service_role;
ALTER TABLE public.financials ENABLE ROW LEVEL SECURITY;
CREATE POLICY "fin_select" ON public.financials FOR SELECT TO authenticated USING (true);
CREATE POLICY "fin_write_admin" ON public.financials FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Dashboard editable aggregates
CREATE TABLE public.dashboard_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sector TEXT NOT NULL,
  monthly NUMERIC(12,2) DEFAULT 0,
  study NUMERIC(12,2) DEFAULT 0,
  therapeutic NUMERIC(12,2) DEFAULT 0,
  display_order INT DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by UUID REFERENCES auth.users(id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.dashboard_metrics TO authenticated;
GRANT ALL ON public.dashboard_metrics TO service_role;
ALTER TABLE public.dashboard_metrics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "dm_select" ON public.dashboard_metrics FOR SELECT TO authenticated USING (true);
CREATE POLICY "dm_write_admin" ON public.dashboard_metrics FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

INSERT INTO public.dashboard_metrics (sector, monthly, study, therapeutic, display_order) VALUES
  ('القديس يوحنا', 600, 400, 100, 1),
  ('القديس لوقا', 500, 300, 80, 2),
  ('القديس مرقس', 400, 250, 60, 3),
  ('القديس متى', 350, 200, 50, 4);

-- Audit log
CREATE TABLE public.audit_log (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID,
  user_email TEXT,
  action TEXT NOT NULL,
  table_name TEXT NOT NULL,
  record_id TEXT,
  changes JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.audit_log TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE public.audit_log_id_seq TO authenticated;
GRANT ALL ON public.audit_log TO service_role;
GRANT ALL ON SEQUENCE public.audit_log_id_seq TO service_role;
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "audit_select_admin" ON public.audit_log FOR SELECT TO authenticated USING (public.is_admin());
CREATE POLICY "audit_insert_auth" ON public.audit_log FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "audit_delete_admin" ON public.audit_log FOR DELETE TO authenticated USING (public.is_admin());

CREATE OR REPLACE FUNCTION public.log_audit()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_email TEXT;
BEGIN
  SELECT email INTO v_email FROM auth.users WHERE id = auth.uid();
  INSERT INTO public.audit_log (user_id, user_email, action, table_name, record_id, changes)
  VALUES (
    auth.uid(),
    v_email,
    TG_OP,
    TG_TABLE_NAME,
    COALESCE((CASE WHEN TG_OP='DELETE' THEN OLD.id::text ELSE NEW.id::text END), NULL),
    CASE WHEN TG_OP='DELETE' THEN to_jsonb(OLD) ELSE to_jsonb(NEW) END
  );
  RETURN COALESCE(NEW, OLD);
END $$;

CREATE TRIGGER audit_individuals AFTER INSERT OR UPDATE OR DELETE ON public.individuals FOR EACH ROW EXECUTE FUNCTION public.log_audit();
CREATE TRIGGER audit_family AFTER INSERT OR UPDATE OR DELETE ON public.family_members FOR EACH ROW EXECUTE FUNCTION public.log_audit();
CREATE TRIGGER audit_financials AFTER INSERT OR UPDATE OR DELETE ON public.financials FOR EACH ROW EXECUTE FUNCTION public.log_audit();
CREATE TRIGGER audit_dashboard AFTER INSERT OR UPDATE OR DELETE ON public.dashboard_metrics FOR EACH ROW EXECUTE FUNCTION public.log_audit();

CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END $$;

CREATE TRIGGER touch_individuals BEFORE UPDATE ON public.individuals FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER touch_financials BEFORE UPDATE ON public.financials FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER touch_dashboard BEFORE UPDATE ON public.dashboard_metrics FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE INDEX idx_ind_name ON public.individuals USING gin (to_tsvector('simple', coalesce(full_name,'') || ' ' || coalesce(nickname,'')));
CREATE INDEX idx_ind_natid ON public.individuals (national_id);
CREATE INDEX idx_fam_ind ON public.family_members (individual_id);
CREATE INDEX idx_fin_ind ON public.financials (individual_id);
