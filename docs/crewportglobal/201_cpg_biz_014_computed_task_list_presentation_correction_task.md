# CPG-BIZ-014 - Computed Task List Presentation Correction Task

- Project: CrewPortGlobal.com
- Company: GTC INFORMATION TECHNOLOGY FZ-LLC
- Stage: Stage 1 - Digital Maritime Crew Data and Matching Platform
- Document type: Execution task under approved CPG-BIZ-012
- Source control document: `199_cpg_biz_012_crew_formation_process_documentation_task.md`
- Related business-process documents: BP-012 and BP-013
- Version: 1.0
- Date: 2026-05-27
- Status: Implemented and verified on GTC1

## 1. Purpose

This task corrects the operator task-list presentation implemented after CPG-BIZ-012.

The correction is required because the current `/verify/` list still presents a technical queue instead of a business-process task list.

The approved source rule remains:

```text
previous stage result + current object state + role/permission + assignment relationship = visible next task
```

The list must show the computed task to be performed by the responsible group or assigned employee. It must not expose service/technical fields as the main list content.

## 2. Problem To Correct

The current list still shows technical fields:

```text
Type
Role
Email
Name
Status
Summary
Updated
```

These fields are not the required task-list contract. They belong inside the opened internal working form or object details.

The current row also uses:

```text
Open review workspace
```

as the visible task action. This is not the task itself. It is only the method of opening the internal working object.

## 3. Approved Display Rule

The task list must use the BP-012 / BP-013 format:

```text
{Stage action}. ({Object type}: {safe object summary}.)
```

The task title and short description must be the active link to the internal working object.

No separate `Open...` button should be shown in the task list.

## 4. Required UI Result

The `/verify/` list must be changed from a technical queue table into a business task list.

Required visible columns:

| Column | Purpose |
|---|---|
| `#` | Row number only. |
| `Task` | Active link containing stage action and safe object summary. |
| `Responsible` | Responsible group and assignment context when available. |
| `State` | Short execution state, blocker or SLA hint when applicable. |

The following fields must not be visible as separate list columns:

```text
Type
Role
Email
Name
technical status
raw summary
updated timestamp
```

They may remain available inside the opened workspace.

## 5. Task Title Examples

| Queue object / state | Task title |
|---|---|
| seafarer profile submitted | `Review seafarer profile completeness. (Seafarer profile: {safe name or rank summary}.)` |
| employer/company verification submitted | `Review company verification. (Company: {safe company name}.)` |
| crew request submitted | `Review crew request completeness. (Crew request: {rank} for {vessel type}, join date {date}.)` |
| vacancy application submitted | `Review candidate application. (Candidate application: {rank} for {crew request summary}.)` |
| candidate search task deep link | `Create internal shortlist draft. (Crew request: {rank} for {vessel type}.)` |
| internal shortlist approval task | `Approve internal shortlist. (Crew request: {summary}, {included count} included candidates.)` |
| candidate presentation task | `Approve candidate for employer presentation. (Candidate: {safe candidate summary}.)` |
| deletion pending | `Confirm deletion request. (Crew request: {summary}, deletion requested.)` |

## 6. Internal Workspace Rule

When the user clicks the task title or description, the system must open the internal working object.

Inside that workspace the user may see:

1. technical type;
2. role;
3. contact or email fields allowed by current scope;
4. status;
5. full summary;
6. updated timestamp;
7. review actions;
8. deletion request;
9. raw API payload when permitted.

Secondary actions remain inside the workspace, not in the task row.

## 7. Non-Scope

This task does not authorize:

1. DB changes;
2. migrations;
3. backend workflow changes;
4. new workflow statuses;
5. employer-facing publication;
6. automatic employment decisions;
7. payment or billing implementation.

## 8. Verification Required

The implementation must verify:

1. task title is the active link;
2. there is no separate `Open...` button in the list;
3. technical columns are removed from the list;
4. workspace still opens the correct internal object;
5. review outcome actions remain available inside the workspace;
6. permission-denied actions remain disabled inside the workspace;
7. focused operator queue tests pass;
8. generated Playwright artifacts are not left in the working tree.

## 9. Execution Stage

This task executes:

```text
CPG-BIZ-014 - Computed task list presentation correction
```

It is a corrective continuation of CPG-BIZ-013 under the approved CPG-BIZ-012 process documentation task.
