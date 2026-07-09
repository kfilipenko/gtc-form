# TravelGTC - Project Memory Handoff

- Project: TravelGTC
- Project code: travelgtc
- Domain: travelgtc.com
- Owner: GTC INFORMATION TECHNOLOGY FZ-LLC
- Version: 2.5
- Date: 2026-07-09
- Status: Active, upper infographic navigation design implemented

## 1. Current State

TravelGTC was initialized as a new GTC website project.

The final accepted concept is:

```text
Travel Network Lab
```

Meaning: a modern travel club / travel network where a person can travel, create routes, gather people and develop a partner network.

Project Owner added first visual references to:

```text
projects/travelgtc/public/assets/images/inbox/foto/
```

Current implemented direction: travel network / club / community platform where people create travel ideas, gather others, join trips/events, use partner opportunities and develop a network-based travel business without aggressive MLM language.

Created project areas:

```text
docs/travelgtc/
projects/travelgtc/
projects/travelgtc/public/assets/images/inbox/
projects/travelgtc/public/assets/images/processed/
projects/travelgtc/public/legal/
```

First public prototype routes:

```text
/
/travel-lifestyle/
/club/
/create-trip/
/business-model/
/events/
/about/
/contacts/
/auth/
/legal/
/legal/privacy/
/legal/terms/
/legal/partner-disclosure/
```

Server-side publication is prepared:

```text
Live root: /var/www/travelgtc.com
Nginx source template: projects/travelgtc/deploy/nginx/travelgtc.com.conf
Nginx installed config: /etc/nginx/sites-available/travelgtc.com.conf
Deploy script: projects/travelgtc/scripts/deploy_public_live.sh
API service: travelgtc-api.service
API env file: /etc/travelgtc/travelgtc-api.env
```

Current blocker for public domain:

```text
Authoritative Timeweb DNS points to 20.91.187.79.
Some public recursive DNS caches may temporarily keep old Timeweb A/AAAA records.
SSL is issued for travelgtc.com and www.travelgtc.com.
The live HTTPS API proxy is active at /api/travelgtc/.
```

Generated production image asset state:

```text
The previously generated WebP set was rejected and removed.
There are currently no approved production bitmap images in processed/.
Public pages use CSS visual panels until a new approved image set is generated.
```

The original mockups in `inbox/foto/` are design references only.

Architecture state:

```text
Approved architecture document:
docs/travelgtc/018_travelgtc_arch_001_funnel_crm_agent_platform_spec.md

Approved MVP requirements document:
docs/travelgtc/020_travelgtc_biz_001_funnel_crm_mvp_requirements_spec.md

Active implementation roadmap and process mapping:
docs/travelgtc/022_travelgtc_roadmap_001_site_crm_business_process_mapping_spec.md

Active implementation readiness gate:
docs/travelgtc/024_travelgtc_prep_001_implementation_readiness_checklist_spec.md

TravelGTC is now defined as a standalone funnel + CRM + AI-assisted operating system.
n8n is not the core workflow layer for this project.
The product must use own API, own lead database, future CRM logic and specialized AI agents.
Primary process: visitor -> interest -> role -> form -> lead -> consultation -> membership -> participation -> recommendations.
The business model must be introduced through user travel/community needs, not as the first product.
TRAVELGTC-BIZ-001 fixed the first public funnel fields, database schema, API contracts, CRM screens, agent boundaries, consent text and MVP acceptance tests.
TRAVELGTC-ROADMAP-001 fixed the page-to-business-process-to-CRM-to-agent mapping, including implementation phases, API event names, CRM screens and success metrics.
TRAVELGTC-PREP-001 fixed implementation readiness: Node.js/TypeScript + PostgreSQL stack direction, proposed app source layout, environment/secret handling, parent-network/subnetwork boundaries, compliance references, CRM transitions, API contract readiness, Intake Agent protocol readiness and production blockers.
TRAVELGTC-API-001 implemented the first backend app in `projects/travelgtc/app/`, PostgreSQL migration, health endpoint, public lead endpoint, validation, consent enforcement, idempotency, rate limiting, in-memory test store, PostgreSQL runtime store and Intake Agent stub.
TRAVELGTC-WEB-007 implemented the public role selector and unified lead form, converted `/create-trip/` and `/contacts/` forms to the API contract, added API submit JS and added local/test funnel e2e verification.
TRAVELGTC-AUTH-001 fixed the initial registration direction. Its shared identity/account-reuse parts are now superseded by AUTH-003.
AUTH-001 v0.2 and AUTH-002 explored shared GTC identity reuse and optional CrewPortGlobal credential backfill. This direction is now superseded because the Project Owner decided that cross-project user merging creates avoidable privacy, migration and portability risks.
TRAVELGTC-AUTH-002 implemented the backend auth MVP mechanics: registration/login/logout/current-user API, email verification test token path, secure session-cookie handling, bcrypt password handling and authenticated `POST /api/travelgtc/v1/account/leads`.
TRAVELGTC-AUTH-003 replaced shared `gtc_identity` with project-local `travelgtc_identity`, removed CrewPortGlobal identity/credential backfill and fixed the rule that TravelGTC registration is independent from users registered in other projects even when emails match.
TRAVELGTC-AUTH-004 implemented the frontend registration gate: `/auth/`, header account controls, cookie-authenticated browser API calls, anonymous form redirect to registration/login and public funnel submission through `POST /api/travelgtc/v1/account/leads`.
TRAVELGTC-RUNTIME-001 implemented the first server runtime: PostgreSQL database `travelgtc`, app role `travelgtc_user`, migrations applied, `travelgtc-api.service` active on `127.0.0.1:4301`, nginx `/api/travelgtc/` HTTPS proxy active, current static site deployed and live HTTPS authenticated funnel verified.
TRAVELGTC-LEGAL-001 published `/legal/`, `/legal/privacy/`, `/legal/terms/` and `/legal/partner-disclosure/`, linked them from footers and consent texts, and verified local/live responsive and authenticated funnel tests.
```

API state:

```text
App path: projects/travelgtc/app/
Health endpoint: GET /api/travelgtc/v1/health
Lead endpoint: POST /api/travelgtc/v1/public/leads
Authenticated lead endpoint: POST /api/travelgtc/v1/account/leads
Auth endpoints: /api/travelgtc/v1/auth/register, /auth/login, /auth/logout, /auth/me, /auth/email/send-verification, /auth/email/verify
Migration: projects/travelgtc/app/migrations/001_travelgtc_lead_capture.sql
Identity migration: projects/travelgtc/app/migrations/002_travelgtc_identity_auth.sql
Run API check: npm run check:travelgtc-api
Default safety switch: TRAVELGTC_PUBLIC_LEAD_CAPTURE_ENABLED=false
Default authenticated lead switch: TRAVELGTC_ACCOUNT_LEAD_CAPTURE_ENABLED=false
Frontend public forms now use the authenticated account lead endpoint, not the public lead endpoint.
Runtime database: travelgtc
Runtime database role: travelgtc_user
Runtime service: travelgtc-api.service
Runtime API bind: 127.0.0.1:4301
Runtime HTTPS proxy: https://travelgtc.com/api/travelgtc/
Runtime env file: /etc/travelgtc/travelgtc-api.env
Runtime switches: public lead capture false, account lead capture true, agent stub, parent network none, secure cookies true.
```

Public funnel state:

```text
Auth page: projects/travelgtc/public/auth/index.html
Home form: projects/travelgtc/public/index.html#lead-form
Create-trip form: projects/travelgtc/public/create-trip/index.html#idea-form
Contacts form: projects/travelgtc/public/contacts/index.html#contact-form
Header includes login, registration, logged-in display name and logout controls.
Anonymous form submit redirects to /auth/?mode=register&next=...
After registration/login, user returns to the intended form and creates a CRM lead through account/leads.
Funnel e2e command: npm run test:travelgtc-funnel
Local test static port: 4174
Local test API port: 4302
Funnel test env enables TRAVELGTC_ACCOUNT_LEAD_CAPTURE_ENABLED=true and disables public lead capture.
Live HTTPS funnel command: TRAVELGTC_FUNNEL_BASE_URL=https://travelgtc.com npm run test:travelgtc-funnel
Live responsive command: TRAVELGTC_BASE_URL=https://travelgtc.com npm run test:travelgtc
Live test database currently contains disposable test records created by verification and may be cleared before production launch.
```

Legal/disclosure state:

```text
Privacy page: projects/travelgtc/public/legal/privacy/index.html
Terms page: projects/travelgtc/public/legal/terms/index.html
Partner disclosure page: projects/travelgtc/public/legal/partner-disclosure/index.html
Footer links expose the legal pages on all public routes.
Registration and lead consent text links to privacy/terms pages.
The legal pages are working informational pages and still require Project Owner / legal review before a broad public launch.
```

Typography correction state:

```text
Home hero uses CSS visual background because rejected generated images were removed.
Desktop H1/H2/H3 scales were reduced further to match the original mockup hierarchy.
Hero and page-hero heights were reduced for denser landing-page proportions.
The third hero headline line uses the lime reference accent.
The short home advantages now render as a compact dark band below the hero.
```

Menu/footer/mobile state:

```text
Home page includes a clickable infographic-style menu for all public routes.
TRAVELGTC-WEB-008 moved this infographic menu from the lower home page to the upper page area directly after the hero and short benefits band.
The block is now titled as the site structure and visually supports the funnel path: interest -> role -> application -> consultation.
Infographic menu uses responsive columns: desktop 8, tablet 4, mobile 2.
Footer is compacted with smaller padding, smaller links and desktop disclaimer columns.
Mobile source audit passed through viewport/meta, CSS breakpoint checks and Playwright browser tests.
```

Responsive QA state:

```text
Local Playwright is available through npx.
Chromium binaries are present in ~/.cache/ms-playwright.
TravelGTC responsive test command: npm run test:travelgtc
TravelGTC Playwright config: playwright.travelgtc.config.ts
TravelGTC responsive tests: tests/travelgtc-responsive.spec.ts
Generated screenshots are written to projects/travelgtc/test-artifacts/screenshots/ and ignored by git.
```

## 2. Working Rules

1. Start each new TravelGTC task by reading this memory document and `docs/travelgtc/00_documentation_register.md`.
2. Use the GTC project delivery standards in `docs/gtc_project_delivery_standard/`.
3. Keep source images in `projects/travelgtc/public/assets/images/inbox/`.
4. Move optimized and approved images to `projects/travelgtc/public/assets/images/processed/`.
5. Public pages should stay action-first: travel dream, community, then business opportunity.
6. Do not collect real personal data before privacy/consent and backend handling are defined.
7. Fix meaningful changes with documentation updates, verification and git commit.

## 3. Next Recommended Step

Recommended next steps:

1. start `TRAVELGTC-CRM-001 - Lead Board And Lead Detail MVP`;
2. before public launch announcement, clear disposable test users/leads or document retained test data;
3. add `TRAVELGTC-DATA-001 - Test Data Cleanup And Database Backup Policy`;
4. decide official privacy contact email and retention period;
5. obtain current official parent-network policies/income disclosures before any detailed compensation discussion.

## 4. Revision History

| Version | Date | Author | Changes |
|---|---|---|---|
| 2.5 | 2026-07-09 | GTC IT / AI Assistant | Recorded upper-page infographic navigation redesign and responsive verification |
| 2.4 | 2026-07-09 | GTC IT / AI Assistant | Recorded legal/privacy/disclosure pages, footer links, consent links and next CRM step |
| 2.3 | 2026-07-09 | GTC IT / AI Assistant | Recorded live test runtime: PostgreSQL DB, systemd API service, nginx proxy and HTTPS funnel verification |
| 2.2 | 2026-07-09 | GTC IT / AI Assistant | Recorded frontend registration gate, `/auth/`, authenticated form submission and runtime publication as next step |
| 2.1 | 2026-07-09 | GTC IT / AI Assistant | Recorded project-local TravelGTC registration isolation and removal of shared GTC identity/CrewPortGlobal backfill |
| 2.0 | 2026-07-09 | GTC IT / AI Assistant | Recorded AUTH-002 backend auth MVP, gtc_identity migration, optional CrewPortGlobal identity backfill and authenticated lead endpoint |
| 1.9 | 2026-07-09 | GTC IT / AI Assistant | Clarified existing CrewPortGlobal/GTC account reuse on TravelGTC without duplicate registration and without automatic project-data transfer |
| 1.8 | 2026-07-09 | GTC IT / AI Assistant | Recorded GTC identity registration gate, auth-required TravelGTC form direction and CrewPortGlobal seafarer opt-in boundary |
| 1.7 | 2026-07-09 | GTC IT / AI Assistant | Recorded public funnel form, API submit JS and local/test funnel e2e path |
| 1.6 | 2026-07-09 | GTC IT / AI Assistant | Recorded lead capture API, database schema migration and API check command |
| 1.5 | 2026-07-09 | GTC IT / AI Assistant | Recorded implementation readiness checklist and parent-network/subnetwork preparation rules |
| 1.4 | 2026-07-09 | GTC IT / AI Assistant | Recorded site, CRM and business process mapping roadmap |
| 1.3 | 2026-07-09 | GTC IT / AI Assistant | Recorded funnel and CRM MVP requirements and API-001 as next implementation stage |
| 1.2 | 2026-07-09 | GTC IT / AI Assistant | Recorded approved funnel, CRM and AI agent platform architecture |
| 1.1 | 2026-07-09 | GTC IT / AI Assistant | Recorded removal of rejected generated WebP images and temporary CSS visual panels |
| 1.0 | 2026-07-09 | GTC IT / AI Assistant | Recorded Playwright responsive testing setup and screenshot artifact path |
| 0.9 | 2026-07-09 | GTC IT / AI Assistant | Recorded menu infographic, compact footer and mobile adaptation check |
| 0.8 | 2026-07-09 | GTC IT / AI Assistant | Recorded second reference visual scale pass for hero accent, compact typography and benefits band |
| 0.7 | 2026-07-09 | GTC IT / AI Assistant | Recorded reference typography and hero proportion alignment |
| 0.6 | 2026-07-09 | GTC IT / AI Assistant | Recorded generated production image set |
| 0.5 | 2026-07-08 | GTC IT / AI Assistant | Recorded authoritative DNS switch and Let's Encrypt SSL completion |
| 0.4 | 2026-07-08 | GTC IT / AI Assistant | Recorded server-side publication, live root, nginx config and Timeweb DNS blocker |
| 0.3 | 2026-07-08 | GTC IT / AI Assistant | Recorded final Travel Network Lab concept and first public prototype routes |
| 0.2 | 2026-07-08 | GTC IT / AI Assistant | Added visual reference location and interpreted TravelGTC product direction |
| 0.1 | 2026-07-08 | GTC IT / AI Assistant | Initial TravelGTC project memory handoff |
