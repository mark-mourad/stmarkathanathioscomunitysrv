-- RBAC: Extend app_role enum to cover all 11 system roles

-- Safe migration: add new enum values one by one using ALTER TYPE
-- (Postgres allows ADD VALUE outside of transaction blocks)
DO $$ BEGIN
  ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'SUPER_ADMIN';
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'ADMIN';
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'BRIDE_AND_MEDICAL_AIDS_MANAGER';
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'ST_MATTHEW';
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'ST_MARK';
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'ST_JOHN';
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'ST_LUKE';
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'BLESSING_DISTRIBUTOR';
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'SUPPLY_WAREHOUSE_MANAGER';
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'FURNITURE_WAREHOUSE_MANAGER';
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'PHARMACY_WAREHOUSE_MANAGER';
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Create a dedicated role_labels table for display names
CREATE TABLE IF NOT EXISTS public.role_labels (
  role app_role PRIMARY KEY,
  label_ar TEXT NOT NULL,
  label_en TEXT NOT NULL
);

INSERT INTO public.role_labels (role, label_ar, label_en) VALUES
  ('SUPER_ADMIN', 'مدير النظام', 'Super Admin'),
  ('ADMIN', 'مسؤول', 'Admin'),
  ('BRIDE_AND_MEDICAL_AIDS_MANAGER', 'مساعدات العرائس والعلاج', 'Bride & Medical Manager'),
  ('ST_MATTHEW', 'خادم أسرة القديس متى', 'St. Matthew Servant'),
  ('ST_MARK', 'خادم أسرة القديس مرقس', 'St. Mark Servant'),
  ('ST_JOHN', 'خادم أسرة القديس يوحنا', 'St. John Servant'),
  ('ST_LUKE', 'خادم أسرة القديس لوقا', 'St. Luke Servant'),
  ('BLESSING_DISTRIBUTOR', 'توزيع البركة', 'Blessing Distributor'),
  ('SUPPLY_WAREHOUSE_MANAGER', 'مخزن التموين', 'Supply Warehouse Manager'),
  ('FURNITURE_WAREHOUSE_MANAGER', 'مخزن الأثاث', 'Furniture Warehouse Manager'),
  ('PHARMACY_WAREHOUSE_MANAGER', 'مخزن الصيدلية', 'Pharmacy Warehouse Manager')
ON CONFLICT (role) DO UPDATE SET label_ar = EXCLUDED.label_ar, label_en = EXCLUDED.label_en;

GRANT SELECT ON public.role_labels TO authenticated;
GRANT ALL ON public.role_labels TO service_role;
ALTER TABLE public.role_labels ENABLE ROW LEVEL SECURITY;
CREATE POLICY "role_labels_select_all" ON public.role_labels FOR SELECT TO authenticated USING (true);

-- Add assigned_family column to user_roles for ST_* family servant roles
ALTER TABLE public.user_roles ADD COLUMN IF NOT EXISTS assigned_family TEXT;

-- Helper: check if user has any of the given roles
CREATE OR REPLACE FUNCTION public.has_any_role(_user_id UUID, VARIADIC _roles app_role[])
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = ANY(_roles))
$$;

GRANT EXECUTE ON FUNCTION public.has_any_role(uuid, app_role[]) TO authenticated;

-- Helper: get user's primary role (first role found)
CREATE OR REPLACE FUNCTION public.get_primary_role(_user_id UUID)
RETURNS app_role LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT role FROM public.user_roles WHERE user_id = _user_id LIMIT 1
$$;

GRANT EXECUTE ON FUNCTION public.get_primary_role(uuid) TO authenticated;

-- Helper: get user's assigned family (for ST_* roles)
CREATE OR REPLACE FUNCTION public.get_assigned_family(_user_id UUID)
RETURNS TEXT LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT assigned_family FROM public.user_roles WHERE user_id = _user_id AND assigned_family IS NOT NULL LIMIT 1
$$;

GRANT EXECUTE ON FUNCTION public.get_assigned_family(uuid) TO authenticated;
