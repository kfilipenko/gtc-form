-- CPG-EMP-008
-- Employer shortlist actions for operator-presented vacancy applications.
-- Idempotent migration: safe to re-run.

BEGIN;

ALTER TABLE crewportglobal.vacancy_applications
  ADD COLUMN IF NOT EXISTS employer_shortlist_status TEXT NOT NULL DEFAULT 'presented',
  ADD COLUMN IF NOT EXISTS employer_action_note TEXT,
  ADD COLUMN IF NOT EXISTS employer_action_at TIMESTAMPTZ;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'vacancy_applications_employer_shortlist_status_chk'
      AND conrelid = 'crewportglobal.vacancy_applications'::regclass
  ) THEN
    ALTER TABLE crewportglobal.vacancy_applications
      ADD CONSTRAINT vacancy_applications_employer_shortlist_status_chk CHECK (
        employer_shortlist_status IN (
          'presented',
          'contacted',
          'interview_requested',
          'not_suitable'
        )
      );
  END IF;
END
$$;

CREATE INDEX IF NOT EXISTS vacancy_applications_employer_shortlist_status_idx
  ON crewportglobal.vacancy_applications (employer_shortlist_status);

COMMIT;
