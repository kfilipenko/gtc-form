# CrewPortGlobal — Access Control and Admin Console Plan

- Project: CrewPortGlobal.com
- Company: GTC INFORMATION TECHNOLOGY FZ-LLC
- Document code: CPG-ACCESS-001
- Document type: Final architecture and implementation plan
- Version: 1.0
- Status: Final draft for project-owner approval
- Date: 2026-05-15
- Registration status: Registered in `00_documentation_register.md` version 0.66

## 1. Purpose

This document defines the target access-control structure for the CrewPortGlobal application.

It describes how external users, internal operators, administrators and the project owner should receive access through groups, roles, permissions and scoped backend checks.

The purpose is to replace the current temporary operator-token model with a controlled application-level access system.

The target model is:

```text
User
  -> Group membership
    -> Group roles
      -> Role permissions
        -> Scoped access to pages, API routes, actions and data records
```

This document is a planning and implementation-control document. It does not authorize immediate production database changes, server configuration changes or deployment without separate project-owner approval.

## 2. Current status

### 2.1 What already exists

The CrewPortGlobal application already has:

1. public application pages;
2. public document pages;
3. registration and draft-profile workflows;
4. seafarer profile draft handling;
5. employer/company/vessel/vacancy draft handling;
6. public vacancy board and vacancy detail pages;
7. operator review page `/verify/`;
8. temporary operator-token protection for operator API routes;
9. operator role lanes in the UI;
10. operator review audit events for review actions.

### 2.2 Current limitation

The current operator-token protection is a temporary boundary.

It does not provide:

1. named operator accounts;
2. personal login for operators;
3. role-based backend permissions;
4. user-to-group assignments;
5. permission scopes;
6. administrative role-management UI;
7. reliable audit attribution to a named operator;
8. separation between Platform Administrator and business decision roles.

### 2.3 Target correction

CrewPortGlobal must move from:

```text
one shared operator token -> access to operator surface
```

to:

```text
authenticated user session -> group membership -> roles -> permissions -> scope check -> audit event
```

## 3. Access-control principles

### 3.1 Application rights are not server rights

Server-level rights control Linux, nginx, PHP-FPM, PostgreSQL and files.

Application-level rights control who may see or change business objects inside CrewPortGlobal.

This document governs application-level rights only.

### 3.2 Backend enforcement is mandatory

Hiding a button in the frontend is not enough.

Every protected API route must check:

1. current authenticated user;
2. active account state;
3. group membership;
4. roles inherited from groups;
5. required permission;
6. permission scope;
7. object ownership or assignment;
8. audit requirement for material actions.

### 3.3 No public self-registration as admin

No public user must be able to register as:

1. Project Owner;
2. Platform Administrator;
3. Verifier;
4. Reviewer;
5. Complaint Operator;
6. Billing Operator;
7. Support Operator;
8. Read Only Auditor.

Internal access is granted only through the Admin Access Console by an authorized administrator or Project Owner.

### 3.4 Separation of duties

Platform Administrator manages access.

Verifier verifies evidence.

Reviewer makes workflow decisions.

Billing Operator handles billing and entitlement review.

Complaint Operator handles complaints.

Support Operator helps users but does not approve, verify or close high-risk cases.

Project Owner approves policy changes, high-risk exceptions and administrator appointment.

AI Assistant prepares drafts and summaries only. It does not approve, reject, verify, assign permissions or grant billing entitlements.

## 4. User categories

CrewPortGlobal should support four top-level access categories.

### 4.1 Public visitor

A public visitor is not logged in.

Allowed:

1. view home page;
2. view public vacancies;
3. view public vacancy detail;
4. view public documents and policies;
5. open registration and login pages.

Not allowed:

1. create operator actions;
2. view private profile data;
3. access `/verify/`;
4. access `/admin/access/`;
5. call protected API routes.

### 4.2 External registered user

External registered users include:

1. Seafarer;
2. Employer;
3. Shipowner;
4. Crewing Manager;
5. Company Representative;
6. Company Admin.

External users may access only their own personal records, their company-linked records, or public data.

### 4.3 Internal operator

Internal operators include:

1. Support Operator;
2. Verifier;
3. Reviewer;
4. Complaint Operator;
5. Billing Operator;
6. Read Only Auditor.

Internal operators may access only operator surfaces and actions matching their assigned roles and permissions.

### 4.4 Administration and ownership

Administration and ownership roles include:

1. Platform Administrator;
2. Project Owner.

These roles manage access policy, groups and exceptions. They must not be used as a shortcut to silently replace business review roles.

## 5. Target groups

### 5.1 External groups

| Group code | Purpose | Default role |
|---|---|---|
| `public_visitors` | Unauthenticated public access model | `public_visitor` |
| `registered_users` | Base group for logged-in users | `registered_user` |
| `registered_seafarers` | Seafarers managing their own profile and applications | `seafarer` |
| `registered_employers` | Employers managing their company and vacancies | `employer` |
| `shipowners` | Shipowner users and companies | `shipowner` |
| `crewing_managers` | Crewing manager organizations | `crewing_manager` |
| `company_representatives` | Users linked to a company | `company_representative` |
| `company_admins` | Users allowed to administer their own company profile | `company_admin` |

### 5.2 Internal groups

| Group code | Purpose | Default role |
|---|---|---|
| `support_team` | First-line user assistance | `support_operator` |
| `verification_team` | Evidence and document verification | `verifier` |
| `review_team` | Human workflow decisions | `reviewer` |
| `complaint_team` | Complaint and dispute handling | `complaint_operator` |
| `billing_team` | Billing and entitlement review | `billing_operator` |
| `read_only_auditors` | Read-only compliance and operational visibility | `read_only_auditor` |
| `platform_administrators` | Access-management administration | `platform_administrator` |
| `platform_owners` | Final project governance and exceptions | `project_owner` |
| `ai_assistants` | Non-human assistant identity for logs and drafts | `ai_assistant` |

## 6. Target roles

### 6.1 Public and external roles

| Role code | Main purpose |
|---|---|
| `public_visitor` | Unauthenticated public browsing |
| `registered_user` | Base authenticated external user |
| `seafarer` | Create and manage own seafarer profile and applications |
| `employer` | Manage own company and vacancy drafts |
| `shipowner` | Manage shipowner company context and vessel/vacancy data |
| `crewing_manager` | Manage crewing company context and vacancy requests |
| `company_representative` | Act for a linked company within assigned company scope |
| `company_admin` | Manage company-side users and company records within company scope |

### 6.2 Internal roles

| Role code | Main purpose |
|---|---|
| `support_operator` | Assist users and collect missing information without final decisions |
| `verifier` | Verify documents, evidence, company and vessel information |
| `reviewer` | Make controlled human-review workflow decisions |
| `complaint_operator` | Handle complaints and disputes |
| `billing_operator` | Review billing accounts and service entitlements |
| `read_only_auditor` | Read-only review of queues, records and audit events |
| `platform_administrator` | Manage users, groups and role assignment |
| `project_owner` | Approve policy, exceptions and administrator appointment |
| `ai_assistant` | Produce drafts and summaries without final authority |

## 7. Permission scopes

Every permission should have a scope.

| Scope | Meaning |
|---|---|
| `public` | Public data only |
| `own` | Current user’s own record only |
| `company` | Records linked to the user’s company |
| `assigned` | Records assigned to the operator |
| `queue` | Records visible in the operator’s role queue |
| `all_operational` | All operational records within the operator surface |
| `system` | Access-management or governance-level action |

## 8. Page access model

| Page / route | Purpose | Required access |
|---|---|---|
| `/` | Home | Public |
| `/vacancies/` | Public vacancy board | Public |
| `/vacancies/detail/` | Public vacancy detail | Public |
| `/documents` menu and public legal pages | Reference documents | Public |
| `/register/` | Registration / login | Public |
| `/create-profile/` | Seafarer profile workspace | `seafarer` with `own` scope |
| `/post-vacancy/` | Employer vacancy workspace | `employer`, `shipowner`, `crewing_manager`, `company_representative`, or `company_admin` with `company` scope |
| `/verify/` | Operator review queue | Internal operator permission |
| `/admin/access/` | User, group and role management | `platform_administrator` or `project_owner` |

## 9. Data access by user type

### 9.1 Seafarer

Allowed:

1. create own profile;
2. edit own profile;
3. view own profile;
4. submit own profile for review;
5. view own review status;
6. view own correction reason;
7. apply to public vacancies;
8. view own vacancy applications;
9. withdraw own application where workflow permits.

Backend rule:

```text
current_user_id must match the profile owner.
```

Example SQL ownership logic:

```sql
WHERE seafarer_profiles.user_id = :current_user_id
```

Not allowed:

1. view other seafarers’ private profiles;
2. view employer management data;
3. access `/verify/`;
4. access `/admin/access/`;
5. assign roles or groups;
6. call operator APIs.

### 9.2 Employer / Shipowner / Crewing Manager

Allowed:

1. create company profile;
2. edit own company profile;
3. create vacancy request;
4. edit own vacancy request;
5. submit vacancy for review;
6. view own vacancy status;
7. view candidates presented to their company by operator workflow;
8. mark presented candidates as contacted, interview requested or not suitable.

Backend rule:

```text
current_user_id must be linked to company_id through company membership.
```

Example SQL company-scope logic:

```sql
JOIN company_users cu ON cu.company_id = vacancy_requests.company_id
WHERE cu.user_id = :current_user_id
```

Not allowed:

1. view other companies’ private data;
2. view all seafarer records;
3. access operator queues;
4. manage platform roles;
5. bypass human review before candidate presentation.

### 9.3 Support Operator

Allowed:

1. view support queue;
2. view limited user summary;
3. create support notes;
4. request missing information;
5. route cases to Verifier, Reviewer, Complaint Operator or Billing Operator.

Not allowed:

1. approve profiles;
2. verify documents;
3. approve candidate presentation;
4. change billing status;
5. manage access;
6. close high-risk complaints.

### 9.4 Verifier

Allowed:

1. view verification queue;
2. view seafarer documents where required;
3. view company verification evidence;
4. view vessel verification evidence;
5. mark evidence under review;
6. mark evidence verified or rejected within verification workflow;
7. request document correction;
8. create verification notes.

Not allowed:

1. approve candidate presentation to employer;
2. approve high-risk workflow exceptions;
3. manage billing;
4. manage groups or roles;
5. delete audit events.

### 9.5 Reviewer

Allowed:

1. view review queue;
2. start human review;
3. approve or return seafarer profile;
4. approve or return company profile;
5. approve vacancy request before public or matching workflow;
6. approve candidate presentation;
7. create review notes and correction reasons.

Not allowed:

1. modify raw evidence to hide inconsistency;
2. grant billing entitlements;
3. assign internal roles;
4. approve without minimum evidence;
5. delete audit events.

### 9.6 Complaint Operator

Allowed:

1. view complaint queue;
2. create complaint record;
3. update complaint status;
4. link complaint to user, company, vacancy, application or document;
5. escalate complaint;
6. close complaint only with resolution note.

Not allowed:

1. delete complaint records;
2. approve seafarer profile outside complaint workflow;
3. change billing without Billing Operator;
4. manage access rights.

### 9.7 Billing Operator

Allowed:

1. view billing accounts;
2. view service entitlements;
3. review employer-side billing status;
4. create billing exception request;
5. view billing audit;
6. escalate refund or entitlement exception to Project Owner.

Not allowed:

1. charge seafarers for recruitment, placement or job access;
2. create paid advantage for seafarer vacancy access;
3. approve profiles;
4. assign roles;
5. modify documents.

### 9.8 Read Only Auditor

Allowed:

1. view operational queues;
2. view statuses;
3. view audit events;
4. view reports.

Not allowed:

1. create records;
2. edit records;
3. approve or reject;
4. change roles;
5. manage billing;
6. delete anything.

### 9.9 Platform Administrator

Allowed:

1. open `/admin/access/`;
2. view users;
3. view groups;
4. view roles;
5. add users to groups;
6. remove users from groups;
7. assign roles to groups;
8. revoke operator access;
9. suspend users where policy permits;
10. view access audit.

Not allowed by default:

1. approve business workflow decisions instead of Reviewer;
2. verify documents instead of Verifier;
3. grant billing exceptions instead of Billing Operator / Project Owner;
4. delete audit events.

### 9.10 Project Owner

Allowed:

1. approve access-policy changes;
2. assign Platform Administrator;
3. approve high-risk exceptions;
4. view full audit log;
5. emergency revoke access;
6. approve new internal roles or new permission sets;
7. approve transition from temporary token to account-based operator access.

Project Owner should not be used for routine queue processing when a specific role exists.

### 9.11 AI Assistant

Allowed:

1. generate draft notes;
2. summarize records;
3. prepare missing-item lists;
4. suggest routing;
5. prepare reports for human review.

Not allowed:

1. approve;
2. reject;
3. verify;
4. assign access;
5. change billing;
6. bypass human review.

## 10. Permission catalog

### 10.1 Public permissions

```text
view_public_pages
view_public_vacancies
view_public_documents
register_account
login_account
```

### 10.2 Seafarer permissions

```text
view_own_profile
edit_own_profile
submit_own_profile_for_review
view_own_review_status
view_own_applications
apply_to_vacancy
withdraw_own_application
```

### 10.3 Employer permissions

```text
view_own_company
edit_own_company
create_vacancy
edit_own_vacancy
submit_vacancy_for_review
view_own_vacancies
view_presented_candidates
update_employer_shortlist_status
```

### 10.4 Support permissions

```text
view_support_queue
view_limited_user_summary
create_support_note
request_missing_information
route_case_to_operator
```

### 10.5 Verification permissions

```text
view_verification_queue
view_seafarer_documents
view_company_documents
view_vessel_documents
mark_document_under_review
mark_document_verified
mark_document_rejected
request_document_correction
create_verification_note
```

### 10.6 Review permissions

```text
view_review_queue
start_human_review
approve_seafarer_profile
reject_seafarer_profile
return_profile_for_correction
approve_company_profile
approve_vacancy_request
approve_candidate_presentation
create_review_note
```

### 10.7 Complaint permissions

```text
view_complaint_queue
create_complaint_record
update_complaint_status
escalate_complaint
close_complaint
view_complaint_history
```

### 10.8 Billing permissions

```text
view_billing_accounts
view_service_entitlements
update_billing_review_status
create_billing_exception_request
view_billing_audit
```

### 10.9 Administration permissions

```text
view_admin_console
view_users
view_groups
view_roles
view_permissions
manage_user_groups
manage_group_roles
revoke_operator_access
suspend_user
view_access_audit
```

### 10.10 Project-owner permissions

```text
approve_access_policy_change
approve_high_risk_exception
assign_platform_administrator
view_full_audit_log
emergency_revoke_access
```

## 11. Admin Access Console

### 11.1 Route

Recommended route:

```text
/admin/access/
```

### 11.2 Purpose

The Admin Access Console is the internal page for managing access to the CrewPortGlobal application.

It must not be visible as a public registration option.

### 11.3 Access

Allowed:

1. Project Owner;
2. Platform Administrator.

Denied:

1. public visitors;
2. seafarers;
3. employers;
4. company representatives;
5. operators without administration permission;
6. AI Assistant.

### 11.4 Console sections

The console should include:

1. Users;
2. Groups;
3. Roles;
4. Permissions;
5. Memberships;
6. Access audit;
7. Security settings.

### 11.5 Users section

Fields:

1. user_id;
2. email;
3. display name;
4. account status;
5. external roles;
6. internal groups;
7. effective roles;
8. effective permissions;
9. created_at;
10. last activity where available.

Actions:

1. search user;
2. view user access card;
3. add user to group;
4. remove user from group;
5. revoke operator access;
6. suspend user;
7. view access audit.

### 11.6 Groups section

Actions:

1. create group;
2. edit group name and description;
3. activate or deactivate group;
4. add member;
5. remove member;
6. assign role to group;
7. revoke role from group.

### 11.7 Roles section

Actions:

1. view system roles;
2. view role permissions;
3. assign role to group;
4. revoke role from group.

New role creation should require Project Owner approval.

### 11.8 Permissions section

Permissions should be visible in the console.

At the first implementation stage, permissions should be seeded and fixed by migration or configuration.

Free editing of permission definitions through UI should be postponed.

### 11.9 Access audit section

Must show:

1. actor user;
2. action;
3. target user;
4. target group;
5. target role;
6. previous value;
7. new value;
8. reason;
9. timestamp;
10. source.

Access audit records must not be silently deleted.

## 12. Administrative account security

### 12.1 Requirement

Access to `/admin/access/` must require stronger protection than ordinary public browsing.

Minimum Stage 1 protection:

1. email/password or existing login session;
2. one-time code sent by email;
3. short session lifetime for administrative access;
4. audit event for successful and failed admin access attempts.

### 12.2 Stage 1 MFA method

For the first implementation, email one-time code is sufficient.

Flow:

```text
1. User logs in with normal credentials.
2. User opens /admin/access/.
3. Backend checks whether user has platform_administrator or project_owner permission.
4. Backend sends a one-time code to the verified email address.
5. User enters the code.
6. Backend verifies code and creates an admin session marker.
7. Admin console becomes available for a limited time.
```

### 12.3 Email code requirements

Recommended controls:

1. numeric or alphanumeric code;
2. expiry: 10 minutes;
3. one-time use;
4. rate limit sending attempts;
5. rate limit verification attempts;
6. store only a hash of the code;
7. record audit events;
8. never reveal whether a non-admin email exists.

### 12.4 Future MFA methods

Future methods:

1. Google Authenticator / TOTP;
2. passkeys;
3. hardware security key;
4. phone-based code only if legally and operationally justified.

Phone code may be useful later, but email code is enough for the first controlled implementation.

## 13. Backend access guard

All protected API routes should use one standard access function.

Recommended function concept:

```text
require_permission(current_user, permission_code, scope, object_id)
```

The guard must:

1. identify the current user;
2. confirm user is active;
3. load group memberships;
4. load roles assigned to groups;
5. load permissions assigned to roles;
6. check requested permission;
7. check permission scope;
8. check ownership, company membership or assignment;
9. return `403 forbidden` when access is denied;
10. write audit event for material decisions.

## 14. Protected API route examples

### 14.1 Seafarer profile

```text
GET /api/v1/seafarer/profile
PATCH /api/v1/seafarer/profile
```

Required permissions:

```text
view_own_profile
edit_own_profile
```

Required scope:

```text
own
```

### 14.2 Employer company and vacancy

```text
GET /api/v1/employer/company
PATCH /api/v1/employer/company
POST /api/v1/employer/vacancies
PATCH /api/v1/employer/vacancies/{id}
```

Required permissions:

```text
view_own_company
edit_own_company
create_vacancy
edit_own_vacancy
```

Required scope:

```text
company
```

### 14.3 Operator review queue

```text
GET /api/v1/operator/review-queue
PATCH /api/v1/operator/review-queue/{id}/status
```

Required permissions depend on queue type.

Examples:

```text
view_verification_queue
view_review_queue
approve_seafarer_profile
approve_vacancy_request
approve_candidate_presentation
```

Required scope:

```text
queue
```

### 14.4 Admin Access Console API

```text
GET /api/v1/admin/access/users
GET /api/v1/admin/access/groups
POST /api/v1/admin/access/group-members
DELETE /api/v1/admin/access/group-members/{id}
POST /api/v1/admin/access/group-roles
DELETE /api/v1/admin/access/group-roles/{id}
GET /api/v1/admin/access/audit
POST /api/v1/admin/access/email-code/request
POST /api/v1/admin/access/email-code/verify
```

Required permissions:

```text
view_admin_console
view_users
view_groups
manage_user_groups
manage_group_roles
view_access_audit
```

Required scope:

```text
system
```

## 15. Proposed database model

### 15.1 Core access tables

Recommended tables:

```text
crewportglobal.access_groups
crewportglobal.access_group_members
crewportglobal.access_roles
crewportglobal.access_group_roles
crewportglobal.access_permissions
crewportglobal.access_role_permissions
crewportglobal.access_audit_events
crewportglobal.admin_email_codes
crewportglobal.admin_sessions
```

### 15.2 `access_groups`

Fields:

```text
group_id UUID PK
group_code TEXT UNIQUE
group_name TEXT
group_type TEXT
description TEXT
is_active BOOLEAN
created_at TIMESTAMPTZ
updated_at TIMESTAMPTZ
```

### 15.3 `access_group_members`

Fields:

```text
group_member_id UUID PK
group_id UUID FK
user_id UUID FK
membership_state TEXT
granted_by_user_id UUID
revoked_by_user_id UUID
granted_at TIMESTAMPTZ
revoked_at TIMESTAMPTZ
reason TEXT
```

### 15.4 `access_roles`

Fields:

```text
role_id UUID PK
role_code TEXT UNIQUE
role_name TEXT
role_type TEXT
description TEXT
is_system_role BOOLEAN
is_active BOOLEAN
created_at TIMESTAMPTZ
updated_at TIMESTAMPTZ
```

### 15.5 `access_group_roles`

Fields:

```text
group_role_id UUID PK
group_id UUID FK
role_id UUID FK
granted_by_user_id UUID
revoked_by_user_id UUID
granted_at TIMESTAMPTZ
revoked_at TIMESTAMPTZ
assignment_state TEXT
reason TEXT
```

### 15.6 `access_permissions`

Fields:

```text
permission_id UUID PK
permission_code TEXT UNIQUE
permission_name TEXT
permission_area TEXT
description TEXT
is_active BOOLEAN
created_at TIMESTAMPTZ
updated_at TIMESTAMPTZ
```

### 15.7 `access_role_permissions`

Fields:

```text
role_permission_id UUID PK
role_id UUID FK
permission_id UUID FK
scope TEXT
created_at TIMESTAMPTZ
```

### 15.8 `access_audit_events`

Fields:

```text
access_audit_event_id UUID PK
actor_user_id UUID
event_type TEXT
target_user_id UUID
target_group_id UUID
target_role_id UUID
target_permission_id UUID
previous_value JSONB
new_value JSONB
reason TEXT
ip_address INET
user_agent TEXT
created_at TIMESTAMPTZ
```

### 15.9 `admin_email_codes`

Fields:

```text
admin_email_code_id UUID PK
user_id UUID FK
code_hash TEXT
purpose TEXT
expires_at TIMESTAMPTZ
used_at TIMESTAMPTZ
attempt_count INTEGER
created_at TIMESTAMPTZ
ip_address INET
user_agent TEXT
```

### 15.10 `admin_sessions`

Fields:

```text
admin_session_id UUID PK
user_id UUID FK
created_at TIMESTAMPTZ
expires_at TIMESTAMPTZ
revoked_at TIMESTAMPTZ
last_used_at TIMESTAMPTZ
ip_address INET
user_agent TEXT
```

## 16. Seed data

Initial system seed should create:

1. system groups;
2. system roles;
3. system permissions;
4. role-permission mappings;
5. group-role mappings.

The first Project Owner / Platform Administrator must be created through a controlled bootstrap process.

Bootstrap must not be public self-registration.

Recommended initial bootstrap:

```text
1. Identify the approved owner email.
2. Create or locate that user account.
3. Add user to platform_owners group.
4. Assign project_owner role to platform_owners group.
5. Write access audit event.
6. Disable bootstrap script or protect it from repeated public use.
```

## 17. Implementation order

### Phase 0 — Approval of this document

Goal:

```text
Approve the access model before implementation.
```

Deliverable:

```text
Final approved document and registration in documentation register.
```

No code execution.

### Phase 1 — SQL migration draft only

Goal:

```text
Create database migration draft for access groups, roles, permissions, email codes, admin sessions and audit events.
```

Rules:

1. create migration file only;
2. do not run on production;
3. review constraints carefully;
4. include seed data in a controlled migration or seed file;
5. document rollback assumptions.

### Phase 2 — backend access guard planning and tests

Goal:

```text
Create backend permission-checking functions and tests.
```

Target functions:

```text
current_user()
load_effective_permissions(user_id)
require_permission(permission_code, scope, object_id)
write_access_audit_event(...)
```

Do not replace operator token yet.

### Phase 3 — administrative email-code protection

Goal:

```text
Protect /admin/access/ with email one-time code for Project Owner and Platform Administrator.
```

Deliverables:

1. request email code endpoint;
2. verify email code endpoint;
3. admin session marker;
4. rate limits;
5. audit events;
6. email templates.

### Phase 4 — Admin Access Console read-only shell

Goal:

```text
Create /admin/access/ as a protected read-only console.
```

Initial UI:

1. users list;
2. groups list;
3. roles list;
4. permissions list;
5. effective access preview;
6. access audit list.

No write actions yet.

### Phase 5 — group membership management

Goal:

```text
Allow Platform Administrator and Project Owner to add and remove users from groups.
```

Actions:

1. add user to group;
2. remove user from group;
3. require reason;
4. write access audit;
5. show effective roles after change.

### Phase 6 — group-role management

Goal:

```text
Allow controlled assignment of roles to groups.
```

Rules:

1. system roles are visible;
2. role assignment requires platform_administrator or project_owner;
3. high-risk roles require Project Owner approval;
4. write access audit.

High-risk roles:

```text
project_owner
platform_administrator
billing_operator
complaint_operator
```

### Phase 7 — protect operator APIs by permissions

Goal:

```text
Add backend permission enforcement to operator APIs while keeping temporary token as fallback during transition.
```

Rules:

1. `/operator/review-queue` checks operator permissions;
2. queue type maps to required permission;
3. status changes check action-specific permissions;
4. audit records include named actor user_id;
5. temporary token remains only during transition.

### Phase 8 — protect external user APIs by ownership and company scope

Goal:

```text
Ensure seafarer and employer endpoints enforce own/company scope.
```

Rules:

1. seafarer sees only own profile;
2. employer sees only own company and vacancies;
3. employer sees only candidates presented to that company;
4. all unauthorized object access returns 403 or 404 according to security policy.

### Phase 9 — remove or downgrade temporary operator token

Goal:

```text
Replace shared token access with account-session based operator access.
```

Rules:

1. remove shared-token dependency only after tests pass;
2. keep emergency recovery path outside public app;
3. document rollback;
4. publish final operator-auth implementation report.

### Phase 10 — future MFA hardening

Goal:

```text
Add stronger MFA methods after email-code stage is stable.
```

Options:

1. Google Authenticator / TOTP;
2. passkeys;
3. hardware key;
4. phone code if needed.

## 18. Migration from current temporary token model

Transition should be gradual.

Recommended model:

```text
Stage A: keep operator token, build access tables.
Stage B: add login + email-code admin access.
Stage C: add named operator accounts.
Stage D: enforce permissions on new admin APIs.
Stage E: enforce permissions on operator APIs.
Stage F: remove shared operator token from normal workflow.
```

During the transition, the token must not be expanded into a permanent admin mechanism.

## 19. Security requirements

1. Admin access requires login plus email one-time code in Stage 1.
2. Admin one-time code expires after 10 minutes.
3. Admin one-time code is single-use.
4. Only hashed code is stored.
5. Sending attempts are rate-limited.
6. Verification attempts are rate-limited.
7. Admin session has short lifetime.
8. Every access-management change requires audit event.
9. High-risk role grants require reason.
10. Project Owner and Platform Administrator assignments require special audit visibility.
11. External users never receive internal roles through self-registration.
12. UI restrictions must be backed by backend checks.
13. Sensitive data visibility must match role need.
14. Secrets must not be committed to repository.

## 20. Risks and controls

| Risk | Control |
|---|---|
| Shared token leaks | Replace with named accounts and email-code admin session |
| Seafarer accesses operator page | Backend permission check returns 403 |
| Employer accesses other company data | Company-scope guard checks company membership |
| Operator exceeds role authority | Permission-specific checks by route and action |
| Admin changes access without trace | Mandatory access audit event |
| Accidental high-risk role grant | Project Owner approval and audit reason |
| AI acts as decision-maker | AI role has no final-action permissions |
| Permission sprawl | Seeded permissions, no free UI editing in Stage 1 |

## 21. Non-goals for first implementation

The first implementation must not include:

1. public self-registration as admin;
2. free-form permission creation through UI;
3. automatic AI approval;
4. payment-based seafarer access priority;
5. deletion of audit events;
6. direct production SQL execution without separate approval;
7. immediate removal of existing operator token before replacement is verified;
8. server-level user management through the app.

## 22. Final control statement

CrewPortGlobal must implement access control as a structured application-level RBAC model with groups, roles, permissions, scopes and audit events.

The Admin Access Console must manage application users and their access groups, not Linux server accounts.

External users must receive access only to their own or company-linked records.

Internal operators must receive access only to the operational areas matching their role.

Platform Administrators may manage access but must not replace business review roles.

Project Owner remains the final authority for policy changes, high-risk exceptions and administrator appointment.

The first administrative security method should be email one-time code, with future upgrade path to Google Authenticator / TOTP and other stronger MFA methods.

## 23. Revision history

| Version | Date | Author | Changes |
|---|---|---|---|
| 1.1 | 2026-05-15 | GTC IT / AI Assistant | Registered document in documentation register version 0.66 before Phase 1 SQL migration draft review |
| 1.0 | 2026-05-15 | GTC IT / AI Assistant | Final architecture and implementation plan for access groups, roles, permissions, admin console and email-code administrative protection |
