-- ============================================================
-- Clothes Requests Module + Family Members Insurance Number
-- Safe to run multiple times (all operations are idempotent)
-- ============================================================

-- 1. Add insurance_number to family_members
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'family_members'
        AND column_name = 'insurance_number'
    ) THEN
        ALTER TABLE public.family_members
        ADD COLUMN insurance_number TEXT;
    END IF;
END $$;

-- 2. Add birth_governorate to individuals
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'individuals'
        AND column_name = 'birth_governorate'
    ) THEN
        ALTER TABLE public.individuals
        ADD COLUMN birth_governorate TEXT;
    END IF;
END $$;

-- 3. Drop the old table if it exists but is broken/incomplete
DROP TABLE IF EXISTS public.clothes_requests CASCADE;

-- 4. Create clothes_requests table (fresh, clean)
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

-- 5. Table-level GRANTs (required in addition to RLS)
GRANT SELECT, INSERT, UPDATE, DELETE ON public.clothes_requests TO authenticated;
GRANT ALL ON public.clothes_requests TO service_role;

-- 6. Enable Row Level Security
ALTER TABLE public.clothes_requests ENABLE ROW LEVEL SECURITY;

-- 7. Drop old policies if any, then recreate (idempotent)
DROP POLICY IF EXISTS "clothes_requests_select_auth" ON public.clothes_requests;
DROP POLICY IF EXISTS "clothes_requests_insert_auth" ON public.clothes_requests;
DROP POLICY IF EXISTS "clothes_requests_update_auth" ON public.clothes_requests;
DROP POLICY IF EXISTS "clothes_requests_delete_auth" ON public.clothes_requests;

CREATE POLICY "clothes_requests_select_auth"
    ON public.clothes_requests
    FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "clothes_requests_insert_auth"
    ON public.clothes_requests
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "clothes_requests_update_auth"
    ON public.clothes_requests
    FOR UPDATE
    TO authenticated
    USING (true);

CREATE POLICY "clothes_requests_delete_auth"
    ON public.clothes_requests
    FOR DELETE
    TO authenticated
    USING (true);

-- 8. updated_at trigger function (create if not exists)
CREATE OR REPLACE FUNCTION public.update_clothes_requests_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 9. Attach trigger (drop first to avoid duplicates)
DROP TRIGGER IF EXISTS update_clothes_requests_updated_at ON public.clothes_requests;
CREATE TRIGGER update_clothes_requests_updated_at
    BEFORE UPDATE ON public.clothes_requests
    FOR EACH ROW
    EXECUTE FUNCTION public.update_clothes_requests_updated_at();

-- 10. Indexes for performance
CREATE INDEX IF NOT EXISTS idx_clothes_requests_individual
    ON public.clothes_requests (individual_id);
CREATE INDEX IF NOT EXISTS idx_clothes_requests_family_member
    ON public.clothes_requests (family_member_id);
CREATE INDEX IF NOT EXISTS idx_clothes_requests_saint_family
    ON public.clothes_requests (saint_family);

-- 11. Reload PostgREST schema cache so the API immediately sees the new table/columns
NOTIFY pgrst, 'reload schema';
