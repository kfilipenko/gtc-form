# TRAVELGTC-AUTH-001 - GTC Identity Registration Gate

- Project: TravelGTC
- Owner: Project Owner
- Source instruction: Project Owner approved separating site registration from the travel-need form and asked to evaluate CrewPortGlobal registration patterns as a reference
- Reference source reviewed: `projects/crewportglobal/app/backend/` and `projects/crewportglobal/public/register/`
- Document type: Task
- Version: 0.1
- Date: 2026-07-09
- Status: Implemented as architecture/task fixation

## 1. Purpose

Fix the registration direction before implementing account, login and authenticated TravelGTC lead submission.

TravelGTC must not treat the public lead form as user registration. A user account and a user's travel/community need are different business events:

```text
account registration -> authenticated user -> TravelGTC role/need form -> CRM lead -> consultation
```

The account layer should be designed as a shared GTC identity layer so that future GTC projects can use one user base with different project memberships and roles.

## 2. Business Reason

The current TravelGTC funnel captures a user's role and travel idea, but the next platform stage requires a stable user identity:

1. a registered user can return to their request;
2. CRM can connect several requests to one person;
3. agents can build follow-up context safely;
4. referrals and recommendations can be tracked later;
5. CrewPortGlobal users, including seafarers, can be invited to TravelGTC only through explicit interest and consent.

The goal is not to sell a network business directly. The system must first identify a user's real need: travel, family travel, route creation, event participation, community involvement or a calm explanation of the partner model.

## 3. Product Decision

The accepted decision is:

```text
Use a separated registration/login module.
Require authentication before a TravelGTC need/application form can be submitted.
Use one shared GTC identity model with project-specific roles.
Do not automatically convert CrewPortGlobal users into TravelGTC leads.
```

The website may show public content, role cards and explanation blocks without login. The actual personal-data form and CRM submission must require a registered and authenticated user.

## 4. CrewPortGlobal Reference Findings

CrewPortGlobal can be used as a technical and process reference, not as the active project.

Useful reference patterns identified:

1. `crewportglobal.users` separates the base user record from project-specific profile tables;
2. `user_credentials` and `user_sessions` use password hashes, session token hashes, expiry and revocation;
3. email verification uses one-time token hashes, expiry, delivery status and test-mode capture;
4. identity context separates anonymous, account session, operator/admin and temporary-token boundaries;
5. registration flow separates user identity, role/profile readiness, consent and review states;
6. consent events are purpose-specific and versioned;
7. authorization pages explicitly say that choosing a form does not automatically grant status.

TravelGTC must reuse the lessons, not copy the CrewPortGlobal schema as-is. A new shared `gtc_identity` layer is required so users are not locked inside `crewportglobal`.

## 5. Scope

This task defines:

1. shared GTC identity direction;
2. TravelGTC registration and login gate;
3. authenticated form submission rule;
4. user/project role model;
5. CRM linkage between user, contact, lead and travel idea;
6. seafarer travel-interest path;
7. compliance guardrails for personal data, recommendations and partner-model communication;
8. implementation sequence for the next coding stage.

## 6. Out Of Scope

This task does not include:

1. copying CrewPortGlobal production users;
2. merging databases immediately;
3. storing official parent-network credentials;
4. integrating the official MWR Life / Travel Advantage account system;
5. implementing payment, booking or membership purchase;
6. sending marketing messages without opt-in and unsubscribe controls;
7. guaranteeing income, membership approval or travel availability.

## 7. Acceptance Criteria

The task is complete when:

1. a registration gate specification is created;
2. the specification defines account-vs-lead separation;
3. the specification defines shared GTC identity and TravelGTC project membership;
4. the specification defines how CrewPortGlobal seafarers can be invited through opt-in travel interest;
5. the documentation register references the new task and specification;
6. project memory records the new registration direction;
7. repository changes are verified and committed.

## 8. Revision History

| Version | Date | Author | Changes |
|---|---|---|---|
| 0.1 | 2026-07-09 | GTC IT / AI Assistant | Initial registration gate task |
