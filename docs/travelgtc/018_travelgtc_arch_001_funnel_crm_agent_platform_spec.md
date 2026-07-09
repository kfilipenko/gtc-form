# TRAVELGTC-ARCH-001 - Funnel, CRM And AI Agent Platform Specification

- Project: TravelGTC
- Source task: `docs/travelgtc/017_travelgtc_arch_001_funnel_crm_agent_platform_task.md`
- Document type: Architecture specification
- Version: 0.1
- Date: 2026-07-09
- Status: Approved direction for next implementation stages

## 1. Product Thesis

TravelGTC is a platform for creating travel communities, routes and partner opportunities through trust, events and personal recommendations.

The public story must start from the user's need, not from the business model:

```text
I want to travel more.
I want to gather people around an idea.
I want to create a trip, event or route.
I want to understand whether this can become my travel direction.
```

The partner/network model appears after the user's travel interest is understood.

The site and CRM must support one process:

```text
visitor -> interest -> role -> form -> lead -> consultation -> membership -> participation -> recommendations
```

## 2. Strategic Positioning

TravelGTC must not look like an aggressive MLM presentation.

Positioning:

```text
modern travel club
community and route-creation platform
personal recommendation system
business opportunity through useful travel activity
```

Forbidden primary framing:

1. quick income;
2. guaranteed business result;
3. pressure to join;
4. "buy now or lose the opportunity";
5. compensation-first communication.

Allowed primary framing:

1. travel ideas;
2. routes;
3. communities;
4. events;
5. trust;
6. personal recommendation;
7. calm explanation of the partner model.

## 3. Primary Funnel

The system must be designed around one main funnel.

### 3.1 Funnel Stages

| Stage | Meaning | System Goal |
|---|---|---|
| Visitor | Person lands on the site or content link. | Show travel/community value. |
| Interest | Person reacts to one need or scenario. | Identify motivation. |
| Role | Person selects who they are in the process. | Route the person into the right path. |
| Form | Person submits a travel idea, question or contact request. | Capture structured lead data. |
| Lead | CRM creates a lead with status and source. | Prepare qualification. |
| Qualification | AI/human evaluates role, need and next step. | Avoid generic selling. |
| Consultation | Human conversation or guided presentation. | Explain only what fits the person. |
| Membership | Person joins or receives membership path. | Activate participant state. |
| Participation | Person joins a trip, event, club activity or creates a route. | Build real experience. |
| Recommendation | Person invites others from trust and value. | Grow the network naturally. |
| Development | Person becomes route author, community leader or partner. | Support ongoing activity. |

### 3.2 Funnel Principle

The user must never feel pushed from first contact into a business offer.

The correct path is:

```text
need -> role -> useful explanation -> relevant next step
```

## 4. User Roles

The system must identify roles early.

| Role | Description | Primary CTA |
|---|---|---|
| Traveler | Wants trips, impressions, community and travel opportunities. | Learn about the club. |
| Trip Idea Author | Wants to create a route or event for friends, family, clients or students. | Create a travel idea. |
| Community Leader | Has an audience, clients, students, subscribers or local group. | Discuss a group format. |
| Event Organizer | Wants to run retreats, sport trips, business weekends or wellness formats. | Propose an event. |
| Partner Candidate | Wants to understand the partner model calmly and honestly. | Discuss participation. |
| Unsure Visitor | Does not know the right path yet. | Ask a question. |

The CRM must store both declared role and inferred role.

## 5. Website Model

The website must become a funnel interface, not a library of pages.

### 5.1 Main Page Direction

The home page should support one sequence:

1. dream of travel;
2. community and shared experience;
3. ability to create a route;
4. role selection;
5. form;
6. calm explanation of club/partner model;
7. CTA to consultation.

### 5.2 Supporting Pages

Supporting pages can exist, but they must not distract from the funnel.

Allowed purpose of pages:

1. support one funnel stage;
2. answer a specific role question;
3. help the user choose the right form;
4. prepare a consultation.

Not allowed:

1. pages that only repeat marketing text;
2. pages that send users into unrelated reading;
3. pages that make the business model look like the first product.

## 6. CRM Model

TravelGTC needs its own CRM, even in the first MVP.

### 6.1 Core CRM Objects

| Object | Purpose |
|---|---|
| Contact | Person identity and communication channels. |
| Lead | Funnel record created from form, message or manual entry. |
| Lead Role | Declared and AI-inferred user role. |
| Travel Idea | Route/event/group idea submitted by the user. |
| Consultation | Planned or completed conversation. |
| Interaction | Message, call, note, form submission or agent recommendation. |
| Task | Action for human operator or AI-assisted follow-up. |
| Membership | Future club/member status record. |
| Participation | Trip, event or activity participation record. |
| Referral Link | Relationship between inviter and invited person. |
| Content Plan | Social content plan tied to role, event or campaign. |
| Agent Run | AI processing log with input, output, status and human approval state. |

### 6.2 Lead Statuses

Initial CRM statuses:

1. `new_lead`
2. `role_detected`
3. `travel_interest_confirmed`
4. `needs_human_review`
5. `consultation_requested`
6. `consultation_scheduled`
7. `consultation_completed`
8. `next_step_proposed`
9. `club_interest`
10. `trip_author_interest`
11. `partner_interest`
12. `member_active`
13. `participant_active`
14. `referral_active`
15. `nurture_later`
16. `closed_not_relevant`

### 6.3 Lead Quality Fields

Each lead should have:

1. source channel;
2. declared role;
3. inferred role;
4. primary motivation;
5. travel format;
6. destination interest;
7. group type;
8. estimated group size;
9. urgency;
10. business-model interest level;
11. trust level;
12. recommended next step;
13. compliance risk flag;
14. consent status.

## 7. Own API And Database Direction

TravelGTC must be built as a standalone product with its own backend.

### 7.1 Core API Modules

| Module | Responsibility |
|---|---|
| Public Lead API | Accept forms and role selections from the public site. |
| CRM API | Manage leads, contacts, stages, tasks and notes. |
| Agent API | Run AI classification, follow-up drafts and content generation. |
| Content API | Store content ideas, drafts, campaigns and publication states. |
| Consultation API | Schedule and record consultation outcomes. |
| Referral API | Track inviter/invitee relationships and campaign links. |
| Audit API | Record important state changes and AI decisions. |

### 7.2 Suggested First Database Tables

1. `travelgtc_contacts`
2. `travelgtc_leads`
3. `travelgtc_lead_roles`
4. `travelgtc_travel_ideas`
5. `travelgtc_consultations`
6. `travelgtc_interactions`
7. `travelgtc_tasks`
8. `travelgtc_referrals`
9. `travelgtc_content_plans`
10. `travelgtc_content_drafts`
11. `travelgtc_agent_runs`
12. `travelgtc_audit_log`

## 8. AI Agent Model

The system should use several specialized agents rather than one generic assistant.

### 8.1 Intake Agent

Purpose:

```text
turn raw form input into structured CRM data
```

Responsibilities:

1. detect role;
2. detect travel motivation;
3. classify urgency;
4. identify whether the person is asking for a trip, event, club or business model;
5. suggest next CRM stage;
6. create a human review summary.

### 8.2 Consultation Agent

Purpose:

```text
prepare the human consultant before a conversation
```

Responsibilities:

1. propose questions to ask;
2. explain what to avoid;
3. suggest a presentation path;
4. prepare a concise consultation script;
5. generate a safe summary after consultation.

### 8.3 Follow-Up Agent

Purpose:

```text
draft personalized follow-up messages
```

Responsibilities:

1. draft WhatsApp/MAX/Telegram/email messages;
2. adapt tone to role and stage;
3. avoid pressure and income promises;
4. propose next action;
5. mark messages as requiring human approval before sending.

### 8.4 Content Agent

Purpose:

```text
generate social content that attracts users through travel needs
```

Responsibilities:

1. create post ideas;
2. create story sequences;
3. create short video scripts;
4. create invitations to events or travel ideas;
5. generate content for different roles;
6. produce variants for warm/cold audiences.

### 8.5 Community Agent

Purpose:

```text
support route authors, event creators and community leaders
```

Responsibilities:

1. turn a rough idea into a route concept;
2. propose event formats;
3. suggest group communication topics;
4. help prepare an invitation;
5. maintain activity after membership or participation.

### 8.6 Compliance Agent

Purpose:

```text
protect the project from unsafe claims and aggressive sales language
```

Responsibilities:

1. detect income guarantees;
2. detect pressure language;
3. detect misleading travel or membership claims;
4. require disclaimers where needed;
5. mark risky content for human review.

### 8.7 CRM Orchestration Agent

Purpose:

```text
keep the funnel moving
```

Responsibilities:

1. detect stale leads;
2. propose tasks;
3. prioritize follow-ups;
4. summarize daily pipeline;
5. identify who is ready for consultation, content or referral activity.

## 9. Human Control Rules

AI may draft, classify and recommend.

AI must not:

1. promise income;
2. send outbound messages without approved integration and consent;
3. enroll a person;
4. make final business or membership decisions;
5. override compliance warnings;
6. hide uncertainty from operators.

Human approval is required for:

1. first outbound personalized message;
2. business-model explanation;
3. membership invitation;
4. content publication;
5. official claims about pricing, terms or platform access.

## 10. Admin / CRM Workspace

The first CRM workspace should include:

1. lead board by stage;
2. lead detail page;
3. travel idea detail;
4. consultation queue;
5. task list;
6. AI summary panel;
7. follow-up draft panel;
8. content draft panel;
9. compliance warning panel;
10. basic source and conversion analytics.

The operator should see:

```text
Who is this person?
What do they want?
What role do they fit?
What should I do next?
What should I not say?
What message can I send after human review?
```

## 11. Content And Social Media Workflow

Content must attract through user needs.

Primary content themes:

1. travel as lifestyle;
2. creating your own route;
3. gathering friends or clients;
4. travel events and retreats;
5. community instead of solo consumption;
6. recommendations through trust;
7. calm explanation of the partner model.

Content workflow:

```text
campaign goal -> audience role -> content agent draft -> compliance check -> human edit -> publish/use -> lead source tracking
```

## 12. MVP Sequence

### 12.1 MVP 1 - Lead Capture And CRM Foundation

1. redesign public funnel around role selection;
2. implement own lead API;
3. create lead/contact/travel-idea tables;
4. build simple CRM lead board;
5. add lead detail and notes;
6. record consent;
7. store source channel.

### 12.2 MVP 2 - AI Intake And Follow-Up

1. add Intake Agent;
2. add role and motivation classification;
3. add AI lead summary;
4. add Follow-Up Agent draft messages;
5. add compliance pre-check;
6. require human approval.

### 12.3 MVP 3 - Consultation And Content Studio

1. consultation queue;
2. consultation scripts;
3. outcome recording;
4. content plan generator;
5. social post/story/video draft generation;
6. campaign-source tracking.

### 12.4 MVP 4 - Membership, Participation And Referral Layer

1. member status;
2. event/trip participation;
3. referral links;
4. inviter/invitee relationship;
5. community leader workspace;
6. partner development pipeline.

## 13. Data Protection And Consent

Before collecting real personal data in production, TravelGTC must define:

1. privacy notice;
2. consent text near forms;
3. data retention policy;
4. who can access CRM records;
5. AI processing disclosure where required;
6. export/delete request path;
7. messenger communication consent.

## 14. Next Implementation Recommendation

The next practical implementation stage should be:

```text
TRAVELGTC-BIZ-001 - Funnel And CRM MVP Requirements
```

Recommended deliverables:

1. exact public funnel form fields;
2. first database schema;
3. API endpoint contract;
4. CRM screen list;
5. agent prompt/instruction boundaries;
6. privacy/consent minimum text;
7. MVP acceptance tests.

## 15. Revision History

| Version | Date | Author | Changes |
|---|---|---|---|
| 0.1 | 2026-07-09 | GTC IT / AI Assistant | Initial approved architecture specification |
