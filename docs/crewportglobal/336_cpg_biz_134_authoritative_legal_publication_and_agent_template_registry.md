# CPG-BIZ-134 - Authoritative Legal Publication And Agent Agreement Template Registry

- Project: CrewPortGlobal.com
- Company: GTC INFORMATION TECHNOLOGY FZ-LLC
- Document type: Implementation report and approved follow-up task
- Version: 1.1
- Date: 2026-06-19
- Status: Cleanup implemented; template-registry work approved for next implementation slice

## 1. Business Decision

CrewPortGlobal formal documents are published for participant review in one place only:

```text
https://crewportglobal.com/legal/
```

Each formal document must have one canonical public full-text URL under `/legal/`.

Operational pages, dashboards, task cards, forms and workspaces may show:

1. document title;
2. document code/version;
3. short practical explanation;
4. status such as `authoritative`, `pending`, `accepted` or `commercial_terms_pending`;
5. a link to the canonical `/legal/...` document;
6. a reference to a clause/section where useful.

They must not publish duplicate full legal text, expose public raw markdown as a user-facing document, or link to internal `/docs/crewportglobal/*.md` files.

## 2. Cleanup Implemented

The following defects were corrected:

1. removed visible `Canonical Markdown` buttons from generated public pages;
2. removed the `Canonical Markdown` injection from the public-page generator;
3. disabled `index.md` fallback publication in `public/router.php`;
4. removed duplicate public markdown source from `/legal/agent-agreement/text/index.md`;
5. changed `/legal/agent-agreement/text/` into a redirect-only legacy route;
6. embedded the full authoritative English `CPG-BIZ-132 v1.0` agreement into the single canonical public page `/legal/agent-agreement/`;
7. moved public-page markdown sources out of `public/` into `projects/crewportglobal/content/public_pages/`;
8. added `check_public_document_publication.js` to detect regression.

## 3. Current Canonical URLs

| Document | Canonical public URL |
|---|---|
| Legal document hub | `/legal/` |
| Shipowner-Agent Agreement Package | `/legal/agent-agreement/` |

The legacy route `/legal/agent-agreement/text/` must not be treated as publication. It only redirects to `/legal/agent-agreement/`.

## 4. Agent Agreement Template Registry Task

The Shipowner-Agent Agreement is no longer just a static legal text. It must become a versioned contract-generation template.

The next implementation slice must create a registry model for:

```text
approved agreement template
+ clause IDs
+ embedded fields
+ source records from the database
+ approved catalog / controlled input values
+ party confirmations
+ generated snapshot and hash
= generated shipowner-agent agreement instance
```

## 5. Required Field Mapping

The template registry must define each field as:

```text
field_key
clause_id
label
choice_type
source_type
source_table_or_object
source_column_or_path
verification_rule
editable_policy
required_policy
snapshot_policy
```

Initial source mapping:

| Template field | Source type | Expected source |
|---|---|---|
| `{{contract_number}}` | computed | agreement offer / generated contract instance |
| `{{contract_date}}` | computed/date | offer or signature event timestamp |
| `{{shipowner_legal_name}}` | linked_record | `employer_companies.company_name` |
| `{{shipowner_signer_name}}` | linked_record | shipowner-side user / authority record |
| `{{shipowner_signer_basis}}` | document_reference / controlled_input | authority evidence / corporate role |
| `{{agent_legal_name}}` | linked_record | `agent_organizations.agent_display_name` and future legal-name field |
| `{{agent_signer_name}}` | linked_record | `agent_users` / acting agent representative |
| `{{agent_signer_basis}}` | document_reference / controlled_input | agent authority evidence |
| `{{delegated_scope_*}}` | linked_record / controlled_input | `agent_framework_agreement_offers.delegated_scope` |
| `{{authority_document_id}}` | document_reference | `agent_authority_documents` |
| `{{commercial_terms_status}}` | computed/catalog | `agent_framework_agreement_offers.commercial_terms_status` |
| `{{service_order_reference}}` | document_reference | future Service Order / commercial addendum |
| `{{notification_ledger_event_ids}}` | computed | `participant_notification_ledger` |
| signatures / acceptance | signature | offer acceptance and future signature events |

## 6. Generation Workflow

1. Shipowner selects a registered agent from the shipowner workspace.
2. System prepares an agreement workspace/snapshot from `CPG-BIZ-132`.
3. Linked facts are prefilled from verified platform records.
4. Selectable commercial or authority fields use approved catalogs or controlled inputs.
5. Shipowner sends the offer.
6. Agent reviews the populated agreement in contract context.
7. Agent accepts/signs the agreement package.
8. System records:
   - template code/version;
   - clause/field version;
   - source record ids;
   - field values;
   - authority document references;
   - acceptance/signature text;
   - actor/timestamp;
   - generated snapshot hash;
   - notification ledger events.

## 7. Guard Rules

1. Fixed legal clauses are not editable in ordinary UI.
2. Operational UI must not copy full legal clauses; it links to `/legal/agent-agreement/`.
3. Linked facts must be corrected in the source record, not retyped in the contract workspace.
4. Commercial price remains separate unless recorded through an approved Service Order / commercial addendum / request or price-basis record.
5. External contracts or powers of attorney may be evidence, but do not bypass the platform template, authority and one-active-manager controls.

## 8. Verification Commands

```text
node projects/crewportglobal/scripts/check_public_document_publication.js
git diff --check
curl -I http://127.0.0.1:8787/legal/agent-agreement/
curl -I http://127.0.0.1:8787/legal/agent-agreement/text/
```

## 9. Next Implementation Recommendation

Previous recommended next stage:

```text
CPG-BIZ-135 - Shipowner-Agent Agreement Template Registry API/UI design
```

This recommendation has been expanded by CPG-BIZ-135 after the Project Owner clarified that the agent must be able to conclude agreements with both seafarer and shipowner, while the direct seafarer-shipowner agreement remains central.

Current next stage:

```text
CPG-BIZ-136 - Contract Workspace Multi-Template Registry API/UI implementation
```

The next implementation should design the database objects, API response shape and contract-workspace UI adapter for multiple `contract_kind` values, including `shipowner_agent_framework`, `seafarer_agent_representation` and `seafarer_shipowner_employment`.

## 10. Revision History

| Version | Date | Author | Changes |
|---|---|---|---|
| 1.1 | 2026-06-19 | GTC IT / AI Assistant | Expanded next-stage recommendation from shipowner-agent-only template registry to the unified multi-template contract workspace model fixed in CPG-BIZ-135 |
| 1.0 | 2026-06-19 | GTC IT / AI Assistant | Fixed legal publication model, removed duplicate/raw markdown publication paths and defined the approved agent-agreement template registry task |
