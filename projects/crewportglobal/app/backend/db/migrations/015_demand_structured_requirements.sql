-- CPG-DEMAND-009
-- Structured demand requirements for machine-readable request-offer matching.
-- Additive/idempotent migration: safe to re-run after 014.

BEGIN;

CREATE SCHEMA IF NOT EXISTS crewportglobal;

ALTER TABLE crewportglobal.demand_requirement_items
  ADD COLUMN IF NOT EXISTS requirement_key TEXT NOT NULL DEFAULT 'primary';

UPDATE crewportglobal.demand_requirement_items
SET requirement_key = 'primary'
WHERE requirement_key IS NULL OR BTRIM(requirement_key) = '';

DROP INDEX IF EXISTS crewportglobal.demand_requirement_items_active_source_uidx;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'demand_requirement_items_group_chk'
      AND conrelid = 'crewportglobal.demand_requirement_items'::regclass
  ) THEN
    ALTER TABLE crewportglobal.demand_requirement_items
      DROP CONSTRAINT demand_requirement_items_group_chk;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'demand_requirement_items_group_chk'
      AND conrelid = 'crewportglobal.demand_requirement_items'::regclass
  ) THEN
    ALTER TABLE crewportglobal.demand_requirement_items
      ADD CONSTRAINT demand_requirement_items_group_chk CHECK (
        requirement_group IN (
          'rank',
          'vessel_type',
          'coc',
          'endorsement',
          'training',
          'visa',
          'language',
          'sea_service',
          'general'
        )
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'demand_requirement_items_key_chk'
      AND conrelid = 'crewportglobal.demand_requirement_items'::regclass
  ) THEN
    ALTER TABLE crewportglobal.demand_requirement_items
      ADD CONSTRAINT demand_requirement_items_key_chk CHECK (
        BTRIM(requirement_key) <> ''
      );
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS demand_requirement_items_active_key_uidx
  ON crewportglobal.demand_requirement_items (vacancy_request_id, requirement_group, source, requirement_key)
  WHERE record_state = 'active';

CREATE INDEX IF NOT EXISTS demand_requirement_items_catalog_lookup_idx
  ON crewportglobal.demand_requirement_items (reference_catalog_code, reference_value_id)
  WHERE record_state = 'active';

COMMIT;
