# CPG-I1-003 — Seafarer Profile Form Planning

- Ticket ID: CPG-I1-003
- Title: Seafarer profile form planning
- Status: Draft issue, not approved for implementation.
- Increment: Increment 1
- Scope: Seafarer-only website prototype planning

## 1. Objective

Define the planning baseline for the seafarer profile form fields, validation boundaries and incomplete-submission behavior.

## 2. Planning Tasks

1. define the seafarer field groups needed for prototype intake;
2. define validation ownership between UI and service-layer planning;
3. define incomplete, invalid and blocked form states;
4. define review-visible intake completeness assumptions.

## 3. Draft Acceptance Criteria

1. form groups remain bounded to the seafarer prototype scope;
2. validation assumptions do not require DB writes or auth changes;
3. incomplete-submission behavior is described clearly;
4. no implementation detail is presented as approved.

## 4. Explicit Exclusions

1. no DB writes;
2. no auth redesign;
3. no code implementation;
4. no business-client form scope.

## 5. Dependencies

Depends on route-planning and shell-planning definitions.

## 6. Mandatory Restriction

No code may be written, no SQL may be executed, no database may be touched, no authentication or payment workflow may be changed, no nginx configuration may be changed, no OpenClaw configuration may be modified, and no deployment may be performed without separate explicit project-owner approval.

## 7. Final Control Statement

This draft issue is prepared for project-owner review only. Implementation remains not approved.