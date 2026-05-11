# CrewPortGlobal — CPG-I1-001 Frontend Shell Placeholder Plan

- Project: CrewPortGlobal
- Document owner: GTC INFORMATION TECHNOLOGY FZ-LLC
- Version: 0.1
- Status: Frontend planning baseline
- Classification: Internal
- Effective date: 2026-05-11
- Review date: 2026-06-11
- Related issue: GitHub issue #3 — CPG-I1-001

## 1. Purpose

This document defines the first frontend shell placeholder plan for CPG-I1-001 only.

It describes the future frontend shell surface as a planning artifact without authorizing runtime UI implementation.

## 2. Scope

This document covers planning only for:

1. future frontend shell pages;
2. interface zones;
3. shell-visible states;
4. handoff alignment with CPG-I1-002 seafarer registration route planning;
5. handoff alignment with CPG-I1-004 consent capture planning;
6. accessibility and responsive planning expectations;
7. error and incomplete-state presentation planning;
8. privacy and security display requirements.

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

1. no runtime UI code may be written;
2. no routes may be implemented;
3. no components may be implemented;
4. no stylesheets may be created;
5. no scripts may be created;
6. no package or dependency files may be created;
7. no backend or API handlers may be created;
8. no database connection may be introduced;
9. no auth integration may be introduced;
10. no Stripe integration may be introduced;
11. nginx must not be changed;
12. no OpenClaw frontend integration may be introduced;
13. `n8n` must not be used;
14. deployment must not be performed.

Implementation execution remains not approved.

## 5. Planning Inputs

This frontend shell placeholder plan builds on:

- `docs/crewportglobal/51_cpg_i1_001_application_shell_implementation_plan.md`
- `projects/crewportglobal/planning/issues/CPG-I1-002_seafarer_registration_route_planning.md`
- `projects/crewportglobal/planning/issues/CPG-I1-004_consent_capture_planning.md`
- `docs/crewportglobal/48_architecture_decision_gtc1_app_gtc_agent_openclaw.md`
- `docs/crewportglobal/53_cpg_i1_001_application_shell_skeleton_owner_review.md`

## 6. Frontend Placeholder Objective

The frontend shell placeholder should define the future user-facing surface for the Increment 1 seafarer-only prototype on GTC1.

Its planning objective is to make later UI implementation reviewable before any runtime work begins.

## 7. Planned Frontend Shell Pages

The future frontend shell is planned around a small page set only.

### 7.1 Shell Entry Page

Purpose:

1. identify the seafarer-only prototype entry point;
2. explain that the flow is limited to Increment 1 planning assumptions;
3. display initial scope, no-fee and human-review notices;
4. hand off into the planned seafarer registration route.

### 7.2 Registration Start Page

Purpose:

1. represent the first route-owned start surface planned in CPG-I1-002;
2. display route entry guidance and minimum prototype expectations;
3. present transition into consent-gated progression;
4. preserve blocked-state exits back to a safe shell context.

### 7.3 Consent Gate Page

Purpose:

1. represent the shell-visible consent checkpoint aligned with CPG-I1-004;
2. display Privacy Policy, Seafarer Candidate Agreement and No Recruitment Fees acknowledgement requirements;
3. show that required consent gates must be satisfied before later review handoff planning continues;
4. separate optional paid services from job access.

### 7.4 Incomplete Progress Page

Purpose:

1. represent interrupted prototype progress;
2. explain that the flow is incomplete and not submitted;
3. direct the user toward the planned corrective next step;
4. avoid implying live persistence or production registration.

### 7.5 Review-Pending Page

Purpose:

1. represent the terminal prototype shell state for later human-review handoff;
2. explain that automated approval is not available;
3. preserve human-review expectations;
4. avoid implying verification completion or candidate submission.

### 7.6 Blocked or Unavailable Page

Purpose:

1. represent policy-blocked or temporarily unavailable access;
2. distinguish blocked scope from technical unavailability;
3. provide safe return paths to public CrewPortGlobal information;
4. avoid exposing internal implementation details.

## 8. Planned Interface Zones

Each future frontend shell page should be planned around a consistent zone model.

### 8.1 Global Header Zone

Planned use:

1. page identity;
2. prototype scope notice;
3. safe navigation back to public CrewPortGlobal context.

### 8.2 Progress and State Zone

Planned use:

1. visible indication of current shell state;
2. route-step or consent-step context;
3. incomplete, blocked or pending-review explanation.

### 8.3 Main Content Zone

Planned use:

1. page-specific instructions;
2. future registration-route handoff context;
3. future consent-gate context;
4. non-technical explanatory content for the user.

### 8.4 Compliance Notice Zone

Planned use:

1. no-fee notice;
2. human-review notice;
3. privacy and consent visibility;
4. scope limitations for the prototype.

### 8.5 Action Zone

Planned use:

1. future start or continue actions;
2. safe return action;
3. retry or correction action for incomplete or validation states.

This zone is planning-only and does not authorize component or route implementation.

### 8.6 Footer and Support Zone

Planned use:

1. legal and policy references;
2. support and complaint guidance;
3. explanatory note that OpenClaw is not a public frontend dependency;
4. prototype boundary reminders.

## 9. Planned Shell State Presentation

The frontend shell should visually plan for these shell-visible states:

1. `entry`;
2. `loading`;
3. `ready_for_start`;
4. `validation_error`;
5. `blocked`;
6. `incomplete`;
7. `pending_human_review`;
8. `unavailable`.

Frontend planning expectations by state:

1. `entry` should communicate scope and prototype intent immediately;
2. `loading` should remain neutral and avoid implying live backend completion;
3. `ready_for_start` should orient the user toward the planned seafarer-only route;
4. `validation_error` should explain correctable issues without exposing internal validation logic;
5. `blocked` should explain exclusion or limitation clearly and safely;
6. `incomplete` should support resumption expectations without implying saved production data;
7. `pending_human_review` should explain that human review is required and not bypassed;
8. `unavailable` should provide a safe fallback message and return path.

## 10. Relationship to CPG-I1-002

The frontend shell placeholder must remain dependent on CPG-I1-002 route planning.

Planning alignment with CPG-I1-002:

1. the shell entry page hands off to the future seafarer registration route;
2. frontend-visible states must remain compatible with route-level states such as draft, consent, incomplete and review-pending;
3. blocked and resumption expectations should be visible in the shell before any route implementation exists;
4. the shell must not imply candidate submission, matching automation or deployment.

## 11. Relationship to CPG-I1-004

The frontend shell placeholder must remain dependent on CPG-I1-004 consent planning.

Planning alignment with CPG-I1-004:

1. the future consent gate page must visibly sequence privacy, agreement and no-fee acknowledgements;
2. consent visibility must remain explicit before review handoff planning continues;
3. the shell must display that required consents are gating conditions, not optional decoration;
4. optional paid services must remain visibly separate from job access.

## 12. Accessibility and Responsive Planning

The future frontend shell should be planned with accessibility and responsive constraints from the start.

Planned accessibility expectations:

1. page identity and state identity must be clear in headings and labels;
2. blocked, error and pending-review states must be understandable without visual ambiguity;
3. notice zones must remain readable and logically ordered;
4. future actions must remain understandable through text, not color alone.

Planned responsive expectations:

1. header, notice and action zones must remain readable on narrow mobile screens;
2. primary actions should stay visible without requiring desktop-only layout assumptions;
3. state and compliance notices should not become secondary or hidden on mobile;
4. page flow should remain linear and understandable across mobile and desktop planning views.

## 13. Error and Incomplete State Planning

The frontend shell must clearly distinguish:

1. correctable validation errors;
2. incomplete progress;
3. blocked scope or policy exclusions;
4. temporary unavailability;
5. pending human review.

The shell should not collapse these into a single generic placeholder because later approval decisions depend on those distinctions.

## 14. Privacy and Security Display Requirements

The future frontend shell should visibly preserve the following display requirements:

1. privacy-related notices must appear before or at the consent gate;
2. the shell must not imply hidden data collection or silent consent;
3. the shell must not imply direct public access to verification decisions;
4. the shell must not display any claim that employment, placement or candidate submission is guaranteed;
5. the shell must remind the user that human review remains required where applicable.

## 15. OpenClaw Separation

OpenClaw remains outside the frontend shell surface.

The frontend shell must not be planned as:

1. a live OpenClaw chat surface;
2. an OpenClaw-rendered decision surface;
3. a replacement for operator review;
4. a dependency for frontend page loading or consent gating.

If OpenClaw is mentioned at all in future UI copy, it should be described only as an internal assistive operator-support layer on GTC-AGENT.

## 16. n8n Exclusion

`n8n` is excluded from the frontend shell plan.

The frontend shell must not be planned as depending on:

1. `n8n` workflow triggers;
2. `n8n` route orchestration;
3. `n8n` consent handling;
4. `n8n` state management;
5. `n8n` deployment steps.

## 17. Explicit Non-Goals

This document does not authorize or define:

1. runtime UI code;
2. routes;
3. components;
4. stylesheets;
5. scripts;
6. package or dependency files;
7. backend or API handlers;
8. database connection;
9. auth integration;
10. Stripe integration;
11. nginx changes;
12. OpenClaw frontend integration;
13. `n8n` usage;
14. deployment.

## 18. Final Control Statement

Frontend shell placeholder plan is ready for project-owner review. Implementation execution remains not approved.