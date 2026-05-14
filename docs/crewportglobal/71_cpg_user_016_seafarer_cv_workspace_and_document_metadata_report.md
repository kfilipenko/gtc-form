# CrewPortGlobal — CPG-USER-016 Seafarer CV Workspace and Document Metadata Report

- Project: CrewPortGlobal.com
- Company: GTC INFORMATION TECHNOLOGY FZ-LLC
- Date: 2026-05-14
- Document type: Implementation report
- Status: Implemented, verified locally and published to live site

## 1. Purpose

This report records the next implementation slice in converting CrewPortGlobal from a documentation-heavy website into a practical maritime jobs and crew application.

The slice improves the seafarer-facing profile page from a single long form into a clearer CV workspace with profile readiness, section navigation, document-readiness metadata and review-package summary.

## 2. Implemented Scope

Implemented changes:

1. rebuilt `public/create-profile/` as a seafarer CV workspace;
2. added top-level readiness metrics for profile readiness, rank, availability and documents;
3. added a workspace sidebar with section navigation and missing-items checklist;
4. split profile editing into CV basics, document readiness and review package sections;
5. added document metadata fields for:
   - COC / endorsements status;
   - STCW / training status;
   - passport expiry;
   - medical expiry;
   - visa readiness;
   - document notes;
6. connected document metadata to the existing backend `seafarer_profiles.document_metadata` JSONB field;
7. preserved draft prefill from `draft_id` and browser-local latest draft;
8. extended API and UI tests for document metadata persistence and prefill.

No private document upload flow was introduced in this slice. The new fields store readiness metadata only.

## 3. Safety and Product Boundaries

The implementation keeps these boundaries:

1. seafarer profile data remains a draft intake workflow;
2. public presentation or employer sharing still requires controlled review;
3. document fields do not imply verification, approval, embarkation or employment;
4. CrewPortGlobal still does not charge seafarers recruitment, placement or employment-access fees;
5. reviewed public vacancies remain separate from candidate profile editing.

## 4. Changed Files

Core implementation:

- `projects/crewportglobal/public/create-profile/index.html`
- `projects/crewportglobal/app/backend/api/public/index.php`

Test coverage:

- `tests/crewportglobal-create-profile-prefill.spec.ts`
- `tests/crewportglobal-registration-api.spec.ts`

## 5. Verification

Verification performed:

```bash
php -l projects/crewportglobal/app/backend/api/public/index.php
npm run check:cpg-i18n
npm run test:cpg-api
npx playwright test -c playwright.crewportglobal.config.ts tests/crewportglobal-create-profile-prefill.spec.ts
```

Additional visual check:

- local desktop viewport: `1440x1100`;
- local mobile viewport: `390x1200`;
- result: no console errors and no horizontal overflow in the create-profile workspace.

Live publication checks:

```bash
./projects/crewportglobal/scripts/publish_live_site.sh
curl -k -fsS https://crewportglobal.com/api/v1/health
curl -k -fsS https://crewportglobal.com/create-profile/
curl -k -fsS https://crewportglobal.com/api/v1/vacancies
```

Expected live API result after publication:

- health endpoint returns `ok: true`;
- public vacancies remain empty unless real reviewed vacancies exist.

## 6. Next Recommended Work

Recommended next slice:

1. improve the operator `/verify/` detail view so seafarer profile metadata is shown in readable sections instead of primarily raw JSON;
2. add a clearer employer-side vacancy request status view after saving;
3. add basic access boundary for `/verify/` before wider operational exposure;
4. continue mobile refinement for dense application screens.
