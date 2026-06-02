# CPG-BIZ-085 - Translation Correction Workflow Report

- Project: CrewPortGlobal.com
- Company: GTC INFORMATION TECHNOLOGY FZ-LLC
- Stage: Stage 1 - Digital Maritime Crew Data and Matching Platform
- Document type: Implementation report
- Source task: continuation after CPG-BIZ-084
- Version: 1.0
- Date: 2026-06-02
- Status: Implemented and verified

## 1. Purpose

This report records the controlled correction workflow for sensitive machine-localized text.

CPG-BIZ-084 allowed a reviewer to approve or reject sensitive machine translations. This slice adds the missing practical step: a reviewer can now enter corrected localized text in the protected workspace and save it as a current cache-backed draft that still requires final human approval.

English remains the official authoritative language. Machine localization remains a convenience layer. Corrected localized text is not automatically published.

## 2. Implementation Scope

Changed protected page:

```text
/team/translations/
```

Changed protected endpoint:

```text
PATCH /api/v1/team/translations/review
```

The endpoint now accepts:

```json
{
  "translation_key": "legal.noFees.summary",
  "target_language": "ru",
  "provider": "google_translate_public",
  "decision": "correct",
  "corrected_text": "corrected localized text",
  "review_note": "optional internal note"
}
```

## 3. Workflow Behavior

The protected reviewer workflow is:

1. reviewer opens a sensitive translation entry;
2. reviewer compares the official English source with the localized draft;
3. reviewer edits the localized text in the correction field;
4. reviewer saves the correction;
5. the cache entry becomes `corrected_pending_review`;
6. `human_review_required` remains `true`;
7. another reviewer decision can approve or reject the corrected entry.

The correction action does not mark the entry publish-ready.

## 4. Cache Mutation Boundary

The correction endpoint updates only the matching current entry in:

```text
projects/crewportglobal/i18n/translation-cache.json
```

`correct` records:

```text
translated_text = corrected_text
translation_status = corrected_pending_review
human_review_required = true
corrected_by_user_id
corrected_at
updated_at
previous_machine_text
review_events[]
```

`approve` and `reject` now also append a compact `review_events[]` entry so the protected cache keeps recent reviewer decisions and correction history.

Only entries whose `source_text_hash` still matches the canonical English `en.json` source are eligible.

## 5. Access Boundary

The correction workflow uses the same internal permission boundary as CPG-BIZ-084:

```text
start_human_review
approve_access_policy_change
```

The browser page does not call Google or any external translation provider.

## 6. Files Changed

| File | Change |
|---|---|
| `projects/crewportglobal/app/backend/api/public/index.php` | Added `decision=correct`, corrected text validation, correction metadata and review event history. |
| `projects/crewportglobal/public/team/translations/index.html` | Added editable corrected localized text field and `Save correction` action. |
| `tests/crewportglobal-translation-review-ui.spec.ts` | Updated UI regression to confirm protected correction payload. |
| `docs/crewportglobal/00_documentation_register.md` | Added document 280 to the register. |
| `docs/crewportglobal/60_translation_pipeline_rule.md` | Added correction workflow rule. |
| `docs/crewportglobal/61_translation_pipeline_implementation_report.md` | Recorded the correction workflow in the implementation report. |
| `projects/crewportglobal/README.md` | Updated operational translation workflow note. |
| `projects/crewportglobal/i18n/README.md` | Updated cache-review workflow note. |

## 7. Verification

### 7.1 Backend Syntax

```bash
php -l projects/crewportglobal/app/backend/api/public/index.php
```

Result: passed.

### 7.2 Embedded Frontend Syntax

```bash
node - <<'NODE'
const fs = require('fs');
const html = fs.readFileSync('projects/crewportglobal/public/team/translations/index.html', 'utf8');
const scripts = Array.from(html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)).map((match) => match[1]).filter((script) => script.trim());
scripts.forEach((script) => new Function(script));
console.log(`checked ${scripts.length} inline script(s)`);
NODE
```

Result: checked 1 inline script.

### 7.3 Focused UI Check

```bash
npx playwright test -c playwright.crewportglobal.config.ts tests/crewportglobal-translation-review-ui.spec.ts
```

Result: 1 passed.

The UI check confirms:

1. the protected translation review page loads;
2. source English text remains visible;
3. localized text is editable as a correction draft;
4. `Save correction` sends `decision = correct`;
5. `corrected_text` is sent in the protected payload.

### 7.4 Focused API Check

```bash
npx playwright test -c playwright.crewportglobal.config.ts tests/crewportglobal-translation-review-api.spec.ts
```

Result: 1 passed.

The API check is read-only and confirms the protected review queue endpoint still returns current cache-backed entries.

### 7.5 Translation Cache Regression

```bash
npm run check:cpg-i18n-cache
```

Result: 26 passed.

### 7.6 Publication Guard

```bash
npm run check:cpg-i18n-publication-guard
```

Result: findings 0.

## 8. Next Stage

After verification, the next stage should add reviewer-side listing for recently corrected entries and a publish-readiness drill confirming that `corrected_pending_review` entries remain excluded until final approval.
