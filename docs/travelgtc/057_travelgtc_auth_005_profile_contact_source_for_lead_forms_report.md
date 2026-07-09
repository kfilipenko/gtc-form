# TRAVELGTC-AUTH-005 - Profile Contact Source For Lead Forms Report

- Project: TravelGTC
- Code: TRAVELGTC-AUTH-005
- Date: 2026-07-09
- Status: Implemented

## 1. Summary

TravelGTC lead forms were moved to a profile-contact model.

Registration now collects the user's identity and contact data first. Public lead forms collect only the user's need, message and relevant trip/event context. The frontend builds the API lead payload contact fields from the authenticated user returned by `/api/travelgtc/v1/auth/me`.

## 2. Implemented Changes

Updated registration:

1. `projects/travelgtc/public/auth/index.html` now asks for email and required phone;
2. the registration contact preference is limited to `Email` and `Телефон`;
3. `projects/travelgtc/app/src/modules/auth/validation.ts` validates `primary_channel` as `email | phone` and requires `phone`.

Updated lead forms:

1. `projects/travelgtc/public/index.html` removed name, contact and channel fields from the home request form;
2. `projects/travelgtc/public/contacts/index.html` removed the old channel selector and contact input;
3. `projects/travelgtc/public/create-trip/index.html` removed name/contact/channel fields while keeping travel idea details;
4. consent text now references email/phone from the authenticated profile.

Updated frontend submission:

1. `projects/travelgtc/public/assets/js/site.js` now derives `name`, `preferred_channel` and `contact_value` from `authState.user` when those fields are absent from the form;
2. authenticated form notes now tell users that contacts are taken from the profile;
3. legacy disabled-lead message no longer points users to WhatsApp.

Updated public policy:

1. `projects/travelgtc/public/legal/privacy/index.html` now describes email/phone registration contacts and profile-based communication.

Updated tests:

1. `tests/travelgtc-funnel.spec.ts` no longer fills lead contact fields after registration;
2. `projects/travelgtc/app/tests/auth.test.ts` verifies required phone and restricted registration contact preference.

## 3. Verification

Local verification:

```bash
node --check projects/travelgtc/public/assets/js/site.js
npm run check:travelgtc-api
npm run test:travelgtc-api
npm run test:travelgtc
npm run test:travelgtc-funnel
```

Result:

```text
JS syntax check passed.
TravelGTC API: 2 files, 16 tests passed.
TravelGTC responsive: 17 passed.
TravelGTC funnel: 1 passed.
```

Live verification:

```bash
TRAVELGTC_BASE_URL=https://travelgtc.com npm run test:travelgtc
TRAVELGTC_FUNNEL_BASE_URL=https://travelgtc.com npm run test:travelgtc-funnel
```

Result:

```text
TravelGTC API service active after restart.
TravelGTC live responsive: 17 passed.
TravelGTC live funnel: 1 passed.
```
