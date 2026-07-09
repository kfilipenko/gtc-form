# TRAVELGTC-WEB-016 - Home Opportunity Gallery And Route CTA Report

- Project: TravelGTC
- Code: TRAVELGTC-WEB-016
- Date: 2026-07-09
- Status: Implemented

## 1. Summary

The home page now contains an image-led opportunity block that attracts attention and presents TravelGTC as a modern travel club with routes, events, recovery, community and remote-work possibilities.

The block performs the interest stage of the funnel and moves the visitor to a concrete action: create a travel idea.

## 2. Implemented Changes

Updated `projects/travelgtc/public/index.html`:

1. replaced the previous text/card `Путешествия - это больше, чем отдых` section with a five-image gallery;
2. added short visual calls to action:
   - `Посещайте удивительные места`;
   - `Участвуйте в интересных событиях`;
   - `Восстанавливайтесь и развивайтесь`;
   - `Объединяйте друзей и сообщества`;
   - `Работайте из любой точки мира`;
3. added the `Создавайте свои маршруты` block with route formats and CTA buttons;
4. linked the main route CTA to the authenticated lead form.

Updated `projects/travelgtc/public/assets/css/site.css`:

1. added `travel-opportunities`, `opportunity-gallery`, `opportunity-card`, `route-promo`, `route-options` and route visual styles;
2. added desktop/tablet/mobile responsive rules;
3. kept the layout compact and image-led according to the TravelGTC design system.

Updated `tests/travelgtc-responsive.spec.ts`:

1. added assertions for `.opportunity-gallery`;
2. added an assertion that the home page has five `.opportunity-card` items;
3. added an assertion for `.route-promo`;
4. kept the guard that `.menu-infographic` remains absent.

## 3. Images Used

The block uses existing approved processed assets:

```text
travelgtc-bay-view.webp
travelgtc-events-night-dinner.webp
travelgtc-coast-lounge-sunset.webp
travelgtc-hero-group-sunset.webp
travelgtc-business-dubai-planning.webp
travelgtc-lifestyle-mountain-community.webp
```

## 4. Verification

Local verification:

```bash
npm run test:travelgtc
npm run test:travelgtc-funnel
```

Result:

```text
TravelGTC responsive: 17 passed.
TravelGTC funnel: 1 passed.
```

Visual review:

```text
projects/travelgtc/test-artifacts/screenshots/travelgtc-home-desktop.png
projects/travelgtc/test-artifacts/screenshots/travelgtc-home-mobile.png
```

Reviewed focus:

1. gallery proportions match the approved reference direction;
2. route CTA is visible and compact;
3. mobile page has no horizontal overflow;
4. old process-declaration/menu infographic block is not present.

## 5. Publication

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
TravelGTC live responsive: 17 passed.
TravelGTC live funnel: 1 passed.
```
