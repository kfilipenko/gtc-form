# CrewPortGlobal — Documentation Register

- Project: CrewPortGlobal.com
- Company: GTC INFORMATION TECHNOLOGY FZ-LLC
- Stage: Stage 1 — Digital Maritime Crew Data and Matching Platform
- Document type: Internal master register
- Format: Markdown
- Version: 0.53
- Status: For internal review

## 1. Purpose of this register

This register defines the first legal, operational, compliance and technical documentation package for CrewPortGlobal.com.

The package is designed for three parallel purposes:

1. Public website publication on CrewPortGlobal.com.
2. Internal use by the GTC IT team.
3. Preparation for future RAKEZ, MOHRE and maritime compliance review.

At Stage 1, CrewPortGlobal is positioned as a digital maritime crew data, documentation and matching platform. The platform does not represent itself as a licensed manning agency or seafarer recruitment agency until required approvals are confirmed.

## 2. Core compliance position

CrewPortGlobal starts inside GTC INFORMATION TECHNOLOGY FZ-LLC as a technology service.

The platform provides:

- digital registration;
- user identity management;
- GTC_USER_ID assignment;
- document collection;
- seafarer profile management;
- shipowner request intake;
- AI-assisted candidate matching;
- workflow automation;
- B2B billing;
- compliance records;
- internal audit trail.

The platform does not charge seafarers recruitment or placement fees.

The platform may offer optional paid services to seafarers only when those services are clearly separated from employment placement and are not a condition for access to job opportunities.

Main revenue is B2B: shipowners, vessel operators, ship managers, crew managers and maritime employers pay for crew request processing, candidate search, verified shortlists, document review and workflow support.

## 3. Publication structure

### 3.1 Public website structure

Service-first public paths (action-first journey):

```text
/
/vacancies/
/vacancies/detail/
/create-profile/
/profile/
/for-seafarers/
/for-employers/
/register/
/register/employer/
/register/vessel/
/employers/
/login/
/trust-safety/
/contact/
/how-it-works/
/legal/terms/
/legal/privacy/
/legal/no-recruitment-fees/
/legal/candidate-agreement/
/legal/shipowner-service-terms/
/legal/complaints/
/legal/cookies/
```

### 3.2 Internal documentation structure

Recommended repository paths:

```text
docs/crewportglobal/
  00_documentation_register.md
  01_project_scope_and_positioning.md
  02_platform_terms_of_service.md
  03_privacy_policy.md
  04_no_recruitment_fees_policy.md
  05_seafarer_candidate_agreement.md
  06_shipowner_service_agreement.md
  07_recruitment_and_matching_policy_mlc_a1_4.md
  08_identity_business_and_vessel_verification_policy.md
  09_aml_sanctions_screening_policy.md
  10_document_verification_policy.md
  11_complaint_handling_procedure.md
  12_data_retention_and_deletion_policy.md
  13_ai_use_and_human_review_policy.md
  14_partner_code_of_conduct.md
  15_billing_refund_policy_b2b.md
  16_seafarer_optional_services_price_list.md
  17_shipowner_onboarding_form.md
  18_seafarer_onboarding_form.md
  19_ra_k_mohre_licensing_request_pack.md
  20_website_start_page_content.md
  21_operational_checklist_domain_dns_ssl_publication.md
  22_identity_and_project_database_architecture.md
  23_public_website_design_system.md
  24_isolated_database_schema_and_registration_flows.md
  25_category_onboarding_matrix.md
  26_database_schema_design_review.md
  27_database_schema_v1_fix_plan.md
  28_database_schema_v2_delta_review.md
  29_test_migration_review_plan.md
  30_split_sql_package_review.md
  31_gtc1_test_migration_execution_plan.md
  32_test_migration_manual_approval_record.md
  33_test_migration_post_execution_report_template.md
  34_migration_planning_audit_trail_index.md
  35_registration_automation_readiness_plan.md
  36_registration_automation_planning_review.md
  37_registration_automation_fix_plan.md
  38_registration_automation_re_review.md
  39_registration_automation_implementation_plan.md
  40_registration_automation_implementation_plan_review.md
  41_registration_automation_technical_task_decomposition.md
  42_registration_automation_decomposition_owner_review.md
  43_increment_1_implementation_ticket_package.md
  44_increment_1_ticket_package_owner_review.md
  45_increment_1_individual_issue_drafts_index.md
  46_increment_1_individual_issue_drafts_owner_review.md
  47_increment_1_github_issue_creation_approval_package.md
  48_architecture_decision_gtc1_app_gtc_agent_openclaw.md
  49_limited_github_issue_draft_package_001_002_004.md
  50_limited_github_issues_001_002_004_review.md
  51_cpg_i1_001_application_shell_implementation_plan.md
  52_cpg_i1_001_application_shell_skeleton_record.md
  53_cpg_i1_001_application_shell_skeleton_owner_review.md
  54_cpg_i1_001_frontend_shell_placeholder_plan.md
  55_cpg_i1_001_frontend_shell_placeholder_owner_review.md
  56_cpg_i1_002_seafarer_registration_route_architecture_plan.md
  57_cpg_i1_002_seafarer_registration_route_architecture_owner_review.md
  58_cpg_i1_001_multilingual_frontend_shell_plan.md
  59_cpg_i1_language_selection_page_record.md
  60_translation_pipeline_rule.md
  61_translation_pipeline_implementation_report.md
  62_build_time_translation_pipeline_plan.md
  63_cpg_i1_013_favicon_publication_record.md
  64_product_site_structure_and_functional_requirements.md
  65_cpg_ops_012_operator_workflow_state_implementation_report.md
  66_cpg_ops_013_operator_review_notes_and_correction_reason_report.md
  67_cpg_ops_014_operator_review_history_panel_report.md
  68_cpg_user_015_create_profile_review_status_and_correction_reason_report.md
  69_international_maritime_application_goal_and_task_backlog.md
  70_context_handoff_and_next_work_plan_2026_05_14.md
  71_cpg_user_016_seafarer_cv_workspace_and_document_metadata_report.md
  72_cpg_ops_015_operator_structured_detail_view_report.md
  73_cpg_ops_016_operator_access_token_boundary_report.md
  74_cpg_emp_006_employer_vacancy_workspace_status_report.md
  75_cpg_mkt_003_vacancy_detail_and_apply_flow_report.md
```

### 3.3 Product governance control

Document 64 is the controlling product-logic baseline for site structure and functional requirements.

Document 69 is the active product-goal and task-backlog baseline for converting CrewPortGlobal from a documentation-heavy public site into an international maritime jobs and crew application.

Document 70 is the current Codex / VS Code handoff note for continuing work safely after context grows too large.

Document 71 records the seafarer CV workspace and document metadata implementation slice.

Document 72 records the operator structured detail view implementation for `/verify/`.

Document 73 records the temporary operator access token boundary for `/verify/` and operator review API routes.

Document 74 records the employer vacancy workspace status implementation for `/post-vacancy/`.

Document 75 records the public vacancy detail page and seafarer apply-to-vacancy implementation.

Mandatory control statement:

1. CrewPortGlobal must be implemented as a practical maritime jobs and crew platform.
2. Action-first user routes take priority over declaration-first page expansion.
3. This governance task must not stop or replace issue #8 implementation priority.

Fixed implementation order for the active stage:

1. database foundation for users, seafarers, employers and vessels;
2. backend API for draft registration creation;
3. connect Register/Create Profile/Post Vacancy forms to backend;
4. save seafarer profile drafts;
5. save employer/company drafts;
6. save vessel drafts;
7. create operator review queue;
8. show real vacancy records only after real data model and workflow are approved;
9. improve public UI after functional paths work;
10. publish updated documentation after implementation results are verified.

## 4. Priority order for drafting

### Phase A — Public trust and compliance foundation

1. 04_no_recruitment_fees_policy.md
2. 01_project_scope_and_positioning.md
3. 03_privacy_policy.md
4. 02_platform_terms_of_service.md
5. 11_complaint_handling_procedure.md

### Phase B — User onboarding documents

6. 05_seafarer_candidate_agreement.md
7. 06_shipowner_service_agreement.md
8. 16_seafarer_optional_services_price_list.md
9. 17_shipowner_onboarding_form.md
10. 18_seafarer_onboarding_form.md

### Phase C — Internal compliance documents

11. 07_recruitment_and_matching_policy_mlc_a1_4.md
12. 08_identity_business_and_vessel_verification_policy.md
13. 09_aml_sanctions_screening_policy.md
14. 10_document_verification_policy.md
15. 12_data_retention_and_deletion_policy.md
16. 13_ai_use_and_human_review_policy.md
17. 14_partner_code_of_conduct.md

### Phase D — Licensing and publication package

18. 15_billing_refund_policy_b2b.md
19. 19_ra_k_mohre_licensing_request_pack.md
20. 20_website_start_page_content.md

## 5. Next drafting sequence

The next document should be 04_no_recruitment_fees_policy.md because it is the central trust and compliance statement for the platform.

After that:

1. 01_project_scope_and_positioning.md
2. 20_website_start_page_content.md
3. 03_privacy_policy.md
4. 02_platform_terms_of_service.md
5. 11_complaint_handling_procedure.md

## 6. Technical publication model on GTC1

Recommended initial deployment model:

```text
/var/www/crewportglobal.com/
  index.html
  legal/
    terms/
    privacy/
    no-recruitment-fees/
    candidate-agreement/
    shipowner-service-terms/
    complaints/
```

Recommended source repository structure:

```text
projects/crewportglobal/
  db/
    migrations/
  public/
    for-shipowners/
    for-seafarers/
  legal/
  docs/
  workflows/
  deploy/
    nginx/
    structure/
```

## Revision history

| Version | Date | Author | Changes |
|---|---|---|---|
| 0.53 | 2026-05-14 | GTC IT / AI Assistant | Added document 75 as CPG-MKT-003 implementation report for public vacancy detail and seafarer apply-to-vacancy flow |
| 0.52 | 2026-05-14 | GTC IT / AI Assistant | Added document 74 as CPG-EMP-006 implementation report for employer vacancy workspace status, draft prefill and reviewed publication state on /post-vacancy/ |
| 0.51 | 2026-05-14 | GTC IT / AI Assistant | Added document 73 as CPG-OPS-016 implementation report for the temporary operator access token boundary on /verify/ and operator review API routes |
| 0.50 | 2026-05-14 | GTC IT / AI Assistant | Added document 72 as CPG-OPS-015 implementation report for structured operator detail sections on /verify/ |
| 0.49 | 2026-05-14 | GTC IT / AI Assistant | Added document 71 as CPG-USER-016 implementation report for the seafarer CV workspace, document readiness metadata persistence and verification evidence |
| 0.48 | 2026-05-14 | GTC IT / AI Assistant | Added document 70 as the Codex / VS Code context handoff and next-work continuation note |
| 0.47 | 2026-05-13 | GTC IT / AI Assistant | Added document 69 as the active product goal and task backlog for the international maritime application build-out |
| 0.46 | 2026-05-13 | GTC IT / AI Assistant | Added document 68 as CPG-USER-015 implementation report for candidate-facing create-profile review status labels and conditional correction reason display with EN/RU texts and prefill regression coverage |
| 0.45 | 2026-05-13 | GTC IT / AI Assistant | Added document 67 as CPG-OPS-014 implementation report covering backend operator_review_history payload (last 20 audit events), /verify history panel rendering and API/UI validation evidence |
| 0.44 | 2026-05-13 | GTC IT / AI Assistant | Added document 66 as CPG-OPS-013 implementation report for operator review notes/correction reason, backend note validation, audit payload review_note, /verify note UX and test evidence |
| 0.43 | 2026-05-13 | GTC IT / AI Assistant | Added document 65 as the CPG-OPS-012 implementation and verification report (operator workflow-state actions and audit trail with full API/UI test evidence) |
| 0.42 | 2026-05-13 | GTC IT / AI Assistant | Added document 64 as the controlling product site-structure and functional-requirements baseline, aligned public path model to action-first flows, and recorded fixed service-first implementation order that must not replace issue #8 |
| 0.41 | 2026-05-13 | GTC IT / AI Assistant | Added document 63 as the team-facing favicon publication record covering source asset, generated favicon outputs, live deploy tree sync and validation expectations |
| 0.40 | 2026-05-12 | GTC IT / AI Assistant | Added document 62 for the approved build-time translation pipeline plan and skeleton, and aligned the methodology set with the new i18n catalog seed path under projects/crewportglobal/i18n/ |
| 0.39 | 2026-05-12 | GTC IT / AI Assistant | Added document 61 as the operational implementation report for the current translation methodology and updated document 60 to act as the canonical website text-translation methodology record with mandatory synchronized updates on methodology changes |
| 0.38 | 2026-05-12 | GTC IT / AI Assistant | Added document 60 to formalize the translation pipeline rule: English canonical source, shared runtime reuse, English fallback for missing non-English keys, rebuild through the public generator wrapper, and mandatory human review for legal, consent, no-fee and seafarer-facing publication text |
| 0.37 | 2026-05-12 | GTC IT / AI Assistant | Updated document 59 to record the same-page header language accordion or dropdown as the primary selector flow, with browser-local dictionary switching and language.html retained only as fallback or reference |
| 0.36 | 2026-05-12 | GTC IT / AI Assistant | Added static language selection page record covering top-right global selector placement, browser-local language state and translation-dictionary-driven UI text for the first multilingual frontend prototype |
| 0.35 | 2026-05-12 | GTC IT / AI Assistant | Refined multilingual frontend shell plan with top-right global language-selector placement, whole-shell language-state behavior and local persistence expectations for the first static prototype |
| 0.34 | 2026-05-12 | GTC IT / AI Assistant | Added CPG-I1-001 multilingual frontend shell plan covering mandatory and additional language sets, language selector rules, translation dictionaries and human review requirements for sensitive translated content |
| 0.33 | 2026-05-11 | GTC IT / AI Assistant | Added owner review for CPG-I1-002 seafarer registration route architecture plan confirming planning-only status, positive architecture baseline, seafarer-only boundary, terminal human-review state and consent dependency |
| 0.32 | 2026-05-11 | GTC IT / AI Assistant | Added CPG-I1-002 seafarer registration route architecture plan covering route model, allowed Increment 1 states, consent dependency, human-review terminal state and OpenClaw separation |
| 0.31 | 2026-05-11 | GTC IT / AI Assistant | Added owner review for CPG-I1-001 frontend shell placeholder plan confirming planning-only status, ADR 48 preservation and OpenClaw separation |
| 0.30 | 2026-05-11 | GTC IT / AI Assistant | Added CPG-I1-001 frontend shell placeholder plan covering pages, interface zones, shell states, route and consent handoffs, accessibility, privacy/security and OpenClaw separation |
| 0.29 | 2026-05-11 | GTC IT / AI Assistant | Added owner review confirming CPG-I1-001 application shell skeleton remains placeholder-only, ADR 48-aligned and ready for the next project-owner approval decision |
| 0.28 | 2026-05-11 | GTC IT / AI Assistant | Added CPG-I1-001 application shell directory skeleton record and README placeholders only; implementation execution remains not approved |
| 0.27 | 2026-05-10 | GTC IT / AI Assistant | Added CPG-I1-001 application shell implementation plan for project-owner review under ADR 48 baseline and execution restrictions |
| 0.26 | 2026-05-10 | GTC IT / AI Assistant | Added review of live GitHub issues #3, #4 and #5 confirming ADR 48 alignment and readiness for project-owner implementation approval decision |
| 0.25 | 2026-05-10 | GTC IT / AI Assistant | Added limited GitHub issue draft package for CPG-I1-001, CPG-I1-002 and CPG-I1-004 after ADR 48 baseline approval; full 12-issue creation postponed |
| 0.24 | 2026-05-10 | GTC IT / AI Assistant | Added ADR 48 fixing runtime placement: GTC1 for website app and SQL, GTC-AGENT for OpenClaw-assisted operator support |
| 0.23 | 2026-05-10 | GTC IT / AI Assistant | Added GitHub issue creation approval package and checklist for project-owner decision on Increment 1 issue draft creation |
| 0.22 | 2026-05-10 | GTC IT / AI Assistant | Added owner review confirming Increment 1 repository issue drafts are ready to convert into GitHub implementation issue drafts |
| 0.21 | 2026-05-10 | GTC IT / AI Assistant | Added Increment 1 individual issue drafts index and 12 draft issue files for CPG-I1-001 through CPG-I1-012 |
| 0.20 | 2026-05-10 | GTC IT / AI Assistant | Added owner review confirming Increment 1 ticket package is ready to convert into individual implementation issue drafts |
| 0.19 | 2026-05-10 | GTC IT / AI Assistant | Added Increment 1 implementation ticket package and planning backlog with draft tickets CPG-I1-001 through CPG-I1-012 |
| 0.18 | 2026-05-10 | GTC IT / AI Assistant | Added decomposition owner review confirming readiness to create implementation tickets |
| 0.17 | 2026-05-10 | GTC IT / AI Assistant | Added technical task decomposition for Increment 1 seafarer-only prototype planning |
| 0.16 | 2026-05-10 | GTC IT / AI Assistant | Added implementation-plan review confirming architecture consistency and readiness for technical task decomposition |
| 0.15 | 2026-05-10 | GTC IT / AI Assistant | Added registration automation implementation plan with dedicated website application, internal service modules and positive architecture baseline |
| 0.14 | 2026-05-10 | GTC IT / AI Assistant | Added registration automation re-review with updated verdict: ready for implementation planning |
| 0.13 | 2026-05-10 | GTC IT / AI Assistant | Added registration automation fix plan and blocker-closing planning updates for re-review |
| 0.12 | 2026-05-10 | GTC IT / AI Assistant | Added registration automation planning review and implementation-planning readiness verdict |
| 0.11 | 2026-05-10 | GTC IT / AI Assistant | Added registration automation readiness planning document and workflow planning artifacts |
| 0.10 | 2026-05-10 | GTC IT / AI Assistant | Added migration-planning audit trail index for documents 24-33 |
| 0.9 | 2026-05-10 | GTC IT / AI Assistant | Added post-execution report template for future non-production test migration sessions |
| 0.8 | 2026-05-10 | GTC IT / AI Assistant | Added manual approval record template for future non-production test migration review |
| 0.7 | 2026-05-10 | GTC IT / AI Assistant | Added planning-only GTC1 test migration execution plan with approval gate, stop conditions and rollback outline |
| 0.6 | 2026-05-10 | GTC IT / AI Assistant | Added split SQL package consistency review and execution-plan discussion readiness verdict |
| 0.5 | 2026-05-10 | GTC IT / AI Assistant | Added split SQL planning package review plan and manual approval gate for any future execution discussion |
| 0.4 | 2026-05-10 | GTC IT / AI Assistant | Added v2 delta review and test-migration-review readiness assessment |
| 0.3 | 2026-05-10 | GTC IT / AI Assistant | Added schema design review follow-up and v1 fix-plan documentation |
| 0.2 | 2026-05-10 | GTC IT / AI Assistant | Added isolated database schema planning docs and project-local SQL planning path |
| 0.1 | 2026-05-08 | GTC IT / AI Assistant | Initial documentation register created |
