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

1. English is the official and authoritative platform language.
2. Localized UI is machine translation for user convenience, not a replacement for the English source text.
3. The default approved machine localization provider is Google Cloud Translation API / Google Translate provider through backend/build automation.
4. Operational form data must be entered in English and Latin characters where applicable and must not be automatically translated after completion.
5. Shared public UI runtime is implemented in projects/crewportglobal/public/assets/crewportglobal-public-i18n.js and auto-selects a supported browser locale on first visit when no stored preference exists.
6. Homepage-specific strings remain page-local in projects/crewportglobal/public/index.html through window.CREWPORTGLOBAL_PAGE_TRANSLATIONS.
7. Generated public pages are rebuilt from canonical Markdown through projects/crewportglobal/scripts/generate_public_pages.py and projects/crewportglobal/scripts/run_public_generator.sh.
8. Missing non-English UI translations fall back to English.
9. Browser-side code does not attempt to force the browser's built-in page translation UI from JavaScript.
10. Legal, consent, no-fee and seafarer-facing text may use machine translation only as draft input and require human review before publication.
11. An approved build-time draft translation skeleton now exists in projects/crewportglobal/i18n/ for seeded languages en, ru, pt and uk.
12. The approved backend cache design for future Google machine localization is documented in docs/crewportglobal/258_cpg_biz_063_google_machine_localization_cache_backend_design.md.
13. The first cache implementation skeleton is file-backed, uses a deterministic stub provider and is documented in docs/crewportglobal/259_cpg_biz_064_translation_cache_stub_provider_skeleton_report.md.
14. Translation cache freshness and publication-gate validation is documented in docs/crewportglobal/260_cpg_biz_065_translation_cache_publish_gate_report.md.

## 3. Implemented controls

The following controls are now in place:

1. Shared language selector and runtime behavior across homepage and generated public pages.
2. First-visit auto-selection from supported browser locales with local persistence in crewportglobal.language.
3. Reproducible rebuild wrapper for generated public pages.
4. Public i18n coverage validator: node projects/crewportglobal/scripts/check_public_i18n.js.
5. Focused browser regression for homepage, generated pages and fallback behavior.
6. Seed build-time JSON catalogs and an example automation script for draft translation generation.
7. Methodology rule requiring source-hash-based cached machine localization when automatic translation is implemented.
8. Methodology rule preventing automatic translation of completed form values and user-entered operational data.
9. Backend cache design requiring provider-aware source-hash invalidation, publication status tracking and human-review gates before sensitive localized text can be published.
10. Unit-tested stub-provider cache skeleton verifying cache miss, cache hit, stale source hash and export behavior before any Google credentials are introduced.
11. Publish-gate validator reporting stale entries, missing current entries, source-hash mismatches, orphan entries and review-required translations.

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
4. Live homepage keeps auto-detected or manually selected language state in crewportglobal.language.
5. Document root metadata is updated at runtime through html lang and dir.
6. Representative generated legal pages continue to use the shared chrome runtime without attempting to trigger browser translation UI.
7. The validator now reads build-time JSON catalogs when they are present.

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

The CPG-BIZ-063 design slice did not require changes to:

1. backend
2. database
3. secrets
4. auth
5. OpenClaw configuration

## 8. Revision history

| Version | Date | Author | Changes |
| --- | --- | --- | --- |
| 0.7 | 2026-06-01 | GTC IT / AI Assistant | Recorded CPG-BIZ-065 translation cache publish-gate validator and current review-required findings |
| 0.6 | 2026-06-01 | GTC IT / AI Assistant | Recorded CPG-BIZ-064 file-backed translation cache skeleton, deterministic stub provider, cache export artifacts and unit-test coverage |
| 0.5 | 2026-06-01 | GTC IT / AI Assistant | Recorded CPG-BIZ-063 backend cache design as the approved next architecture for Google machine localization, source-hash invalidation and human-review publication gates |
| 0.4 | 2026-06-01 | GTC IT / AI Assistant | Recorded official English platform language, machine localization boundary, Google Cloud Translation API / Google Translate default provider, English/Latin-only operational data entry and no automatic translation of completed form values |
| 0.3 | 2026-05-12 | GTC IT / AI Assistant | Recorded first-visit browser language detection, html lang synchronization, local persistence of the resolved language, and removal of runtime attempts to bridge translation behavior through browser-side JavaScript |
| 0.2 | 2026-05-12 | GTC IT / AI Assistant | Recorded the approved build-time translation skeleton under projects/crewportglobal/i18n and the validator extension that reads JSON catalogs when present |
| 0.1 | 2026-05-12 | GTC IT / AI Assistant | Initial implementation report for the current public translation methodology, validation flow and maintenance rule |
