# CrewPortGlobal — Translation Pipeline Implementation Report

- Project: CrewPortGlobal.com
- Company: GTC INFORMATION TECHNOLOGY FZ-LLC
- Stage: Stage 1
- Document type: Implementation report
- Status: Completed report for current public translation methodology slice
- Related methodology: docs/crewportglobal/60_translation_pipeline_rule.md

## 1. Purpose

This report records the currently implemented translation methodology for the public CrewPortGlobal website surface and the validation results that support it.

This report is an operational companion to the canonical methodology rule in document 60.

## 2. Current methodology summary

The current website text-translation methodology is:

1. English is the canonical source language.
2. Shared public UI runtime is implemented in projects/crewportglobal/public/assets/crewportglobal-public-i18n.js.
3. Homepage-specific strings remain page-local in projects/crewportglobal/public/index.html through window.CREWPORTGLOBAL_PAGE_TRANSLATIONS.
4. Generated public pages are rebuilt from canonical Markdown through projects/crewportglobal/scripts/generate_public_pages.py and projects/crewportglobal/scripts/run_public_generator.sh.
5. Missing non-English UI translations fall back to English.
6. Legal, consent, no-fee and seafarer-facing text may use machine translation only as draft input and require human review before publication.

## 3. Implemented controls

The following controls are now in place:

1. Shared language selector and runtime behavior across homepage and generated public pages.
2. Reproducible rebuild wrapper for generated public pages.
3. Public i18n coverage validator: node projects/crewportglobal/scripts/check_public_i18n.js.
4. Focused browser regression for homepage, generated pages and fallback behavior.

## 4. Validation results

The current methodology was validated with the following checks:

1. ./projects/crewportglobal/scripts/run_public_generator.sh
2. node projects/crewportglobal/scripts/check_public_i18n.js
3. npx playwright test tests/crewportglobal-homepage-language.spec.ts --config=playwright.crewportglobal.config.ts
4. live browser smoke checks against https://crewportglobal.com/

Observed current-state result:

1. English canonical coverage is complete for referenced i18n keys.
2. Non-English gaps fall back to English instead of exposing raw key names.
3. Homepage and generated public pages share one runtime path.
4. Live homepage keeps selector state in crewportglobal.language.
5. Representative generated legal pages continue to translate through the shared runtime path.

## 5. Publication and review boundary

The current methodology does not authorize uncontrolled publication of sensitive translated text.

Human review remains required before publication for:

1. projects/crewportglobal/public/legal/**/*.md
2. projects/crewportglobal/public/for-seafarers/index.md
3. projects/crewportglobal/public/onboarding/seafarer-registration/index.html

## 6. Maintenance rule

If the translation methodology changes, update in the same slice:

1. docs/crewportglobal/60_translation_pipeline_rule.md
2. this report
3. projects/crewportglobal/README.md
4. docs/crewportglobal/00_documentation_register.md

If validation changes, update the affected validator and regression checks in the same slice.

## 7. Out-of-scope confirmation

This methodology slice did not require changes to:

1. backend
2. database
3. secrets
4. auth
5. OpenClaw configuration

## 8. Revision history

| Version | Date | Author | Changes |
| --- | --- | --- | --- |
| 0.1 | 2026-05-12 | GTC IT / AI Assistant | Initial implementation report for the current public translation methodology, validation flow and maintenance rule |