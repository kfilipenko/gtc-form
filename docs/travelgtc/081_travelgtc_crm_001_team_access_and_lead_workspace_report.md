# TRAVELGTC-CRM-001 - Team Access And Lead Workspace Report

- Project: TravelGTC
- Code: TRAVELGTC-CRM-001
- Date: 2026-07-11
- Status: Implemented

## 1. Purpose

TravelGTC lead requests must not disappear into a hidden database table. The project needs a controlled CRM access layer where the TravelGTC team can view and process incoming requests.

## 2. Access Model

CRM access is project-local and does not use CrewPortGlobal data.

Access is granted through TravelGTC identity roles:

| Area | Value |
|---|---|
| Project code | `travelgtc` |
| Team role | `team` |
| Admin role | `admin` |
| Current team user | `kfilipenko@kmf.ru` |

The user `kfilipenko@kmf.ru` has been added to:

1. `travelgtc_identity.user_project_memberships` with `membership_status = 'team'`;
2. `travelgtc_identity.user_project_roles` with `role_code = 'team'`.

## 3. CRM Workspace

The first internal CRM page is available at:

```text
https://travelgtc.com/crm/
```

The page requires an authenticated TravelGTC account with the `team` or `admin` role.

Available first-stage actions:

1. view latest lead requests;
2. open a lead card;
3. see contact data from the registered user profile;
4. see request text and recommended next step;
5. change CRM stage;
6. add an internal note.

## 4. API Routes

| Route | Purpose | Access |
|---|---|---|
| `GET /api/travelgtc/v1/crm/leads` | List latest leads. | `team` / `admin` |
| `GET /api/travelgtc/v1/crm/leads/:leadId` | View one lead with interactions. | `team` / `admin` |
| `PATCH /api/travelgtc/v1/crm/leads/:leadId` | Update lead stage. | `team` / `admin` |
| `POST /api/travelgtc/v1/crm/leads/:leadId/interactions` | Add internal note. | `team` / `admin` |

Unauthenticated or unauthorized access returns:

```json
{
  "ok": false,
  "error": {
    "code": "crm_access_denied",
    "message": "CRM access requires TravelGTC team membership."
  }
}
```

## 5. Lead Storage Reality

At this stage, submitted forms are stored in the TravelGTC CRM database tables:

1. `travelgtc_contacts`;
2. `travelgtc_leads`;
3. `travelgtc_travel_ideas`;
4. `travelgtc_interactions`;
5. `travelgtc_tasks`;
6. `travelgtc_agent_runs`.

Email notification to `kfilipenko@kmf.ru` is not yet implemented and should be handled as the next operational stage.

## 6. Verification

Implemented checks:

1. API build and tests: `17 passed`;
2. public CRM page returns HTTP `200`;
3. CRM API without a team session returns HTTP `403`;
4. TravelGTC API health remains active after deployment.

