# CrewPortGlobal — Registration Automation Implementation Plan

- Project: CrewPortGlobal
- Document owner: GTC INFORMATION TECHNOLOGY FZ-LLC
- Version: 0.1
- Status: Planning baseline
- Classification: Internal
- Effective date: 2026-05-10
- Review date: 2026-06-10

## 1. Purpose

This document defines the Stage 1 implementation-planning baseline for CrewPortGlobal registration automation.

It translates the approved planning package into an implementation-planning architecture without authorizing implementation.

## 2. Scope

This document covers only implementation planning for:

- website-side registration orchestration;
- internal service modules;
- schema write boundaries inside `crewport`;
- operator and admin console touchpoints;
- OpenClaw-assisted operator or agent support.

This document does not authorize implementation.

## 3. Hard Constraints

Hard constraints remain unchanged:

1. SQL must not be executed.
2. No database may be touched.
3. Global auth schema must not be changed.
4. Current Stripe workflow must not be changed.
5. Nginx must not be changed.
6. Implementation remains not approved.

## 4. Planning Inputs

This implementation plan builds on:

- `docs/crewportglobal/35_registration_automation_readiness_plan.md`
- `docs/crewportglobal/36_registration_automation_planning_review.md`
- `docs/crewportglobal/37_registration_automation_fix_plan.md`
- `docs/crewportglobal/38_registration_automation_re_review.md`
- `projects/crewportglobal/workflows/registration_flow_spec.md`
- `projects/crewportglobal/workflows/category_onboarding_matrix.md`
- `projects/crewportglobal/db/002_crewport_schema.sql`
- `projects/crewportglobal/db/003_crewport_indexes.sql`
- `projects/crewportglobal/db/004_crewport_views.sql`

## 5. Entry Condition for This Plan

The current package is already marked ready for implementation planning.

That means this document may define:

- architecture boundaries;
- service responsibilities;
- workflow orchestration responsibilities;
- operator console responsibilities;
- human-review control points.

It does not mean coding or rollout is approved.

## 6. Stage 1 Architecture Principles

The Stage 1 implementation plan must preserve these principles:

1. the public registration surface belongs to the CrewPortGlobal website application;
2. registration logic is implemented through internal service modules owned by the project;
3. data writes stay inside the CrewPortGlobal schema boundary;
4. operator review remains mandatory at defined human checkpoints;
5. assistive AI may support operators, but may not replace approval authority.

## 7. Target Stage 1 Architecture

The target Stage 1 architecture is:

1. CrewPortGlobal website application
2. internal service modules
3. CrewPortGlobal database schema
4. operator or admin console
5. OpenClaw-assisted agent support

This is the planning sequence for interaction and responsibility flow, not a deployment diagram.

## 8. Dedicated Website Application Layer

The website application is the primary public-facing system for:

- category selection;
- onboarding intake;
- consent capture;
- document upload initiation;
- registration progress display;
- handoff into operator review queues.

The website application owns public interaction logic and must not defer its core registration orchestration to an external workflow product.

## 9. Internal Service Modules Layer

Internal service modules are the implementation-planning unit for business logic.

The service layer should be planned around bounded modules such as:

1. registration intake module;
2. consent and policy acknowledgement module;
3. document intake and completeness module;
4. role and category routing module;
5. verification event orchestration module;
6. readiness evaluation module;
7. operator review queue module;
8. audit and decision trace module.

These modules are internal application responsibilities, not separate public products.

## 10. Database Schema Boundary

The implementation plan must stay within the existing CrewPortGlobal schema boundary.

Write targets remain mapped to the existing planning package, including:

- `physical_persons`;
- `user_roles`;
- `seafarers`;
- `seafarer_documents`;
- `business_clients`;
- `company_representatives`;
- `representative_documents`;
- `business_documents`;
- `vessels`;
- `business_client_vessels`;
- `consent_records`;
- `verification_events`.

No new database dependency is introduced by this plan.

## 11. Operator and Admin Console Layer

The operator or admin console is the internal control surface for:

- review queues;
- completeness checks;
- verification review;
- representative and company approval handling;
- exception handling;
- suspension or rejection actions;
- audit visibility.

The console remains human-controlled.

## 12. OpenClaw-Assisted Support Layer

OpenClaw is planned only as an assistive layer for human operators or internal agents where applicable.

Allowed assistive use cases include:

1. guided onboarding support;
2. document completeness checks;
3. review queue summaries;
4. operator support during case handling;
5. recommendation drafting for human review.

OpenClaw is not planned as a final decision authority.

## 13. Prohibited Autonomous Decisions

The implementation plan must explicitly prohibit autonomous OpenClaw decisions about:

1. employment or placement outcomes;
2. verification approval;
3. candidate submission to shipowners;
4. payment approval or billing activation;
5. bypass of mandatory human review.

Any assistive output must remain reviewable and overridable by a human operator.

## 14. Category Flow Implementation Boundaries

The implementation plan should preserve the current category rules:

1. seafarer path must preserve the no-fee rule;
2. individual non-seafarer path remains a limited project account;
3. business categories follow bounded company and representative onboarding flows;
4. admin access remains internal-only and manually provisioned.

No category may bypass its defined handoff criteria or human checkpoints.

## 15. Stage 1 State and Handoff Handling

Implementation planning should assume the shared Stage 1 workflow states already defined in the planning package:

- `draft`;
- `pending_consent`;
- `pending_documents`;
- `pending_human_review`;
- `active_limited`;
- `active_verified`;
- `suspended`;
- `rejected`.

Internal service modules should be planned to enforce these transitions consistently across website, service and operator layers.

## 16. Human Review and Approval Gates

The implementation plan must preserve the mandatory human-review checkpoints already defined in the planning package, including:

1. seafarer profile verification;
2. document verification;
3. business client KYB approval;
4. representative authority approval;
5. vessel verification;
6. crew request approval before matching;
7. candidate submission to shipowner;
8. complaint escalation.

These gates are architectural control points, not optional operational preferences.

## 17. Delivery Planning Units

The implementation-planning work should be split into these units:

1. website intake and onboarding UI scope;
2. service-module responsibilities and interfaces;
3. review queue and operator console scope;
4. audit trail and decision logging;
5. OpenClaw-assisted support touchpoints;
6. human-approval gate enforcement.

This breakdown is intended for implementation planning review, not for immediate delivery.

## 18. Risks and Stop Conditions

The following conditions must be treated as planning errors or stop conditions:

1. the plan introduces a dependency that changes global auth behavior;
2. the plan introduces a dependency that changes the current Stripe workflow;
3. the plan assumes autonomous approval without human review;
4. the plan bypasses bounded category rules;
5. the plan introduces an unapproved external dependency.

If any of these conditions appears, the implementation plan must be corrected before review approval.

## 19. Review Checklist

Before this implementation plan is accepted for further review, reviewers should confirm that:

1. the website application remains the primary public onboarding surface;
2. internal service modules carry the core registration logic;
3. schema boundaries remain inside the CrewPortGlobal project scope;
4. operator and admin console responsibilities are explicit;
5. OpenClaw remains assistive and non-authoritative;
6. human review gates remain mandatory;
7. no prohibited dependency drift has been introduced.

## 20. Architecture Control Statement

CrewPortGlobal Stage 1 must be planned as a dedicated website application with internal service modules and OpenClaw-assisted operator or agent workflows where applicable.

## 21. Final Control Statement

Registration automation implementation plan is ready for review.
Implementation remains not approved.