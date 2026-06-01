# CrewPortGlobal — Build-Time Translation Pipeline Plan

- Project: CrewPortGlobal.com
- Company: GTC INFORMATION TECHNOLOGY FZ-LLC
- Stage: Stage 1
- Document type: Implementation plan
- Status: Approved minimal skeleton

## 1. Purpose

This document defines the approved build-time translation pipeline direction for CrewPortGlobal public website text.

The objective is to generate draft translations during build or backend automation instead of calling translation providers from the browser.

The provider-aware backend cache design that controls the next implementation stage is recorded in:

```text
docs/crewportglobal/258_cpg_biz_063_google_machine_localization_cache_backend_design.md
```

## 2. Target architecture

The approved target flow is:

English canonical source
-> source strings or i18n keys
-> Google Cloud Translation API / Google Translate provider through backend or build automation
-> cached machine localization keyed by source text hash, provider and target language
-> publication status gate for machine drafts and human-reviewed translations
-> JSON catalog or translation-cache export per language
-> validator checks coverage
-> public static pages use the shared i18n runtime

## 3. Why this direction is approved

1. No provider key is exposed in frontend code.
2. Public pages stay fast and static.
3. Draft translation uses Google Cloud Translation API / Google Translate as the default approved provider without exposing provider credentials in browser code.
4. Sensitive publication text can remain under human review before release.
5. The translation layer becomes reproducible and auditable in the repository.

## 4. Minimal skeleton delivered in this slice

This slice delivers the following seed implementation artifacts:

1. projects/crewportglobal/i18n/README.md
2. projects/crewportglobal/i18n/en.json
3. projects/crewportglobal/i18n/ru.json
4. projects/crewportglobal/i18n/pt.json
5. projects/crewportglobal/i18n/uk.json
6. projects/crewportglobal/scripts/update_translations.example.py

The first cache implementation skeleton adds:

1. projects/crewportglobal/scripts/translation_cache.py
2. projects/crewportglobal/scripts/test_translation_cache.py
3. projects/crewportglobal/scripts/validate_translation_cache.py
4. projects/crewportglobal/scripts/review_translation_cache.py
5. projects/crewportglobal/scripts/export_translation_publish_ready.py
6. projects/crewportglobal/scripts/translation_provider_adapters.py
7. projects/crewportglobal/scripts/check_translation_provider_boundary.py
8. projects/crewportglobal/scripts/check_translation_credential_source.py
9. projects/crewportglobal/i18n/translation-cache.json
10. projects/crewportglobal/i18n/cache-export/
11. projects/crewportglobal/i18n/publish-ready-export/

The skeleton uses only a deterministic stub provider and does not call Google APIs.

The slice also extends the existing validator so JSON catalogs are read when present.

## 5. Current boundary

This slice is a minimal implementation skeleton, not a full migration of all public translations into JSON catalogs.

Current publish-time behavior remains:

1. shared runtime dictionary in projects/crewportglobal/public/assets/crewportglobal-public-i18n.js
2. homepage-local dictionary in projects/crewportglobal/public/index.html

The new i18n directory is the approved seed path for future automatic draft translation work.

Browser-side JavaScript must not attempt to force the browser's built-in translation UI.

Public pages may still be prepared for browser translation through correct html lang metadata, absence of translate=no on normal content, and a manual language selector.

## 6. Provider model

Approved provider classes for build-time draft generation:

1. Google Cloud Translation API / Google Translate provider through backend or build automation only.
2. LibreTranslate through an approved service endpoint or self-hosted instance only after an explicit methodology update.
3. Argos Translate for offline or local draft generation only after an explicit methodology update.

Provider credentials must not be embedded into browser code.

Operational form values are not part of the translation pipeline. Seafarer, employer, vessel and crew-request forms must be filled in English and Latin characters where applicable. Machine localization may translate UI labels and helper text, but it must not translate completed user data.

## 7. Validation model

Minimum validation path for the approved skeleton:

1. node projects/crewportglobal/scripts/check_public_i18n.js
2. ./projects/crewportglobal/scripts/run_public_generator.sh
3. focused Playwright checks for homepage and representative generated pages

The validator must continue to guarantee English canonical coverage for referenced UI keys and may treat non-English gaps as controlled fallback warnings.

## 8. Human review boundary

Machine-translated or AI-generated drafts must not be published without human review for:

1. legal texts
2. no-fee statements
3. complaint flows
4. candidate or seafarer-facing onboarding and consent text

## 9. Next integration step

When the project chooses to operationalize automatic draft generation, the next implementation slice should:

1. configure protected server/CI environment variables for Google credentials on the selected deployment target;
2. run credential-source validation in the deployment environment with `--require-config`;
3. implement the real Google API client behind the existing backend/build adapter boundary;
3. keep the deterministic stub provider available for local tests;
4. expand the English source catalog coverage;
5. generate target JSON catalogs from the selected provider only through backend/build automation;
6. add a deterministic publish-time export step from publish-ready JSON catalogs into the shared runtime dictionaries or another prebuilt runtime bundle;
7. keep validator and documentation synchronized with that emission path.

## 10. Revision history

| Version | Date | Author | Changes |
| --- | --- | --- | --- |
| 0.8 | 2026-06-01 | GTC IT / AI Assistant | Added protected Google credential source validation artifact and deployment prerequisite |
| 0.7 | 2026-06-01 | GTC IT / AI Assistant | Added Google provider adapter placeholder and public-tree credential boundary check artifact |
| 0.6 | 2026-06-01 | GTC IT / AI Assistant | Added human-review marking and publish-ready export artifacts to the translation cache implementation plan |
| 0.5 | 2026-06-01 | GTC IT / AI Assistant | Added publish-gate validator to the cache skeleton plan, including stale/missing/hash-mismatch/orphan/review-required reporting |
| 0.4 | 2026-06-01 | GTC IT / AI Assistant | Recorded the first file-backed translation cache skeleton with stub provider, cache export artifacts and unit-test entrypoint |
| 0.3 | 2026-06-01 | GTC IT / AI Assistant | Linked the CPG-BIZ-063 backend cache design, clarified provider-aware cache keys, publication status gates and the stub-provider-first implementation order |
| 0.2 | 2026-06-01 | GTC IT / AI Assistant | Clarified Google Cloud Translation API / Google Translate as the default provider, source-hash cache expectations and English/Latin-only operational form data outside translation scope |
| 0.1 | 2026-05-12 | GTC IT / AI Assistant | Initial build-time translation pipeline plan and minimal implementation skeleton for automatic draft translations |
