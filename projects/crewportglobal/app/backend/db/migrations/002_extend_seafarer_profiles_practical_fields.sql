ALTER TABLE crewportglobal.seafarer_profiles
  ADD COLUMN IF NOT EXISTS department TEXT,
  ADD COLUMN IF NOT EXISTS nationality_code CHAR(2),
  ADD COLUMN IF NOT EXISTS residence_country_code CHAR(2),
  ADD COLUMN IF NOT EXISTS availability_date DATE,
  ADD COLUMN IF NOT EXISTS preferred_vessel_types JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS salary_expectation_usd NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS contact_phone TEXT;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'seafarer_profiles_nationality_code_chk'
      AND connamespace = 'crewportglobal'::regnamespace
  ) THEN
    ALTER TABLE crewportglobal.seafarer_profiles
      ADD CONSTRAINT seafarer_profiles_nationality_code_chk CHECK (
        nationality_code IS NULL OR nationality_code ~ '^[A-Z]{2}$'
      );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'seafarer_profiles_residence_country_code_chk'
      AND connamespace = 'crewportglobal'::regnamespace
  ) THEN
    ALTER TABLE crewportglobal.seafarer_profiles
      ADD CONSTRAINT seafarer_profiles_residence_country_code_chk CHECK (
        residence_country_code IS NULL OR residence_country_code ~ '^[A-Z]{2}$'
      );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'seafarer_profiles_preferred_vessel_types_json_chk'
      AND connamespace = 'crewportglobal'::regnamespace
  ) THEN
    ALTER TABLE crewportglobal.seafarer_profiles
      ADD CONSTRAINT seafarer_profiles_preferred_vessel_types_json_chk CHECK (
        jsonb_typeof(preferred_vessel_types) = 'array'
      );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'seafarer_profiles_salary_expectation_usd_chk'
      AND connamespace = 'crewportglobal'::regnamespace
  ) THEN
    ALTER TABLE crewportglobal.seafarer_profiles
      ADD CONSTRAINT seafarer_profiles_salary_expectation_usd_chk CHECK (
        salary_expectation_usd IS NULL OR salary_expectation_usd >= 0
      );
  END IF;
END $$;
