# CrewPortGlobal — Limited GitHub Issue Drafts for CPG-I1-001, CPG-I1-002 and CPG-I1-004

- Scope: planning-only limited GitHub draft preparation set
- Status rule: every item in this file remains `Draft preparation only`

## 1. Baseline

ADR 48 is the approved architecture baseline for this limited planning set.

Baseline assumptions:

1. CrewPortGlobal website application runtime locality: GTC1;
2. CrewPortGlobal SQL database locality: GTC1;
3. OpenClaw runtime and assistive agent platform locality: GTC-AGENT;
4. OpenClaw use is limited to assisted operator support through controlled procedures.

## 2. Limited Draft Set

| Order | Ticket ID | Title | Source repository draft | Selection note | Status |
| --- | --- | --- | --- | --- | --- |
| 1 | CPG-I1-001 | Website application shell planning | `projects/crewportglobal/planning/issues/CPG-I1-001_website_application_shell_planning.md` | selected for limited package | Draft preparation only |
| 2 | CPG-I1-002 | Seafarer registration route planning | `projects/crewportglobal/planning/issues/CPG-I1-002_seafarer_registration_route_planning.md` | selected for limited package | Draft preparation only |
| 3 | CPG-I1-004 | Consent capture planning | `projects/crewportglobal/planning/issues/CPG-I1-004_consent_capture_planning.md` | selected for limited package | Draft preparation only |

## 3. Postponed Items

| Ticket ID | Title | Postponement note |
| --- | --- | --- |
| CPG-I1-003 | Seafarer profile form planning | postponed from limited package |
| CPG-I1-005 | No Recruitment Fees acknowledgement planning | postponed from limited package |
| CPG-I1-006 | Document metadata capture planning | postponed from limited package |
| CPG-I1-007 | Review queue planning | postponed from limited package |
| CPG-I1-008 | Operator console planning | postponed from limited package |
| CPG-I1-009 | OpenClaw assist endpoint planning | postponed from limited package |
| CPG-I1-010 | Audit event logging planning | postponed from limited package |
| CPG-I1-011 | Access-control planning | postponed from limited package |
| CPG-I1-012 | Prototype test strategy planning | postponed from limited package |

Full 12-issue creation remains postponed.

## 4. Control Boundaries

This planning file does not authorize:

1. GitHub issue creation;
2. writing code;
3. executing SQL;
4. touching any database;
5. changing auth;
6. changing Stripe;
7. changing nginx;
8. changing OpenClaw configuration;
9. deployment.

## 5. Final Control Statement

Limited GitHub issue draft planning set is prepared for project-owner review only.

Full 12-issue creation remains postponed.

Implementation remains not approved.