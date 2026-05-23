-- CPG-DEMAND-005
-- Additive demand-side matching foundation.
-- Idempotent migration: safe to re-run.

BEGIN;

CREATE SCHEMA IF NOT EXISTS crewportglobal;
CREATE EXTENSION IF NOT EXISTS pgcrypto;

ALTER TABLE crewportglobal.vacancy_requests
  ADD COLUMN IF NOT EXISTS required_rank_value_id UUID REFERENCES crewportglobal.reference_catalog_values(reference_value_id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS required_rank_label TEXT,
  ADD COLUMN IF NOT EXISTS vessel_type_value_id UUID REFERENCES crewportglobal.reference_catalog_values(reference_value_id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS vessel_type_label TEXT,
  ADD COLUMN IF NOT EXISTS contract_duration_value NUMERIC(8,2),
  ADD COLUMN IF NOT EXISTS contract_duration_unit TEXT,
  ADD COLUMN IF NOT EXISTS required_passport_validity_days INTEGER,
  ADD COLUMN IF NOT EXISTS required_seaman_book_validity_days INTEGER,
  ADD COLUMN IF NOT EXISTS required_medical_validity_days INTEGER,
  ADD COLUMN IF NOT EXISTS demand_workspace JSONB NOT NULL DEFAULT '{}'::jsonb;

ALTER TABLE crewportglobal.vessels
  ADD COLUMN IF NOT EXISTS vessel_type_value_id UUID REFERENCES crewportglobal.reference_catalog_values(reference_value_id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS vessel_type_label TEXT;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'vacancy_requests_contract_duration_unit_chk'
      AND conrelid = 'crewportglobal.vacancy_requests'::regclass
  ) THEN
    ALTER TABLE crewportglobal.vacancy_requests
      ADD CONSTRAINT vacancy_requests_contract_duration_unit_chk CHECK (
        contract_duration_unit IS NULL
        OR contract_duration_unit IN ('day', 'week', 'month', 'year')
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'vacancy_requests_contract_duration_value_chk'
      AND conrelid = 'crewportglobal.vacancy_requests'::regclass
  ) THEN
    ALTER TABLE crewportglobal.vacancy_requests
      ADD CONSTRAINT vacancy_requests_contract_duration_value_chk CHECK (
        contract_duration_value IS NULL OR contract_duration_value > 0
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'vacancy_requests_required_passport_validity_days_chk'
      AND conrelid = 'crewportglobal.vacancy_requests'::regclass
  ) THEN
    ALTER TABLE crewportglobal.vacancy_requests
      ADD CONSTRAINT vacancy_requests_required_passport_validity_days_chk CHECK (
        required_passport_validity_days IS NULL OR required_passport_validity_days >= 0
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'vacancy_requests_required_seaman_book_validity_days_chk'
      AND conrelid = 'crewportglobal.vacancy_requests'::regclass
  ) THEN
    ALTER TABLE crewportglobal.vacancy_requests
      ADD CONSTRAINT vacancy_requests_required_seaman_book_validity_days_chk CHECK (
        required_seaman_book_validity_days IS NULL OR required_seaman_book_validity_days >= 0
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'vacancy_requests_required_medical_validity_days_chk'
      AND conrelid = 'crewportglobal.vacancy_requests'::regclass
  ) THEN
    ALTER TABLE crewportglobal.vacancy_requests
      ADD CONSTRAINT vacancy_requests_required_medical_validity_days_chk CHECK (
        required_medical_validity_days IS NULL OR required_medical_validity_days >= 0
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'vacancy_requests_demand_workspace_object_chk'
      AND conrelid = 'crewportglobal.vacancy_requests'::regclass
  ) THEN
    ALTER TABLE crewportglobal.vacancy_requests
      ADD CONSTRAINT vacancy_requests_demand_workspace_object_chk CHECK (
        jsonb_typeof(demand_workspace) = 'object'
      );
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS vacancy_requests_required_rank_value_idx
  ON crewportglobal.vacancy_requests (required_rank_value_id);

CREATE INDEX IF NOT EXISTS vacancy_requests_vessel_type_value_idx
  ON crewportglobal.vacancy_requests (vessel_type_value_id);

CREATE INDEX IF NOT EXISTS vacancy_requests_contract_duration_unit_idx
  ON crewportglobal.vacancy_requests (contract_duration_unit);

CREATE INDEX IF NOT EXISTS vessels_vessel_type_value_idx
  ON crewportglobal.vessels (vessel_type_value_id);

CREATE TABLE IF NOT EXISTS crewportglobal.demand_requirement_items (
  demand_requirement_item_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vacancy_request_id UUID NOT NULL REFERENCES crewportglobal.vacancy_requests(vacancy_request_id) ON DELETE CASCADE,
  requirement_group TEXT NOT NULL,
  requirement_kind TEXT NOT NULL DEFAULT 'must_have',
  reference_catalog_code TEXT,
  reference_value_id UUID REFERENCES crewportglobal.reference_catalog_values(reference_value_id) ON DELETE SET NULL,
  requirement_label TEXT,
  minimum_validity_days INTEGER,
  source TEXT NOT NULL DEFAULT 'operator_structured',
  record_state TEXT NOT NULL DEFAULT 'active',
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT demand_requirement_items_group_chk CHECK (
    requirement_group IN ('rank', 'vessel_type', 'coc', 'training')
  ),
  CONSTRAINT demand_requirement_items_kind_chk CHECK (
    requirement_kind IN ('must_have', 'nice_to_have', 'disqualifying')
  ),
  CONSTRAINT demand_requirement_items_source_chk CHECK (
    source IN ('legacy_mapping', 'operator_structured', 'system')
  ),
  CONSTRAINT demand_requirement_items_state_chk CHECK (
    record_state IN ('active', 'archived')
  ),
  CONSTRAINT demand_requirement_items_minimum_validity_days_chk CHECK (
    minimum_validity_days IS NULL OR minimum_validity_days >= 0
  ),
  CONSTRAINT demand_requirement_items_metadata_object_chk CHECK (
    jsonb_typeof(metadata) = 'object'
  )
);

CREATE INDEX IF NOT EXISTS demand_requirement_items_vacancy_idx
  ON crewportglobal.demand_requirement_items (vacancy_request_id);

CREATE INDEX IF NOT EXISTS demand_requirement_items_group_idx
  ON crewportglobal.demand_requirement_items (requirement_group, record_state);

CREATE INDEX IF NOT EXISTS demand_requirement_items_reference_value_idx
  ON crewportglobal.demand_requirement_items (reference_value_id);

CREATE UNIQUE INDEX IF NOT EXISTS demand_requirement_items_active_source_uidx
  ON crewportglobal.demand_requirement_items (vacancy_request_id, requirement_group, source)
  WHERE record_state = 'active';

DROP TRIGGER IF EXISTS demand_requirement_items_set_updated_at ON crewportglobal.demand_requirement_items;
CREATE TRIGGER demand_requirement_items_set_updated_at
BEFORE UPDATE ON crewportglobal.demand_requirement_items
FOR EACH ROW
EXECUTE FUNCTION crewportglobal.set_updated_at();

UPDATE crewportglobal.vacancy_requests
SET required_rank_label = COALESCE(required_rank_label, NULLIF(BTRIM(rank), '')),
    vessel_type_label = COALESCE(vessel_type_label, NULLIF(BTRIM(vessel_type), '')),
    demand_workspace = COALESCE(demand_workspace, '{}'::jsonb) ||
      jsonb_build_object(
        'legacy',
        jsonb_strip_nulls(jsonb_build_object(
          'rank_text', NULLIF(BTRIM(rank), ''),
          'vessel_type_text', NULLIF(BTRIM(vessel_type), ''),
          'contract_duration_text', NULLIF(BTRIM(contract_duration), ''),
          'requirements_text', NULLIF(BTRIM(requirements), '')
        ))
      )
WHERE required_rank_label IS NULL
   OR vessel_type_label IS NULL
   OR demand_workspace IS NULL
   OR NOT (demand_workspace ? 'legacy');

UPDATE crewportglobal.vessels
SET vessel_type_label = COALESCE(vessel_type_label, NULLIF(BTRIM(vessel_type), ''))
WHERE vessel_type_label IS NULL;

WITH rank_catalog AS (
  SELECT rv.reference_value_id, lower(rv.display_name) AS display_name_key
  FROM crewportglobal.reference_catalog_values rv
  JOIN crewportglobal.reference_catalogs rc ON rc.reference_catalog_id = rv.reference_catalog_id
  WHERE rc.catalog_code = 'seafarer_positions'
    AND rc.is_active = TRUE
    AND rc.publication_state = 'published'
    AND rv.is_active = TRUE
    AND rv.publication_state = 'published'
),
rank_matches AS (
  SELECT vr.vacancy_request_id, rc.reference_value_id
  FROM crewportglobal.vacancy_requests vr
  JOIN rank_catalog rc ON rc.display_name_key = lower(NULLIF(BTRIM(vr.required_rank_label), ''))
  WHERE vr.required_rank_value_id IS NULL
)
UPDATE crewportglobal.vacancy_requests vr
SET required_rank_value_id = rm.reference_value_id
FROM rank_matches rm
WHERE vr.vacancy_request_id = rm.vacancy_request_id;

WITH vessel_type_catalog AS (
  SELECT rv.reference_value_id, lower(rv.display_name) AS display_name_key
  FROM crewportglobal.reference_catalog_values rv
  JOIN crewportglobal.reference_catalogs rc ON rc.reference_catalog_id = rv.reference_catalog_id
  WHERE rc.catalog_code = 'vessel_types'
    AND rc.is_active = TRUE
    AND rc.publication_state = 'published'
    AND rv.is_active = TRUE
    AND rv.publication_state = 'published'
),
vacancy_matches AS (
  SELECT vr.vacancy_request_id, vtc.reference_value_id
  FROM crewportglobal.vacancy_requests vr
  JOIN vessel_type_catalog vtc ON vtc.display_name_key = lower(NULLIF(BTRIM(vr.vessel_type_label), ''))
  WHERE vr.vessel_type_value_id IS NULL
),
vessel_matches AS (
  SELECT v.vessel_id, vtc.reference_value_id
  FROM crewportglobal.vessels v
  JOIN vessel_type_catalog vtc ON vtc.display_name_key = lower(NULLIF(BTRIM(v.vessel_type_label), ''))
  WHERE v.vessel_type_value_id IS NULL
)
UPDATE crewportglobal.vacancy_requests vr
SET vessel_type_value_id = vm.reference_value_id
FROM vacancy_matches vm
WHERE vr.vacancy_request_id = vm.vacancy_request_id;

WITH vessel_type_catalog AS (
  SELECT rv.reference_value_id, lower(rv.display_name) AS display_name_key
  FROM crewportglobal.reference_catalog_values rv
  JOIN crewportglobal.reference_catalogs rc ON rc.reference_catalog_id = rv.reference_catalog_id
  WHERE rc.catalog_code = 'vessel_types'
    AND rc.is_active = TRUE
    AND rc.publication_state = 'published'
    AND rv.is_active = TRUE
    AND rv.publication_state = 'published'
),
vessel_matches AS (
  SELECT v.vessel_id, vtc.reference_value_id
  FROM crewportglobal.vessels v
  JOIN vessel_type_catalog vtc ON vtc.display_name_key = lower(NULLIF(BTRIM(v.vessel_type_label), ''))
  WHERE v.vessel_type_value_id IS NULL
)
UPDATE crewportglobal.vessels v
SET vessel_type_value_id = vm.reference_value_id
FROM vessel_matches vm
WHERE v.vessel_id = vm.vessel_id;

WITH parsed_duration AS (
  SELECT vacancy_request_id,
         (regexp_match(lower(contract_duration), '^[[:space:]]*([0-9]+(\.[0-9]+)?)[[:space:]]*(day|days|week|weeks|month|months|year|years)')) AS parts
  FROM crewportglobal.vacancy_requests
  WHERE contract_duration IS NOT NULL
    AND (contract_duration_value IS NULL OR contract_duration_unit IS NULL)
),
duration_values AS (
  SELECT vacancy_request_id,
         (parts[1])::numeric AS duration_value,
         CASE
           WHEN parts[3] IN ('day', 'days') THEN 'day'
           WHEN parts[3] IN ('week', 'weeks') THEN 'week'
           WHEN parts[3] IN ('month', 'months') THEN 'month'
           WHEN parts[3] IN ('year', 'years') THEN 'year'
           ELSE NULL
         END AS duration_unit
  FROM parsed_duration
  WHERE parts IS NOT NULL
)
UPDATE crewportglobal.vacancy_requests vr
SET contract_duration_value = COALESCE(vr.contract_duration_value, dv.duration_value),
    contract_duration_unit = COALESCE(vr.contract_duration_unit, dv.duration_unit)
FROM duration_values dv
WHERE vr.vacancy_request_id = dv.vacancy_request_id;

INSERT INTO crewportglobal.demand_requirement_items (
  vacancy_request_id,
  requirement_group,
  requirement_kind,
  reference_catalog_code,
  reference_value_id,
  requirement_label,
  source,
  metadata
)
SELECT vr.vacancy_request_id,
       'rank',
       'must_have',
       'seafarer_positions',
       vr.required_rank_value_id,
       vr.required_rank_label,
       'legacy_mapping',
       jsonb_build_object('source_column', 'vacancy_requests.rank')
FROM crewportglobal.vacancy_requests vr
WHERE vr.required_rank_value_id IS NOT NULL
ON CONFLICT (vacancy_request_id, requirement_group, source)
WHERE record_state = 'active'
DO UPDATE SET
  reference_value_id = EXCLUDED.reference_value_id,
  requirement_label = EXCLUDED.requirement_label,
  metadata = EXCLUDED.metadata,
  updated_at = now();

INSERT INTO crewportglobal.demand_requirement_items (
  vacancy_request_id,
  requirement_group,
  requirement_kind,
  reference_catalog_code,
  reference_value_id,
  requirement_label,
  source,
  metadata
)
SELECT vr.vacancy_request_id,
       'vessel_type',
       'must_have',
       'vessel_types',
       vr.vessel_type_value_id,
       vr.vessel_type_label,
       'legacy_mapping',
       jsonb_build_object('source_column', 'vacancy_requests.vessel_type')
FROM crewportglobal.vacancy_requests vr
WHERE vr.vessel_type_value_id IS NOT NULL
ON CONFLICT (vacancy_request_id, requirement_group, source)
WHERE record_state = 'active'
DO UPDATE SET
  reference_value_id = EXCLUDED.reference_value_id,
  requirement_label = EXCLUDED.requirement_label,
  metadata = EXCLUDED.metadata,
  updated_at = now();

COMMIT;
