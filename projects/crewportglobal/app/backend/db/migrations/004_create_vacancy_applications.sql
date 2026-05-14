-- CPG-MKT-003
-- Vacancy applications for reviewed public marketplace records.
-- Idempotent migration: safe to re-run.

BEGIN;

CREATE TABLE IF NOT EXISTS crewportglobal.vacancy_applications (
  vacancy_application_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vacancy_request_id UUID NOT NULL REFERENCES crewportglobal.vacancy_requests(vacancy_request_id) ON DELETE CASCADE,
  seafarer_user_id UUID NOT NULL REFERENCES crewportglobal.users(user_id) ON DELETE CASCADE,
  contact_email TEXT NOT NULL,
  candidate_note TEXT,
  application_status TEXT NOT NULL DEFAULT 'submitted_for_human_review',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT vacancy_applications_contact_email_chk CHECK (
    position('@' in contact_email) > 1
  ),
  CONSTRAINT vacancy_applications_status_chk CHECK (
    application_status IN (
      'submitted_for_human_review',
      'in_review',
      'presented',
      'rejected',
      'withdrawn'
    )
  )
);

CREATE UNIQUE INDEX IF NOT EXISTS vacancy_applications_vacancy_seafarer_uidx
  ON crewportglobal.vacancy_applications (vacancy_request_id, seafarer_user_id);

CREATE INDEX IF NOT EXISTS vacancy_applications_vacancy_idx
  ON crewportglobal.vacancy_applications (vacancy_request_id);

CREATE INDEX IF NOT EXISTS vacancy_applications_seafarer_idx
  ON crewportglobal.vacancy_applications (seafarer_user_id);

CREATE INDEX IF NOT EXISTS vacancy_applications_status_idx
  ON crewportglobal.vacancy_applications (application_status);

DROP TRIGGER IF EXISTS vacancy_applications_set_updated_at ON crewportglobal.vacancy_applications;
CREATE TRIGGER vacancy_applications_set_updated_at
BEFORE UPDATE ON crewportglobal.vacancy_applications
FOR EACH ROW
EXECUTE FUNCTION crewportglobal.set_updated_at();

COMMIT;
