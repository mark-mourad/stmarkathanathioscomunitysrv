-- ============================================================
-- Furniture & Home Appliances Inventory & Request System
-- Safe to run multiple times (all operations are idempotent)
-- ============================================================

-- 1. Create furniture_inventory table (المخزن)
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

-- 2. Create furniture_requests table (الطلبات)
CREATE TABLE IF NOT EXISTS public.furniture_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    family_name TEXT NOT NULL,
    beneficiary_id UUID,
    beneficiary_name TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('أجهزة منزلية', 'أثاث', 'مفروشات')),
    item_name TEXT NOT NULL,
    quantity INT DEFAULT 1,
    details TEXT,
    status TEXT CHECK (status IN ('تحت المراجعة', 'مقبول', 'مرفوض')) DEFAULT 'تحت المراجعة',
    requested_by UUID REFERENCES auth.users(id)
);

-- 3. GRANTs
GRANT SELECT, INSERT, UPDATE, DELETE ON public.furniture_inventory TO authenticated;
GRANT ALL ON public.furniture_inventory TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.furniture_requests TO authenticated;
GRANT ALL ON public.furniture_requests TO service_role;

-- 4. Enable Row Level Security
ALTER TABLE public.furniture_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.furniture_requests ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies for furniture_inventory
DROP POLICY IF EXISTS "furniture_inventory_select_auth" ON public.furniture_inventory;
DROP POLICY IF EXISTS "furniture_inventory_insert_auth" ON public.furniture_inventory;
DROP POLICY IF EXISTS "furniture_inventory_update_auth" ON public.furniture_inventory;
DROP POLICY IF EXISTS "furniture_inventory_delete_auth" ON public.furniture_inventory;

CREATE POLICY "furniture_inventory_select_auth"
    ON public.furniture_inventory FOR SELECT TO authenticated USING (true);
CREATE POLICY "furniture_inventory_insert_auth"
    ON public.furniture_inventory FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "furniture_inventory_update_auth"
    ON public.furniture_inventory FOR UPDATE TO authenticated USING (true);
CREATE POLICY "furniture_inventory_delete_auth"
    ON public.furniture_inventory FOR DELETE TO authenticated USING (true);

-- 6. RLS Policies for furniture_requests
DROP POLICY IF EXISTS "furniture_requests_select_auth" ON public.furniture_requests;
DROP POLICY IF EXISTS "furniture_requests_insert_auth" ON public.furniture_requests;
DROP POLICY IF EXISTS "furniture_requests_update_auth" ON public.furniture_requests;
DROP POLICY IF EXISTS "furniture_requests_delete_auth" ON public.furniture_requests;

CREATE POLICY "furniture_requests_select_auth"
    ON public.furniture_requests FOR SELECT TO authenticated USING (true);
CREATE POLICY "furniture_requests_insert_auth"
    ON public.furniture_requests FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "furniture_requests_update_auth"
    ON public.furniture_requests FOR UPDATE TO authenticated USING (true);
CREATE POLICY "furniture_requests_delete_auth"
    ON public.furniture_requests FOR DELETE TO authenticated USING (true);

-- 7. updated_at trigger for furniture_inventory
CREATE OR REPLACE FUNCTION public.update_furniture_inventory_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_furniture_inventory_updated_at ON public.furniture_inventory;
CREATE TRIGGER update_furniture_inventory_updated_at
    BEFORE UPDATE ON public.furniture_inventory
    FOR EACH ROW
    EXECUTE FUNCTION public.update_furniture_inventory_updated_at();

-- 8. Indexes
CREATE INDEX IF NOT EXISTS idx_furniture_inventory_category
    ON public.furniture_inventory (category);
CREATE INDEX IF NOT EXISTS idx_furniture_requests_status
    ON public.furniture_requests (status);
CREATE INDEX IF NOT EXISTS idx_furniture_requests_family
    ON public.furniture_requests (family_name);
CREATE INDEX IF NOT EXISTS idx_furniture_requests_beneficiary
    ON public.furniture_requests (beneficiary_id);
CREATE INDEX IF NOT EXISTS idx_furniture_requests_requested_by
    ON public.furniture_requests (requested_by);

-- 9. Reload PostgREST schema cache
NOTIFY pgrst, 'reload schema';
