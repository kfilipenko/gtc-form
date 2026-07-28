# TRAVELGTC-WEB-033 - Home Lead Form Interest-Only Report

- Project: TravelGTC
- Code: TRAVELGTC-WEB-033
- Date: 2026-07-28
- Status: Implemented and published
- Scope: Home page lead form, shared frontend lead payload builder, responsive tests

## 1. Reason

The home page lead form asked users to enter a free-form request. This created a mismatch: free-form questions are now handled by Mira AI chat, while the home lead form should create a clean CRM request based on the selected interest and authenticated profile contact data.

## 2. Change

The home lead form now collects only:

1. selected interest;
2. required privacy consent;
3. required communication consent.

The free-form request textarea was removed from the home page form.

The `Задать вопрос` select option was removed from the home form because questions should go to Mira AI chat, where the text is processed, stored in CRM history and used as dialogue context.

## 3. CRM Payload

The frontend still sends the required API `message` field, but it is generated from the selected interest:

```text
Интерес: <selected interest>.
```

This keeps the backend contract stable without showing a misleading unprocessed input field to the user.

## 4. Anchor Layout

The home `#lead-form` section now has a scroll offset so the section title is not hidden under the fixed header when the user follows the `Узнать о членстве` CTA.

## 5. Verification

Verification scope:

```text
npm run test:travelgtc-api
npm --prefix projects/travelgtc/app run build
npm run test:travelgtc
npm run test:travelgtc-funnel
git diff --check
```

Live smoke checks passed:

```text
https://travelgtc.com/ no longer contains the home `name="message"` field or the `option value="question"` home lead option.
https://travelgtc.com/assets/css/site.css contains the `#lead-form` scroll offset.
https://travelgtc.com/api/travelgtc/v1/health returns ok.
```
