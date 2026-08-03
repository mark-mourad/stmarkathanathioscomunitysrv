-- Pharmacy & Medication System Tables
-- Table 1: Medication Inventory (مخزن الصيدلية)
CREATE TABLE IF NOT EXISTS public.pharmacy_inventory (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    disease_category TEXT NOT NULL,
    custom_disease_name TEXT,
    medicine_name TEXT NOT NULL,
    quantity INT NOT NULL DEFAULT 1,
    unit_type TEXT CHECK (unit_type IN ('علبة', 'شريط', 'حقنة/أمبول', 'أخرى')) NOT NULL DEFAULT 'علبة',
    details TEXT,
    created_by UUID REFERENCES auth.users(id)
);

-- Table 2: Medication Requests (طلبات العلاج)
CREATE TABLE IF NOT EXISTS public.pharmacy_requests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    family_name TEXT NOT NULL,
    beneficiary_id UUID,
    beneficiary_name TEXT NOT NULL,
    disease_category TEXT NOT NULL,
    custom_disease_name TEXT,
    medicine_name TEXT NOT NULL,
    requested_quantity INT NOT NULL DEFAULT 1,
    status TEXT CHECK (status IN ('تحت المراجعة', 'مقبول', 'مرفوض')) DEFAULT 'تحت المراجعة',
    details TEXT,
    requested_by UUID REFERENCES auth.users(id)
);

-- RLS Policies
ALTER TABLE public.pharmacy_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pharmacy_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow full access on pharmacy_inventory" ON public.pharmacy_inventory;
CREATE POLICY "Allow full access on pharmacy_inventory" ON public.pharmacy_inventory FOR ALL TO authenticated, anon USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow full access on pharmacy_requests" ON public.pharmacy_requests;
CREATE POLICY "Allow full access on pharmacy_requests" ON public.pharmacy_requests FOR ALL TO authenticated, anon USING (true) WITH CHECK (true);

NOTIFY pgrst, 'reload schema';
