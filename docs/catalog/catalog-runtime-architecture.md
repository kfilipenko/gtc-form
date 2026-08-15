# GTC Catalog Runtime Architecture

- Task: GTC-CATALOG-005 - Catalog Runtime and Data Flow Design
- Project: GTC Catalog Data Plane
- Owner: GTC INFORMATION TECHNOLOGY FZ-LLC
- Document type: Internal architecture design
- Status: VERIFY
- Version: 0.1
- Updated: 2026-08-15

## 1. Scope

This document designs the Catalog Data Plane application boundary for GTC1.

This is not a runtime implementation task. It does not create:

- `gtc_catalog`;
- SQL schema;
- migrations;
- runtime services;
- OAuth tokens;
- AliExpress live API calls;
- PostgreSQL, nginx, firewall, Docker, or systemd changes.

## 2. Inputs Reviewed

Read before this design:

- `README.md`
- `docs/TECHNICAL_DOCUMENTATION.md`
- `docs/project-overview.md`
- `docs/ops/governance-standard.md`
- `docs/ops/storage-architecture-standard.md`
- `docs/ops/server-applications-registry.md`
- `docs/gtc_project_delivery_standard/05_task_definition_and_fixation_standard.md`
- `docs/gtc_project_delivery_standard/07_documentation_register_and_memory_standard.md`
- `docs/gtc_project_delivery_standard/09_testing_deploy_and_release_standard.md`
- `docs/gtc_project_delivery_standard/10_security_access_and_authority_standard.md`
- owner-provided GTC-CATALOG-005 task text
- owner-provided confirmed AliExpress app facts
- prior safety-barrier results from GTC1-SAFETY-001 through GTC1-SAFETY-005

The exact catalog documents named by the task were not present in this checkout before this slice. That absence is recorded in [README.md](README.md) and [owner-decisions.md](owner-decisions.md).

## 3. Approved Architecture Boundary

```text
GTC1 = Data and Integration Plane
  - Marketplace Connectors
  - AliExpress OAuth and secrets
  - ingestion
  - Source Mapping
  - catalog processing
  - persistence
  - Catalog API

GTC-AGENT-01 = AI and Control Plane
  - OpenClaw
  - AI agents
  - reasoning/orchestration
  - access only through Catalog API
```

GTC-AGENT-01 must not receive direct PostgreSQL access or AliExpress App Secret access.

## 4. Target Application Shape

```text
AliExpress API
  -> AliExpress Connector
  -> Catalog Ingestion
  -> Raw Source Envelope and Evidence Store
  -> Source Mapping
  -> Claims and Observations
  -> Catalog Processing
  -> Catalog Persistence
  -> Catalog API
  -> GTC-AGENT-01 / OpenClaw
```

The architecture is provider-neutral after the connector boundary. AliExpress-specific data is preserved as evidence, then translated into neutral claims, observations, and later candidate/canonical facts.

## 5. Components

### 5.1 AliExpress Connector

Responsibilities:

- OAuth/token manager requirements;
- official API client and request signing boundary;
- capability adapter for dropshipping product/search/detail/freight/inventory methods;
- rate-limit and quota handling;
- retry/backoff policy;
- normalized connector errors;
- API method/version identification;
- response classification before ingestion.

The connector must not decide canonical product truth. It produces acquisition results and raw source envelopes.

### 5.2 Catalog Ingestion

Responsibilities:

- acquisition request record;
- idempotency key generation;
- raw response capture;
- source envelope creation;
- payload hash;
- acquisition status;
- replay boundary;
- correlation IDs;
- provenance metadata;
- partial response handling.

Ingestion is the audit boundary. It must be possible to prove what was observed, when, under what request context, and through which connector version.

### 5.3 Raw Evidence Store

Responsibilities:

- preserve immutable raw payloads or raw payload references;
- store hashes and envelope metadata;
- keep request/response evidence separate from processed catalog records;
- allow replay of mapping/processing without calling the provider again;
- include `globals.sql`-like sensitivity thinking: raw data may contain credential-like or commercially sensitive fields and must not be exported plaintext.

### 5.4 Source Mapping

Responsibilities:

- translate provider-specific fields into provider-neutral claim/observation inputs;
- preserve unknown fields;
- normalize units, currency, language, locale, destination country, and schema/API version;
- record mapping version;
- record field-level provenance;
- separate product model identity hints from price, stock, seller, logistics, and marketplace state.

Source mapping must be deterministic and replayable for a given mapping version and raw source envelope.

### 5.5 Claims and Observations Layer

Responsibilities:

- create Extracted Claims from mapped provider fields;
- create temporal Observations for time-sensitive state such as price, stock, availability, shipping promise, seller status, and freight quote;
- keep claim confidence and source context;
- avoid canonical promotion without conflict and authority rules.

### 5.6 Catalog Processing

Responsibilities:

- identity candidate generation;
- entity resolution workflow;
- fact candidate generation;
- conflict detection;
- fact resolution workflow;
- validation and quality gates;
- stale observation detection;
- promotion readiness for future canonical Product Facts.

Entity Resolution and Fact Resolution are separate.

`SAME_PRODUCT_MODEL` means evidence can be attached to a Product Model candidate. It does not mean every incoming source value becomes a canonical Product Fact.

### 5.7 Catalog Persistence

This design defines requirements only, not final SQL schema.

Persistence must support:

- relational metadata for source, connector, acquisition, mapping, and API-facing records;
- append-only observations;
- immutable raw payload references and hashes;
- temporal queries;
- provenance tracing from API response to claim/observation/fact;
- replay metadata;
- versioned mapping and processing results;
- future search/vector requirements;
- object/media storage references without storing every media binary in PostgreSQL by default.

### 5.8 Catalog API

Responsibilities:

- provider-neutral interface for GTC-AGENT-01 and OpenClaw;
- read-only catalog access for MVP unless an approved write workflow is created;
- no direct PostgreSQL exposure;
- no provider secrets;
- stable response contracts that expose provenance and confidence without leaking raw secrets;
- request-scoped authorization and audit.

## 6. Additional Components Required

The initial decomposition is valid but incomplete without the following supporting components:

| Component | Why Required |
|---|---|
| Connector Capability Registry | Records which AliExpress methods/scopes are available, unverified, blocked, or deprecated. |
| Acquisition Scheduler / Queue | Prevents unbounded ingestion, supports retry, idempotency, and rate control. |
| Token Secret Boundary | Stores tokens outside repo and outside plaintext backup exports. |
| Quality Gate / Validation Engine | Separates syntactic mapping from trustworthy catalog knowledge. |
| Audit/Event Log | Records connector activity, mapping versions, API access, and promotion decisions. |
| Replay Tooling | Reprocesses raw envelopes when mapping or processing versions change. |
| Monitoring and Alerting | Detects token expiry, quota exhaustion, API drift, and stale observations. |
| Export/Access Policy | Defines what GTC-AGENT-01 may request and what must remain internal. |

## 7. Provider-Neutral Contracts

The contracts below are logical contracts, not SQL tables.

### 7.1 Acquisition Request

Required fields:

- request ID;
- source;
- marketplace;
- connector;
- connector version;
- API method;
- request type;
- external object ID when known;
- search query/filter context when applicable;
- destination country;
- currency;
- language/locale;
- idempotency key;
- requested_at;
- requester/system actor;
- rights/access context;
- status.

### 7.2 Raw Source Envelope

Minimum fields:

- source;
- marketplace;
- connector;
- connector version;
- API method;
- API/schema version;
- external object ID;
- request context;
- destination country;
- currency;
- language/locale;
- observed_at;
- acquired_at;
- raw payload reference;
- raw payload SHA256 hash;
- mapping version;
- rights/access context;
- acquisition status;
- retry count;
- correlation ID;
- idempotency key;
- provider request ID if available;
- partial/error classification;
- retention class.

### 7.3 Mapped Source Object

Required fields:

- envelope reference;
- mapping version;
- mapped entity type;
- provider field paths;
- normalized values;
- units;
- currency;
- locale;
- unknown fields reference;
- mapping warnings.

### 7.4 Extracted Claim

Required fields:

- claim ID;
- source envelope reference;
- mapped field reference;
- subject candidate;
- predicate;
- value;
- value type;
- unit/currency/locale when applicable;
- claim scope;
- source confidence;
- extracted_at;
- mapping version.

### 7.5 Temporal Observation

Required fields:

- observation ID;
- observed subject;
- observation type;
- value;
- observed_at;
- valid_from if available;
- valid_until if available;
- source envelope reference;
- destination context;
- marketplace context;
- stale-after policy.

### 7.6 Candidate Fact

Required fields:

- candidate fact ID;
- claim/observation references;
- subject candidate;
- predicate;
- proposed value;
- confidence;
- conflict group;
- processing version;
- status.

### 7.7 Canonical Fact

Required fields:

- canonical fact ID;
- canonical subject;
- predicate;
- value;
- authority basis;
- evidence references;
- effective dates;
- approved processing/curation status;
- supersession state.

## 8. Data Classification

| Data Type | Classification | Rule |
|---|---|---|
| Raw API response | RAW/source data | Immutable evidence input; not canonical knowledge. |
| Raw payload hash/reference | Evidence | Used to prove integrity and replay source mapping. |
| API request context | Evidence | Required to interpret country, currency, locale, and rights context. |
| Provider product title | Claim | A source assertion about a product, not canonical model name by default. |
| Price | Temporal Observation | Depends on time, currency, destination, and marketplace state. |
| Stock/availability | Temporal Observation | Time-sensitive state; do not mix with Product Model. |
| SKU attributes | Claim plus possible identity signal | May support variant identity, but still source-scoped. |
| Seller/store info | Claim/Observation about seller/store | Separate from Product Model. |
| Freight estimate | Temporal Observation | Destination-sensitive logistics state. |
| Manufacturer statement | Claim | Requires source authority validation before canonical use. |
| Identity match | Candidate/Canonical entity resolution result | Does not automatically promote facts. |
| Conflict-resolved attribute | Candidate Fact or Canonical Fact | Depends on approved authority and conflict policy. |
| Model embedding/search vector | Derived knowledge | Must trace back to source evidence and processing version. |

## 9. Reliability Requirements

The design must support:

- bounded request timeouts;
- exponential backoff with jitter;
- per-method retry policies;
- non-retryable error classification;
- quota/rate-limit stop conditions;
- token expired and refresh-required state;
- partial response persistence;
- unknown field capture;
- schema/API version drift detection;
- duplicate request idempotency;
- replay without provider call;
- stale observation marking;
- acquisition status transitions.

Recommended acquisition statuses:

```text
REQUESTED
IN_PROGRESS
SUCCEEDED
PARTIAL
FAILED_RETRYABLE
FAILED_PERMANENT
AUTH_EXPIRED
RATE_LIMITED
QUOTA_EXHAUSTED
REPLAYED
SUPERSEDED
```

## 10. Security Boundary

Security requirements:

- no App Secret in repo, docs, command argv, logs, or backup plaintext;
- no OAuth execution in design task;
- tokens stored outside public web directories;
- runtime API role separate from migration/admin role in future DB design;
- GTC-AGENT-01 uses Catalog API only;
- raw evidence exports encrypted before off-host movement;
- audit all connector runs and Catalog API access;
- least-privilege credentials for provider, DB, and API.

## 11. MVP Recommendation

For MVP, implement the catalog data plane on GTC1 only after approved DB/role/network hardening follow-up tasks:

1. keep AliExpress Connector, ingestion, mapping, processing, persistence, and Catalog API on GTC1;
2. expose only Catalog API to GTC-AGENT-01 over private network;
3. create isolated `gtc_catalog` and catalog roles only in a later approved task;
4. run bounded ingestion only after OAuth and capability probe approval;
5. preserve raw evidence before normalization.

## 12. Revision History

| Version | Date | Author | Changes |
|---|---|---|---|
| 0.1 | 2026-08-15 | GTC IT / AI Assistant | Created GTC-CATALOG-005 runtime architecture design |
