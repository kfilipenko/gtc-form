# CrewPortGlobal - CPG-USER-015 Implementation Report

- Project: CrewPortGlobal
- Task ID: CPG-USER-015
- Task title: Show draft review status and correction reason on Create Profile
- Document owner: GTC INFORMATION TECHNOLOGY FZ-LLC
- Version: 1.0
- Status: Implemented and verified
- Classification: Internal
- Effective date: 2026-05-13

## 1. Scope completed

Implemented candidate-facing review state visibility on Create Profile using existing draft API response.

Included:

1. Show current review_status for existing seafarer draft.
2. Show user-friendly status label mapping:
   - submitted_for_human_review -> Submitted for review
   - in_review -> Under review
   - rejected -> Needs correction
   - approved -> Reviewed
3. Show latest correction note only when:
   - current status is rejected
   - latest operator decision context indicates needs_correction or rejected
   - review_note exists
4. Keep existing draft_id prefill and local fallback behavior.

## 2. Backend/API usage

No new endpoint introduced.

Used existing response from:

- GET /api/v1/registration/drafts/:draft_id

Used fields only from payload:

- seafarer_profile.review_status
- operator_review.review_note
- operator_review.decision
- operator_review.new_status

No full operator history is exposed to candidate UI in this task.
No raw audit table structure is shown in candidate-facing blocks.

## 3. Frontend implementation

Updated:

- projects/crewportglobal/public/create-profile/index.html

Added user-facing status block near form status area:

1. Current review status line with EN/RU labels.
2. Conditional correction reason line:
   - "Correction requested: <note>" (EN)
   - "Требуется исправление: <note>" (RU)

Behavior:

1. Works for /create-profile/?draft_id=<uuid> loaded from backend draft response.
2. Preserves existing local prefill fallback path.
3. Does not render correction note unless status is rejected and latest note is applicable.

## 4. Test coverage

Updated UI suite:

- tests/crewportglobal-create-profile-prefill.spec.ts

Added scenario:

1. create seafarer draft
2. operator sets needs_correction with note
3. open /create-profile/?draft_id=<id>
4. assert status shows Needs correction
5. assert correction note is visible
6. assert profile fields remain prefilled

## 5. Validation

Required commands executed:

1. npx playwright test -c playwright.crewportglobal.config.ts tests/crewportglobal-create-profile-prefill.spec.ts
   - Result: passed (3 tests)
2. npm run test:cpg-api
   - Result: passed (8 tests)

## 6. Boundaries confirmation

Not implemented in this step:

- email notifications
- login/session implementation
- full operator history exposure to candidate
- marketplace publication
- matching
- employment workflow
- Stripe/nginx/OpenClaw/deployment changes

## 7. Expected result confirmation

Seafarer can return to Create Profile and see whether draft is under review or needs correction, with latest correction reason shown only when applicable.
