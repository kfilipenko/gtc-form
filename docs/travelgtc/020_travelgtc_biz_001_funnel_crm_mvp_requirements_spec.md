# TRAVELGTC-BIZ-001 - Funnel And CRM MVP Requirements Specification

- Project: TravelGTC
- Source task: `docs/travelgtc/019_travelgtc_biz_001_funnel_crm_mvp_requirements_task.md`
- Source architecture: `docs/travelgtc/018_travelgtc_arch_001_funnel_crm_agent_platform_spec.md`
- Document type: Business and product requirements specification
- Version: 0.1
- Date: 2026-07-09
- Status: Approved requirements for first CRM/funnel implementation

## 1. MVP Goal

The first TravelGTC business MVP must turn the current public prototype into a working lead and consultation system.

The MVP goal is:

```text
capture a user's travel/community need,
identify their role,
create a structured CRM lead,
prepare a human consultation,
and support follow-up with AI-generated drafts under human control.
```

The MVP must not attempt to implement full membership, booking, payment or official partner-platform integration.

## 2. MVP Success Definition

The MVP is successful when:

1. a visitor can choose a role and submit a structured request;
2. the request is saved in TravelGTC's own database;
3. the CRM shows the lead, role, travel idea and recommended next step;
4. the system creates an AI intake summary;
5. the operator can review the lead and move it through the first funnel stages;
6. the operator can generate but not automatically send a follow-up draft;
7. all data processing has explicit consent text;
8. no public or generated text promises income or creates pressure.

## 3. Public Funnel Structure

The public funnel should be implemented as one main flow on the home page, supported by route-specific pages only where useful.

### 3.1 Main Funnel Blocks

| Order | Block | Purpose | Primary Action |
|---|---|---|---|
| 1 | Hero | Show travel/community dream. | Create travel idea. |
| 2 | Core meanings | Travel, community, route creation, partner opportunity. | Continue to role selection. |
| 3 | Role selector | Identify user's self-perceived role. | Select role. |
| 4 | Travel idea form | Capture structured intent. | Submit request. |
| 5 | Calm model explanation | Explain club/partner path without pressure. | Ask for consultation. |
| 6 | Final CTA | Move to consultation/contact. | Send request. |

### 3.2 Role Selector Options

The first MVP role selector must include:

| Role code | Public label | User meaning |
|---|---|---|
| `traveler` | Хочу путешествовать чаще | Wants travel opportunities and community. |
| `trip_author` | Хочу создать поездку | Has a route, event or group idea. |
| `community_leader` | У меня есть аудитория или круг людей | Has clients, students, friends, subscribers or local group. |
| `event_organizer` | Хочу провести событие или выезд | Wants retreat, sport trip, business weekend or club event. |
| `partner_candidate` | Хочу понять партнёрскую модель | Wants business-model explanation. |
| `unsure` | Пока не знаю, хочу разобраться | Needs calm consultation. |

The selected role is stored as `declared_role`.

The Intake Agent may also create `inferred_role`.

## 4. Public Form Requirements

The MVP must replace generic forms with one structured funnel form.

### 4.1 Form Steps

| Step | Name | Purpose |
|---|---|---|
| 1 | Role | Select why the person came. |
| 2 | Travel need | Capture idea, format, audience and destination. |
| 3 | Contact | Capture safe contact details and consent. |
| 4 | Confirmation | Explain what happens next. |

### 4.2 Required Fields

| Field | Type | Required | Notes |
|---|---|---|---|
| `name` | text | yes | Person's display name. |
| `preferred_channel` | enum | yes | `whatsapp`, `max`, `telegram`, `email`, `phone`. |
| `contact_value` | text | yes | Actual contact handle/number/email. |
| `declared_role` | enum | yes | From role selector. |
| `primary_interest` | enum | yes | `travel`, `club`, `create_trip`, `event`, `business_model`, `presentation`, `not_sure`. |
| `message` | textarea | yes | Free-form explanation of the request. |
| `personal_data_consent` | boolean | yes | Must be true before submission. |
| `communication_consent` | boolean | yes | Consent to contact through selected channel. |
| `consent_version` | text | yes | Fixed version string of consent copy. |

### 4.3 Optional Structured Fields

| Field | Type | Notes |
|---|---|---|
| `travel_format` | enum/multi | `rest`, `yoga`, `freediving`, `retreat`, `sport`, `family`, `business_weekend`, `cruise`, `other`. |
| `destination_interest` | text | City, country, sea, mountains, cruise, not sure. |
| `approx_dates` | text | Flexible date text. |
| `audience_type` | enum/multi | `friends`, `family`, `clients`, `students`, `partners`, `community`, `subscribers`, `other`. |
| `estimated_group_size` | integer/text | Small group estimate. |
| `has_existing_audience` | boolean/unknown | Important for community leader role. |
| `audience_size_range` | enum | `none`, `1_10`, `11_50`, `51_200`, `200_plus`, `unknown`. |
| `business_interest_level` | enum | `none`, `curious_later`, `want_to_understand`, `ready_to_discuss`. |
| `consultation_preference` | enum | `message_first`, `call`, `presentation`, `not_sure`. |
| `best_contact_time` | text | Optional. |

### 4.4 Hidden Tracking Fields

| Field | Type | Notes |
|---|---|---|
| `landing_path` | text | Path where form was opened. |
| `referrer` | text | Browser referrer. |
| `utm_source` | text | Campaign tracking. |
| `utm_medium` | text | Campaign tracking. |
| `utm_campaign` | text | Campaign tracking. |
| `utm_content` | text | Campaign tracking. |
| `utm_term` | text | Campaign tracking. |
| `referral_code` | text | Future referral tracking. |
| `locale` | text | Browser/site locale. |
| `timezone` | text | Client timezone if available. |
| `client_event_id` | uuid/text | Idempotency key for duplicate prevention. |

### 4.5 Validation Rules

1. `name` must be non-empty.
2. `contact_value` must be non-empty.
3. `preferred_channel` must match an allowed value.
4. `declared_role` must match an allowed value.
5. `primary_interest` must match an allowed value.
6. `message` must be non-empty and no longer than the configured limit.
7. consent booleans must be true.
8. hidden tracking fields must never override server-side source values if unsafe.
9. backend must rate-limit submissions.
10. backend must reject obvious spam payloads.

### 4.6 Confirmation Message

After submission the public page should say:

```text
Спасибо. Ваша заявка получена.

Я посмотрю вашу travel-идею, роль и интерес, а затем свяжусь с вами,
чтобы спокойно обсудить подходящий формат: поездку, клуб, событие,
маршрут или партнёрскую возможность.
```

## 5. CRM Funnel Stages

The MVP CRM board must start with these columns:

| Stage code | Label | Meaning |
|---|---|---|
| `new_lead` | Новый лид | Request received, not reviewed. |
| `role_detected` | Роль определена | Declared/inferred role is available. |
| `needs_human_review` | Нужен разбор | Operator should review before contact. |
| `consultation_requested` | Запрос консультации | Person wants explanation/contact. |
| `consultation_scheduled` | Консультация назначена | Time/channel agreed. |
| `consultation_completed` | Консультация проведена | Outcome should be recorded. |
| `next_step_proposed` | Следующий шаг предложен | Club/trip/event/partner path proposed. |
| `nurture_later` | Вернуться позже | Not ready now, keep warm. |
| `closed_not_relevant` | Не подходит | Closed without next action. |

Future stages from the architecture may be added after MVP 1.

## 6. First Database Schema Requirements

Preferred database direction: PostgreSQL.

All tables should include:

1. `id uuid primary key`;
2. `created_at timestamptz not null`;
3. `updated_at timestamptz not null`;
4. `created_by text/null`;
5. `updated_by text/null`.

### 6.1 `travelgtc_contacts`

| Column | Type | Required | Notes |
|---|---|---|---|
| `id` | uuid | yes | Primary key. |
| `display_name` | text | yes | Public/name field. |
| `primary_channel` | text | yes | Preferred channel. |
| `primary_contact` | text | yes | Phone/email/handle. |
| `email` | text | no | Optional. |
| `phone` | text | no | Optional. |
| `telegram` | text | no | Optional. |
| `max_contact` | text | no | Optional. |
| `whatsapp` | text | no | Optional. |
| `consent_personal_data` | boolean | yes | Must be true for real CRM processing. |
| `consent_communication` | boolean | yes | Must be true before contact. |
| `consent_version` | text | yes | Consent text version. |
| `notes` | text | no | Human notes. |

### 6.2 `travelgtc_leads`

| Column | Type | Required | Notes |
|---|---|---|---|
| `id` | uuid | yes | Primary key. |
| `contact_id` | uuid | yes | FK to contact. |
| `stage` | text | yes | CRM stage code. |
| `declared_role` | text | yes | User-selected role. |
| `inferred_role` | text | no | Agent classification. |
| `primary_interest` | text | yes | Main request type. |
| `business_interest_level` | text | no | Business-model curiosity. |
| `source_channel` | text | no | `site`, `manual`, `social`, future channels. |
| `source_path` | text | no | Landing path. |
| `utm_source` | text | no | UTM. |
| `utm_medium` | text | no | UTM. |
| `utm_campaign` | text | no | UTM. |
| `referral_code` | text | no | Future referral code. |
| `qualification_score` | integer | no | 0-100, optional. |
| `compliance_risk` | text | no | `none`, `low`, `medium`, `high`. |
| `recommended_next_step` | text | no | Agent/human recommendation. |
| `summary` | text | no | Human-readable summary. |

### 6.3 `travelgtc_travel_ideas`

| Column | Type | Required | Notes |
|---|---|---|---|
| `id` | uuid | yes | Primary key. |
| `lead_id` | uuid | yes | FK to lead. |
| `format` | text | no | Travel/event format. |
| `destination` | text | no | Desired direction. |
| `approx_dates` | text | no | Flexible dates. |
| `audience_type` | text | no | Who the trip is for. |
| `estimated_group_size` | text | no | Estimate. |
| `description` | text | yes | Main message/idea. |
| `important_details` | text | no | What matters in the trip. |
| `status` | text | yes | `draft`, `needs_review`, `consultation`, `archived`. |

### 6.4 `travelgtc_interactions`

| Column | Type | Required | Notes |
|---|---|---|---|
| `id` | uuid | yes | Primary key. |
| `lead_id` | uuid | yes | FK to lead. |
| `contact_id` | uuid | yes | FK to contact. |
| `interaction_type` | text | yes | `form`, `note`, `call`, `message`, `consultation`, `agent_summary`. |
| `channel` | text | no | `site`, `whatsapp`, `max`, `telegram`, `email`, `phone`, `internal`. |
| `direction` | text | yes | `inbound`, `outbound`, `internal`. |
| `body` | text | yes | Content or note. |
| `human_approved` | boolean | no | For drafts/outbound content. |
| `metadata_json` | jsonb | no | Optional structured data. |

### 6.5 `travelgtc_tasks`

| Column | Type | Required | Notes |
|---|---|---|---|
| `id` | uuid | yes | Primary key. |
| `lead_id` | uuid | yes | FK to lead. |
| `task_type` | text | yes | `review`, `contact`, `schedule_consultation`, `follow_up`, `content`, `compliance_review`. |
| `title` | text | yes | Short task name. |
| `description` | text | no | Task detail. |
| `status` | text | yes | `open`, `in_progress`, `done`, `cancelled`. |
| `priority` | text | yes | `low`, `normal`, `high`. |
| `due_at` | timestamptz | no | Optional. |
| `assigned_to` | text | no | Operator/admin id later. |

### 6.6 `travelgtc_agent_runs`

| Column | Type | Required | Notes |
|---|---|---|---|
| `id` | uuid | yes | Primary key. |
| `lead_id` | uuid | no | Optional FK. |
| `agent_type` | text | yes | `intake`, `follow_up`, `content`, `compliance`, `crm_orchestration`. |
| `input_json` | jsonb | yes | Input payload. |
| `output_json` | jsonb | no | Structured output. |
| `status` | text | yes | `queued`, `completed`, `failed`, `requires_human_review`. |
| `model_name` | text | no | AI model used. |
| `risk_flags_json` | jsonb | no | Compliance/risk flags. |
| `human_review_status` | text | yes | `not_required`, `pending`, `approved`, `rejected`. |

### 6.7 `travelgtc_audit_log`

| Column | Type | Required | Notes |
|---|---|---|---|
| `id` | uuid | yes | Primary key. |
| `entity_type` | text | yes | Table/object type. |
| `entity_id` | uuid | yes | Object id. |
| `action` | text | yes | `created`, `updated`, `stage_changed`, `agent_run`, `consent_recorded`. |
| `actor_type` | text | yes | `system`, `human`, `agent`. |
| `actor_id` | text | no | Human/agent id. |
| `before_json` | jsonb | no | Previous state. |
| `after_json` | jsonb | no | New state. |

## 7. API Contracts

API prefix:

```text
/api/travelgtc/v1
```

### 7.1 Public Lead Submission

```text
POST /api/travelgtc/v1/public/leads
```

Purpose:

```text
create contact, lead, travel idea, initial interaction and intake task
```

Request body:

```json
{
  "name": "Иван",
  "preferred_channel": "whatsapp",
  "contact_value": "+79180000000",
  "declared_role": "trip_author",
  "primary_interest": "create_trip",
  "travel_format": "retreat",
  "destination_interest": "Turkey",
  "approx_dates": "September",
  "audience_type": ["clients", "community"],
  "estimated_group_size": "10-15",
  "business_interest_level": "want_to_understand",
  "message": "Хочу провести выезд для клиентов.",
  "personal_data_consent": true,
  "communication_consent": true,
  "consent_version": "travelgtc-consent-v1",
  "tracking": {
    "landing_path": "/",
    "utm_source": "instagram",
    "utm_campaign": "retreat_intro",
    "referral_code": "optional"
  }
}
```

Success response:

```json
{
  "ok": true,
  "lead_id": "uuid",
  "contact_id": "uuid",
  "stage": "new_lead",
  "message": "lead_created"
}
```

Minimum error responses:

| HTTP | Code | Meaning |
|---|---|---|
| 400 | `validation_failed` | Required/invalid fields. |
| 409 | `duplicate_submission` | Same client event or duplicate payload. |
| 429 | `rate_limited` | Too many submissions. |
| 500 | `internal_error` | Server error. |

### 7.2 CRM Lead List

```text
GET /api/travelgtc/v1/crm/leads
```

Query params:

1. `stage`;
2. `role`;
3. `source`;
4. `q`;
5. `limit`;
6. `cursor`.

Response includes:

1. lead id;
2. contact name;
3. declared role;
4. inferred role;
5. stage;
6. primary interest;
7. created date;
8. recommended next step;
9. open task count.

### 7.3 CRM Lead Detail

```text
GET /api/travelgtc/v1/crm/leads/{lead_id}
```

Response includes:

1. lead;
2. contact;
3. travel idea;
4. interactions;
5. tasks;
6. agent summaries;
7. audit highlights.

### 7.4 Stage Update

```text
PATCH /api/travelgtc/v1/crm/leads/{lead_id}/stage
```

Request:

```json
{
  "stage": "consultation_requested",
  "note": "Person asked for WhatsApp explanation."
}
```

Rules:

1. only allowed stages can be set;
2. stage changes must be audited;
3. optional note creates an interaction.

### 7.5 Task Update

```text
POST /api/travelgtc/v1/crm/leads/{lead_id}/tasks
PATCH /api/travelgtc/v1/crm/tasks/{task_id}
```

Required for manual and agent-generated tasks.

### 7.6 Agent Intake Run

```text
POST /api/travelgtc/v1/agents/intake
```

MVP behaviour:

1. may be triggered after lead submission;
2. reads lead/contact/travel idea;
3. writes `travelgtc_agent_runs`;
4. updates inferred role and recommended next step only if confidence is acceptable;
5. otherwise creates `needs_human_review` task.

### 7.7 Follow-Up Draft

```text
POST /api/travelgtc/v1/agents/follow-up-draft
```

Request:

```json
{
  "lead_id": "uuid",
  "channel": "whatsapp",
  "goal": "first_contact"
}
```

Response:

```json
{
  "ok": true,
  "draft_id": "uuid",
  "requires_human_approval": true,
  "draft_text": "..."
}
```

MVP rule:

```text
The system must not send the message automatically.
```

## 8. CRM Workspace Requirements

### 8.1 Lead Board

Required features:

1. columns by CRM stage;
2. lead card with name, role, interest and age;
3. quick filter by role;
4. quick filter by source;
5. visible compliance/risk marker;
6. open task marker;
7. click into lead detail.

### 8.2 Lead Detail

Required panels:

1. contact details;
2. declared/inferred role;
3. travel idea summary;
4. stage controls;
5. AI intake summary;
6. recommended next step;
7. interaction timeline;
8. task list;
9. follow-up draft generator;
10. compliance warning area.

### 8.3 Travel Idea Detail

Required fields:

1. format;
2. destination;
3. audience;
4. group size;
5. dates;
6. important details;
7. business interest level;
8. route/event concept draft later.

### 8.4 Consultation Queue

Required features:

1. list of leads in `consultation_requested` or `consultation_scheduled`;
2. channel preference;
3. proposed questions;
4. operator notes;
5. outcome form.

### 8.5 Content Studio Placeholder

MVP 1 may include only a placeholder screen:

```text
Content Studio will generate role-based posts, stories and follow-up campaigns in MVP 3.
```

No production content generation is required in MVP 1, but data model should not block it.

## 9. AI Agent Instruction Boundaries

### 9.1 Shared Agent Rules

Every TravelGTC agent must follow:

1. start from user need, not business pressure;
2. do not promise income;
3. do not imply guaranteed travel savings or guaranteed results;
4. do not use aggressive urgency;
5. distinguish facts from recommendations;
6. flag uncertainty;
7. require human approval for outbound messages;
8. record output in `travelgtc_agent_runs`.

### 9.2 Intake Agent Output Schema

The Intake Agent should output:

```json
{
  "inferred_role": "trip_author",
  "role_confidence": 0.82,
  "primary_motivation": "create a client retreat",
  "business_interest_level": "want_to_understand",
  "recommended_stage": "role_detected",
  "recommended_next_step": "human consultation about route format and platform fit",
  "summary_for_operator": "...",
  "questions_to_ask": ["...", "..."],
  "compliance_flags": []
}
```

### 9.3 Follow-Up Agent Output Schema

The Follow-Up Agent should output:

```json
{
  "channel": "whatsapp",
  "goal": "first_contact",
  "draft_text": "...",
  "tone": "calm, personal, no pressure",
  "requires_human_approval": true,
  "compliance_flags": []
}
```

### 9.4 Compliance Agent Flags

Flags:

1. `income_promise`;
2. `pressure_language`;
3. `unsupported_savings_claim`;
4. `official_terms_claim`;
5. `missing_disclaimer`;
6. `too_aggressive_business_framing`;
7. `requires_human_review`.

## 10. Privacy And Consent Minimum Text

Before production collection of real personal data, legal/privacy documents must be completed.

Minimum form consent text for MVP prototype:

```text
Я согласен(на) на обработку указанных данных для связи со мной по вопросу travel-клуба, поездки, события, маршрута или участия в партнёрской модели.
```

Minimum communication consent:

```text
Я согласен(на), что со мной могут связаться по выбранному каналу связи для ответа на мой запрос.
```

Minimum AI processing notice:

```text
Заявка может быть предварительно обработана с помощью ИИ-инструментов для классификации запроса и подготовки ответа. Решение и коммуникация остаются под контролем человека.
```

Minimum partner model disclaimer:

```text
Участие в партнёрской модели не гарантирует доход. Результат зависит от личной активности, навыков, качества рекомендаций, репутации, времени, усилий и соблюдения официальных правил проекта.
```

## 11. MVP Acceptance Tests

### 11.1 Public Funnel Tests

1. role selector renders all six roles;
2. form requires name, contact, role, interest, message and consents;
3. form rejects missing consent;
4. form sends valid payload to Public Lead API;
5. success state displays confirmation message;
6. hidden UTM/source fields are included where available.

### 11.2 API Tests

1. `POST /public/leads` creates contact, lead, travel idea, interaction and task;
2. invalid enum returns `400 validation_failed`;
3. missing consent returns `400 validation_failed`;
4. duplicate `client_event_id` returns `409 duplicate_submission`;
5. rate limit returns `429 rate_limited`;
6. stage update creates audit log;
7. follow-up draft returns `requires_human_approval: true`.

### 11.3 CRM UI Tests

1. lead board renders stage columns;
2. new lead appears after API creation;
3. lead detail shows contact, role, travel idea and source;
4. stage can be changed by operator;
5. task can be marked done;
6. follow-up draft appears but is not sent automatically;
7. compliance warning is visible when flags exist.

### 11.4 AI Agent Tests

1. Intake Agent returns valid output schema;
2. Intake Agent never moves lead to final membership state;
3. Follow-Up Agent output always requires human approval;
4. Compliance Agent flags income promises;
5. agent output is saved in `travelgtc_agent_runs`.

## 12. Implementation Sequence Recommendation

Recommended next technical tasks:

1. `TRAVELGTC-API-001 - Lead Capture API And Database Schema`
2. `TRAVELGTC-WEB-007 - Public Funnel Role Selector And Form`
3. `TRAVELGTC-CRM-001 - Lead Board And Lead Detail MVP`
4. `TRAVELGTC-AI-001 - Intake Agent And Human Review Summary`
5. `TRAVELGTC-QA-002 - Funnel, API And CRM Playwright/API Tests`

## 13. Open Questions For Project Owner

These do not block MVP requirements, but should be answered before production launch:

1. final preferred CRM admin URL;
2. who is the first human operator;
3. final WhatsApp/MAX/Telegram/email contacts;
4. whether leads may be stored before formal privacy page publication;
5. whether AI processing notice needs a separate checkbox;
6. initial referral code format;
7. whether TravelGTC uses a separate auth model or shared GTC auth.

## 14. Revision History

| Version | Date | Author | Changes |
|---|---|---|---|
| 0.1 | 2026-07-09 | GTC IT / AI Assistant | Initial MVP requirements specification |
