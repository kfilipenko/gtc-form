# TRAVELGTC-ARCH-001 - Funnel, CRM And AI Agent Platform Architecture

- Project: TravelGTC
- Owner: Project Owner
- Source instruction: Project Owner approved the shift from "more pages" to a single strong funnel with own API, lead database, future CRM logic and AI agents
- Document type: Task
- Version: 0.1
- Date: 2026-07-09
- Status: Implemented

## 1. Purpose

Fix the architectural direction for TravelGTC before new implementation work.

TravelGTC must move from a static website prototype toward a standalone product:

```text
funnel + CRM + AI-assisted operating system for travel-community involvement
```

The site must not sell "network technology" directly. It must start with the user's real need:

1. travel more often;
2. find interesting people and events;
3. create a route or trip idea;
4. gather a group;
5. understand whether the club and partner model fit their situation.

The partner/network model is introduced as a natural continuation of trust, community and useful travel activity.

## 2. Core Decision

TravelGTC is no longer planned as an n8n-dependent workflow.

The product direction is:

```text
own API
own lead database
own CRM logic
own agent orchestration layer
future integrations with messengers, content channels and official travel/partner systems
```

## 3. Scope

This task includes fixing the architecture for:

1. product purpose;
2. one primary funnel;
3. user roles;
4. CRM stages;
5. lead and travel-idea data model;
6. AI agent responsibilities;
7. admin/CRM workspace;
8. content-generation workflow;
9. compliance and human-control principles;
10. MVP sequence.

## 4. Out Of Scope

This task does not include:

1. implementing backend code;
2. choosing final database credentials or infrastructure;
3. integrating official third-party systems;
4. sending real user data to external services before privacy/consent is defined;
5. guaranteeing income or membership outcomes.

## 5. Acceptance Criteria

The task is complete when:

1. an architectural specification is created;
2. the documentation register references the specification;
3. project memory records the new strategic direction;
4. verification confirms the documents are present and internally discoverable;
5. repository changes are committed.

## 6. Revision History

| Version | Date | Author | Changes |
|---|---|---|---|
| 0.1 | 2026-07-09 | GTC IT / AI Assistant | Initial task |
