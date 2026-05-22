# CPG-SEAFARER-020 — Supply-Demand Matching Model and Field Gap Analysis

- Project: CrewPortGlobal.com
- Company: GTC INFORMATION TECHNOLOGY FZ-LLC
- Stage: Stage 1 — Digital Maritime Crew Data and Matching Platform
- Document type: Modelling and gap-analysis report
- Source task: #29 — CPG-SEAFARER-020
- Version: 1.0
- Date: 2026-05-22
- Status: Modelling report; no implementation changes

## 1. Purpose And Boundaries

This report defines the conceptual and technical model for matching seafarer supply with employer, vessel and crew-request demand.

The report is intentionally pre-implementation. It does not add UI fields, database migrations, backend/API behavior, matching algorithms, production scoring, publication behavior or employment-decision logic.

The model answers:

1. What data is required for maritime crew matching.
2. What data already exists in CrewPortGlobal.
3. What demand-side and supply-side gaps remain.
4. Which fields must become structured before matching can be reliable.
5. Which criteria are hard blockers and which are soft scoring signals.
6. Which data is visible to seafarers, operators and employers.
7. Which next implementation issues should be created before any matching algorithm is introduced.

## 2. Sources Inspected

Approved source documents:

1. `docs/crewportglobal/154_cpg_seafarer_019_forms_fields_database_inventory_report.md`
2. `docs/crewportglobal/153_cpg_seafarer_018_endpoint_guard_consent_addendum.md`
3. `docs/crewportglobal/149_cpg_seafarer_017_data_minimization_visibility_report.md`
4. `docs/crewportglobal/seafarer_application_mapping/source_card_visibility_matrix.md`
5. `docs/crewportglobal/seafarer_application_mapping/source_card_field_coverage_matrix.md`
6. `docs/crewportglobal/business_processes/11_seafarer_field_dictionary_and_reference_catalog_alignment.md`
7. `docs/crewportglobal/156_cpg_seafarer_020_agent_execution_guide.md`

Read-only code and schema inspection:

1. `projects/crewportglobal/public/create-profile/index.html`
2. `projects/crewportglobal/public/post-vacancy/index.html`
3. `projects/crewportglobal/public/verify/index.html`
4. `projects/crewportglobal/public/cabinet/index.html`
5. `projects/crewportglobal/app/backend/api/public/index.php`
6. `projects/crewportglobal/app/backend/db/migrations/*.sql`

No database writes, migrations, UI edits or backend edits were performed for this report.

## 3. Matching Object Model

The matching model must compare two controlled objects:

```text
seafarer supply profile
    against
employer + vessel + crew-request demand profile
```

The current supply side is materially stronger than the demand side. Seafarer records already include Excel-aligned source cards, repeated rows, document readiness, consent events, visibility boundaries and approval-guard support. Employer demand currently captures useful basics but leaves many matching requirements inside free-text `requirements`.

### 3.1 Supply Side Object

Supply side must be assembled from these sub-objects:

| Supply sub-object | Current source | Matching use | Boundary |
|---|---|---|---|
| Professional profile | `seafarer_profiles`, PERS-002, `/create-profile/` | Rank, department, availability, salary expectation, vessel preferences | Employer-safe summary only after consent and approval guard |
| Document readiness | `document_metadata`, `uploaded_documents`, document summary helper | Passport, seaman book, medical, visa, certificate/STCW readiness | Expiry/status only for employer; no document numbers or storage paths |
| Verified qualifications | `seafarer_certificates`, `seafarer_training_records`, QUAL-003/004/005 | COC, endorsements, STCW/training requirements | Operator-reviewed records before matching eligibility |
| Sea-service experience | `seafarer_sea_service_records`, EXP-001 | Vessel type/rank/dept experience, engine/deadweight context | Employer summary must be reviewed and minimized |
| Availability and preferences | `seafarer_matching_preferences`, profile columns | Joining readiness, accepted contract duration, compensation expectation, route preferences | Current preference fields are partly text and need structuring |
| Restricted medical / family / internal data | MED-001, PERS-007/008, internal notes | Must not be used for employer matching except medical readiness status | Restricted from employer payload and general operator detail |

### 3.2 Demand Side Object

Demand side must be separated into three source-controlled objects plus contract/risk requirements:

| Demand sub-object | Current source | Current state | Matching gap |
|---|---|---|---|
| Employer / company profile | `employer_companies`, `company_users`, `/post-vacancy/` | Company name, type, country, registration number, role, verification status | Company capability, client type, billing/approval status and risk status are not yet structured for matching priority |
| Vessel profile | `vessels`, `/post-vacancy/` | Vessel name, IMO, vessel type, flag | GT, DWT, engine type, engine power, year built, trading area and verification status are missing or not structured |
| Crew request / vacancy requirement | `vacancy_requests`, `/post-vacancy/` | Vacancy title/rank, department, vessel type, join date, salary band, contract duration text, requirements text, publication status | Required COC, endorsements, STCW, visa, language, experience and rotation requirements are not structured |
| Contract terms | `vacancy_requests` | Salary min/max, currency, contract duration text | Duration, rotation, paid travel, leave, joining port and sign-on window need structured fields |
| Operational/legal/risk requirements | Mostly free-text `requirements` today | Human-readable requirements only | Must become filterable hard blockers and soft scoring criteria before automated matching |

## 4. Matching Principles

1. Automated matching must use reviewed, structured and employer-safe data only.
2. Free text must not drive hard blockers or scores unless an operator has converted it into structured fields.
3. Employer matching must not use restricted medical details, family/children/next-of-kin data, religion, internal notes, raw document paths, passport/visa/seafarer ID numbers or private previous-employer contact details.
4. A match candidate must pass the CPG-SEAFARER-018 approval guard before employer-facing presentation.
5. Publication preference or broad consent text alone is not enough. Active consent events and unresolved-correction checks remain mandatory.
6. Matching should produce a recommendation or ranked shortlist for human review, not an employment decision.

## 5. Supply-Demand Matching Matrix

| Matching dimension | Seafarer field/source | Employer/vacancy/vessel field/source | Existing coverage | Gap | Matching rule | Field type recommendation | Priority |
|---|---|---|---|---|---|---|---|
| Rank / position | `seafarer_profiles.primary_rank`; PERS-002; reference rank catalog | `vacancy_requests.rank`, `vacancy_title`; `/post-vacancy/` rank input | Both sides present, but demand rank may be free text/title-like | Demand needs canonical rank value ID/code, not only text | Exact or approved-equivalent rank match is an MVP hard blocker | Structured enum, single select, catalog-backed | P0 |
| Crew department | `seafarer_profiles.department`; PERS-002 | `vacancy_requests.department` | Present on both sides as constrained values | Department vocab differs slightly: demand has `hotel`, seafarer has `catering/other` | Department must match or be explicitly accepted by operator | Structured enum, single select | P0 |
| Availability and joining date | `availability_status`, `availability_date`; matching preferences | `vacancy_requests.join_date` | Present on both sides | Need matching tolerance/sign-on window | Candidate availability date must be on/before requested join date or within operator-approved tolerance | Date plus calculated availability blocker | P0 |
| Contract duration and rotation | `seafarer_matching_preferences.accepted_contract_duration`; free-text profile fields | `vacancy_requests.contract_duration` text | Present as text | Not machine-comparable | Hard blocker only after duration/rotation are structured; until then operator review | Number + unit + rotation enum; avoid free text for core duration | P1 |
| Salary expectation vs salary offer | `salary_expectation_usd`, `expected_compensation_usd` | `salary_min_usd`, `salary_max_usd`, currency | Present as numbers on both sides | Need currency normalization and allowance rules | If expectation exceeds max offer, soft mismatch or blocker depending employer policy | Number/currency, calculated fit | P1 |
| Vessel type | `preferred_vessel_types`; sea-service vessel type records | `vessels.vessel_type`, `vacancy_requests.vessel_type` | Present but partly text/datalist | Demand and supply need shared catalog value IDs | Required vessel type is hard filter; preference and experience depth are soft scores | Structured enum; supply preference multi-select; demand single/multi depending request | P0 |
| IMO / vessel identity | Sea-service has vessel names; current candidate does not need current vessel IMO for match | `vessels.imo_number` | Demand has IMO with format check | Vessel verification status is not explicit | IMO verifies vessel identity; missing IMO should block high-trust matching if vessel is known | Text with validation plus verification status | P1 |
| Flag | Sea-service records may hold prior flag; profile has nationality/residence | `vessels.flag_country_code` | Demand flag exists; supply prior flag partially exists in sea service | Flag requirements are not structured in vacancy | Flag can be soft score or legal hard blocker if required by employer/flag state | Structured country enum | P2 |
| GT / DWT | Sea-service `deadweight` text; no GT | Demand vessel profile lacks GT/DWT | Weak supply, missing demand | Need numeric vessel particulars on both actual vessel and experience rows | Use for vessel-size experience score; hard blocker only when employer requires minimum | Number; calculated experience bands | P1 |
| Engine type / power | Sea-service `engine_type`, `engine_power`; no demand fields | Demand vessel profile lacks engine fields | Supply partly present; demand missing | Engine department matching cannot be automated reliably | Engine type/power exact or banded match for engine ranks | Structured enum + number | P1 |
| Year built | Not collected as candidate criterion | Demand vessel profile lacks year built | Missing | Usually contextual/risk, not primary match | Soft context unless employer/legal rule requires | Number/year | P3 |
| Trading area / route | `route_region_preferences`; free text | Demand lacks trading area/route | Weak supply, missing demand | Route/visa/language fit cannot be scored | Match preferred/accepted trading regions against vessel/vacancy trading area | Multi-select region enum | P1 |
| Required COC | `seafarer_certificates` group `certificate`; COC type/country/expiry | Free-text `requirements` only | Supply structured; demand missing | Core demand requirement must be structured | Candidate must hold required active COC or approved equivalent | Document-backed structured enum/multi-select | P0 |
| Required endorsements | `seafarer_certificates` group `endorsement` | Free-text `requirements` only | Supply structured; demand missing | Cannot filter endorsement requirements | Candidate must hold required active endorsement if demand requires it | Document-backed multi-select enum | P0 |
| Required STCW/training | `seafarer_training_records` | Free-text `requirements` only | Supply structured; demand missing | Cannot filter mandatory courses | Required course completion/expiry must pass | Document-backed multi-select enum | P0 |
| Medical certificate readiness | Document summary `medical_expiry`; restricted medical details excluded | Demand likely implicit in requirements | Supply readiness exists; demand missing explicit rule | Need minimum validity period and medical standard requirement | Employer may require valid medical through contract start/sign-on | Date/readiness calculated; no medical details | P0 |
| Visa readiness | Document summary `visa_status`; visa expiry metadata | Free-text `requirements`, route unknown | Supply readiness exists; demand missing structured visa category/route | Visa fit cannot be reliably automated | Required visa category/status must match only when demand specifies it | Structured visa enum + readiness boolean/date | P1 |
| Passport / seaman book readiness | Document summary expiry; QUAL-001 source | Demand likely implicit | Supply readiness exists | Need minimum validity duration rule | Must be valid for joining and contract period | Date + calculated validity blocker | P0 |
| Sea-service by vessel type/rank | `seafarer_sea_service_records` | Demand lacks required months/years by vessel/rank | Supply structured; demand missing | Experience threshold not filterable | Calculate months by rank/vessel type and compare to demand threshold | Calculated months + structured demand thresholds | P1 |
| Maritime English / language | Not clearly structured in current source-card matching fields | Demand missing | Missing both sides | Language fit cannot be scored | Add structured language/level before scoring | Enum language + level scale | P1 |
| Previous employer references | EXP-002 company/context, private contacts restricted | Demand may require reference verification | Supply exists but contact data restricted | Need reference verification status, not private details | Match uses verification status only, not contact names/phones/emails | Boolean/status calculated from operator workflow | P2 |
| Employer/company verification | N/A supply | `employer_companies.verification_status` | Present | Already hard blocker in approval guard | Demand must be from verified company before presentation/matching | Status enum, hard blocker | P0 |
| Vessel verification | N/A supply | `vessels` has identity fields but no explicit verification status | Missing | Vessel trust cannot be separated from company verification | Vessel should be verified or operator-approved for high-trust matching | Status enum + evidence-backed | P1 |
| Vacancy publication/approval | Application guard, source-card corrections | `vacancy_requests.publication_status` | Present | Existing guard handles publication; demand completeness guard should expand | Vacancy must be `published` or internally approved for matching queue | Status enum, hard blocker | P0 |
| Consent and approval guard | `seafarer_consent_events`, source-card review state | Operator presentation flow | Present | Matching eligibility level should reuse guard but not auto-present | Missing active consent/corrections/unsafe payload block employer-facing matching | Calculated blocker set | P0 |
| Restricted data exclusion | Visibility matrix and employer deny list | Employer payload allow list | Present | Future matching must keep same exclusion list | Restricted data must be unavailable to matching/scoring payloads | System-only deny-list control | P0 |

## 6. Hard Blocker / Soft Score Matrix

| Criterion | Type | Reason | Current support | Missing data | Suggested rule |
|---|---|---|---|---|---|
| Company verified | Hard blocker | Crew request must come from trusted employer/client | `employer_companies.verification_status`; approval guard | None for current MVP | Block employer-facing presentation when not verified |
| Vacancy published/approved | Hard blocker | Matching should not use unapproved demand | `vacancy_requests.publication_status`; approval guard | Demand completeness status can be expanded later | Block matching eligibility until vacancy is published or approved for internal matching |
| Active matching/employer-sharing consent | Hard blocker | Employer-facing candidate processing requires consent | `seafarer_consent_events`; guard blockers | UI for user-managed consent remains future | Block employer-facing candidate summary if missing or withdrawn |
| Unresolved required source-card correction | Hard blocker | Incomplete or corrected data cannot be trusted | Source-card review state; guard blocker | None for current guard | Block presentation and matching eligibility until resolved |
| Employer payload safety | Hard blocker | Forbidden fields must never leak | Employer deny-list/probe | Future matching payload must reuse probe | Block if payload contains forbidden keys |
| Rank match | Hard blocker for MVP | Wrong rank makes candidate unusable | Both sides collect rank | Demand canonical rank ID | Exact or approved-equivalent rank required |
| Department match | Hard blocker for MVP | Department mismatch is usually disqualifying | Both sides collect department | Taxonomy alignment | Exact or operator-approved equivalent required |
| Required COC held and active | Hard blocker | Maritime legal qualification requirement | Supply structured | Demand requirement missing | Once demand structured, block if missing/expired |
| Required endorsement held and active | Hard blocker when required | Tanker/passenger/flag endorsements can be mandatory | Supply structured | Demand requirement missing | Block when demand marks endorsement required |
| Required STCW/training complete | Hard blocker when required | Mandatory safety/training requirement | Supply structured | Demand requirement missing | Block when required course missing/expired |
| Passport/seaman book validity | Hard blocker | Travel/boarding document readiness | Supply document summary | Demand validity duration missing | Block if invalid or expires before rule threshold |
| Medical certificate readiness | Hard blocker at readiness level only | Medical details restricted, but certificate validity matters | Supply expiry/status summary | Demand minimum validity missing | Use expiry/status only; never use medical declarations |
| Availability by joining date | Hard blocker or strong soft score | Candidate must be able to join | Both dates exist | Tolerance/sign-on window missing | Block when after hard latest join date; otherwise score proximity |
| Vessel type match | Hard blocker if required; soft score for preference | Employer may need vessel-type experience | Both sides have vessel type text/catalog-ish | Shared IDs and demand required/preferred flag | Required vessel type blocks; preference contributes score |
| Salary expectation fit | Soft score, possible employer-configured blocker | Salary mismatch may be negotiable | Both sides have numeric USD fields | Currency/benefit policy missing | Score range fit; block only if employer sets non-negotiable |
| Contract duration/rotation fit | Soft score until structured | Candidate preferences may be flexible | Both sides text | Structured duration/rotation missing | Score after structuring; hard only if employer marks required |
| Sea-service experience depth | Soft score, possible requirement | Experience improves ranking | Supply records structured | Demand threshold missing | Score months by rank/vessel type; hard only for minimum threshold |
| Engine type/power fit | Soft score or hard for engine ranks | Engine experience can matter materially | Supply partial | Demand missing | Score or block for engine roles after demand fields exist |
| Language/Maritime English | Soft score, possible hard when required | Communication and safety requirement | Missing | Both sides need structured language level | Score level; hard only where employer marks required |
| Reference verification status | Soft score | Trust signal, not general employer data | Supply references exist; contacts restricted | Verification status workflow missing | Score verified reference count/status only |
| Flag/trading area experience | Soft score | Operational familiarity | Supply partial; demand missing | Structured trading area required | Score similar route/flag experience |

## 7. Field-Type Recommendation Matrix

| Field | Side | Current form/state | Recommended type | Single/multiple | Required for MVP? | Notes |
|---|---|---|---|---|---|---|
| Primary rank | Supply | Text/datalist and profile column | Structured enum, catalog-backed | Single | Yes | Store canonical rank value ID/code in future slice |
| Requested rank | Demand | Text/datalist/title-like field | Structured enum, catalog-backed | Single | Yes | Separate `vacancy_title` from canonical required rank |
| Department | Both | Selects with partial taxonomy mismatch | Structured enum | Single | Yes | Align `hotel/catering/other` handling |
| Availability date | Supply | Date | Date | Single | Yes | Match against join date/sign-on window |
| Joining date | Demand | Date | Date plus latest acceptable join date | Single | Yes | Add latest/earliest tolerance later |
| Salary expectation | Supply | Number USD | Number + currency | Single | No for blocker; yes for scoring | Existing USD is usable but should not be sole blocker |
| Salary offer range | Demand | Number min/max USD | Number + currency + negotiable boolean | Single range | Yes for commercial matching | Currency exists; negotiability missing |
| Preferred vessel types | Supply | Text/datalist, JSON/list | Structured enum | Multiple | Yes | Existing labels should map to catalog IDs |
| Required vessel type | Demand | Text/datalist | Structured enum | Single or multiple | Yes | Need required/preferred flag |
| Contract duration | Both | Text | Number + unit + rotation pattern | Single/structured group | Yes | Convert from free text before automated matching |
| Route/trading area | Both | Supply text-ish; demand missing | Structured region enum | Multiple | No for MVP, P1 | Needed for visa/language/experience relevance |
| COC type | Supply | Structured certificate records | Document-backed enum | Multiple records | Yes | Already strong supply side |
| Required COC | Demand | Free-text requirements | Document-backed enum requirement | Multiple | Yes | P0 gap |
| Endorsements | Supply | Structured certificate group | Document-backed enum | Multiple | Yes where applicable | Supply available |
| Required endorsements | Demand | Free-text requirements | Document-backed multi-select enum | Multiple | Yes for tanker/passenger roles | P0 gap |
| STCW/training courses | Supply | Structured training records | Document-backed enum | Multiple | Yes | Supply available |
| Required STCW/training | Demand | Free-text requirements | Document-backed multi-select enum | Multiple | Yes | P0 gap |
| Passport validity | Supply | Date/readiness summary | Date + calculated status | Multiple docs | Yes | Employer sees expiry/status only |
| Seaman book validity | Supply | Date/readiness summary | Date + calculated status | Multiple docs | Yes | Employer sees readiness only |
| Visa category/status | Supply | Document/readiness fields | Structured enum + date/status | Multiple | P1 | Demand visa categories missing |
| Required visa | Demand | Free text | Structured enum + required/preferred flag | Multiple | P1 | Depends on trading area/joining route |
| Medical certificate status | Supply | Expiry/status summary; medical details restricted | Date + calculated status | Single/latest | Yes | No medical declaration use in matching |
| Medical details | Supply | Restricted sensitive payload | Restricted medical only | N/A | No | Excluded from matching and employer payload |
| Sea-service months by vessel/rank | Supply | Records present; calculation not implemented | Calculated | Multiple dimensions | P1 | Needs derived summary table/API later |
| Required sea-service threshold | Demand | Free text | Number months/years by vessel/rank | Multiple requirements | P1 | Needed before experience filtering |
| Vessel IMO | Demand | Validated text | Validated identifier + verification status | Single | P1 | Current regex expects seven digits |
| Vessel flag | Demand | Country code | Structured country enum | Single | P2 | Existing but not used in matching yet |
| Vessel GT/DWT | Demand | Missing | Number | Single each | P1 | Needed for vessel-size experience matching |
| Engine type/power | Demand | Missing | Enum + number | Single | P1 | Important for engine department |
| Year built | Demand | Missing | Number/year | Single | P3 | Contextual/risk signal |
| Language/Maritime English | Both | Missing | Enum language + level | Multiple | P1 | Needed for international matching |
| Previous reference verification | Supply | References exist, contacts restricted | Calculated status/boolean | Multiple records summarized | P2 | Match must not expose private contacts |
| Employer requirements note | Demand | Free text | Free text only for human explanation | Single text | Yes as supplement | Must not be the source for filterable criteria |

## 8. Visibility And Data Ownership Matrix

| Data group | Owner/source | Seafarer owner | Operator general | Employer candidate | Public vacancy board | Matching model use |
|---|---|---|---|---|---|---|
| Raw seafarer workspace | Seafarer/profile owner | Full owner edit/view | Scoped and redacted | Not visible | Not visible | Not directly; derive reviewed summary only |
| Professional seafarer summary | Seafarer profile | Visible | Visible | Visible after consent/guard | Not visible | Core matching input |
| Document readiness summary | Upload/document metadata | Visible | Visible as readiness | Visible as minimized `document_summary` after guard | Not visible | Core readiness input |
| Identity document numbers | Seafarer documents | Visible to owner | Masked/removed outside need-to-know | Not visible | Not visible | Excluded; use expiry/status only |
| Restricted medical declarations | Seafarer sensitive medical | Owner/restricted future workflow | Denied to general operator | Not visible | Not visible | Excluded; use certificate readiness only |
| Family/children/next-of-kin | Seafarer restricted family data | Visible to owner | Summary/restricted wording | Not visible | Not visible | Excluded |
| Religion/internal compliance | Seafarer/internal | Owner/internal only | Hidden from general views | Not visible | Not visible | Excluded |
| Previous employer private contacts | Seafarer references | Visible to owner | Masked except authorized workflow | Not visible | Not visible | Excluded; use verification status only |
| Company profile | Employer/company owner | N/A | Visible for review | Employer-owned | Not public unless later approved | Demand trust/ownership input |
| Vessel profile | Employer/company owner | N/A | Visible for review | Employer-owned | Public only if vacancy published | Demand vessel input |
| Vacancy request | Employer/company owner | N/A | Visible for review | Employer-owned | Public published fields only | Demand requirement input |
| Approval guard state | System/operator | Not ordinary owner field | Visible to operator | Not directly visible except result | Not visible | Eligibility gate |
| Matching score/reason | Future system output | Future cabinet summary only if approved | Operator-visible | Employer-visible only after presentation | Not public | Future recommendation, not decision |

## 9. Matching Readiness Levels

### 9.1 Supply Readiness

| Level | Name | Meaning | Required state |
|---|---|---|---|
| S0 | Collected only | Seafarer entered data exists but may be incomplete or unreviewed | Draft/profile saved |
| S1 | Structurally complete | Required source cards and repeated rows are present enough for review | No critical professional/document gaps |
| S2 | Operator reviewed | Source cards needed for matching have review status accepted or warning-only | No unresolved required corrections |
| S3 | Consent and approval-guard eligible | Required consent events are active and employer payload probe is safe | CPG-SEAFARER-018 guard can pass for candidate presentation |
| S4 | Employer-safe summary ready | Candidate summary contains only allowed employer fields | Restricted data removed/masked |
| S5 | Matching/scoring eligible | Supply summary has structured professional, readiness and experience fields | Ready for future non-decision ranking |

### 9.2 Demand Readiness

| Level | Name | Meaning | Required state |
|---|---|---|---|
| D0 | Collected only | Employer/vessel/vacancy draft exists | `/post-vacancy/` saved |
| D1 | Structurally complete | Rank, department, join date, vessel type, salary/contract basics are structured | Existing basics plus future structured requirement fields |
| D2 | Employer and vessel reviewed | Company is verified and vessel identity is verified or operator-approved | Company verification plus future vessel verification |
| D3 | Vacancy approved/published | Vacancy is approved for public/internal matching | `publication_status = published` or future internal matching approval |
| D4 | Requirement profile ready | Required COC, endorsements, STCW, visa, experience and language rules are structured | Demand-side P0/P1 gaps resolved |
| D5 | Matching/scoring eligible | Demand can be compared with supply without parsing free text | Ready for future matching engine |

### 9.3 Combined Eligibility

Automated matching must not run for employer-facing output unless:

```text
supply readiness >= S4
demand readiness >= D3
restricted data exclusion is active
approval guard has no hard blockers
```

Production scoring should wait until:

```text
supply readiness = S5
demand readiness = D5
```

## 10. Gap-To-Next-Task Matrix

| Gap | Why it matters | Required data side | Recommended next issue | Priority |
|---|---|---|---|---|
| Canonical demand rank field | Rank text/title cannot reliably match catalog-backed supply | Demand | CPG-SEAFARER-021 — Demand rank/department/vessel-type structured fields plan | P0 |
| Demand required COC/endorsement/STCW fields | Core legal qualification requirements are trapped in free text | Demand | CPG-SEAFARER-021 or separate CPG-DEMAND-001 qualification requirement schema | P0 |
| Demand document validity rules | Passport/seaman book/medical/visa minimum validity cannot be calculated | Demand | CPG-DEMAND-002 document-readiness requirement model | P0 |
| Contract duration and rotation structure | Current text prevents comparison with seafarer preferences | Both, mostly demand | CPG-DEMAND-003 contract terms structured model | P1 |
| Vessel particulars: GT, DWT, engine type/power, year built, trading area | Vessel-size and engine-role matching cannot be automated | Demand | CPG-DEMAND-004 vessel particulars expansion plan | P1 |
| Sea-service derived summaries | Existing records are detailed but no derived experience-by-dimension summary exists | Supply | CPG-SEAFARER-021 supply experience summary/readiness model | P1 |
| Language / Maritime English | International crew matching often depends on communication requirements | Both | CPG-DEMAND-005 language requirement and seafarer language profile | P1 |
| Visa category and trading-area requirements | Visa readiness is too generic for route-specific matching | Both | CPG-DEMAND-006 visa/trading-area structured model | P1 |
| Vessel verification status | Vessel identity is stored but not independently reviewed as a structured status | Demand | CPG-DEMAND-007 vessel verification workflow model | P1 |
| Reference verification summary | Private contacts exist but matching needs only verified-status summary | Supply/operator | CPG-SEAFARER-022 reference verification status model | P2 |
| Matching payload contract | Future scoring needs a safe allow-listed payload separate from employer presentation payload | System/API design | CPG-SEAFARER-023 matching payload contract, no algorithm | P0 |
| Score explanation taxonomy | Operators need understandable reasons before production scoring | System/operator | CPG-SEAFARER-024 match explanation taxonomy | P2 |

## 11. Recommended Next Implementation Sequence

1. **Demand field normalization plan.** Define canonical demand fields for rank, department, vessel type, required COC, endorsements, STCW/training, document validity, join date tolerance and salary/contract structure. This should still be documentation/schema planning before UI or DB changes.
2. **Demand-side additive schema proposal.** Prepare an idempotent future migration plan for structured requirement tables or JSONB-backed compatibility fields. Do not apply until owner approval.
3. **Vessel particulars and verification model.** Define GT, DWT, engine type, engine power, year built, trading area and vessel verification status.
4. **Supply summary derivation model.** Define calculated sea-service totals by rank/vessel type/department and document readiness windows without exposing restricted data.
5. **Employer-safe matching payload contract.** Create an allow-listed payload distinct from raw seafarer workspace and from employer presentation payload.
6. **Operator review UI plan.** Plan how operators will see matching readiness and gaps before any automatic ranking exists.
7. **Prototype scoring rules in tests/docs only.** Only after structured supply and demand fields exist, draft non-production scoring examples and expected explanations.
8. **Production matching implementation.** Future issue only; must remain human-reviewed and must not make employment decisions.

## 12. Acceptance Checklist

| Requirement | Status |
|---|---|
| Supply side separated from demand side | Met |
| Existing fields identified | Met |
| Missing fields identified | Met |
| Supply-demand matching matrix included | Met |
| Hard blocker / soft score matrix included | Met |
| Field-type recommendation matrix included | Met |
| Gap-to-next-task matrix included | Met |
| Visibility/data ownership matrix included | Met |
| Matching readiness levels included | Met |
| Recommended next sequence included | Met |
| No UI changes | Met |
| No DB migrations | Met |
| No backend/API behavior changes | Met |
| No matching algorithm or scoring implementation | Met |
| No publication or employment-decision logic | Met |

