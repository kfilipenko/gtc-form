-- ProjectOwner: CrewPortGlobal
-- PackageFile: 001_crewport_preconditions.sql
-- PackageRole: planning_only_preconditions
-- ExecutionPolicy: do_not_execute_without_explicit_manual_approval
-- Notes:
--   1. This package is planning-only and must not be applied automatically.
--   2. Do not apply on production DB.
--   3. Do not apply on test DB.
--   4. Do not change global auth schema from this workstream.
--   5. Do not change current Stripe workflow from this workstream.
--   6. The v2 draft migration in db/migrations remains the reference artifact.
--   7. pgcrypto is an ops-approved prerequisite and must not be enabled silently from this package.

-- Manual approval gate before any future execution discussion:
--   - architecture review approved;
--   - manual execution scope approved;
--   - target environment approved by ops;
--   - rollback and ownership confirmed;
--   - GTC1 explicitly excluded until a separate approval step exists.

-- Required preconditions for any future test-review execution:
--   - schema owner and DB owner confirmed;
--   - pgcrypto already enabled by a DB owner;
--   - isolated non-production target confirmed;
--   - package review completed for 002/003/004/005;
--   - execution operator understands that this package must not touch shared auth objects.

-- Example read-only checks for a future approved review session:
-- SELECT current_database() AS database_name, current_user AS executing_user;
-- SELECT extname FROM pg_extension WHERE extname = 'pgcrypto';
-- SELECT nspname FROM pg_namespace WHERE nspname = 'crewport';

-- No executable SQL is included in this file by design.