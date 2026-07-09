# TravelGTC - Project Memory Handoff

- Project: TravelGTC
- Project code: travelgtc
- Domain: travelgtc.com
- Owner: GTC INFORMATION TECHNOLOGY FZ-LLC
- Version: 1.5
- Date: 2026-07-09
- Status: Active, implementation readiness fixed

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
```

Server-side publication is prepared:

```text
Live root: /var/www/travelgtc.com
Nginx source template: projects/travelgtc/deploy/nginx/travelgtc.com.conf
Nginx installed config: /etc/nginx/sites-available/travelgtc.com.conf
Deploy script: projects/travelgtc/scripts/deploy_public_live.sh
```

Current blocker for public domain:

```text
Authoritative Timeweb DNS points to 20.91.187.79.
Some public recursive DNS caches may temporarily keep old Timeweb A/AAAA records.
SSL is issued for travelgtc.com and www.travelgtc.com.
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

1. start `TRAVELGTC-API-001 - Lead Capture API And Database Schema`;
2. use `022_travelgtc_roadmap_001_site_crm_business_process_mapping_spec.md` as the routing map for public pages, CRM records, API events and AI agent triggers;
3. use `024_travelgtc_prep_001_implementation_readiness_checklist_spec.md` as the readiness gate for stack, source layout, env variables, parent-network boundaries and production blockers;
4. implement the first PostgreSQL tables from `020_travelgtc_biz_001_funnel_crm_mvp_requirements_spec.md`;
5. implement `POST /api/travelgtc/v1/public/leads`;
6. add validation, consent recording, idempotency and audit logging;
7. queue or stub the Intake Agent run for new leads;
8. then implement `TRAVELGTC-WEB-007 - Public Funnel Role Selector And Form`;
9. keep production personal-data collection disabled until privacy/consent pages are approved.

## 4. Revision History

| Version | Date | Author | Changes |
|---|---|---|---|
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
