# TravelGTC - Project Memory Handoff

- Project: TravelGTC
- Project code: travelgtc
- Domain: travelgtc.com
- Owner: GTC INFORMATION TECHNOLOGY FZ-LLC
- Version: 5.8
- Date: 2026-07-28
- Status: Active, Mira first-question prompt moved into chat flow

## 1. Current State

TravelGTC was initialized as a new GTC website project.

Historical initial public concept:

```text
Travel Network Lab
```

Meaning: a modern travel club / travel network where a person can travel, create routes, gather people and develop a partner network.

Current public home-page positioning after TRAVELGTC-WEB-024:

```text
TravelGTC is a partner information page of an independent Lifestyle Ambassador.
It explains MWR Life, Travel Advantage membership and the Ambassador path.
It does not present itself as the official MWR Life / Travel Advantage site or as an independent travel company.
```

Project Owner added first visual references to:

```text
projects/travelgtc/public/assets/images/inbox/foto/
```

Current implemented direction: TravelGTC is a standalone lead/CRM/AI-assisted subnetwork funnel that starts from Travel Advantage membership interest and calm explanation, captures authenticated leads in its own database, and routes interested users to human consultation and official MWR Life / Travel Advantage next steps.

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
/mira/
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

Current public domain state:

```text
travelgtc.com is publicly served from /var/www/travelgtc.com.
SSL is issued for travelgtc.com and www.travelgtc.com.
The live HTTPS API proxy is active at /api/travelgtc/.
The live API service is travelgtc-api.service on 127.0.0.1:4301.
```

Generated production image asset state:

```text
The previously generated WebP set was rejected and removed.
TRAVELGTC-WEB-009 added two new processed assets prepared from Project Owner reference materials:
projects/travelgtc/public/assets/images/processed/travelgtc-hero-group-sunset.webp
projects/travelgtc/public/assets/images/processed/travelgtc-bay-view.webp
TRAVELGTC-WEB-010 added five more processed assets from the new Project Owner image set:
projects/travelgtc/public/assets/images/processed/travelgtc-business-handshake-terrace.webp
projects/travelgtc/public/assets/images/processed/travelgtc-club-evening-gathering.webp
projects/travelgtc/public/assets/images/processed/travelgtc-coast-lounge-sunset.webp
projects/travelgtc/public/assets/images/processed/travelgtc-traveler-cliff-view.webp
projects/travelgtc/public/assets/images/processed/travelgtc-trip-planning-terrace.webp
The home page now uses `travelgtc-club-evening-gathering.webp` as the hero background.
The travel lifestyle, club, create-trip, business-model, events and contacts pages now use real page-specific images instead of generic CSS visual placeholders.
TRAVELGTC-WEB-011 then added a newer set of design/photo references from `inbox/foto/` and remapped the main pages so they do not reuse the same primary image:
home hero -> travelgtc-home-hero-deck-sunset.webp
home content -> travelgtc-home-lounge-sea-view.webp
travel lifestyle -> travelgtc-lifestyle-mountain-community.webp
club -> travelgtc-club-seaside-reception.webp
create trip -> travelgtc-create-trip-coast-table.webp
business model -> travelgtc-business-dubai-planning.webp
events -> travelgtc-events-night-dinner.webp
contacts -> travelgtc-contact-sunset-lounge.webp
about -> travelgtc-about-network-sunset.webp
TRAVELGTC-WEB-020 added the approved route planning photo for the home route CTA:
projects/travelgtc/public/assets/images/processed/travelgtc-route-map-planning-coast.webp
Source:
projects/travelgtc/public/assets/images/inbox/foto/ChatGPT Image 9 июл. 2026 г., 15_56_48 (4).png
TRAVELGTC-WEB-021 added the approved header logo:
projects/travelgtc/public/assets/images/processed/travelgtc-logo-header.webp
Source:
projects/travelgtc/public/assets/images/inbox/foto/Logo TravelGTC.png
TRAVELGTC-WEB-023 added the favicon package:
projects/travelgtc/public/favicon.ico
projects/travelgtc/public/favicon-16x16.png
projects/travelgtc/public/favicon-32x32.png
projects/travelgtc/public/apple-touch-icon.png
projects/travelgtc/public/android-chrome-192x192.png
projects/travelgtc/public/android-chrome-512x512.png
projects/travelgtc/public/site.webmanifest
Source:
projects/travelgtc/public/assets/images/inbox/foto/Favicon TravelGTC.png
```

The original mockups in `inbox/foto/` are design references only.

Design-system state:

```text
Canonical design-system document:
docs/travelgtc/049_travelgtc_design_system.md

Project Owner source draft:
projects/travelgtc/docs/travelgtc/011_travelgtc_design_system.md

The canonical design-system number is 049 because 011 is already occupied by TRAVELGTC-WEB-005.
The active visual direction is premium travel club + digital network + lifestyle community.
Core colors: #061A28, #0B2A3A, #0E5A73, #00C7D9, #9BEA2E, #F5F8FA.
Use Manrope as the primary public-site font with Inter fallback.
Public design must stay compact, image-led and funnel-oriented.
Home funnel path: interest -> role -> application -> consultation -> membership -> participation -> recommendations.
TRAVELGTC-WEB-013 rule: the home page must show this full process only once. It is the entry page for visitor -> interest -> role -> authenticated lead form -> CRM lead -> consultation, not a repeated text library.
TRAVELGTC-WEB-014 rule updated by AUTH-005: the home page form is a short first-contact request, not a full CRM questionnaire. Keep visible fields limited to need and short message. Infer CRM role from the selected need instead of showing a separate role selector on the home page.
TRAVELGTC-AUTH-005 rule: registration comes first and collects identity/contact data. Lead forms must not ask again for name, contact value or communication channel. Supported first-stage profile contact methods are email and phone. The frontend derives lead `name`, `preferred_channel` and `contact_value` from the authenticated user profile.
TRAVELGTC-WEB-015 rule: do not publish a visible home page block that declares the page/process purpose, including `Страницы и процесс` or `Каждый раздел ведёт к следующему действию`. The home page must perform the funnel through content and CTA. Compact process hints may live in the top navigation only.
TRAVELGTC-WEB-016 rule: the home page should contain an image-led opportunity block immediately after the hero area. It must show travel scenarios and route creation desire through a compact photo gallery and `Создавайте свои маршруты` CTA, not through a repeated page-process explanation.
TRAVELGTC-WEB-017 rule: do not duplicate the `Контакты` route with a separate `Связаться со мной` header button. Do not reintroduce the four-card home `benefits-band` / `benefit-strip` block; the visual opportunity gallery is the primary post-hero interest block.
TRAVELGTC-WEB-018 rule: do not place standalone network-model explanation on the home page. The home page should focus on travel desire, route creation and the short request form. Network/trust/business model explanation belongs to later pages/sections. Also avoid service labels such as `Новые возможности` and `Короткий запрос` above already clear blocks.
TRAVELGTC-WEB-019 rule: the home opportunity gallery heading `Путешествия - это больше, чем отдых` must stay on one line on desktop and tablet. Narrow mobile may wrap normally to avoid horizontal overflow.
TRAVELGTC-WEB-020 rule: the home `Создавайте свои маршруты` block uses handwritten `Caveat` typography, five SVG route-format icons and `travelgtc-route-map-planning-coast.webp`. Do not reintroduce numeric route badges in this block.
TRAVELGTC-WEB-021 rule: public headers use `travelgtc-logo-header.webp` as the brand. Do not reintroduce the separate header text line `Travel Network Lab`; the subtitle is part of the logo image.
TRAVELGTC-WEB-022 rule: after a successful authenticated lead submission, the visible form button must change to `Вернуться на главную` and navigate to `/` instead of submitting another lead.
TRAVELGTC-WEB-023 rule: keep the favicon package in the public root and keep all public HTML pages linked to `/favicon.ico`, 16x16/32x32 PNG icons, `/apple-touch-icon.png`, `/site.webmanifest` and `theme-color` `#061A28`. Nginx must serve `/site.webmanifest` as `application/manifest+json` because `nosniff` is enabled.
TRAVELGTC-WEB-024 rule: the home page is now Travel Advantage membership-first with clear independent Lifestyle Ambassador disclosure. It must not imply that TravelGTC is the official MWR Life / Travel Advantage site, an independent travel agency, a booking provider or a payment/enrollment channel. Do not reintroduce the old home hero `Создавайте путешествия. Собирайте людей. Развивайте сеть.` as the primary message.
TRAVELGTC-WEB-025 rule: the home page includes an official MWR Life company facts block based on `https://www.mwrlife.com/home/company`. Do not publish company metrics, office addresses, legal data, countries, language counts or regional claims without checking the official source. Keep service, trust and next-step process badges as pictograms/emoji, not `01` / `02` numeric labels.
TRAVELGTC-AI-001 rule: the public AI consultant is named `Мира TravelGTC`. Use `docs/travelgtc/080_travelgtc_ai_001_mira_consultant_instruction.md` as the canonical instruction for personality, official sources, published facts, compliance limits and lead-routing behavior. Мира may be cheerful and tell short illustrative travel-community stories, but must not promise income, savings, availability, membership approval or business results.
TRAVELGTC-WEB-038 rule: the old home `#lead-form` short request form is removed. Do not reintroduce a separate short request form on the home page as the primary conversion path. First interest selection now belongs inside `/mira/` as a first-question selector. The selector must live inside the scrollable chat message flow, not in the fixed bottom input bar. The selected item becomes the first chat question, the selector hides after the first question, the question is preserved through the auth gate and is stored in AI/CRM history after login.
TRAVELGTC-WEB-034 rule: the home `Официальные входы Travel Advantage` card must use a single-column layout. Long CTA labels must not create an `auto` grid column that collapses the explanatory text into vertical letters.
TRAVELGTC-WEB-035 rule: the membership-first top navigation must not include a separate `Travel Advantage` hash link or duplicate `Узнать о членстве` CTA. The AI entry in the top menu is a single `Мира` link to `/mira/`; the home page must not include the old embedded floating AI widget.
TRAVELGTC-WEB-036 rule: `/mira/` is a chat-only working page. Do not duplicate the home `#relationship` Guest Pass / VIP Membership explanatory block, official access buttons or promo copy there. Keep guest-access explanation on the home relationship block and let Mira handle questions in the chat.
TRAVELGTC-WEB-037 rule: `/mira/` uses the approved avatar source `projects/travelgtc/public/assets/images/inbox/Mira Avatar.png`, optimized and published as `/assets/images/processed/mira-avatar.webp`. Do not replace it with generated alternatives unless the Project Owner explicitly provides a new approved source. The chat panel header must not duplicate the site logo or repeated `Мира TravelGTC / AI-чат` text because the brand and page entry are already present in the top menu. Use the compact banner wording `Спросите / Вашего Агента / Мира:` with the avatar on the right.
TRAVELGTC-WEB-039 rule: `/contacts/` is removed as a separate public page and must not be reintroduced as a duplicate request form. Primary consultation flow is `/mira/`. Direct project contacts belong in the global footer and are assembled client-side from protected data pieces to reduce basic source-code scraping; this is not absolute protection against JavaScript-capable bots.
TRAVELGTC-WEB-040 rule: the home block `Как вы становитесь участником или изучаете роль Ambassador` must stay as three service-oriented steps: `Диалог с Мирой`, `Официальная ссылка`, `Сопровождение TravelGTC`. Do not restore the removed process cards `Мира`, `Выбор интереса`, `Вход или регистрация`, `Консультация`, `Официальный шаг`. Public working pages should use natural service wording and should not emphasize a human-vs-AI distinction; legal/privacy pages may still disclose AI/automated processing.
```

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
TRAVELGTC-AUTH-005 made phone required at registration, limited registration contact preference to email/phone, removed repeated contact fields from home, contacts and create-trip lead forms, and changed lead payload building to use the authenticated user profile for contact data.
TRAVELGTC-WEB-015 removed the standalone home page `site-map-section` / `menu-infographic` process block and moved compact process labels into the top navigation.
TRAVELGTC-WEB-016 added the home opportunity gallery with five visual calls to action and a compact `Создавайте свои маршруты` block that leads to the authenticated request form.
TRAVELGTC-WEB-017 removed the duplicate `Связаться со мной` header button from public pages, changed the contacts page H1 to `Контакты`, and removed the repeated four-card home benefits band.
TRAVELGTC-WEB-018 removed the `Новые возможности` and `Короткий запрос` service labels, removed the home form helper copy about profile contacts, and removed the standalone `Современная сеть` / `Сеть - это не давление...` home section.
TRAVELGTC-WEB-019 adjusted the home opportunity heading CSS so `Путешествия - это больше, чем отдых` renders as a single line on desktop/tablet while mobile remains responsive.
TRAVELGTC-WEB-020 updated the home route CTA with Caveat handwritten title styling, five inline SVG infographic icons instead of numeric badges and the Project Owner route-map planning photo.
TRAVELGTC-WEB-021 replaced the public header text brand with the approved TravelGTC logo, removed the separate header subtitle and kept footer text branding unchanged.
TRAVELGTC-WEB-022 changed the shared lead-form success behavior so the submit button becomes a `Вернуться на главную` home-return button after the CRM lead is created.
TRAVELGTC-WEB-023 published the favicon package from the Project Owner source, linked it from all public pages, added Playwright asset/manifest checks and updated nginx manifest MIME handling.
TRAVELGTC-WEB-024 repositioned the home page as a Travel Advantage membership funnel with MWR Life / Travel Advantage / TravelGTC relationship cards, safe trust/disclosure blocks, next-step process, safe AI-consultant frontend stub, new lead interest options, official-source footer links and updated public disclosure wording. The static site was deployed live and `travelgtc-api.service` was rebuilt/restarted so the new interest enum values are accepted.
TRAVELGTC-WEB-025 added the official MWR Life company facts/address block to the home page, replaced numeric service/trust/process badges with pictograms and extended responsive tests to verify the company block and absence of numeric badges.
TRAVELGTC-AI-001 named the public AI consultant `Мира TravelGTC`, added a canonical instruction document with official source links and published facts, and aligned the frontend AI stub greeting/answers with the new friendly-but-compliant personality.
TRAVELGTC-WEB-033 removed the unprocessed free-form request textarea from the home lead form, removed the `Задать вопрос` option from the home lead select and added `scroll-margin-top` so `#lead-form` is not hidden under the fixed header.
TRAVELGTC-WEB-034 fixed the home Membership access card by making the access-card layout single-column and adding a Playwright guard against vertical heading collapse.
TRAVELGTC-WEB-035 simplified the membership-first top navigation, removed duplicate top CTAs and moved home AI access to the dedicated `/mira/` page.
TRAVELGTC-WEB-036 removed the left promo/copy column and Guest Pass / VIP buttons from `/mira/`, leaving the page focused on the authenticated AI chat.
TRAVELGTC-WEB-037 added the approved Mira avatar visual to `/mira/`, then refined it into a compact chat banner with no duplicated logo/header text and updated responsive tests to verify the image asset.
TRAVELGTC-WEB-038 removed the old home `#lead-form` short request form, replaced home request CTAs with `/mira/`, added a first-question selector to the Mira chat form and extended tests for the Mira-first funnel.
TRAVELGTC-WEB-040 simplified the home Membership/Ambassador process block from six cards to three service steps: dialogue with Mira, official link, and TravelGTC support when needed.
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
Accepted `primary_interest` values include both old funnel values and WEB-024 values: `learn_travel_advantage`, `become_travel_advantage_member`, `learn_mwr_life`, `learn_lifestyle_ambassador`, `partner_model`, `events`, `create_travel_group`, `presentation_request`, `question`.
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
Home short request form: removed by TRAVELGTC-WEB-038
Primary conversion entry: projects/travelgtc/public/mira/index.html
Create-trip form: projects/travelgtc/public/create-trip/index.html#idea-form
Contacts page/form: removed by TRAVELGTC-WEB-039
Direct footer contacts: email and project phone are rendered from protected data pieces by `projects/travelgtc/public/assets/js/site.js`
Header includes login, registration, logged-in display name and logout controls.
Anonymous form submit redirects to /auth/?mode=register&next=...
After registration/login, user returns to the intended form and creates a CRM lead through account/leads.
All public lead forms now depend on registration/profile contacts. They do not ask for name, contact value or channel. Registration requires email and phone, and contact preference is only email or phone.
The home form is intentionally compact. It no longer asks for contact data, travel format, destination, audience, dates, group size or business interest on the first step. Those details belong to `/create-trip/`, consultation or later CRM handling.
The frontend infers `declared_role` for the CRM from `primary_interest`: create trip -> trip author, event -> event organizer, club -> community leader, business/presentation -> partner candidate, travel -> traveler.
After WEB-038, the old home membership/ambassador short form is removed. The same first-interest options now live in `/mira/` as first chat questions: Travel Advantage membership, MWR Life, Lifestyle Ambassador, partner model, events and presentation. The chat uses the auth gate, saves the pending question and then persists the conversation in CRM/AI history.
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
Footer links also expose official MWR Life, official Travel Advantage and official MWR Life Income Disclosure PDF.
Registration and lead consent text links to privacy/terms pages.
The legal pages are working informational pages and still require Project Owner / legal review before a broad public launch.
```

Typography correction state:

```text
Home hero uses a processed photo background with dark overlay and no rejected generated WebP files.
Desktop H1/H2/H3 scales are controlled by the fixed design system: large hero headline, clear section headings and compact card headings.
Hero and page-hero heights are kept dense for a premium landing-page proportion.
After WEB-024, the home hero is Travel Advantage membership-first and uses the turquoise accent for partner accompaniment.
The old short home advantages / benefits band must not be reintroduced on the home page.
TRAVELGTC-WEB-012 updated the base color tokens, Manrope font loading, radius system, button sizes, card shadows, hero overlay, section density and footer compactness against `049_travelgtc_design_system.md`.
TRAVELGTC-WEB-013 then reduced the home hero height/H1 scale, removed the duplicated lower funnel section and removed obsolete `path-summary` chips.
Follow-up correction: do not publish a visible "home page task" block. The home page must perform its task through CTA, page-to-process navigation and the authenticated lead form.
TRAVELGTC-WEB-014 simplified the home lead form into a compact first-contact request and removed the split form layout, public role buttons and duplicated format/detail fields.
```

Menu/footer/mobile state:

```text
Home page includes a clickable infographic-style menu for all public routes.
TRAVELGTC-WEB-008 moved this infographic menu from the lower home page to the upper page area directly after the hero and short benefits band.
The former body-level infographic menu was removed by TRAVELGTC-WEB-015. Do not reintroduce `.menu-infographic` on the home page.
Top navigation now carries compact labels for route orientation without a duplicated body section. On the WEB-024 home page these labels are product/company/membership/Ambassador/AI oriented.
Footer is compacted with smaller padding, smaller links and desktop disclaimer columns.
The public header brand uses `travelgtc-logo-header.webp`; do not reintroduce a separate text subtitle next to the logo.
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

AI consultant state:

```text
Mira TravelGTC is published in Azure Foundry as AI-TravelGTC version 10.
Runtime variable TRAVELGTC_AZURE_AI_AGENT_VERSION must remain 10 unless a newer approved version is published.
Canonical instruction: docs/travelgtc/080_travelgtc_ai_001_mira_consultant_instruction.md.
AI-004 report: docs/travelgtc/086_travelgtc_ai_004_membership_knowledge_and_azure_v10_report.md.
Membership knowledge enrichment lives in projects/travelgtc/app/src/modules/ai/membershipKnowledge.ts.
Public working RU document: https://travelgtc.com/assets/docs/MembershipBenefits-RU.pdf.
Official EN source: https://mwrlifecontent-pro.s3.amazonaws.com/PDF-and-other-files/MembershipBenefits-EN.pdf.
Mira should actively identify needs for Elite / Turbo / Ambassador scenarios, especially family, friends, groups, clients, retreats, yoga, qigong, wellness and community leaders.
Loyalty Points must be described as travel-value inside the program, not cash. 1 Loyalty Point may correspond to $1 travel-value only where the official booking flow allows redemption; do not invent universal redemption categories.
Home-page Mira chat now uses /api/travelgtc/v1/account/ai/chat and requires TravelGTC login before sending the first question.
The widget supports structured Markdown-like rendering, minimize/restore and desktop dragging.
Production AI chat questions and answers are stored in travelgtc_interactions under an automatically created/reused source_path=ai_chat lead for the authenticated user.
When an authenticated user reopens the widget, the frontend loads saved CRM chat history from /api/travelgtc/v1/account/ai/chat/history.
Before Azure answers a new account chat question, the backend passes the latest saved CRM turns as continuation context so Mira does not start a new dialogue.
Official TravelGTC referral registration link currently configured by default: https://www.mwrlife.com/KFilip909.
If a user writes that they want to subscribe/register/pay/join/get the link, the account AI chat marks purchase_intent=true, appends the referral link, raises the CRM lead to ready_to_subscribe, creates a high-priority purchase_intent task and sends an email notification.

Implemented after approval on 2026-07-28:

1. TRAVELGTC-WEB-029 dedicated Mira page is published in source as `/mira/`.
2. TRAVELGTC-WEB-030 added Travel Advantage access links in source:
   - VIP Membership: https://vip.traveladvantage.com/KFilip909
   - Free Guest Pass: https://free.traveladvantage.com/KFilip909
3. TRAVELGTC-AI-005 updated Mira context/fallback logic so Free Guest Pass / first-look intent is discovery and purchase intent remains separate.
4. TRAVELGTC-WEB-031 added guest access to the homepage `MWR Life, Travel Advantage и TravelGTC` block.
5. TRAVELGTC-WEB-032 corrected the naming after live link checks:
   - Free Guest Pass is the soft first-discovery link without credit card.
   - VIP Membership is the paid VIP membership path and must not be called a trial page.
   - Family/group/client/points/Elite/Turbo/Ambassador scenarios should trigger Membership comparison before sending only the VIP Membership link.

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
| 6.0 | 2026-07-28 | GTC IT / AI Assistant | Recorded the three-step Membership/Ambassador process section and public wording rule around Mira/support |
| 5.9 | 2026-07-28 | GTC IT / AI Assistant | Recorded removal of `/contacts/` and protected footer email/phone rendering |
| 5.8 | 2026-07-28 | GTC IT / AI Assistant | Recorded `/mira/` first-question selector as a scrollable chat-flow prompt that hides after the first question |
| 5.7 | 2026-07-28 | GTC IT / AI Assistant | Recorded Mira-first funnel: home short request form removed, first-question selection moved into `/mira/` |
| 5.6 | 2026-07-28 | GTC IT / AI Assistant | Refined Mira banner wording to `Ваш / Агент / Мира` and adjusted compact typography |
| 5.5 | 2026-07-28 | GTC IT / AI Assistant | Recorded compact Mira chat banner rule: no duplicated logo/text in chat header, avatar stays right-side in banner |
| 5.4 | 2026-07-28 | GTC IT / AI Assistant | Recorded approved Mira avatar asset and `/mira/` layout use |
| 5.3 | 2026-07-28 | GTC IT / AI Assistant | Recorded chat-only `/mira/` page and home-only Guest Pass / VIP explanation |
| 5.2 | 2026-07-28 | GTC IT / AI Assistant | Recorded simplified top navigation and single Mira route to the dedicated chat page |
| 5.1 | 2026-07-28 | GTC IT / AI Assistant | Recorded Membership access card layout fix and Playwright guard against vertical text collapse |
| 5.0 | 2026-07-28 | GTC IT / AI Assistant | Recorded interest-only home lead form and fixed `#lead-form` anchor offset |
| 4.9 | 2026-07-28 | GTC IT / AI Assistant | Recorded Free Guest Pass / VIP Membership terminology correction and Membership-comparison-first routing |
| 4.8 | 2026-07-28 | GTC IT / AI Assistant | Recorded guest access in the homepage relationship block and Mira Free Guest Pass / VIP Membership routing |
| 4.7 | 2026-07-28 | GTC IT / AI Assistant | Recorded implementation of `/mira/`, Travel Advantage access links and Mira first-look/purchase intent separation |
| 4.6 | 2026-07-28 | GTC IT / AI Assistant | Recorded draft approval tasks for dedicated Mira page, access links and official-document knowledge split |
| 4.5 | 2026-07-12 | GTC IT / AI Assistant | Recorded official referral URL and Mira purchase-intent flow with ready_to_subscribe CRM stage |
| 4.4 | 2026-07-12 | GTC IT / AI Assistant | Recorded Mira chat branded header, viewport correction, CRM history restore and Azure context continuation |
| 4.3 | 2026-07-12 | GTC IT / AI Assistant | Recorded authorized movable Mira chat, account AI endpoint and CRM interaction persistence |
| 4.2 | 2026-07-12 | GTC IT / AI Assistant | Recorded Mira Azure version 10, membership knowledge enrichment, public RU Membership Benefits document and Loyalty Points wording rule |
| 4.1 | 2026-07-10 | GTC IT / AI Assistant | Recorded favicon package publication and HTML head links |
| 4.0 | 2026-07-10 | GTC IT / AI Assistant | Recorded post-submit lead-form button change to a return-home action |
| 3.9 | 2026-07-10 | GTC IT / AI Assistant | Recorded approved TravelGTC logo usage in public headers and removal of the separate header subtitle |
| 3.8 | 2026-07-10 | GTC IT / AI Assistant | Recorded handwritten route CTA typography, route-format icons and route-map planning photo publication |
| 3.7 | 2026-07-10 | GTC IT / AI Assistant | Recorded one-line home opportunity gallery heading alignment |
| 3.6 | 2026-07-10 | GTC IT / AI Assistant | Recorded removal of home service labels, profile helper copy and standalone network-model section |
| 3.5 | 2026-07-10 | GTC IT / AI Assistant | Recorded duplicate contact CTA removal and repeated benefits band removal |
| 3.4 | 2026-07-10 | GTC IT / AI Assistant | Recorded the home opportunity gallery and compact route-creation CTA |
| 3.3 | 2026-07-09 | GTC IT / AI Assistant | Recorded removal of the visible home page process-declaration block and body-level menu infographic |
| 3.2 | 2026-07-09 | GTC IT / AI Assistant | Recorded registration-first contact handling and profile-derived lead contact payloads |
| 3.1 | 2026-07-09 | GTC IT / AI Assistant | Recorded compact first-contact home form and inferred CRM role mapping |
| 3.0 | 2026-07-09 | GTC IT / AI Assistant | Recorded the home page as a compact business-process entry point and removed duplicated funnel publication |
| 2.9 | 2026-07-09 | GTC IT / AI Assistant | Saved the canonical design system and recorded baseline design alignment against it |
| 2.8 | 2026-07-09 | GTC IT / AI Assistant | Recorded unique non-repeating page image assignment from the newer design/photo set |
| 2.7 | 2026-07-09 | GTC IT / AI Assistant | Recorded new production image set optimization and page bindings |
| 2.6 | 2026-07-09 | GTC IT / AI Assistant | Recorded processed reference images and photographic home hero alignment |
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
