# TRAVELGTC-WEB-013 - Home Funnel Layout Correction Report

- Project: TravelGTC
- Code: TRAVELGTC-WEB-013
- Date: 2026-07-09
- Status: Implemented

## 1. Summary

The home page was corrected to act as one clear business-process entry point instead of repeating the participation funnel in multiple places.

The home page now answers one operational question:

```text
What is the visitor interested in, which role fits them, and should this become a CRM lead?
```

## 2. Implemented Changes

Updated `projects/travelgtc/public/index.html`:

1. added a compact hero process card titled `Задача главной`;
2. placed the full process only once in that card:
   `Интерес -> Роль -> Заявка -> Консультация -> Членство -> Участие -> Рекомендации`;
3. removed the duplicated lower `Воронка участия` section;
4. removed the repeated `path-summary` funnel chips under the infographic;
5. changed the infographic title to `Каждый раздел ведёт к следующему действию`;
6. relabeled infographic nodes by process role:
   interest/role, need, community, application, membership, participation, trust and consultation.

Updated `projects/travelgtc/public/assets/css/site.css`:

1. reduced header height and button height;
2. reduced hero height and hero vertical padding;
3. reduced desktop H1 scale and widened its text area so it no longer breaks into too many lines;
4. added styling for the compact hero process card;
5. reduced section density and upper infographic spacing;
6. removed obsolete `path-summary` styles;
7. adjusted tablet and mobile hero layout.

## 3. Verification

Local verification:

```bash
node --check projects/travelgtc/public/assets/js/site.js
npm run test:travelgtc
```

Result:

```text
17 passed
```

Visual review:

```text
projects/travelgtc/test-artifacts/screenshots/travelgtc-home-desktop.png
projects/travelgtc/test-artifacts/screenshots/travelgtc-home-mobile.png
```

Reviewed focus:

1. the hero headline no longer occupies the whole viewport;
2. the hero contains the single business-process representation;
3. the lower duplicated funnel section is gone;
4. the infographic is now page-to-process navigation;
5. the authenticated lead form remains the main conversion point;
6. desktop and mobile pages have no horizontal overflow.

## 4. Publication

Published through:

```bash
projects/travelgtc/scripts/deploy_public_live.sh
```

Live verification:

```bash
TRAVELGTC_BASE_URL=https://travelgtc.com npm run test:travelgtc
```

Result:

```text
17 passed
```
