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
- npx playwright test tests/crewportglobal-homepage-language.spec.ts --config=playwright.crewportglobal.config.ts

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
| 0.7 | 2026-06-01 | GTC IT / AI Assistant | Added the CPG-BIZ-064 stub-provider cache skeleton as the required first implementation layer before connecting Google credentials |
| 0.6 | 2026-06-01 | GTC IT / AI Assistant | Added reference to CPG-BIZ-063 backend cache design, provider-aware cache key, review statuses and explicit human-review gate for sensitive machine-localized text |
| 0.5 | 2026-06-01 | GTC IT / AI Assistant | Clarified English as the official authoritative platform language, localization as machine translation for convenience, Google Cloud Translation API / Google Translate as the default provider, English/Latin-only operational form data, source-hash cache invalidation and no translation of completed user form values |
| 0.4 | 2026-05-12 | GTC IT / AI Assistant | Added first-visit browser language detection through navigator.language or navigator.languages, required local persistence of the resolved supported language, and prohibited attempts to force built-in browser translation UI from JavaScript |
| 0.3 | 2026-05-12 | GTC IT / AI Assistant | Added the approved build-time draft translation skeleton path under projects/crewportglobal/i18n, clarified that providers are build-time only, and extended validation expectations to include JSON catalogs when present |
| 0.2 | 2026-05-12 | GTC IT / AI Assistant | Elevated this document to canonical methodology status, added the mandatory synchronized-update rule for methodology changes, and linked the implementation report as the companion operational record |
| 0.1 | 2026-05-12 | GTC IT / AI Assistant | Initial translation pipeline rule covering English canonical source, shared runtime reuse, fallback behavior, rebuild workflow and human-review boundaries |
