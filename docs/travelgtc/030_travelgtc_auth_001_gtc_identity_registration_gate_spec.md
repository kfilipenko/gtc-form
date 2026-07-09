# TRAVELGTC-AUTH-001 - GTC Identity Registration Gate Specification

- Project: TravelGTC
- Source task: `docs/travelgtc/029_travelgtc_auth_001_gtc_identity_registration_gate_task.md`
- Related architecture: `docs/travelgtc/018_travelgtc_arch_001_funnel_crm_agent_platform_spec.md`
- Related MVP requirements: `docs/travelgtc/020_travelgtc_biz_001_funnel_crm_mvp_requirements_spec.md`
- Document type: Authentication and registration specification
- Version: 0.2
- Date: 2026-07-09
- Status: Approved direction for implementation, unified GTC identity reuse clarified

## 1. Executive Decision

TravelGTC must use a separated registration and login flow before a user can submit the TravelGTC need/application form.

The form is not registration.

If a person already has a GTC account created through another GTC project, including CrewPortGlobal, they must be able to use that account to authenticate on TravelGTC without creating a second account.

The target architecture is:

```text
GTC Identity account
  -> project membership: TravelGTC
  -> TravelGTC role/need form
  -> CRM lead and travel idea
  -> consultation and follow-up
```

This allows one GTC user base with different project roles while keeping each project's data, consents and business processes separate.

TravelGTC receives a project role only when the authenticated user explicitly fills the TravelGTC role/need form or otherwise opts into a TravelGTC flow.

## 2. Why Registration And Lead Form Must Be Separate

Registration answers:

```text
Who is this person and how can they securely return?
```

The TravelGTC form answers:

```text
What does this person need, what role do they choose and what should CRM do next?
```

Combining them would create weak CRM data, unclear consent and a poor user experience. The user should first create or enter an account, then explain their travel need.

## 3. Shared GTC Identity Model

### 3.1 Principle

The platform should introduce a shared identity layer:

```text
gtc_identity
```

TravelGTC and CrewPortGlobal should be treated as project contexts attached to the shared user, not as independent unrelated person databases.

### 3.2 Existing GTC User Reuse

The target user experience:

```text
Existing CrewPortGlobal/GTC user
  -> opens TravelGTC
  -> clicks Login
  -> authenticates with existing GTC credentials/session
  -> fills TravelGTC role/need form
  -> receives TravelGTC project role/context
```

The user must not be asked to register again when a valid shared GTC account already exists.

The system must not automatically transfer project-specific data from CrewPortGlobal to TravelGTC. This includes:

1. maritime documents;
2. seafarer profile details;
3. employer, vessel, crewing, contract or medical records;
4. project-specific verification statuses;
5. CrewPortGlobal consent records that were not granted for TravelGTC.

Allowed shared data for authentication:

1. canonical `user_id`;
2. login email or authentication identity;
3. session/account status;
4. minimal display name if needed for account UI.

TravelGTC contact preferences, role, CRM lead, travel idea, consent and follow-up history must be stored as TravelGTC project data.

### 3.3 Core Tables

Recommended first shared tables:

| Table | Purpose |
|---|---|
| `gtc_identity.users` | Canonical GTC user account. |
| `gtc_identity.auth_identities` | External or password-login identity providers. |
| `gtc_identity.user_credentials` | Password credential record with password hash and lockout metadata. |
| `gtc_identity.user_sessions` | Web sessions with hashed tokens, expiry, revocation and request metadata. |
| `gtc_identity.email_verification_tokens` | One-time email verification tokens stored as hashes. |
| `gtc_identity.user_project_memberships` | Project membership, for example `travelgtc` or `crewportglobal`. |
| `gtc_identity.user_project_roles` | Project-specific role codes. |
| `gtc_identity.user_consents` | Versioned, purpose-specific consent events. |
| `gtc_identity.audit_events` | Security, consent and important account events. |

### 3.4 User Fields

Minimum first version of `gtc_identity.users`:

| Field | Purpose |
|---|---|
| `user_id` | Stable UUID. |
| `email` | Optional but preferred login/contact field. |
| `phone` | Optional phone/WhatsApp/MAX contact base. |
| `display_name` | User-facing name. |
| `primary_channel` | Preferred communication channel. |
| `email_verified_at` | Email verification timestamp. |
| `phone_verified_at` | Future phone verification timestamp. |
| `account_status` | `pending_verification`, `active`, `suspended`, `closed`. |
| `created_at`, `updated_at` | Audit timestamps. |

## 4. Project Membership And Roles

Registration creates only a GTC account when no shared GTC account exists.

Login reuses an existing GTC account when the person already registered through another GTC project.

When the user first interacts with TravelGTC, the system creates:

```text
project_code = travelgtc
membership_status = interested
```

TravelGTC roles are stored separately from global identity.

The TravelGTC role is created only from a TravelGTC action, for example role selection, form submission, explicit TravelGTC interest opt-in or human-confirmed CRM action. A CrewPortGlobal role must not automatically become a TravelGTC role.

Initial TravelGTC role codes:

| Role code | Meaning |
|---|---|
| `traveler` | Wants travel opportunities and community. |
| `trip_author` | Wants to create a route, group trip or event. |
| `community_leader` | Has friends, clients, students, subscribers or a local group. |
| `event_organizer` | Wants to run a retreat, sport trip, business weekend or club event. |
| `partner_candidate` | Wants to understand the partner model. |
| `seafarer_travel_interest` | Seafarer or maritime worker who opted into TravelGTC travel interest. |
| `unsure` | Wants calm orientation before choosing a path. |

The role chosen on the site is not permanent status. It is a declared need and can change after consultation.

## 5. Public UX Requirements

### 5.1 Header

The right side of the public header must show account actions.

For anonymous visitors:

```text
Войти
Регистрация
```

For authenticated users:

```text
{Имя пользователя}
Мои заявки
Выйти
```

### 5.2 Auth Gate

Public pages remain readable without login.

The role selector may be visible without login, but the user must not submit personal TravelGTC need data before authentication.

When an anonymous visitor tries to open or continue the form, the site must show:

```text
Чтобы отправить travel-идею, войдите или зарегистрируйтесь.
```

After login or registration, the user returns to the same form.

### 5.3 Draft Preservation

The browser may temporarily keep selected role and non-sensitive draft text in `sessionStorage` while the user logs in.

The system must not create a CRM lead until:

1. the user is authenticated;
2. required consents are accepted;
3. the form is explicitly submitted.

## 6. Registration And Existing Account Flow

### 6.1 Existing Account Path

If the user already has a shared GTC account:

1. the user chooses `Войти`;
2. the system authenticates against the shared GTC identity layer;
3. TravelGTC does not create a duplicate user account;
4. TravelGTC may create a project membership/context only after a TravelGTC action;
5. TravelGTC role and CRM data are created only from TravelGTC-specific input and consent.

This is the preferred path for existing CrewPortGlobal users.

### 6.2 New Account Required Fields

First version:

| Field | Required | Notes |
|---|---|---|
| `display_name` | yes | Public/account name. |
| `email` | yes for MVP | Login and verification channel. |
| `password` | yes for MVP | Minimum 8 characters. |
| `primary_channel` | yes | `whatsapp`, `max`, `telegram`, `email`, `phone`. |
| `phone` | no | Useful for WhatsApp/MAX later. |
| `account_terms_consent` | yes | Versioned account consent. |
| `privacy_consent` | yes | Versioned privacy/data processing consent. |

### 6.3 Email Verification

The first implementation should follow the CrewPortGlobal pattern:

1. generate random token;
2. store only token hash;
3. set expiry;
4. revoke previous pending tokens for the same user/email/purpose;
5. support test-mode capture before real email delivery is configured;
6. write audit events.

In local/test mode, the API may expose a test verification token only when an explicit test environment flag is enabled.

### 6.4 Login And Sessions

Session requirements:

1. session token must be random and stored as a hash;
2. cookie must be `HttpOnly`;
3. cookie must use `SameSite=Lax`;
4. cookie must use `Secure` on HTTPS;
5. sessions must have expiry and revocation;
6. logout must revoke the current session;
7. `/auth/me` must return only safe public account fields.

## 7. API Model

Recommended endpoints for the next implementation stage:

| Method | Endpoint | Purpose |
|---|---|---|
| `POST` | `/api/travelgtc/v1/auth/register` | Create a new GTC account only if the shared identity does not already exist. |
| `POST` | `/api/travelgtc/v1/auth/login` | Authenticate an existing shared GTC account and create session. |
| `POST` | `/api/travelgtc/v1/auth/logout` | Revoke current session. |
| `GET` | `/api/travelgtc/v1/auth/me` | Return current safe user context. |
| `POST` | `/api/travelgtc/v1/auth/email/send-verification` | Send or capture verification link. |
| `POST` | `/api/travelgtc/v1/auth/email/verify` | Verify email token. |
| `POST` | `/api/travelgtc/v1/account/leads` | Authenticated TravelGTC lead/travel-idea submission; creates TravelGTC role/context when needed. |
| `GET` | `/api/travelgtc/v1/account/leads` | User's own TravelGTC requests. |

The existing `POST /api/travelgtc/v1/public/leads` should not be the primary production form endpoint after the auth gate is implemented. It may remain disabled, test-only or compatibility-only.

## 8. TravelGTC CRM Linkage

TravelGTC project tables must link to `gtc_identity.users`.

Recommended additions to existing TravelGTC lead tables:

| Table | Field | Rule |
|---|---|---|
| `travelgtc_contacts` | `user_id` | Nullable during migration, required for new authenticated web submissions. |
| `travelgtc_leads` | `user_id` | Required for new `account/leads` endpoint. |
| `travelgtc_travel_ideas` | `created_by_user_id` | Required for authenticated submissions. |
| `travelgtc_interactions` | `actor_user_id` | User/human/agent context where applicable. |
| `travelgtc_audit_log` | `actor_user_id` | Security and CRM traceability. |

The contact snapshot should remain because contact details can change over time, but identity should come from `user_id`.

## 9. CrewPortGlobal And Seafarer Audience

### 9.1 Key Business Insight

Seafarers are a real potential TravelGTC audience because their travel pattern is structural:

1. they work on vessels for contract periods;
2. after disembarkation they often have several months at home before the next contract;
3. they travel to joining ports and return from discharge ports;
4. family may fly to a port city during a vessel call or after disembarkation;
5. between contracts they may need rest, family travel, wellness, community events or group trips.

This creates TravelGTC use cases without forcing a business-offer conversation.

### 9.2 Seafarer Travel Need Categories

Potential TravelGTC categories:

| Category code | Need |
|---|---|
| `joining_port_travel` | Flight, hotel or local logistics before joining a vessel. |
| `discharge_port_return` | Return route, stopover or recovery after disembarkation. |
| `family_port_visit` | Family meeting the seafarer in a port city. |
| `between_contracts_trip` | Family or personal travel during leave. |
| `post_contract_recovery` | Wellness, retreat, health reset, quiet rest. |
| `seafarer_community_event` | Event or group trip for maritime community. |
| `partner_model_later` | Optional later interest in TravelGTC partner development. |

### 9.3 Consent Boundary

CrewPortGlobal users must not become TravelGTC leads automatically.

Allowed path:

```text
Existing CrewPortGlobal/GTC user
  -> logs into TravelGTC with the same shared GTC account
  -> sees optional TravelGTC travel-interest prompt
  -> explicitly opts in
  -> grants TravelGTC-specific consent
  -> TravelGTC membership/context is created
  -> TravelGTC CRM lead or interest profile is created
```

Not allowed:

1. creating a duplicate TravelGTC user account for an existing shared GTC user;
2. copying maritime documents into TravelGTC;
3. copying employer, vessel, medical or contract data into TravelGTC;
4. sending TravelGTC marketing based only on CrewPortGlobal registration;
5. implying that maritime registration requires TravelGTC participation;
6. turning a seafarer into a partner candidate without a separate declared interest.

## 10. AI Agent And CRM Implications

The registration gate improves agent quality because the agent can connect a stable user with:

1. submitted travel need;
2. selected role;
3. previous TravelGTC requests;
4. communication consent;
5. referral source;
6. project membership status.

Agent rules:

1. AI may classify role and suggest next CRM stage;
2. AI may draft follow-up messages and social content;
3. AI must not send messages automatically;
4. AI must not make income promises;
5. AI must not pressure users into membership or partner status;
6. AI-generated recommendations must be reviewable by a human operator.

## 11. Compliance Guardrails

These are product guardrails, not legal advice.

TravelGTC should use international best-practice constraints:

1. purpose limitation and data minimization for personal data;
2. explicit consent per project and per communication purpose;
3. clear opt-out for marketing and follow-up;
4. no deceptive earnings or business-opportunity claims;
5. no fake testimonials, fake social proof or undisclosed material connections;
6. clear distinction between personal travel interest, club membership and partner/business opportunity;
7. human approval before outbound AI-generated commercial messages.

Reference sources checked for this specification:

1. EU GDPR official text on personal-data processing principles and data-protection-by-design: `https://eur-lex.europa.eu/eli/reg/2016/679/oj/eng`
2. FTC Business Opportunity Rule overview: `https://www.ftc.gov/legal-library/browse/rules/business-opportunity-rule`
3. eCFR FTC Endorsement Guides, 16 CFR Part 255: `https://www.ecfr.gov/current/title-16/chapter-I/subchapter-B/part-255`
4. FTC CAN-SPAM compliance guide: `https://www.ftc.gov/business-guidance/resources/can-spam-act-compliance-guide-business`

## 12. Implementation Sequence

### 12.1 Next Coding Stage

Recommended next implementation task:

```text
TRAVELGTC-AUTH-002 - GTC Identity Database And Auth API MVP
```

Scope:

1. create `gtc_identity` migration;
2. add registration, existing-account login, logout and current-user API endpoints;
3. add session cookie handling;
4. add email verification test-mode support;
5. prevent duplicate user creation when an existing shared account is found;
6. link TravelGTC account membership only on first TravelGTC action;
7. add tests for account creation, existing-account login, session lookup and logout.

### 12.2 Following Stage

```text
TRAVELGTC-AUTH-003 - Frontend Registration Gate And Authenticated Lead Form
```

Scope:

1. add header account links;
2. add `/auth/` or account modal/page;
3. require login before form entry/submission;
4. preserve non-sensitive draft state through login;
5. submit through `POST /api/travelgtc/v1/account/leads`;
6. show `Мои заявки` for authenticated users.

### 12.3 Later Stage

```text
TRAVELGTC-AUTH-004 - CrewPortGlobal Seafarer Travel Interest Opt-In
```

Scope:

1. add optional TravelGTC interest prompt for CrewPortGlobal users;
2. record explicit TravelGTC consent;
3. create TravelGTC membership only after opt-in;
4. create seafarer travel-interest profile without copying sensitive maritime data;
5. create CRM lead only when the user asks for TravelGTC follow-up.

## 13. Acceptance Criteria For Implementation

The registration implementation will be complete when:

1. an anonymous user can browse public pages;
2. an anonymous user cannot submit a TravelGTC need/application form;
3. the header shows login/registration links for anonymous visitors;
4. registration creates a GTC user only when no shared account exists;
5. an existing CrewPortGlobal/GTC user can authenticate on TravelGTC without additional registration;
6. login creates a secure session cookie;
7. logout revokes the session;
8. authenticated lead submission stores `user_id`;
9. TravelGTC role/context is created from TravelGTC action, not from CrewPortGlobal status;
10. `/auth/me` returns safe current-user data;
11. tests cover happy paths, existing-account login and blocked anonymous submission;
12. documentation and memory are updated after code implementation.

## 14. Revision History

| Version | Date | Author | Changes |
|---|---|---|---|
| 0.2 | 2026-07-09 | GTC IT / AI Assistant | Clarified shared GTC account reuse, no duplicate registration for CrewPortGlobal users and no automatic project-data transfer |
| 0.1 | 2026-07-09 | GTC IT / AI Assistant | Initial registration gate specification |
