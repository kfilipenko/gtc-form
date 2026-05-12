# CrewPortGlobal — CPG-I1 Language Selection Page Record

- Project: CrewPortGlobal
- Document owner: GTC INFORMATION TECHNOLOGY FZ-LLC
- Version: 0.1
- Status: Implementation record
- Classification: Internal
- Effective date: 2026-05-12
- Review date: 2026-06-12

## 1. Purpose

This document records the approved limited implementation step for the CrewPortGlobal language selection page and the top-right global language selector in the static frontend shell prototype.

## 2. Approval basis

This record is based on the project-owner-approved implementation step in GitHub issue #3 for creating:

1. a static language selection page;
2. a top-right global language selector in the main page header;
3. a browser-local language state for the whole website or application shell.

## 3. Created and updated frontend files

Created frontend files:

1. `projects/crewportglobal/app/frontend/index.html`
2. `projects/crewportglobal/app/frontend/language.html`
3. `projects/crewportglobal/app/frontend/styles.css`
4. `projects/crewportglobal/app/frontend/app.js`

Updated frontend file:

1. `projects/crewportglobal/app/frontend/README.md`

Updated documentation files:

1. `docs/crewportglobal/59_cpg_i1_language_selection_page_record.md`
2. `docs/crewportglobal/00_documentation_register.md`

## 4. Language selector placement

The implemented selector link is placed:

1. on the main page;
2. in the top-right corner;
3. at the far-right edge of the header or navigation area;
4. as a visible global website-level control.

The control shows the current language with a representative visual marker and links to the language selection page.

## 5. Language selection page

The language selection page was created as:

`projects/crewportglobal/app/frontend/language.html`

It presents the full approved language list with:

1. native language labels;
2. English reference labels;
3. representative visual markers;
4. clear current-language highlighting.

It also states that flags are visual markers only and that language names remain the actual identifiers.

## 6. Global language state

The selected language is stored locally in the browser using:

`crewportglobal.language`

The language state applies to:

1. `index.html`
2. `language.html`

The selected language is restored after page reload and is structured to remain inheritable by future static pages.

## 7. Translation dictionary

The prototype uses an in-browser static translation dictionary in `app.js`.

English remains the canonical source language.

Visible UI labels on both static pages are mapped through translation keys rather than through hardcoded UI behavior.

Sensitive legal, consent and no-fee references remain short placeholder copy and continue to require human review before any public release.

## 8. Architecture baseline preserved

The implementation preserves the approved architecture baseline:

1. CrewPortGlobal website application runtime: GTC1
2. CrewPortGlobal SQL database locality: GTC1
3. OpenClaw runtime / agent platform: GTC-AGENT

No backend, database, authentication, OpenClaw configuration or deployment work was introduced by this step.

## 9. What was not done

This implementation step did not create or perform:

1. backend handlers;
2. database connections or writes;
3. SQL execution;
4. authentication integration;
5. payment integration;
6. server configuration changes;
7. OpenClaw configuration changes;
8. deployment.

## 10. Validation results

The following validation points were confirmed:

1. `index.html` exists;
2. `language.html` exists;
3. `styles.css` exists;
4. `app.js` exists;
5. the header language selector is defined for the top-right far-right position;
6. the language page includes all required languages;
7. the language choice persists through the `crewportglobal.language` localStorage key;
8. reload restores the selected language;
9. the translation dictionary controls visible UI text on both static pages;
10. the documentation register references document 59.

## 11. Final status

Language selection page and top-right global language selector are ready for project-owner review. Backend, database and deployment work were not performed.

## 12. Revision history

| Version | Date | Author | Changes |
| --- | --- | --- | --- |
| 0.1 | 2026-05-12 | GTC IT / AI Assistant | Initial record for the approved language selection page and top-right global language selector implementation step |