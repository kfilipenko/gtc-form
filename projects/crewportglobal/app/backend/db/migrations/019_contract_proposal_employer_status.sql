-- CPG-BIZ-100
-- Employer-side proceed-with-candidate status for guarded contract proposal.
--
-- Additive/idempotent migration. No data backfill.

BEGIN;

ALTER TABLE crewportglobal.vacancy_applications
  DROP CONSTRAINT IF EXISTS vacancy_applications_employer_shortlist_status_chk;

ALTER TABLE crewportglobal.vacancy_applications
  ADD CONSTRAINT vacancy_applications_employer_shortlist_status_chk CHECK (
    employer_shortlist_status IN (
      'presented',
      'contacted',
      'interview_requested',
      'proceed_with_candidate',
      'not_suitable'
    )
  );

COMMIT;
