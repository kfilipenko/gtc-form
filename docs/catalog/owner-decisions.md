# GTC Catalog Owner Decisions

- Project: GTC Catalog Data Plane
- Owner: GTC INFORMATION TECHNOLOGY FZ-LLC
- Document type: Decision inventory
- Status: VERIFY
- Version: 0.1
- Updated: 2026-08-15

## Purpose

This document separates APPROVED, OPEN, DEFERRED, and EVIDENCE_REQUIRED decisions for the catalog program.

OPEN decisions are not implementation permission. They must not be treated as APPROVED by future tasks.

## APPROVED

| ID | Decision | Basis | Consequence |
|---|---|---|---|
| CAT-DEC-001 | GTC1 is the Data and Integration Plane for the MVP direction. | Owner instruction in GTC-CATALOG-005 and prior safety-barrier work. | Marketplace connectors, OAuth/token handling, ingestion, source mapping, processing, persistence, and Catalog API are designed for GTC1 placement. |
| CAT-DEC-002 | GTC-AGENT-01 is the AI and Control Plane. | Owner instruction in GTC-CATALOG-005. | OpenClaw and agents consume only Catalog API, not direct PostgreSQL and not AliExpress App Secret. |
| CAT-DEC-003 | AliExpress access must use official API capabilities only. | Owner instruction and current AliExpress app facts. | No scraping or unofficial source use is in scope for MVP design. |
| CAT-DEC-004 | The existing AliExpress app is AISTOR, status Online, category Drop Shipping, Dropship permission group Active. | Owner-provided confirmed facts for the current stage. | Connector design can assume dropshipping API capability exists, but live API calls remain out of scope for GTC-CATALOG-005. |
| CAT-DEC-005 | OAuth2.0 server-side is the required AliExpress authorization model. | Owner-provided confirmed facts. | Token manager must support access token and refresh token lifecycle, but no OAuth flow is executed in GTC-CATALOG-005. |
| CAT-DEC-006 | Access token duration is 30 days and refresh token duration is 60 days. | Owner-provided confirmed facts. | Runtime design must include expiry, refresh, rotation, and alerting requirements. |
| CAT-DEC-007 | AliExpress schema must not become the global catalog schema. | GTC-CATALOG-005 requirement. | Provider-neutral contracts are mandatory between connector, ingestion, mapping, processing, persistence, and API. |
| CAT-DEC-008 | Raw source evidence must be preserved before mapping and processing. | GTC-CATALOG-005 requirement. | Raw source envelope, payload hash/reference, provenance, acquisition status, and replay requirements are mandatory. |
| CAT-DEC-009 | Entity Resolution and Fact Resolution are separate responsibilities. | GTC-CATALOG-005 requirement. | SAME_PRODUCT_MODEL allows evidence linkage but does not automatically promote incoming claims to canonical product facts. |
| CAT-DEC-010 | GTC-CATALOG-005 is design-only. | GTC-CATALOG-005 scope. | No runtime services, database, migrations, OAuth, live API calls, PostgreSQL, nginx, Docker, firewall, Catalog, or AliExpress runtime changes are allowed. |

## OPEN

| ID | Decision Needed | Why It Is Open | Required Before |
|---|---|---|---|
| CAT-OPEN-001 | Confirm final Catalog API authentication model for GTC-AGENT-01. | WireGuard/private network boundary is known, but API auth mechanism is not approved. | GTC-CATALOG-006 or API skeleton task. |
| CAT-OPEN-002 | Confirm AliExpress OAuth redirect URI, app scopes, and consent owner. | OAuth must not be run in GTC-CATALOG-005 and App Secret must not be used. | GTC-CATALOG-006. |
| CAT-OPEN-003 | Confirm token storage mechanism. | Secrets must be outside repo and outside plaintext backups; exact store is not approved. | GTC-CATALOG-006. |
| CAT-OPEN-004 | Confirm whether raw payload blobs stay on local encrypted filesystem first or go to object storage. | SAFETY-004 recommends encrypted off-host design, but no dedicated object store exists yet. | GTC-CATALOG-009. |
| CAT-OPEN-005 | Confirm initial Catalog API method set. | API must remain provider-neutral; exact endpoints need owner review. | GTC-CATALOG-006 or GTC-CATALOG-010. |
| CAT-OPEN-006 | Confirm MVP category/product scope for bounded ingestion. | AliExpress catalog is broad; MVP must not ingest unbounded data. | GTC-CATALOG-010. |
| CAT-OPEN-007 | Confirm data retention periods for raw evidence, observations, derived facts, and media references. | Legal/commercial retention policy is not present in the current catalog docs. | GTC-CATALOG-009. |
| CAT-OPEN-008 | Confirm source authority ranking among AliExpress, future marketplaces, manufacturer pages, seller data, and internal curation. | The referenced conflict policy document is absent in this checkout. | GTC-CATALOG-008 or later multi-source work. |

## DEFERRED

| ID | Deferred Topic | Reason | Earliest Task |
|---|---|---|---|
| CAT-DEF-001 | Final SQL schema and migrations. | GTC-CATALOG-005 allows only persistence requirements. | GTC-CATALOG-009 or later approved implementation task. |
| CAT-DEF-002 | pg_basebackup/WAL architecture for catalog DB. | Existing stage is logical backup and restore verification; catalog DB does not exist yet. | Later operations task after MVP restore baseline. |
| CAT-DEF-003 | Live AliExpress API probing. | Explicitly forbidden in GTC-CATALOG-005. | GTC-CATALOG-007 after OAuth and scope approval. |
| CAT-DEF-004 | Canonical Product Facts promotion policy automation. | Needs source authority/conflict policy and evidence from real API payloads. | After GTC-CATALOG-008. |
| CAT-DEF-005 | Multi-marketplace enrichment. | MVP starts with AliExpress connector and provider-neutral boundary. | Post-MVP. |

## EVIDENCE_REQUIRED

| ID | Evidence Needed | Current State | How To Resolve |
|---|---|---|---|
| CAT-EVD-001 | Restore or recreate missing catalog canonical documents listed in README. | Not present in this checkout before GTC-CATALOG-005. | Owner supplies prior docs, or a future documentation reconstruction task creates approved replacements. |
| CAT-EVD-002 | Official AliExpress SDK class/method inventory as repository evidence. | Owner states SDK was obtained and studied; files/evidence are not committed here. | GTC-CATALOG-006/007 should record redacted SDK capability evidence without secrets. |
| CAT-EVD-003 | AliExpress rate limits and quota values for the active app. | Not available in current docs. | GTC-CATALOG-006/007 should read official console/docs and record values without secrets. |
| CAT-EVD-004 | Exact private network API URL and TLS/auth boundary for GTC-AGENT-01. | GTC1/GTC-AGENT-01 role split is approved; final API endpoint is not. | API design task must approve route and auth model. |

## Revision History

| Version | Date | Author | Changes |
|---|---|---|---|
| 0.1 | 2026-08-15 | GTC IT / AI Assistant | Created decision inventory for GTC-CATALOG-005 |
