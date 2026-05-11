# CrewPortGlobal — Documentation Register

- Project: CrewPortGlobal.com
- Company: GTC INFORMATION TECHNOLOGY FZ-LLC
- Stage: Stage 1 — Digital Maritime Crew Data and Matching Platform
- Document type: Internal master register
- Format: Markdown
- Version: 0.1 draft
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

Recommended public paths:

```text
/
/about/
/how-it-works/
/for-shipowners/
/for-seafarers/
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
```

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
| 0.31 | 2026-05-11 | GTC IT / AI Assistant | Added owner review for CPG-I1-001 frontend shell placeholder plan confirming planning-only status, ADR 48 preservation, OpenClaw separation and n8n exclusion |
| 0.30 | 2026-05-11 | GTC IT / AI Assistant | Added CPG-I1-001 frontend shell placeholder plan covering pages, interface zones, shell states, route and consent handoffs, accessibility, privacy/security, OpenClaw separation and n8n exclusion |
| 0.29 | 2026-05-11 | GTC IT / AI Assistant | Added owner review confirming CPG-I1-001 application shell skeleton remains placeholder-only, ADR 48-aligned and ready for the next project-owner approval decision |
| 0.28 | 2026-05-11 | GTC IT / AI Assistant | Added CPG-I1-001 application shell directory skeleton record and README placeholders only; implementation execution remains not approved |
| 0.27 | 2026-05-10 | GTC IT / AI Assistant | Added CPG-I1-001 application shell implementation plan for project-owner review under ADR 48 baseline and execution restrictions |
| 0.26 | 2026-05-10 | GTC IT / AI Assistant | Added review of live GitHub issues #3, #4 and #5 confirming ADR 48 alignment and readiness for project-owner implementation approval decision |
| 0.25 | 2026-05-10 | GTC IT / AI Assistant | Added limited GitHub issue draft package for CPG-I1-001, CPG-I1-002 and CPG-I1-004 after ADR 48 baseline approval; full 12-issue creation postponed |
| 0.24 | 2026-05-10 | GTC IT / AI Assistant | Added ADR 48 fixing runtime placement: GTC1 for website app and SQL, GTC-AGENT for OpenClaw, n8n excluded |
| 0.23 | 2026-05-10 | GTC IT / AI Assistant | Added GitHub issue creation approval package and checklist for project-owner decision on Increment 1 issue draft creation |
| 0.22 | 2026-05-10 | GTC IT / AI Assistant | Added owner review confirming Increment 1 repository issue drafts are ready to convert into GitHub implementation issue drafts |
| 0.21 | 2026-05-10 | GTC IT / AI Assistant | Added Increment 1 individual issue drafts index and 12 draft issue files for CPG-I1-001 through CPG-I1-012 |
| 0.20 | 2026-05-10 | GTC IT / AI Assistant | Added owner review confirming Increment 1 ticket package is ready to convert into individual implementation issue drafts |
| 0.19 | 2026-05-10 | GTC IT / AI Assistant | Added Increment 1 implementation ticket package and planning backlog with draft tickets CPG-I1-001 through CPG-I1-012 |
| 0.18 | 2026-05-10 | GTC IT / AI Assistant | Added decomposition owner review confirming readiness to create implementation tickets |
| 0.17 | 2026-05-10 | GTC IT / AI Assistant | Added technical task decomposition for Increment 1 seafarer-only prototype planning |
| 0.16 | 2026-05-10 | GTC IT / AI Assistant | Added implementation-plan review confirming n8n exclusion and readiness for technical task decomposition |
| 0.15 | 2026-05-10 | GTC IT / AI Assistant | Added registration automation implementation plan with dedicated website application, internal service modules and explicit n8n exclusion |
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