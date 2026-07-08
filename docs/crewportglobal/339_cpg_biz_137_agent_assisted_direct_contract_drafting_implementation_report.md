# CPG-BIZ-137 - Agent-Assisted Direct Contract Drafting Implementation Report

- Project: CrewPortGlobal.com
- Company: GTC INFORMATION TECHNOLOGY FZ-LLC
- Stage: Stage 1 - Digital Maritime Crew Data and Matching Platform
- Document type: Implementation report and operating order
- Version: 1.0
- Date: 2026-07-08
- Status: Implemented runtime slice

## 1. Purpose

This report fixes the first implemented runtime slice for the approved `agent_assisted_drafting` mode.

The implementation lets an authorized agent open an eligible direct seafarer-shipowner Contract Agreement Workspace, prepare only permitted contract variables and send the populated draft to the real parties for review.

The implementation does not let the agent sign, approve or generate the direct employment contract for either party.

## 2. Implemented Runtime Order

The agent contract-preparation order is now:

1. A direct Contract Agreement Workspace exists for a selected seafarer / shipowner candidate context.
2. The agent has an active or limited `agent_object_assignments` record linked to one of the workspace source objects:
   - `contract_workspace`;
   - `employer_company`;
   - `vessel`;
   - `vacancy_request`;
   - `seafarer_profile`;
   - matching `person_user` for the seafarer or employer representative.
3. `/agents/tasks` computes an `active_agent_contract_drafting` task and opens the exact URL:

```text
/contracts/workspace/?workspace_id={workspace_id}&actor=agent&assignment_id={assignment_id}
```

4. The Contract Workspace backend verifies:
   - authenticated agent session;
   - same agent organization;
   - active/limited assignment;
   - verified/limited agent authority;
   - source-object match between the assignment and the workspace.
5. The workspace returns agent drafting context:
   - representation capacity;
   - assignment id;
   - agent organization;
   - editable field codes;
   - `can_sign_for_parties = false`.
6. The agent may save only the current permitted embedded fields:
   - `C-5.1` joining date;
   - `C-5.2` contract duration;
   - `C-6.1` salary / wage terms;
   - `C-6.2` currency;
   - `C-8.1` joining travel responsibility;
   - `C-9.1` return / repatriation responsibility.
7. Each save writes or updates `contract_embedded_field_values`, recomputes `preview_hash` and writes `contract_generation_audit_events.contract_workspace_field_changed`.
8. When all required embedded fields are ready, the agent can send the draft to the real parties for review.
9. The review request:
   - moves the workspace to `party_review`;
   - creates or updates `contract_workspace_party_approvals` rows with `approval_status = requested`;
   - creates `participant_notification_ledger` review notifications for the seafarer and shipowner/employer user where recipients exist;
   - writes `contract_generation_audit_events.contract_workspace_review_requested`.

## 3. Implemented API Surface

| Endpoint | Purpose |
|---|---|
| `GET /api/v1/agents/contract-drafting/tasks` | Dedicated computed queue for agent-visible direct contract drafting tasks. |
| `GET /api/v1/agents/tasks` | Now includes contract drafting tasks in the general agent task queue. |
| `GET /api/v1/contract-workspaces/{workspace_id}?actor=agent&assignment_id={assignment_id}` | Opens an existing direct SEA workspace in guarded agent-assisted mode. |
| `PATCH /api/v1/contract-workspaces/{workspace_id}/fields?actor=agent&assignment_id={assignment_id}` | Saves permitted embedded contract variables only. |
| `POST /api/v1/contract-workspaces/{workspace_id}/submit-party-review?actor=agent&assignment_id={assignment_id}` | Sends the populated draft to parties for review and records approval requests / notifications. |

Existing party access remains compatible:

```text
/contracts/workspace/?workspace_id={workspace_id}&draft_id={party_user_id}
```

## 4. Implemented UI Surface

| Page | Change |
|---|---|
| `/agents/` | Contract preparation operation now points to computed tasks instead of a generic empty contract page. |
| `/agents/tasks` payload | Contract drafting tasks open the exact workspace URL. |
| `/contracts/workspace/` | Supports both party mode and agent mode. Agent mode shows assignment/capacity context, editable controls only for permitted fields and a party-review request button. |

## 5. Preserved Controls

The implementation preserves these approved controls:

1. verified source facts remain database-filled and read-only;
2. fixed contract clauses remain immutable;
3. agent action is scoped by assignment and authority;
4. agent can prepare draft values but cannot approve/sign for the parties;
5. party review request is recorded against the current `preview_hash`;
6. notifications are persistent ledger records, not only page messages;
7. no separate contract-generation script was created.

## 6. Remaining Work

The following work remains outside this slice:

1. simplified one-time-code party review route;
2. party approval / correction endpoints and UI;
3. invalidation of previous approval after draft change;
4. full draft-version table if required beyond `preview_hash` and audit events;
5. multi-template `contract_kind` registry from CPG-BIZ-136;
6. final generated contract instance script after party approvals.

## 7. Verification

Verification completed on 2026-07-08:

```text
php -l projects/crewportglobal/app/backend/api/public/index.php
npx playwright test -c playwright.crewportglobal.api.config.ts tests/crewportglobal-registration-api.spec.ts -g "employer vacancy request flows through review"
npm run test:cpg-api
npm run check:cpg-i18n
```

The regression scenario creates an existing direct Contract Agreement Workspace, registers a test agent, creates a verified shipowner authority and active source-object assignment, opens the workspace in `actor=agent` mode, saves the permitted embedded fields, sends the draft to party review and verifies approval requests plus notification ledger records.
