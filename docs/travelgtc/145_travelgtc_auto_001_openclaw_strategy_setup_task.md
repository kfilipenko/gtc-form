# TRAVELGTC-AUTO-001 - OpenClaw Strategy Setup Task for Codex Agent

- Project: TravelGTC
- Owner: GTC INFORMATION TECHNOLOGY FZ-LLC
- Assigned agent: Codex Agent
- Source instruction: Project Owner confirmed publication of the strategy and instructed Codex Agent to begin OpenClaw setup from it.
- Document type: Implementation task
- Version: 0.1
- Date: 2026-09-14
- Status: Ready for Codex execution
- Depends on: TRAVELGTC-MKT-001, TRAVELGTC-ARCH-001, TRAVELGTC-AI-017

## 1. Authoritative Input

Codex Agent must read the complete canonical strategy before changing configuration:

- [TRAVELGTC-MKT-001 - Master Marketing Strategy](142_travelgtc_mkt_001_master_marketing_strategy.md)

Protected visual version for Project Owner review:

- [TravelGTC internal strategy](https://travelgtc.com/crm/strategy/)

The repository Markdown document is authoritative. The browser page is a protected presentation of the same source.

The Project Owner used the name `OpenClow`; this task uses the established product spelling `OpenClaw`.

## 2. Purpose

Configure an initial working OpenClaw automation layer for the TravelGTC marketing strategy. The implementation must support the three distinct directions and two geographic audience models without merging them into one generic funnel:

1. Travel Advantage - `Путешествуй выгоднее`;
2. Life Experiences - `Живи ярче вместе`;
3. Lifestyle Ambassador - `Путешествуй и зарабатывай`;
4. Russian-speaking audience in Russia;
5. Russian-speaking audience living abroad.

The first result must be a testable local service slice connected to existing TravelGTC contracts, not a documentation-only proposal.

## 3. Execution Authority

Codex Agent is authorized to inspect the repository and existing OpenClaw installation, create project-local configuration and code, add tests, and run local or isolated verification required by this task.

Codex Agent must not publish campaigns, contact users, change production credentials, enable paid services, or deploy production automation without a separate Owner-approved deployment step.

## 4. Required First Actions

1. Read the authoritative strategy linked in section 1.
2. Inspect the current OpenClaw runtime, version, configuration locations and integration boundaries without exposing secrets.
3. Inspect the existing TravelGTC API, CRM, Mira and consent contracts before defining adapters.
4. Record a concise implementation plan and the exact files to be changed.
5. Implement the smallest end-to-end local slice: consented event input -> direction/geography classification -> compliant recommended next action -> auditable CRM-ready output.
6. Validate that slice before adding channel adapters or additional workflows.

## 5. Scope

This task includes:

1. project-local OpenClaw configuration and startup instructions;
2. typed workflow inputs and outputs for direction, geography, consent and attribution;
3. separate routing for travel, Life Experiences and Ambassador intent;
4. separate campaign context for Russia and Russian-speaking audiences abroad;
5. Mira handoff and existing TravelGTC CRM integration boundaries;
6. human approval gates for claims, testimonials, prices, events and income language;
7. deduplication, idempotency, audit logging, retry limits and an automation kill switch;
8. disabled-by-default channel adapters for VK, MAX, RUTUBE and relevant international channels;
9. environment-variable documentation without real credentials;
10. unit and contract tests with mocked external providers;
11. an operator runbook and an implementation report registered after completion.

## 6. Mandatory Safety Rules

1. Do not scrape personal profiles, reactions, followers or contact details into CRM.
2. Do not initiate automated private messages without explicit platform-supported consent.
3. Do not treat likes, views, follows or public comments as consent to contact.
4. Do not promise guaranteed income, savings, payback, event access or social results.
5. Keep the Ambassador funnel separate from ordinary travel and Life Experiences qualification.
6. Keep personal Guest Pass codes, tokens, cookies and provider credentials outside source control, logs and generated reports.
7. Use only official APIs and permitted messaging events.
8. Keep RUTUBE automation limited to compliant educational travel and experience content unless written approval establishes another permitted use.
9. Require a current source and human approval before publishing product terms, prices, compensation details or event availability.
10. Preserve unsubscribe, consent withdrawal and communication-stop handling.

## 7. Initial Workflow Contract

The first implementation slice must accept at least:

```text
source_platform
campaign_id
content_id
country_of_residence
departure_country
departure_city
preferred_language
product_direction
consent_scope
consent_timestamp
user_message
```

It must produce at least:

```text
audience_geography
qualified_direction
qualification_status
compliance_status
recommended_next_action
human_approval_required
crm_payload
audit_record
```

The workflow must reject or quarantine events with missing consent, unsupported source claims or an attempted automatic Ambassador pitch to a travel-only lead.

## 8. Deliverables

1. OpenClaw configuration and project-local source files;
2. `.env.example` or equivalent variable contract with placeholders only;
3. workflow schemas and validation rules;
4. one working local end-to-end slice;
5. mocked-provider tests and failure-path tests;
6. setup and operator runbook;
7. implementation report with changed files, commands, test results and remaining production gates;
8. registration of the report in `00_documentation_register.md`.

## 9. Acceptance Criteria

The task is complete when:

1. OpenClaw starts in an isolated local/test mode using documented commands;
2. a consented test event reaches a CRM-ready result with direction and geography attribution;
3. a missing-consent event is blocked and recorded;
4. travel, Life Experiences and Ambassador inputs remain distinguishable in output and tests;
5. Russia and abroad audience contexts remain distinguishable in output and tests;
6. no external message or campaign is sent during tests;
7. secrets are absent from repository changes and logs;
8. relevant build, lint, unit and contract checks pass;
9. the implementation report and documentation register are updated;
10. production activation remains explicitly `NOT_AUTHORIZED` until a separate Owner decision.

## 10. Verification Plan

Codex Agent must identify the repository-native commands first, then run the narrowest checks after each edit. Final evidence must include:

1. configuration/schema validation;
2. unit tests for routing and consent gates;
3. contract test for the TravelGTC CRM-ready payload;
4. mocked channel/provider tests;
5. secret scan of changed files;
6. `git diff --check`;
7. a clear distinction between local, mocked and live verification.

Live provider messaging, paid campaigns and production OpenClaw activation are not part of this task.

## 11. Required Codex Report Format

The completion report must state:

1. exact OpenClaw version and runtime used;
2. files created or changed;
3. implemented workflow path;
4. commands run and results;
5. mocked versus live boundaries;
6. unresolved credentials, platform approvals or compliance gates;
7. rollback procedure;
8. recommended next Owner decision.

## 12. Revision History

| Version | Date | Author | Changes |
| --- | --- | --- | --- |
| 0.1 | 2026-09-14 | GTC IT / AI Assistant | Initial Codex Agent task for OpenClaw setup from the approved TravelGTC marketing strategy |
