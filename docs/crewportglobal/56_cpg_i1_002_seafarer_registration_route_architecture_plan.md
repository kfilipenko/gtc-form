# CrewPortGlobal — CPG-I1-002 Seafarer Registration Route Architecture Plan

- Project: CrewPortGlobal
- Document owner: GTC INFORMATION TECHNOLOGY FZ-LLC
- Version: 0.2
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

## 3. Current Approval Status

Draft implementation issue. Implementation remains not approved.

## 4. Non-Execution Statement

This issue does not authorize implementation. No code may be written, no SQL may be executed, no database may be touched, no authentication or payment workflow may be changed, no nginx configuration may be changed, no OpenClaw configuration may be modified, no n8n workflow may be created, and no deployment may be performed without separate explicit project-owner approval.

## 5. ADR 48 Architecture Baseline

This planning document remains bound to the ADR 48 architecture baseline:

1. CrewPortGlobal website application runtime: GTC1;
2. CrewPortGlobal SQL database locality: GTC1;
3. OpenClaw runtime / agent platform: GTC-AGENT;
4. n8n: excluded.

## 6. Increment 1 Route Objective

Prepare the planning basis for the seafarer registration route in the CrewPortGlobal website application on GTC1.

The route objective is limited to the Increment 1 seafarer registration prototype and must preserve no-fee, human-review and non-production-write boundaries.

## 7. Seafarer-Only Boundary

This route plan is limited to the seafarer registration contour only.

The route must not be interpreted as covering shipowner onboarding, employer onboarding, agency onboarding or any multi-role registration expansion.

## 8. Planned Route Architecture Model

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

## 9. Planned Route State Model

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

## 10. State Transition Map

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

## 11. Entry and Start State Planning

Entry planning begins at Shell Entry and then moves to Seafarer Registration Start before the route enters working registration states.

Planning requirements for entry and start:

1. entry must be controlled rather than implicit;
2. the route must begin in `not_started`;
3. transition into `draft` marks the first valid route progression;
4. entry planning must preserve the seafarer-only Increment 1 boundary.

## 12. Draft Intake State Planning

The `draft` state represents active planning-level intake of seafarer registration information before consent completion and before review readiness.

Planning requirements for draft intake:

1. `draft` must remain resumable at planning level;
2. `draft` must not imply production persistence or successful registration completion;
3. `draft` may progress toward `pending_consent`, `incomplete`, `blocked` or `unavailable` only;
4. `draft` must not imply approval, verification, matching or shipowner submission outcomes.

## 13. Consent Dependency on CPG-I1-004

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

## 14. Document Metadata Step Planning

The route architecture includes a Document Metadata Step between Consent Gate and Completeness Check.

Planning requirements for this step:

1. it remains metadata-oriented planning, not document verification;
2. it may contribute to `pending_documents` and later completeness evaluation;
3. it must not be interpreted as autonomous screening, approval or production document processing;
4. it must remain subordinate to the human-review boundary.

## 15. Incomplete and Blocked State Planning

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

## 16. Pending Human Review as Terminal State

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

## 17. No-Fee and No-Employment-Guarantee Boundary

The route must preserve the following boundary conditions:

1. no payment;
2. no recruitment fee;
3. no placement fee;
4. no employment-access fee;
5. no employment guarantee;
6. no production placement action.

The route must not imply that registration completion produces hiring, placement, matching or candidate publication outcomes.

## 18. OpenClaw Separation Boundary

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

## 19. n8n Exclusion Boundary

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

## 20. Out of Scope

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

## 21. Validation Checklist for This Planning Step

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

## 22. Stop Conditions

This planning step must stop immediately if any request attempts to:

1. convert planning states into runtime routes;
2. add UI code, frontend routing or components;
3. add backend or API handlers;
4. execute SQL or touch the database;
5. change auth, payment, Stripe or nginx behavior;
6. modify OpenClaw configuration;
7. create any n8n workflow or dependency;
8. perform deployment;
9. expand scope beyond the seafarer-only Increment 1 boundary.

## 23. Open Questions Before Future Implementation

The following questions remain open for any future separately approved implementation phase:

1. how Shell Entry and Seafarer Registration Start should be represented in a runtime shell without expanding scope;
2. how consent completion should be surfaced without violating the CPG-I1-004 boundary;
3. how document metadata completeness should be signalled without implying document verification;
4. how resumable draft and incomplete states should be represented without production-write assumptions;
5. what explicit human-review handoff markers should exist before any later implementation decision.

## 24. Final Recommendation

The route architecture should proceed only as planning review material for the next project-owner decision.

Any later request to create runtime routes, frontend code, backend handlers, persistence logic or automation dependencies must require separate explicit approval.

CPG-I1-002 seafarer registration route architecture plan is ready for project-owner review. Implementation execution remains not approved.

## 25. Revision History

| Version | Date | Author | Changes |
|---|---|---|---|
| 0.2 | 2026-05-11 | GTC IT / AI Assistant | Restructured document to match the approved issue #4 section layout while preserving the planning-only route architecture, state model, terminal human-review boundary, OpenClaw separation and n8n exclusion |
| 0.1 | 2026-05-11 | GTC IT / AI Assistant | Initial route architecture planning baseline for CPG-I1-002 |
