# CPG-I1-004 — Consent Capture Planning

- Ticket ID: CPG-I1-004
- Title: Consent capture planning
- Status: Draft issue, not approved for implementation.
- Increment: Increment 1
- Scope: Seafarer-only website prototype planning

## 1. Objective

Define the planning-only consent capture sequence and gating logic for the seafarer Increment 1 prototype.

## 2. Planning Tasks

1. define privacy and verification consent ordering;
2. define consent gating before review handoff;
3. define visibility of consent state for operator review planning;
4. define planning-only assumptions for audit trace coverage.

## 3. Draft Acceptance Criteria

1. mandatory consent ordering is explicit;
2. review handoff depends on required consent capture;
3. no payment or live-storage behavior is introduced;
4. consent planning remains non-authorizing.

## 4. Explicit Exclusions

1. no payment flow;
2. no live consent storage implementation;
3. no code;
4. no deployment.

## 5. Dependencies

Depends on route and form planning.

## 6. Mandatory Restriction

No code may be written, no SQL may be executed, no database may be touched, no authentication or payment workflow may be changed, no nginx configuration may be changed, no OpenClaw configuration may be modified, no n8n workflow may be created, and no deployment may be performed without separate explicit project-owner approval.

## 7. Final Control Statement

This draft issue is prepared for project-owner review only. Implementation remains not approved.