# CPG Project Memory Handoff Refresh After Chat Review

- Project: CrewPortGlobal.com
- Company: GTC INFORMATION TECHNOLOGY FZ-LLC
- Stage: Stage 1 - Digital Maritime Crew Data and Matching Platform
- Document type: Project memory and historical handoff refresh
- Source: local Codex session `Оценить проект Crewportglobal` reviewed on 2026-06-09
- Version: 1.0
- Date: 2026-06-09
- Status: Active continuation memory

## 1. Purpose

This document refreshes the active project memory after reviewing the earlier local Codex chat:

```text
Thread: Оценить проект Crewportglobal
Thread id: 019e230a-a872-7880-acb1-97bb1c05372c
Initial date: 2026-05-13
```

The goal is not to replace the documentation register or implementation reports. The goal is to preserve the practical context that should guide the next implementation stages.

## 2. Original Project-Owner Direction

The Project Owner asked to evaluate the existing CrewPortGlobal project because the site looked more like a reading book than a convenient application.

The comparison reference was:

```text
https://crewell.net/ru/
```

The accepted conclusion was:

1. CrewPortGlobal already had a useful engineering and documentation foundation.
2. The product needed to become an action-first international maritime application.
3. Public pages, registration, profile creation, vacancy intake and operator review needed to work as one practical platform.
4. The platform must show real marketplace activity, not fake vacancies or decorative content.

This direction was documented in:

```text
docs/crewportglobal/69_international_maritime_application_goal_and_task_backlog.md
```

## 3. Product Memory To Keep Active

CrewPortGlobal must continue as:

```text
an action-first international maritime jobs, crew data, vacancy intake, document-readiness and matching platform
```

The product should not drift back into a brochure or policy library.

Required operating principles:

1. First screen and main routes must give users useful actions quickly.
2. Seafarers must be able to create and maintain a maritime CV and apply to reviewed vacancies without recruitment or placement fees.
3. Employers, shipowners, vessel operators, ship managers and crewing managers must be able to register company context, vessels and vacancy requests.
4. Operators must review profiles, companies, vessels, documents and vacancy requests before public or candidate-facing use.
5. Public marketplace data must be reviewed, real and traceable.
6. Human review, correction tasks, audit trail and role separation remain core product controls.

## 4. Early Historical Milestones From The Reviewed Chat

The reviewed chat established or reinforced these early milestones:

| Area | Memory |
|---|---|
| Product goal | Document 69 became the active international maritime application goal and backlog. |
| UI direction | The site must become a working application surface, not a long explanatory website. |
| Vacancy flow | Vacancy board and employer intake should use real reviewed data. |
| Seafarer flow | `/create-profile/` is the practical CV/readiness workspace, not only an onboarding page. |
| Employer flow | `/post-vacancy/` is the practical employer/vessel/vacancy workspace. |
| Operator flow | `/verify/`, `/team/` and later role-specific workspaces are required for human review and audit. |
| Documentation discipline | Each implementation slice must be documented and registered. |
| Fixation discipline | Completed work should be verified and committed, not left only as chat context. |

## 5. Current Continuation State On 2026-06-09

Current repository:

```text
/var/www/gtc-form
```

Current implemented stage before this memory refresh:

```text
CPG-BIZ-124 - Agent assignment context enforcement in profile and demand forms
Commit: e3a8095 Enforce agent assignment context in forms
```

CPG-BIZ-124 added runtime enforcement for agent-opened profile and demand form APIs, protected document list/upload and seafarer workspace context resolution.

The recommended next stage remains:

```text
CPG-BIZ-125 - Owner and previous-agent notifications after assignment/reassignment
```

## 6. Active Working Rules For Future Continuation

1. Use `/var/www/gtc-form` as the active CrewPortGlobal repository.
2. Read existing standards and reports before implementation.
3. Preserve historical document numbering and avoid reusing occupied numbers.
4. If a numbering conflict is discovered, keep the stronger governance/source document stable and move the implementation report forward.
5. Do not treat old planning-only documents as current implementation blockers when later reports and standards supersede them.
6. Use current controlling standards such as BP-014 and ICS-001..003 for form lifecycle, protected upload and submit-review behavior.
7. For each completed implementation slice, update the relevant report/registers, run focused verification, clean generated artifacts and commit.
8. The Project Owner expects "фиксация" to mean both documentation/history fixation and git fixation where repository files changed.

## 7. Controlled Boundaries

This memory refresh does not authorize a new runtime feature by itself.

It only records continuation context so that future work remains aligned with the already approved product direction and the current implementation state.
