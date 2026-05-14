-- CPG-MKT-002
-- Vacancy request foundation for reviewed public marketplace records.
-- Idempotent migration: safe to re-run.

BEGIN;

CREATE TABLE IF NOT EXISTS crewportglobal.vacancy_requests (
  vacancy_request_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES crewportglobal.employer_companies(company_id) ON DELETE CASCADE,
  vessel_id UUID REFERENCES crewportglobal.vessels(vessel_id) ON DELETE SET NULL,
  created_by_user_id UUID REFERENCES crewportglobal.users(user_id) ON DELETE SET NULL,
  vacancy_title TEXT,
  rank TEXT,
  department TEXT,
  vessel_type TEXT,
  join_date DATE,
  contract_duration TEXT,
  salary_min_usd NUMERIC(10,2),
  salary_max_usd NUMERIC(10,2),
  salary_text TEXT,
  currency CHAR(3) NOT NULL DEFAULT 'USD',
  employer_country_code CHAR(2),
  requirements TEXT,
  publication_status TEXT NOT NULL DEFAULT 'submitted_for_human_review',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT vacancy_requests_department_chk CHECK (
    department IS NULL OR department IN ('deck', 'engine', 'catering', 'hotel', 'other')
  ),
  CONSTRAINT vacancy_requests_salary_min_chk CHECK (
    salary_min_usd IS NULL OR salary_min_usd >= 0
  ),
  CONSTRAINT vacancy_requests_salary_max_chk CHECK (
    salary_max_usd IS NULL OR salary_max_usd >= 0
  ),
  CONSTRAINT vacancy_requests_salary_range_chk CHECK (
    salary_min_usd IS NULL OR salary_max_usd IS NULL OR salary_max_usd >= salary_min_usd
  ),
  CONSTRAINT vacancy_requests_currency_chk CHECK (
    currency ~ '^[A-Z]{3}$'
  ),
  CONSTRAINT vacancy_requests_country_code_chk CHECK (
    employer_country_code IS NULL OR employer_country_code ~ '^[A-Z]{2}$'
  ),
  CONSTRAINT vacancy_requests_publication_status_chk CHECK (
    publication_status IN (
      'draft',
      'submitted_for_human_review',
      'in_review',
      'published',
      'rejected',
      'closed'
    )
  )
);

CREATE INDEX IF NOT EXISTS vacancy_requests_company_idx
  ON crewportglobal.vacancy_requests (company_id);

CREATE INDEX IF NOT EXISTS vacancy_requests_vessel_idx
  ON crewportglobal.vacancy_requests (vessel_id);

CREATE INDEX IF NOT EXISTS vacancy_requests_created_by_user_idx
  ON crewportglobal.vacancy_requests (created_by_user_id);

CREATE INDEX IF NOT EXISTS vacancy_requests_publication_status_idx
  ON crewportglobal.vacancy_requests (publication_status);

CREATE INDEX IF NOT EXISTS vacancy_requests_join_date_idx
  ON crewportglobal.vacancy_requests (join_date);

DROP TRIGGER IF EXISTS vacancy_requests_set_updated_at ON crewportglobal.vacancy_requests;
CREATE TRIGGER vacancy_requests_set_updated_at
BEFORE UPDATE ON crewportglobal.vacancy_requests
FOR EACH ROW
EXECUTE FUNCTION crewportglobal.set_updated_at();

COMMIT;
