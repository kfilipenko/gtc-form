# TRAVELGTC-ROADMAP-001 - Site, CRM And Business Process Mapping

- Project: TravelGTC
- Owner: Project Owner
- Source architecture: `docs/travelgtc/018_travelgtc_arch_001_funnel_crm_agent_platform_spec.md`
- Source MVP requirements: `docs/travelgtc/020_travelgtc_biz_001_funnel_crm_mvp_requirements_spec.md`
- Document type: Task
- Version: 0.1
- Date: 2026-07-09
- Status: Implemented

## 1. Purpose

Create a single operational roadmap that connects:

1. public website pages;
2. business processes;
3. CRM objects and stages;
4. API events;
5. AI agent responsibilities;
6. success metrics;
7. implementation sequence.

The goal is to prevent the website from becoming a set of isolated pages and to make each page part of a measurable funnel.

## 2. Business Rationale

TravelGTC must guide the user through a clear sequence:

```text
visitor -> interest -> role -> form -> lead -> consultation -> membership -> participation -> recommendations
```

The site should create trust and interest through travel, community and route creation. The CRM should then show what happened, what the user needs, what stage they are in and which next action is required.

The business model must stay secondary to the user's real need:

1. travel more;
2. join interesting trips or events;
3. create a route;
4. gather people;
5. understand whether the club or partner model fits them.

## 3. Scope

This task includes:

1. defining the end-to-end operating process;
2. mapping each public route to a CRM process;
3. mapping each CRM screen to business action;
4. defining the first API events and CRM records created by site actions;
5. identifying which AI agent supports each step;
6. defining implementation phases after documentation.

## 4. Out Of Scope

This task does not include:

1. backend implementation;
2. database migrations;
3. CRM UI implementation;
4. AI agent code;
5. integrations with WhatsApp, MAX, Telegram or email;
6. payment, booking or membership purchase logic.

## 5. Source Standards

This task follows:

1. `docs/gtc_project_delivery_standard/05_task_definition_and_fixation_standard.md`
2. `docs/gtc_project_delivery_standard/06_ai_agent_collaboration_standard.md`
3. `docs/gtc_project_delivery_standard/08_frontend_navigation_and_page_publication_standard.md`
4. `docs/gtc_project_delivery_standard/09_testing_deploy_and_release_standard.md`

## 6. Acceptance Criteria

The task is complete when:

1. a business-process / website / CRM mapping specification is created;
2. the mapping includes public routes, CRM objects, stages, AI agents, API events and metrics;
3. the mapping identifies implementation phases;
4. documentation register and memory are updated;
5. repository changes are verified and committed.

## 7. Verification Plan

Minimum verification:

1. run `git diff --check`;
2. verify new document references with `rg`;
3. inspect `git status --short`;
4. commit the documentation fixation.

## 8. Revision History

| Version | Date | Author | Changes |
|---|---|---|---|
| 0.1 | 2026-07-09 | GTC IT / AI Assistant | Initial task |
