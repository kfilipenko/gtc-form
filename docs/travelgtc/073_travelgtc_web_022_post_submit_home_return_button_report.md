# TRAVELGTC-WEB-022 - Post Submit Home Return Button Report

- Project: TravelGTC
- Code: TRAVELGTC-WEB-022
- Date: 2026-07-10
- Status: Implemented

## 1. Summary

The shared TravelGTC lead-form success behavior was updated.

After a successful request submission, the button now changes from the original submit action to:

```text
Вернуться на главную
```

Clicking it returns the user to `/` instead of submitting another lead.

## 2. Implemented Changes

Updated `projects/travelgtc/public/assets/js/site.js`:

1. added a post-success button state for TravelGTC lead forms;
2. changed the button text to `Вернуться на главную`;
3. changed the button type to `button` after successful submission;
4. added click handling for the post-success home-return action.

Updated `tests/travelgtc-funnel.spec.ts`:

1. verified that the status includes the lead number after submission;
2. verified that the button text changes to `Вернуться на главную`;
3. verified that clicking it navigates back to the site root.

## 3. Verification

Local verification:

```bash
npm run test:travelgtc-funnel
npm run test:travelgtc
```

Result:

```text
TravelGTC funnel: 1 passed.
TravelGTC responsive: 17 passed.
```

Published through:

```bash
projects/travelgtc/scripts/deploy_public_live.sh
```

Live verification:

```bash
TRAVELGTC_FUNNEL_BASE_URL=https://travelgtc.com npm run test:travelgtc-funnel
TRAVELGTC_BASE_URL=https://travelgtc.com npm run test:travelgtc
```

Result:

```text
TravelGTC live funnel: 1 passed.
TravelGTC live responsive: 17 passed.
```
