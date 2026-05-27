# CPG-BIZ-022 - Отчет о статусе проверки бизнес-процессов по новой методике

- Project: CrewPortGlobal.com
- Company: GTC INFORMATION TECHNOLOGY FZ-LLC
- Stage: Stage 1 - Digital Maritime Crew Data and Matching Platform
- Document type: Business-process verification status report
- Source control: CPG-BIZ-012, BP-012, BP-013, CPG-BIZ-013 through CPG-BIZ-021
- Version: 1.0
- Date: 2026-05-27
- Status: Prepared for Project Owner review

## 1. Purpose

This report records which CrewPortGlobal business-process stages have already been checked using the approved practical method:

```text
1. Describe the process stage.
2. Verify the running application.
3. Correct the product or documentation if needed.
4. Test the corrected behavior.
5. If tests confirm conformity, move to the next stage.
6. If conformity is not confirmed, repeat verification and correction.
```

The purpose is to keep the business-process documents and the running application aligned. The process description must not remain theoretical: each stage must be checked against actual executable portal behavior.

## 2. Current Control Baseline

The current verification is based on:

| Source | Role |
|---|---|
| `docs/crewportglobal/business_processes/12_crew_formation_service_business_process_manual.md` | Main process model for crew formation service. |
| `docs/crewportglobal/business_processes/13_crew_formation_operating_instructions_for_users_team_ai.md` | Practical role and operating instructions. |
| `docs/crewportglobal/199_cpg_biz_012_crew_formation_process_documentation_task.md` | Approved task that authorized BP-012 and BP-013. |
| `docs/crewportglobal/200_cpg_biz_013_operator_task_action_simplification_report.md` through `docs/crewportglobal/210_cpg_biz_021_vacancy_request_deep_link_workspace_fix_report.md` | Practical verification, correction and test reports. |

## 3. Verification Summary

| Area | Status | Evidence |
|---|---|---|
| Single primary task operation in `/verify/` | Verified | CPG-BIZ-013 and CPG-BIZ-014 confirmed that task rows no longer show competing primary actions. |
| Task title and object description as active link | Verified | CPG-BIZ-014 confirmed that the task title/object summary opens the working object; no separate `Open...` button is required. |
| Process stage and visibility condition in `/verify/` | Verified | CPG-BIZ-014 addendum confirmed visible process stage and reason why the task remains in the queue. |
| `/team/` My Tasks and group queue alignment | Verified | CPG-BIZ-015 confirmed the same task title, process stage and visibility condition model on `/team/`. |
| `create_internal_shortlist_draft` route | Verified | CPG-BIZ-016 confirmed the link opens `/team/matching/?vacancy_request_id=...` and supports guarded draft creation. |
| Full computed task link audit | Verified with later correction | CPG-BIZ-017 audited URL contracts; CPG-BIZ-021 fixed the remaining `vacancy_request` deep-link issue in `/verify/`. |
| Role and permission execution boundary | Verified | CPG-BIZ-018 confirmed that review-team and owner/control operations are separated by group and permission. |
| Group-queue assignment boundary | Verified as intermediate state | CPG-BIZ-019 confirmed group queue behavior and identified the personal-assignment gap. |
| Historical active executor assignment | Verified | CPG-BIZ-020 implemented and tested object-history based personal assignment. |
| Exact `vacancy_request` workspace from `/verify/` deep link | Verified | CPG-BIZ-021 confirmed exact target-row filtering, exact detail endpoint and visible review workspace. |

## 4. Process Stage Matrix

| BP step | Stage | Current application verification status | Notes |
|---|---|---|---|
| CF-01 | Lead / demand entry | Not yet verified under new method | Lead qualification is described, but runtime path and team task must still be checked. |
| CF-02 | Employer and authority setup | Partially verified | Company verification task presentation exists, but full authority evidence workflow needs a focused check. |
| CF-03 | Vessel context setup | Not yet verified under new method | Vessel registration/data visibility exists in earlier work, but computed vessel-context task execution is not yet fully audited. |
| CF-04 | Crew request structuring | Verified for review queue and exact deep link | `/verify/` now opens exact crew request workspace; task display and status update route are checked. |
| CF-05 | Commercial entitlement check | Not yet verified under new method | Billing/commercial task remains a future process and product slice. |
| CF-06 | Seafarer supply intake | Partially verified | Seafarer profile completeness tasks appear, but full supply-intake task execution requires focused review. |
| CF-07 | Document and readiness review | Partially verified | Earlier CPG-SEAFARER work verified document visibility and blockers; BP method needs a fresh task-link/access pass. |
| CF-08 | Request-supply comparison | Verified | `/team/matching/` opens a concrete crew request and shows why candidates match or are blocked. |
| CF-09 | Internal shortlist draft | Verified | Guarded draft creation from comparison/search is tested and remains employer-visible false. |
| CF-10 | Internal shortlist approval | Verified | Internal approval task is link-audited and permission-checked. |
| CF-11 | Candidate presentation review | Verified | Review application task and candidate presentation review are covered by link and role-access checks. |
| CF-12 | Employer-facing presentation | Partially verified / controlled boundary | Guard and payload minimization are verified, but full employer-facing publication operation remains controlled and not broadly enabled. |
| CF-13 | Employer feedback and outcome | Not yet verified under new method | Feedback/follow-up process requires a later runtime workflow check. |
| CF-14 | Service completion and billing | Not yet verified under new method | Billing basis and service completion remain future work. |
| CF-15 | Retention and audit | Partially verified | Audit events are written for current operations, but retention/follow-up task model remains future work. |

## 5. Verified Application Behaviors

The following application behaviors have passed the new verification approach:

1. A task row shows one main computed operation, not several competing actions.
2. The task title and object summary are the active link.
3. Technical fields are moved out of the list and into the working object.
4. The visible task includes process stage and visibility condition.
5. `/team/` and `/verify/` follow the same computed-task presentation principle.
6. `create_internal_shortlist_draft` opens the concrete request-supply comparison workspace.
7. `vacancy_request` deep links now open a concrete review workspace, not the full queue.
8. Manager deletion confirmation remains owner/control-only.
9. Review-team operations remain review-team operations and do not grant manager powers.
10. Historical active executor assignment now personalizes later tasks for the same object and group.

## 6. Verified Test Evidence

The latest verification cycle used:

| Test / check | Result |
|---|---|
| `php -l projects/crewportglobal/app/backend/api/public/index.php` | Passed. |
| Inline script syntax check for `/verify/` | Passed, 2 scripts checked. |
| Focused deep-link UI check for operator candidate search | Passed, 1 test. |
| `tests/crewportglobal-operator-queue.spec.ts` | Passed, 4 tests. |
| Focused API check for operator candidate search | Passed, 1 test. |
| `git diff --check` | Passed. |

## 7. Remaining Gaps

The following areas are not yet fully verified by the new method:

| Gap | Why it matters | Recommended next action |
|---|---|---|
| Lead / demand entry task | It starts the business process and client responsibility chain. | Verify how imported or newly created demand becomes a visible task. |
| Employer authority setup | Employer-side authority affects who can request crew and receive outputs. | Audit exact company/authority review task link and evidence panel. |
| Vessel context setup | Vessel data affects matching, requirements and service complexity. | Verify vessel-context task generation, target link and safe fields. |
| Seafarer supply intake task execution | Candidate supply is the other side of matching. | Verify seafarer profile completeness tasks open the exact profile/card and have executable review operations. |
| Document and readiness review | Matching must not rely on unverified or exposed sensitive data. | Re-check profile/document task links after the current task model changes. |
| Employer-facing presentation final step | This is a sensitive service output. | Keep guarded; verify only through allow-list/payload and explicit approval tests. |
| Employer feedback/outcome | Needed for service completion and future billing. | Design and verify feedback task after presentation workflow is accepted. |
| Billing / reward basis | Needed for GTC service-fee completion. | Prepare process and runtime design after employer feedback is verified. |
| Retention / next contact | Needed for client lifecycle and repeat sales. | Add later after service completion workflow exists. |
| Inactive historical assignee fallback | Required by the personalized task rule. | Test inactive/blocked user fallback to group queue. |
| Manager reassignment | Needed when an object should move from one responsible employee to another. | Design manager-controlled reassignment after fallback is verified. |

## 8. Proposed Next Work Plan

### Stage 1 - Stabilize task-link execution for all remaining object types

Goal:

```text
Every visible computed task must open a concrete internal object with an executable operation.
```

Work:

1. Verify seafarer profile completeness task links.
2. Verify company verification task links.
3. Verify vessel-context task links if currently generated.
4. Verify vacancy application links after candidate presentation review.
5. Fix only links or workspaces that fail the executable-object rule.

Expected output:

```text
CPG-BIZ-023 - Remaining object task-link execution verification report
```

### Stage 2 - Verify supply-side process steps CF-06 and CF-07

Goal:

```text
Seafarer supply intake and document/readiness review tasks must open the correct profile/source-card/document workspace and must not expose restricted fields.
```

Work:

1. Open actual seafarer profile task from `/team/` or `/verify/`.
2. Confirm the task shows the correct business stage.
3. Confirm the link opens exact profile/card context.
4. Confirm review/correction outcome is inside the workspace.
5. Confirm sensitive fields remain scoped.

Expected output:

```text
CPG-BIZ-024 - Supply-side task execution and data-scope verification report
```

### Stage 3 - Verify demand-side authority and vessel context

Goal:

```text
Employer/company/vessel records must be structured before matching and must produce clear computed tasks.
```

Work:

1. Verify company verification task.
2. Verify employer authority evidence visibility.
3. Verify vessel context task or define controlled gap if the task is not generated yet.
4. Confirm data shown is sufficient for matching but safe for role scope.

Expected output:

```text
CPG-BIZ-025 - Employer authority and vessel-context task verification report
```

### Stage 4 - Verify controlled employer-facing presentation boundary

Goal:

```text
No candidate becomes employer-visible until approved presentation guard and payload allow-list pass.
```

Work:

1. Re-run presentation review task from a real computed task link.
2. Confirm human approval boundary.
3. Confirm forbidden fields stay excluded.
4. Confirm audit actor context.
5. Confirm employer sees only approved minimized payload.

Expected output:

```text
CPG-BIZ-026 - Employer-facing presentation boundary verification report
```

### Stage 5 - Prepare feedback, service completion and billing-basis process

Goal:

```text
After employer-facing presentation, the process must lead to feedback, service result and B2B billing basis.
```

Work:

1. Describe employer feedback states.
2. Define service completion criteria.
3. Define billing handoff evidence.
4. Verify whether current app supports any part of this path.
5. Prepare implementation task only for missing runtime pieces.

Expected output:

```text
CPG-BIZ-027 - Employer feedback, service completion and billing-basis readiness report
```

## 9. Recommended Immediate Next Step

The recommended immediate next step is:

```text
CPG-BIZ-023 - Remaining object task-link execution verification
```

Reason:

1. The current task model is now clear.
2. We already found and fixed a real deep-link defect.
3. Before adding new workflows, every existing computed task must reliably open its exact work object.
4. This prevents the business-process manual from describing steps that are not executable in the portal.

## 10. Current Conclusion

The new methodology is working.

The strongest evidence is that the team found real defects during process verification:

1. competing task actions in the list;
2. task title not acting as the working-object link;
3. missing process-stage visibility;
4. `/team/` task links opening a general list instead of the object;
5. `vacancy_request` deep links opening the queue instead of exact workspace;
6. missing historical executor personalization.

Each defect was corrected, tested and documented.

The verified process area now covers the core matching path from structured crew request through request-supply comparison, internal shortlist draft, internal shortlist approval and candidate presentation review preparation. The next work should close the remaining supply-side, employer authority, vessel, feedback and billing-basis gaps.
