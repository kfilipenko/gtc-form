# GTC Catalog Data Flow

- Task: GTC-CATALOG-005 - Catalog Runtime and Data Flow Design
- Project: GTC Catalog Data Plane
- Owner: GTC INFORMATION TECHNOLOGY FZ-LLC
- Document type: Internal data-flow design
- Status: VERIFY
- Version: 0.1
- Updated: 2026-08-15

## 1. Scope

This document defines logical data flows for future GTC Catalog ingestion and API access.

It does not define final SQL schema, migrations, runtime services, OAuth execution, or live AliExpress API calls.

## 2. Primary Flow

```text
Acquisition Request
  -> AliExpress Connector
  -> Official AliExpress API response
  -> Raw Source Envelope
  -> Evidence record and raw payload reference/hash
  -> Source Mapping
  -> Extracted Claims and Temporal Observations
  -> Validation
  -> Entity Resolution candidates
  -> Fact Resolution candidates
  -> Future Catalog Persistence
  -> Catalog API
  -> GTC-AGENT-01 / OpenClaw
```

## 3. Stage Contracts

| Stage | Input | Output | Non-Goals |
|---|---|---|---|
| Connector | Acquisition Request | API response classification and raw payload | Canonical product decisions |
| Ingestion | API response | Raw Source Envelope, Evidence record | Provider-neutral facts |
| Source Mapping | Raw Source Envelope | Mapped Source Object | Final conflict resolution |
| Claims/Observations | Mapped Source Object | Extracted Claims, Temporal Observations | Canonical truth |
| Processing | Claims/Observations | Identity candidates, candidate facts, conflicts | Unreviewed canonical promotion |
| Persistence | Processed objects | Stored evidence, observations, candidates, facts | Final SQL schema in this task |
| Catalog API | Stored catalog state | Provider-neutral API response | Direct provider/DB access from agents |

## 4. Flow A - Product Search

```text
Search request
  -> Connector validates permitted search method and request bounds
  -> API response captured
  -> Raw Source Envelope per response batch
  -> Product listing items mapped as source claims
  -> Listing price/availability mapped as temporal observations
  -> Product identity candidates created from title, image, SKU hints, brand/manufacturer claims if present
  -> Results exposed later through Catalog API as source-backed candidates
```

Rules:

- search result order is marketplace state, not product truth;
- search query, destination, currency, language, and observed time are mandatory context;
- duplicate listing hits should reuse idempotency keys and create new observations only when source state changed or observation cadence requires it.

## 5. Flow B - Product Detail

```text
Detail request by external product ID
  -> Connector calls official detail method
  -> Full raw detail payload preserved
  -> Product descriptive fields mapped as claims
  -> SKU list, media, seller, logistics hints split into separate objects
  -> Identity and fact candidates generated
  -> Existing product model candidates compared
```

Rules:

- product title, description, specs, and attributes are claims;
- price, stock, discount, rating, and sales counters are observations;
- detail payload can enrich an existing candidate but does not overwrite canonical facts without fact resolution.

## 6. Flow C - SKU / Variant

```text
SKU/variant payload
  -> Raw payload preserved under the same or related envelope
  -> Variant attributes mapped with provider field paths
  -> SKU identifier treated as provider-scoped external ID
  -> Variant identity candidate generated
  -> Price/stock per SKU recorded as observations
```

Rules:

- Product Model and SKU Variant are separate levels;
- color, size, plug type, material, and bundle attributes may be identity signals or selectable variant attributes;
- SKU stock and SKU price remain temporal observations.

## 7. Flow D - Seller / Store

```text
Seller/store fields
  -> Seller source object mapped
  -> Seller claims and seller observations generated
  -> Seller identity candidate created separately from Product Model
  -> Product listing linked to seller evidence
```

Rules:

- seller name/rating/status do not define manufacturer identity;
- seller availability is marketplace state;
- seller/store evidence must remain queryable for trust and source authority decisions.

## 8. Flow E - Price / Availability

```text
Price or inventory response
  -> Destination/currency/request context preserved
  -> Price amount, currency, discount, stock, availability mapped
  -> Temporal Observation created
  -> Staleness policy attached
  -> Catalog API can expose last-known and observation timestamp
```

Rules:

- price is never a stable Product Model fact;
- every price observation must include currency, marketplace, destination context where applicable, and observed_at;
- stale observations must not be presented as current availability.

## 9. Flow F - Logistics / Freight

```text
Freight request
  -> Connector includes destination and SKU/product context
  -> Raw freight response preserved
  -> shipping method, estimate, fee, delivery window mapped
  -> Temporal logistics observation created
  -> Linked to product/SKU and destination context
```

Rules:

- freight is destination-sensitive and temporal;
- freight methods and delivery promises are marketplace observations, not canonical product attributes;
- partial freight responses must be preserved and marked PARTIAL.

## 10. Flow G - Manufacturer Claim

```text
Manufacturer-like provider field or description phrase
  -> Source claim extracted
  -> Manufacturer identity candidate generated only when field confidence supports it
  -> Conflict/authority policy determines later promotion
```

Rules:

- seller, brand, factory, and manufacturer may be different entities;
- AliExpress marketplace data alone may not be sufficient to approve canonical manufacturer facts;
- if manufacturer evidence is absent, the system records UNKNOWN/NOT_OBSERVED rather than inventing a value.

## 11. Flow H - Media

```text
Media URL/list in source payload
  -> Media references preserved with raw payload evidence
  -> Media hash/fetch status planned for future optional media pipeline
  -> Media linked to product/SKU/seller context as source media claim
```

Rules:

- media URL/reference is evidence and claim material;
- binary media storage is separate from relational catalog persistence;
- media download/caching is not part of GTC-CATALOG-005 and needs its own rights/access decision.

## 12. Flow I - Error or Partial Response

```text
Connector request
  -> API timeout/error/partial payload
  -> Raw error payload or error metadata captured
  -> Acquisition status classified
  -> Retry policy applied if retryable
  -> Evidence retained for audit
```

Rules:

- partial responses are not discarded;
- permanent errors stop retries and keep evidence;
- auth expired state must not log or expose tokens;
- rate-limited/quota-exhausted state must pause bounded ingestion.

## 13. Flow J - Repeated Collection Of Same Product

```text
Repeat request for same external product ID and context
  -> Idempotency key checked
  -> New observed_at captured
  -> Raw payload hash compared
  -> If unchanged, record lightweight observation/check event
  -> If changed, create new evidence and observations
  -> Preserve prior observations for temporal history
```

Rules:

- repeated collection is expected and valuable for price/stock/logistics;
- immutable evidence must not be overwritten;
- canonical facts must retain supersession history when future fact resolution changes.

## 14. Provider-Neutral API Response Shape

Future Catalog API responses should be provider-neutral and provenance-aware:

```json
{
  "catalog_subject": {
    "type": "product_model",
    "id": "future-catalog-id",
    "identity_status": "candidate"
  },
  "facts": [],
  "observations": [
    {
      "type": "price",
      "value": "source-backed value",
      "currency": "USD",
      "observed_at": "timestamp",
      "stale_after": "timestamp",
      "evidence_ref": "opaque evidence reference"
    }
  ],
  "claims": [
    {
      "predicate": "title",
      "value": "source-backed title",
      "source": "aliexpress",
      "evidence_ref": "opaque evidence reference"
    }
  ],
  "provenance": {
    "source_count": 1,
    "latest_observed_at": "timestamp",
    "mapping_version": "version"
  }
}
```

The API must not expose provider secrets, access tokens, raw App Secret material, or direct database identifiers unless explicitly approved.

## 15. Validation Gates

Minimum validation checks before persistence/API exposure:

- envelope has source, marketplace, connector, method, version, observed_at, payload hash/reference;
- request context contains destination/currency/locale where needed;
- raw payload hash verifies;
- mapping version exists;
- unknown fields are retained or summarized;
- temporal observations have observed_at and stale policy;
- provider IDs remain provider-scoped;
- no OPEN decision is silently treated as approved.

## 16. Revision History

| Version | Date | Author | Changes |
|---|---|---|---|
| 0.1 | 2026-08-15 | GTC IT / AI Assistant | Created GTC-CATALOG-005 data-flow design |
