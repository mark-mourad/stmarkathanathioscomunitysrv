-- Update Beneficiary Schema for Gender and Family Requirements
-- This migration adds the gender field and ensures family compatibility

-- Add gender column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'individuals' 
        AND column_name = 'gender'
    ) THEN
        ALTER TABLE public.individuals 
        ADD COLUMN gender TEXT CHECK (gender IN ('male', 'female'));
    END IF;
END $$;

-- Ensure saint_family column exists and can accept all required values
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'individuals' 
        AND column_name = 'saint_family'
    ) THEN
        ALTER TABLE public.individuals 
        ADD COLUMN saint_family TEXT;
    END IF;
END $$;

-- Update existing records to have default values for new required fields
-- Set a default gender for existing records (you may want to update these manually)
UPDATE public.individuals 
SET gender = 'male' 
WHERE gender IS NULL;

-- Ensure saint_family is not null for existing records
-- Set a default family for records without one (you may want to update these manually)
UPDATE public.individuals 
SET saint_family = 'أسر مستترة' 
WHERE saint_family IS NULL OR saint_family = '';

-- Add comment to document the expected saint_family values
COMMENT ON COLUMN public.individuals.saint_family IS 'Saint family: مرقس, يوحنا, لوقا, متى, أسر مستترة';

-- Add comment to document the gender field
COMMENT ON COLUMN public.individuals.gender IS 'Gender: male or female';
