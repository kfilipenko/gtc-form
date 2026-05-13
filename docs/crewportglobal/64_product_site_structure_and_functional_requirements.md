# CrewPortGlobal — Product Site Structure and Functional Requirements

- Project: CrewPortGlobal.com
- Company: GTC INFORMATION TECHNOLOGY FZ-LLC
- Stage: Stage 1
- Document type: Product governance and functional requirements baseline
- Status: Active implementation guidance
- Version: 0.1
- Effective date: 2026-05-13
- Related issues:
  - GitHub issue #9 — CPG-PRODUCT-001
  - GitHub issue #8 — CPG-BE-001

## 1. Purpose

This document is the single controlling product-logic reference for CrewPortGlobal public and functional site structure.

Its purpose is to keep the team aligned on service-first delivery and prevent regression into declaration-first pages that do not move users through practical workflows.

## 2. Governing product principle

CrewPortGlobal must be built as a practical maritime jobs and crew platform. Public pages must lead users to useful actions first: find vacancies, create a seafarer profile, prepare a vacancy request, register an employer, register vessels and continue through controlled human-reviewed workflows. Legal and trust documents support the service but must not dominate the main user journey.

## 3. Scope and priority boundary

This task must not stop or replace issue #8.

Database and backend implementation remain the primary execution priority. Product-document updates are a control layer to keep implementation aligned with real market workflows.

## 4. Required site structure and functional intent

The following surfaces are mandatory in the product model and must be connected to practical user actions.

### 4.1 Home

Primary intent:

1. Route users to the first useful action with minimal friction.

Required primary actions:

1. Find vacancies.
2. Create seafarer profile.
3. Prepare vacancy request.
4. Register employer/company.

### 4.2 Vacancies

Primary intent:

1. Show real vacancy records from approved workflow output.

Required behavior:

1. No fake vacancies.
2. Vacancy cards must reflect real data model fields.
3. CTA must route to Vacancy Details or applicable registration path.

### 4.3 Vacancy Details

Primary intent:

1. Show one real vacancy record and next valid action.

Required behavior:

1. Display data from approved vacancy workflow state.
2. Route unauthenticated users to Login/Register or profile creation when needed.

### 4.4 Create Seafarer Profile

Primary intent:

1. Capture seafarer registration draft fields and submit into backend draft workflow.

Required behavior:

1. Form submits to backend API.
2. Draft state saved in DB.
3. Human-review status visible after submit.

### 4.5 Seafarer Profile Account Area

Primary intent:

1. Allow seafarer to continue and update own profile draft through controlled status gates.

Required behavior:

1. Read/update own profile draft.
2. Show workflow status and required next actions.

### 4.6 For Seafarers

Primary intent:

1. Explain practical value and route to profile creation and vacancies.

Required behavior:

1. Action-first CTAs.
2. Legal text is supporting content only.

### 4.7 For Employers

Primary intent:

1. Explain practical value and route to employer/company and vessel workflows.

Required behavior:

1. Action-first CTAs.
2. Access to vacancy request preparation and company onboarding.

### 4.8 Employer / Company Registration

Primary intent:

1. Capture employer/company draft registration and create organization context.

Required behavior:

1. Save employer/company draft in DB.
2. Link operator-visible workflow status.

### 4.9 Vessel Registration

Primary intent:

1. Register vessels under employer/company context.

Required behavior:

1. Save vessel draft against company.
2. Keep data quality checks (for example IMO format) enforced by backend and DB constraints.

### 4.10 Employer Directory

Primary intent:

1. Provide a controlled list of verified or review-approved employers according to workflow policy.

Required behavior:

1. No unapproved records published as trusted directory entries.

### 4.11 Login / Register

Primary intent:

1. Provide account access and identity continuity for draft workflows.

Required behavior:

1. Connect to user identity model.
2. Preserve role-based paths and account continuity.

### 4.12 Trust & Safety

Primary intent:

1. Support platform trust with clear rules and reporting paths.

Required behavior:

1. Must support user journey but not block action-first routing.

### 4.13 Legal

Primary intent:

1. Provide legal baseline and user rights documentation.

Required behavior:

1. Legal content supports platform operations and compliance.
2. Legal section must not dominate navigation over core functional actions.

### 4.14 Contact / Support

Primary intent:

1. Provide practical support channel for users in workflow states.

Required behavior:

1. Route issues into support and operator processes.

## 5. Data model binding to issue #8 foundation

Site functionality must stay bound to the implemented registration foundation tables.

### 5.1 Core binding map

1. users:
   - account root for all registration participants.
2. user_auth_identities:
   - external and internal identity linkage.
3. user_roles:
   - role routing (seafarer, employer, shipowner, crewing manager).
4. seafarer_profiles:
   - seafarer profile draft and review fields.
5. employer_companies:
   - employer/company registration entity.
6. company_users:
   - mapping of users to companies and contact roles.
7. vessels:
   - vessel records attached to company context.
8. registration_audit_events:
   - immutable workflow event trail for reviewability and controls.

### 5.2 Mandatory rule

Public and account workflows must use these tables as the functional source for registration journey state. The site must not drift into disconnected static declarations where no workflow state is persisted.

## 6. Fixed implementation order (service first, content after)

Execution order for this stage is fixed:

1. database foundation for users, seafarers, employers and vessels;
2. backend API for draft registration creation;
3. connect Register/Create Profile/Post Vacancy forms to backend;
4. save seafarer profile drafts;
5. save employer/company drafts;
6. save vessel drafts;
7. create operator review queue;
8. show real vacancy records only after real data model and workflow are approved;
9. improve public UI after functional paths work;
10. publish updated documentation after implementation results are verified.

## 7. Product guardrails for all future changes

1. Action-first pages are mandatory.
2. Functional workflow paths are mandatory before cosmetic public expansion.
3. Legal and trust pages are supporting layers, not the primary product destination.
4. No fake records in vacancies, employers or vessel-related user journeys.
5. Human-reviewed workflow gates must remain explicit.

## 8. Out of scope for this document

1. This document does not replace backend implementation tasks.
2. This document does not authorize skipping database/API integration.
3. This document does not change deployment, nginx, Stripe or OpenClaw boundaries.

## 9. Revision history

| Version | Date | Author | Changes |
| --- | --- | --- | --- |
| 0.1 | 2026-05-13 | GTC IT / AI Assistant | Initial controlling product logic baseline for practical maritime platform structure, functional intent, DB-table binding and fixed service-first execution order |
