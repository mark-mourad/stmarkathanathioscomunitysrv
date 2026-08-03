-- =============================================================================
-- COMPREHENSIVE DATABASE SETUP SCRIPT
-- Altar Grace Suite — Full Idempotent Migration
-- Safe to run on fresh OR partially-migrated databases
-- =============================================================================

-- ─────────────────────────────────────────────────────────
-- 0. TYPES & HELPER FUNCTIONS
-- ─────────────────────────────────────────────────────────

DO $$ BEGIN
  CREATE TYPE public.app_role AS ENUM ('admin', 'viewer');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.has_role(auth.uid(), 'admin')
$$;

GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;

-- Auto-set updated_at on UPDATE
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END $$;

-- Audit logging trigger
CREATE OR REPLACE FUNCTION public.log_audit()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_email TEXT;
BEGIN
  SELECT email INTO v_email FROM auth.users WHERE id = auth.uid();
  INSERT INTO public.audit_log (user_id, user_email, action, table_name, record_id, changes)
  VALUES (
    auth.uid(),
    COALESCE(v_email, 'unknown'),
    TG_OP,
    TG_TABLE_NAME,
    COALESCE((CASE WHEN TG_OP='DELETE' THEN OLD.id::text ELSE NEW.id::text END), NULL),
    CASE WHEN TG_OP='DELETE' THEN to_jsonb(OLD) ELSE to_jsonb(NEW) END
  );
  RETURN COALESCE(NEW, OLD);
END $$;

-- ─────────────────────────────────────────────────────────
-- 1. PROFILES
-- ─────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "profiles_select_auth" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
CREATE POLICY "profiles_select_auth" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);

-- ─────────────────────────────────────────────────────────
-- 2. USER ROLES
-- ─────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "user_roles_select_own" ON public.user_roles;
CREATE POLICY "user_roles_select_own" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- ─────────────────────────────────────────────────────────
-- 3. INDIVIDUALS (المخدومين)
-- ─────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.individuals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  nickname TEXT,
  mother_name TEXT,
  gender TEXT CHECK (gender IN ('male', 'female')),
  national_id TEXT UNIQUE,
  birth_date DATE,
  birth_governorate TEXT,
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
  has_alt_address BOOLEAN DEFAULT FALSE,
  alt_address TEXT,
  alt_governorate TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add any missing columns to existing individuals table
DO $$ BEGIN ALTER TABLE public.individuals ADD COLUMN mother_name TEXT; EXCEPTION WHEN duplicate_column THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.individuals ADD COLUMN gender TEXT CHECK (gender IN ('male', 'female')); EXCEPTION WHEN duplicate_column THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.individuals ADD COLUMN birth_governorate TEXT; EXCEPTION WHEN duplicate_column THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.individuals ADD COLUMN has_alt_address BOOLEAN DEFAULT FALSE; EXCEPTION WHEN duplicate_column THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.individuals ADD COLUMN alt_address TEXT; EXCEPTION WHEN duplicate_column THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.individuals ADD COLUMN alt_governorate TEXT; EXCEPTION WHEN duplicate_column THEN NULL; END $$;

COMMENT ON COLUMN public.individuals.saint_family IS 'Saint family: مرقس, يوحنا, لوقا, متى, أسر مستترة';
COMMENT ON COLUMN public.individuals.gender IS 'Gender: male or female';

GRANT SELECT, INSERT, UPDATE, DELETE ON public.individuals TO authenticated;
GRANT ALL ON public.individuals TO service_role;
ALTER TABLE public.individuals ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "ind_select" ON public.individuals;
DROP POLICY IF EXISTS "ind_insert_admin" ON public.individuals;
DROP POLICY IF EXISTS "ind_update_admin" ON public.individuals;
DROP POLICY IF EXISTS "ind_delete_admin" ON public.individuals;
CREATE POLICY "ind_select" ON public.individuals FOR SELECT TO authenticated USING (true);
CREATE POLICY "ind_insert_admin" ON public.individuals FOR INSERT TO authenticated WITH CHECK (public.is_admin());
CREATE POLICY "ind_update_admin" ON public.individuals FOR UPDATE TO authenticated USING (public.is_admin());
CREATE POLICY "ind_delete_admin" ON public.individuals FOR DELETE TO authenticated USING (public.is_admin());

DROP TRIGGER IF EXISTS audit_individuals ON public.individuals;
CREATE TRIGGER audit_individuals AFTER INSERT OR UPDATE OR DELETE ON public.individuals FOR EACH ROW EXECUTE FUNCTION public.log_audit();
DROP TRIGGER IF EXISTS touch_individuals ON public.individuals;
CREATE TRIGGER touch_individuals BEFORE UPDATE ON public.individuals FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE INDEX IF NOT EXISTS idx_ind_name ON public.individuals USING gin (to_tsvector('simple', coalesce(full_name,'') || ' ' || coalesce(nickname,'')));
CREATE INDEX IF NOT EXISTS idx_ind_natid ON public.individuals (national_id);

-- ─────────────────────────────────────────────────────────
-- 4. FAMILY MEMBERS (أفراد الأسرة)
-- ─────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.family_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  individual_id UUID NOT NULL REFERENCES public.individuals(id) ON DELETE CASCADE,
  seq INT,
  full_name TEXT NOT NULL,
  national_id TEXT,
  relation TEXT,
  insurance_number TEXT,
  marital_status TEXT,
  confession_father TEXT,
  school_or_job TEXT,
  income NUMERIC(12,2),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add missing columns to existing table
DO $$ BEGIN ALTER TABLE public.family_members ADD COLUMN insurance_number TEXT; EXCEPTION WHEN duplicate_column THEN NULL; END $$;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.family_members TO authenticated;
GRANT ALL ON public.family_members TO service_role;
ALTER TABLE public.family_members ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "fam_select" ON public.family_members;
DROP POLICY IF EXISTS "fam_write_admin" ON public.family_members;
CREATE POLICY "fam_select" ON public.family_members FOR SELECT TO authenticated USING (true);
CREATE POLICY "fam_write_admin" ON public.family_members FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP TRIGGER IF EXISTS audit_family ON public.family_members;
CREATE TRIGGER audit_family AFTER INSERT OR UPDATE OR DELETE ON public.family_members FOR EACH ROW EXECUTE FUNCTION public.log_audit();

CREATE INDEX IF NOT EXISTS idx_fam_ind ON public.family_members (individual_id);

-- ─────────────────────────────────────────────────────────
-- 5. FINANCIALS
-- ─────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.financials (
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
DROP POLICY IF EXISTS "fin_select" ON public.financials;
DROP POLICY IF EXISTS "fin_write_admin" ON public.financials;
CREATE POLICY "fin_select" ON public.financials FOR SELECT TO authenticated USING (true);
CREATE POLICY "fin_write_admin" ON public.financials FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP TRIGGER IF EXISTS audit_financials ON public.financials;
CREATE TRIGGER audit_financials AFTER INSERT OR UPDATE OR DELETE ON public.financials FOR EACH ROW EXECUTE FUNCTION public.log_audit();
DROP TRIGGER IF EXISTS touch_financials ON public.financials;
CREATE TRIGGER touch_financials BEFORE UPDATE ON public.financials FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE INDEX IF NOT EXISTS idx_fin_ind ON public.financials (individual_id);

-- ─────────────────────────────────────────────────────────
-- 6. MONTHLY CHURCH SUPPORT (الكشوف الشهرية)
-- ─────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.monthly_church_support (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  individual_id UUID NOT NULL REFERENCES public.individuals(id) ON DELETE CASCADE,
  church_name TEXT NOT NULL,
  amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.monthly_church_support TO authenticated;
GRANT ALL ON public.monthly_church_support TO service_role;
ALTER TABLE public.monthly_church_support ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "support_select" ON public.monthly_church_support;
DROP POLICY IF EXISTS "support_write_admin" ON public.monthly_church_support;
CREATE POLICY "support_select" ON public.monthly_church_support FOR SELECT TO authenticated USING (true);
CREATE POLICY "support_write_admin" ON public.monthly_church_support FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP TRIGGER IF EXISTS audit_monthly_church_support ON public.monthly_church_support;
CREATE TRIGGER audit_monthly_church_support AFTER INSERT OR UPDATE OR DELETE ON public.monthly_church_support FOR EACH ROW EXECUTE FUNCTION public.log_audit();
DROP TRIGGER IF EXISTS touch_monthly_church_support ON public.monthly_church_support;
CREATE TRIGGER touch_monthly_church_support BEFORE UPDATE ON public.monthly_church_support FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE INDEX IF NOT EXISTS idx_monthly_support_individual ON public.monthly_church_support (individual_id);

-- ─────────────────────────────────────────────────────────
-- 7. DASHBOARD METRICS
-- ─────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.dashboard_metrics (
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
DROP POLICY IF EXISTS "dm_select" ON public.dashboard_metrics;
DROP POLICY IF EXISTS "dm_write_admin" ON public.dashboard_metrics;
CREATE POLICY "dm_select" ON public.dashboard_metrics FOR SELECT TO authenticated USING (true);
CREATE POLICY "dm_write_admin" ON public.dashboard_metrics FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP TRIGGER IF EXISTS audit_dashboard ON public.dashboard_metrics;
CREATE TRIGGER audit_dashboard AFTER INSERT OR UPDATE OR DELETE ON public.dashboard_metrics FOR EACH ROW EXECUTE FUNCTION public.log_audit();
DROP TRIGGER IF EXISTS touch_dashboard ON public.dashboard_metrics;
CREATE TRIGGER touch_dashboard BEFORE UPDATE ON public.dashboard_metrics FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Seed default dashboard metrics (only if empty)
INSERT INTO public.dashboard_metrics (sector, monthly, study, therapeutic, display_order)
SELECT * FROM (VALUES
  ('القديس يوحنا', 600, 400, 100, 1),
  ('القديس لوقا', 500, 300, 80, 2),
  ('القديس مرقس', 400, 250, 60, 3),
  ('القديس متى', 350, 200, 50, 4)
) AS v(sector, monthly, study, therapeutic, display_order)
WHERE NOT EXISTS (SELECT 1 FROM public.dashboard_metrics LIMIT 1);

-- ─────────────────────────────────────────────────────────
-- 8. AUDIT LOG
-- ─────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.audit_log (
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
DROP POLICY IF EXISTS "audit_select_admin" ON public.audit_log;
DROP POLICY IF EXISTS "audit_insert_auth" ON public.audit_log;
DROP POLICY IF EXISTS "audit_delete_admin" ON public.audit_log;
CREATE POLICY "audit_select_admin" ON public.audit_log FOR SELECT TO authenticated USING (public.is_admin());
CREATE POLICY "audit_insert_auth" ON public.audit_log FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "audit_delete_admin" ON public.audit_log FOR DELETE TO authenticated USING (public.is_admin());

-- ─────────────────────────────────────────────────────────
-- 9. INVENTORY (مخزن البركة)
-- ─────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.inventory (
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
DROP POLICY IF EXISTS "inventory_select_auth" ON public.inventory;
DROP POLICY IF EXISTS "inventory_write_admin" ON public.inventory;
CREATE POLICY "inventory_select_auth" ON public.inventory FOR SELECT TO authenticated USING (true);
CREATE POLICY "inventory_write_admin" ON public.inventory FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP TRIGGER IF EXISTS audit_inventory ON public.inventory;
CREATE TRIGGER audit_inventory AFTER INSERT OR UPDATE OR DELETE ON public.inventory FOR EACH ROW EXECUTE FUNCTION public.log_audit();
DROP TRIGGER IF EXISTS touch_inventory ON public.inventory;
CREATE TRIGGER touch_inventory BEFORE UPDATE ON public.inventory FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ─────────────────────────────────────────────────────────
-- 10. BLESSING DISTRIBUTION (توزيع البركة)
-- ─────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.blessing_distribution (
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
DROP POLICY IF EXISTS "blessing_select_auth" ON public.blessing_distribution;
DROP POLICY IF EXISTS "blessing_write_auth" ON public.blessing_distribution;
DROP POLICY IF EXISTS "blessing_update_auth" ON public.blessing_distribution;
CREATE POLICY "blessing_select_auth" ON public.blessing_distribution FOR SELECT TO authenticated USING (true);
CREATE POLICY "blessing_write_auth" ON public.blessing_distribution FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "blessing_update_auth" ON public.blessing_distribution FOR UPDATE TO authenticated USING (true);

DROP TRIGGER IF EXISTS audit_blessing_distribution ON public.blessing_distribution;
CREATE TRIGGER audit_blessing_distribution AFTER INSERT OR UPDATE OR DELETE ON public.blessing_distribution FOR EACH ROW EXECUTE FUNCTION public.log_audit();
DROP TRIGGER IF EXISTS touch_blessing_distribution ON public.blessing_distribution;
CREATE TRIGGER touch_blessing_distribution BEFORE UPDATE ON public.blessing_distribution FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE INDEX IF NOT EXISTS idx_blessing_saint_family ON public.blessing_distribution (saint_family);
CREATE INDEX IF NOT EXISTS idx_blessing_distribution_date ON public.blessing_distribution (distribution_date);
CREATE INDEX IF NOT EXISTS idx_blessing_individual ON public.blessing_distribution (individual_id);

-- ─────────────────────────────────────────────────────────
-- 11. ASSISTANCE LOGS (مساعدات)
-- ─────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.assistance_logs (
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
GRANT SELECT, INSERT, UPDATE, DELETE ON public.assistance_logs TO authenticated;
GRANT ALL ON public.assistance_logs TO service_role;
ALTER TABLE public.assistance_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "assistance_select_auth" ON public.assistance_logs;
DROP POLICY IF EXISTS "assistance_write_admin" ON public.assistance_logs;
CREATE POLICY "assistance_select_auth" ON public.assistance_logs FOR SELECT TO authenticated USING (true);
CREATE POLICY "assistance_write_admin" ON public.assistance_logs FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP TRIGGER IF EXISTS audit_assistance_logs ON public.assistance_logs;
CREATE TRIGGER audit_assistance_logs AFTER INSERT OR UPDATE OR DELETE ON public.assistance_logs FOR EACH ROW EXECUTE FUNCTION public.log_audit();
DROP TRIGGER IF EXISTS touch_assistance_logs ON public.assistance_logs;
CREATE TRIGGER touch_assistance_logs BEFORE UPDATE ON public.assistance_logs FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE INDEX IF NOT EXISTS idx_assistance_individual ON public.assistance_logs (individual_id);
CREATE INDEX IF NOT EXISTS idx_assistance_family_member ON public.assistance_logs (family_member_id);
CREATE INDEX IF NOT EXISTS idx_assistance_type ON public.assistance_logs (assistance_type);

-- ─────────────────────────────────────────────────────────
-- 12. BRIDAL PREP DETAILS (تجهيز عرايس)
-- ─────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.bridal_prep_details (
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
DROP POLICY IF EXISTS "bridal_select_auth" ON public.bridal_prep_details;
DROP POLICY IF EXISTS "bridal_write_admin" ON public.bridal_prep_details;
CREATE POLICY "bridal_select_auth" ON public.bridal_prep_details FOR SELECT TO authenticated USING (true);
CREATE POLICY "bridal_write_admin" ON public.bridal_prep_details FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP TRIGGER IF EXISTS audit_bridal_prep_details ON public.bridal_prep_details;
CREATE TRIGGER audit_bridal_prep_details AFTER INSERT OR UPDATE OR DELETE ON public.bridal_prep_details FOR EACH ROW EXECUTE FUNCTION public.log_audit();

CREATE INDEX IF NOT EXISTS idx_bridal_assistance_log ON public.bridal_prep_details (assistance_log_id);

-- ─────────────────────────────────────────────────────────
-- 13. MEDICAL AID DETAILS (مساعدة علاجية)
-- ─────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.medical_aid_details (
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
DROP POLICY IF EXISTS "medical_select_auth" ON public.medical_aid_details;
DROP POLICY IF EXISTS "medical_write_admin" ON public.medical_aid_details;
CREATE POLICY "medical_select_auth" ON public.medical_aid_details FOR SELECT TO authenticated USING (true);
CREATE POLICY "medical_write_admin" ON public.medical_aid_details FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP TRIGGER IF EXISTS audit_medical_aid_details ON public.medical_aid_details;
CREATE TRIGGER audit_medical_aid_details AFTER INSERT OR UPDATE OR DELETE ON public.medical_aid_details FOR EACH ROW EXECUTE FUNCTION public.log_audit();

CREATE INDEX IF NOT EXISTS idx_medical_assistance_log ON public.medical_aid_details (assistance_log_id);

-- ─────────────────────────────────────────────────────────
-- 14. CLOTHES REQUESTS (ملابس الأعياد والمدارس)
-- ─────────────────────────────────────────────────────────

-- Drop and recreate to ensure clean state
DROP TABLE IF EXISTS public.clothes_requests CASCADE;

CREATE TABLE public.clothes_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  individual_id UUID NOT NULL REFERENCES public.individuals(id) ON DELETE CASCADE,
  family_member_id UUID REFERENCES public.family_members(id) ON DELETE SET NULL,
  saint_family TEXT NOT NULL,
  request_category TEXT NOT NULL CHECK (request_category IN ('holiday', 'school')),
  school_name TEXT,
  t_shirt_size TEXT,
  pants_size TEXT,
  shoe_size TEXT,
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.clothes_requests TO authenticated;
GRANT ALL ON public.clothes_requests TO service_role;
ALTER TABLE public.clothes_requests ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "clothes_requests_select_auth" ON public.clothes_requests;
DROP POLICY IF EXISTS "clothes_requests_insert_auth" ON public.clothes_requests;
DROP POLICY IF EXISTS "clothes_requests_update_auth" ON public.clothes_requests;
DROP POLICY IF EXISTS "clothes_requests_delete_auth" ON public.clothes_requests;
CREATE POLICY "clothes_requests_select_auth" ON public.clothes_requests FOR SELECT TO authenticated USING (true);
CREATE POLICY "clothes_requests_insert_auth" ON public.clothes_requests FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "clothes_requests_update_auth" ON public.clothes_requests FOR UPDATE TO authenticated USING (true);
CREATE POLICY "clothes_requests_delete_auth" ON public.clothes_requests FOR DELETE TO authenticated USING (true);

CREATE OR REPLACE FUNCTION public.update_clothes_requests_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_clothes_requests_updated_at ON public.clothes_requests;
CREATE TRIGGER update_clothes_requests_updated_at
  BEFORE UPDATE ON public.clothes_requests
  FOR EACH ROW EXECUTE FUNCTION public.update_clothes_requests_updated_at();

CREATE INDEX IF NOT EXISTS idx_clothes_requests_individual ON public.clothes_requests (individual_id);
CREATE INDEX IF NOT EXISTS idx_clothes_requests_family_member ON public.clothes_requests (family_member_id);
CREATE INDEX IF NOT EXISTS idx_clothes_requests_saint_family ON public.clothes_requests (saint_family);

-- ─────────────────────────────────────────────────────────
-- 15. FURNITURE INVENTORY (مخزن الأجهزة والأثاث)
-- ─────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.furniture_inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  category TEXT NOT NULL CHECK (category IN ('أجهزة منزلية', 'أثاث', 'مفروشات')),
  item_name TEXT NOT NULL,
  quantity INT NOT NULL DEFAULT 1,
  details TEXT,
  created_by UUID REFERENCES auth.users(id),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.furniture_inventory TO authenticated;
GRANT ALL ON public.furniture_inventory TO service_role;
ALTER TABLE public.furniture_inventory ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "furniture_inventory_select_auth" ON public.furniture_inventory;
DROP POLICY IF EXISTS "furniture_inventory_insert_auth" ON public.furniture_inventory;
DROP POLICY IF EXISTS "furniture_inventory_update_auth" ON public.furniture_inventory;
DROP POLICY IF EXISTS "furniture_inventory_delete_auth" ON public.furniture_inventory;
CREATE POLICY "furniture_inventory_select_auth" ON public.furniture_inventory FOR SELECT TO authenticated USING (true);
CREATE POLICY "furniture_inventory_insert_auth" ON public.furniture_inventory FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "furniture_inventory_update_auth" ON public.furniture_inventory FOR UPDATE TO authenticated USING (true);
CREATE POLICY "furniture_inventory_delete_auth" ON public.furniture_inventory FOR DELETE TO authenticated USING (true);

CREATE OR REPLACE FUNCTION public.update_furniture_inventory_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_furniture_inventory_updated_at ON public.furniture_inventory;
CREATE TRIGGER update_furniture_inventory_updated_at
  BEFORE UPDATE ON public.furniture_inventory
  FOR EACH ROW EXECUTE FUNCTION public.update_furniture_inventory_updated_at();

CREATE INDEX IF NOT EXISTS idx_furniture_inventory_category ON public.furniture_inventory (category);

-- ─────────────────────────────────────────────────────────
-- 16. FURNITURE REQUESTS (طلبات الأجهزة والأثاث)
-- ─────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.furniture_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  family_name TEXT NOT NULL,
  beneficiary_id UUID REFERENCES public.individuals(id) ON DELETE SET NULL,
  beneficiary_name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('أجهزة منزلية', 'أثاث', 'مفروشات')),
  item_name TEXT NOT NULL,
  quantity INT DEFAULT 1,
  details TEXT,
  status TEXT CHECK (status IN ('تحت المراجعة', 'مقبول', 'مرفوض')) DEFAULT 'تحت المراجعة',
  requested_by UUID REFERENCES auth.users(id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.furniture_requests TO authenticated;
GRANT ALL ON public.furniture_requests TO service_role;
ALTER TABLE public.furniture_requests ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "furniture_requests_select_auth" ON public.furniture_requests;
DROP POLICY IF EXISTS "furniture_requests_insert_auth" ON public.furniture_requests;
DROP POLICY IF EXISTS "furniture_requests_update_auth" ON public.furniture_requests;
DROP POLICY IF EXISTS "furniture_requests_delete_auth" ON public.furniture_requests;
CREATE POLICY "furniture_requests_select_auth" ON public.furniture_requests FOR SELECT TO authenticated USING (true);
CREATE POLICY "furniture_requests_insert_auth" ON public.furniture_requests FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "furniture_requests_update_auth" ON public.furniture_requests FOR UPDATE TO authenticated USING (true);
CREATE POLICY "furniture_requests_delete_auth" ON public.furniture_requests FOR DELETE TO authenticated USING (true);

CREATE INDEX IF NOT EXISTS idx_furniture_requests_status ON public.furniture_requests (status);
CREATE INDEX IF NOT EXISTS idx_furniture_requests_family ON public.furniture_requests (family_name);
CREATE INDEX IF NOT EXISTS idx_furniture_requests_beneficiary ON public.furniture_requests (beneficiary_id);
CREATE INDEX IF NOT EXISTS idx_furniture_requests_requested_by ON public.furniture_requests (requested_by);

-- ─────────────────────────────────────────────────────────
-- RELOAD POSTGREST SCHEMA CACHE
-- ─────────────────────────────────────────────────────────

NOTIFY pgrst, 'reload schema';
