# TRAVELGTC-PREP-001 - Implementation Readiness Checklist Specification

- Project: TravelGTC
- Source task: `docs/travelgtc/023_travelgtc_prep_001_implementation_readiness_checklist_task.md`
- Source architecture: `docs/travelgtc/018_travelgtc_arch_001_funnel_crm_agent_platform_spec.md`
- Source MVP requirements: `docs/travelgtc/020_travelgtc_biz_001_funnel_crm_mvp_requirements_spec.md`
- Source roadmap: `docs/travelgtc/022_travelgtc_roadmap_001_site_crm_business_process_mapping_spec.md`
- Document type: Implementation readiness specification
- Version: 0.1
- Date: 2026-07-09
- Status: Active readiness gate before API implementation

## 1. Executive Decision

TravelGTC is ready to move from concept and mapping into staged implementation after this readiness checklist is accepted.

The next build stage remains:

```text
TRAVELGTC-API-001 - Lead Capture API And Database Schema
```

The project should not add more public pages before the lead capture, CRM and follow-up process exists. Each new public block must map to a CRM object, stage, task or measurable event.

## 2. Product Operating Model

TravelGTC must operate as a subnetwork activation and CRM layer:

```text
content / recommendation
-> user travel or community need
-> role selection
-> structured lead
-> CRM review
-> consultation
-> official parent-network path where applicable
-> participation
-> trusted recommendation
```

The system must grow the network through useful engagement:

1. help the user understand their travel need;
2. help the user choose a role;
3. help the operator offer the right next step;
4. help participants create real travel/community activity;
5. help recommendations happen from trust, not pressure.

## 3. International Practice Baseline

This readiness document uses public international guardrails as a product-safety baseline.

| Area | Practical Rule For TravelGTC | Reference |
|---|---|---|
| Direct selling / MLM risk | Do not design flows that focus on recruitment before product/service value and real user need. | FTC business guidance concerning multi-level marketing: https://www.ftc.gov/business-guidance/resources/business-guidance-concerning-multi-level-marketing |
| Ethical direct selling | Use truthfulness, consumer protection, fair conduct and complaint-readiness as platform requirements. | WFDSA Code of Ethics: https://wfdsa.org/wp-content/uploads/2025/10/WFDSA-Code-of-Ethics-FINAL-091625.pdf |
| Income and lifestyle claims | Do not make income, passive income, financial freedom or lifestyle claims unless official materials, required disclosures and human compliance review are present. | MWR Life Policies and Procedures: https://www.mwrlife.com/content/policiesandprocedures.pdf |
| Income disclosure | When compensation is discussed, require the current official IDS and clear statement that earnings are not guaranteed. | MWR Life Income Disclosure: https://www.mwrlife.com/content/IncomeDisclosure.pdf |
| Social content and endorsements | If a material relationship exists, public content must clearly disclose it where required and not hide the relationship. | FTC endorsement guidance: https://www.ftc.gov/business-guidance/resources/ftcs-endorsement-guides-what-people-are-asking |
| Personal data | Collect only the minimum data needed for the stated purpose; record consent and keep transfer/storage rules explicit. | European Commission data protection overview: https://commission.europa.eu/law/law-topic/data-protection_en |

This baseline is operational guidance only. Jurisdiction-specific legal review is required before production lead collection, paid promotion, automated messaging, official enrollment or compensation discussion at scale.

## 4. Implementation Stack Readiness

Current server environment check on 2026-07-09:

| Runtime | Observed Version | Readiness Meaning |
|---|---|---|
| Node.js | `v22.16.0` | Suitable for first API/CRM service. |
| npm | `10.9.2` | Suitable for package and script management. |
| PostgreSQL client | `14.22` | Suitable for database access and migration checks. |
| Python | `3.10.12` | Already used for static local server/tests where useful. |
| PHP CLI | `8.1.2` | Available but not selected as the first backend path. |

Recommended MVP stack:

| Layer | Decision | Reason |
|---|---|---|
| Backend runtime | Node.js with TypeScript | Matches existing npm/Playwright tooling and supports API + agent orchestration. |
| HTTP framework | Fastify or similar lightweight Node framework | Good validation hooks, testability and performance without heavy framework lock-in. |
| Database | PostgreSQL | Already selected in requirements and available on server. |
| Database access | SQL migrations + small repository layer | Keeps schema explicit and avoids premature ORM complexity. |
| Validation | Schema validation at API boundary | Required for consent, enums, spam/rate limiting and stable CRM data. |
| CRM MVP UI | Internal web workspace served by the app | Faster than building a separate frontend app before the workflow is proven. |
| AI integration | Agent service boundary with logged `AgentRun` records | Keeps AI decisions auditable and reviewable. |

## 5. Proposed Source Layout

The first implementation should keep public static pages intact and add the backend beside them.

```text
projects/travelgtc/
  app/
    src/
      server/
      modules/
        public-leads/
        crm/
        agents/
        audit/
      shared/
    migrations/
    tests/
    .env.example
  public/
  scripts/
  deploy/
```

Minimum first files for `TRAVELGTC-API-001`:

1. `projects/travelgtc/app/package.json`
2. `projects/travelgtc/app/.env.example`
3. `projects/travelgtc/app/src/server/index.ts`
4. `projects/travelgtc/app/src/modules/public-leads/`
5. `projects/travelgtc/app/migrations/001_travelgtc_lead_capture.sql`
6. `projects/travelgtc/app/tests/public-leads.test.ts`

## 6. Environment And Secrets Readiness

The first `.env.example` must include placeholders only.

Required variables:

| Variable | Purpose | Production Default |
|---|---|---|
| `TRAVELGTC_APP_ENV` | `local`, `staging`, `production`. | `production` |
| `TRAVELGTC_PUBLIC_LEAD_CAPTURE_ENABLED` | Safety switch for real lead capture. | `false` until privacy/consent approved |
| `TRAVELGTC_DATABASE_URL` | PostgreSQL connection string. | Secret |
| `TRAVELGTC_CRM_AUTH_MODE` | Internal CRM auth mode. | `disabled` until implemented, then secure mode |
| `TRAVELGTC_AGENT_INTAKE_MODE` | `stub`, `manual`, `live`. | `stub` for first API stage |
| `TRAVELGTC_PARENT_NETWORK_MODE` | `none`, `manual`, `linked`, `api`. | `manual` after approval |
| `TRAVELGTC_CONSENT_VERSION` | Version of consent text stored with leads. | Explicit version string |
| `TRAVELGTC_RATE_LIMIT_WINDOW_SECONDS` | Public API rate-limit window. | Configured |
| `TRAVELGTC_RATE_LIMIT_MAX` | Public API max submissions per window. | Configured |

Credential rules:

1. never commit credentials, tokens, exported cookies or screenshots containing secrets;
2. do not ask the Project Owner to paste passwords into documentation;
3. if parent-network login is required, use a live browser session with Project Owner confirmation;
4. use credentials only for the approved task;
5. record only public URLs, document names, versions and decisions;
6. store integration secrets only in server environment or approved secret storage.

## 7. Parent-Network / Subnetwork Readiness

TravelGTC must clearly operate as a subnetwork-support system, not as an official replacement for the parent network.

### 7.1 Product Boundary

| TravelGTC May Do | TravelGTC Must Not Do |
|---|---|
| Explain travel/community needs in its own words. | Present itself as official corporate MWR Life property unless authorized. |
| Capture interest and prepare consultation. | Process official enrollment outside authorized parent-network channels. |
| Track local subnetwork leads, tasks and follow-up. | Change or reinterpret compensation plan, prices or official terms. |
| Generate draft content for human review. | Publish unapproved MWR Life-branded promotional materials if approval is required. |
| Route interested users to official materials or authorized replicated links. | Collect payments, membership fees or ambassador fees unless explicitly authorized. |
| Track referral source and sponsor/subnetwork attribution. | Encourage sponsor changes or actions contrary to parent-network rules. |

### 7.2 Required Parent-Network Inputs

These inputs are not required to start local API scaffolding, but they are required before production integration and business-model messaging:

| Input | Needed Before | Why |
|---|---|---|
| Current official Policies and Procedures | Public business-model copy and agent guardrails | Prevents off-policy claims and materials. |
| Current Income Disclosure Statement | Any compensation or earnings discussion | Required for safe income-related explanation. |
| Current Compensation Plan | Consultation scripts involving opportunity | Avoids inaccurate business explanations. |
| Approved brand and marketing guidelines | Public pages, social content, visual assets | Prevents unauthorized use of marks/materials. |
| Approved replicated site / referral URL | CTA routing to official enrollment or presentation | Preserves attribution and official process. |
| Allowed countries/languages | Public targeting and content campaigns | Avoids offering where not permitted. |
| Official presentation deck/video links | Consultation and follow-up | Keeps explanation aligned with current materials. |
| API/webhook/integration availability | Future automated sync | Determines whether integration is manual, linked or API-based. |
| Data-processing terms | CRM data handling and transfer | Defines whether/how lead data may be shared with parent network. |

### 7.3 Integration Modes

| Mode | Description | When Allowed |
|---|---|---|
| `none` | TravelGTC stores only internal test/demo data. | Local development and early tests. |
| `manual` | Operator reviews lead and manually uses official parent-network tools. | First production-safe mode after privacy/consent approval. |
| `linked` | Public CTAs route to official replicated pages with attribution. | After approved URL and rules are confirmed. |
| `api` | CRM syncs with parent-network systems through official API/webhooks. | Only after official API terms and credentials are available. |

## 8. CRM Transition Readiness

Before `TRAVELGTC-CRM-001`, transitions must be enforced as product logic.

| From Stage | Allowed Next Stages | Required Human Action |
|---|---|---|
| `new_lead` | `role_detected`, `needs_human_review`, `closed_not_relevant` | Review spam/contact/consent. |
| `role_detected` | `needs_human_review`, `consultation_requested`, `nurture_later` | Confirm whether the role fits the request. |
| `needs_human_review` | `consultation_requested`, `nurture_later`, `closed_not_relevant` | Decide whether and how to contact. |
| `consultation_requested` | `consultation_scheduled`, `nurture_later`, `closed_not_relevant` | Contact user and agree next step. |
| `consultation_scheduled` | `consultation_completed`, `nurture_later` | Record consultation result. |
| `consultation_completed` | `next_step_proposed`, `nurture_later`, `closed_not_relevant` | Choose club/trip/event/business/presentation path. |
| `next_step_proposed` | `member_active`, `participant_active`, `referral_active`, `nurture_later`, `closed_not_relevant` | Record accepted or declined next step. |

Blocked automatic actions:

1. automatic stage transition into `member_active`;
2. automatic membership or ambassador invitation;
3. automatic compensation explanation;
4. automatic outbound message sending;
5. automatic public content publication.

## 9. API Contract Readiness

The first API contract must be frozen before implementation.

Endpoint:

```text
POST /api/travelgtc/v1/public/leads
```

Minimum request groups:

1. contact: name, preferred channel, contact value;
2. role: declared role, primary interest;
3. travel idea: format, destination, audience, estimated group size, message;
4. business interest: level and consultation preference;
5. consent: personal data consent, communication consent, consent version;
6. source: path, referrer, UTM, referral code, client event id.

Minimum response:

```json
{
  "ok": true,
  "lead_id": "uuid",
  "stage": "new_lead",
  "message": "Спасибо. Ваша заявка получена."
}
```

Minimum error model:

```json
{
  "ok": false,
  "error": {
    "code": "validation_error",
    "message": "Проверьте обязательные поля.",
    "fields": {
      "contact_value": "required"
    }
  }
}
```

Required backend behaviors:

1. validate enums and required fields;
2. enforce consent booleans;
3. store consent version;
4. rate-limit public submissions;
5. reject obvious spam;
6. make duplicate submissions idempotent through `client_event_id`;
7. create audit log entry;
8. create initial human review task;
9. create or queue an Intake Agent run in `stub` mode;
10. keep production submission disabled while `TRAVELGTC_PUBLIC_LEAD_CAPTURE_ENABLED=false`.

## 10. AI Agent Protocol Readiness

The first AI stage should be Intake Agent only.

### 10.1 Intake Agent Input

```json
{
  "lead_id": "uuid",
  "source_path": "/create-trip/",
  "declared_role": "trip_author",
  "primary_interest": "create_trip",
  "message": "User-submitted text",
  "travel_idea": {
    "format": "retreat",
    "destination": "Bali",
    "audience_type": "clients",
    "estimated_group_size": "11_50"
  },
  "business_interest_level": "curious_later",
  "consent_version": "travelgtc-consent-v1"
}
```

### 10.2 Intake Agent Output

```json
{
  "summary": "Short operator-facing summary.",
  "inferred_role": "trip_author",
  "motivation": "create a meaningful group trip",
  "recommended_stage": "needs_human_review",
  "recommended_next_step": "Clarify destination, audience and expected date.",
  "questions_for_operator": [
    "What result should participants receive from the trip?",
    "Is the user interested in club participation now or later?"
  ],
  "risk_flags": {
    "income_claim": false,
    "medical_claim": false,
    "pressure_language": false,
    "brand_compliance": "none"
  },
  "human_review_required": true
}
```

Agent restrictions:

1. may classify and summarize;
2. may recommend a stage;
3. may suggest questions;
4. must not promise outcome, income, savings or status;
5. must not write as an official parent-network representative unless approved;
6. must mark all user-facing drafts as requiring human approval.

## 11. Compliance And Public Content Readiness

Before public lead capture is enabled, TravelGTC must add:

1. privacy policy;
2. personal data processing/consent text;
3. communication consent text;
4. cookie/analytics decision if analytics are added;
5. business-model disclaimer;
6. personal informational page disclaimer;
7. parent-network affiliation/disclosure statement;
8. content approval checklist for business-model and social posts.

Minimum public disclosure direction:

```text
TravelGTC is a personal informational and CRM-supported project connected with travel, community and partner opportunities. Official terms, enrollment, pricing, platform access and compensation rules must be confirmed through official project materials and authorized channels.
```

## 12. Network Engagement Model

TravelGTC should develop the subnetwork through a repeatable engagement loop.

| Loop Stage | User Need | System Action | CRM Signal | AI Support |
|---|---|---|---|---|
| Attract | I want travel ideas. | Publish useful travel/community content. | Source/campaign. | Content Agent drafts. |
| Identify | I see myself in one role. | Role selector and route-specific CTA. | Declared role. | Intake Agent classifies. |
| Capture | I want to ask or create something. | Structured form. | Lead and travel idea. | Intake Agent summarizes. |
| Consult | I need a calm explanation. | Human consultation. | Consultation and tasks. | Consultation Agent prepares. |
| Activate | I want to join or create an activity. | Club/trip/event next step. | Participation path. | Community Agent suggests plan. |
| Recommend | I know someone who may benefit. | Referral and content tools. | Referral source. | CRM Orchestration Agent tracks. |
| Retain | I need ongoing value. | Follow-up, events, content, role progression. | Active participant/member status. | Follow-Up and Content Agents. |

Key rule:

```text
The network grows because each participant receives or creates useful travel/community value first.
```

## 13. Testing And Release Readiness

Current verified command:

```bash
npm run test:travelgtc
```

Future commands to add:

```bash
npm run check:travelgtc-api
npm run test:travelgtc-api
npm run smoke:travelgtc-api
npm run check:travelgtc-release
```

Stage gates:

| Stage | Required Verification |
|---|---|
| Docs-only | `git diff --check`, reference search. |
| API schema | SQL review, migration dry run or local test DB, API tests. |
| Public form | Responsive Playwright tests, API contract mock or live local API. |
| CRM UI | Auth check, lead board smoke, lead detail smoke, stage transition tests. |
| AI agent | Deterministic fixtures, schema validation, risk flag tests, human-review state. |
| Live deploy | Deploy script, health endpoint, home page smoke, API health smoke, rollback note. |

## 14. Blocking Decisions Before Production

| Decision | Required Before | Owner |
|---|---|---|
| Privacy/consent text approved | Real lead capture | Project Owner / legal review |
| Parent-network disclosure wording approved | Public business-model page and social content | Project Owner |
| Official referral/replicated URL confirmed | Linked CTAs to parent network | Project Owner |
| Official current IDS and policies saved as reference | Compensation discussion | Project Owner |
| CRM access/auth model selected | Internal CRM publication | Project Owner / implementation |
| Data retention rule selected | Production database | Project Owner |
| Countries/languages allowed | Paid content campaigns or outreach | Project Owner |
| AI provider and data-use mode selected | Live AI processing of personal data | Project Owner / implementation |

## 15. Immediate Implementation Sequence

Proceed in this order:

1. `TRAVELGTC-API-001 - Lead Capture API And Database Schema`
2. `TRAVELGTC-WEB-007 - Public Funnel Role Selector And Form`
3. `TRAVELGTC-CRM-001 - Lead Board And Lead Detail MVP`
4. `TRAVELGTC-AI-001 - Intake Agent Summary And Routing`
5. `TRAVELGTC-LEGAL-001 - Privacy, Consent And Public Disclosure Pages`
6. `TRAVELGTC-CONTENT-001 - Content Studio And Compliance Drafting`
7. `TRAVELGTC-NETWORK-001 - Parent-Network Referral And Participation Tracking`

Important dependency:

```text
API and CRM can be built with test/demo data first.
Production personal-data collection must wait for privacy, consent and disclosure readiness.
```

## 16. Questions To Resolve Later

These questions do not block `TRAVELGTC-API-001`, but they must be resolved before production growth:

1. Which exact parent-network identity/status should TravelGTC disclose publicly?
2. Which official replicated/referral URL should be used for interested users?
3. Which countries and languages are permitted for active outreach?
4. Which official materials are approved for use in public content?
5. Does the parent network provide API/webhook access, or is integration manual only?
6. What is the retention period for leads that do not proceed?
7. What CRM users/roles are needed first: owner only, assistant, consultant, content operator?

## 17. Readiness Conclusion

TravelGTC has enough product and process definition to start implementation.

The safe implementation posture is:

```text
build API + database + CRM with test/demo mode first;
keep live personal-data collection disabled;
connect pages to the API only after consent/disclosure text is approved;
integrate with the parent network only through approved official links, materials and procedures.
```

## 18. Revision History

| Version | Date | Author | Changes |
|---|---|---|---|
| 0.1 | 2026-07-09 | GTC IT / AI Assistant | Initial implementation readiness checklist |
