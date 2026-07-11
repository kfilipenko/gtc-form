# TRAVELGTC-WEB-025 - Company Facts And Service Pictograms Task

- Project: TravelGTC
- Code: TRAVELGTC-WEB-025
- Date: 2026-07-11
- Status: Approved for implementation

## 1. Context

The TravelGTC home page has been repositioned as a partner information page for Travel Advantage membership and MWR Life / Lifestyle Ambassador explanation.

The current home page still uses numeric badges in service and process cards. This makes the page feel like an internal numbered list rather than a polished product funnel.

The Project Owner requested:

1. replace numbers in service-list style blocks with suitable emoji or pictograms;
2. add a company information block to the home page;
3. use official MWR Life information for company scale and office addresses;
4. keep the page compliant and clear that TravelGTC is not the official company website.

## 2. Official Source

Primary source for this task:

```text
https://www.mwrlife.com/home/company
```

Facts permitted on the public page:

1. `10 Years in business`;
2. `+300K Members globally`;
3. `+150 Countries Served`;
4. `10 Languages Supported`;
5. office addresses shown on the official MWR Life company page.

The public page must say that users should verify current company data, legal details, pricing, membership conditions and regional availability on official resources before registration, payment, booking or participation.

## 3. Required Public Changes

### 3.1 Company Block

Add a compact home-page section after the relationship block and before the Travel Advantage membership categories.

Required content:

1. headline explaining MWR Life official company facts;
2. four metric cards:
   - `10 лет`;
   - `300K+`;
   - `150+`;
   - `10`;
3. official address cards for:
   - Hong Kong;
   - United States;
   - France;
   - Dubai;
4. note that the data comes from the official MWR Life company page and must be verified before formal action.

### 3.2 Pictogram Replacement

Replace numeric badges in the following home-page blocks:

1. Travel Advantage service categories;
2. trust / compliance cards;
3. next-step process cards.

Preferred approach:

1. use simple readable emoji/pictogram badges;
2. avoid returning to `01`, `02`, `03` style labels in these blocks;
3. keep visual density compact and consistent with the current design system.

## 4. Acceptance Criteria

1. Home page contains the official company facts block.
2. The block includes the official scale metrics and office address cards.
3. Service, trust and process cards no longer show numbered badges.
4. Desktop, tablet and mobile layouts have no horizontal overflow.
5. Responsive Playwright test checks the new company block and absence of numeric badges.
6. Static site is deployed to `https://travelgtc.com/`.
