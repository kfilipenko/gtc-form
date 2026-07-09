# TRAVELGTC-WEB-014 - Compact Lead Request Form Task

- Project: TravelGTC
- Code: TRAVELGTC-WEB-014
- Date: 2026-07-09
- Status: Implemented

## 1. Context

The Project Owner reviewed the live home page form and identified that the first request step had become too heavy.

Specific issues:

1. the public form collected too many details for a first contact;
2. the participation format appeared twice: as role buttons and as form fields;
3. some visual buttons felt non-functional rather than necessary;
4. the form lived in a split block that left unused space beside it;
5. the first step should collect contact details and the user's need, not behave like a full CRM intake questionnaire.

## 2. Business Requirement

The home page request form must support the first business-process step only:

```text
interest -> short authenticated request -> CRM lead -> consultation
```

Detailed travel format, audience, dates, group size and business-model clarification should be handled during consultation and later CRM stages.

## 3. Scope

In scope:

1. replace the split home form block with one compact centered request block;
2. remove public role selector buttons from the home form;
3. remove duplicated travel-format and audience detail fields from the home form;
4. keep only minimum visible fields: name, contact, channel, need and short message;
5. shorten consent and authentication helper text while preserving legal links;
6. keep authenticated submission through the existing TravelGTC account lead API;
7. infer the CRM role from the selected need so the business process still receives structured data;
8. update Playwright funnel tests for the new compact form.

Out of scope:

1. removing detailed fields from `/create-trip/`, where a fuller route idea form may remain appropriate;
2. changing the backend lead schema;
3. changing registration/login logic;
4. changing CRM database tables.

## 4. Acceptance Criteria

The task is complete when:

1. the home form is compact and no longer appears inside a split layout;
2. the form does not show repeated participation-format controls;
3. the visible form asks only for contact data and need/message;
4. authenticated lead submission still creates a CRM lead;
5. desktop and mobile checks pass;
6. the change is documented, deployed and committed.
