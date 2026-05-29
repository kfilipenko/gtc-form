-- CPG-BIZ-045: allow saved questionnaires to remain drafts until explicit submit gate.

ALTER TABLE crewportglobal.seafarer_profiles
  ALTER COLUMN review_status SET DEFAULT 'draft';

ALTER TABLE crewportglobal.seafarer_profiles
  DROP CONSTRAINT IF EXISTS seafarer_profiles_review_status_chk;

ALTER TABLE crewportglobal.seafarer_profiles
  ADD CONSTRAINT seafarer_profiles_review_status_chk CHECK (
    review_status IN ('draft', 'submitted_for_human_review', 'in_review', 'approved', 'rejected')
  );

ALTER TABLE crewportglobal.employer_companies
  ALTER COLUMN verification_status SET DEFAULT 'draft';

ALTER TABLE crewportglobal.employer_companies
  DROP CONSTRAINT IF EXISTS employer_companies_verification_status_chk;

ALTER TABLE crewportglobal.employer_companies
  ADD CONSTRAINT employer_companies_verification_status_chk CHECK (
    verification_status IN ('draft', 'unverified', 'submitted', 'verified', 'rejected')
  );
