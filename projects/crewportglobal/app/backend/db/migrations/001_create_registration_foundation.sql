-- CPG-BE-001
-- Registration database foundation for CrewPortGlobal.
-- Idempotent migration: safe to re-run.

BEGIN;

CREATE SCHEMA IF NOT EXISTS crewportglobal;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE OR REPLACE FUNCTION crewportglobal.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TABLE IF NOT EXISTS crewportglobal.users (
  user_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  display_name TEXT,
  email_verified_at TIMESTAMPTZ,
  registration_status TEXT NOT NULL DEFAULT 'draft',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT users_email_format_chk CHECK (position('@' in email) > 1),
  CONSTRAINT users_registration_status_chk CHECK (
    registration_status IN (
      'draft',
      'submitted_for_human_review',
      'approved',
      'rejected'
    )
  )
);

CREATE UNIQUE INDEX IF NOT EXISTS users_email_uidx
  ON crewportglobal.users (lower(email));

CREATE TABLE IF NOT EXISTS crewportglobal.user_auth_identities (
  auth_identity_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES crewportglobal.users(user_id) ON DELETE CASCADE,
  provider TEXT NOT NULL,
  provider_subject TEXT NOT NULL,
  is_primary BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT user_auth_identities_provider_chk CHECK (
    provider IN ('email', 'google', 'apple', 'telegram')
  )
);

CREATE UNIQUE INDEX IF NOT EXISTS user_auth_identities_provider_subject_uidx
  ON crewportglobal.user_auth_identities (provider, provider_subject);

CREATE UNIQUE INDEX IF NOT EXISTS user_auth_identities_user_provider_uidx
  ON crewportglobal.user_auth_identities (user_id, provider);

CREATE UNIQUE INDEX IF NOT EXISTS user_auth_identities_user_primary_uidx
  ON crewportglobal.user_auth_identities (user_id)
  WHERE is_primary;

CREATE TABLE IF NOT EXISTS crewportglobal.user_roles (
  user_role_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES crewportglobal.users(user_id) ON DELETE CASCADE,
  role TEXT NOT NULL,
  source TEXT NOT NULL DEFAULT 'self_registration',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT user_roles_role_chk CHECK (
    role IN ('seafarer', 'employer', 'shipowner', 'crewing_manager')
  )
);

CREATE UNIQUE INDEX IF NOT EXISTS user_roles_user_role_uidx
  ON crewportglobal.user_roles (user_id, role);

CREATE INDEX IF NOT EXISTS user_roles_role_idx
  ON crewportglobal.user_roles (role);

CREATE TABLE IF NOT EXISTS crewportglobal.seafarer_profiles (
  seafarer_profile_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES crewportglobal.users(user_id) ON DELETE CASCADE,
  first_name TEXT,
  last_name TEXT,
  primary_rank TEXT,
  availability_status TEXT NOT NULL DEFAULT 'unknown',
  country_code CHAR(2),
  contact_email TEXT,
  document_metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  review_status TEXT NOT NULL DEFAULT 'submitted_for_human_review',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT seafarer_profiles_availability_status_chk CHECK (
    availability_status IN ('unknown', 'available_now', 'available_later')
  ),
  CONSTRAINT seafarer_profiles_review_status_chk CHECK (
    review_status IN ('submitted_for_human_review', 'in_review', 'approved', 'rejected')
  ),
  CONSTRAINT seafarer_profiles_country_code_chk CHECK (
    country_code IS NULL OR country_code ~ '^[A-Z]{2}$'
  ),
  CONSTRAINT seafarer_profiles_contact_email_chk CHECK (
    contact_email IS NULL OR position('@' in contact_email) > 1
  )
);

CREATE TABLE IF NOT EXISTS crewportglobal.employer_companies (
  company_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name TEXT NOT NULL,
  registration_number TEXT,
  country_code CHAR(2),
  company_type TEXT NOT NULL DEFAULT 'employer',
  verification_status TEXT NOT NULL DEFAULT 'unverified',
  created_by_user_id UUID REFERENCES crewportglobal.users(user_id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT employer_companies_company_type_chk CHECK (
    company_type IN ('employer', 'shipowner', 'crewing_manager', 'mixed')
  ),
  CONSTRAINT employer_companies_verification_status_chk CHECK (
    verification_status IN ('unverified', 'submitted', 'verified', 'rejected')
  ),
  CONSTRAINT employer_companies_country_code_chk CHECK (
    country_code IS NULL OR country_code ~ '^[A-Z]{2}$'
  )
);

CREATE UNIQUE INDEX IF NOT EXISTS employer_companies_registration_uidx
  ON crewportglobal.employer_companies (registration_number, country_code)
  WHERE registration_number IS NOT NULL;

CREATE INDEX IF NOT EXISTS employer_companies_name_idx
  ON crewportglobal.employer_companies (company_name);

CREATE TABLE IF NOT EXISTS crewportglobal.company_users (
  company_user_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES crewportglobal.employer_companies(company_id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES crewportglobal.users(user_id) ON DELETE CASCADE,
  role_in_company TEXT NOT NULL DEFAULT 'manager',
  is_primary_contact BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT company_users_role_in_company_chk CHECK (
    role_in_company IN ('owner', 'manager', 'recruiter', 'viewer')
  )
);

CREATE UNIQUE INDEX IF NOT EXISTS company_users_company_user_uidx
  ON crewportglobal.company_users (company_id, user_id);

CREATE INDEX IF NOT EXISTS company_users_user_idx
  ON crewportglobal.company_users (user_id);

CREATE UNIQUE INDEX IF NOT EXISTS company_users_primary_contact_uidx
  ON crewportglobal.company_users (company_id)
  WHERE is_primary_contact;

CREATE TABLE IF NOT EXISTS crewportglobal.vessels (
  vessel_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES crewportglobal.employer_companies(company_id) ON DELETE SET NULL,
  imo_number TEXT,
  vessel_name TEXT NOT NULL,
  vessel_type TEXT,
  flag_country_code CHAR(2),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT vessels_flag_country_code_chk CHECK (
    flag_country_code IS NULL OR flag_country_code ~ '^[A-Z]{2}$'
  ),
  CONSTRAINT vessels_imo_format_chk CHECK (
    imo_number IS NULL OR imo_number ~ '^[0-9]{7}$'
  )
);

CREATE UNIQUE INDEX IF NOT EXISTS vessels_imo_uidx
  ON crewportglobal.vessels (imo_number)
  WHERE imo_number IS NOT NULL;

CREATE INDEX IF NOT EXISTS vessels_company_idx
  ON crewportglobal.vessels (company_id);

CREATE TABLE IF NOT EXISTS crewportglobal.registration_audit_events (
  registration_audit_event_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL,
  user_id UUID REFERENCES crewportglobal.users(user_id) ON DELETE SET NULL,
  company_id UUID REFERENCES crewportglobal.employer_companies(company_id) ON DELETE SET NULL,
  vessel_id UUID REFERENCES crewportglobal.vessels(vessel_id) ON DELETE SET NULL,
  actor_user_id UUID REFERENCES crewportglobal.users(user_id) ON DELETE SET NULL,
  source TEXT NOT NULL DEFAULT 'registration',
  event_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT registration_audit_events_event_type_chk CHECK (length(trim(event_type)) > 0)
);

CREATE INDEX IF NOT EXISTS registration_audit_events_created_at_idx
  ON crewportglobal.registration_audit_events (created_at DESC);

CREATE INDEX IF NOT EXISTS registration_audit_events_event_type_idx
  ON crewportglobal.registration_audit_events (event_type);

CREATE INDEX IF NOT EXISTS registration_audit_events_user_idx
  ON crewportglobal.registration_audit_events (user_id);

CREATE INDEX IF NOT EXISTS registration_audit_events_company_idx
  ON crewportglobal.registration_audit_events (company_id);

CREATE INDEX IF NOT EXISTS registration_audit_events_vessel_idx
  ON crewportglobal.registration_audit_events (vessel_id);

DROP TRIGGER IF EXISTS users_set_updated_at ON crewportglobal.users;
CREATE TRIGGER users_set_updated_at
BEFORE UPDATE ON crewportglobal.users
FOR EACH ROW
EXECUTE FUNCTION crewportglobal.set_updated_at();

DROP TRIGGER IF EXISTS user_auth_identities_set_updated_at ON crewportglobal.user_auth_identities;
CREATE TRIGGER user_auth_identities_set_updated_at
BEFORE UPDATE ON crewportglobal.user_auth_identities
FOR EACH ROW
EXECUTE FUNCTION crewportglobal.set_updated_at();

DROP TRIGGER IF EXISTS seafarer_profiles_set_updated_at ON crewportglobal.seafarer_profiles;
CREATE TRIGGER seafarer_profiles_set_updated_at
BEFORE UPDATE ON crewportglobal.seafarer_profiles
FOR EACH ROW
EXECUTE FUNCTION crewportglobal.set_updated_at();

DROP TRIGGER IF EXISTS employer_companies_set_updated_at ON crewportglobal.employer_companies;
CREATE TRIGGER employer_companies_set_updated_at
BEFORE UPDATE ON crewportglobal.employer_companies
FOR EACH ROW
EXECUTE FUNCTION crewportglobal.set_updated_at();

DROP TRIGGER IF EXISTS vessels_set_updated_at ON crewportglobal.vessels;
CREATE TRIGGER vessels_set_updated_at
BEFORE UPDATE ON crewportglobal.vessels
FOR EACH ROW
EXECUTE FUNCTION crewportglobal.set_updated_at();

COMMIT;
