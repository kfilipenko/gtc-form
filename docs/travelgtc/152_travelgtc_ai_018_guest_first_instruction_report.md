# TRAVELGTC-AI-018 - Guest-First Instruction Revision

Date: 2026-09-16. Scope: existing task 146, Owner-directed instruction alignment while Owner contacts MWR Life support about API access. Status: PUBLISHED / PRODUCTION VERIFIED after Owner acceptance and explicit authorization to publish, test and refine the existing agent.

## Published Release

- Agent: existing AI-TravelGTC, production pin changed from v31 to v35. Model remains gpt-4o; tools remain empty. No new model deployment, resource or credential.
- Exact instruction payload SHA-256: `defec578de4227506bdc857e916213ac352d34da1a94f1f9e5273d663a334c47`, equal to source document 080 between its current-payload markers.
- Versions 32-34 were test candidates, never activated on the website. Tests revealed unsolicited links, disclosure of the internal conversation counter and an incorrect claim that every booking requires paid Membership. Refinements removed the counter from model context, added the dated Guest Pass limitation observed on the official personal landing page and made the early paid-intent answer deterministic.
- The application, not instruction compliance alone, enforces referral-link timing. A raw model response can still offer a premature paid link; the published gate replaces that response before delivery and does not create a purchase task or notification.
- Deployment replaced only `dist/src/modules/ai/guestChat.js`, `membershipKnowledge.js`, `miraIntent.js` and `dist/src/server/createApp.js`, plus the single agent-version environment value. Service restart and health verification took 1,075 ms; this is not a measurement of total visitor downtime.
- Protected rollback backup: `/var/backups/travelgtc-ai018-guest-first-20260916` (root-only directory; private environment backup and prior four modules). Rollback must restore both modules and v31 pin together. Rollback was not required or exercised on production.

## Result

- Instruction 080 identifies TravelGTC as Konstantin's referral and consultation site promoting MWR Life / Travel Advantage, not a separate travel product. It retains the non-official-site disclosure.
- Official-product funnel: interest -> guest preview -> Mira assistance -> explicit participation choice -> approved referral -> independently verified registration. Official materials are linked rather than copied into a competing presentation; My Links is not a visitor destination.
- Direct product-preview or Guest Pass requests can receive the existing approved guest link immediately. The label distinguishes guest exploration from paid enrollment. Guest access can require an official guest account; a TravelGTC account is not required to follow the link.
- Paid Membership/Ambassador keeps the existing three-completed-exchanges and renewed-explicit-intent gate. Document requests, guest requests, refusals and self-reported registration do not create purchase intent.
- Source application context and both guest/account request prompts agree on this exception. The deterministic gate supplies the approved URL and distinct label. Existing consent, rate limits, cookie identity, retention and account linkage remain unchanged.
- Instruction distinguishes link delivery, user-reported registration, guest registration and paid participation. Until a verified integration exists, only an Owner back-office check can confirm external registration. No new CRM confirmation function was implemented; the model cannot assert it performed that check.
- No capability to read private My Links, observe external bookings, call a new API or force a return from the partner site is claimed. Existing exact referral URLs are preserved.

## Verification

- TypeScript build: PASS.
- Isolated source Vitest run: 98 tests in 5 files PASS (including instruction-payload, intent, gate and API-contract tests). Command: `npm test -- --no-cache --configLoader runner --exclude '**/dist/**'`; compiled duplicate tests are excluded from this count.
- New cases cover immediate guest links at multiple conversation lengths, direct product-preview phrasing, guest refusals, ambiguous registration, self-reported registration, paid-link timing, non-purchase CRM metadata, no purchase notification and matching guest/account context.
- Unit/API-contract tests use mocked Azure, database and notification providers. They are distinct from the real Azure and production checks below.
- Real Azure v35 tests: 10 scenarios (immediate guest request, guest-link refusal, family/no-business, official document, early VIP, ready VIP, self-reported registration, private-cabinet request, Ambassador evaluation, ready Ambassador). Routing assertions passed and final user-visible answers were reviewed. Responses took 1,975-5,522 ms in this run.
- Real four-turn Azure conversation: family introduction -> guest invitation -> comparison/refusal to buy -> renewed VIP request after three exchanges. Routes and purchase intent passed; responses took 1,846-4,562 ms. These 14 test turns created no CRM records or emails.
- Live production `/api/travelgtc/v1/health` confirmed Azure v35 and guest chat enabled. One synthetic guest POST returned the exact Free referral link, `purchase_intent=false`, `partner_registration_verified=false`, `cold_contact`, and one completed exchange in 2,774 ms. Cookie-authenticated history returned both messages. Database verification found no purchase task; the exact test guest/contact/lead/history were deleted transactionally. No real customer records were modified and no purchase email path was triggered.
- Live browser inspection preceding this change confirmed the approved Free/VIP landing pages show Konstantin; it did not validate completed enrollment or attribution after checkout. Private My Links and post-login booking content remain uninspected.

## Publication Boundary And Evidence

The earlier source-only revision was accepted by Owner before this runtime release. The instruction and application are now deployed as a pair. Azure SDK readback verified the created version's instruction and preserved definition; deployment checked exact prior/new module hashes before switching and verified health afterward.

Source changes cover instruction 080, application knowledge/routing/gate/context, focused regression tests, task 146, strategy 142 and this register/report. Temporary test/deployment scripts and non-secret Azure transcripts are under `/tmp/travelgtc-guest-first-20260916-VqdC0Y`; deployment manifest/result are in the protected backup directory. No keys/tokens are included in the report.

No changes to public HTML/layout, service unit, credentials, permissions, OpenClaw, Agent-01, database schema or partner API. No Git commit/push was performed; unrelated existing worktree changes were left intact. The earlier publication report 147 remains historical evidence. Production mutations were limited to the paired release and the synthetic guest verification record, subsequently removed.

## Follow-Up

Homepage guest-first CTA work is a separate website change, not silently included here. MWR Life API integration remains pending the Owner's support response and a documented, scoped access method. External registration is not automatically verified and partner-site return cannot be forced by TravelGTC. Model wording remains nondeterministic; passing these examples does not guarantee correctness of every future response. Official prices, availability and terms still require current source verification.
