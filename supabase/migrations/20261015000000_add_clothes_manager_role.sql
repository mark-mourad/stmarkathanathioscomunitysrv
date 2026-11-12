-- =============================================================================
-- Dedicated CLOTHES_MANAGER role
-- -----------------------------------------------------------------------------
-- Kept in its own migration on purpose: PostgreSQL does not allow a newly added
-- enum value to be *used* in the same transaction that adds it. The next
-- migration (20261015000001) inserts the Arabic label and enforces RLS.
-- Safe to run multiple times.
-- =============================================================================

DO $$ BEGIN
  ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'CLOTHES_MANAGER';
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
