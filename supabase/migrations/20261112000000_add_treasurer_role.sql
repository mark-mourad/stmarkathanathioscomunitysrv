-- =============================================================================
-- Dedicated TREASURER role (خادم الصندوق / مسؤول الخزنة)
-- -----------------------------------------------------------------------------
-- Kept in its own migration on purpose: PostgreSQL does not allow a newly added
-- enum value to be *used* in the same transaction that adds it. The next
-- migration (20261112000001) inserts the Arabic label, creates the treasury
-- tables/functions and enforces RLS.
-- Safe to run multiple times.
-- =============================================================================

DO $$ BEGIN
  ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'TREASURER';
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
