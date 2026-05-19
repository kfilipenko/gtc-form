-- CPG-SEAFARER-001
-- Structured seafarer workspace records for card-based profile data.
-- Idempotent migration: safe to re-run.

BEGIN;

CREATE SCHEMA IF NOT EXISTS crewportglobal;
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS crewportglobal.seafarer_person_details (
  seafarer_person_detail_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seafarer_profile_id UUID NOT NULL UNIQUE REFERENCES crewportglobal.seafarer_profiles(seafarer_profile_id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES crewportglobal.users(user_id) ON DELETE CASCADE,
  source_draft_id UUID,
  date_of_birth DATE,
  place_of_birth TEXT,
  gender_value_id UUID REFERENCES crewportglobal.reference_catalog_values(reference_value_id) ON DELETE SET NULL,
  gender_label TEXT,
  civil_status_value_id UUID REFERENCES crewportglobal.reference_catalog_values(reference_value_id) ON DELETE SET NULL,
  civil_status_label TEXT,
  nationality_value_id UUID REFERENCES crewportglobal.reference_catalog_values(reference_value_id) ON DELETE SET NULL,
  nationality_code CHAR(2),
  residence_country_value_id UUID REFERENCES crewportglobal.reference_catalog_values(reference_value_id) ON DELETE SET NULL,
  residence_country_code CHAR(2),
  residence_city_value_id UUID REFERENCES crewportglobal.reference_catalog_values(reference_value_id) ON DELETE SET NULL,
  residence_city_label TEXT,
  permanent_address TEXT,
  nearest_airport_value_id UUID REFERENCES crewportglobal.reference_catalog_values(reference_value_id) ON DELETE SET NULL,
  nearest_airport_label TEXT,
  record_state TEXT NOT NULL DEFAULT 'draft',
  review_status TEXT NOT NULL DEFAULT 'not_submitted',
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT seafarer_person_details_nationality_code_chk CHECK (
    nationality_code IS NULL OR nationality_code ~ '^[A-Z]{2}$'
  ),
  CONSTRAINT seafarer_person_details_residence_code_chk CHECK (
    residence_country_code IS NULL OR residence_country_code ~ '^[A-Z]{2}$'
  ),
  CONSTRAINT seafarer_person_details_record_state_chk CHECK (
    record_state IN ('draft', 'submitted', 'active', 'archived', 'superseded')
  ),
  CONSTRAINT seafarer_person_details_review_status_chk CHECK (
    review_status IN ('not_submitted', 'pending_human_review', 'under_review', 'verified', 'rejected', 'correction_requested', 'superseded')
  )
);

CREATE TABLE IF NOT EXISTS crewportglobal.seafarer_emergency_contacts (
  seafarer_emergency_contact_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seafarer_profile_id UUID NOT NULL REFERENCES crewportglobal.seafarer_profiles(seafarer_profile_id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES crewportglobal.users(user_id) ON DELETE CASCADE,
  source_draft_id UUID,
  contact_name TEXT NOT NULL,
  relation_value_id UUID REFERENCES crewportglobal.reference_catalog_values(reference_value_id) ON DELETE SET NULL,
  relation_label TEXT,
  contact_phone TEXT,
  contact_email TEXT,
  contact_address TEXT,
  is_primary BOOLEAN NOT NULL DEFAULT FALSE,
  record_state TEXT NOT NULL DEFAULT 'draft',
  review_status TEXT NOT NULL DEFAULT 'not_submitted',
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT seafarer_emergency_contacts_email_chk CHECK (
    contact_email IS NULL OR position('@' in contact_email) > 1
  ),
  CONSTRAINT seafarer_emergency_contacts_record_state_chk CHECK (
    record_state IN ('draft', 'submitted', 'active', 'archived', 'superseded')
  ),
  CONSTRAINT seafarer_emergency_contacts_review_status_chk CHECK (
    review_status IN ('not_submitted', 'pending_human_review', 'under_review', 'verified', 'rejected', 'correction_requested', 'superseded')
  )
);

CREATE TABLE IF NOT EXISTS crewportglobal.seafarer_education_records (
  seafarer_education_record_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seafarer_profile_id UUID NOT NULL REFERENCES crewportglobal.seafarer_profiles(seafarer_profile_id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES crewportglobal.users(user_id) ON DELETE CASCADE,
  source_draft_id UUID,
  institution_value_id UUID REFERENCES crewportglobal.reference_catalog_values(reference_value_id) ON DELETE SET NULL,
  institution_name TEXT,
  grade_value_id UUID REFERENCES crewportglobal.reference_catalog_values(reference_value_id) ON DELETE SET NULL,
  grade_label TEXT,
  field_of_study TEXT,
  country_value_id UUID REFERENCES crewportglobal.reference_catalog_values(reference_value_id) ON DELETE SET NULL,
  country_code CHAR(2),
  start_date DATE,
  completion_date DATE,
  document_id UUID REFERENCES crewportglobal.uploaded_documents(document_id) ON DELETE SET NULL,
  record_state TEXT NOT NULL DEFAULT 'draft',
  review_status TEXT NOT NULL DEFAULT 'not_submitted',
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT seafarer_education_records_country_code_chk CHECK (
    country_code IS NULL OR country_code ~ '^[A-Z]{2}$'
  ),
  CONSTRAINT seafarer_education_records_record_state_chk CHECK (
    record_state IN ('draft', 'submitted', 'active', 'archived', 'superseded')
  ),
  CONSTRAINT seafarer_education_records_review_status_chk CHECK (
    review_status IN ('not_submitted', 'pending_human_review', 'under_review', 'verified', 'rejected', 'correction_requested', 'superseded')
  )
);

CREATE TABLE IF NOT EXISTS crewportglobal.seafarer_certificates (
  seafarer_certificate_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seafarer_profile_id UUID NOT NULL REFERENCES crewportglobal.seafarer_profiles(seafarer_profile_id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES crewportglobal.users(user_id) ON DELETE CASCADE,
  source_draft_id UUID,
  certificate_group TEXT NOT NULL DEFAULT 'competency',
  certificate_type_value_id UUID REFERENCES crewportglobal.reference_catalog_values(reference_value_id) ON DELETE SET NULL,
  certificate_type_label TEXT,
  certificate_number TEXT,
  issuing_authority TEXT,
  issuing_country_value_id UUID REFERENCES crewportglobal.reference_catalog_values(reference_value_id) ON DELETE SET NULL,
  issuing_country_code CHAR(2),
  issued_at DATE,
  expires_at DATE,
  document_id UUID REFERENCES crewportglobal.uploaded_documents(document_id) ON DELETE SET NULL,
  record_state TEXT NOT NULL DEFAULT 'draft',
  review_status TEXT NOT NULL DEFAULT 'not_submitted',
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT seafarer_certificates_group_chk CHECK (
    certificate_group IN ('competency', 'endorsement', 'training', 'medical', 'language', 'other')
  ),
  CONSTRAINT seafarer_certificates_issuing_country_chk CHECK (
    issuing_country_code IS NULL OR issuing_country_code ~ '^[A-Z]{2}$'
  ),
  CONSTRAINT seafarer_certificates_record_state_chk CHECK (
    record_state IN ('draft', 'submitted', 'active', 'archived', 'superseded')
  ),
  CONSTRAINT seafarer_certificates_review_status_chk CHECK (
    review_status IN ('not_submitted', 'pending_human_review', 'under_review', 'verified', 'rejected', 'correction_requested', 'superseded')
  )
);

CREATE TABLE IF NOT EXISTS crewportglobal.seafarer_training_records (
  seafarer_training_record_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seafarer_profile_id UUID NOT NULL REFERENCES crewportglobal.seafarer_profiles(seafarer_profile_id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES crewportglobal.users(user_id) ON DELETE CASCADE,
  source_draft_id UUID,
  training_type_value_id UUID REFERENCES crewportglobal.reference_catalog_values(reference_value_id) ON DELETE SET NULL,
  training_type_label TEXT,
  certificate_number TEXT,
  issuing_center TEXT,
  issued_at DATE,
  expires_at DATE,
  document_id UUID REFERENCES crewportglobal.uploaded_documents(document_id) ON DELETE SET NULL,
  record_state TEXT NOT NULL DEFAULT 'draft',
  review_status TEXT NOT NULL DEFAULT 'not_submitted',
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT seafarer_training_records_record_state_chk CHECK (
    record_state IN ('draft', 'submitted', 'active', 'archived', 'superseded')
  ),
  CONSTRAINT seafarer_training_records_review_status_chk CHECK (
    review_status IN ('not_submitted', 'pending_human_review', 'under_review', 'verified', 'rejected', 'correction_requested', 'superseded')
  )
);

CREATE TABLE IF NOT EXISTS crewportglobal.seafarer_sea_service_records (
  seafarer_sea_service_record_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seafarer_profile_id UUID NOT NULL REFERENCES crewportglobal.seafarer_profiles(seafarer_profile_id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES crewportglobal.users(user_id) ON DELETE CASCADE,
  source_draft_id UUID,
  vessel_name TEXT,
  vessel_type_value_id UUID REFERENCES crewportglobal.reference_catalog_values(reference_value_id) ON DELETE SET NULL,
  vessel_type_label TEXT,
  rank_value_id UUID REFERENCES crewportglobal.reference_catalog_values(reference_value_id) ON DELETE SET NULL,
  rank_label TEXT,
  department TEXT,
  flag_country_value_id UUID REFERENCES crewportglobal.reference_catalog_values(reference_value_id) ON DELETE SET NULL,
  flag_country_code CHAR(2),
  service_from DATE,
  service_to DATE,
  management_company TEXT,
  engine_type TEXT,
  deadweight TEXT,
  document_id UUID REFERENCES crewportglobal.uploaded_documents(document_id) ON DELETE SET NULL,
  record_state TEXT NOT NULL DEFAULT 'draft',
  review_status TEXT NOT NULL DEFAULT 'not_submitted',
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT seafarer_sea_service_department_chk CHECK (
    department IS NULL OR department IN ('deck', 'engine', 'catering', 'other')
  ),
  CONSTRAINT seafarer_sea_service_flag_country_chk CHECK (
    flag_country_code IS NULL OR flag_country_code ~ '^[A-Z]{2}$'
  ),
  CONSTRAINT seafarer_sea_service_dates_chk CHECK (
    service_from IS NULL OR service_to IS NULL OR service_from <= service_to
  ),
  CONSTRAINT seafarer_sea_service_record_state_chk CHECK (
    record_state IN ('draft', 'submitted', 'active', 'archived', 'superseded')
  ),
  CONSTRAINT seafarer_sea_service_review_status_chk CHECK (
    review_status IN ('not_submitted', 'pending_human_review', 'under_review', 'verified', 'rejected', 'correction_requested', 'superseded')
  )
);

CREATE TABLE IF NOT EXISTS crewportglobal.seafarer_medical_declarations (
  seafarer_medical_declaration_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seafarer_profile_id UUID NOT NULL REFERENCES crewportglobal.seafarer_profiles(seafarer_profile_id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES crewportglobal.users(user_id) ON DELETE CASCADE,
  source_draft_id UUID,
  declaration_scope TEXT NOT NULL DEFAULT 'platform_readiness',
  medical_certificate_expires_at DATE,
  fitness_status TEXT NOT NULL DEFAULT 'not_declared',
  consent_status TEXT NOT NULL DEFAULT 'not_declared',
  sensitive_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  document_id UUID REFERENCES crewportglobal.uploaded_documents(document_id) ON DELETE SET NULL,
  record_state TEXT NOT NULL DEFAULT 'draft',
  review_status TEXT NOT NULL DEFAULT 'not_submitted',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT seafarer_medical_declarations_scope_chk CHECK (
    declaration_scope IN ('platform_readiness', 'employer_specific', 'medical_provider')
  ),
  CONSTRAINT seafarer_medical_declarations_fitness_chk CHECK (
    fitness_status IN ('not_declared', 'fit', 'fit_with_restrictions', 'not_fit', 'requires_review')
  ),
  CONSTRAINT seafarer_medical_declarations_consent_chk CHECK (
    consent_status IN ('not_declared', 'granted', 'declined', 'withdrawn')
  ),
  CONSTRAINT seafarer_medical_declarations_record_state_chk CHECK (
    record_state IN ('draft', 'submitted', 'active', 'archived', 'superseded')
  ),
  CONSTRAINT seafarer_medical_declarations_review_status_chk CHECK (
    review_status IN ('not_submitted', 'pending_human_review', 'under_review', 'verified', 'rejected', 'correction_requested', 'superseded')
  )
);

CREATE TABLE IF NOT EXISTS crewportglobal.seafarer_matching_preferences (
  seafarer_matching_preference_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seafarer_profile_id UUID NOT NULL UNIQUE REFERENCES crewportglobal.seafarer_profiles(seafarer_profile_id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES crewportglobal.users(user_id) ON DELETE CASCADE,
  source_draft_id UUID,
  preferred_vessel_type_values JSONB NOT NULL DEFAULT '[]'::jsonb,
  preferred_vessel_type_labels TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  accepted_contract_duration TEXT,
  expected_compensation_usd NUMERIC(12, 2),
  availability_date DATE,
  availability_status TEXT NOT NULL DEFAULT 'unknown',
  route_region_preferences TEXT,
  restrictions_note TEXT,
  candidate_summary TEXT,
  information_source_value_id UUID REFERENCES crewportglobal.reference_catalog_values(reference_value_id) ON DELETE SET NULL,
  information_source_label TEXT,
  publish_to_matching TEXT NOT NULL DEFAULT 'unknown',
  data_processing_confirmation TEXT NOT NULL DEFAULT 'not_confirmed',
  record_state TEXT NOT NULL DEFAULT 'draft',
  review_status TEXT NOT NULL DEFAULT 'not_submitted',
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT seafarer_matching_preferences_vessel_values_chk CHECK (
    jsonb_typeof(preferred_vessel_type_values) = 'array'
  ),
  CONSTRAINT seafarer_matching_preferences_compensation_chk CHECK (
    expected_compensation_usd IS NULL OR expected_compensation_usd >= 0
  ),
  CONSTRAINT seafarer_matching_preferences_availability_chk CHECK (
    availability_status IN ('unknown', 'available_now', 'available_later')
  ),
  CONSTRAINT seafarer_matching_preferences_publish_chk CHECK (
    publish_to_matching IN ('unknown', 'yes', 'no')
  ),
  CONSTRAINT seafarer_matching_preferences_confirmation_chk CHECK (
    data_processing_confirmation IN ('not_confirmed', 'i_confirm', 'i_decline')
  ),
  CONSTRAINT seafarer_matching_preferences_record_state_chk CHECK (
    record_state IN ('draft', 'submitted', 'active', 'archived', 'superseded')
  ),
  CONSTRAINT seafarer_matching_preferences_review_status_chk CHECK (
    review_status IN ('not_submitted', 'pending_human_review', 'under_review', 'verified', 'rejected', 'correction_requested', 'superseded')
  )
);

CREATE TABLE IF NOT EXISTS crewportglobal.seafarer_publication_snapshots (
  seafarer_publication_snapshot_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seafarer_profile_id UUID NOT NULL REFERENCES crewportglobal.seafarer_profiles(seafarer_profile_id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES crewportglobal.users(user_id) ON DELETE CASCADE,
  source_draft_id UUID,
  publication_state TEXT NOT NULL DEFAULT 'draft',
  snapshot_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  prepared_by_user_id UUID REFERENCES crewportglobal.users(user_id) ON DELETE SET NULL,
  reviewed_by_user_id UUID REFERENCES crewportglobal.users(user_id) ON DELETE SET NULL,
  published_at TIMESTAMPTZ,
  retired_at TIMESTAMPTZ,
  review_note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT seafarer_publication_snapshots_payload_chk CHECK (
    jsonb_typeof(snapshot_payload) = 'object'
  ),
  CONSTRAINT seafarer_publication_snapshots_state_chk CHECK (
    publication_state IN ('draft', 'pending_human_review', 'approved_for_matching', 'published_limited', 'retired', 'rejected')
  )
);

CREATE INDEX IF NOT EXISTS seafarer_person_details_user_idx
  ON crewportglobal.seafarer_person_details (user_id);

CREATE INDEX IF NOT EXISTS seafarer_emergency_contacts_profile_idx
  ON crewportglobal.seafarer_emergency_contacts (seafarer_profile_id, is_primary DESC);

CREATE UNIQUE INDEX IF NOT EXISTS seafarer_emergency_contacts_primary_uidx
  ON crewportglobal.seafarer_emergency_contacts (seafarer_profile_id)
  WHERE is_primary;

CREATE INDEX IF NOT EXISTS seafarer_education_records_profile_idx
  ON crewportglobal.seafarer_education_records (seafarer_profile_id, completion_date DESC);

CREATE INDEX IF NOT EXISTS seafarer_certificates_profile_group_idx
  ON crewportglobal.seafarer_certificates (seafarer_profile_id, certificate_group, expires_at);

CREATE INDEX IF NOT EXISTS seafarer_training_records_profile_idx
  ON crewportglobal.seafarer_training_records (seafarer_profile_id, expires_at);

CREATE INDEX IF NOT EXISTS seafarer_sea_service_records_profile_dates_idx
  ON crewportglobal.seafarer_sea_service_records (seafarer_profile_id, service_to DESC, service_from DESC);

CREATE INDEX IF NOT EXISTS seafarer_medical_declarations_profile_idx
  ON crewportglobal.seafarer_medical_declarations (seafarer_profile_id, medical_certificate_expires_at);

CREATE INDEX IF NOT EXISTS seafarer_matching_preferences_user_idx
  ON crewportglobal.seafarer_matching_preferences (user_id);

CREATE INDEX IF NOT EXISTS seafarer_publication_snapshots_profile_state_idx
  ON crewportglobal.seafarer_publication_snapshots (seafarer_profile_id, publication_state, created_at DESC);

DROP TRIGGER IF EXISTS seafarer_person_details_set_updated_at ON crewportglobal.seafarer_person_details;
CREATE TRIGGER seafarer_person_details_set_updated_at
BEFORE UPDATE ON crewportglobal.seafarer_person_details
FOR EACH ROW
EXECUTE FUNCTION crewportglobal.set_updated_at();

DROP TRIGGER IF EXISTS seafarer_emergency_contacts_set_updated_at ON crewportglobal.seafarer_emergency_contacts;
CREATE TRIGGER seafarer_emergency_contacts_set_updated_at
BEFORE UPDATE ON crewportglobal.seafarer_emergency_contacts
FOR EACH ROW
EXECUTE FUNCTION crewportglobal.set_updated_at();

DROP TRIGGER IF EXISTS seafarer_education_records_set_updated_at ON crewportglobal.seafarer_education_records;
CREATE TRIGGER seafarer_education_records_set_updated_at
BEFORE UPDATE ON crewportglobal.seafarer_education_records
FOR EACH ROW
EXECUTE FUNCTION crewportglobal.set_updated_at();

DROP TRIGGER IF EXISTS seafarer_certificates_set_updated_at ON crewportglobal.seafarer_certificates;
CREATE TRIGGER seafarer_certificates_set_updated_at
BEFORE UPDATE ON crewportglobal.seafarer_certificates
FOR EACH ROW
EXECUTE FUNCTION crewportglobal.set_updated_at();

DROP TRIGGER IF EXISTS seafarer_training_records_set_updated_at ON crewportglobal.seafarer_training_records;
CREATE TRIGGER seafarer_training_records_set_updated_at
BEFORE UPDATE ON crewportglobal.seafarer_training_records
FOR EACH ROW
EXECUTE FUNCTION crewportglobal.set_updated_at();

DROP TRIGGER IF EXISTS seafarer_sea_service_records_set_updated_at ON crewportglobal.seafarer_sea_service_records;
CREATE TRIGGER seafarer_sea_service_records_set_updated_at
BEFORE UPDATE ON crewportglobal.seafarer_sea_service_records
FOR EACH ROW
EXECUTE FUNCTION crewportglobal.set_updated_at();

DROP TRIGGER IF EXISTS seafarer_medical_declarations_set_updated_at ON crewportglobal.seafarer_medical_declarations;
CREATE TRIGGER seafarer_medical_declarations_set_updated_at
BEFORE UPDATE ON crewportglobal.seafarer_medical_declarations
FOR EACH ROW
EXECUTE FUNCTION crewportglobal.set_updated_at();

DROP TRIGGER IF EXISTS seafarer_matching_preferences_set_updated_at ON crewportglobal.seafarer_matching_preferences;
CREATE TRIGGER seafarer_matching_preferences_set_updated_at
BEFORE UPDATE ON crewportglobal.seafarer_matching_preferences
FOR EACH ROW
EXECUTE FUNCTION crewportglobal.set_updated_at();

DROP TRIGGER IF EXISTS seafarer_publication_snapshots_set_updated_at ON crewportglobal.seafarer_publication_snapshots;
CREATE TRIGGER seafarer_publication_snapshots_set_updated_at
BEFORE UPDATE ON crewportglobal.seafarer_publication_snapshots
FOR EACH ROW
EXECUTE FUNCTION crewportglobal.set_updated_at();

COMMIT;
