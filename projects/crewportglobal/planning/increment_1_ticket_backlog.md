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

| Order | Ticket ID | Title | Dependency note | Status |
| --- | --- | --- | --- | --- |
| 1 | CPG-I1-001 | Website application shell planning | baseline route and page-shell definition | Draft |
| 2 | CPG-I1-002 | Seafarer registration route planning | depends on shell planning | Draft |
| 3 | CPG-I1-003 | Seafarer profile form planning | depends on route planning baseline | Draft |
| 4 | CPG-I1-004 | Consent capture planning | depends on route and form planning | Draft |
| 5 | CPG-I1-005 | No Recruitment Fees acknowledgement planning | depends on consent planning | Draft |
| 6 | CPG-I1-006 | Document metadata capture planning | depends on form and route planning | Draft |
| 7 | CPG-I1-007 | Review queue planning | depends on document and consent planning | Draft |
| 8 | CPG-I1-008 | Operator console planning | depends on review queue planning | Draft |
| 9 | CPG-I1-009 | OpenClaw assist endpoint planning | depends on review queue and console planning | Draft |
| 10 | CPG-I1-010 | Audit event logging planning | depends on consent, document and review planning | Draft |
| 11 | CPG-I1-011 | Access-control planning | depends on console and route boundaries | Draft |
| 12 | CPG-I1-012 | Prototype test strategy planning | depends on all prior planning slices | Draft |

## 3. Final Control Statement

Increment 1 ticket backlog is prepared for planning review only.
Implementation remains not approved.