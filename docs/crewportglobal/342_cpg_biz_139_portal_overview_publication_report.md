# CPG-BIZ-139 - Portal Overview Public Publication Report

- Project: CrewPortGlobal.com
- Company: GTC INFORMATION TECHNOLOGY FZ-LLC
- Document type: Implementation and publication report
- Source task: `docs/crewportglobal/341_cpg_biz_139_portal_overview_stakeholder_publication_task.md`
- Version: 1.0
- Date: 2026-07-08
- Status: Implemented and published

## 1. Purpose

This report records the implementation of the consolidated CrewPortGlobal portal overview page for interested parties.

The page explains:

1. portal purpose;
2. participant roles;
3. implemented functional areas;
4. business-process task routing;
5. evidence and audit logic;
6. relationship with MLC 2006 and STCW principles;
7. contract, authority, agent and no-fee boundaries.

## 2. Published URL

Canonical public URL:

```text
https://crewportglobal.com/legal/platform-overview/
```

The page is published only in the public legal/documents section. Other pages may link to it, but must not duplicate the full text.

## 3. Implementation Scope

Runtime/source files:

| File | Change |
|---|---|
| `projects/crewportglobal/public/legal/platform-overview/index.html` | Added the public overview page with EN/RU page-local translations, shared header/navigation, document links and international references. |
| `projects/crewportglobal/public/legal/index.html` | Added the overview card to the documents hub. |
| `projects/crewportglobal/public/assets/crewportglobal-navigation.js` | Added `Portal Overview / Описание портала` to the shared documents navigation menu. |
| `projects/crewportglobal/scripts/deploy_public_live.sh` | Updated the stale `/register/` smoke-test marker from the old registration button text to the current `Create account and continue` text, so publication smoke checks stay valid. |

Documentation files:

| File | Change |
|---|---|
| `docs/crewportglobal/341_cpg_biz_139_portal_overview_stakeholder_publication_task.md` | Marked the task as implemented and published. |
| `docs/crewportglobal/342_cpg_biz_139_portal_overview_publication_report.md` | Added this implementation report. |
| `docs/crewportglobal/00_documentation_register.md` | Registered document 342 and updated the revision history. |
| `docs/crewportglobal/326_cpg_project_memory_handoff_refresh_after_chat_review.md` | Recorded the public publication checkpoint. |

## 4. Public Content Boundaries

The page intentionally does not duplicate:

1. Terms of Service;
2. Privacy Policy;
3. No Recruitment Fees Policy;
4. Seafarer Candidate Agreement;
5. Shipowner Service Terms;
6. Shipowner-Agent Framework Agreement;
7. Complaint Handling Procedure.

Instead, it summarizes the portal model and links to canonical public documents.

## 5. International Reference Boundary

The page links to:

1. ILO Maritime Labour Convention, 2006 overview;
2. ILO Maritime Labour Convention, 2006, as amended text;
3. IMO STCW Convention overview.

The page states that the overview is informational and is not legal advice.

## 6. Verification

Required checks for the implementation:

```bash
node --check projects/crewportglobal/public/assets/crewportglobal-navigation.js
npm run check:cpg-i18n
projects/crewportglobal/scripts/deploy_public_live.sh
curl -fsSI https://crewportglobal.com/legal/platform-overview/
curl -fsSL https://crewportglobal.com/legal/platform-overview/ | grep -F "CrewPortGlobal portal overview and operating standards"
curl -fsSL https://crewportglobal.com/legal/ | grep -F "/legal/platform-overview/"
```

## 7. Acceptance Result

The implementation is accepted when:

1. `/legal/platform-overview/` opens without 404;
2. `/legal/` links to the overview;
3. the shared documents menu contains the overview link;
4. English and Russian text are available through the page-local translation dictionary;
5. the public deploy finishes without i18n or live smoke failures;
6. the repository commit records the source and documentation changes.

## 8. Revision History

| Version | Date | Author | Changes |
|---|---|---|---|
| 1.0 | 2026-07-08 | GTC IT / AI Assistant | Initial public publication report for `/legal/platform-overview/` |
