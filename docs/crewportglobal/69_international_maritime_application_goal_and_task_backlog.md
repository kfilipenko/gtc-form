# CrewPortGlobal - International Maritime Application Goal and Task Backlog

- Project: CrewPortGlobal.com
- Company: GTC INFORMATION TECHNOLOGY FZ-LLC
- Stage: Stage 1 - Product repositioning and application build-out
- Document type: Product goal, execution backlog and quality bar
- Status: Active implementation guidance
- Version: 0.1
- Effective date: 2026-05-13

## 1. Product Goal

CrewPortGlobal must become an action-first international maritime jobs and crew application for seafarers, shipowners, vessel operators, ship managers, crewing managers and verified maritime employers.

The product must no longer behave primarily like a reading library. Public pages, registration, vacancy intake, profile creation and operator review must work together as one practical application where users can complete real work:

1. seafarers can build and maintain a professional maritime CV;
2. seafarers can prepare documents and apply to verified vacancies without recruitment or placement fees;
3. shipowners and employers can register, verify company context, add vessels and prepare vacancy requests;
4. operators can review profiles, company records, vessel context and vacancy requests before public or candidate-facing use;
5. the public marketplace shows only real reviewed data, never fake vacancies or fake employer records.

## 2. Reference Product Lesson

The strongest working products in this field succeed because they show useful marketplace activity immediately:

1. current vacancy counts;
2. rank and vessel categories;
3. employer directory signals;
4. fast registration and login;
5. clear CV creation path;
6. fast vacancy publication path;
7. visible trust signals and user outcomes.

CrewPortGlobal should compete through a cleaner, more reliable and more compliant implementation of the same practical market pattern.

## 3. Target Application Shape

### 3.1 Public application surface

The first screen must behave like an application dashboard, not a brochure.

Required first-screen elements:

1. global search for rank, vessel type, joining window and region;
2. seafarer action: create or continue CV;
3. employer action: post or continue vacancy request;
4. marketplace status: public vacancies, verified employers, profile readiness and review policy;
5. trust signal: no recruitment fees for seafarers;
6. language selector for international users.

### 3.2 Seafarer workspace

The seafarer flow must become a guided CV and readiness workspace.

Required modules:

1. account and contact details;
2. rank, department and availability;
3. sea service history;
4. certificates and endorsements;
5. documents and expiry tracking;
6. preferred vessels and salary expectations;
7. CV completeness score;
8. review status and correction requests;
9. apply-to-vacancy action when verified vacancies exist.

### 3.3 Employer workspace

The employer flow must become a structured hiring workspace.

Required modules:

1. representative identity and authority;
2. company registration and verification;
3. vessel registration;
4. vacancy request creation;
5. candidate pipeline;
6. shortlist review;
7. operator-reviewed communication state;
8. archive and reactivation of previous vacancy requests.

### 3.4 Operator workspace

The operator flow is mandatory for quality, trust and compliance.

Required modules:

1. review queue;
2. seafarer profile review;
3. company verification;
4. vessel data review;
5. vacancy request approval;
6. correction notes;
7. audit history;
8. publication controls.

## 4. Product Backlog

### 4.1 Foundation and deployment

| Priority | Task ID | Task | Outcome |
| --- | --- | --- | --- |
| P0 | CPG-APP-001 | Production API routing | `/api/v1` works on live domain and public forms can save drafts |
| P0 | CPG-APP-002 | Application shell redesign | Public pages share an action-first app layout |
| P0 | CPG-APP-003 | Marketplace data policy | No vacancy, employer or vessel is public until reviewed |
| P0 | CPG-APP-004 | Visual asset baseline | Application uses maritime operational imagery and brand-consistent UI |

### 4.2 Seafarer product

| Priority | Task ID | Task | Outcome |
| --- | --- | --- | --- |
| P0 | CPG-SEA-001 | Guided CV workspace | Seafarer sees progress and next required action |
| P0 | CPG-SEA-002 | Practical CV fields | Rank, department, availability, nationality, residence and preferred vessel types are captured cleanly |
| P1 | CPG-SEA-003 | Certificate and document matrix | Document readiness and expiry state are visible |
| P1 | CPG-SEA-004 | Sea service history | Seafarer can record vessel, rank, dates and vessel type |
| P1 | CPG-SEA-005 | Application status tracking | Candidate can see submitted, viewed, needs correction and approved states |

### 4.3 Employer product

| Priority | Task ID | Task | Outcome |
| --- | --- | --- | --- |
| P0 | CPG-EMP-001 | Employer intake redesign | Employer can register company, role and contact context quickly |
| P0 | CPG-EMP-002 | Vacancy request form | Employer can submit rank, vessel, salary, joining date, duration and requirements |
| P1 | CPG-EMP-003 | Vessel profile form | Employer can add vessel name, type, IMO and flag |
| P1 | CPG-EMP-004 | Company verification status | Employer sees unverified, submitted, verified or needs correction |
| P2 | CPG-EMP-005 | Candidate pipeline | Employer can review operator-presented candidates |

### 4.4 Marketplace and matching

| Priority | Task ID | Task | Outcome |
| --- | --- | --- | --- |
| P0 | CPG-MKT-001 | Vacancy board redesign | Vacancy board has filters, categories and real-data empty state |
| P1 | CPG-MKT-002 | Vacancy data model | Approved vacancies can be stored and published |
| P1 | CPG-MKT-003 | Vacancy detail page | Candidate can inspect one vacancy and apply |
| P1 | CPG-MKT-004 | Employer directory | Verified employers can be listed with country and activity context |
| P2 | CPG-MKT-005 | Matching assist | Operators receive assisted candidate suggestions, with human decision control |

### 4.5 International quality

| Priority | Task ID | Task | Outcome |
| --- | --- | --- | --- |
| P0 | CPG-I18N-001 | English and Russian production text | Main pages are polished in English and Russian |
| P1 | CPG-I18N-002 | Ukrainian, Portuguese and Indonesian expansion | Priority maritime labor markets have usable translations |
| P1 | CPG-I18N-003 | Mobile performance pass | Key flows work on mobile, low bandwidth and small screens |
| P1 | CPG-QA-001 | Browser workflow tests | Registration, create profile, post vacancy and review queue are tested end to end |
| P2 | CPG-QA-002 | Accessibility pass | Forms, controls and navigation are keyboard and screen-reader usable |

## 5. MVP Release Definition

The MVP is ready only when these flows work end to end:

1. seafarer creates a profile draft and sees review status;
2. employer creates a company and vacancy draft;
3. operator reviews seafarer and employer records;
4. a reviewed vacancy can be published from real data;
5. the vacancy board shows real reviewed vacancy data;
6. seafarer can apply to a reviewed vacancy;
7. no seafarer recruitment or placement fee is introduced anywhere in the flow.

## 6. Quality Bar

International-level quality means:

1. first screen is useful without reading long explanations;
2. every primary route has one obvious next action;
3. forms feel like professional work tools, not policy documents;
4. trust and compliance are visible but do not drown the workflow;
5. public data is real, reviewed and traceable;
6. mobile layout is first-class;
7. English and Russian copy are clear, native-quality and action-oriented;
8. the system remains ready for later multilingual expansion.

## 7. Immediate Execution Order

1. Fix public app shell and first-screen product experience.
2. Redesign vacancy board, profile creation, registration and employer intake as application screens.
3. Connect live domain `/api/v1` routing to implemented backend.
4. Add vacancy data model and reviewed-publication workflow.
5. Build operator review console into a complete application surface.
6. Add vacancy detail and apply flow.
7. Expand verified employer directory.
8. Complete multilingual polish and mobile QA.

## 8. Control Statement

This document supersedes the earlier brochure-first interpretation of the public site. It does not remove legal, trust, compliance or human-review requirements. It changes the product priority: CrewPortGlobal must now be built and judged as a usable international maritime hiring application.

## 9. Revision History

| Version | Date | Author | Changes |
| --- | --- | --- | --- |
| 0.1 | 2026-05-13 | GTC IT / AI Assistant | Initial active product goal and task backlog for converting CrewPortGlobal into an international maritime jobs and crew application |
