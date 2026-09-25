# TRAVELGTC-INTEGRATION-001 — Discovery And Integration Contract

- Date: 2026-09-17
- Status: CONTRACT_FOR_OWNER_REVIEW; discovery limited to approved domains and available evidence
- Activation: NOT_AUTHORIZED / NOT_IMPLEMENTED
- Classification: internal, application-coupled proposal, non-canonical until Owner review
- Task: `153_travelgtc_integration_001_authorized_access_task.md`
- Baseline: `/var/www/gtc-form`, main, `16c48b9977604dbb595b557daabbc9cab0e0a5b4`, existing dirty worktree

## 1. Result And Evidence Boundary

Owner manually authenticated both official sites. BrowserAct independently verified Travel Advantage Home with a logout control, and MWR Life Dashboard with Logout and My Links. My Links and Marketing were read. No forms, purchases, bookings, registrations, account changes, exports or messages to support were performed by the agent. No cookies, passwords, MFA values, browser storage, network dumps or user databases were read or transferred. Account balances and personal guest codes are excluded from this report.

The present result is a concrete integration proposal, not a working integration or full completion of every discovery dependency. MWR Academy requires a new authentication-domain decision; provider API/export permissions and registration schema remain unconfirmed. These limits are recorded rather than filled with guessed endpoints or fields. The full task remains open.

## 2. Preflight And Access

| Item | Verified result |
| --- | --- |
| Codex/browser host | Local Windows x64, PowerShell 7.6.5 |
| CLI | `C:\Users\kfilipenko\.local\bin\browser-act.exe`, version 1.4.2 |
| Chrome | Local Chrome previously verified at `C:\Program Files\Google\Chrome\Application\chrome.exe`, version 152.0.7977.76; not reinstalled |
| Skill | Installed BrowserAct SKILL.md read; CLI core skill 2.0.2 and advanced instructions loaded |
| Isolated profile | `travelgtc-test`, chrome, ID `chrome_local_118747720352530484`; created empty without importing main profile |
| Project host | Existing SSH alias gtc1 verified as GTC1/Linux; initial cwd `/home/kfilipenko`; project path accessible |
| Server CLI | `command -v browser-act` returned no path; installation outside PATH is UNKNOWN |
| Travel Advantage | `https://www.traveladvantage.com/home`; title `Travel Advantage™ Elite | Home`; logout present |
| MWR Life | `https://www.mwrlife.com/bizcenter/dashboard`; title Dashboard; password form absent, Logout/My Links present |
| Login handoff | Owner used the visible local test-profile window. BrowserAct remote-assist failed with API-key-required; no new credentials created |
| Loading limitation | MWR navigation repeatedly timed out before DOMContentLoaded; subsequent targeted DOM reads independently verified Dashboard/My Links/Marketing |
| Actual privileges | Owner UI includes account management, membership and other write-capable areas. Read-only is an operational restriction, not an enforced provider role |
| Session lifetime/revocation | Exact TTL and global revocation mechanism UNKNOWN; no cookie inspection. Logout controls observed but not exercised. Closing BrowserAct is not proof of provider session revocation |

No tunnels, bridges, debug-port configuration, proxies, sandbox changes, new installations, permission expansion or Agent-01/Azure/OpenClaw operations occurred during this discovery. Existing SSH supplied project access; it did not supply Windows browser control.

## 3. Source Map

All observations below date to 2026-09-17 unless marked historical. Paths exclude query strings. Listing a source does not prove its content is licensed for copying.

| Source / URL | Purpose / audience | Login and verification | Allowed-use finding / proposed TravelGTC use |
| --- | --- | --- | --- |
| https://www.mwrlife.com/bizcenter/mylinks | Owner source directory | Authenticated; personally read | Internal provenance only; never a customer destination |
| https://www.mwrlife.com/KFilip909 | Official referral entry | Exact address observed in My Links and already approved in 080 | Preserve approved route; registration/attribution outcome not tested |
| https://free.traveladvantage.com/KFilip909 | Guest discovery | Exact address observed in My Links; landing conditions historical in 152, not revalidated here | Existing approved guest route; no personal guest code publication; local TravelGTC account not prerequisite |
| https://vip.traveladvantage.com/KFilip909 | VIP route | Exact address observed in My Links | Existing approved paid route, only for corresponding intent; not registration evidence |
| https://join.traveladvantage.com/KFilip909 | General joining route | Address observed in My Links, destination not inspected | Candidate only; do not infer tariff, price or automatically add to Mira |
| https://lifeexperience.club/KFilip909 | Life Experience route | Address observed in My Links; destination not inspected | Candidate official referral source; guest access and publishing rights unconfirmed |
| https://www.traveladvantage.com/home | Owner product and Life Experience area | Personally read after login | Link to appropriate approved guest route; do not mirror authenticated catalog, prices or balances |
| https://www.mwrlife.com/bizcenter/marketingdocuments | Owner marketing library | Personally read after login | Directory shows presentations in seven languages and compensation plans in eight; private index not for visitors |
| https://mwrlifecontent-pro.s3.amazonaws.com/PDF-and-other-files/MWRLifePowerPoint-RU.ppsx | Russian presentation | Exact download target observed in Marketing; file not downloaded | Candidate direct official material; guest accessibility and distribution rights pending |
| https://mwrlifecontent-pro.s3.amazonaws.com/PDF-and-other-files/mwrlifecompplan-RU.pdf | Russian compensation plan | Exact target observed in Marketing; contents not read | Source candidate for explicit Ambassador questions; no financial claims derived |
| https://mwrlifecontent-pro.s3.amazonaws.com/PDF-and-other-files/mwrlifecompplan-EN.pdf | English compensation plan | Observed in Marketing and listed in 080 | Existing official-source candidate; no new price/commission claims made |
| https://www.mwracademy.com/ | Training | Observed in My Links; Dashboard training uses another mwracademy.com authentication route with query parameters | New auth domain not opened; no token-bearing URL copied; requires scoped approval |
| https://www.mwrlife.online/ | Presentations | Observed in My Links | Destination and reuse rights not inspected; retain only previously approved routes from 080 |
| https://www.mwrevents.com/ | Events | Observed in My Links | Candidate; event eligibility and availability unconfirmed |
| https://www.mwrlifespace.com/ | Community | Observed in My Links | Candidate; access and reuse unconfirmed |
| https://www.mwrlife.com/content/TermsofUse.pdf | Website terms | Linked by authenticated site; public PDF read with web tool, pp. 1–4 | Systematic retrieval and reuse require provider permission; no browser-scraping integration proposed |
| https://www.mwrlife.com/content/MWRTravelAdvantageIntlT&C.pdf | Product terms | Link observed on Travel Advantage; public PDF read | Limited personal non-commercial access; not an integration license |
| https://www.traveladvantage.com/assets/documents/Travel_Advantage_Privacy_Policy_v1.pdf | Privacy policy | Link observed on Travel Advantage; relevant public PDF sections read | Does not establish TravelGTC as an approved recipient/processor; separate data permission required |

The three public policy PDFs were read through a public web reader, not through an authenticated export. No private URL/query or browser session was sent to that reader. Marketing files were not copied to TravelGTC or a knowledge store.

## 4. Technical Basis And Selected Proposal

The reviewed navigation and materials did not establish a supported API, webhook or approved export. This is NOT evidence that no API exists. Owner previously reported contacting support; no reply was supplied in this task. Browser login does not prove synchronization rights.

**Selected current proposal: LINK_ONLY + EXISTING_OWNER_MANUAL_CHECK.** Preserve existing approved official routes. Keep external verification separate from local registration and purchase intent. No scheduler, browser scraper, new credentials, endpoint guessing or runtime change. New presentation routes require audience/access/usage verification before publication.

**Conditional future option: provider-approved one-way status feed.** It becomes implementable only after official mechanism, stable IDs, permission, allowed fields and operational limits are documented and Owner approves the completed contract. If the provider offers no such mechanism, retain manual checking; no hidden scraping fallback.

MWR Terms of Use restrict systematic retrieval and reuse absent written permission (License Restrictions and Intellectual Property Rights). Travel Advantage program terms grant limited personal non-commercial access. These findings support the permission gate; they are not a determination of all rights in the Owner's separate partner agreement.

## 5. Data Contract v0.1 (Proposed, Not Provider Schema)

Direction: approved external source -> private TravelGTC server -> authorized CRM user / minimal subject-specific Mira projection. Never give Mira browser credentials, an Owner session or API credentials.

| Field | Type / rule |
| --- | --- |
| evidence_id | Internal UUID |
| source_system | mwrlife or travel_advantage; server allowlist |
| source_subject_id | Provider stable opaque ID, only if permission allows; no inferred ID from display name |
| local_contact_id | Existing CRM contact UUID, nullable until explicit validated mapping |
| local_lead_id | Existing CRM lead UUID, optional; not an external identifier |
| participation_type | guest / membership / ambassador; separate facts, not automatic promotion |
| source_status | Allowlisted provider status code after documentation; unknown values quarantined |
| normalized_status | unknown / active / inactive / revoked; mapping requires provider semantics |
| verification_method | owner_manual / provider_api / provider_webhook / provider_export |
| observed_at | Server observation time UTC |
| source_effective_at | Provider effective time, nullable; never fabricated |
| verified_at / valid_until | Verification time and explicitly approved freshness bound |
| source_event_id / source_version | Documented deduplication and ordering identifiers where available |
| permission_basis_ref | Internal reference to approved scope/permission, no secret content |
| verifier_id | For manual evidence, authenticated authorized Owner identity, not text from the visitor |
| state | pending_mapping / verified / manual_review / stale / revoked |

An additional private mapping relates `(source_system, source_subject_id)` to a local contact after verified linking. Names, email similarity, link clicks, UTM values and self-reported registration do not auto-link. Email is not introduced as a default matching field. Ambiguity remains manual_review. A local account, guest invitation, paid Membership and Ambassador registration are independent.

Mira projection: only participation_type, normalized_status, source_system, verification_method, verified_at and freshness. Scope by the authenticated subject and proven CRM mapping. An unlinked anonymous guest receives no personal external status. Explicit phrasing must distinguish an Owner check from provider automation. No balance, booking itinerary, payment, passport, family-member or team/downline data is included.

## 6. Operation, Retention, Failures And Disablement

- Current frequency and requests: zero automatic requests; synchronization disabled.
- Future pilot proposal: Owner-triggered only, maximum 10 synthetic or individually authorized records; concurrency 1, maximum 1 request/second or lower provider limit. No polling schedule. Provider limits override this ceiling.
- Auth: provider-documented server credential with least read-only scope; browser cookies prohibited. Credentials require separate approval and approved storage location; never repository/env dumps/logs.
- Webhooks only if documented: signature check over the original body, provider timestamp tolerance and event-ID replay protection; no unsigned endpoint. API/export evidence must carry independently attributable provenance.
- Retry proposal: up to 3 retries with exponential delay/jitter, honoring Retry-After. Retry only idempotent reads; 401/403 disables connector, 429 postpones, persistent 5xx stops the batch. Errors retain codes/counts, not response bodies or secrets.
- Deduplication: source + event ID; version/effective-time comparison prevents older events overwriting later events. If ordering identifiers are unavailable or conflicting, manual review rather than guessed chronology.
- No raw payload persistence. Pilot evidence/mapping retention at most 7 days, followed by deletion; no production retention is approved. Proposed later production maximum 90 days for minimal evidence, subject to purpose, permission and Owner approval before activation. Public material copies are excluded.
- Proposed freshness maximum 24 hours for machine feed; manual evidence remains explicitly “checked at” rather than a claim of current status. These are candidate limits, not provider facts.
- Revocation/expiry -> stop exchange; mark evidence stale or revoked as applicable; never infer membership cancellation from network error or revoked API access.
- Proposed kill switch `PARTNER_SYNC_ENABLED=false`: stop jobs, reject event processing without storing payloads, clear pending fetches and hide current-status assertions. Revoke provider credential separately. Delete pilot data through a separately approved scoped procedure. Existing guest chat must remain available.
- Browser session expiry/global revocation are not known. Logout was observed but not tested; session close must not be described as provider logout. Reauthentication remains manual.

## 7. Exact Candidate Files (No Implementation Authorized)

Paths below are relative to `/var/www/gtc-form`. Existing dirty source files must be rebased against their then-current state before any later work.

| File | Proposed future change |
| --- | --- |
| projects/travelgtc/app/migrations/006_travelgtc_partner_evidence.sql | Minimal evidence/mapping/audit tables; 006 is next observed number after 005, recheck before creation |
| projects/travelgtc/app/src/modules/integrations/partnerEvidence.ts | Schema, normalization, mapping, freshness and deduplication |
| projects/travelgtc/app/src/modules/integrations/partnerSource.ts | Provider adapter only after official mechanism is documented; no scraping adapter |
| projects/travelgtc/app/src/server/config.ts | Disabled-by-default integration flag and limits; no actual values/credentials now |
| projects/travelgtc/app/src/server/createApp.ts | Authenticated server projection; future manual verification restricted to Owner/admin; no new public administrative route |
| projects/travelgtc/app/src/modules/ai/guestChat.ts | Preserve unverified defaults; only accept independently verified server facts for a mapped subject |
| projects/travelgtc/app/src/modules/ai/membershipKnowledge.ts | Approved source metadata without private content; do not alter existing referral routes silently |
| projects/travelgtc/app/tests/partner-evidence.test.ts | Matching, provenance, ordering, privacy and role tests |
| projects/travelgtc/app/tests/partner-source.test.ts | Mocked adapter failure, retry, auth-expiry and kill-switch tests |

Source inspection confirmed existing contact_id/lead_id and `partner_registration_verified:false` in guestChat. It also confirmed separate account/guest chat handlers and existing CRM role mechanisms in createApp. Source reads do not constitute runtime verification. No new UI, migration, feature flag or integration endpoint was created.

## 8. Acceptance Tests For Any Later Implementation

1. Valid stable-ID mapping succeeds; same-name and conflicting mappings fail closed.
2. Link delivery, clicks, local account creation, self-report and purchase intent cannot create external verified status.
3. Guest, Membership and Ambassador statuses remain independent; revoked access is not confused with cancelled membership.
4. Duplicate event is idempotent; out-of-order/conflicting events cannot roll back a newer verified fact.
5. Timeout/429/5xx obey limits; retry exhaustion and 401/403 halt safely; expiry makes facts stale.
6. Wrong webhook signature/replay/unknown status rejected, if a webhook mechanism is approved.
7. Other users, unmapped guests and ordinary team roles cannot read/write Owner-only evidence; prompt text cannot override server facts.
8. Logs, reports and Mira projection contain no excess personal fields, tokens, raw payloads or guest credentials.
9. Kill switch prevents all new exchange and leaves local chat/referral behavior intact; purge pilot evidence after retention.
10. Display includes source and verification time; automated status is never claimed when evidence is manual or unconfirmed.

These tests are specifications, not executed implementation tests. Current verification comprised actual BrowserAct access/DOM reads, public policy reading, read-only source inspection and document consistency checks.

## 9. Remaining Dependencies And One Owner Decision

Not confirmed: provider API/export/webhooks; provider permission to transfer statuses or use private content; actual external registration IDs/status schema; read-only technical role; session TTL/global revocation; guest accessibility of newly discovered materials; Academy content behind a new authentication domain. No data copied merely to resolve these unknowns.

**Owner decision requested:** accept LINK_ONLY + EXISTING_OWNER_MANUAL_CHECK as the current integration boundary, keeping automated exchange and private-content ingestion disabled until written provider permission and a supported interface are supplied. This does not approve Phase C or new credentials. The same task can later receive a completed machine-feed contract without repeating discovery approval.

Provider-response checklist for Owner's existing support dialogue (not sent by the agent): supported interface/documentation; scopes; stable subject/event IDs; registration-type/status semantics; permitted recipient and fields; consent/retention/revocation requirements; limits/sandbox; permission for approved material linking versus copying and AI use. Academy access can be approved separately if needed; it is not evidence of an integration interface.

## 10. Delivery And Change Boundary

This report is intended for `docs/travelgtc/154_travelgtc_integration_001_discovery_contract.md`, linked from task 153 and the documentation register. Only this new report and append-only task/register notes are in scope. Existing modifications are preserved. No commit, push, production deployment, schema change or synchronization activation is implied by documentation delivery.

Source references: task 153; current instruction block in 080; strategy 142; historical release report 152; BrowserAct observations listed above; public official policy URLs in the source map. Historical production v35 is reported by 152, not revalidated here.
