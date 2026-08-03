-- Add gender field to individuals table
ALTER TABLE public.individuals 
ADD COLUMN gender TEXT CHECK (gender IN ('male', 'female'));
