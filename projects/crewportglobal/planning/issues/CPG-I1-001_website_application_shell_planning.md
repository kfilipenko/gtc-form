# CPG-I1-001 — Website Application Shell Planning

- Ticket ID: CPG-I1-001
- Title: Website application shell planning
- Status: Draft issue, not approved for implementation.
- Increment: Increment 1
- Scope: Seafarer-only website prototype planning

## 1. Objective

Define the planning baseline for the public website application shell that will host the seafarer-only registration prototype.

## 2. Planning Tasks

1. define the route shell and page-state map for the prototype;
2. define loading, validation, blocked and review-pending shell states;
3. define the boundary between public shell responsibilities and internal service-layer responsibilities;
4. define prototype-only navigation and error-handling expectations.

## 3. Draft Acceptance Criteria

1. the planned shell surface is limited to the seafarer Increment 1 flow;
2. public shell states are named and mapped consistently;
3. handoff into review-pending state is represented clearly;
4. no production-release or deployment assumption is introduced.

## 4. Explicit Exclusions

1. no production release;
2. no code implementation;
3. no nginx change;
4. no auth redesign.

## 5. Dependencies

This draft should be read before route, form and consent issue drafts.

## 6. Mandatory Restriction

No code may be written, no SQL may be executed, no database may be touched, no authentication or payment workflow may be changed, no nginx configuration may be changed, no OpenClaw configuration may be modified, no n8n workflow may be created, and no deployment may be performed without separate explicit project-owner approval.

## 7. Final Control Statement

This draft issue is prepared for project-owner review only. Implementation remains not approved.