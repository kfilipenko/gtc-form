# TravelGTC - Project Memory Handoff

- Project: TravelGTC
- Project code: travelgtc
- Domain: travelgtc.com
- Owner: GTC INFORMATION TECHNOLOGY FZ-LLC
- Version: 1.1
- Date: 2026-07-09
- Status: Active, rejected generated images removed

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

Typography correction state:

```text
Home hero uses generated image as full-width background.
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

1. wait for recursive DNS caches to stop returning old Timeweb A/AAAA values;
2. run live HTTPS smoke checks without forced DNS;
3. Project Owner should visually approve or reject the generated production image set;
4. confirm production contact links for MAX, Telegram and email;
5. define privacy/consent and backend/CRM handling for forms.

## 4. Revision History

| Version | Date | Author | Changes |
|---|---|---|---|
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
