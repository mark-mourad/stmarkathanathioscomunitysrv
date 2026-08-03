-- ============================================================
-- Food Supplies Inventory (مخزن التموين / العُقدة)
-- Safe to run multiple times (all operations are idempotent)
-- ============================================================

-- 1. Create supplies_inventory table
CREATE TABLE IF NOT EXISTS public.supplies_inventory (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    category TEXT NOT NULL CHECK (category IN ('بروتين', 'نشويات', 'دهون', 'أخرى')),
    item_name TEXT NOT NULL,
    quantity INT NOT NULL DEFAULT 0,
    weight TEXT,
    details TEXT,
    created_by UUID REFERENCES auth.users(id),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. GRANTs
GRANT SELECT, INSERT, UPDATE, DELETE ON public.supplies_inventory TO authenticated;
GRANT ALL ON public.supplies_inventory TO service_role;

-- 3. Enable Row Level Security
ALTER TABLE public.supplies_inventory ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies
DROP POLICY IF EXISTS "supplies_inventory_select_auth" ON public.supplies_inventory;
DROP POLICY IF EXISTS "supplies_inventory_insert_auth" ON public.supplies_inventory;
DROP POLICY IF EXISTS "supplies_inventory_update_auth" ON public.supplies_inventory;
DROP POLICY IF EXISTS "supplies_inventory_delete_auth" ON public.supplies_inventory;

CREATE POLICY "supplies_inventory_select_auth"
    ON public.supplies_inventory FOR SELECT TO authenticated USING (true);
CREATE POLICY "supplies_inventory_insert_auth"
    ON public.supplies_inventory FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "supplies_inventory_update_auth"
    ON public.supplies_inventory FOR UPDATE TO authenticated USING (true);
CREATE POLICY "supplies_inventory_delete_auth"
    ON public.supplies_inventory FOR DELETE TO authenticated USING (true);

-- 5. updated_at trigger
CREATE OR REPLACE FUNCTION public.update_supplies_inventory_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_supplies_inventory_updated_at ON public.supplies_inventory;
CREATE TRIGGER update_supplies_inventory_updated_at
    BEFORE UPDATE ON public.supplies_inventory
    FOR EACH ROW
    EXECUTE FUNCTION public.update_supplies_inventory_updated_at();

-- 6. Indexes
CREATE INDEX IF NOT EXISTS idx_supplies_inventory_category
    ON public.supplies_inventory (category);
CREATE INDEX IF NOT EXISTS idx_supplies_inventory_item_name
    ON public.supplies_inventory (item_name);
CREATE INDEX IF NOT EXISTS idx_supplies_inventory_created_by
    ON public.supplies_inventory (created_by);

-- 7. Reload PostgREST schema cache
NOTIFY pgrst, 'reload schema';
