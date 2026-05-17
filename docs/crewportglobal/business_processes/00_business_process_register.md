# CrewPortGlobal - Business Process Documentation Register

- Project: CrewPortGlobal.com
- Company: GTC INFORMATION TECHNOLOGY FZ-LLC
- Documentation block: Business processes and operating model
- Document type: Dedicated business-process register
- Format: Markdown
- Version: 0.2
- Status: For internal review

## 1. Purpose

This register creates a separate documentation block for CrewPortGlobal business processes, operating rules, client lifecycle, team work ownership, SLA controls and future AI-agent instructions.

The main CrewPortGlobal documentation register remains the master project register. This business-process register is a dedicated sub-register for documents that describe how the company should operate the service in practice.

## 2. Numbering Rule

Business-process documents use the `BP-###` sequence inside this folder.

This avoids conflict with the already occupied main documentation numbers in:

```text
docs/crewportglobal/00_documentation_register.md
```

The original Issue #11 task referenced a `71_business_declaration...` file name, but main document number 71 is already used by:

```text
71_cpg_user_016_seafarer_cv_workspace_and_document_metadata_report.md
```

For this reason, the approved safe structure for the new block is:

```text
docs/crewportglobal/business_processes/
  00_business_process_register.md
  01_business_declaration_client_lifecycle_and_operating_model.md
  02_role_instructions_for_team_and_ai_agents.md
```

## 3. Active Business-Process Documents

| BP ID | File | Source task | Status | Purpose |
|---|---|---|---|---|
| BP-001 | `01_business_declaration_client_lifecycle_and_operating_model.md` | GitHub Issue #11 / CPG-BIZ-018 | Drafted for owner review | Business declaration, client lifecycle, Tasks / My clients model, SLA colors, client card automation and working-group operating model |
| BP-002 | `02_role_instructions_for_team_and_ai_agents.md` | GitHub Issue #12 / CPG-BIZ-019 | Drafted for owner review | Role instructions for the six working groups, including Tasks / My clients behavior, client-card updates, SLA colors, handoffs, escalation rules, revenue/no-fee boundaries and AI-agent instructions |

## 4. Core Controls Introduced By This Block

This documentation block starts from the following approved business controls:

1. Employers, shipowners and maritime business clients are the primary payers.
2. Seafarers must not be charged recruitment or placement fees.
3. Optional seafarer services may exist only when they are voluntary, clearly separated from employment placement and not a condition for job access.
4. Every specialist must have two working lists: `Tasks` and `My clients`.
5. `Tasks` means client-linked work that requires action now.
6. `My clients` means clients connected to the manager or specialist by responsibility, history, relationship, reward attribution or future sales.
7. Client visibility must be scoped to the responsible manager, current specialist and authorized leaders or controllers.
8. The client card is the source of automation for tasks, deadlines, assignments, handoffs, revenue logic and repeat sales.
9. Deadlines must be visible through color states: green, yellow, red, grey and blue.
10. Each group page and AI-agent instruction must derive from the approved operating model, not from ad hoc manual task creation.
11. AI agents may assist, classify, draft, remind, summarize, check completeness and prepare recommendations, but must not independently make final legal, employment, payment, reward, compliance or client-approval decisions.

## 5. Intended Use

Documents in this block are intended to become source material for:

1. team training;
2. internal operating procedures;
3. job descriptions;
4. group-specific portal pages;
5. SLA rules;
6. tariff and revenue-distribution policy;
7. manager reward attribution;
8. AI-agent prompt and tool instructions;
9. future database and workflow requirements.

## 6. Revision History

| Version | Date | Author | Changes |
|---|---|---|---|
| 0.2 | 2026-05-16 | GTC IT / AI Assistant | Added BP-002 role instructions for team and AI agents covering six working groups, Tasks / My clients behavior, SLA colors, client-card updates, handoffs, escalation and AI boundaries |
| 0.1 | 2026-05-16 | GTC IT / AI Assistant | Created separate business-process documentation register and registered BP-001 for CPG-BIZ-018 |
