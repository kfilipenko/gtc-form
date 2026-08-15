# GTC Catalog Task Register

- Project: GTC Catalog Data Plane
- Owner: GTC INFORMATION TECHNOLOGY FZ-LLC
- Document type: Executable task register
- Status: VERIFY
- Version: 0.1
- Updated: 2026-08-15

## 1. Purpose

This register tracks executable catalog tasks. It is not a general roadmap. A task may move to `ACCEPTED` only after its acceptance criteria are actually verified and the Project Owner review is complete.

## 2. Status Model

| Status | Meaning |
|---|---|
| DISCUSSION | Scope exists but is not approved for execution. |
| READY | Scope and acceptance criteria are approved and can be executed. |
| IN_PROGRESS | Execution has started. |
| VERIFY | Work is complete enough for verification and owner review. |
| ACCEPTED | Acceptance criteria are verified and owner accepted the result. |
| BLOCKED | Work cannot proceed without external input or decision. |
| SUPERSEDED | Replaced by another approved task. |

## 3. Required Delivery Cycle

```text
DISCUSSION
  -> FORMALIZE TASK
  -> OWNER APPROVAL
  -> EXECUTION
  -> TESTING / VERIFICATION
  -> REPORT
  -> OWNER REVIEW
  -> ACCEPTED
```

If a result is incomplete, continue the same task iteration. Do not create a replacement task only to avoid failed acceptance criteria.

If the task definition is wrong, stop, describe the problem, propose a correction, and request owner approval.

## 4. Task Register

### GTC-CATALOG-005 - Catalog Runtime and Data Flow Design

| Field | Value |
|---|---|
| Task ID | GTC-CATALOG-005 |
| Title | Catalog Runtime and Data Flow Design |
| Goal | Design the GTC Catalog Data Plane on GTC1 for official AliExpress API ingestion, source evidence preservation, provider-neutral mapping, catalog processing, future persistence, and Catalog API access for GTC-AGENT-01/OpenClaw. |
| Status | VERIFY |
| Basis | Owner task `GTC-CATALOG-005 - Проектирование Catalog Data Plane и реестра задач`; completed GTC1 safety-barrier steps; owner-approved GTC1/GTC-AGENT-01 boundary. |
| Dependencies | GTC1-SAFETY-001 through GTC1-SAFETY-005; confirmed AliExpress app facts; existing repository governance standards. |
| Scope | Documentation-only architecture, data flow, contracts, data classification, reliability requirements, persistence requirements, task register, decision inventory, implementation plan, and permanent report. |
| Exclusions | No `gtc_catalog`, SQL schema, migrations, PostgreSQL changes, nginx changes, firewall/network changes, OpenClaw changes, runtime services, Docker changes, OAuth, App Secret use, Access Token request, live AliExpress API calls, or GTC-CATALOG-006 execution. |
| Acceptance Criteria | Required docs exist; flows A-J are covered; provider-neutral contracts are defined; data classification separates raw/evidence/claim/observation/candidate/canonical/derived; task register includes GTC-CATALOG-005 through 010; OPEN decisions are not marked APPROVED; internal links/checks pass; no secrets or runtime changes are introduced; changes are committed. |
| Verification/Test Plan | `rg` for forbidden runtime patterns and secrets; `git diff --check`; link/name consistency checks; `git status --short`; confirm no runtime/config paths changed. |
| Rollback/Change Boundary | Revert the documentation commit only. Do not touch PostgreSQL data/config, nginx, firewall, Docker, systemd, Azure resources, Catalog runtime, or AliExpress app settings. |
| Result | Design docs created and indexed; task register created; decision inventory records APPROVED/OPEN/DEFERRED/EVIDENCE_REQUIRED items. |
| Execution Report | `docs/catalog/GTC-CATALOG-005_REVISION_REPORT.md` |
| Commit SHA | Pending final git commit; see final response for immutable hash. |
| Next Action | Owner review. If accepted, formalize GTC-CATALOG-006 without executing OAuth until approved. |

### GTC-CATALOG-006 - AliExpress Connector and OAuth

| Field | Value |
|---|---|
| Task ID | GTC-CATALOG-006 |
| Title | AliExpress Connector and OAuth |
| Goal | Design and later implement the AliExpress connector and OAuth/token boundary after explicit owner approval. |
| Status | DISCUSSION |
| Basis | GTC-CATALOG-005 architecture requires official API connector and token manager. |
| Dependencies | GTC-CATALOG-005 owner acceptance; AliExpress app console access; approved OAuth redirect URI; approved secret storage mechanism; no App Secret exposure. |
| Scope | Future connector skeleton, OAuth flow design/implementation, token lifecycle, signing, SDK boundary, rate-limit handling, and redacted operational documentation. |
| Exclusions | Not authorized by GTC-CATALOG-005; no live OAuth or token retrieval until this task is approved. |
| Acceptance Criteria | Connector can authenticate through approved server-side OAuth flow; secrets are outside repo and logs; token expiry/refresh is handled; no direct access is given to GTC-AGENT-01; tests or dry-run checks prove no secret leakage. |
| Verification/Test Plan | Static secret scan; controlled OAuth smoke only after approval; connector unit tests with mocked API; log/process argv review. |
| Rollback/Change Boundary | Disable connector service/config, revoke test tokens if created, remove only new connector artifacts. |
| Result | Backlog only; not executed. |
| Execution Report | Pending future task. |
| Commit SHA | N/A |
| Next Action | Owner must approve OAuth redirect URI, token storage, and connector implementation boundary. |

### GTC-CATALOG-007 - AliExpress Live Capability Probe

| Field | Value |
|---|---|
| Task ID | GTC-CATALOG-007 |
| Title | AliExpress Live Capability Probe |
| Goal | Verify actual active AliExpress API capabilities against the AISTOR app using approved OAuth/token flow. |
| Status | DISCUSSION |
| Basis | Owner facts say Dropship permission group is active and SDK contains product/search/freight/inventory classes; live capability still needs evidence. |
| Dependencies | GTC-CATALOG-006 completed and accepted; bounded probe plan approved. |
| Scope | Minimal live calls to approved methods, response shape capture with secrets redacted, capability matrix update. |
| Exclusions | No broad ingestion, no catalog persistence, no unbounded product collection. |
| Acceptance Criteria | Redacted evidence shows method availability, response fields, error behavior, rate-limit signs, and data gaps. |
| Verification/Test Plan | Probe logs sanitized; raw payload classified; no secrets in docs/process/logs; owner reviews capability matrix. |
| Rollback/Change Boundary | Stop probe runner; revoke probe token if needed; no DB or production app rollback expected. |
| Result | Backlog only; not executed. |
| Execution Report | Pending future task. |
| Commit SHA | N/A |
| Next Action | Wait for GTC-CATALOG-006. |

### GTC-CATALOG-008 - RAW -> Canonical Mapping Validation

| Field | Value |
|---|---|
| Task ID | GTC-CATALOG-008 |
| Title | RAW -> Canonical Mapping Validation |
| Goal | Validate mapping from raw AliExpress evidence into provider-neutral claims, observations, candidates, and future canonical facts. |
| Status | DISCUSSION |
| Basis | GTC-CATALOG-005 requires provider-neutral boundary and separation of entity/fact resolution. |
| Dependencies | GTC-CATALOG-007 sample evidence; restored or approved source authority/conflict policy. |
| Scope | Mapping matrix, field-level provenance, unknown-field policy, validation against sample payloads, conflict examples. |
| Exclusions | No final SQL schema and no automatic canonical promotion unless policy is approved. |
| Acceptance Criteria | Mapping covers search/detail/SKU/seller/price/freight/media/error/replay cases; no AliExpress schema leaks as global catalog schema. |
| Verification/Test Plan | Fixture-based mapping tests; document consistency checks; owner review of unresolved conflicts. |
| Rollback/Change Boundary | Revert mapping docs/code for this task only; preserve raw evidence. |
| Result | Backlog only; not executed. |
| Execution Report | Pending future task. |
| Commit SHA | N/A |
| Next Action | Wait for GTC-CATALOG-007 evidence. |

### GTC-CATALOG-009 - Catalog Persistence Architecture

| Field | Value |
|---|---|
| Task ID | GTC-CATALOG-009 |
| Title | Catalog Persistence Architecture |
| Goal | Design persistence architecture and later schema/migration plan for isolated catalog storage. |
| Status | DISCUSSION |
| Basis | GTC-CATALOG-005 defines persistence requirements only; final schema is deferred. |
| Dependencies | GTC-CATALOG-005 acceptance; backup/restore baseline; owner decisions for retention, raw payload/object storage, and DB isolation. |
| Scope | Database boundaries, roles, logical schema proposal, append-only observation model, raw payload references, media/object storage references, retention and restore plan. |
| Exclusions | No database creation or migrations unless separately approved in an implementation task. |
| Acceptance Criteria | Architecture supports provenance, replay, temporal queries, isolated access roles, backup, restore, and migration path. |
| Verification/Test Plan | Static schema review, migration dry-run plan, restore plan review, security/role review. |
| Rollback/Change Boundary | Documentation rollback for design; future DB changes require separate rollback steps. |
| Result | Backlog only; not executed. |
| Execution Report | Pending future task. |
| Commit SHA | N/A |
| Next Action | Owner decides raw/object storage and retention policy. |

### GTC-CATALOG-010 - Bounded Catalog Ingestion

| Field | Value |
|---|---|
| Task ID | GTC-CATALOG-010 |
| Title | Bounded Catalog Ingestion |
| Goal | Implement a limited, observable, replayable ingestion slice after connector, capability, mapping, and persistence prerequisites. |
| Status | DISCUSSION |
| Basis | MVP must avoid unbounded AliExpress data collection and protect production services on GTC1. |
| Dependencies | GTC-CATALOG-006 through 009 accepted; owner-approved category/product bounds; monitoring and rollback plan. |
| Scope | Small ingestion job, idempotency, raw evidence capture, mapping, observations, API visibility for a bounded dataset. |
| Exclusions | No broad marketplace crawl, no direct GTC-AGENT-01 DB access, no secret exposure. |
| Acceptance Criteria | Bounded dataset ingests successfully; replay works; Catalog API exposes provider-neutral results; production services unaffected; rollback tested. |
| Verification/Test Plan | Unit/integration tests, live bounded smoke, resource usage check, logs/no-secrets check, restore/replay verification. |
| Rollback/Change Boundary | Stop ingestion job; disable API route if needed; remove only new runtime artifacts/data per approved rollback; no production app changes. |
| Result | Backlog only; not executed. |
| Execution Report | Pending future task. |
| Commit SHA | N/A |
| Next Action | Wait for 006-009. |

## 5. Revision History

| Version | Date | Author | Changes |
|---|---|---|---|
| 0.1 | 2026-08-15 | GTC IT / AI Assistant | Created executable task register for GTC-CATALOG-005 through 010 |
