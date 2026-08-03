-- Update individuals table with new fields

-- Add mother's name field
ALTER TABLE public.individuals ADD COLUMN mother_name TEXT;

-- Add alternative address fields
ALTER TABLE public.individuals ADD COLUMN has_alt_address BOOLEAN DEFAULT FALSE;
ALTER TABLE public.individuals ADD COLUMN alt_address TEXT;
ALTER TABLE public.individuals ADD COLUMN alt_governorate TEXT;

-- Update existing housing_type values from 'ايجار' to 'ايجار قديم'
UPDATE public.individuals SET housing_type = 'ايجار قديم' WHERE housing_type = 'ايجار';

-- Create monthly support from other churches table
CREATE TABLE public.monthly_church_support (
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
CREATE POLICY "support_select" ON public.monthly_church_support FOR SELECT TO authenticated USING (true);
CREATE POLICY "support_write_admin" ON public.monthly_church_support FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Add audit trigger for monthly_church_support
CREATE TRIGGER audit_monthly_church_support AFTER INSERT OR UPDATE OR DELETE ON public.monthly_church_support FOR EACH ROW EXECUTE FUNCTION public.log_audit();

-- Add updated_at trigger for monthly_church_support
CREATE TRIGGER touch_monthly_church_support BEFORE UPDATE ON public.monthly_church_support FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Add index for better performance
CREATE INDEX idx_monthly_support_individual ON public.monthly_church_support (individual_id);
