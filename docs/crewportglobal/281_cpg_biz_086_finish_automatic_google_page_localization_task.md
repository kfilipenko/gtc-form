# CPG-BIZ-086 - Finish Automatic Google Page Localization Task

- Project: CrewPortGlobal.com
- Company: GTC INFORMATION TECHNOLOGY FZ-LLC
- Stage: Stage 1 - Digital Maritime Crew Data and Matching Platform
- Document type: Execution task
- Source request: Project Owner correction after CPG-BIZ-085
- Version: 1.0
- Date: 2026-06-03
- Status: Approved for execution

## 1. Purpose

This task corrects and refocuses the translation work.

The current goal is not to create perfect manual translations. The goal is to make the website usable in all languages available in the language selector by using automatic Google machine translation through the approved cached translation pipeline.

English remains the official language. Localized pages are machine translations for user convenience.

## 2. Mandatory Rules

### 2.1 All Website Pages Must Be Translatable

Every website page must support the approved language selector languages:

```text
ru, uk, pt, es, fr, tr, el, ar, fil, hi, id
```

This applies to:

1. public pages;
2. registration pages;
3. form pages;
4. cabinet pages;
5. team pages, where localization is technically applicable;
6. reusable navigation, header, footer and shared UI chrome.

If a page has visible static UI text, that text must have an English canonical i18n key and must be eligible for machine localization.

### 2.2 Changed Pages Must Trigger Translation Refresh

When a page changes, the translation process must be refreshed for the changed page text.

The implementation must ensure:

1. English source text is synchronized from changed pages into the canonical source catalog;
2. changed source text invalidates outdated cached translations through source hash comparison;
3. Google machine translation cache generation can update the changed keys;
4. the runtime machine translation bundle is rebuilt and republished after translation refresh;
5. validation confirms that changed pages do not show raw translation keys.

The expected workflow is:

```text
page text changed
-> sync English source catalog
-> update Google machine translation cache for approved languages
-> rebuild publish-ready catalogs
-> rebuild runtime machine bundle
-> validate public pages and language selector
```

### 2.3 Forms Are Translated, User-Entered Data Is Not

Forms and form pages must be translated as UI.

This includes:

1. section titles;
2. field labels;
3. placeholders;
4. button text;
5. validation messages;
6. help text;
7. status messages;
8. onboarding and completion instructions.

User-entered data must not be automatically translated.

This includes:

1. names;
2. addresses;
3. company names;
4. vessel names;
5. emails;
6. phone numbers;
7. free-text notes;
8. uploaded document content;
9. operator notes;
10. any stored profile, vessel, company or vacancy data.

The user may view the form interface in a selected language, but the operational data entered into the form remains as entered by the user.

### 2.4 Sensitive Text Boundary

Sensitive legal, consent, no-fee, complaint and trust text may still require human review before being treated as final localized legal text.

However, this sensitive review workflow must not block ordinary website usability in selected languages. If sensitive localized text is not approved, the system may fall back to the authoritative English text for that key while translating the rest of the page.

## 3. Implementation Scope

The next implementation step must:

1. audit all site pages for translation bundle loading;
2. ensure all pages use the shared translation runtime;
3. ensure the machine translation bundle is loaded before the runtime;
4. verify every language in the selector changes visible page UI;
5. add or update tests that check all approved languages;
6. rebuild and validate the runtime translation bundle.

## 4. Explicit Non-Goals

This task does not require:

1. manual perfection of localized copy;
2. browser-side calls to Google Translate;
3. automatic translation of user-entered form data;
4. replacement of English as the official language;
5. publication of unreviewed sensitive legal translation as authoritative text.

## 5. Acceptance Criteria

The task is complete when:

1. every public and application page loads the shared localization runtime correctly;
2. every page with visible static UI text can be translated through the language selector;
3. all approved languages are available and selectable;
4. changed English page text is covered by source sync and cache update workflow;
5. forms translate labels and UI messages while preserving user-entered values;
6. tests confirm language switching for representative public pages and form pages;
7. the translation runtime bundle is rebuilt and validation passes;
8. a final implementation report records the result and next maintenance rule.

## 6. Next Step

Proceed directly to implementation:

```text
CPG-BIZ-086 implementation - automatic Google machine localization across all pages and forms
```
