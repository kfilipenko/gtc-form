# TRAVELGTC-WEB-014 - Compact Lead Request Form Report

- Project: TravelGTC
- Code: TRAVELGTC-WEB-014
- Date: 2026-07-09
- Status: Implemented

## 1. Summary

The home page request form was simplified from a large role/travel-detail intake into a compact first-contact form.

The first step now asks:

```text
Who are you, how can we contact you, and what do you need?
```

The CRM still receives structured role information, but the role is inferred from the selected need instead of asking the visitor to fill a separate role selector.

## 2. Implemented Changes

Updated `projects/travelgtc/public/index.html`:

1. replaced the split `funnel-split` request section with one centered `compact-request` block;
2. removed the left guide column that created empty space beside the form;
3. removed the visible role selector buttons from the home form;
4. removed home-form fields for travel format, destination, audience, dates, group size and business interest;
5. kept only name, contact, preferred channel, need and short request message;
6. shortened the consent text while preserving links to privacy and terms.

Updated `projects/travelgtc/public/assets/css/site.css`:

1. added compact request/form styles;
2. reduced form padding, label scale, textarea height, consent spacing and status spacing;
3. kept the layout responsive without introducing a side column.

Updated `projects/travelgtc/public/assets/js/site.js`:

1. shortened the authenticated-form helper note;
2. added inferred CRM role mapping from selected need:
   `create_trip -> trip_author`, `event -> event_organizer`, `club -> community_leader`, `business_model/presentation -> partner_candidate`, `travel -> traveler`;
3. preserved existing authenticated submission to `POST /api/travelgtc/v1/account/leads`.

Updated `tests/travelgtc-funnel.spec.ts`:

1. changed the funnel test from old role-button interaction to the compact need selector;
2. kept verification that anonymous users must register before creating a lead;
3. kept verification that a successful authenticated submission returns a lead number.

## 3. Verification

Local verification:

```bash
node --check projects/travelgtc/public/assets/js/site.js
npm run test:travelgtc
npm run test:travelgtc-funnel
```

Result:

```text
17 passed
1 passed
```

Visual review:

```text
projects/travelgtc/test-artifacts/screenshots/travelgtc-home-desktop.png
projects/travelgtc/test-artifacts/screenshots/travelgtc-home-mobile.png
```

Reviewed focus:

1. the form is one compact block;
2. no duplicated participation-format controls are visible;
3. the request section has no empty adjacent column;
4. the mobile layout fits the viewport;
5. the form still redirects anonymous visitors to registration and submits after authentication.

## 4. Publication

Published through:

```bash
projects/travelgtc/scripts/deploy_public_live.sh
```

Live verification:

```bash
TRAVELGTC_BASE_URL=https://travelgtc.com npm run test:travelgtc
TRAVELGTC_FUNNEL_BASE_URL=https://travelgtc.com npm run test:travelgtc-funnel
```

Result:

```text
17 passed
1 passed
```
