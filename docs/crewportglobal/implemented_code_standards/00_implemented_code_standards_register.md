# CrewPortGlobal - Implemented Code Standards Register

- Project: CrewPortGlobal.com
- Company: GTC INFORMATION TECHNOLOGY FZ-LLC
- Documentation block: Implemented code standards
- Document type: Dedicated implemented-standard register
- Format: Markdown
- Version: 1.10
- Date: 2026-06-10
- Status: Active implementation control

## 1. Purpose

This register records standards that are not only described as business or technical rules, but are also implemented in reusable code.

The purpose is to prevent repeated page-local or endpoint-local implementations of the same operation.

The governing principle is:

```text
one standard -> one canonical implementation -> page/API adapter -> regression test
```

When a standard changes, the canonical implementation should be updated once and the change should propagate to all forms, pages, APIs or workflows that use it.

## 2. Mandatory Pre-Coding Gate

Before programming any new function, page behavior, API behavior, workflow operation or validation rule, the implementer must check whether an implemented standard already exists.

The required decision path is:

| Step | Required action | Result |
|---|---|---|
| 1 | Check this register and related business-process standards. | Existing standard found or not found. |
| 2 | If a standard exists, inspect the canonical code module/helper/service. | Reuse path identified. |
| 3 | If the function is analogous to an existing standard, implement only an adapter/configuration layer. | No duplicated logic. |
| 4 | If no standard exists and the function can be reused in multiple places, create a new implemented standard before broad implementation. | New reusable standard and canonical code location are defined. |
| 5 | If no standard exists and the function is truly one-off, document why it remains page/API-local. | Exception is controlled. |
| 6 | Add or update tests proving the page/API uses the standard. | Standard adoption is verifiable. |

This gate is mandatory for future work on:

1. forms and questionnaires;
2. protected upload;
3. completeness validation;
4. submit/review gates;
5. computed tasks;
6. task links and workspaces;
7. approval guards;
8. visibility and access control;
9. matching blockers and candidate-presentation boundaries.

## 3. No-Copy Rule

Implemented standards must not be copied into multiple unrelated files.

Allowed pattern:

```text
shared module/helper/service + small page/API adapter
```

Prohibited pattern:

```text
same validation/rendering/guard logic pasted into several pages or endpoints
```

If a page needs different labels, field IDs or role checks, it must pass those differences as configuration to the standard implementation.

## 4. Standard Record Format

Each implemented standard should have a dedicated document with:

| Section | Required content |
|---|---|
| Purpose | Why the standard exists. |
| Applies to | Pages, APIs, backend workflows or task flows that must use it. |
| Canonical implementation | Exact code file/function/module. |
| Adapter contract | What each page/API must provide to use it. |
| Forbidden local logic | Logic that must not be reimplemented elsewhere. |
| Current adopters | Where it is already connected. |
| Required tests | Tests that prove adoption and prevent drift. |
| Exceptions | Temporary exceptions and retirement plan. |
| Change propagation rule | How updates to the standard reach all adopters. |

## 5. Active Implemented Standards

| ID | Standard | Canonical implementation | Current adopters | Status |
|---|---|---|---|---|
| ICS-001 | Standard form lifecycle, including matching-readiness field classification, catalog-backed country-code selects, repeated-country copy helpers, vessel-context field mapping, document-first completion placement and English/Latin-only form input guard where applicable | `projects/crewportglobal/public/assets/crewportglobal-form-lifecycle.js` plus page adapter context and `projects/crewportglobal/public/assets/crewportglobal-reference-catalogs.js` | `/create-profile/`, `/post-vacancy/` | Active |
| ICS-002 | Standard protected upload, including compact one-button row-level document checklist adapters for finite document catalogs and separate employer/vessel form-type adapters on the same page | `projects/crewportglobal/public/assets/crewportglobal-protected-upload.js` with `createController(config)` and `createDocumentChecklist(config)` | `/create-profile/`, `/post-vacancy/` | Active |
| ICS-003 | Submit-to-operator review gate | `projects/crewportglobal/app/backend/api/public/index.php` / `handle_post_draft_submit_review()` plus `window.CPGDrafts.submitForOperatorReview()` | `/create-profile/`, `/post-vacancy/` | Active |
| ICS-004 | Shipowner-agent framework offer acceptance standard using authoritative English `CPG-BIZ-132 v1.0` agreement package with Russian `CPG-BIZ-123` as convenience translation | `projects/crewportglobal/app/backend/api/public/index.php` offer/acceptance handlers plus migration `021_agent_framework_offer_notification_ledger.sql` | `/shipowners/candidates/#agent-assignment`, `/agents/` | Active |

## 6. Planned Implemented Standards

| Planned ID | Standard | Expected canonical implementation area | Reason |
|---|---|---|---|
| ICS-005 | Computed task model | Backend task computation helper/service | Needed to unify task stage, assignee, visibility condition and object link logic. |
| ICS-006 | Task display and deep-link model | Shared frontend task renderer + backend task payload contract | Needed to prevent task lists from showing non-executable buttons or generic queues. |
| ICS-007 | Approval guard model | Backend guard helper/service | Needed for internal shortlist, presentation and employer-facing guard consistency. |

## 7. Change Control

Changes to implemented standards must follow this order:

1. update the implemented-standard document;
2. update the canonical code implementation;
3. update adapters only where needed;
4. update tests for all current adopters;
5. update this register and the main documentation register;
6. confirm generated artifacts are not left in the working tree.

## 8. Acceptance Criteria

This register is correctly used when:

1. new development starts with a standard lookup;
2. duplicate logic is avoided;
3. analogous functions use existing modules/helpers/services;
4. reusable behavior is promoted into a standard before being copied;
5. every implemented standard has a code reference and test reference;
6. future refactoring can update one canonical implementation instead of many page-local copies.
