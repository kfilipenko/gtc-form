# CrewPortGlobal — Translation Pipeline Rule

- Project: CrewPortGlobal.com
- Company: GTC INFORMATION TECHNOLOGY FZ-LLC
- Stage: Stage 1
- Document type: Translation pipeline rule
- Canonical status: Source of truth for website text-translation methodology
- Status: For internal implementation and review

## 1. Purpose

This rule defines how multilingual text must be introduced, rebuilt and reviewed across the public CrewPortGlobal surface.

The goal is to prevent accidental untranslated UI, uncontrolled legal auto-translation and non-reproducible rebuilds.

This document is the canonical methodology record for website text translation.

If the translation methodology changes, this document must be updated in the same implementation slice.

The related operational report in docs/crewportglobal/61_translation_pipeline_implementation_report.md should also be updated when the methodology or validation flow changes materially.

The backend cache design for Google machine localization is recorded in:

```text
docs/crewportglobal/258_cpg_biz_063_google_machine_localization_cache_backend_design.md
```

The first implementation skeleton for that cache is recorded in:

```text
docs/crewportglobal/259_cpg_biz_064_translation_cache_stub_provider_skeleton_report.md
```

The current human-review and publish-ready export policy is recorded in:

```text
docs/crewportglobal/261_cpg_biz_066_translation_cache_human_review_publish_export_report.md
```

The current Google provider adapter boundary check is recorded in:

```text
docs/crewportglobal/262_cpg_biz_067_translation_cache_google_provider_boundary_report.md
```

The protected Google credential source rule is recorded in:

```text
docs/crewportglobal/263_cpg_biz_068_translation_cache_google_credential_source_report.md
```

The protected Google client adapter implementation is recorded in:

```text
docs/crewportglobal/264_cpg_biz_069_translation_cache_google_client_adapter_report.md
```

The controlled cache-update provider selection is recorded in:

```text
docs/crewportglobal/265_cpg_biz_070_translation_cache_provider_selection_report.md
```

The Google dependency and protected environment readiness gate is recorded in:

```text
docs/crewportglobal/266_cpg_biz_071_translation_google_dependency_readiness_report.md
```

The protected Google provider smoke-test script and plan are recorded in:

```text
docs/crewportglobal/267_cpg_biz_072_translation_google_protected_smoke_test_report.md
```

The publish-ready runtime bundle emission implementation is recorded in:

```text
docs/crewportglobal/268_cpg_biz_073_translation_runtime_bundle_emission_report.md
```

The runtime bundle consumption design is recorded in:

```text
docs/crewportglobal/269_cpg_biz_074_translation_runtime_bundle_consumption_design.md
```

The runtime bundle consumption implementation is recorded in:

```text
docs/crewportglobal/270_cpg_biz_075_translation_runtime_bundle_consumption_implementation_report.md
```

The controlled runtime bundle publication implementation is recorded in:

```text
docs/crewportglobal/271_cpg_biz_076_controlled_runtime_bundle_publication_report.md
```

The read-only translation publication guard implementation is recorded in:

```text
docs/crewportglobal/274_cpg_biz_079_translation_publication_read_only_guard_report.md
```

The translation publication CI/release checklist implementation is recorded in:

```text
docs/crewportglobal/275_cpg_biz_080_translation_publication_ci_release_checklist_report.md
```

The translation release failure drill and rollback note is recorded in:

```text
docs/crewportglobal/276_cpg_biz_081_translation_release_failure_drill_rollback_note.md
```

The expanded machine localization implementation is recorded in:

```text
docs/crewportglobal/277_cpg_biz_082_expand_machine_localization_language_coverage_report.md
```

The sensitive translation human-review queue implementation is recorded in:

```text
docs/crewportglobal/278_cpg_biz_083_translation_sensitive_human_review_queue_report.md
```

The expanded machine-localization language coverage implementation is recorded in:

```text
docs/crewportglobal/277_cpg_biz_082_expand_machine_localization_language_coverage_report.md
```

## 2. Canonical source model

- English is the official and authoritative language of the platform.
- English is the canonical source language for public UI, public document content, operational forms and matching data.
- Localized UI text is an auxiliary machine translation for user convenience and must not replace the English source text as the official version.
- Shared UI chrome translations are maintained in projects/crewportglobal/public/assets/crewportglobal-public-i18n.js.
- Homepage-specific UI translations are maintained in projects/crewportglobal/public/index.html via window.CREWPORTGLOBAL_PAGE_TRANSLATIONS.
- The approved build-time draft translation skeleton is seeded in projects/crewportglobal/i18n/en.json and companion language JSON catalogs.
- Generated public document HTML is rebuilt from canonical Markdown through projects/crewportglobal/scripts/generate_public_pages.py and projects/crewportglobal/scripts/run_public_generator.sh.

## 2.1 Official language and data-entry rule

The official language of CrewPortGlobal is English.

All data entered by users into operational forms must be entered in English and Latin characters where applicable. This rule applies to:

1. seafarer profile data;
2. employer and shipowner company data;
3. vessel data;
4. crew request / vacancy data;
5. document metadata;
6. matching-critical free-text fields when no catalog value is available.

The system must not automatically translate completed forms, uploaded document content, personal names, vessel names, company names, email addresses, phone numbers or operator notes unless a separate approved workflow explicitly authorizes translation for a defined purpose.

This rule exists because international maritime crew work, document review, employer presentation, vessel operations and automated request-offer matching require a single comparable language basis.

## 2.2 Machine localization provider rule

Localized website UI is machine translation for convenience.

The default approved provider is:

```text
Google Cloud Translation API / Google Translate provider
```

Provider credentials must never be exposed in browser-side JavaScript.

Machine localization must be performed through backend or build automation and cached. The cache key must include at minimum:

```text
translation_key + source_language + target_language + source_text_hash
```

If the English source text changes, the source hash changes and the cached translation must be treated as outdated.

The approved cache contract must also retain provider identity and publication status:

```text
translation_key + source_language + target_language + source_text_hash + provider
```

Recommended statuses:

```text
draft_machine
review_required
reviewed
rejected
stale
```

Sensitive text may be machine translated only into a draft or review-required state until a human reviewer approves publication.

Alternative providers such as LibreTranslate, Argos Translate or another AI translation provider may be used only after an explicit methodology update and approval.

The approved build-side provider option for broad non-sensitive UI coverage is:

```text
google_translate_public
```

This provider may be used only by backend/build automation to generate cached machine-draft UI translations. It must not be called from browser-side code and must not translate user-entered form values.

The protected `google` provider remains the credential-backed Google Cloud Translation path for protected server/CI environments.

The approved target language set for current machine-localized UI publication is:

```text
ru, uk, pt, es, fr, tr, el, ar, fil, hi, id
```

English (`en`) remains the official source language and is not a machine target.

## 3. Text categories

### 3.1 UI text

UI text includes:

- buttons;
- navigation labels;
- short headings;
- badges and hints;
- short support copy in reusable panels;
- homepage marketing and routing copy.

Rule:

- every new visible UI text must be introduced through an i18n key;
- every new i18n key must have an English canonical value;
- non-English values may be added immediately or later;
- if a non-English value is missing, runtime fallback to English is allowed.

### 3.2 Long-form and regulated text

Long-form and regulated text includes:

- privacy text;
- terms;
- complaint handling text;
- no-fee policy text;
- candidate agreement text;
- seafarer-facing consent and onboarding text.

Rule:

- English remains canonical source;
- machine translation or AI translation may be used only to create draft localizations;
- these translations must not be treated as final publication text without human review;
- legal, consent, no-fee and seafarer-facing text require human review before publication.
- when a machine translation is shown before approval, the UI or publication process must make clear that the English version prevails.

## 4. Runtime rule

- The shared runtime in projects/crewportglobal/public/assets/crewportglobal-public-i18n.js is the canonical browser-side translation runtime.
- On first visit without a stored preference, the runtime may select a supported language from navigator.language or navigator.languages and persist that choice locally.
- Homepage logic must reuse the shared runtime instead of maintaining a second selector or translation engine.
- Missing non-English translations must fall back to the English canonical value rather than exposing raw key names.
- External translation services may only be used through backend/build automation and must not require frontend API keys.
- The preferred provider for generated machine localization is Google Cloud Translation API / Google Translate provider.
- Runtime localization may consume approved cached machine translations, but it must not translate form values or user-entered data.
- Browser-side code must consume prebuilt dictionaries only and must not call translation providers directly.
- Browser-side code must not attempt to force the browser's built-in page translation UI from JavaScript.
- The first cache implementation layer must use a stub provider until cache behavior, invalidation and export are verified without external credentials.
- Publication checks must report stale cache entries, missing current entries, source-hash mismatches, orphan entries and review-required entries before localized bundles are exported for live use.
- Strict publish mode must block regulated or sensitive translated text unless it has been human reviewed.
- Publish-ready exports must exclude unreviewed sensitive translated entries even when ordinary low-risk machine-draft UI labels are exportable.
- A read-only review queue must be available before human-review marking so reviewers can see the English source text, machine draft, target language, provider and current status.
- Review-queue and validation reports must be target-language limited when a specific target set is requested, so reviewers do not confuse one-language review with all-language review.
- Human-review marking must record reviewer identity and review timestamp in the cache entry.
- Marking a translation as reviewed is allowed only for a current, non-stale entry whose source hash still matches the canonical English source catalog.
- Google provider integration must start from a backend/build adapter boundary. The public tree must not contain Google credentials, Google project identifiers, Google API keys or browser-side calls to Google translation endpoints.
- Google credentials may be supplied only through protected server/CI environment variables. `GOOGLE_APPLICATION_CREDENTIALS` must point to an absolute protected path outside the repository and public web tree, and `GOOGLE_CLOUD_PROJECT` must be present when Google translation is enabled.
- The Google client may be called only through the backend/build provider adapter after credential-source validation succeeds. Tests must keep an injected fake client path so provider logic remains verifiable without network calls or real credentials.
- Translation cache update commands must default to the deterministic `stub` provider. The `google` provider may be selected only explicitly and must fail closed when protected credentials are absent or invalid.
- The `google-cloud-translate` dependency must remain optional and isolated from the default public/runtime dependency path. Protected backend/build environments must validate both dependency installation and protected credentials before running cache updates with `--provider google`.
- The first real Google provider smoke test must translate only one approved English source key into one target language, must run only after protected readiness passes and must not mutate repository cache or live runtime dictionaries.
- Publish-ready machine translations may be emitted into a prebuilt runtime bundle only after cache validation and publish-ready export. Bundle emission must not by itself connect the bundle to the live browser runtime.
- Browser runtime consumption of the prebuilt machine-translation bundle must remain dictionary-only: no provider calls, no form-value translation, no raw key exposure, and English fallback must remain authoritative.
- The shared public runtime may consume `window.CREWPORTGLOBAL_MACHINE_TRANSLATION_BUNDLE` only after validating schema version, official English source, no browser provider calls, no form-value translation and object-shaped language catalogs. Invalid bundles must be ignored.
- Public pages that load the shared runtime must load the prebuilt machine bundle before `crewportglobal-public-i18n.js`. The public bundle file must match the canonical generated runtime-bundle artifact.
- Public machine-bundle URLs must use the build-controlled `publication_version` from `projects/crewportglobal/i18n/runtime-bundle/manifest.json` as their cache-busting query value.
- The publication version must be derived from the approved source/catalog content and publication boundary, not from a manually edited date string.
- Bundle validation must fail if public HTML references a stale or manually mismatched machine-bundle version.
- The cache-invalidation implementation result is recorded in `docs/crewportglobal/272_cpg_biz_077_translation_publication_cache_invalidation_report.md`.
- Routine runtime-bundle publication must use `npm run publish:cpg-i18n-runtime-bundle`, which runs build, public HTML version synchronization and validation in one workflow.
- Direct manual edits to machine-bundle query markers are allowed only as an emergency correction and must be followed by the publication workflow validation.
- The one-command workflow implementation result is recorded in `docs/crewportglobal/273_cpg_biz_078_translation_publication_workflow_command_report.md`.
- CI and release review should run `npm run check:cpg-i18n-publication-guard` after the standard publication workflow. This read-only guard must not write files. It verifies runtime bundle integrity, public HTML query markers and that every published machine-translation entry is still allowed by the publish-ready translation-cache export policy.
- The read-only publication guard implementation result is recorded in `docs/crewportglobal/274_cpg_biz_079_translation_publication_read_only_guard_report.md`.
- Translation publication release review must use `npm run check:cpg-i18n-release` locally or the `CrewPortGlobal i18n publication` GitHub Actions workflow in CI. The sequence is: publish workflow, read-only publication guard, generated-artifact diff check and focused browser regression.
- The canonical English source catalog for machine localization must be synchronized with `npm run sync:cpg-i18n-source` before broad cache generation.
- Expanded language publication must keep all target languages in `projects/crewportglobal/i18n/runtime-bundle/manifest.json` and must verify browser selection through Playwright.
- Arabic localization must set the document direction to `rtl`; all other current target languages use `ltr`.
- The CI/release checklist implementation result is recorded in `docs/crewportglobal/275_cpg_biz_080_translation_publication_ci_release_checklist_report.md`.
- Translation release failures must be resolved by correcting the cause and rerunning the approved release sequence. Routine recovery must not manually edit generated runtime-bundle JavaScript or public HTML query markers. Rollback must restore a previously committed and validated runtime publication state, then run the read-only guard and full release check before commit.
- The translation release failure drill and rollback note is recorded in `docs/crewportglobal/276_cpg_biz_081_translation_release_failure_drill_rollback_note.md`.
- Sensitive translation review must start with `npm run list:cpg-i18n-review-queue -- --provider google_translate_public --targets <lang>`. Human review marking must use `npm run review:cpg-i18n-cache -- --provider google_translate_public --keys <key> --targets <lang> --reviewed-by <user_id>` after the reviewer confirms the target text against the English source.
- The sensitive translation human-review queue implementation result is recorded in `docs/crewportglobal/278_cpg_biz_083_translation_sensitive_human_review_queue_report.md`.

## 5. Rebuild rule

After any canonical Markdown change or shared public translation change:

1. Refresh build-time draft catalogs when the approved source strings change.
1. Rebuild generated public pages with ./projects/crewportglobal/scripts/run_public_generator.sh.
2. Validate i18n coverage with node projects/crewportglobal/scripts/check_public_i18n.js.
3. Run focused regression checks for homepage and representative generated public pages.

## 5.1 Methodology change rule

When translation methodology changes, the same slice must update at minimum:

1. docs/crewportglobal/60_translation_pipeline_rule.md
2. docs/crewportglobal/61_translation_pipeline_implementation_report.md
3. projects/crewportglobal/README.md
4. docs/crewportglobal/00_documentation_register.md

If the methodology change modifies validation behavior, the related validator or test entrypoints must be updated in the same slice.

## 6. Validation rule

The repository must enforce these minimum checks:

- every referenced data-i18n key has an English canonical value;
- homepage and generated public pages keep working with the shared runtime;
- build-time JSON catalogs are read by validation when present;
- missing non-English values fall back to English;
- generated pages remain rebuildable through the standard wrapper script.

Current validation entrypoints:

- ./projects/crewportglobal/scripts/run_public_generator.sh
- node projects/crewportglobal/scripts/check_public_i18n.js
- npm run check:cpg-i18n-runtime-bundle
- npm run publish:cpg-i18n-runtime-bundle
- npm run list:cpg-i18n-review-queue
- npm run review:cpg-i18n-cache
- npm run check:cpg-i18n-publication-guard
- npm run check:cpg-i18n-release
- npx playwright test tests/crewportglobal-homepage-language.spec.ts --config=playwright.crewportglobal.config.ts

## 6.1 Protected reviewer workspace

Sensitive machine-localized text may also be reviewed through the internal protected portal:

```text
/team/translations/
```

The workspace reads the same canonical cache and uses protected API endpoints:

```text
GET /api/v1/team/translations/review-queue
PATCH /api/v1/team/translations/review
```

The page must not call Google or any other translation provider from the browser.

The review decision endpoint may mark current non-stale cache entries as:

```text
reviewed
rejected
corrected_pending_review
```

`corrected_pending_review` means a reviewer or translator has replaced the localized draft text inside the protected workspace, but the entry still requires final human approval before publication.

Only entries whose `source_text_hash` still matches `projects/crewportglobal/i18n/en.json` are eligible.

Correction is not publication approval:

- corrected entries must keep `human_review_required = true`;
- corrected entries must remain excluded from publish-ready export until an authorized reviewer records final approval;
- correction events must preserve actor, timestamp and previous text hash metadata in the cache entry.

## 7. Human review scope

Human review is required before publication for:

- projects/crewportglobal/public/legal/**/*.md
- projects/crewportglobal/public/for-seafarers/index.md
- projects/crewportglobal/public/onboarding/seafarer-registration/index.html

## 8. Publication rule

- Only rebuilt and validated static output may be synced to the live public tree.
- Backend, database, secrets, auth and OpenClaw configuration remain out of scope for this translation pipeline.

## 9. Revision history

| Version | Date | Author | Changes |
| --- | --- | --- | --- |
| 2.7 | 2026-06-02 | GTC IT / AI Assistant | Added protected correction workflow rule for rejected or revised sensitive translations before final approval |
| 2.6 | 2026-06-02 | GTC IT / AI Assistant | Added protected translation reviewer workspace and API review decision boundary |
| 2.5 | 2026-06-02 | GTC IT / AI Assistant | Added sensitive translation human-review queue rule and provider-aware review commands |
| 2.4 | 2026-06-02 | GTC IT / AI Assistant | Added translation release failure drill and rollback rule |
| 2.3 | 2026-06-01 | GTC IT / AI Assistant | Added translation publication CI workflow and release checklist rule |
| 2.2 | 2026-06-01 | GTC IT / AI Assistant | Added read-only translation publication guard rule for CI/release review |
| 2.1 | 2026-06-01 | GTC IT / AI Assistant | Added mandatory one-command runtime-bundle publication workflow rule |
| 2.0 | 2026-06-01 | GTC IT / AI Assistant | Added build-controlled publication version and public HTML cache-invalidation validation rule |
| 1.9 | 2026-06-01 | GTC IT / AI Assistant | Added controlled public bundle publication and script ordering rule |
| 1.8 | 2026-06-01 | GTC IT / AI Assistant | Added implemented runtime bundle consumption validation and fail-closed behavior |
| 1.7 | 2026-06-01 | GTC IT / AI Assistant | Added runtime bundle consumption design rule with dictionary-only lookup and English fallback |
| 1.6 | 2026-06-01 | GTC IT / AI Assistant | Added publish-ready runtime bundle emission boundary |
| 1.5 | 2026-06-01 | GTC IT / AI Assistant | Added protected one-key Google smoke-test rule with no repository cache mutation |
| 1.4 | 2026-06-01 | GTC IT / AI Assistant | Added Google dependency and protected environment readiness gate rule |
| 1.3 | 2026-06-01 | GTC IT / AI Assistant | Added controlled provider selection rule for cache update command with stub default and fail-closed Google mode |
| 1.2 | 2026-06-01 | GTC IT / AI Assistant | Added protected Google client adapter rule with credential validation before backend/build translate calls |
| 1.1 | 2026-06-01 | GTC IT / AI Assistant | Added protected Google credential source rule using server/CI environment variables outside repository and public tree |
| 1.0 | 2026-06-01 | GTC IT / AI Assistant | Added Google provider adapter boundary rule and public-tree credential check before real provider integration |
| 0.9 | 2026-06-01 | GTC IT / AI Assistant | Added human-review marking and publish-ready export policy for sensitive cache entries |
| 0.8 | 2026-06-01 | GTC IT / AI Assistant | Added translation cache publish-gate validation requirements for stale, missing, hash-mismatch, orphan and review-required entries |
| 0.7 | 2026-06-01 | GTC IT / AI Assistant | Added the CPG-BIZ-064 stub-provider cache skeleton as the required first implementation layer before connecting Google credentials |
| 0.6 | 2026-06-01 | GTC IT / AI Assistant | Added reference to CPG-BIZ-063 backend cache design, provider-aware cache key, review statuses and explicit human-review gate for sensitive machine-localized text |
| 0.5 | 2026-06-01 | GTC IT / AI Assistant | Clarified English as the official authoritative platform language, localization as machine translation for convenience, Google Cloud Translation API / Google Translate as the default provider, English/Latin-only operational form data, source-hash cache invalidation and no translation of completed user form values |
| 0.4 | 2026-05-12 | GTC IT / AI Assistant | Added first-visit browser language detection through navigator.language or navigator.languages, required local persistence of the resolved supported language, and prohibited attempts to force built-in browser translation UI from JavaScript |
| 0.3 | 2026-05-12 | GTC IT / AI Assistant | Added the approved build-time draft translation skeleton path under projects/crewportglobal/i18n, clarified that providers are build-time only, and extended validation expectations to include JSON catalogs when present |
| 0.2 | 2026-05-12 | GTC IT / AI Assistant | Elevated this document to canonical methodology status, added the mandatory synchronized-update rule for methodology changes, and linked the implementation report as the companion operational record |
| 0.1 | 2026-05-12 | GTC IT / AI Assistant | Initial translation pipeline rule covering English canonical source, shared runtime reuse, fallback behavior, rebuild workflow and human-review boundaries |
