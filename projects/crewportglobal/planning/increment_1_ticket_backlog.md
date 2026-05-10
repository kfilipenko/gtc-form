# CrewPortGlobal — Increment 1 Ticket Backlog

- Scope: planning-only backlog for Increment 1 seafarer-only prototype
- Status rule: every ticket in this backlog remains `Draft`

## 1. Backlog Rules

This backlog is for ticket preparation only.

It does not authorize:

1. writing code;
2. executing SQL;
3. touching any database;
4. changing auth;
5. changing Stripe;
6. changing nginx;
7. changing OpenClaw configuration;
8. creating `n8n` workflows;
9. deployment.

## 2. Ticket Backlog

| Order | Ticket ID | Title | Issue draft file | Dependency note | Status |
| --- | --- | --- | --- | --- | --- |
| 1 | CPG-I1-001 | Website application shell planning | `projects/crewportglobal/planning/issues/CPG-I1-001_website_application_shell_planning.md` | baseline route and page-shell definition | Draft |
| 2 | CPG-I1-002 | Seafarer registration route planning | `projects/crewportglobal/planning/issues/CPG-I1-002_seafarer_registration_route_planning.md` | depends on shell planning | Draft |
| 3 | CPG-I1-003 | Seafarer profile form planning | `projects/crewportglobal/planning/issues/CPG-I1-003_seafarer_profile_form_planning.md` | depends on route planning baseline | Draft |
| 4 | CPG-I1-004 | Consent capture planning | `projects/crewportglobal/planning/issues/CPG-I1-004_consent_capture_planning.md` | depends on route and form planning | Draft |
| 5 | CPG-I1-005 | No Recruitment Fees acknowledgement planning | `projects/crewportglobal/planning/issues/CPG-I1-005_no_recruitment_fees_acknowledgement_planning.md` | depends on consent planning | Draft |
| 6 | CPG-I1-006 | Document metadata capture planning | `projects/crewportglobal/planning/issues/CPG-I1-006_document_metadata_capture_planning.md` | depends on form and route planning | Draft |
| 7 | CPG-I1-007 | Review queue planning | `projects/crewportglobal/planning/issues/CPG-I1-007_review_queue_planning.md` | depends on document and consent planning | Draft |
| 8 | CPG-I1-008 | Operator console planning | `projects/crewportglobal/planning/issues/CPG-I1-008_operator_console_planning.md` | depends on review queue planning | Draft |
| 9 | CPG-I1-009 | OpenClaw assist endpoint planning | `projects/crewportglobal/planning/issues/CPG-I1-009_openclaw_assist_endpoint_planning.md` | depends on review queue and console planning | Draft |
| 10 | CPG-I1-010 | Audit event logging planning | `projects/crewportglobal/planning/issues/CPG-I1-010_audit_event_logging_planning.md` | depends on consent, document and review planning | Draft |
| 11 | CPG-I1-011 | Access-control planning | `projects/crewportglobal/planning/issues/CPG-I1-011_access_control_planning.md` | depends on console and route boundaries | Draft |
| 12 | CPG-I1-012 | Prototype test strategy planning | `projects/crewportglobal/planning/issues/CPG-I1-012_prototype_test_strategy_planning.md` | depends on all prior planning slices | Draft |

## 3. Final Control Statement

Increment 1 ticket backlog is prepared for planning review only.
Implementation remains not approved.