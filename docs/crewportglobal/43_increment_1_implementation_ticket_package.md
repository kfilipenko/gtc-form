# CrewPortGlobal — Increment 1 Implementation Ticket Package

- Project: CrewPortGlobal
- Document owner: GTC INFORMATION TECHNOLOGY FZ-LLC
- Version: 0.1
- Status: Planning baseline
- Classification: Internal
- Effective date: 2026-05-10
- Review date: 2026-06-10

## 1. Purpose

This document defines the first draft ticket package for Increment 1 of CrewPortGlobal registration automation planning.

This package is limited to ticket preparation and does not authorize implementation.

## 2. Source Documents

This ticket package is based on:

- `docs/crewportglobal/39_registration_automation_implementation_plan.md`
- `docs/crewportglobal/40_registration_automation_implementation_plan_review.md`
- `docs/crewportglobal/41_registration_automation_technical_task_decomposition.md`
- `docs/crewportglobal/42_registration_automation_decomposition_owner_review.md`
- `projects/crewportglobal/workflows/registration_flow_spec.md`
- `projects/crewportglobal/workflows/category_onboarding_matrix.md`

## 3. Hard Constraints

The following rules remain mandatory for this package:

1. do not write code;
2. do not execute SQL;
3. do not touch any database;
4. do not change auth;
5. do not change Stripe;
6. do not change nginx;
7. do not change OpenClaw configuration;
8. do not perform deployment.

Implementation remains not approved.

## 4. Increment 1 Boundary

Increment 1 remains limited to a seafarer-only website prototype planning scope.

The package therefore excludes:

1. payment;
2. candidate submission;
3. matching automation;
4. external KYC provider integration;
5. production DB writes;
6. business-client onboarding implementation;
7. autonomous OpenClaw decisions.

## 5. Ticket Package Overview

All tickets in this package must remain in `Draft` status.

| Ticket ID | Title | Planning objective | Explicit exclusions | Status |
| --- | --- | --- | --- | --- |
| CPG-I1-001 | Website application shell planning | Define the prototype shell, route surfaces and page-state model for seafarer onboarding | no production release, no code, no nginx changes | Draft |
| CPG-I1-002 | Seafarer registration route planning | Define planning-only route flow, route-state transitions and user-visible handoff points | no candidate submission, no matching automation, no deployment | Draft |
| CPG-I1-003 | Seafarer profile form planning | Define field groups, validation ownership questions and draft-to-review form states | no DB writes, no auth redesign, no implementation | Draft |
| CPG-I1-004 | Consent capture planning | Define planning-only consent capture sequence and gating logic | no payment flow, no live consent storage, no code | Draft |
| CPG-I1-005 | No Recruitment Fees acknowledgement planning | Define acknowledgement placement, gating and audit expectations for the seafarer path | no billable seafarer step, no upsell flow, no Stripe changes | Draft |
| CPG-I1-006 | Document metadata capture planning | Define metadata fields, completeness checks and missing-item summaries | no file-storage implementation, no provider integration, no production writes | Draft |
| CPG-I1-007 | Review queue planning | Define queue-entry conditions, review states and operator handoff points | no review-engine implementation, no approval bypass, no DB execution | Draft |
| CPG-I1-008 | Operator console planning | Define planning scope for internal operator views, actions and audit visibility | no console rollout, no auth changes, no deployment | Draft |
| CPG-I1-009 | OpenClaw assist endpoint planning | Define planning-only assist surfaces for summaries, completeness hints and recommendation drafting | no autonomous decisions, no OpenClaw configuration changes, no new runtime dependency | Draft |
| CPG-I1-010 | Audit event logging planning | Define intake, consent, review and state-change event groups for future implementation planning | no telemetry rollout, no logging implementation, no production writes | Draft |
| CPG-I1-011 | Access-control planning | Define planning-level public, operator and admin boundary assumptions for Increment 1 | no auth changes, no permission rollout, no implementation | Draft |
| CPG-I1-012 | Prototype test strategy planning | Define planning-only validation scenarios, negative-path checks and scope-preservation checks | no automated test implementation, no DB-backed tests, no deployment | Draft |

## 6. Ticket Details

### 6.1 CPG-I1-001 | Website application shell planning

Planning focus:

1. route shell and page-state map;
2. progress and error-state structure;
3. submission-to-review handoff surface.

### 6.2 CPG-I1-002 | Seafarer registration route planning

Planning focus:

1. entry route definition;
2. draft, consent, document and review-pending route states;
3. blocked-state routing behavior.

### 6.3 CPG-I1-003 | Seafarer profile form planning

Planning focus:

1. seafarer field groups;
2. validation boundary assumptions;
3. incomplete or invalid submission handling.

### 6.4 CPG-I1-004 | Consent capture planning

Planning focus:

1. privacy and verification consent ordering;
2. consent gating before handoff;
3. review visibility requirements for captured consent state.

### 6.5 CPG-I1-005 | No Recruitment Fees acknowledgement planning

Planning focus:

1. acknowledgement wording placement;
2. mandatory gating before submission;
3. audit-trace expectation for acknowledgement capture.

### 6.6 CPG-I1-006 | Document metadata capture planning

Planning focus:

1. metadata category set;
2. completeness and missing-item rules;
3. operator-visible document-status planning.

### 6.7 CPG-I1-007 | Review queue planning

Planning focus:

1. queue-entry conditions;
2. review state set;
3. reject, suspend and escalation paths.

### 6.8 CPG-I1-008 | Operator console planning

Planning focus:

1. internal operator surfaces;
2. permitted review actions;
3. audit visibility and case-handling assumptions.

### 6.9 CPG-I1-009 | OpenClaw assist endpoint planning

Planning focus:

1. assistive summary surfaces;
2. completeness-hint surfaces;
3. recommendation-draft review requirements.

### 6.10 CPG-I1-010 | Audit event logging planning

Planning focus:

1. intake events;
2. consent and acknowledgement events;
3. review-state and decision-trace events.

### 6.11 CPG-I1-011 | Access-control planning

Planning focus:

1. public versus internal boundary assumptions;
2. operator-only action boundaries;
3. admin boundary questions kept out of implementation scope.

### 6.12 CPG-I1-012 | Prototype test strategy planning

Planning focus:

1. happy-path and negative-path scenarios;
2. no-fee and no-payment scope checks;
3. human-review gate preservation checks.

## 7. Sequencing Guidance

Recommended initial ticket-writing sequence:

1. CPG-I1-001
2. CPG-I1-002
3. CPG-I1-003
4. CPG-I1-004
5. CPG-I1-005
6. CPG-I1-006
7. CPG-I1-007
8. CPG-I1-008
9. CPG-I1-009
10. CPG-I1-010
11. CPG-I1-011
12. CPG-I1-012

This order keeps public-flow definition ahead of operator, assistive and validation tasks.

## 8. Stop Conditions

This ticket package becomes invalid if any ticket introduces:

1. implementation work instead of planning;
2. SQL execution or database-touch assumptions;
3. auth, Stripe or nginx changes;
4. OpenClaw configuration changes;
5. an unapproved external dependency;
6. payment, candidate submission or matching automation inside Increment 1;
7. deployment activity.

## 9. Final Control Statement

Increment 1 ticket package is ready for project-owner review. Implementation remains not approved.