# CrewPortGlobal — Registration Automation Technical Task Decomposition

- Project: CrewPortGlobal
- Document owner: GTC INFORMATION TECHNOLOGY FZ-LLC
- Version: 0.1
- Status: Planning baseline
- Classification: Internal
- Effective date: 2026-05-10
- Review date: 2026-06-10

## 1. Purpose

This document decomposes the approved registration automation implementation baseline into technical planning workstreams for the first increment.

This is a planning-only decomposition package and does not authorize implementation.

## 2. Planning Inputs

This decomposition package builds on:

- `docs/crewportglobal/35_registration_automation_readiness_plan.md`
- `docs/crewportglobal/38_registration_automation_re_review.md`
- `docs/crewportglobal/39_registration_automation_implementation_plan.md`
- `docs/crewportglobal/40_registration_automation_implementation_plan_review.md`
- `projects/crewportglobal/workflows/registration_flow_spec.md`
- `projects/crewportglobal/workflows/category_onboarding_matrix.md`

## 3. Hard Constraints

The following constraints remain mandatory:

1. do not implement automation;
2. do not execute SQL;
3. do not touch any database;
4. do not change global auth schema;
5. do not change Stripe workflow;
6. do not change nginx;
7. do not modify OpenClaw configuration.

Implementation remains not approved.

## 4. Entry Condition

Document 40 confirmed that the implementation plan is ready for technical task decomposition.

That means this document may define:

- workstreams;
- task groups;
- planning deliverables;
- sequencing dependencies;
- review boundaries for the first increment.

It does not permit coding, rollout, SQL execution or live-environment changes.

## 5. Increment 1 Baseline

Increment 1 is limited to a website-application prototype for seafarer registration only, with no payment, no candidate submission, no matching automation, no external KYC provider, no production DB writes, and only planning-level OpenClaw assistance for operator support.

This means Increment 1 is intentionally narrow and excludes all business-client, operator-side approval implementation and monetization flows from execution scope.

## 6. Increment 1 Core Objectives

The first increment is intended to prepare a decomposed planning package for:

1. public seafarer registration entry;
2. bounded internal service-layer planning;
3. consent and no-fee acknowledgement planning;
4. document metadata intake planning;
5. human-review queue planning;
6. operator-support planning with assistive OpenClaw touchpoints;
7. audit and access-control planning.

## 7. Workstream Decomposition

| Workstream | Increment 1 objective | Planning tasks | Explicit exclusions |
| --- | --- | --- | --- |
| Website application shell | Define the prototype shell for public seafarer onboarding | map page states, routing states, registration shell responsibilities, progress-state presentation, error-state placeholders | no production release, no auth redesign, no nginx changes |
| API boundary planning | Define planning-only service boundaries for seafarer registration | identify endpoint groups, request-response boundaries, validation ownership, handoff points between UI and service modules | no implemented endpoints, no live integrations, no external provider onboarding |
| Service-layer module tasks | Split the seafarer path into bounded internal modules | decompose intake, consent, document metadata, verification-event seeding, readiness evaluation and audit responsibilities | no code, no DB execution, no new infrastructure dependency |
| Seafarer registration UI flow | Define the user-facing path for seafarer intake | map draft, consent, document, review-pending and completion states; identify field groups and handoff checkpoints | no candidate submission, no hiring flow, no matching automation |
| Consent and no-fee acknowledgement | Define the planning contract for required consents | isolate privacy acknowledgement, no-fee acknowledgement, verification consent and submission gating rules | no payment flow, no upsell flow, no billable seafarer step |
| Document metadata upload planning | Define metadata and completeness handling for seafarer evidence intake | list metadata fields, upload-state planning, completeness checks, operator-visible submission status | no storage implementation, no provider integration, no DB writes |
| Verification queue and human review console | Define operator-side planning for review intake | identify queue states, review actions, reject or suspend outcomes, escalation points and material review gates | no operator-console implementation, no approval bypass |
| OpenClaw-assisted operator support | Define assistive support touchpoints for operators | map summary generation, completeness hints, case-prep assistance and recommendation drafting surfaces | no autonomous approval, no OpenClaw configuration changes, no decision authority |
| Audit or event logging | Define planning-level audit and decision trace responsibilities | identify event groups, audit checkpoints, operator action trace points and review-state logging requirements | no logging implementation, no production telemetry rollout |
| Security and access-control | Define the planning scope for access boundaries | map public intake boundary, operator access boundary, internal-only admin boundary and review-permission questions | no global auth changes, no permission rollout |
| Test strategy | Define the first planning-only validation strategy | outline review scenarios, state-transition checks, no-fee preservation checks, human-review gate checks and negative-path cases | no automated test implementation, no DB-backed test runs |
| Deployment or environment planning | Define what environment planning will later be needed | identify prototype environment assumptions, separation from production, config-boundary questions and approval prerequisites | no deployment, no nginx changes, no production writes |

## 8. Detailed Task Groups by Workstream

### 8.1 Website application shell

Task groups:

1. define page or route surfaces for the seafarer prototype;
2. define intake-state transitions visible to the user;
3. define progress, validation and blocked-state messaging;
4. define the handoff point from public submission to human review.

### 8.2 API boundary planning

Task groups:

1. define planning-only endpoint groups for intake, consent, document metadata and status retrieval;
2. define validation ownership between UI and service layer;
3. define idempotency and retry questions for prototype scope;
4. define the non-production boundary for any future endpoint testing.

### 8.3 Service-layer module tasks

Task groups:

1. registration intake module planning;
2. consent capture module planning;
3. document metadata handling module planning;
4. verification-event orchestration planning;
5. readiness and handoff planning;
6. audit trace planning.

### 8.4 Seafarer registration UI flow

Task groups:

1. define field groups for seafarer intake;
2. define state transitions from `draft` through `pending_human_review`;
3. define incomplete-document and blocked-submission states;
4. define success state as review-pending rather than activated-placement outcome.

### 8.5 Consent and no-fee acknowledgement

Task groups:

1. define mandatory acknowledgement copy surfaces;
2. define no-fee gating before submission;
3. define consent capture ordering;
4. define audit expectations for acknowledgement capture.

### 8.6 Document metadata upload planning

Task groups:

1. define metadata categories for uploaded documents;
2. define completeness rules for planning review;
3. define operator-visible missing-item summaries;
4. define non-approval behavior for incomplete submissions.

### 8.7 Verification queue and human review console

Task groups:

1. define queue-entry conditions;
2. define review actions and allowed outcomes;
3. define escalation path for unclear or incomplete evidence;
4. define review visibility for audit purposes.

### 8.8 OpenClaw-assisted operator support

Task groups:

1. define where summary assistance may appear;
2. define where completeness suggestions may appear;
3. define how recommendation drafts remain human-reviewable;
4. define logging expectations for assistive output consumption.

### 8.9 Audit or event logging

Task groups:

1. define intake event groups;
2. define consent capture events;
3. define document completeness events;
4. define operator review decision events;
5. define review-state change trace requirements.

### 8.10 Security and access-control

Task groups:

1. define public versus internal boundary assumptions;
2. define operator-only actions for review and approval states;
3. define admin-provisioning questions that remain out of Increment 1 execution scope;
4. define approval prerequisites for any future implementation task.

### 8.11 Test strategy

Task groups:

1. define scenario coverage for happy path and negative path;
2. define no-fee rule preservation checks;
3. define human-review gate checks;
4. define prohibited-capability checks, including no payment and no candidate submission scope.

### 8.12 Deployment or environment planning

Task groups:

1. define prototype environment assumptions;
2. define separation from production data handling;
3. define approval gates before any future deployment work;
4. define environment questions that must be resolved before implementation review.

## 9. Sequencing Dependencies

Recommended planning order:

1. website application shell and seafarer UI flow;
2. API boundary planning and service-layer module tasks;
3. consent and no-fee acknowledgement planning;
4. document metadata upload planning;
5. verification queue and human review console planning;
6. audit or event logging planning;
7. security and access-control planning;
8. OpenClaw-assisted operator support planning;
9. test strategy;
10. deployment or environment planning.

This order keeps public-flow definition ahead of service and operator details, while preserving all approval boundaries.

## 10. Increment 1 Out of Scope

The following items are explicitly out of Increment 1 scope:

1. payment collection or payment activation;
2. candidate submission to shipowners;
3. matching automation;
4. external KYC or verification-provider integration;
5. production database writes;
6. business-client onboarding implementation;
7. admin-console rollout;
8. OpenClaw autonomous decisions.

## 11. Stop Conditions

The decomposition package must be treated as invalid if it introduces any of the following:

1. implementation work instead of planning tasks;
2. SQL execution or database-touch assumptions;
3. changes to global auth schema;
4. changes to Stripe workflow;
5. nginx changes;
6. OpenClaw configuration changes;
7. candidate submission or payment scope inside Increment 1;
8. production DB write assumptions.

## 12. Review Questions for Project Owner

Project-owner review should confirm:

1. the Increment 1 boundary remains seafarer-only;
2. the prototype remains non-monetized and non-deployment-authorizing;
3. the planned service decomposition is sufficient for later task writing;
4. the human-review queue remains mandatory;
5. OpenClaw remains assistive only;
6. no forbidden dependency or execution drift has been introduced.

## 13. Final Control Statement

Technical task decomposition is ready for project-owner review. Implementation remains not approved.