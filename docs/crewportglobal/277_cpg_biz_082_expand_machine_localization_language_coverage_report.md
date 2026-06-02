# CPG-BIZ-082 - Expand Machine Localization Language Coverage Report

- Project: CrewPortGlobal.com
- Company: GTC INFORMATION TECHNOLOGY FZ-LLC
- Stage: Stage 1 - Digital Maritime Crew Data and Matching Platform
- Document type: Implementation report
- Source task: Project Owner approval to expand machine localization language coverage
- Version: 1.0
- Date: 2026-06-02
- Status: Implemented and verified

## 1. Purpose

This report records the expansion of machine-localized UI coverage for the CrewPortGlobal public runtime.

English remains the official and authoritative platform language. Machine localization is convenience UI translation only, operational form data remains English / Latin-only where applicable, browser code must not call translation providers, and sensitive legal, consent, complaint, no-fee and regulated text remains excluded until human review.

## 2. Pre-Implementation Backup

Before implementation, a source and live-site backup was created:

```text
/var/www/backups/cpg-biz-082-20260602T053711Z/gtc-form-source-and-live-3a46419.tar.gz
```

Backup base commit:

```text
3a46419
```

## 3. Approved Language Set

| Code | Language |
| --- | --- |
| `en` | English, official source |
| `ru` | Russian |
| `uk` | Ukrainian |
| `pt` | Portuguese |
| `es` | Spanish |
| `fr` | French |
| `tr` | Turkish |
| `el` | Greek |
| `ar` | Arabic |
| `fil` | Filipino |
| `hi` | Hindi |
| `id` | Indonesian |

Runtime machine bundle target languages:

```text
ar, el, es, fil, fr, hi, id, pt, ru, tr, uk
```

## 4. Implementation Scope

Implemented changes:

1. Synchronized the canonical English source catalog from shared chrome and page-local public dictionaries.
2. Added `sync:cpg-i18n-source` to rebuild `projects/crewportglobal/i18n/en.json`.
3. Added a build-side Google Translate public endpoint provider for non-sensitive machine-draft UI generation.
4. Added batch cache update support to reduce provider calls during large-language refresh.
5. Generated current cache entries for all approved target languages.
6. Exported publish-ready catalogs for all approved target languages.
7. Rebuilt the runtime machine bundle and synchronized public HTML script query markers to the new publication version.
8. Extended the public i18n checker so it includes the published machine runtime bundle in coverage checks.
9. Extended Playwright language regression to verify all approved machine-localized languages, including Arabic `dir="rtl"`.

## 5. Provider Boundary

The implementation uses a build-side provider:

```text
google_translate_public
```

This provider calls the Google Translate public endpoint from backend/build automation only. It is not exposed to browser runtime and must not translate user-entered form values.

The protected Google Cloud provider path remains the preferred credential-backed production provider for controlled environments.

## 6. Publication Counts

| Metric | Count |
| --- | ---: |
| Canonical English source keys | 1856 |
| Published machine-localized entries per target language | 1767 |
| Excluded sensitive entries per target language | 89 |

The excluded entries are sensitive or regulated keys requiring human review before publication.

## 7. Runtime Publication

Runtime bundle publication version:

```text
2708de3b9dc4dcb7
```

Published artifacts:

| Artifact | Purpose |
| --- | --- |
| `projects/crewportglobal/i18n/runtime-bundle/crewportglobal-machine-translations.js` | Canonical generated runtime bundle |
| `projects/crewportglobal/i18n/runtime-bundle/manifest.json` | Publication manifest and counts |
| `projects/crewportglobal/public/assets/crewportglobal-machine-translations.js` | Public browser-consumed static bundle |

## 8. Verification

```bash
npm run sync:cpg-i18n-source
python3 projects/crewportglobal/scripts/translation_cache.py --targets ru uk pt es fr tr el ar fil hi id --provider google_translate_public
npm run build:cpg-i18n-publish-ready
npm run publish:cpg-i18n-runtime-bundle
npm run check:cpg-i18n-publication-guard
npx playwright test -c playwright.crewportglobal.config.ts tests/crewportglobal-homepage-language.spec.ts
```

Observed results:

1. `en.json` synchronized 1856 English source keys.
2. Translation cache update created 20416 current Google machine-draft entries.
3. Runtime bundle publishes 1767 entries for each approved target language.
4. Publication guard findings: 0.
5. Focused browser regression: 16 passed.

## 9. Remaining Controlled Gaps

1. Sensitive translated text still needs human review before publication.
2. The protected Google Cloud provider remains available but was not used for full-language bulk generation in this slice.
3. Translation quality review for all target languages remains a future operational process.

## 10. Next Stage

The next recommended stage is:

```text
CPG-BIZ-083 - Translation human-review workspace for sensitive localized text
```
