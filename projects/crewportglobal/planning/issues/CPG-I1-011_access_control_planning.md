# CPG-I1-011 — Access-Control Planning

- Ticket ID: CPG-I1-011
- Title: Access-control planning
- Status: Draft issue, not approved for implementation.
- Increment: Increment 1
- Scope: Seafarer-only website prototype planning

## 1. Objective

Define planning-level access boundaries for public intake, operator-only actions and admin-scope questions that remain outside Increment 1 implementation.

## 2. Planning Tasks

1. define public versus internal boundary assumptions;
2. define operator-only action boundaries;
3. define internal admin questions that remain planning-only;
4. define approval prerequisites before any future permission rollout.

## 3. Draft Acceptance Criteria

1. no authentication change is introduced;
2. operator-only boundaries remain clear enough for issue drafting;
3. admin scope remains planning-only and non-implementing;
4. no permission rollout is implied.

## 4. Explicit Exclusions

1. no auth changes;
2. no permission rollout;
3. no implementation;
4. no deployment.

## 5. Dependencies

Depends on route, console and review-queue planning.

## 6. Mandatory Restriction

No code may be written, no SQL may be executed, no database may be touched, no authentication or payment workflow may be changed, no nginx configuration may be changed, no OpenClaw configuration may be modified, no n8n workflow may be created, and no deployment may be performed without separate explicit project-owner approval.

## 7. Final Control Statement

This draft issue is prepared for project-owner review only. Implementation remains not approved.