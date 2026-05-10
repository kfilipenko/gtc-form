# CPG-I1-005 — No Recruitment Fees Acknowledgement Planning

- Ticket ID: CPG-I1-005
- Title: No Recruitment Fees acknowledgement planning
- Status: Draft issue, not approved for implementation.
- Increment: Increment 1
- Scope: Seafarer-only website prototype planning

## 1. Objective

Define where and how the No Recruitment Fees acknowledgement appears, gates submission and is preserved in planning-level audit expectations.

## 2. Planning Tasks

1. define acknowledgement placement in the seafarer flow;
2. define mandatory gating before submission handoff;
3. define the review-visible acknowledgement state;
4. define planning assumptions for acknowledgement traceability.

## 3. Draft Acceptance Criteria

1. the no-fee rule is explicit in the draft issue scope;
2. submission gating depends on acknowledgement capture;
3. no billable seafarer step is introduced;
4. no Stripe or upsell dependency is implied.

## 4. Explicit Exclusions

1. no billable seafarer step;
2. no upsell flow;
3. no Stripe changes;
4. no code implementation.

## 5. Dependencies

Depends on consent-planning and form-planning boundaries.

## 6. Mandatory Restriction

No code may be written, no SQL may be executed, no database may be touched, no authentication or payment workflow may be changed, no nginx configuration may be changed, no OpenClaw configuration may be modified, no n8n workflow may be created, and no deployment may be performed without separate explicit project-owner approval.

## 7. Final Control Statement

This draft issue is prepared for project-owner review only. Implementation remains not approved.