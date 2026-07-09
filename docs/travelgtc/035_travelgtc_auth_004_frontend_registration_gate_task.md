# TRAVELGTC-AUTH-004 - Frontend Registration Gate And Authenticated Lead Form

- Project: TravelGTC
- Owner: Project Owner
- Source instruction: separate TravelGTC registration from the declaration of user travel needs
- Depends on: `TRAVELGTC-AUTH-003 - Project-Local Registration Isolation`
- Document type: Task
- Version: 0.1
- Date: 2026-07-09
- Status: Implemented

## 1. Purpose

Build the public frontend gate that connects the TravelGTC website funnel to the project-local TravelGTC account system.

The accepted model:

```text
visitor reads site freely
visitor clicks submit on a need/idea form
system requires login or registration
registered TravelGTC user returns to the form
lead is created through the authenticated account endpoint
CRM can link role, need and next actions to this TravelGTC user
```

This keeps registration separate from the travel-idea form while still making the form an authenticated CRM event.

## 2. Business Reason

TravelGTC is moving from a static landing page to an owned funnel and future CRM.

The site must therefore stop treating serious lead submission as a purely anonymous action. A registered user gives the future CRM a stable anchor for:

1. declared role;
2. travel/community need;
3. consultation history;
4. project membership status;
5. future participation and recommendations;
6. future AI-assisted follow-up tasks.

At the same time, public content must remain accessible without registration so the user first understands the travel/community value.

## 3. Scope

Implement:

1. `/auth/` public page with TravelGTC registration and login forms;
2. account links in the top-right header on all public pages;
3. logged-in header state with user display name and logout;
4. frontend calls to:
   - `POST /api/travelgtc/v1/auth/register`;
   - `POST /api/travelgtc/v1/auth/login`;
   - `POST /api/travelgtc/v1/auth/logout`;
   - `GET /api/travelgtc/v1/auth/me`;
5. gate for all `data-travelgtc-lead-form` forms;
6. authenticated form submission to `POST /api/travelgtc/v1/account/leads`;
7. safe draft restoration for non-sensitive travel-idea fields after registration;
8. local browser e2e coverage for anonymous gate -> registration -> lead creation;
9. responsive coverage for `/auth/`.

## 4. Out Of Scope

This task does not include:

1. live API service deployment;
2. production database migration execution;
3. nginx `/api` proxy publication;
4. CRM screens;
5. email delivery provider setup;
6. password reset;
7. cross-project account linking;
8. importing users from CrewPortGlobal or any other project.

## 5. Implementation Requirements

The implementation must:

1. use only TravelGTC project-local auth endpoints;
2. avoid shared GTC/CrewPortGlobal registration logic;
3. show login/registration in the header;
4. require auth before lead submission;
5. keep reading public pages open to anonymous visitors;
6. keep contact/lead consent checkboxes on the lead form;
7. keep identity consent on the registration form;
8. use cookie credentials in browser API calls;
9. keep local/test lead capture on the authenticated switch:

```text
TRAVELGTC_ACCOUNT_LEAD_CAPTURE_ENABLED=true
TRAVELGTC_PUBLIC_LEAD_CAPTURE_ENABLED=false
```

## 6. Acceptance Criteria

The task is complete when:

1. `/auth/` exists and renders registration/login forms;
2. all public headers include auth controls;
3. anonymous form submission redirects to `/auth/?mode=register&next=...`;
4. registration creates a session and returns to the intended form;
5. logged-in lead submission uses `account/leads`;
6. Playwright funnel test passes;
7. responsive tests include `/auth/`;
8. API checks still pass;
9. documentation, memory and register are updated;
10. repository changes are committed.

## 7. Verification Plan

Run:

```bash
node --check projects/travelgtc/public/assets/js/site.js
bash -n projects/travelgtc/scripts/start_funnel_test_servers.sh
npm --prefix projects/travelgtc/app run build
npm run check:travelgtc-api
npm run test:travelgtc-funnel
npm run test:travelgtc
git diff --check
```

## 8. Revision History

| Version | Date | Author | Changes |
|---|---|---|---|
| 0.1 | 2026-07-09 | GTC IT / AI Assistant | Initial frontend registration gate task |
