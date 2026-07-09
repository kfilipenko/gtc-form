# TRAVELGTC-ROADMAP-001 - Site, CRM And Business Process Mapping Specification

- Project: TravelGTC
- Source task: `docs/travelgtc/021_travelgtc_roadmap_001_site_crm_business_process_mapping_task.md`
- Source architecture: `docs/travelgtc/018_travelgtc_arch_001_funnel_crm_agent_platform_spec.md`
- Source MVP requirements: `docs/travelgtc/020_travelgtc_biz_001_funnel_crm_mvp_requirements_spec.md`
- Document type: Roadmap and operating model specification
- Version: 0.1
- Date: 2026-07-09
- Status: Active roadmap for implementation planning

## 1. Operating Thesis

TravelGTC must be built as one operating system, not as separate website, CRM and AI experiments.

Every public page must answer four questions:

1. what user need does this page activate;
2. what action should the user take;
3. what CRM object or stage should be created;
4. what next human or AI-assisted action should happen.

The public story remains:

```text
travel dream -> community -> route/event idea -> role -> consultation -> suitable next step
```

The CRM story remains:

```text
lead source -> user role -> travel/community need -> human review -> consultation -> proposed path -> participation -> recommendation
```

## 2. Roadmap Principles

| Principle | Meaning | Implementation Effect |
|---|---|---|
| One funnel first | The public site must support one main journey instead of many unrelated pages. | The home page becomes the strongest conversion route. Supporting pages prepare or route the user back to the main form. |
| Need before opportunity | The site starts from travel, community and route creation. | The business model is explained only after role and motivation are understood. |
| Every CTA creates state | A button or form must correspond to a CRM event or next task. | Public actions must be traceable through `Lead`, `Interaction`, `Task` and future `AgentRun`. |
| CRM drives follow-up | The operator should see what to do next. | Lead detail, tasks and consultation queue become first CRM screens. |
| AI assists, human approves | Agents draft, classify and summarize; humans decide and send. | No automatic outbound messages, membership invitations or income-related claims. |
| Compliance is product logic | Safe wording is part of the system, not a later legal note. | Business-model and follow-up flows require risk flags and approval. |

## 3. End-To-End Process

| Step | Business Process | User State | System State | Main Owner |
|---|---|---|---|---|
| 1 | Attraction | Sees content, recommendation or direct site link. | Source and UTM can be tracked on page visit. | Content / future Content Agent |
| 2 | Interest | Recognizes travel, community or route-creation need. | Page route and CTA context are available. | Website |
| 3 | Role selection | Chooses how they relate to the idea. | `declared_role` is captured. | Website |
| 4 | Lead capture | Sends idea, question or request. | Contact, lead, travel idea, interaction and task are created. | Public Lead API |
| 5 | Intake | Request is structured. | Intake Agent creates summary, inferred role and recommended next step. | Intake Agent |
| 6 | Human review | Operator checks the lead. | Lead moves to `needs_human_review` or `consultation_requested`. | CRM operator |
| 7 | Consultation | Person receives calm explanation. | Consultation record, notes and follow-up task are created. | Human consultant |
| 8 | Next step | Club, trip, event, presentation or nurture path is proposed. | Lead moves to `next_step_proposed`, `nurture_later` or closed state. | CRM operator |
| 9 | Participation | Person joins or creates activity. | Future membership, participation or event records are created. | Community/operator |
| 10 | Recommendation | Person invites others through trust. | Future referral link and source relationship are tracked. | Participant/operator |

## 4. Business Process / Site / CRM / AI Mapping

| Business Process | Public Surface | User Action | CRM Record Created Or Updated | CRM Stage | API Event | AI Support | Success Metric |
|---|---|---|---|---|---|---|---|
| Social/content attraction | Social post, direct link, future campaign URL | Open site or route | No personal record before consent; source context stored client-side/server-side | Visitor | `page_view` future analytics event | Content Agent drafts source content after human approval | Click-through rate |
| Main funnel entry | `/` | Click primary CTA or role block | Lead context is prepared after form open | Interest | `funnel_started` | None in MVP | CTA click rate |
| Role identification | `/` role selector, route-specific CTA | Select role | `Lead.declared_role` after submission | `role_detected` | `role_selected` | Intake Agent may infer role after form | Role selection completion rate |
| Travel idea capture | `/`, `/create-trip/` | Submit structured travel idea | `Contact`, `Lead`, `TravelIdea`, `Interaction`, `Task` | `new_lead` -> `needs_human_review` | `lead_submitted` | Intake Agent summarizes and recommends next action | Form completion rate |
| Club interest | `/club/`, `/` role selector | Ask about club or membership path | `Lead.primary_interest=club`, `Task.contact` | `consultation_requested` | `lead_submitted` or `consultation_requested` | Consultation Agent prepares questions | Club consultation requests |
| Route/event authoring | `/create-trip/`, `/events/` | Describe route, event or group idea | `TravelIdea`, future `EventIdea`, `Task.review` | `needs_human_review` | `travel_idea_submitted` | Intake Agent classifies format and audience | Valid idea count |
| Business-model interest | `/business-model/` | Ask to understand model | `Lead.business_interest_level`, `Task.compliance_review` if needed | `partner_interest` / `needs_human_review` | `business_model_interest` | Compliance Agent and Consultation Agent draft safe explanation | Qualified partner conversations |
| General contact | `/contacts/`, header CTA, footer CTA | Send message or request presentation | `Contact`, `Lead`, `Interaction`, `Task.contact` | `consultation_requested` | `contact_requested` | Follow-Up Agent drafts first response | Response-ready leads |
| Human consultation | Future `/crm/leads/:id` and consultation queue | Record outcome | `Consultation`, `Interaction`, `Task.follow_up`, lead stage update | `consultation_completed` | `consultation_recorded` | Consultation Agent creates outcome summary | Completed consultations |
| Follow-up | Future CRM task list | Approve/send message outside system or future integration | `Interaction`, `Task` status update | `next_step_proposed` or `nurture_later` | `follow_up_drafted`, `follow_up_approved` | Follow-Up Agent drafts message, human approves | Follow-up completion rate |
| Membership or participation | Future member/trip/event pages | Accept next step | Future `Membership`, `Participation` | `member_active` / `participant_active` | `membership_started` future event | Community Agent proposes activation plan | Activation rate |
| Referral and recommendation | Future referral links, social content, member area | Invite trusted contact | Future `Referral`, `LeadSource` | `referral_active` | `referral_link_used` | CRM Orchestration Agent tracks source relation | Referral lead count |
| Content production | Future CRM content studio | Create post/story/video script | Future `ContentPlan`, `ContentDraft`, `Campaign` | Not a lead stage | `content_draft_created` | Content Agent + Compliance Agent | Published approved content |

## 5. Public Route Mapping

| Route | Funnel Role | Primary CTA | CRM Object(s) | Default CRM Stage | Required API Event | AI Support | Success Metric | Next Implementation Task |
|---|---|---|---|---|---|---|---|---|
| `/` | Main conversion route | Создать travel-идею | `Contact`, `Lead`, `TravelIdea`, `Interaction`, `Task` | `new_lead` | `lead_submitted` | Intake Agent | Main form conversion | `TRAVELGTC-WEB-007` |
| `/travel-lifestyle/` | Warm interest through travel identity | Обсудить формат поездки | `Lead`, optional `TravelIdea` | `consultation_requested` | `travel_lifestyle_interest` | Intake Agent | CTA-to-form rate | `TRAVELGTC-WEB-007` |
| `/club/` | Explain club environment | Узнать о клубе | `Lead`, `Interaction`, `Task.contact` | `consultation_requested` | `club_interest` | Consultation Agent | Club interest submissions | `TRAVELGTC-WEB-007` |
| `/create-trip/` | Capture route/event author | Отправить идею | `TravelIdea`, `Lead`, `Task.review` | `needs_human_review` | `travel_idea_submitted` | Intake Agent | Valid travel ideas | `TRAVELGTC-API-001` |
| `/business-model/` | Safe business-model education | Обсудить бизнес-возможность | `Lead`, `Interaction`, `Task.compliance_review` | `partner_interest` / `needs_human_review` | `business_model_interest` | Compliance Agent, Consultation Agent | Safe consultation requests | `TRAVELGTC-WEB-007` |
| `/events/` | Capture event and community ideas | Предложить событие | `TravelIdea`, future `EventIdea`, `Task.review` | `needs_human_review` | `event_idea_submitted` | Community Agent | Event ideas submitted | `TRAVELGTC-WEB-007` |
| `/about/` | Trust and positioning | Связаться | `Lead`, `Interaction` | `consultation_requested` | `about_contact_requested` | None in MVP | Contact requests | `TRAVELGTC-WEB-007` |
| `/contacts/` | Direct request | Получить презентацию / написать | `Contact`, `Lead`, `Interaction`, `Task.contact` | `consultation_requested` | `contact_requested` | Follow-Up Agent | Response-ready contacts | `TRAVELGTC-API-001` |
| Future `/crm/` | Operator workspace | Review leads | `Lead`, `Task`, `Interaction` | All active stages | CRM read/update events | CRM Orchestration Agent | Leads processed | `TRAVELGTC-CRM-001` |
| Future `/crm/leads/:id` | Lead decision screen | Record next step | `Lead`, `Consultation`, `Interaction`, `Task` | Stage transition | `lead_stage_changed` | Consultation Agent, Follow-Up Agent | Time to next action | `TRAVELGTC-CRM-001` |
| Future `/crm/content/` | Content studio | Generate safe content | `ContentPlan`, `ContentDraft`, `Campaign` | Not a lead stage | `content_draft_created` | Content Agent, Compliance Agent | Approved drafts | `TRAVELGTC-CONTENT-001` |
| Future referral route | Network growth | Invite trusted contact | `Referral`, `LeadSource`, `Lead` | `referral_active` | `referral_link_used` | CRM Orchestration Agent | Referral conversion | `TRAVELGTC-NETWORK-001` |

## 6. CRM Screen Mapping

| CRM Screen | Business Purpose | Main Records | Required Actions | AI Support | MVP Priority |
|---|---|---|---|---|---|
| Lead board | See funnel state and workload. | `Lead`, `Task` | Move lead stage, open lead detail, filter by role/source. | CRM Orchestration Agent later. | High |
| Lead detail | Understand one person and decide next step. | `Contact`, `Lead`, `TravelIdea`, `Interaction`, `Task`, `AgentRun` | Review summary, add note, assign task, change stage. | Intake Agent summary; Consultation Agent prep. | High |
| Travel idea detail | Turn user idea into consultation topic. | `TravelIdea`, `Lead`, `Task` | Clarify destination, audience, format and feasibility. | Intake Agent extracts structure. | High |
| Consultation queue | Prepare and track human conversations. | `Consultation`, `Task`, `Lead` | Schedule, record outcome, create follow-up. | Consultation Agent suggests agenda and summary. | High |
| Follow-up task list | Ensure no lead is abandoned. | `Task`, `Interaction`, `Lead` | Draft, approve, mark sent/done. | Follow-Up Agent drafts messages. | Medium |
| Compliance review | Protect wording and claims. | `Interaction`, `ContentDraft`, `AgentRun`, `Lead` | Review risk flags before business-model messages. | Compliance Agent. | Medium |
| Content studio | Attract users through needs and stories. | `ContentPlan`, `ContentDraft`, `Campaign` | Generate, edit, approve, publish manually. | Content Agent + Compliance Agent. | Later MVP |
| Referral view | Track network growth through trust. | `Referral`, `LeadSource`, `Lead` | See inviter/invitee relation and referral status. | CRM Orchestration Agent. | Future |

## 7. First API Event Model

The first implementation should distinguish between API data storage and analytics events.

### 7.1 Data-Creating Events

| Event | Source | Required Records | Notes |
|---|---|---|---|
| `lead_submitted` | Main funnel form | `Contact`, `Lead`, `TravelIdea`, `Interaction`, `Task`, `AgentRun` queue item | Primary MVP event. |
| `contact_requested` | Contacts page or CTA form | `Contact`, `Lead`, `Interaction`, `Task` | Can reuse lead submission contract. |
| `travel_idea_submitted` | Create-trip page | `Contact`, `Lead`, `TravelIdea`, `Interaction`, `Task` | Must capture idea details. |
| `business_model_interest` | Business model page | `Contact`, `Lead`, `Interaction`, `Task` | Must set `business_interest_level`. |
| `consultation_recorded` | CRM | `Consultation`, `Interaction`, `Task`, `Lead` update | CRM-only in first version. |

### 7.2 Non-Personal Events

| Event | Source | Personal Data | Notes |
|---|---|---|---|
| `page_view` | Public route | No | Future analytics only. |
| `role_selected` | Role selector | No until form submission | Store client-side or send anonymous analytics only after privacy decision. |
| `funnel_started` | Form opened | No until form submission | Useful for conversion tracking later. |

## 8. Agent Responsibility Mapping

| Agent | Trigger | Input | Output | Human Approval Required |
|---|---|---|---|---|
| Intake Agent | New lead or travel idea. | Form payload, page source, role, message. | Summary, inferred role, risk flags, recommended next step, initial task suggestion. | Yes for stage/action decisions. |
| Consultation Agent | Operator opens lead or schedules consultation. | Lead, travel idea, role, previous interactions. | Questions, consultation path, explanation outline, post-call summary draft. | Yes. |
| Follow-Up Agent | Task requires message. | Lead stage, channel, previous notes, next step. | WhatsApp/MAX/Telegram/email draft. | Yes before sending. |
| Content Agent | Operator requests content. | Target role, theme, campaign goal, approved claims. | Post ideas, story sequence, short video script, CTA variants. | Yes before publication. |
| Community Agent | Event/trip/community idea is reviewed. | Travel idea, audience, format, group size, timing. | Event concept, participant path, community activation checklist. | Yes. |
| Compliance Agent | Business-model text, follow-up or content draft is created. | Draft text and context. | Risk flags, safer wording, required disclaimers. | Yes for flagged items. |
| CRM Orchestration Agent | Lead status changes or task backlog changes. | CRM state, pending tasks, stale leads. | Suggested next actions and priority. | Yes before outward action. |

## 9. Implementation Phases

| Phase | Code | Goal | Main Output | Depends On |
|---|---|---|---|---|
| 0 | `TRAVELGTC-ROADMAP-001` | Fix business-process / site / CRM mapping. | This document and task. | Approved architecture and MVP requirements. |
| 1 | `TRAVELGTC-API-001` | Build lead capture API and database schema. | PostgreSQL tables, endpoint, validation, consent, audit. | Phase 0. |
| 2 | `TRAVELGTC-WEB-007` | Connect public funnel to API. | Role selector, unified form, route-specific CTA context, confirmation states. | Phase 1 or API contract stub. |
| 3 | `TRAVELGTC-CRM-001` | Build CRM MVP workspace. | Lead board, lead detail, travel idea detail, task list. | Phase 1. |
| 4 | `TRAVELGTC-AI-001` | Add Intake Agent under human review. | Agent run log, summary, inferred role, recommended next step. | Phase 1 and first CRM state. |
| 5 | `TRAVELGTC-AI-002` | Add follow-up and consultation assistant. | Draft messages, consultation agenda, post-call summary. | Phase 3 and 4. |
| 6 | `TRAVELGTC-CONTENT-001` | Add content planning workflow. | Content studio and draft generator with compliance review. | Phase 3 and AI guardrails. |
| 7 | `TRAVELGTC-NETWORK-001` | Add referrals, participation and community growth tracking. | Referral links, participation records, activation metrics. | Membership/participation decisions. |

## 10. Success Metrics

| Metric | Definition | Why It Matters |
|---|---|---|
| Role selection rate | Users who select a role after reaching the funnel. | Shows whether the site helps people identify themselves. |
| Form completion rate | Users who submit after starting the form. | Shows friction in lead capture. |
| Valid lead rate | Submitted leads that pass spam, consent and contact validation. | Measures real CRM value. |
| Human review time | Time from `new_lead` to first operator decision. | Prevents missed opportunities. |
| Consultation request rate | Leads that ask for explanation or contact. | Measures strength of CTA and trust. |
| Consultation completion rate | Scheduled consultations actually completed. | Measures operator and follow-up quality. |
| Next step proposed rate | Leads with a clear trip, club, event, business or nurture path. | Shows whether CRM creates progress. |
| Participation activation rate | People who join an activity, club step or route process. | Future core product value. |
| Referral lead count | Leads connected to a trusted recommendation. | Future network growth signal. |
| Compliance flag rate | AI or operator flags for risky language. | Keeps the business model safe and credible. |

## 11. Guardrails

1. Do not collect production personal data until privacy, consent and storage rules are approved.
2. Do not automatically send outbound messages.
3. Do not automatically invite users into membership or partner status.
4. Do not promise income, quick result or guaranteed travel savings.
5. Do not make the business model the first product on public pages.
6. Do not store role or interest as personal CRM data before consent and form submission.
7. Every public CTA must map to a CRM state, task or future analytics event.
8. Every AI output that can affect a user must be logged and reviewable.

## 12. Immediate Next Work

The next build task should be:

```text
TRAVELGTC-API-001 - Lead Capture API And Database Schema
```

Minimum scope:

1. create database tables from `TRAVELGTC-BIZ-001`;
2. implement `POST /api/travelgtc/v1/public/leads`;
3. validate required fields and consent;
4. create contact, lead, travel idea, interaction and review task;
5. record source path, UTM and client event id;
6. queue or stub the Intake Agent run;
7. add focused backend/API tests;
8. keep production collection disabled until consent/privacy pages are approved.

After that:

1. `TRAVELGTC-WEB-007 - Public Funnel Role Selector And Form`;
2. `TRAVELGTC-CRM-001 - Lead Board And Lead Detail MVP`;
3. `TRAVELGTC-AI-001 - Intake Agent Summary And Routing`.

## 13. Revision History

| Version | Date | Author | Changes |
|---|---|---|---|
| 0.1 | 2026-07-09 | GTC IT / AI Assistant | Initial roadmap and mapping specification |
