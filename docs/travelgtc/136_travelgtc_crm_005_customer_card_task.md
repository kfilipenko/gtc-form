# TRAVELGTC-CRM-005 - Customer Card And Lead Relationship Workspace

- Project: TravelGTC
- Owner: GTC INFORMATION TECHNOLOGY FZ-LLC
- Date: 2026-08-05
- Status: Implemented
- Source: Project owner request after reviewing `/crm/`

## 1. Business Purpose

The existing CRM workspace is effective for processing a single application, but it does not yet provide a complete customer view. A team member must be able to open one customer card and see the registered profile, current relationship status, all applications, the conversation with Mira and internal work history before deciding on the next action.

The target operating model is:

```text
registered account
-> customer profile/contact
-> one or more leads/applications
-> CRM tasks, interactions and Mira dialogue
-> personal follow-up or official registration step
```

## 2. Current Context

1. `/crm/` is available only to authenticated TravelGTC `team` or `admin` users.
2. The current workspace lists leads and opens a lead-detail panel with contact, interest, role, request, current stage and interactions.
3. Registration already collects account identity, email and phone. Authorized Mira conversations are stored as CRM interactions against an automatically created or reused AI-chat lead.
4. One registered person can create several leads over time; therefore a lead is not the same thing as the person.

## 3. Scope

### 3.1 Customer Card

Create a protected CRM customer workspace and screen for one registered TravelGTC customer:

```text
/crm/customers/?id=:contactId
```

The customer card must show:

1. full registered name;
2. email address and telephone number from the TravelGTC account profile;
3. registration date and current project roles, where appropriate for internal work;
4. customer-level status/relationship summary;
5. all leads/applications associated with this customer, including interest, role, source, current stage, creation date and a link to the specific lead;
6. latest activity and a chronological CRM timeline that includes Mira conversation turns, internal notes, stage changes and created tasks;
7. current open tasks and their next step;
8. internal notes/actions that are explicitly marked as team-only.

### 3.2 Lead Detail Relationship

Keep a lead as the unit for a specific request and funnel stage.

1. The current lead-detail panel must display a visible customer link, for example `Открыть карточку клиента`.
2. Selecting an application inside the customer card must open its existing CRM lead detail without losing the ability to return to the customer card.
3. Stage changes remain on the lead, not on the whole customer profile, because one person may simultaneously have a personal-travel interest and a separate Ambassador request.

### 3.3 Customer-Level Work Data

Add only the minimum customer-level CRM data needed for repeat work:

1. relationship status: `new`, `active`, `waiting_for_customer`, `consultation`, `official_step`, `closed`;
2. internal owner/assignee where supported by the current team model;
3. private customer note with author and timestamp;
4. audit entries for changes to customer status, owner and note.

No personal documents, payment details, external MWR Life account data or data from other GTC projects may be copied into TravelGTC.

### 3.4 Navigation And Usability

1. Add a `Клиенты` navigation item to the internal CRM header.
2. Add a customer list with search by name, email or telephone; it must show only the minimum list fields necessary for identification.
3. The CRM list should remain compact and useful for repeated work, with no oversized marketing blocks.
4. Mobile layouts must preserve access to the selected lead/customer without horizontal overflow.

### 3.5 API And Data Model

Implement protected team/admin API contracts, proposed shape:

```text
GET  /api/travelgtc/v1/crm/customers
GET  /api/travelgtc/v1/crm/customers/:contactId
PATCH /api/travelgtc/v1/crm/customers/:contactId
POST /api/travelgtc/v1/crm/customers/:contactId/notes
```

The response must be assembled from the existing TravelGTC account/contact, leads, interactions and task records. Any migration must be additive, documented and reversible by a forward migration; do not duplicate registration credentials or create a second user base.

## 4. Access And Privacy Rules

1. Only `team` and `admin` roles may access customer lists, profiles, contacts, notes and interaction history.
2. Customer detail URLs must be protected server-side; hiding links in the browser is not sufficient.
3. A normal authenticated visitor must not discover or load another user’s profile through an identifier change.
4. The public site continues to direct contact through Mira and does not expose the project owner’s contact details.
5. Email notification on an explicit registration/subscription intention remains private and continues to use the server-side SMTP recipient.

## 5. Out Of Scope

1. CRM access for ordinary TravelGTC users.
2. Sharing users, documents or personal data with CrewPortGlobal or another GTC project.
3. Payment processing, MWR Life account synchronization or referral-link API integration.
4. Bulk email, outbound campaign automation, lead scoring or a general-purpose CRM replacement.
5. Replacing the existing Mira chat/history mechanism.

## 6. Acceptance Criteria

1. A team/admin user can open a customer card from a CRM lead.
2. The card displays complete TravelGTC registration contacts, customer status and all associated leads.
3. The timeline combines relevant customer/lead activity without exposing another user’s data.
4. A team/admin user can update the customer relationship status and add an internal note; changes have a timestamp and actor.
5. A normal authenticated user receives `403` from all customer CRM endpoints and cannot see CRM navigation.
6. Existing lead stage updates, Mira history, purchase-intent task creation and email notifications continue to work.
7. Desktop and mobile CRM layouts have no clipped controls or horizontal overflow.
8. Tests cover authorization, linked lead/customer retrieval, protected data isolation and the primary CRM navigation flow.

## 7. Verification Plan

1. TypeScript build and backend tests for CRM customer endpoints.
2. Authorization tests for anonymous, normal authenticated, `team` and `admin` accounts.
3. Playwright desktop/mobile checks for CRM list, customer card and lead-to-customer navigation.
4. Manual production smoke with the owner account after deployment.
5. `git diff --check`, documentation register update and focused commit.

## 8. Deliverables

1. Customer-card database migration, if required.
2. Protected CRM customer APIs.
3. CRM customer list/card UI and linked lead navigation.
4. Automated tests and implementation report.
5. Updated TravelGTC documentation register and project handoff memory.

## 9. Approval Requested

Approved and implemented on 2026-08-05. See
`137_travelgtc_crm_005_customer_card_report.md`.
