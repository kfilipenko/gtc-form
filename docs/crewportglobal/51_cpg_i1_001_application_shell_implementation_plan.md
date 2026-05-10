# CrewPortGlobal — CPG-I1-001 Application Shell Implementation Plan

- Project: CrewPortGlobal
- Document owner: GTC INFORMATION TECHNOLOGY FZ-LLC
- Version: 0.1
- Status: Implementation planning baseline
- Classification: Internal
- Effective date: 2026-05-10
- Review date: 2026-06-10
- Related issue: GitHub issue #3 — CPG-I1-001

## 1. Purpose

This document defines the implementation-planning baseline for CPG-I1-001, Website application shell planning.

It converts the approved issue scope into a concrete application-shell plan without authorizing implementation execution.

## 2. Scope

This document covers implementation planning only for the CrewPortGlobal website application shell needed to host the Increment 1 seafarer-only registration prototype.

This document may define:

1. shell structure boundaries;
2. route and page-state planning;
3. shell-to-service responsibility split;
4. navigation and error-handling expectations;
5. review and planning checkpoints for later owner decisions.

This document does not authorize implementation execution.

## 3. Approved Baseline

The planning baseline for this document is:

1. CrewPortGlobal website application runtime: GTC1;
2. CrewPortGlobal SQL database locality: GTC1;
3. OpenClaw runtime / agent platform: GTC-AGENT;
4. OpenClaw usage: assistive operator support only;
5. `n8n`: excluded.

## 4. Hard Constraints

The following constraints remain unchanged:

1. application code must not be written;
2. SQL must not be executed;
3. no database may be touched;
4. auth must not be changed;
5. Stripe must not be changed;
6. nginx must not be changed;
7. OpenClaw configuration must not be changed;
8. `n8n` must not be used;
9. deployment must not be performed.

Implementation execution remains not approved.

## 5. Planning Inputs

This implementation plan builds on:

- `docs/crewportglobal/39_registration_automation_implementation_plan.md`
- `docs/crewportglobal/48_architecture_decision_gtc1_app_gtc_agent_openclaw.md`
- `docs/crewportglobal/49_limited_github_issue_draft_package_001_002_004.md`
- `docs/crewportglobal/50_limited_github_issues_001_002_004_review.md`
- `projects/crewportglobal/planning/issues/CPG-I1-001_website_application_shell_planning.md`
- GitHub issue #3 — `CPG-I1-001 — Website application shell planning`

## 6. Entry Condition for This Plan

Only implementation planning for CPG-I1-001 is currently in scope.

This means the current document may define the proposed shell surface and responsibilities for later review.

It does not expand scope to route implementation, consent implementation, production runtime change, database change or broader Increment 1 execution.

## 7. Shell Planning Objective

The application shell is the planned public-facing container for the seafarer-only registration prototype on GTC1.

Its planning objective is to provide a controlled website-side structure for:

1. prototype route entry;
2. shell-level layout and navigation;
3. shell state transitions;
4. display of validation, blocked and review-pending states;
5. handoff to later route, consent and review-planning slices.

## 8. Proposed Application Shell Boundary

The planned application shell should be limited to website-layer responsibilities.

Planned shell responsibilities:

1. render the Increment 1 seafarer-only prototype frame;
2. expose the initial route shell for registration start;
3. manage shell-level state transitions for loading, validation, blocked, incomplete and review-pending views;
4. surface policy and prototype boundary notices;
5. route the user into later planning-owned slices without embedding business-rule execution in the shell itself.

The application shell should not own:

1. production registration writes;
2. verification decisions;
3. candidate submission decisions;
4. payment activation;
5. autonomous review outcomes.

## 9. Proposed Shell Structure Plan

The planned shell structure under `projects/crewportglobal/` should remain small and project-local.

Recommended planning structure:

```text
projects/crewportglobal/
  app/
    shell/
      layout/
      states/
      navigation/
    routes/
      seafarer/
        registration/
    flows/
      increment1/
    services/
      contracts/
    shared/
      content/
      validation/
      types/
    docs/
      implementation-planning/
```

Planning intent for each area:

1. `app/shell/` defines shell frame, visible state containers and shell navigation rules;
2. `app/routes/` defines public route ownership boundaries;
3. `app/flows/` defines planning-only flow composition for Increment 1;
4. `app/services/contracts/` defines internal service touchpoints as interfaces only at planning level;
5. `app/shared/` contains planning-level shared concerns such as copy, validation expectations and type boundaries;
6. `docs/implementation-planning/` keeps any follow-on shell planning notes local to the project.

## 10. Route and Page-State Model

The shell planning baseline should recognize the following shell-visible states:

1. `entry`;
2. `loading`;
3. `ready_for_start`;
4. `validation_error`;
5. `blocked`;
6. `incomplete`;
7. `pending_human_review`;
8. `unavailable`.

State interpretation guidance:

1. `entry` is the first visible shell state for a visitor entering the prototype route;
2. `loading` is limited to shell bootstrapping and non-persistent data preparation;
3. `ready_for_start` is the normal shell state before route-specific intake continues;
4. `validation_error` is for user-correctable planning-defined issues;
5. `blocked` is for explicit scope, role or policy exclusion states;
6. `incomplete` is for interrupted prototype progress without production persistence assumptions;
7. `pending_human_review` is the handoff display state once human review becomes required in later slices;
8. `unavailable` is for temporary shell-level failure or planning-defined suspension conditions.

## 11. Navigation Expectations

The application shell should preserve a narrow navigation model.

The shell navigation is planned to include only:

1. entry into the seafarer registration prototype;
2. movement between shell-visible planning states;
3. return to public CrewPortGlobal informational context;
4. clear notice when a path is blocked, incomplete or pending human review.

The shell should not imply availability of shipowner onboarding, candidate matching, payment flows or autonomous progression beyond the approved prototype boundary.

## 12. Responsibility Split

### 12.1 Website Application Shell

The website application shell on GTC1 is planned to own:

1. route framing;
2. visible state handling;
3. user-facing boundary notices;
4. navigation between shell-owned states;
5. handoff into later planning slices.

### 12.2 Internal Service Layer

Internal service modules on GTC1 are planned to own, at later approved planning slices only:

1. registration intake rules;
2. consent persistence contracts;
3. readiness evaluation logic;
4. review-queue handoff contracts;
5. audit and trace responsibilities.

The shell must not absorb those service-layer responsibilities.

### 12.3 OpenClaw Boundary

OpenClaw on GTC-AGENT remains outside the application shell.

It may assist operators through separate controlled processes only.

It must not be planned as:

1. a public shell runtime dependency;
2. a shell rendering dependency;
3. a route decision authority;
4. a replacement for human review;
5. a basis for autonomous admission, verification or submission decisions.

## 13. Error and Blocked-State Handling

Shell planning must distinguish between:

1. recoverable user correction states;
2. policy-blocked states;
3. unavailable or temporary system states;
4. human-review pending states.

The planned shell must present those states clearly without implying that backend execution, approval, data write or deployment already exists.

## 14. Increment 1 Scope Guardrails

The CPG-I1-001 shell plan must preserve all of the following:

1. seafarer-only Increment 1 scope;
2. no-fee boundary for job access;
3. mandatory human-review checkpoints in later slices;
4. no production registration assumption;
5. no candidate submission to shipowners;
6. no matching automation;
7. no external KYC or KYB provider dependency;
8. no `n8n` dependency.

## 15. Planning Deliverables from This Slice

This document defines the expected planning outputs for CPG-I1-001:

1. application shell boundary definition;
2. shell structure proposal;
3. shell state model;
4. shell-to-service responsibility split;
5. navigation and blocked-state expectations;
6. explicit architectural and safety guardrails.

These are planning outputs only and are not implementation deliverables.

## 16. Explicit Non-Goals

This document does not authorize or define:

1. application code changes;
2. SQL execution;
3. database writes or schema changes;
4. authentication changes;
5. Stripe or payment workflow changes;
6. nginx changes;
7. OpenClaw configuration changes;
8. `n8n` workflows;
9. deployment;
10. implementation execution.

## 17. Final Control Statement

CPG-I1-001 application shell implementation plan is ready for project-owner review. Implementation execution remains not approved.

*** Update File: /var/www/gtc-form/docs/crewportglobal/00_documentation_register.md
  47_increment_1_github_issue_creation_approval_package.md
  48_architecture_decision_gtc1_app_gtc_agent_openclaw.md
  49_limited_github_issue_draft_package_001_002_004.md
  50_limited_github_issues_001_002_004_review.md
+  51_cpg_i1_001_application_shell_implementation_plan.md
```

## 4. Priority order for drafting
@@
| Version | Date | Author | Changes |
|---|---|---|---|
+| 0.27 | 2026-05-10 | GTC IT / AI Assistant | Added CPG-I1-001 application shell implementation plan for project-owner review under ADR 48 baseline and execution restrictions |
| 0.26 | 2026-05-10 | GTC IT / AI Assistant | Added review of live GitHub issues #3, #4 and #5 confirming ADR 48 alignment and readiness for project-owner implementation approval decision |
| 0.25 | 2026-05-10 | GTC IT / AI Assistant | Added limited GitHub issue draft package for CPG-I1-001, CPG-I1-002 and CPG-I1-004 after ADR 48 baseline approval; full 12-issue creation postponed |