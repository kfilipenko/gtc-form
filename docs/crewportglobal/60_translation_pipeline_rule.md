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

## 2. Canonical source model

- English is the canonical source language for public UI and public document content.
- Shared UI chrome translations are maintained in projects/crewportglobal/public/assets/crewportglobal-public-i18n.js.
- Homepage-specific UI translations are maintained in projects/crewportglobal/public/index.html via window.CREWPORTGLOBAL_PAGE_TRANSLATIONS.
- Generated public document HTML is rebuilt from canonical Markdown through projects/crewportglobal/scripts/generate_public_pages.py and projects/crewportglobal/scripts/run_public_generator.sh.

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
- machine translation or AI translation may be used only to create draft translations;
- these translations must not be treated as final publication text without human review;
- legal, consent, no-fee and seafarer-facing text require human review before publication.

## 4. Runtime rule

- The shared runtime in projects/crewportglobal/public/assets/crewportglobal-public-i18n.js is the canonical browser-side translation runtime.
- Homepage logic must reuse the shared runtime instead of maintaining a second selector or translation engine.
- Missing non-English translations must fall back to the English canonical value rather than exposing raw key names.
- External translation services may only be used as draft assistance and must not require frontend API keys.

## 5. Rebuild rule

After any canonical Markdown change or shared public translation change:

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
| 0.2 | 2026-05-12 | GTC IT / AI Assistant | Elevated this document to canonical methodology status, added the mandatory synchronized-update rule for methodology changes, and linked the implementation report as the companion operational record |
| 0.1 | 2026-05-12 | GTC IT / AI Assistant | Initial translation pipeline rule covering English canonical source, shared runtime reuse, fallback behavior, rebuild workflow and human-review boundaries |