# CrewPortGlobal — Limited GitHub Issue Draft Package for CPG-I1-001, CPG-I1-002 and CPG-I1-004

- Project: CrewPortGlobal
- Document owner: GTC INFORMATION TECHNOLOGY FZ-LLC
- Version: 0.1
- Status: Draft limited package
- Classification: Internal
- Effective date: 2026-05-10
- Review date: 2026-06-10

## 1. Purpose

This document records the limited GitHub issue draft preparation package approved for the first selected Increment 1 planning tasks only.

This package is limited to CPG-I1-001, CPG-I1-002 and CPG-I1-004.

## 2. Approved Baseline

ADR 48 is approved as the architecture baseline for Increment 1 planning.

The approved baseline for this limited package is:

1. CrewPortGlobal website application runtime locality: GTC1;
2. CrewPortGlobal SQL database locality: GTC1;
3. OpenClaw runtime and agent platform: GTC-AGENT;
4. OpenClaw usage: assisted operator support only;
5. `n8n`: excluded.

Implementation remains not approved.

## 3. Approved Limited Scope

Only the following repository issue drafts are approved for limited GitHub issue draft preparation:

| Ticket ID | Title | Source repository draft | Limited package status |
| --- | --- | --- | --- |
| CPG-I1-001 | Website application shell planning | `projects/crewportglobal/planning/issues/CPG-I1-001_website_application_shell_planning.md` | Included |
| CPG-I1-002 | Seafarer registration route planning | `projects/crewportglobal/planning/issues/CPG-I1-002_seafarer_registration_route_planning.md` | Included |
| CPG-I1-004 | Consent capture planning | `projects/crewportglobal/planning/issues/CPG-I1-004_consent_capture_planning.md` | Included |

The omission of CPG-I1-003 from this limited package is intentional and approved as part of the current restricted scope.

## 4. Postponed Scope

Full 12-issue creation is postponed.

The following tickets are explicitly postponed from the current limited package:

1. CPG-I1-003;
2. CPG-I1-005;
3. CPG-I1-006;
4. CPG-I1-007;
5. CPG-I1-008;
6. CPG-I1-009;
7. CPG-I1-010;
8. CPG-I1-011;
9. CPG-I1-012.

## 5. Package Inputs

This limited package is based on:

- `docs/crewportglobal/45_increment_1_individual_issue_drafts_index.md`
- `docs/crewportglobal/46_increment_1_individual_issue_drafts_owner_review.md`
- `docs/crewportglobal/47_increment_1_github_issue_creation_approval_package.md`
- `docs/crewportglobal/48_architecture_decision_gtc1_app_gtc_agent_openclaw.md`
- `projects/crewportglobal/planning/issues/CPG-I1-001_website_application_shell_planning.md`
- `projects/crewportglobal/planning/issues/CPG-I1-002_seafarer_registration_route_planning.md`
- `projects/crewportglobal/planning/issues/CPG-I1-004_consent_capture_planning.md`
- `projects/crewportglobal/planning/limited_github_issue_drafts_001_002_004.md`

## 6. Restrictions

While preparing this limited package:

1. no GitHub issues were created;
2. no code was written;
3. no SQL was executed;
4. no database was touched;
5. no auth changes were made;
6. no Stripe changes were made;
7. no nginx changes were made;
8. no OpenClaw configuration changes were made;
9. no `n8n` workflows were created;
10. no deployment was performed.

## 7. Administrative Boundary

This document authorizes only limited GitHub issue draft preparation for the three selected tickets.

It does not authorize:

1. actual GitHub issue creation;
2. expansion back to the full 12-ticket package;
3. implementation work;
4. infrastructure changes;
5. runtime changes on GTC1 or GTC-AGENT.

## 8. Recommended Next Administrative Action

If the project owner wants to proceed within the limited scope:

1. prepare GitHub draft title and body text only for CPG-I1-001, CPG-I1-002 and CPG-I1-004;
2. keep all other Increment 1 tickets postponed;
3. preserve ADR 48 as the runtime and architecture baseline;
4. keep the limited set in draft state until separate approval exists for any actual issue creation or implementation action.

## 9. Final Control Statement

Limited GitHub issue draft package for CPG-I1-001, CPG-I1-002 and CPG-I1-004 is ready for project-owner review.

Full 12-issue creation remains postponed.

Implementation remains not approved.