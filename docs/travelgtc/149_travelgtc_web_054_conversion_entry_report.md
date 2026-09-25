# TRAVELGTC-WEB-054 - Conversion Entry Release Report

- Date: 2026-09-16
- Status: PUBLISHED / verification passed; Owner visual review pending
- Task: `148_travelgtc_web_054_conversion_entry_task.md`
- Owner authority: accepted first-stage audit proposal and supplied founder information/social URLs.

## Implementation

Homepage: one travel-led hero and primary Mira CTA, three independent directions, next-step explanation, founder/network proposition, four native FAQ disclosures. Existing illustration reused, not presented as a real participant testimonial. No invented pricing, product screenshots, trip results or income claims.

About page: Konstantin Filipenko as founder, ambassador and traveler, plus Owner-supplied Facebook and LinkedIn URLs. Automated access to both profiles failed; external career claims were not independently verified or copied. No fabricated founder portrait. Business page gets a bounded project-support section, with no CRM-access or automatic lead-generation promise.

Mira: compact header/consent area, responsive scrollable conversation, visible input and send button on tested mobile sizes. Guest consent stays unchecked and necessary. Correct scenario prefill no longer leaves the native topic selector blank. Missing consent does not dismiss the topic selector. Existing three-exchange/referral gate, local account return/history and Azure instruction version are unchanged.

## Measurement Boundary

Only successful consented guest conversations receive `funnel_event=conversation_started` on their first inbound interaction, in the same transaction as the completed model reply. No event on model failure, no duplicate on further turns. Entry metadata includes source/CTA/scenario and optional `utm_source`, `utm_medium`, `utm_campaign`, `utm_content` campaign codes. Codes must match `[a-zA-Z][a-zA-Z0-9_-]{0,63}`. Other parameters, full URLs, free-text search terms and email-like values are excluded. Campaign labels are client-supplied attribution, not verified identity or proof of sale.

No new analytics cookies, local storage, third-party collectors, pixel or visitor endpoint. Internal entry links retain these codes; auth return URLs preserve the chosen context. No pageview denominator or conversion uplift is claimed. Guest interaction retention still bounds this pilot measurement to the existing 30-day policy for unclaimed chats; registered history follows the existing policy.

Authorized operators can aggregate without retrieving message bodies:

```sql
select date_trunc('day', created_at) as day,
       metadata_json->'entry'->>'source' as entry_source,
       metadata_json->'entry'->>'cta' as cta,
       metadata_json->'entry'->'campaign'->>'utm_source' as campaign_source,
       count(distinct lead_id) as guest_conversations_started
from travelgtc_interactions
where metadata_json->>'funnel_event' = 'conversation_started'
group by 1,2,3,4 order by 1 desc;
```

## Verification

- TypeScript build PASS; unit/API suite 77/77 PASS, including extra attribution assertions.
- Isolated PostgreSQL: 19 checks PASS; 4 fake model calls, no Azure/production writes. Temporary database removed. Checks cover unique event, persisted entry, guest isolation/claim/revocation/expiry and failure rollback.
- Playwright: **12/12 PASS**. Cases cover 1920x1080, 1440x900, 390x844, 320x700, 320x568; primary CTA/next-section visibility, compact chat with visible input/send, consent, safe campaign labels, founder links, FAQ and guest-to-account return. Screenshots inspected. Initial tiny-screen overflow and blank scenario selector were fixed before release.
- Production: scoped patch applied; API TypeScript rebuild and 77/77 tests passed again. Only `travelgtc-api.service` restarted; existing static deploy script completed and all eight route checks returned HTTP 200.
- Live read-only Playwright smoke PASS at 1440x900, 390x844 and 320x568 across home, Mira, About and business pages. Primary CTA and chat input/send visible; consent unchecked; no horizontal overflow, browser errors, broken images or mutating requests. Screenshots visually inspected.
- All 16 changed public files byte-match the source. `git diff --check` PASS.
- Production health: `ok=true`, `ai_chat_mode=azure`, `AI-TravelGTC` version `31`, `guest_chat_enabled=true`. No live model call or test account/contact created.
- Evidence: `/tmp/travelgtc-web054-live-result.json`; `/tmp/travelgtc-web054-live-home-{1440,390,320}.png`; `/tmp/travelgtc-web054-live-mira-{1440,390,320}.png`. Verification date: 2026-09-16 UTC.

## Publication And Rollback

Scoped deployment only, preserving the dirty working tree. No Git commit/push or protected-main merge implied. No changes to Azure, OpenClaw, Agent-01, credentials, permissions, authentication requirements or database schema. Existing API rebuild/restart and `deploy_public_live.sh` are the release path.

Rollback backup: `/var/backups/travelgtc-web054-20260916` (root-only source/public/dist, no credential copy). Restore affected files/dist and restart only `travelgtc-api`; remove newly added public CSS if rolling back its HTML references. No database rollback is required for additive JSON metadata. Rollback is prepared, not exercised against production.

## Next Content Stage

Real founder portrait, permitted participant stories, current product walkthrough, verified comparisons, separate events content and optional-phone registration improvement remain deferred. First-stage completion does not imply all page-audit recommendations were implemented. No OpenClaw/provider work is included.
