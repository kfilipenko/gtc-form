# CrewPortGlobal — Build-Time Translation Pipeline Plan

- Project: CrewPortGlobal.com
- Company: GTC INFORMATION TECHNOLOGY FZ-LLC
- Stage: Stage 1
- Document type: Implementation plan
- Status: Approved minimal skeleton

## 1. Purpose

This document defines the approved build-time translation pipeline direction for CrewPortGlobal public website text.

The objective is to generate draft translations during build or backend automation instead of calling translation providers from the browser.

## 2. Target architecture

The approved target flow is:

English canonical source
-> source strings or i18n keys
-> build-time draft translation script
-> JSON catalog per language
-> validator checks coverage
-> public static pages use the shared i18n runtime

## 3. Why this direction is approved

1. No provider key is exposed in frontend code.
2. Public pages stay fast and static.
3. Draft translation can use Google Cloud Translation, LibreTranslate or Argos Translate without changing the browser runtime model.
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

The slice also extends the existing validator so JSON catalogs are read when present.

## 5. Current boundary

This slice is a minimal implementation skeleton, not a full migration of all public translations into JSON catalogs.

Current publish-time behavior remains:

1. shared runtime dictionary in projects/crewportglobal/public/assets/crewportglobal-public-i18n.js
2. homepage-local dictionary in projects/crewportglobal/public/index.html

The new i18n directory is the approved seed path for future automatic draft translation work.

## 6. Provider model

Approved provider classes for build-time draft generation:

1. Google Cloud Translation API through backend or build automation only
2. LibreTranslate through an approved service endpoint or self-hosted instance
3. Argos Translate for offline or local draft generation

Provider credentials must not be embedded into browser code.

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

1. expand the English source catalog coverage
2. generate target JSON catalogs from the selected provider
3. add a deterministic publish-time export step from JSON catalogs into the shared runtime dictionaries or another prebuilt runtime bundle
4. keep validator and documentation synchronized with that emission path

## 10. Revision history

| Version | Date | Author | Changes |
| --- | --- | --- | --- |
| 0.1 | 2026-05-12 | GTC IT / AI Assistant | Initial build-time translation pipeline plan and minimal implementation skeleton for automatic draft translations |