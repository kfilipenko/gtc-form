# CPG-BIZ-084 - Translation Reviewer Workspace Report

- Project: CrewPortGlobal.com
- Company: GTC INFORMATION TECHNOLOGY FZ-LLC
- Stage: Stage 1 - Digital Maritime Crew Data and Matching Platform
- Document type: Implementation report
- Source task: continuation after CPG-BIZ-083
- Version: 1.0
- Date: 2026-06-02
- Status: Implemented and verified

## 1. Purpose

This report records the protected reviewer workspace for sensitive machine-localized text.

The goal is to let the internal team review legal, consent, no-fee, complaint and trust-related machine translations through the portal instead of relying only on command-line review scripts.

English remains the official authoritative language. Machine localization remains a convenience layer. Sensitive translated text is not publish-ready until human review is recorded.

## 2. Implementation Scope

Added internal team page:

```text
/team/translations/
```

Added protected API endpoints:

```text
GET /api/v1/team/translations/review-queue
PATCH /api/v1/team/translations/review
```

The page supports:

1. filtering by target language;
2. filtering by provider;
3. filtering by review status;
4. filtering by translation key;
5. comparing official English source text with machine-localized draft text;
6. recording `approve` or `reject` reviewer decisions;
7. retaining reviewer actor context in the translation cache entry.

## 3. Access Boundary

The workspace is internal-only.

Access is allowed through:

1. approved team session with required operational permissions; or
2. temporary operator token in protected operational/test context.

The endpoint requires one of the existing internal permissions:

```text
start_human_review
approve_access_policy_change
```

This slice does not create a new database permission table, group, role, migration or public route.

## 4. Cache Mutation Boundary

The review queue endpoint is read-only.

The review decision endpoint updates only the matching current cache entry in:

```text
projects/crewportglobal/i18n/translation-cache.json
```

`approve` records:

```text
translation_status = reviewed
human_review_required = false
reviewed_by_user_id
reviewed_at
updated_at
```

`reject` records:

```text
translation_status = rejected
human_review_required = true
reviewed_by_user_id
reviewed_at
updated_at
review_note
```

Only current entries whose `source_text_hash` matches the canonical English `en.json` source are eligible.

## 5. Files Changed

| File | Change |
|---|---|
| `projects/crewportglobal/app/backend/api/public/index.php` | Added protected translation review queue and review decision endpoints. |
| `projects/crewportglobal/public/team/translations/index.html` | Added internal reviewer workspace UI. |
| `projects/crewportglobal/public/assets/crewportglobal-navigation.js` | Added Translation Review to the protected team navigation group. |
| `projects/crewportglobal/public/assets/crewportglobal-public-i18n.js` | Added navigation label key. |
| `projects/crewportglobal/public/team/index.html` | Added quick link to translation review queue. |
| `tests/crewportglobal-navigation-menus.spec.ts` | Added Translation Review to the expected full-site menu. |
| `tests/crewportglobal-translation-review-ui.spec.ts` | Added UI regression with mocked protected API responses. |
| `docs/crewportglobal/00_documentation_register.md` | Added document 279 to the register. |
| `docs/crewportglobal/60_translation_pipeline_rule.md` | Updated methodology rule with the portal reviewer workspace. |
| `docs/crewportglobal/61_translation_pipeline_implementation_report.md` | Updated implementation report with the protected reviewer workspace. |

## 6. Verification

### 6.1 Backend Syntax

```bash
php -l projects/crewportglobal/app/backend/api/public/index.php
```

Result: passed.

### 6.2 Embedded Frontend Syntax

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

### 6.3 Focused UI Check

```bash
npx playwright test -c playwright.crewportglobal.config.ts tests/crewportglobal-translation-review-ui.spec.ts
```

Result: 1 passed.

The UI check uses mocked protected API responses and confirms:

1. the page loads the sensitive translation review queue;
2. source English text and machine-localized draft are shown side by side;
3. the `Approve` decision sends the expected protected payload;
4. the page does not mutate the real translation cache during the UI test.

### 6.4 Focused API Check

```bash
npx playwright test -c playwright.crewportglobal.config.ts tests/crewportglobal-translation-review-api.spec.ts
```

Result: 1 passed.

The API check is read-only and confirms the protected PHP endpoint reads the current cache-backed review queue.

### 6.5 Navigation Regression

```bash
npx playwright test -c playwright.crewportglobal.config.ts tests/crewportglobal-navigation-menus.spec.ts
```

Result: 8 passed.

### 6.6 Translation Cache Regression

```bash
npm run check:cpg-i18n-cache
```

Result: 26 passed.

### 6.7 Publication Guard

```bash
npm run check:cpg-i18n-publication-guard
```

Result: findings 0.

## 7. Controlled Gaps

1. The page does not translate new text itself.
2. The page does not call Google or any external provider.
3. The page does not publish runtime bundles.
4. The page does not create a separate DB audit table in this slice.
5. Rejected translations remain in cache for correction workflow planning.

## 8. Next Stage

The next stage should add a controlled correction workflow for rejected sensitive translations:

1. reviewer rejects machine draft;
2. corrected localized text is supplied by authorized reviewer or translator;
3. source hash is rechecked;
4. corrected text is marked reviewed;
5. publish-ready export includes only reviewed current sensitive entries.
