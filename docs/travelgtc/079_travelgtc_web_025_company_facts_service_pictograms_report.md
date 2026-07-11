# TRAVELGTC-WEB-025 - Company Facts And Service Pictograms Report

- Project: TravelGTC
- Code: TRAVELGTC-WEB-025
- Source task: `docs/travelgtc/078_travelgtc_web_025_company_facts_service_pictograms_task.md`
- Date: 2026-07-11
- Status: Implemented and published

## 1. Summary

The TravelGTC home page was updated to make the Travel Advantage / MWR Life positioning more concrete and less list-like.

The page now includes an official company facts block and uses pictograms instead of numeric badges in the service, trust and next-step process blocks.

## 2. Implemented Changes

### 2.1 Official Company Facts Block

Updated:

```text
projects/travelgtc/public/index.html
projects/travelgtc/public/assets/css/site.css
```

Added a new home-page section:

```text
MWR Life в цифрах и официальных адресах
```

The block includes:

1. `10 лет` in business;
2. `300K+` global members;
3. `150+` countries served;
4. `10` supported languages.

The block also includes office address cards for:

1. Hong Kong;
2. United States;
3. France;
4. Dubai.

The text clearly says that TravelGTC is a partner information page and that current legal, membership, pricing and regional details must be verified on official resources.

### 2.2 Service Pictograms

Replaced Travel Advantage service numbers with pictogram badges:

1. hotels;
2. flights;
3. resorts;
4. car rental;
5. cruises;
6. excursions;
7. activities;
8. transfers;
9. travel credits;
10. member support.

### 2.3 Trust And Process Pictograms

Replaced numbered badges in:

1. the trust / compliance cards;
2. the next-step process cards.

The process remains:

```text
AI question -> interest choice -> login/registration -> lead -> consultation -> official next step
```

Only the visual markers changed.

### 2.4 Responsive Styling

Added responsive CSS for:

1. four-column company metrics and address cards on desktop;
2. two-column layout on tablet;
3. single-column layout on mobile;
4. consistent emoji/pictogram badge rendering.

### 2.5 Tests

Updated:

```text
tests/travelgtc-responsive.spec.ts
```

The responsive test now checks:

1. company facts block visibility;
2. metric cards count;
3. selected official address text;
4. absence of `01` / `02` style numeric badges in service, trust and process markers.

## 3. Official Source

The company facts and address block is based on the official MWR Life company page:

```text
https://www.mwrlife.com/home/company
```

## 4. Publication

Static publication:

```text
projects/travelgtc/scripts/deploy_public_live.sh
```

Live domain:

```text
https://travelgtc.com/
```

## 5. Verification

Local:

```text
npm run test:travelgtc
Result: 19 passed
```

Live:

```text
TRAVELGTC_BASE_URL=https://travelgtc.com npm run test:travelgtc
Result: 19 passed

TRAVELGTC_FUNNEL_BASE_URL=https://travelgtc.com npm run test:travelgtc-funnel
Result: 1 passed
```
