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
15. Human-review marking and publish-ready export policy is documented in docs/crewportglobal/261_cpg_biz_066_translation_cache_human_review_publish_export_report.md.
16. Google provider adapter boundary and public-tree credential checks are documented in docs/crewportglobal/262_cpg_biz_067_translation_cache_google_provider_boundary_report.md.
17. Protected Google credential source checks are documented in docs/crewportglobal/263_cpg_biz_068_translation_cache_google_credential_source_report.md.
18. Protected Google client adapter implementation is documented in docs/crewportglobal/264_cpg_biz_069_translation_cache_google_client_adapter_report.md.
19. Controlled translation cache provider selection is documented in docs/crewportglobal/265_cpg_biz_070_translation_cache_provider_selection_report.md.
20. Google dependency and protected environment readiness checks are documented in docs/crewportglobal/266_cpg_biz_071_translation_google_dependency_readiness_report.md.
21. Protected Google provider one-key smoke testing is documented in docs/crewportglobal/267_cpg_biz_072_translation_google_protected_smoke_test_report.md.
22. Publish-ready runtime bundle emission is documented in docs/crewportglobal/268_cpg_biz_073_translation_runtime_bundle_emission_report.md.
23. Runtime bundle consumption design is documented in docs/crewportglobal/269_cpg_biz_074_translation_runtime_bundle_consumption_design.md.
24. Runtime bundle consumption implementation is documented in docs/crewportglobal/270_cpg_biz_075_translation_runtime_bundle_consumption_implementation_report.md.
25. Controlled runtime bundle publication is documented in docs/crewportglobal/271_cpg_biz_076_controlled_runtime_bundle_publication_report.md.
26. Build-controlled runtime bundle cache invalidation is documented in docs/crewportglobal/272_cpg_biz_077_translation_publication_cache_invalidation_report.md.
27. One-command runtime bundle publication workflow is documented in docs/crewportglobal/273_cpg_biz_078_translation_publication_workflow_command_report.md.
28. Read-only translation publication guard is documented in docs/crewportglobal/274_cpg_biz_079_translation_publication_read_only_guard_report.md.
29. Translation publication CI workflow and release checklist are documented in docs/crewportglobal/275_cpg_biz_080_translation_publication_ci_release_checklist_report.md.
30. Translation release failure drill and rollback procedure are documented in docs/crewportglobal/276_cpg_biz_081_translation_release_failure_drill_rollback_note.md.

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
12. Human-review marking records reviewer identity and timestamp, and publish-ready export excludes unreviewed sensitive translations.
13. Google provider adapter exists only as a backend/build boundary; real Google API calls are selectable only through explicit protected cache-update mode.
14. Public tree credential scanning confirms no Google credential markers or translation API endpoints are exposed in public HTML/JS/JSON/CSS/Markdown.
15. Protected Google credential source validation allows non-Google local mode without credentials, but blocks partial or unsafe Google configuration.
16. Google translation client creation is available only after credential-source validation and can be tested with an injected backend/build client without real Google credentials.
17. Cache update command defaults to `stub`; explicit `google` selection fails closed before cache mutation when protected credentials are absent or invalid.
18. Google dependency readiness is isolated behind an optional requirements file and a dedicated checker; local mode reports not-ready without failing, while protected mode can fail strictly with `--require-google`.
19. Protected Google smoke testing is one-key and in-memory; it stops before provider calls when readiness fails and does not mutate the repository cache.
20. Publish-ready export can be emitted into a prebuilt runtime bundle with manifest validation, but the bundle is not automatically consumed by the live browser runtime.
21. Runtime bundle consumption is designed as dictionary-only lookup with English fallback and no automatic translation of user-entered operational values.
22. Runtime bundle consumption is implemented in the shared public runtime with fail-closed bundle validation, no browser provider calls and no mutation of form values.
23. Public pages that load the shared runtime now load the validated static machine bundle before `crewportglobal-public-i18n.js`; validation checks that the public bundle matches the canonical generated artifact.
24. Public machine-bundle script URLs must carry the current `publication_version` from the runtime-bundle manifest; stale or manually edited query markers fail validation.
25. `npm run publish:cpg-i18n-runtime-bundle` now performs runtime-bundle build, public HTML version synchronization and validation in one command.
26. `npm run check:cpg-i18n-publication-guard` now performs a read-only release/CI guard confirming runtime publication integrity and exact agreement between the published runtime bundle catalogs and the publish-ready cache export policy.
27. `npm run check:cpg-i18n-release` and `.github/workflows/crewportglobal-i18n-publication.yml` now define the release sequence: publish workflow, read-only guard, generated-artifact diff check and focused browser regression.
28. Translation release failure recovery is documented as a controlled drill: identify the failing guard, correct the cause, avoid manual generated-file edits, and restore only previously committed validated runtime publication artifacts when rollback is required.

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

Current publish-ready export behavior is:

1. ordinary low-risk `draft_machine` entries may be exported from the cache;
2. stale entries are excluded;
3. `review_required` entries are excluded;
4. sensitive entries are exported only after they are marked `reviewed`;
5. reviewer user id and review timestamp are retained in the cache entry.

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

The CPG-BIZ-063 through CPG-BIZ-081 translation-cache slices did not require changes to:

1. backend
2. database
3. secrets
4. auth
5. OpenClaw configuration
6. browser runtime publication dictionaries

## 8. Revision history

| Version | Date | Author | Changes |
| --- | --- | --- | --- |
| 2.3 | 2026-06-02 | GTC IT / AI Assistant | Recorded CPG-BIZ-081 translation release failure drill and rollback procedure |
| 2.2 | 2026-06-01 | GTC IT / AI Assistant | Recorded CPG-BIZ-080 translation publication CI workflow and release checklist |
| 2.1 | 2026-06-01 | GTC IT / AI Assistant | Recorded CPG-BIZ-079 read-only translation publication guard |
| 2.0 | 2026-06-01 | GTC IT / AI Assistant | Recorded CPG-BIZ-078 one-command runtime-bundle publication workflow |
| 1.9 | 2026-06-01 | GTC IT / AI Assistant | Recorded CPG-BIZ-077 build-controlled publication version and cache-invalidation validation |
| 1.8 | 2026-06-01 | GTC IT / AI Assistant | Recorded CPG-BIZ-076 controlled runtime bundle publication and public page loading order |
| 1.7 | 2026-06-01 | GTC IT / AI Assistant | Recorded CPG-BIZ-075 runtime bundle consumption implementation with fail-closed validation |
| 1.6 | 2026-06-01 | GTC IT / AI Assistant | Recorded CPG-BIZ-074 runtime bundle consumption design |
| 1.5 | 2026-06-01 | GTC IT / AI Assistant | Recorded CPG-BIZ-073 publish-ready runtime bundle emission artifact |
| 1.4 | 2026-06-01 | GTC IT / AI Assistant | Recorded CPG-BIZ-072 protected one-key Google provider smoke test |
| 1.3 | 2026-06-01 | GTC IT / AI Assistant | Recorded CPG-BIZ-071 Google dependency and protected environment readiness gate |
| 1.2 | 2026-06-01 | GTC IT / AI Assistant | Recorded CPG-BIZ-070 provider selection in translation cache update command |
| 1.1 | 2026-06-01 | GTC IT / AI Assistant | Recorded CPG-BIZ-069 protected Google client adapter behind credential validation |
| 1.0 | 2026-06-01 | GTC IT / AI Assistant | Recorded CPG-BIZ-068 protected Google credential source decision and validation command |
| 0.9 | 2026-06-01 | GTC IT / AI Assistant | Recorded CPG-BIZ-067 Google provider adapter boundary placeholder and public-tree credential scan |
| 0.8 | 2026-06-01 | GTC IT / AI Assistant | Recorded CPG-BIZ-066 human-review marking, reviewer metadata and publish-ready export policy for translation cache |
| 0.7 | 2026-06-01 | GTC IT / AI Assistant | Recorded CPG-BIZ-065 translation cache publish-gate validator and current review-required findings |
| 0.6 | 2026-06-01 | GTC IT / AI Assistant | Recorded CPG-BIZ-064 file-backed translation cache skeleton, deterministic stub provider, cache export artifacts and unit-test coverage |
| 0.5 | 2026-06-01 | GTC IT / AI Assistant | Recorded CPG-BIZ-063 backend cache design as the approved next architecture for Google machine localization, source-hash invalidation and human-review publication gates |
| 0.4 | 2026-06-01 | GTC IT / AI Assistant | Recorded official English platform language, machine localization boundary, Google Cloud Translation API / Google Translate default provider, English/Latin-only operational data entry and no automatic translation of completed form values |
| 0.3 | 2026-05-12 | GTC IT / AI Assistant | Recorded first-visit browser language detection, html lang synchronization, local persistence of the resolved language, and removal of runtime attempts to bridge translation behavior through browser-side JavaScript |
| 0.2 | 2026-05-12 | GTC IT / AI Assistant | Recorded the approved build-time translation skeleton under projects/crewportglobal/i18n and the validator extension that reads JSON catalogs when present |
| 0.1 | 2026-05-12 | GTC IT / AI Assistant | Initial implementation report for the current public translation methodology, validation flow and maintenance rule |
