# CrewPortGlobal — CPG-I1-002 Seafarer Registration Route Architecture Plan

- Project: CrewPortGlobal
- Document owner: GTC INFORMATION TECHNOLOGY FZ-LLC
- Version: 0.1
- Status: Route architecture planning baseline
- Classification: Internal
- Effective date: 2026-05-11
- Review date: 2026-06-11
- Related issue: GitHub issue #4 — CPG-I1-002

## 1. Purpose

This document defines the planning-only architecture for the CPG-I1-002 seafarer registration route.

Its purpose is to describe the route and state model for the Increment 1 seafarer registration contour without authorizing runtime route implementation.

## 2. Source Documents Reviewed

This architecture plan builds on the following reviewed inputs:

- `docs/crewportglobal/39_registration_automation_implementation_plan.md`
- `docs/crewportglobal/41_registration_automation_technical_task_decomposition.md`
- `docs/crewportglobal/48_architecture_decision_gtc1_app_gtc_agent_openclaw.md`
- `docs/crewportglobal/49_limited_github_issue_draft_package_001_002_004.md`
- `docs/crewportglobal/50_limited_github_issues_001_002_004_review.md`
- `docs/crewportglobal/51_cpg_i1_001_application_shell_implementation_plan.md`
- `docs/crewportglobal/54_cpg_i1_001_frontend_shell_placeholder_plan.md`
- `docs/crewportglobal/55_cpg_i1_001_frontend_shell_placeholder_owner_review.md`
- `projects/crewportglobal/planning/issues/CPG-I1-002_seafarer_registration_route_planning.md`
- `projects/crewportglobal/planning/issues/CPG-I1-004_consent_capture_planning.md`

## 3. Route Architecture Model

The planned seafarer registration route is a controlled registration contour rather than a simple field-entry form.

The proposed planning-only route architecture is:

```text
Shell Entry
  ↓
Seafarer Registration Start
  ↓
Draft Intake
  ↓
Consent Gate
  ↓
Document Metadata Step
  ↓
Completeness Check
  ↓
Pending Human Review
```

The route model is planning-only and must not be interpreted as approved runtime routing.

## 4. Planned Route States

The approved planning state set for Increment 1 is:

1. `not_started`
2. `draft`
3. `pending_consent`
4. `pending_documents`
5. `incomplete`
6. `blocked`
7. `pending_human_review`
8. `unavailable`

The following states are explicitly excluded from Increment 1 route planning:

1. `active`
2. `verified`
3. `matched`
4. `submitted_to_shipowner`
5. `approved`
6. `employed`

## 5. State Transition Map

The planned transition map is:

```text
not_started
  -> draft

draft
  -> pending_consent
  -> incomplete
  -> blocked
  -> unavailable

pending_consent
  -> pending_documents
  -> incomplete
  -> blocked
  -> unavailable

pending_documents
  -> incomplete
  -> pending_human_review
  -> blocked
  -> unavailable

incomplete
  -> draft
  -> pending_consent
  -> pending_documents
  -> blocked
  -> unavailable

blocked
  -> not_started
  -> unavailable

pending_human_review
  -> unavailable

unavailable
  -> not_started
```

Transition interpretation guidance:

1. `not_started -> draft` marks controlled entry into the route;
2. `draft -> pending_consent` means the route may continue only toward required consent gates, not toward review;
3. `pending_consent -> pending_documents` means required consents are satisfied at planning level;
4. `pending_documents -> pending_human_review` is allowed only after completeness conditions are satisfied;
5. no transition may lead to approval, verification, matching or candidate submission states in Increment 1.

## 6. Blocked and Incomplete Route Behavior

Blocked and incomplete states must remain distinct.

Planned blocked behavior:

1. represent scope exclusion, policy exclusion or route-level access limitation;
2. stop forward progression toward review;
3. provide a safe return path without implying hidden override logic.

Planned incomplete behavior:

1. represent interrupted or insufficient route progress;
2. preserve resumable progression at planning level only;
3. avoid implying production persistence or completed registration.

The route architecture must not collapse blocked and incomplete into a single generic state because they represent different compliance and UX meanings.

## 7. Consent Dependency on CPG-I1-004

CPG-I1-002 remains explicitly dependent on CPG-I1-004 consent capture planning.

Architectural dependency rule:

```text
registration route cannot reach pending_human_review
unless required consent gates are satisfied
```

Required consent planning dependencies include:

1. Privacy Policy visibility;
2. Seafarer Candidate Agreement visibility;
3. No Recruitment Fees acknowledgement;
4. ordering of required consent before later review handoff.

This document does not authorize consent-storage implementation.

## 8. No-Fee and No-Employment-Guarantee Boundary

The route must preserve the following boundary conditions:

1. no payment;
2. no recruitment fee;
3. no placement fee;
4. no employment-access fee;
5. no employment guarantee;
6. no production placement action.

The route must not imply that registration completion produces hiring, placement, matching or candidate publication outcomes.

## 9. Human-Review Terminal State

For Increment 1, the terminal route state is:

```text
pending_human_review
```

This means:

1. the route ends at review readiness, not operational approval;
2. the route does not approve the candidate;
3. the route does not verify documents autonomously;
4. the route does not submit the candidate to any shipowner;
5. the route does not create the impression of automated employment processing.

## 10. OpenClaw Separation

OpenClaw remains separated from the route runtime and stays on GTC-AGENT.

Allowed future planning role:

1. operator support only;
2. profile summarization support;
3. missing-document highlighting support;
4. review-checklist drafting support;
5. operator-note drafting support.

Prohibited role:

1. candidate approval;
2. candidate rejection;
3. autonomous document verification;
4. candidate submission to shipowner;
5. employment or placement decision-making.

OpenClaw must not be planned as a route runtime dependency.

## 11. n8n Exclusion

`n8n` is excluded from the CrewPortGlobal project architecture.

The route must not depend on `n8n` for:

1. orchestration;
2. consent handling;
3. state management;
4. automation;
5. fallback processing;
6. deployment;
7. any future dependency path.

`n8n` must not be introduced as a workflow engine, integration layer, route orchestrator, consent handler, state manager, fallback automation tool or deployment step.

## 12. Out-of-Scope Items

The following items are explicitly out of scope for this route architecture plan:

1. runtime routes;
2. UI code;
3. components;
4. stylesheets or scripts;
5. package files;
6. backend or API handlers;
7. SQL execution;
8. database access or writes;
9. auth changes;
10. Stripe changes;
11. nginx changes;
12. OpenClaw configuration changes;
13. `n8n` usage;
14. deployment;
15. candidate submission;
16. matching automation;
17. production registration;
18. shipowner onboarding.

## 13. Validation Checklist

Before this route architecture plan is accepted for further owner review, confirm that:

1. the route remains seafarer-only;
2. the route state set remains limited to Increment 1 planning states;
3. `pending_human_review` remains the terminal Increment 1 state;
4. consent dependency on CPG-I1-004 remains explicit;
5. no-fee and no-employment-guarantee boundaries remain explicit;
6. OpenClaw remains separated on GTC-AGENT and outside route runtime;
7. `n8n` remains excluded from architecture and route planning;
8. no runtime route implementation is implied;
9. no database, auth, Stripe, nginx or deployment scope is introduced.

## 14. Final Recommendation

The route architecture should proceed only as planning review material for the next project-owner decision.

Any later request to create runtime routes, frontend code, backend handlers, persistence logic or automation dependencies must require separate explicit approval.

## 15. Final Control Statement

CPG-I1-002 seafarer registration route architecture plan is ready for project-owner review. Implementation execution remains not approved.
