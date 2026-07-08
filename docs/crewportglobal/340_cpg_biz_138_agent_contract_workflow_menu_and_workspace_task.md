# CPG-BIZ-138 - Agent Contract Workflow Menu and Workspace Task

- Project: CrewPortGlobal.com
- Company: GTC INFORMATION TECHNOLOGY FZ-LLC
- Stage: Stage 1 - Digital Maritime Crew Data and Matching Platform
- Document type: Approved implementation task and completion report
- Version: 1.2
- Date: 2026-07-08
- Status: Implemented

## 1. Purpose

This task creates a clear agent-side contract workflow entry in the shared application menu and a dedicated `/agents/contracts/` workspace page.

The page must not create a separate agent contract generator. It must expose the already implemented ICS-005 workflow:

```text
agent contract tasks
-> exact Contract Workspace link
-> controlled condition preparation
-> draft editing inside permitted embedded fields
-> party-review request to seafarer and shipowner/employer
```

## 2. Standards Applied

The task applies:

1. `ICS-005 - Agent-Assisted Direct Contract Drafting Standard`;
2. CPG-BIZ-137 implementation report;
3. shared navigation/header standard: application menu changes must be made in the shared navigation component;
4. single Contract Workspace rule: agent workflow pages may link to `/contracts/workspace/` but must not duplicate contract-generation logic.

## 3. Scope

The implementation must add:

1. shared `Agents` menu contract accordion:
   - the parent `Contracts` item opens the contract workflow;
   - subordinate items are nested under `Contracts`, not listed as peer agent actions;
   - subordinate items cover prepare contract, agree terms, edit draft and send to parties for approval;
2. `/agents/contracts/` as the agent contract workflow page;
3. task loading from `GET /api/v1/agents/contract-drafting/tasks`;
4. exact links to the guarded Contract Workspace returned by the backend;
5. stage links that preserve the same backend task target and only add UI anchors;
6. English, Russian and Portuguese page/navigation translations.

## 4. Out of Scope

This task does not implement:

1. blank contract creation;
2. party signature;
3. final generated contract instance;
4. party correction endpoints;
5. a new contract template engine;
6. broad contract search outside the authenticated agent's computed task scope.

## 5. Acceptance Criteria

1. The shared Agents menu contains the contract workflow and stage links as a nested accordion under `Contracts`.
2. `/agents/contracts/` opens with the shared header and menu.
3. The page explains the operational stages without offering an unguarded blank contract.
4. Authenticated agents see computed contract-drafting tasks and can open the exact workspace link.
5. Unauthenticated users receive a session-required state instead of a misleading empty contract page.
6. `npm run check:cpg-i18n` passes.
7. `npm run test:cpg-api` remains green.
8. A visual smoke test confirms the menu and page render on desktop and mobile widths.

## 6. Implementation Notes

The page should classify the workflow as:

| Stage | UI anchor | Runtime source |
|---|---|---|
| Prepare contract | `#prepare-contract` | Computed agent contract task |
| Agree terms | `#agree-terms` | Same exact task target plus Contract Workspace embedded fields |
| Edit draft | `#edit-draft` | Same guarded Contract Workspace target |
| Send to parties | `#party-review` | Same guarded Contract Workspace target plus party-review panel |

## 7. Implemented Result

The implementation added:

1. shared `Agents` menu accordion for contracts, with prepare contract, agree terms, edit draft and send for approval nested under `Contracts`;
2. `/agents/contracts/` as the agent contract workflow page;
3. guarded task loading from `GET /api/v1/agents/contract-drafting/tasks`;
4. stage links that use the exact backend `target_url` and only add UI anchors;
5. `#contract-fields` anchor in the Contract Workspace for controlled embedded terms;
6. English, Russian and Portuguese page/navigation translations;
7. fallback session-required state when the user is not authenticated as an active agent.

## 8. Verification

Verification completed on 2026-07-08:

```text
npm run check:cpg-i18n
npm run test:cpg-api
Playwright visual smoke on http://127.0.0.1:38123/agents/contracts/
```

The visual smoke confirmed:

1. desktop rendering with the `Agents` menu open;
2. Russian menu entries for the four contract workflow stages nested under the `Contracts` accordion;
3. mobile single-column stage layout;
4. no page-level JavaScript errors;
5. session-required state for unauthenticated users.

## 9. Change Log

| Version | Date | Author | Changes |
|---|---|---|---|
| 1.2 | 2026-07-08 | GTC IT / AI Assistant | Converted the agent contract stage links into subordinate accordion items under the shared `Contracts` menu item |
| 1.1 | 2026-07-08 | GTC IT / AI Assistant | Implemented shared agent contract menu links, `/agents/contracts/` workflow page, exact task-target links, Contract Workspace field anchor, translations and visual smoke verification |
| 1.0 | 2026-07-08 | GTC IT / AI Assistant | Created task for shared agent contract workflow menu and `/agents/contracts/` workspace implementation |
