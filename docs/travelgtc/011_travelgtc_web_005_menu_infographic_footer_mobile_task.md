# TRAVELGTC-WEB-005 - Menu Infographic, Compact Footer And Mobile Check

- Project: TravelGTC
- Owner: Project Owner
- Source instruction: Project Owner requested menu infographic according to the reference design, smaller footer and mobile adaptation check
- Document type: Task
- Version: 0.1
- Date: 2026-07-09
- Status: Implemented

## 1. Purpose

Improve the Travel Network Lab public site after the reference visual scale pass.

The requested changes are:

1. add an infographic-style menu similar to the approved visual reference;
2. reduce the visual weight and height of the footer;
3. check mobile adaptation for the updated layout.

## 2. Scope

This task includes:

1. replace the simple home "site map" block with a clickable infographic menu;
2. include routes for home, travel lifestyle, club, create trip, business model, events, about and contacts;
3. add responsive grid rules for desktop, tablet and mobile menu layouts;
4. reduce footer padding, link scale and disclaimer layout;
5. run source checks, deploy and live smoke checks.

## 3. Out Of Scope

This task does not include:

1. changing site copy strategy;
2. generating new images;
3. changing DNS, SSL or nginx publication logic;
4. adding backend form handling.

## 4. Acceptance Criteria

The task is complete when:

1. the home page has a clickable menu infographic;
2. the footer is visibly more compact across public pages;
3. responsive breakpoints cover desktop, tablet and mobile states;
4. source checks pass;
5. deployment passes;
6. HTTPS smoke checks pass;
7. repository changes are committed.

## 5. Verification Plan

```bash
node --check projects/travelgtc/public/assets/js/site.js
git diff --check
rg -n "menu-infographic|path-summary|disclaimers|@media" projects/travelgtc/public/assets/css/site.css projects/travelgtc/public/index.html
projects/travelgtc/scripts/deploy_public_live.sh
sudo nginx -t
curl --resolve travelgtc.com:443:20.91.187.79 https://travelgtc.com/
```

## 6. Revision History

| Version | Date | Author | Changes |
|---|---|---|---|
| 0.1 | 2026-07-09 | GTC IT / AI Assistant | Initial task |
