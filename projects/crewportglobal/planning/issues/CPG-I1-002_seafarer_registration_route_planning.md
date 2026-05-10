# CPG-I1-002 — Seafarer Registration Route Planning

- Ticket ID: CPG-I1-002
- Title: Seafarer registration route planning
- Status: Draft issue, not approved for implementation.
- Increment: Increment 1
- Scope: Seafarer-only website prototype planning

## 1. Objective

Define the planning-only route flow for the seafarer registration path from entry through review-pending completion.

## 2. Planning Tasks

1. define entry route and route-state transitions;
2. define draft, consent, document and review-pending route states;
3. define blocked-state routing and resumption expectations;
4. define route-level handoff points into operator review planning.

## 3. Draft Acceptance Criteria

1. route states align with Increment 1 scope and no-fee constraints;
2. candidate submission and matching automation remain out of route scope;
3. review-pending completion is the terminal prototype state;
4. no deployment or live-routing assumption is introduced.

## 4. Explicit Exclusions

1. no candidate submission;
2. no matching automation;
3. no deployment;
4. no implementation of routes.

## 5. Dependencies

Depends on the website application shell planning baseline.

## 6. Mandatory Restriction

No code may be written, no SQL may be executed, no database may be touched, no authentication or payment workflow may be changed, no nginx configuration may be changed, no OpenClaw configuration may be modified, no n8n workflow may be created, and no deployment may be performed without separate explicit project-owner approval.

## 7. Final Control Statement

This draft issue is prepared for project-owner review only. Implementation remains not approved.