# TRAVELGTC-WEB-018 - Home Network Copy Cleanup Report

- Project: TravelGTC
- Code: TRAVELGTC-WEB-018
- Date: 2026-07-09
- Status: Implemented

## 1. Summary

The home page was tightened by removing service labels above the gallery and form, and by removing the standalone network-model explanation block.

The home page now keeps the visitor flow focused on travel desire, route creation and a short request form. Network-model discussion is left for later pages.

## 2. Implemented Changes

Updated `projects/travelgtc/public/index.html`:

1. removed `Новые возможности`;
2. removed `Короткий запрос`;
3. removed the form helper text about selecting a need and using profile contacts;
4. removed the full `Современная сеть` / `Сеть - это не давление. Сеть - это доверие.` section from the home page.

Updated `projects/travelgtc/public/assets/css/site.css`:

1. removed obsolete CSS for the deleted opportunity eyebrow;
2. tightened the form heading spacing after removing the helper text.

Updated `tests/travelgtc-responsive.spec.ts`:

1. added assertions that the removed labels and network heading are absent;
2. added an assertion that the home page has no direct `main > section.navy` block;
3. kept checks for the opportunity gallery, route CTA, form and footer.

## 3. Verification

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

1. gallery starts without the `Новые возможности` label;
2. form starts with `Расскажите, что вам нужно` without helper copy;
3. the network section is gone;
4. the page remains compact on mobile and desktop.

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
TravelGTC live responsive: 17 passed.
TravelGTC live funnel: 1 passed.
```
