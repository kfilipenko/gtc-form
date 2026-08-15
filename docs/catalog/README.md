# GTC Catalog Documentation

- Project: GTC Catalog Data Plane
- Owner: GTC INFORMATION TECHNOLOGY FZ-LLC
- Environment target: GTC1 as Data and Integration Plane; GTC-AGENT-01 as AI and Control Plane
- Document type: Internal catalog documentation index
- Status: Active planning index
- Version: 0.1
- Updated: 2026-08-15

## Purpose

This folder records the design, decisions, task register, and future implementation evidence for the GTC Product Intelligence Catalog.

The current approved direction is to build the catalog as a provider-neutral data plane that can ingest AliExpress product evidence through the official AliExpress API without making the AliExpress schema the global catalog schema.

## Current Canonical Documents

| Document | Purpose | Status |
|---|---|---|
| [catalog-runtime-architecture.md](catalog-runtime-architecture.md) | GTC-CATALOG-005 runtime and component architecture design | VERIFY |
| [catalog-data-flow.md](catalog-data-flow.md) | GTC-CATALOG-005 detailed data flows and provider-neutral contracts | VERIFY |
| [catalog-task-register.md](catalog-task-register.md) | Executable task register for GTC-CATALOG-005 and backlog 006-010 | VERIFY |
| [owner-decisions.md](owner-decisions.md) | Approved, open, deferred, and evidence-required decisions | VERIFY |
| [implementation-plan.md](implementation-plan.md) | MVP implementation sequence and safety gates | VERIFY |
| [GTC-CATALOG-005_REVISION_REPORT.md](GTC-CATALOG-005_REVISION_REPORT.md) | Permanent report for the GTC-CATALOG-005 design slice | VERIFY |

## Missing Historical Inputs

The GTC-CATALOG-005 source task referenced several expected catalog and standards documents that were not present in this checkout before this slice:

- `docs/catalog/product-vision.md`
- `docs/catalog/domain-model.md`
- `docs/catalog/canonical-knowledge-model.md`
- `docs/catalog/source-mapping-architecture.md`
- `docs/catalog/cross-source-enrichment-model.md`
- `docs/catalog/source-authority-and-conflict-policy.md`
- `docs/catalog/catalog-information-requirements.md`
- `docs/catalog/data-source-strategy.md`
- `docs/catalog/aliexpress-capability-matrix.md`
- `docs/catalog/aliexpress-data-gap-and-access-plan.md`
- `docs/catalog/GTC-CATALOG-002_REVISION_REPORT.md`
- `docs/catalog/GTC-CATALOG-003_REVISION_REPORT.md`
- `docs/catalog/GTC-CATALOG-004_REVISION_REPORT.md`
- `docs/standards/information-and-document-governance-standard-v1.md`
- `docs/standards/knowledge-architecture-standard-v1.md`
- `docs/standards/knowledge-file-maintenance-standard-v1.md`
- `docs/standards/security-policy.md`

Until those documents are restored or approved, decisions that depend on them remain OPEN or EVIDENCE_REQUIRED in [owner-decisions.md](owner-decisions.md).

## Active Boundary

```text
AliExpress API
  -> AliExpress Connector
  -> Raw Source Data / Evidence
  -> Source Mapping
  -> Claims + Observations
  -> Catalog Processing
  -> Catalog Persistence
  -> Catalog API
  -> GTC-AGENT-01 / OpenClaw
```

GTC-AGENT-01 / OpenClaw must access the catalog only through Catalog API. It must not receive direct PostgreSQL access or AliExpress App Secret access.

## Revision History

| Version | Date | Author | Changes |
|---|---|---|---|
| 0.1 | 2026-08-15 | GTC IT / AI Assistant | Created catalog documentation index for GTC-CATALOG-005 |
