# GTC Catalog Implementation Plan

- Project: GTC Catalog Data Plane
- Owner: GTC INFORMATION TECHNOLOGY FZ-LLC
- Document type: Internal implementation plan
- Status: VERIFY
- Version: 0.1
- Updated: 2026-08-15

## 1. Purpose

This plan defines the safe sequence from design to MVP. It does not authorize tasks beyond GTC-CATALOG-005.

## 2. Safety Baseline

The catalog program starts after the GTC1 infrastructure safety barrier:

- PostgreSQL logical backup foundation exists.
- Restore verification for the logical backup set was performed.
- Azure Recovery Services on-demand recovery point was created after the logical backup.
- Off-host logical backup target design is pending implementation.
- PostgreSQL/network hardening remains a later controlled change, not part of this task.

## 3. MVP Sequence

| Order | Task | Gate |
|---|---|---|
| 1 | GTC-CATALOG-005 - Catalog Runtime and Data Flow Design | Owner accepts design docs and task register. |
| 2 | GTC-CATALOG-006 - AliExpress Connector and OAuth | Owner approves OAuth redirect, token storage, connector skeleton, and no-secret logging checks. |
| 3 | GTC-CATALOG-007 - AliExpress Live Capability Probe | Only after OAuth boundary exists; probe is bounded and redacted. |
| 4 | GTC-CATALOG-008 - RAW -> Canonical Mapping Validation | Requires real redacted payload evidence and source authority/conflict rules. |
| 5 | GTC-CATALOG-009 - Catalog Persistence Architecture | Requires owner decisions on retention, raw/object storage, and DB isolation. |
| 6 | GTC-CATALOG-010 - Bounded Catalog Ingestion | Requires accepted connector, probe, mapping, persistence, monitoring, and rollback plan. |

## 4. Required Change Gates

Before any runtime implementation:

1. confirm no direct PostgreSQL access from GTC-AGENT-01;
2. confirm Catalog API auth model;
3. confirm token storage outside repo and public roots;
4. confirm no secrets in process argv/logs/docs;
5. confirm DB isolation plan before creating `gtc_catalog`;
6. confirm backup/restore coverage for catalog data;
7. confirm bounded ingestion limits and resource budget;
8. confirm rollback for every runtime/service change.

## 5. MVP Runtime Placement Recommendation

Recommended MVP placement:

- Catalog Data Plane on GTC1;
- AliExpress Connector on GTC1 as isolated integration service in a later approved task;
- Catalog API on GTC1, reachable by GTC-AGENT-01 through private network only;
- OAuth tokens/secrets on GTC1 in host-managed secret storage, not repo and not backup plaintext;
- raw evidence stored as immutable local references first, with encrypted off-host copy after storage target implementation;
- media stored as references first, with optional object/media pipeline later.

## 6. Migration Path

MVP:

```text
GTC1 PostgreSQL + local raw evidence references + Catalog API
```

Scale step 1:

```text
Dedicated object storage for encrypted raw payload/media archives
  + GTC1 catalog DB isolation
  + recurring restore tests
```

Scale step 2:

```text
Separate DB/Data server
  + dedicated object storage
  + Catalog API remains the boundary for AI/control systems
```

Scale step 3:

```text
Multi-source Product Intelligence Catalog
  + marketplace connectors
  + manufacturer/authority sources
  + source authority and conflict resolution
```

## 7. Non-Authorized Work

The following are not authorized by this plan alone:

- creating `gtc_catalog`;
- creating roles or schemas;
- running OAuth;
- using App Secret;
- calling AliExpress live API;
- exposing API publicly;
- changing PostgreSQL, nginx, firewall, Docker, systemd, or Azure.

## 8. Revision History

| Version | Date | Author | Changes |
|---|---|---|---|
| 0.1 | 2026-08-15 | GTC IT / AI Assistant | Created MVP implementation sequence for GTC-CATALOG-005 |
