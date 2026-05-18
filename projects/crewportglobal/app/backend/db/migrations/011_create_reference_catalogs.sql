-- CPG-REF-001
-- Reference catalog foundation for CrewPortGlobal dictionary-driven forms.
-- Idempotent migration: safe to re-run.

BEGIN;

CREATE SCHEMA IF NOT EXISTS crewportglobal;
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS crewportglobal.reference_catalogs (
  reference_catalog_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  catalog_code TEXT UNIQUE NOT NULL,
  catalog_name TEXT NOT NULL,
  catalog_scope TEXT NOT NULL DEFAULT 'global',
  source_name TEXT,
  source_sheet TEXT,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  publication_state TEXT NOT NULL DEFAULT 'draft',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT reference_catalogs_code_chk CHECK (catalog_code ~ '^[a-z][a-z0-9_]*$'),
  CONSTRAINT reference_catalogs_scope_chk CHECK (
    catalog_scope IN ('global', 'seafarer', 'employer', 'vessel', 'system')
  ),
  CONSTRAINT reference_catalogs_publication_state_chk CHECK (
    publication_state IN ('draft', 'pending_owner_review', 'approved', 'published', 'retired')
  )
);

CREATE TABLE IF NOT EXISTS crewportglobal.reference_catalog_values (
  reference_value_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reference_catalog_id UUID NOT NULL REFERENCES crewportglobal.reference_catalogs(reference_catalog_id) ON DELETE CASCADE,
  value_code TEXT NOT NULL,
  display_name TEXT NOT NULL,
  source_value TEXT NOT NULL,
  source_row_number INTEGER,
  sort_order INTEGER NOT NULL DEFAULT 0,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  publication_state TEXT NOT NULL DEFAULT 'draft',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT reference_catalog_values_code_chk CHECK (value_code ~ '^[a-z0-9][a-z0-9_]*$'),
  CONSTRAINT reference_catalog_values_source_row_chk CHECK (
    source_row_number IS NULL OR source_row_number > 0
  ),
  CONSTRAINT reference_catalog_values_publication_state_chk CHECK (
    publication_state IN ('draft', 'pending_owner_review', 'approved', 'published', 'retired')
  )
);

CREATE UNIQUE INDEX IF NOT EXISTS reference_catalog_values_catalog_code_uidx
  ON crewportglobal.reference_catalog_values (reference_catalog_id, value_code);

CREATE INDEX IF NOT EXISTS reference_catalogs_scope_idx
  ON crewportglobal.reference_catalogs (catalog_scope, is_active, publication_state);

CREATE INDEX IF NOT EXISTS reference_catalogs_publication_state_idx
  ON crewportglobal.reference_catalogs (publication_state);

CREATE INDEX IF NOT EXISTS reference_catalog_values_catalog_sort_idx
  ON crewportglobal.reference_catalog_values (reference_catalog_id, sort_order, display_name);

CREATE INDEX IF NOT EXISTS reference_catalog_values_publication_state_idx
  ON crewportglobal.reference_catalog_values (publication_state);

CREATE INDEX IF NOT EXISTS reference_catalog_values_display_name_idx
  ON crewportglobal.reference_catalog_values (lower(display_name));

DROP TRIGGER IF EXISTS reference_catalogs_set_updated_at ON crewportglobal.reference_catalogs;
CREATE TRIGGER reference_catalogs_set_updated_at
BEFORE UPDATE ON crewportglobal.reference_catalogs
FOR EACH ROW
EXECUTE FUNCTION crewportglobal.set_updated_at();

DROP TRIGGER IF EXISTS reference_catalog_values_set_updated_at ON crewportglobal.reference_catalog_values;
CREATE TRIGGER reference_catalog_values_set_updated_at
BEFORE UPDATE ON crewportglobal.reference_catalog_values
FOR EACH ROW
EXECUTE FUNCTION crewportglobal.set_updated_at();

COMMIT;
