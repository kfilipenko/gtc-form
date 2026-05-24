# CrewPortGlobal — Documentation Register

- Project: CrewPortGlobal.com
- Company: GTC INFORMATION TECHNOLOGY FZ-LLC
- Stage: Stage 1 — Digital Maritime Crew Data and Matching Platform
- Document type: Internal master register
- Format: Markdown
- Version: 1.59
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
/register/confirm/
/register/next/
/register/authorization/
/register/authorization/selected/
/register/authorization/seafarer-specialist/
/register/authorization/buyer-employer/
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
  76_cpg_ops_017_vacancy_application_operator_review_report.md
  77_cpg_emp_007_employer_presented_candidate_pipeline_report.md
  78_cpg_user_017_seafarer_application_history_report.md
  79_cpg_emp_008_employer_shortlist_actions_report.md
  80_cpg_team_portal_roles_and_operations.md
  81_cpg_emp_009_employer_candidate_followup_note_report.md
  82_cpg_user_018_seafarer_application_withdrawal_report.md
  83_cpg_mkt_004_application_documents_navigation_report.md
  84_cpg_ops_018_operator_portal_navigation_and_role_lanes_report.md
  85_cpg_mkt_005_document_application_return_menu_fix_report.md
  86_cpg_mkt_006_shared_navigation_component_report.md
  87_cpg_ops_019_operator_role_lane_counts_report.md
  88_cpg_access_control_admin_console_plan.md
  89_cpg_access_002_backend_access_guard_foundation_report.md
  90_cpg_access_003_operator_queue_permission_matrix_report.md
  91_cpg_access_004_operator_queue_capability_contract_report.md
  92_cpg_access_005_identity_context_foundation_report.md
  93_cpg_access_006_sql_draft_static_review_report.md
  94_cpg_access_007_admin_email_code_foundation_report.md
  95_cpg_access_008_admin_email_code_contract_and_skeleton_report.md
  96_cpg_access_009_admin_email_code_storage_adapter_report.md
  97_cpg_access_010_admin_email_code_pg_adapter_static_query_report.md
  98_cpg_access_011_disabled_admin_email_code_public_routes_report.md
  99_cpg_access_012_admin_email_code_storage_factory_report.md
  100_cpg_access_013_admin_email_code_email_delivery_contract_report.md
  101_cpg_access_014_admin_email_delivery_adapter_report.md
  102_cpg_access_015_admin_email_delivery_smtp_smoke_test_report.md
  103_cpg_access_016_project_owner_bootstrap_and_admin_access_activation_report.md
  104_cpg_access_017_project_owner_console_view_report.md
  105_cpg_access_018_admin_console_contrast_and_owner_email_lock_report.md
  106_cpg_access_019_group_based_access_control_and_team_entry_page_report.md
  107_cpg_access_020_project_owner_user_group_membership_management_report.md
  108_cpg_access_021_admin_audit_panel_collapse_report.md
  109_cpg_mkt_007_public_navigation_registration_cta_report.md
  110_cpg_auth_001_public_person_registration_email_confirmation_report.md
  111_cpg_auth_002_authorization_request_cards_frontend_report.md
  112_cpg_doc_022_protected_upload_storage_clamav_report.md
  113_cpg_doc_023_protected_document_review_queue_report.md
  114_cpg_doc_024_document_correction_task_replacement_report.md
  115_cpg_cabinet_025_user_personal_cabinet_dashboard_report.md
  116_cpg_cabinet_026_account_menu_login_registration_shell_report.md
  117_cpg_auth_003_password_credential_session_report.md
  118_cpg_auth_004_email_verification_activation_report.md
  119_cpg_deploy_001_public_live_sync_automation_report.md
  120_cpg_deploy_002_public_live_systemd_timer_activation_report.md
  121_cpg_design_001_unified_responsive_theme_system.md
  122_cpg_design_002_theme_switcher_and_dark_functional_foundation_report.md
  123_cpg_design_003_compact_responsive_workbench_report.md
  124_cpg_cabinet_027_profile_photo_protected_upload_report.md
  125_cpg_ref_001_seafarer_reference_catalog_foundation_report.md
  126_cpg_ref_002_reference_catalog_publication_api_report.md
  127_cpg_ref_003_admin_reference_catalog_publication_console_report.md
  128_cpg_ref_004_full_reference_catalog_publication_report.md
  129_cpg_ref_005_public_form_reference_catalog_bindings_report.md
  130_cpg_ref_006_seafarer_workspace_extended_form_report.md
  131_cpg_seafarer_001_structured_workspace_schema_report.md
  132_cpg_seafarer_002_workspace_json_to_structured_bridge_report.md
  133_cpg_seafarer_003_cabinet_structured_workspace_view_report.md
  134_cpg_seafarer_004_cabinet_completeness_tasks_report.md
  135_cpg_seafarer_005_structured_workspace_section_api_contract_report.md
  136_cpg_seafarer_006_create_profile_section_save_frontend_report.md
  137_cpg_seafarer_007_document_readiness_section_save_report.md
  138_cpg_seafarer_008_operator_structured_workspace_visibility_report.md
  139_cpg_seafarer_009_operator_card_correction_tasks_report.md
  140_cpg_seafarer_010_workspace_card_review_state_persistence_report.md
  141_cpg_seafarer_011_operator_per_card_review_actions_report.md
  142_cpg_seafarer_011_operator_per_card_review_actions_test_report.md
  143_cpg_seafarer_012_excel_card_field_alignment_audit_report.md
  144_cpg_seafarer_013_excel_aligned_form_cards_report.md
  145_cpg_seafarer_014_excel_source_truth_precheck_report.md
  146_cpg_seafarer_015_excel_source_review_cards_report.md
  147_cpg_seafarer_016_repeated_excel_source_rows_report.md
  148_cpg_seafarer_017_agent_execution_guide.md
  149_cpg_seafarer_017_data_minimization_visibility_report.md
  151_cpg_seafarer_018_agent_execution_guide.md
  152_cpg_seafarer_018_approval_consent_medical_report.md
  153_cpg_seafarer_018_endpoint_guard_consent_addendum.md
  154_cpg_seafarer_019_forms_fields_database_inventory_report.md
  155_cpg_seafarer_019_agent_execution_guide.md
  156_cpg_seafarer_020_agent_execution_guide.md
  157_cpg_seafarer_020_supply_demand_matching_model_report.md
  158_cpg_seafarer_021_demand_side_normalization_plan.md
  159_cpg_seafarer_021_agent_execution_guide.md
  160_cpg_demand_001_canonical_field_contract.md
  161_cpg_demand_001_agent_execution_guide.md
  162_cpg_demand_002_schema_api_implementation_plan.md
  163_cpg_demand_002_agent_execution_guide.md
  164_cpg_demand_003_reference_catalog_schema_readiness_gate.md
  165_cpg_demand_003_agent_execution_guide.md
  166_cpg_demand_004_existing_db_excel_catalog_reconciliation.md
  167_cpg_demand_004_agent_execution_guide.md
  168_cpg_demand_005_additive_matching_foundation_report.md
  169_cpg_demand_006_read_only_candidate_search_report.md
  170_cpg_demand_007_operator_candidate_search_ui_report.md
  171_cpg_demand_008_candidate_search_input_expansion_report.md
  172_cpg_demand_009_structured_demand_requirements_report.md
  173_cpg_demand_010_structured_requirement_candidate_search_report.md
  174_cpg_demand_011_operator_structured_blocker_ui_report.md
  175_cpg_demand_012_internal_shortlist_draft_design.md
  176_cpg_demand_013_internal_shortlist_draft_storage_guard_report.md
  177_cpg_demand_014_operator_shortlist_draft_ui_report.md
  178_cpg_demand_015_internal_shortlist_approval_workflow_report.md
  179_cpg_demand_016_internal_shortlist_to_review_application_bridge_report.md
  seafarer_application_mapping/
    source_card_field_coverage_matrix.md
    source_card_visibility_matrix.md
  business_processes/
    00_business_process_register.md
    01_business_declaration_client_lifecycle_and_operating_model.md
    02_role_instructions_for_team_and_ai_agents.md
    03_client_cards_for_employer_demand_and_seafarer_supply_model.md
    04_card_field_dictionary_and_workflow_states.md
    05_personal_cabinet_and_scoped_visibility_requirements.md
    06_scoped_visibility_and_access_check_contract.md
    07_personal_cabinet_ui_layout_and_component_requirements.md
    08_client_registration_and_interaction_procedure.md
    09_public_site_and_authenticated_navigation_transition_plan.md
    10_document_upload_storage_and_review_procedure.md
    11_seafarer_field_dictionary_and_reference_catalog_alignment.md
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

Document 76 records operator review visibility and decisions for seafarer vacancy applications.

Document 77 records employer-side visibility for operator-presented vacancy candidates in `/post-vacancy/`.

Document 78 records seafarer-side vacancy application history visibility in `/create-profile/`.

Document 79 records employer shortlist actions for operator-presented candidates in `/post-vacancy/`.

Document 80 records the CrewPortGlobal team portal roles and operations model, including internal operator roles, role separation, human-review checkpoints, no-fee seafarer control, employer-side control, audit expectations and future operator portal requirements.

Document 81 records employer follow-up notes for operator-presented candidates in `/post-vacancy/`.

Document 82 records seafarer-side vacancy application withdrawal and not-available actions in `/create-profile/`.

Document 83 records the frontend-only navigation separation between functional application pages and documentary pages, including the future rule that application pages use an Application menu with a Documents dropdown and documentary pages use a Documents menu with a direct Application return link and a Functional pages dropdown.

Document 84 records the frontend-only operator portal navigation and role-lane separation for `/verify/` under the document 80 role model.

Document 85 records the document-page Application return menu fix: `Application` is a direct link back to `/`, while functional page links live under a separate `Functional pages` dropdown.

Document 86 records the shared frontend navigation component that centralizes Application, Documents and Operator menu rendering in `projects/crewportglobal/public/assets/crewportglobal-navigation.js`.

Document 87 records operator role-lane queue counts on `/verify/` and in the shared Operator role menu, preserving document 80 role separation while keeping counts frontend-only and separate from access control.

Document 88 records the CrewPortGlobal access-control and admin-console plan, including the User -> Group -> Role -> Permission -> Scope model, administrative access console `/admin/access/`, email one-time-code protection for administrative access, access audit requirements and phased implementation order for replacing the temporary operator-token model with account-based permission enforcement.

Document 89 records the Phase 2 backend access guard foundation: isolated PHP permission helpers, operator queue permission mapping, access-audit helper preparation and tests, without wiring runtime enforcement or replacing the temporary operator token.

Document 90 records the explicit operator queue permission matrix contract, including queue-scoped view/action requirements and static tests that validate the matrix against the access-control SQL draft seed permissions before runtime enforcement is wired.

Document 91 records the operator queue capability contract, including backend `operator_access` permission/scope metadata, temporary-token compatibility mode and `/verify/` action-button disabling for future permission-checked responses.

Document 92 records the backend identity-context foundation, including anonymous, temporary-operator-token, future account-session and future admin-session boundaries, with the rule that the shared temporary operator token is not a named user identity and cannot load role permissions.

Document 93 records the static review control for the access-control SQL draft, including no-DB validation of required tables, indexes, seed groups, seed roles, seed permissions and representative role-permission mappings before any future approved non-production migration application.

Document 94 records the admin email-code backend foundation, including one-time code generation, hashing, verification, expiry, attempt-limit helpers, admin-session TTL helpers and email message payload generation before runtime admin endpoints, email sending or admin sessions are enabled.

Document 95 records the admin email-code endpoint contract and disabled-by-default request/verify skeletons, including OpenAPI paths for future `/api/v1/admin/access/email-code/request` and `/api/v1/admin/access/email-code/verify` routes without enabling public runtime behavior.

Document 96 records the admin email-code storage adapter contract, including hash-only code storage, attempt counting, single-use verification, admin session record creation and audit event boundaries through an in-memory test adapter only, without wiring PostgreSQL or public admin routes.

Document 97 records the admin email-code PostgreSQL adapter static query design, including the callable-query storage adapter, parameterized SQL for future admin user eligibility, code storage, attempt counting, session creation and audit event writes, with fake-executor tests only and no database connection.

Document 98 records the disabled public route wiring for admin email-code request and verify endpoints, including explicit public route and flow feature flags, default HTTP 503 disabled responses before JSON parsing, method controls and local HTTP smoke verification without database, email or admin-session activation.

Document 99 records the admin email-code storage factory contract, including disabled-by-default storage mode, explicit PostgreSQL mode selection, factory status responses, query-executor injection and tests confirming public routes do not include or call the storage factory before runtime activation is approved.

Document 100 records the admin email-code email delivery contract, including disabled-by-default delivery mode, test-only capture mode, safe delivery summaries that do not expose clear codes, and tests confirming public routes do not include or call email delivery before runtime activation is approved.

Document 101 records the admin email delivery adapter preparation for the approved CrewPortGlobal sender mailbox, including Timeweb SMTP environment keys, disabled-by-default behavior, configuration validation, safe message construction, no-secret controls and no-real-send verification.

Document 102 records the controlled server-side SMTP smoke-test for admin email-code delivery, including protected `/etc/crewportglobal/admin-access.env` loading, explicit send-ready execution, safe result reporting, no-secret controls and confirmation that public admin routes remain disconnected from runtime email sending.

Document 103 records the controlled GTC1 bootstrap of `kfilipenko@gtchain.io` as the first CrewPortGlobal Project Owner, including backup before migration 006, access-control migration application, `platform_owners -> project_owner` membership, audit event creation, protected admin access runtime flags, email-code delivery to the owner address and `/admin/access/` live entry verification.

Document 104 records the first minimal `/admin/access/` Project Owner console view, including active admin-session summary, read-only display of current user, groups, roles, effective permissions and recent access audit events, plus logout / session revoke without user, group or role editing.

Document 105 records the `/admin/access/` contrast/readability correction and the temporary bootstrap owner e-mail lock used during the first live console test. The contrast correction remains active; the e-mail lock was superseded by document 106 when Issue #10 moved normal access to group membership.

Document 106 records Issue #10 group-based access correction: creation/confirmation of the `owners` and `cpg_team` groups, moving Project Owner access to `owners -> project_owner`, removing the normal direct personal-email rule, adding the protected `/team/` entry page and protecting internal team links through group-checked sessions.

Document 107 records the first writable Project Owner access-management console slice, including user creation/confirmation, adding users to assignable internal/administration groups, management API endpoints, audit events and the boundary that group work pages are a later stage.

Document 108 records the `/admin/access/` usability correction that makes the audit panel collapsed by default while preserving click-to-open access to recent audit events, existing audit data loading and all admin access-control boundaries.

Business Process Register 0.1 starts a separate CrewPortGlobal business-process documentation block for CPG-BIZ documents. BP-001 records Issue #11 / CPG-BIZ-018: employer-side primary payer declaration, no-fee seafarer boundary, client lifecycle, `Tasks` and `My clients` working lists, SLA color states, client-card automation and the six working-group operating model.

Business Process Register 0.2 adds BP-002 for Issue #12 / CPG-BIZ-019. BP-002 records role instructions for the six working groups and future AI agents, including Tasks / My clients behavior, client visibility, required client-card updates, SLA colors, handoff rules, escalation, revenue/no-fee boundaries and AI-agent decision limits.

Business Process Register 0.3 adds BP-003 for Issue #13 / CPG-BIZ-020. BP-003 records the practical registration, authentication, authorization and card model for employer-side demand and seafarer-side supply, including physical person registration, service account authentication, scoped authority evidence, visibility by card relationship and reviewed candidate recommendation logic.

Business Process Register 0.4 adds BP-004. BP-004 records the card field dictionary, workflow states, events, task triggers, relationship scopes and future database/API requirements for the BP-003 card model, preserving registration/authentication/authorization separation and scoped record visibility.

Business Process Register 0.5 adds BP-005. BP-005 records personal cabinet assembly and scoped visibility requirements, including cabinet sections, visibility reasons, action scopes, task and My clients behavior, future cabinet API requirements and acceptance criteria that prevent broad record access from group membership alone.

Business Process Register 0.6 adds BP-006. BP-006 records the scoped visibility and access-check contract for future APIs, including decision inputs/outputs, record visibility, field filtering, action authorization, audit obligations, AI context limits and the standard presentation rule that `Мои задачи` is always the first open card while all other cards are collapsed by default.

Business Process Register 0.7 adds BP-007. BP-007 records the personal cabinet UI layout and component requirements, including first-time registration entry, card order, collapsible card behavior, badges, task-first layout, forms, empty states, responsive layout and interaction rules for future implementation.

Business Process Register 0.8 adds BP-008. BP-008 records the client registration and interaction procedure, including public-site entry, physical person registration, service-account authentication, intended path selection, seafarer and employer-side flows, internal team/review interaction and the transition rule that public pages provide general information while functional pages and menus are generated after login by scoped access context.

Business Process Register 0.9 adds BP-009. BP-009 records the public site and authenticated navigation transition plan, including public menu simplification, authenticated menu generation, route transition behavior, direct URL safety, protected team/admin navigation, implementation phases and verification requirements before frontend implementation.

Business Process Register 1.0 adds BP-010 for Issue #14 / CPG-DOC-021. BP-010 records the document upload, protected storage and review procedure, including seafarer, employer and future vessel document categories, server-only storage folders, metadata model, file limits, antivirus scanning, replacement behavior, scoped visibility and implementation decisions required before the first upload endpoint.

Business Process Register 1.1 adds BP-011. BP-011 records the seafarer Excel field dictionary and reference catalog alignment, including private source handling, workbook sheet inventory, seafarer workspace card plan, reference dictionaries, future database/API slices and controlled publication order.

Document 109 records the frontend-only BP-009 implementation slice that simplifies public and document navigation, removes public Create Profile / Post Vacancy navigation exposure and routes public functional CTAs to Login / Registration while preserving direct URLs.

Document 110 records the first public registration/authentication implementation slice: `/register/` creates or confirms the physical person/user record, sends a protected SMTP email confirmation link, confirms `email_verified_at`, creates the email auth identity and routes the user to `/register/next/` without assigning roles or broad visibility.

Document 111 records the frontend-only authorization-card request slice: `/register/authorization/` now acts only as the authorization-form selection page, selected forms route to `/register/authorization/selected/`, and each detailed form lives on its own page (`/register/authorization/seafarer-specialist/` and `/register/authorization/buyer-employer/`) with status-request fields and document upload controls prepared for future backend storage. Phone verification remains marked as `следует настроить`, and saving drafts does not grant groups, roles, visibility or right to act.

Document 112 records the CPG-DOC-022 protected document upload storage and ClamAV scanning implementation, including migration 007 for uploaded document metadata, protected server storage outside public web root, quarantine-to-scan-to-protected flow, seafarer and employer upload endpoints, frontend upload sections, ClamAV clean/EICAR verification, security checks and test results.

Document 113 records the CPG-DOC-023 protected document review queue and authorized reviewer file access implementation, including clean-only document review queue metadata, operator/team protected download endpoint, review decision endpoint, document view and decision audit events, `/team/documents/` UI and tests confirming infected, blocked and unscanned documents are not reviewable.

Document 114 records the CPG-DOC-024 user-facing document correction task and replacement upload implementation, including computed correction tasks from `uploaded_documents`, clear Upload replacement actions on `/create-profile/` and `/post-vacancy/`, clean replacement task closure, unsafe replacement task persistence and UI/API tests for seafarer and employer flows.

Document 115 records the CPG-CABINET-025 user personal cabinet dashboard MVP implementation, including `/cabinet/`, task-first layout, collapsed-by-default cabinet cards, User summary, My tasks, My documents, profile/request status, service-area capability links, next contact/support action, document correction replacement flow and focused UI/API verification.

Document 116 records the CPG-CABINET-026 account menu implementation, including the top-right Account / Login dropdown, separation of Registration and Login actions, removal of Login / Register from the main public navigation, Path B password-login-unavailable shell based on verified auth gaps, cabinet avatar/profile placeholder and focused navigation/cabinet UI verification.

Document 117 records the CPG-AUTH-003 password credential and user session foundation, including `user_credentials`, `user_sessions`, password-hash registration, login, logout, `auth/me`, HttpOnly SameSite=Lax session cookies, authenticated `/cabinet/` access without `draft_id`, account-menu profile state and preserved draft fallback.

Document 118 records the CPG-AUTH-004 email verification and account activation foundation, including `email_verification_tokens`, hash-only verification tokens, `email_verification_status`, send/resend/verify endpoints, cabinet email-verification tasks, account-menu verified/unverified status and preserved password-session behavior.

Document 119 records the CPG-DEPLOY-001 public live sync automation control, including the repository-to-live-root publication gap, the dedicated frontend/public deploy script, rsync safety controls, dry-run and smoke-check commands, and recommended automatic trigger options for systemd timer or GitHub Actions SSH deployment.

Document 120 records the CPG-DEPLOY-002 activation of the server-side systemd timer for automatic public/frontend live synchronization, including installed unit names, schedule, runtime user, deploy environment, safety boundaries and operational commands.

Document 121 records the CPG-DESIGN-001 unified responsive theme system, including the decision to use one CrewPortGlobal design system with Dark Maritime and Light Work themes, compact typography, responsive behavior for mobile/tablet/desktop, shared component standards and implementation phases for public pages, document pages, user cabinet, team cabinet and admin console.

Document 122 records the CPG-DESIGN-002 first implementation slice for the unified theme system, including the shared header theme switcher, Dark Maritime / Light Work / Auto modes, localStorage persistence, document-page light overrides, functional-page dark foundation, navigation layering fix and focused Playwright verification.

Document 123 records the CPG-DESIGN-003 compact responsive workbench implementation slice, including compact typography and spacing, no-negative-letter-spacing correction, shared theme switcher on cabinet/team/admin workbench pages, Dark Maritime overrides for cabinet/admin/team, mobile overflow prevention and focused Playwright verification.

Document 124 records the CPG-CABINET-027 protected profile photo upload implementation, including `user_profile_photos`, authenticated profile photo upload endpoints, 5 MB JPG/PNG/WEBP limits, ClamAV scan before use, protected server storage outside public web root, owner-session image delivery, safe `auth/me` metadata and cabinet/account-menu avatar rendering.

Document 125 records the CPG-REF-001 seafarer reference catalog foundation, including `reference_catalogs`, `reference_catalog_values`, the private Excel `DROPDOWN_LISTS` importer, generated private review artifacts, pending-owner-review publication boundary and the rule that unreviewed catalog values are not exposed through UI/API.

Document 126 records the CPG-REF-002 reference catalog publication API implementation, including `GET /api/v1/reference-catalogs`, Project Owner protected catalog review/publication endpoints, the pending-owner-review seed import into the database, public-only-published visibility rules, access audit for publication changes and focused API verification that unpublished values are not exposed.

Document 127 records the CPG-REF-003 admin reference catalog publication console, including the `/admin/access/` Reference catalogs section, summary counts, catalog queue, value inspection, owner audit note, catalog-level and selected-value publication actions, and focused UI verification that selected-value publication calls the protected endpoint.

Document 128 records the CPG-REF-004 full reference catalog publication, including all 24 published catalogs, 1180 public values, source Excel completeness verification, access-audit event and readiness boundary before public form bindings.

Document 129 records the CPG-REF-005 public form reference catalog bindings, including the shared frontend catalog helper, datalist bindings for seafarer rank/vessel preferences and employer vacancy rank/vessel type, public-only API usage, fallback behavior and form-binding verification.

Document 130 records the CPG-REF-006 seafarer workspace extended form implementation, including additional collapsible `/create-profile/` cards, published reference catalog bindings, `document_metadata.seafarer_workspace` persistence, backend list normalization and the boundary that matching-publication preference does not automatically expose a candidate.

Document 131 records the CPG-SEAFARER-001 structured seafarer workspace schema implementation, including migration 012, normalized seafarer card tables, reference catalog links, uploaded-document links, review-state fields, sensitive medical separation and controlled publication snapshot boundaries.

Document 132 records the CPG-SEAFARER-002 seafarer workspace JSON-to-structured-records bridge, including backend sync from `document_metadata.seafarer_workspace`, structured workspace API summary, migration readiness guard, reference catalog value resolution and the no-automatic-publication boundary.

Document 133 records the CPG-SEAFARER-003 cabinet structured seafarer workspace view, including the collapsed-by-default `Seafarer workspace` cabinet card, structured section rendering, draft-payload/API fallback data source, English/Russian i18n keys and no-publication boundary.

Document 134 records the CPG-SEAFARER-004 cabinet seafarer completeness tasks implementation, including task derivation from structured workspace gaps, direct `/create-profile/` section links with hashes, hash-based section opening and the frontend-derived task boundary before a future persisted task engine.

Document 135 records the CPG-SEAFARER-005 structured workspace section API contract, including section-level PATCH saves for the seafarer workspace, JSON fallback preservation, structured table sync, draft/session access modes, audit event creation and no-publication boundary.

Document 136 records the CPG-SEAFARER-006 create-profile frontend section-save implementation, including local Save section actions for seafarer workspace cards, section-level feedback, draft-first guard, i18n coverage, API integration with the section PATCH endpoint and no-publication boundary.

Document 137 records the CPG-SEAFARER-007 document-readiness section-save implementation, including the seafarer document-readiness PATCH endpoint, frontend Save section action for passport/medical/visa/readiness notes, metadata merge behavior, audit event and protected-upload boundary.

Document 138 records the CPG-SEAFARER-008 operator structured workspace visibility implementation, including structured seafarer workspace data in operator draft/application details, review-readiness checklist cards, `/verify/` detail rendering and the boundary that no candidate publication, matching decision or access-right expansion is introduced.

Document 139 records the CPG-SEAFARER-009 operator card-correction task implementation, including card-level correction targets in operator review decisions, audit/history metadata, `/verify/` correction-target selector, `/cabinet/` card-level correction tasks and direct links back to the relevant `/create-profile/` card.

Document 140 records the CPG-SEAFARER-010 workspace card review-state persistence implementation, including persisted card review states in seafarer profile metadata, structured-table review status updates, operator checklist state visibility, user resubmission state reset and cabinet task suppression after corrected card resubmission.

Document 141 records the CPG-SEAFARER-011 operator per-card review actions implementation, including the protected seafarer workspace card review endpoint, selected-card operator actions in `/verify/`, card status filtering in the review-readiness checklist, cabinet task derivation from persisted card states, audit events and the boundary that per-card verification does not approve or publish the full profile.

Document 142 records the CPG-SEAFARER-011-TESTS verification closure, including actual GTC1 execution of API and Playwright tests for operator per-card review actions, persisted card state, card status filters, cabinet tasks from card state and remaining risks before CPG-SEAFARER-012.

Document 143 records the CPG-SEAFARER-012 strict Excel-to-form alignment audit, including source workbook inventory, card-by-card comparison against the current `/create-profile/` workspace, reference catalog completeness verification, missing source cards/fields and the recommended CPG-SEAFARER-013 field-alignment implementation slice.

Document 144 records the CPG-SEAFARER-013 Excel-aligned seafarer form card expansion, including new source-aligned `/create-profile/` cards, draft metadata persistence for the added field groups, reference catalog bindings, review-card mapping and focused Playwright verification of save/reload behavior.

Document 145 records the CPG-SEAFARER-014 Excel source-of-truth pre-check and canonical card list, including source file confirmation, formatted sheet dimensions, source-defined PERS/QUAL/EXPERIENCE/MEDICAL sections, all 24 DROPDOWN_LISTS catalogs, implementation drift against the current form and the Project Owner approval questions required before further readiness logic.

Document 146 records the CPG-SEAFARER-015 Excel source review-card normalization implementation, including canonical PERS/QUAL/EXPERIENCE/MEDICAL card codes as primary operator/cabinet review records, legacy aggregated card fallback compatibility, source-card status persistence, operator target/filter behavior, cabinet task links and focused GTC1 verification.

Document 147 records the CPG-SEAFARER-016 repeated Excel source-row normalization implementation, including source field drift corrections, normalized children/document/education/certificate/training/sea-service/reference/medical records, uploaded document links by source card, operator/cabinet visibility, the source-card field coverage matrix and focused GTC1 verification.

Document 148 records the CPG-SEAFARER-017 agent execution guide for data minimization, scoped visibility, sensitive-field cleanup, approved visibility classes, employer-facing exclusions, consent event model requirements and implementation boundaries.

Document 149 records the CPG-SEAFARER-017 data minimization and scoped visibility implementation, including backend visibility scopes, operator/cabinet/employer payload cleanup, source-card visibility matrix, consent-event boundary and focused verification.

Document 151 records the CPG-SEAFARER-018 execution guide for approval guard, consent events and restricted medical access, including required pre-read sources, guard requirements, consent-event requirements, restricted medical capability rules, employer payload guard and acceptance criteria.

Document 152 records the CPG-SEAFARER-018 implementation, including the additive consent-event migration, consent APIs, vacancy application approval guard, restricted medical access denial boundary, employer payload guard, UI changes, controlled gaps and focused verification.

Document 153 records the CPG-SEAFARER-018 endpoint, guard and consent addendum, including changed-file matrix, migration 013 columns/indexes/constraints, consent API matrix, consent types, exact approval blocker codes, vacancy application transition behavior, restricted medical access, page/API impact, employer payload allow/deny proof, test traceability and final acceptance checklist.

Document 154 records the CPG-SEAFARER-019 forms, fields, database inventory and test report, including page/form inventory, UI ids and backend keys, source-card mapping, read-only database schema/count/JSON-key inspection, API and visibility inventories, consent and approval guard state, test execution results and remaining gaps.

Document 155 records the CPG-SEAFARER-019 agent execution guide for the forms, fields, database inventory and test report, including required sources, audit boundaries, read-only database inspection rules, report structure and acceptance criteria.

Document 156 records the CPG-SEAFARER-020 agent execution guide for the supply-demand matching model and field gap analysis, including required sources, no-implementation boundaries, matching dimensions, required matrices and acceptance criteria.

Document 157 records the CPG-SEAFARER-020 supply-demand matching model and field gap analysis, including the separated seafarer supply and employer/vessel/vacancy demand objects, supply-demand matching matrix, hard blocker and soft score matrix, field-type recommendations, visibility/data ownership matrix, readiness levels, gap-to-next-task matrix and recommended next implementation sequence.

Document 158 records the CPG-SEAFARER-021 demand-side normalization plan, including separate Employer / Company Profile, Vessel Profile, Crew Request / Vacancy Requirement, Contract Terms and Operational / Legal / Risk Requirements objects, current-to-target fields, field-type recommendations, blocker/score classification, evidence requirements, visibility/publication rules, MVP/later-stage priorities and future implementation sequence.

Document 159 records the CPG-SEAFARER-021 agent execution guide for demand-side normalization planning, including required sources, demand object separation, field groups, required matrices, publication/visibility principles and no-implementation boundaries.

Document 160 records the CPG-DEMAND-001 canonical demand field contract, including demand object naming conventions, canonical field keys for company, vessel, crew request, contract and operational/risk sections, catalog requirements, validation rules, visibility scopes, current-field compatibility mapping and future storage/API expectations.

Document 161 records the CPG-DEMAND-001 agent execution guide for the canonical demand field contract, including required sources, naming conventions, canonical field table requirements, reference catalog planning, validation planning, visibility planning, compatibility mapping, future storage/API mapping and no-implementation boundaries.

Document 162 records the CPG-DEMAND-002 additive demand schema and API implementation plan, including existing demand-side schema inventory, target additive schema categories, proposed migration sequence, table/column plan by demand object, reference catalog storage, JSONB compatibility, future API contracts, validation/error model, visibility scopes, backfill mapping, future test plan, rollback strategy and next implementation issues.

Document 163 records the CPG-DEMAND-002 agent execution guide for converting the canonical demand field contract into a low-risk additive schema/API planning report, including required source documents, current schema/API inspection, required matrices, future API contracts, validation/error planning, visibility/access-control planning, backfill compatibility and rollback boundaries.

Document 164 records the CPG-DEMAND-003 narrow readiness gate, comparing the existing Excel/current reference catalog baseline against document 160 demand canonical fields, confirming that document 162 remains the accepted schema/API plan, identifying which catalogs are ready/partial/missing/blocked and recommending demand reference catalog cleanup/seed readiness before the first catalog-backed implementation slice.

Document 165 records the CPG-DEMAND-003 agent execution guide for the reference catalog and schema readiness gate, including required source documents, catalog audit requirements, schema block readiness requirements, first-slice option comparison, recommendation rules, Project Owner decision table and no-implementation boundaries.

Document 166 records the CPG-DEMAND-004 read-only reconciliation of the existing PostgreSQL database, Excel-derived import artifacts and reference catalogs against demand matching needs, including DB table/count evidence, Excel-to-DB catalog completeness, demand-required catalog coverage, supply/demand matching sufficiency, missed employer/vessel/vacancy fields, additive completion scope and go/no-go recommendation for automated request-offer matching.

Document 167 records the CPG-DEMAND-004 agent execution guide for practical DB and Excel catalog reconciliation, including required source documents, read-only DB inspection commands, Excel/import artifact reconciliation, demand-required catalog coverage checks, matching sufficiency assessment, additive completion boundaries and no-DDL/DML-before-approval controls.

Document 168 records the CPG-DEMAND-005 additive demand matching foundation implementation, including migration 014, demand-side catalog links for rank and vessel type, `demand_workspace` compatibility storage, structured duration and validity threshold fields, minimal `demand_requirement_items`, backend save/read behavior, GTC1 backfill counts and focused verification.

Document 169 records the CPG-DEMAND-006 read-only internal candidate search prototype, including the operator-only candidate-search endpoint, exact catalog-backed rank/vessel/availability matching dimensions, match levels, blocker codes, data-minimized candidate payload, no-side-effect boundary and focused verification.

Document 170 records the CPG-DEMAND-007 operator candidate-search UI implementation, including the `/verify/` vacancy-detail search panel, manual read-only candidate search action, safe match-summary rendering, sensitive candidate contact exclusion and focused UI verification.

Document 171 records the CPG-DEMAND-008 read-only candidate-search input expansion, including department matching, passport and medical validity threshold checks, new blocker codes, data-minimized document-summary use, no-side-effect boundary and focused verification.

Document 172 records the CPG-DEMAND-009 structured demand requirements implementation, including migration 015, repeatable `demand_requirement_items` rows for COC, endorsements, training, visa, language, sea service and general constraints, legacy migration compatibility, API normalization, no-shortlist boundary and focused verification.

Document 173 records the CPG-DEMAND-010 structured requirement candidate-search evaluator, including read-only COC, endorsement, training and sea-service requirement checks, blocker codes, manual-review warnings for visa/language/general requirements, data-minimized payloads, no-shortlist boundary and focused verification.

Document 174 records the CPG-DEMAND-011 operator structured blocker UI implementation, including `/verify/` candidate-search structured requirement summaries, matched/blocked counts, safe missing-label display, sensitive-field exclusion and focused UI verification before any shortlist draft object is introduced.

Document 175 records the CPG-DEMAND-012 internal shortlist draft and approval guard design, including proposed additive internal draft storage, candidate-level guard blocker codes, future operator-only API contracts, no-employer-visibility state rules, payload minimization and the recommended next implementation sequence.

Document 176 records the CPG-DEMAND-013 internal shortlist draft storage and guard implementation, including migration 016, operator-only shortlist draft endpoints, include/hold guard behavior, consent/source-card/search blocker checks, employer-visible false constraints, minimized snapshots and focused verification.

Document 177 records the CPG-DEMAND-014 operator internal shortlist draft UI implementation, including `/verify/` candidate-level include/hold/exclude controls, guarded draft creation, internal-only result rendering, employer-visible false confirmation and sensitive-field exclusion verification.

Document 178 records the CPG-DEMAND-015 internal shortlist approval workflow implementation, including the protected approval endpoint, approve/reject decisions, approval guard blocker codes, `/verify/` internal approval controls, status update to `approved_internal` / `rejected`, audit event creation and preserved no-employer-facing boundary.

Document 179 records the CPG-DEMAND-016 internal shortlist to vacancy-application review-queue bridge, including the protected review-application endpoint, `approved_internal` guard, internal-only application staging to `submitted_for_human_review`, `/verify/` bridge action, audit event creation and preserved no-`presented` / no-employer-facing boundary.

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
18. 80_cpg_team_portal_roles_and_operations.md

### Phase D — Licensing and publication package

19. 15_billing_refund_policy_b2b.md
20. 19_ra_k_mohre_licensing_request_pack.md
21. 20_website_start_page_content.md

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
| 1.59 | 2026-05-24 | GTC IT / AI Assistant | Added document 179 for CPG-DEMAND-016 covering the bridge from approved internal shortlist drafts to internal vacancy application review records, with protected endpoint, `/verify/` action, no-presented boundary, audit event and focused verification |
| 1.58 | 2026-05-24 | GTC IT / AI Assistant | Added document 178 for CPG-DEMAND-015 covering the internal shortlist approval workflow, protected approval endpoint, `/verify/` approve/reject controls, approval guard blocker codes, audit event creation and no-employer-facing boundary |
| 1.57 | 2026-05-23 | GTC IT / AI Assistant | Added document 177 for CPG-DEMAND-014 covering `/verify/` internal shortlist draft UI controls, guarded draft creation, internal-only result rendering, employer-visible false confirmation and sensitive-field exclusion verification |
| 1.56 | 2026-05-23 | GTC IT / AI Assistant | Added document 176 for CPG-DEMAND-013 covering internal shortlist draft storage, migration 016, operator-only endpoints, guard blocker behavior, no-employer-visibility constraints, minimized snapshots and focused verification |
| 1.55 | 2026-05-23 | GTC IT / AI Assistant | Added document 175 for CPG-DEMAND-012 covering internal shortlist draft design, approval guard blocker codes, future API contracts, no-employer-visibility state rules, payload minimization and implementation sequence |
| 1.54 | 2026-05-23 | GTC IT / AI Assistant | Added document 174 for CPG-DEMAND-011 covering `/verify/` candidate-search structured blocker UI, matched/blocked requirement summaries, safe missing labels, sensitive-field exclusion and focused UI verification |
| 1.53 | 2026-05-23 | GTC IT / AI Assistant | Added document 173 for CPG-DEMAND-010 covering read-only structured requirement candidate search, COC/endorsement/training/sea-service checks, blocker codes, manual-review warnings, data-minimized payloads and no-shortlist verification |
| 1.52 | 2026-05-23 | GTC IT / AI Assistant | Added document 172 for CPG-DEMAND-009 covering structured demand requirement rows, migration 015, repeatable COC/training/endorsement/visa/language/sea-service/general constraints, legacy compatibility and verification |
| 1.51 | 2026-05-23 | GTC IT / AI Assistant | Added document 171 for CPG-DEMAND-008 covering read-only candidate-search input expansion with department matching, passport/medical validity thresholds, new blocker codes, data-minimized document-summary use and no-side-effect verification |
| 1.50 | 2026-05-23 | GTC IT / AI Assistant | Added document 170 for CPG-DEMAND-007 covering the operator candidate-search UI panel on `/verify/`, manual read-only search, safe match summaries, sensitive candidate contact exclusion and focused UI verification |
| 1.49 | 2026-05-23 | GTC IT / AI Assistant | Added document 169 for CPG-DEMAND-006 covering the read-only internal candidate search prototype, operator-only endpoint, exact catalog-backed matching dimensions, match levels, blocker codes, data-minimized payloads and no-side-effect verification |
| 1.48 | 2026-05-23 | GTC IT / AI Assistant | Added document 168 for CPG-DEMAND-005 covering additive demand matching foundation implementation, migration 014, demand catalog links, demand workspace compatibility, structured duration fields, requirement items, backend/API behavior, GTC1 backfill counts and focused verification |
| 1.47 | 2026-05-23 | GTC IT / AI Assistant | Added documents 166 and 167 for CPG-DEMAND-004 covering read-only PostgreSQL/Excel catalog reconciliation, current DB and import completeness evidence, demand-required catalog coverage, matching sufficiency, missed demand fields, additive completion scope and go/no-go recommendation |
| 1.46 | 2026-05-23 | GTC IT / AI Assistant | Added documents 164 and 165 for CPG-DEMAND-003 covering the narrow readiness gate between the existing Excel/current reference catalog baseline and document 160 demand canonical fields, Project Owner go/no-go decisions and the recommended catalog cleanup/seed task before catalog-backed demand implementation |
| 1.45 | 2026-05-22 | GTC IT / AI Assistant | Added documents 162 and 163 for CPG-DEMAND-002 covering additive demand schema/API planning, existing schema inventory, migration sequence, demand object storage categories, reference catalogs, JSONB compatibility, validation/error codes, visibility scopes, backfill mapping and rollback strategy |
| 1.44 | 2026-05-22 | GTC IT / AI Assistant | Added documents 160 and 161 for CPG-DEMAND-001 covering the canonical demand field contract, field-key conventions, catalog and validation plans, visibility scopes, compatibility mapping and future storage/API expectations |
| 1.43 | 2026-05-22 | GTC IT / AI Assistant | Added documents 158 and 159 for CPG-SEAFARER-021 covering demand-side normalization across employer/company, vessel, crew request, contract and operational/legal/risk objects with field type, evidence, visibility, MVP priority and implementation-sequence matrices |
| 1.42 | 2026-05-22 | GTC IT / AI Assistant | Added documents 156 and 157 for CPG-SEAFARER-020 covering the supply-demand matching model, field gap analysis, blocker/score classification, field-type recommendations, visibility ownership, readiness levels and next implementation sequence |
| 1.41 | 2026-05-22 | GTC IT / AI Assistant | Added documents 154 and 155 for CPG-SEAFARER-019 covering forms, fields, database inventory, read-only schema/count/JSON-key inspection, API and visibility inventory, test execution and remaining gaps |
| 1.40 | 2026-05-19 | GTC IT / AI Assistant | Added document 153 as the CPG-SEAFARER-018 endpoint, guard and consent addendum covering changed files, migration 013 details, consent APIs, exact approval blocker codes, vacancy application transition behavior, restricted medical access and employer payload proof |
| 1.39 | 2026-05-19 | GTC IT / AI Assistant | Added documents 151 and 152 for CPG-SEAFARER-018 covering approval guard, consent events, restricted medical access boundary, employer payload guard, additive migration and focused verification |
| 1.38 | 2026-05-19 | GTC IT / AI Assistant | Added documents 148 and 149 plus source-card visibility matrix for CPG-SEAFARER-017 covering data minimization, scoped visibility, sensitive-field cleanup, employer-facing exclusions, consent-event boundary and focused verification |
| 1.37 | 2026-05-19 | GTC IT / AI Assistant | Added document 147 as CPG-SEAFARER-016 repeated Excel source-row normalization report and source-card field coverage matrix covering missing source fields, repeated records, document links by source card and focused operator/cabinet verification |
| 1.36 | 2026-05-19 | GTC IT / AI Assistant | Added document 146 as CPG-SEAFARER-015 Excel source review-card normalization report covering canonical source card codes, legacy fallback compatibility, operator/cabinet review behavior, source-card persistence and focused verification |
| 1.35 | 2026-05-19 | GTC IT / AI Assistant | Added document 145 as CPG-SEAFARER-014 Excel source-of-truth pre-check covering source file confirmation, canonical card list, all 24 catalogs, current implementation drift and approval questions before continuing readiness logic |
| 1.34 | 2026-05-19 | GTC IT / AI Assistant | Added document 144 as CPG-SEAFARER-013 Excel-aligned seafarer form card expansion report covering new source-aligned create-profile cards, metadata persistence, catalog bindings, review-card mapping and focused save/reload verification |
| 1.33 | 2026-05-19 | GTC IT / AI Assistant | Added document 143 as CPG-SEAFARER-012 Excel-to-form alignment audit covering source workbook inventory, card-by-card current implementation comparison, full reference catalog count verification, missing source cards/fields and next field-alignment implementation recommendations |
| 1.32 | 2026-05-19 | GTC IT / AI Assistant | Added document 142 as CPG-SEAFARER-011-TESTS verification report covering actual GTC1 API and Playwright execution, pass counts, DB-backed card-state verification, cabinet task verification, filter verification and remaining risks before CPG-SEAFARER-012 |
| 1.31 | 2026-05-19 | GTC IT / AI Assistant | Added document 141 as CPG-SEAFARER-011 operator per-card review actions report covering protected card review endpoint, selected-card operator actions, card status filtering, cabinet card-state tasks, audit events and no full-profile approval/publication boundary |
| 1.30 | 2026-05-19 | GTC IT / AI Assistant | Added document 140 as CPG-SEAFARER-010 workspace card review-state persistence report covering persisted card review states, structured record status updates, operator checklist visibility, user resubmission reset and cabinet task suppression |
| 1.29 | 2026-05-19 | GTC IT / AI Assistant | Added document 139 as CPG-SEAFARER-009 operator card-correction task report covering card-level correction targets, audit/history metadata, operator correction selector, cabinet task rendering and direct create-profile card links |
| 1.28 | 2026-05-19 | GTC IT / AI Assistant | Added document 138 as CPG-SEAFARER-008 operator structured workspace visibility report covering operator detail structured seafarer workspace rendering, document-readiness metadata, review-readiness checklist, focused verification and no automatic publication/matching boundary |
| 1.27 | 2026-05-19 | GTC IT / AI Assistant | Added document 137 as CPG-SEAFARER-007 document-readiness section-save report covering seafarer document-readiness PATCH endpoint, frontend card save action, metadata merge behavior, audit event and protected-upload boundary |
| 1.26 | 2026-05-19 | GTC IT / AI Assistant | Added document 136 as CPG-SEAFARER-006 create-profile section-save frontend report covering local workspace card save actions, section-level feedback, draft-first guard, i18n coverage, section PATCH API integration and no-publication boundary |
| 1.25 | 2026-05-19 | GTC IT / AI Assistant | Added document 135 as CPG-SEAFARER-005 structured workspace section API contract report covering section-level PATCH endpoint, JSON fallback preservation, structured table sync, draft/session access modes, audit event and no-publication boundary |
| 1.24 | 2026-05-19 | GTC IT / AI Assistant | Added document 134 as CPG-SEAFARER-004 cabinet completeness tasks report covering missing structured workspace task derivation, direct create-profile section links, hash-based section opening and frontend-derived task boundary |
| 1.23 | 2026-05-19 | GTC IT / AI Assistant | Added document 133 as CPG-SEAFARER-003 cabinet structured workspace view report covering the collapsed Seafarer workspace card, structured record rendering, API/draft fallback source, i18n coverage and no-publication boundary |
| 1.22 | 2026-05-19 | GTC IT / AI Assistant | Added document 132 as CPG-SEAFARER-002 workspace JSON-to-structured bridge report covering structured sync on seafarer draft save, workspace summary endpoint, migration readiness guard, reference catalog value resolution and no automatic candidate-publication boundary |
| 1.21 | 2026-05-19 | GTC IT / AI Assistant | Added document 131 as CPG-SEAFARER-001 structured seafarer workspace schema report covering migration 012, normalized seafarer card tables, catalog/document links, review-state fields and controlled publication snapshot boundaries |
| 1.20 | 2026-05-19 | GTC IT / AI Assistant | Added document 130 as CPG-REF-006 seafarer workspace extended form report covering additional create-profile cards, reference catalog bindings, seafarer_workspace metadata persistence, backend list normalization and no automatic matching publication boundary |
| 1.19 | 2026-05-18 | GTC IT / AI Assistant | Added document 129 as CPG-REF-005 public form reference catalog bindings report covering shared frontend catalog helper, create-profile/post-vacancy datalist bindings, public-only API usage and verification scope |
| 1.18 | 2026-05-18 | GTC IT / AI Assistant | Added document 128 as CPG-REF-004 full reference catalog publication report covering all published reference catalogs, public API readiness, source Excel completeness verification and audit event |
| 1.17 | 2026-05-18 | GTC IT / AI Assistant | Added document 127 as CPG-REF-003 admin reference catalog publication console report covering the /admin/access/ owner UI for catalog counts, value inspection and protected approve/publish/retire actions |
| 1.16 | 2026-05-18 | GTC IT / AI Assistant | Added document 126 as CPG-REF-002 reference catalog publication API report covering public-only-published catalog reads, Project Owner protected review/publication endpoints, pending seed import and unpublished-value visibility tests |
| 1.15 | 2026-05-18 | GTC IT / AI Assistant | Added document 125 as CPG-REF-001 seafarer reference catalog foundation report covering reference_catalogs, reference_catalog_values, private Excel importer, generated review artifacts and publication boundary before UI/API exposure |
| 1.14 | 2026-05-18 | GTC IT / AI Assistant | Added BP-011 seafarer field dictionary and reference catalog alignment covering private Excel source handling, workbook inventory, cabinet card plan, reference catalogs, future DB/API slices and publication order |
| 1.13 | 2026-05-18 | GTC IT / AI Assistant | Added document 124 as CPG-CABINET-027 protected profile photo upload report covering user_profile_photos, authenticated avatar upload, ClamAV scan, protected storage, owner-session image delivery, cabinet/account-menu rendering and verification scope |
| 1.12 | 2026-05-18 | GTC IT / AI Assistant | Added document 123 as CPG-DESIGN-003 compact responsive workbench report covering compact typography, spacing, shared workbench theme switcher, cabinet/team/admin dark mode overrides, mobile overflow prevention and focused verification |
| 1.11 | 2026-05-18 | GTC IT / AI Assistant | Added document 122 as CPG-DESIGN-002 theme switcher and dark functional foundation report covering the shared theme switcher, Dark Maritime / Light Work / Auto modes, local preference persistence, app/document theme tokens, navigation layering fix and focused verification |
| 1.10 | 2026-05-18 | GTC IT / AI Assistant | Added document 121 as CPG-DESIGN-001 unified responsive theme system covering Dark Maritime and Light Work themes, compact typography, responsive behavior, shared component standards and implementation phases across public, document, cabinet, team and admin pages |
| 1.09 | 2026-05-18 | GTC IT / AI Assistant | Added document 120 as CPG-DEPLOY-002 public live systemd timer activation report covering installed units, timer schedule, runtime user, deploy environment, safety boundaries and operational commands |
| 1.08 | 2026-05-18 | GTC IT / AI Assistant | Added document 119 as CPG-DEPLOY-001 public live sync automation report covering the repository-to-live-root publication gap, dedicated frontend/public deploy script, rsync safety controls, dry-run and smoke checks, and automatic trigger options |
| 1.07 | 2026-05-18 | GTC IT / AI Assistant | Added document 118 as CPG-AUTH-004 email verification and account activation report covering hash-only verification tokens, send/resend/verify endpoints, cabinet verification task, account-menu e-mail status and password-session preservation |
| 1.06 | 2026-05-18 | GTC IT / AI Assistant | Added document 117 as CPG-AUTH-003 password credential/session foundation report covering password-hash registration, login/logout, auth/me, hashed session tokens, HttpOnly SameSite=Lax cookies, account-menu authenticated state and /cabinet/ session context |
| 1.05 | 2026-05-18 | GTC IT / AI Assistant | Added document 116 as CPG-CABINET-026 account menu and login/registration shell report covering top-right Account / Login dropdown, separate registration/login actions, Path B password-login-unavailable state, cabinet profile placeholder and focused UI verification |
| 1.04 | 2026-05-18 | GTC IT / AI Assistant | Added document 115 as CPG-CABINET-025 user personal cabinet dashboard MVP report covering /cabinet/, task-first cabinet layout, document correction tasks, replacement upload, document/status summaries, service-area capability links and focused UI/API verification |
| 1.03 | 2026-05-18 | GTC IT / AI Assistant | Added document 114 as CPG-DOC-024 user-facing document correction task and replacement upload implementation report covering computed correction tasks, Upload replacement actions, clean replacement closure, unsafe replacement persistence and seafarer/employer UI/API verification |
| 1.02 | 2026-05-17 | GTC IT / AI Assistant | Added document 113 as CPG-DOC-023 protected document review queue and authorized reviewer file access implementation report covering clean-only queue metadata, protected download, review decisions, audit events, /team/documents/ UI and API/UI/security verification |
| 1.01 | 2026-05-17 | GTC IT / AI Assistant | Added document 112 as CPG-DOC-022 protected document upload storage and ClamAV scanning implementation report covering migration 007, protected server storage, quarantine-to-scan-to-protected flow, upload endpoints, frontend upload sections, ClamAV verification and upload/security tests |
| 1.00 | 2026-05-17 | GTC IT / AI Assistant | Added BP-010 document upload, protected storage and review procedure for CPG-DOC-021 covering server-only document folders, seafarer/employer/vessel categories, file limits, antivirus scanning, metadata, scoped visibility and implementation decisions before upload endpoint |
| 0.99 | 2026-05-17 | GTC IT / AI Assistant | Updated document 111 and public route register for separate authorization form pages: selection-only /register/authorization/, selected-forms route, seafarer/specialist form, buyer/employer form and document-upload draft controls |
| 0.98 | 2026-05-17 | GTC IT / AI Assistant | Added document 111 as CPG-AUTH-002 authorization request cards frontend report covering multiple authorization card selection, return-to-authorization behavior, phone-verification-to-configure note and no automatic authority boundary |
| 0.97 | 2026-05-17 | GTC IT / AI Assistant | Added document 110 as CPG-AUTH-001 public person registration email confirmation implementation report covering /register/ backend submission, protected SMTP confirmation link, email auth confirmation and sequential /register/next/ route |
| 0.96 | 2026-05-17 | GTC IT / AI Assistant | Added document 109 as CPG-MKT-007 public navigation registration CTA implementation report for the first frontend-only BP-009 slice |
| 0.95 | 2026-05-17 | GTC IT / AI Assistant | Added BP-009 public site and authenticated navigation transition plan covering public menu simplification, authenticated menu generation, route transition, protected team/admin navigation and implementation phases |
| 0.94 | 2026-05-17 | GTC IT / AI Assistant | Added BP-008 client registration and interaction procedure covering public-site entry, registration/authentication/path selection, seafarer/employer-side flows, internal interaction and public-to-authenticated navigation transition |
| 0.93 | 2026-05-17 | GTC IT / AI Assistant | Added BP-007 personal cabinet UI layout and component requirements covering registration entry, collapsible card behavior, badges, forms, empty states, responsive layout and interaction rules |
| 0.92 | 2026-05-17 | GTC IT / AI Assistant | Added BP-006 scoped visibility and access-check contract covering future API access decisions, field filtering, action scopes, audit obligations, AI context limits and standard collapsible card presentation |
| 0.91 | 2026-05-17 | GTC IT / AI Assistant | Added BP-005 personal cabinet and scoped visibility requirements covering runtime cabinet assembly, visibility reasons, action scopes, future cabinet APIs and broad-access prevention rules |
| 0.90 | 2026-05-17 | GTC IT / AI Assistant | Added BP-004 card field dictionary and workflow states covering fields, statuses, events, task triggers, relationship scopes and future database/API requirements |
| 0.89 | 2026-05-17 | GTC IT / AI Assistant | Added BP-003 as CPG-BIZ-020 client cards for employer demand and seafarer supply model covering registration/authentication/authorization separation, scoped visibility, practical cards and reviewed candidate recommendation logic |
| 0.88 | 2026-05-16 | GTC IT / AI Assistant | Added BP-002 as CPG-BIZ-019 role instructions for team and AI agents covering six working groups, Tasks/My clients, SLA colors, client-card updates, handoffs, escalation, revenue/no-fee boundaries and AI decision limits |
| 0.87 | 2026-05-16 | GTC IT / AI Assistant | Added separate business-process documentation block with its own register and BP-001 for Issue #11 / CPG-BIZ-018 business declaration, client lifecycle, Tasks/My clients, SLA colors and working-group operating model |
| 0.86 | 2026-05-16 | GTC IT / AI Assistant | Added document 108 as CPG-ACCESS-021 implementation report for the /admin/access/ audit panel collapsed-by-default UI correction |
| 0.85 | 2026-05-16 | GTC IT / AI Assistant | Added document 107 as CPG-ACCESS-020 implementation report for the first writable Project Owner user and group membership management slice in /admin/access/ |
| 0.84 | 2026-05-16 | GTC IT / AI Assistant | Added document 106 as CPG-ACCESS-019 implementation report for Issue #10 group-based owner/team access, owners and cpg_team groups, protected /team/ entry page and removal of direct personal-email access as the normal rule |
| 0.83 | 2026-05-15 | GTC IT / AI Assistant | Added document 105 as CPG-ACCESS-018 correction report for /admin/access/ contrast/readability fixes and bootstrap Project Owner e-mail lock to prevent browser-altered non-owner verification attempts |
| 0.82 | 2026-05-15 | GTC IT / AI Assistant | Added document 104 as CPG-ACCESS-017 implementation report for the first read-only Project Owner console view on /admin/access/ with active session summary, permissions, audit events and logout/revoke session |
| 0.81 | 2026-05-15 | GTC IT / AI Assistant | Added document 103 as CPG-ACCESS-016 implementation report for applying access-control migration 006 after backup, bootstrapping kfilipenko@gtchain.io as first Project Owner, enabling protected admin access email-code runtime and verifying /admin/access/ |
| 0.80 | 2026-05-15 | GTC IT / AI Assistant | Added document 102 as CPG-ACCESS-015 implementation and smoke-test report for protected-config admin email-code SMTP sending through Timeweb with no secret exposure and no public route activation |
| 0.79 | 2026-05-15 | GTC IT / AI Assistant | Added document 101 as CPG-ACCESS-014 implementation report for admin email delivery adapter preparation with Timeweb SMTP configuration validation and no real send |
| 0.78 | 2026-05-15 | GTC IT / AI Assistant | Added document 100 as CPG-ACCESS-013 implementation report for disabled-by-default admin email-code email delivery contract |
| 0.77 | 2026-05-15 | GTC IT / AI Assistant | Added document 99 as CPG-ACCESS-012 implementation report for disabled-by-default admin email-code storage factory contract |
| 0.76 | 2026-05-15 | GTC IT / AI Assistant | Added document 98 as CPG-ACCESS-011 implementation report for disabled admin email-code public route wiring behind feature flags |
| 0.75 | 2026-05-15 | GTC IT / AI Assistant | Added document 97 as CPG-ACCESS-010 implementation report for admin email-code PostgreSQL adapter static query design without database connection |
| 0.74 | 2026-05-15 | GTC IT / AI Assistant | Added document 96 as CPG-ACCESS-009 implementation report for admin email-code storage adapter contracts and in-memory tests without PostgreSQL wiring |
| 0.73 | 2026-05-15 | GTC IT / AI Assistant | Added document 95 as CPG-ACCESS-008 implementation report for admin email-code API contracts and disabled runtime skeletons |
| 0.72 | 2026-05-15 | GTC IT / AI Assistant | Added document 94 as CPG-ACCESS-007 implementation report for admin email-code backend security helper foundation before runtime endpoints |
| 0.71 | 2026-05-15 | GTC IT / AI Assistant | Added document 93 as CPG-ACCESS-006 implementation report for static SQL draft review and non-production migration readiness controls |
| 0.70 | 2026-05-15 | GTC IT / AI Assistant | Added document 92 as CPG-ACCESS-005 implementation report for backend identity-context boundaries before account-session enforcement |
| 0.69 | 2026-05-15 | GTC IT / AI Assistant | Added document 91 as CPG-ACCESS-004 implementation report for operator queue capability metadata and frontend action disabling support before runtime enforcement |
| 0.68 | 2026-05-15 | GTC IT / AI Assistant | Added document 90 as CPG-ACCESS-003 implementation report for the operator queue permission matrix contract and static validation tests |
| 0.67 | 2026-05-15 | GTC IT / AI Assistant | Added document 89 as CPG-ACCESS-002 implementation report for backend access guard foundation and isolated tests without runtime enforcement |
| 0.66 | 2026-05-15 | GTC IT / AI Assistant | Added document 88 as CPG-ACCESS-001 final access-control and admin-console plan covering groups, roles, permissions, scopes, admin email-code protection, audit requirements and phased implementation order |
| 0.65 | 2026-05-15 | GTC IT / AI Assistant | Added document 87 as CPG-OPS-019 implementation report for operator role-lane queue counts on /verify/ and in the shared Operator role menu |
| 0.64 | 2026-05-15 | GTC IT / AI Assistant | Added document 86 as CPG-MKT-006 implementation report for the shared frontend navigation component and page-level mount contract |
| 0.63 | 2026-05-15 | GTC IT / AI Assistant | Added document 85 as CPG-MKT-005 implementation report for the document-page Application return menu fix and Functional pages dropdown |
| 0.62 | 2026-05-14 | GTC IT / AI Assistant | Added document 84 as CPG-OPS-018 implementation report for dedicated operator portal navigation and role lanes on /verify/ under the document 80 role model |
| 0.61 | 2026-05-14 | GTC IT / AI Assistant | Added document 83 as CPG-MKT-004 implementation report and future-change rule for separating CrewPortGlobal application navigation from documentary navigation |
| 0.60 | 2026-05-14 | GTC IT / AI Assistant | Added document 82 as CPG-USER-018 implementation report for seafarer-side vacancy application withdrawal and not-available actions in /create-profile/ |
| 0.59 | 2026-05-14 | GTC IT / AI Assistant | Added document 81 as CPG-EMP-009 implementation report for employer follow-up notes on presented candidates in /post-vacancy/ and preserved document 80 for the team portal roles governance baseline |
| 0.58 | 2026-05-14 | GTC IT / AI Assistant | Added document 80 as CPG-TEAM-001 team portal roles and operations model covering role separation, operator duties, human-review checkpoints, audit expectations and no-fee seafarer control |
| 0.57 | 2026-05-14 | GTC IT / AI Assistant | Added document 79 as CPG-EMP-008 implementation report for employer shortlist actions on operator-presented candidates in /post-vacancy/ |
| 0.56 | 2026-05-14 | GTC IT / AI Assistant | Added document 78 as CPG-USER-017 implementation report for seafarer-side vacancy application history on /create-profile/ |
| 0.55 | 2026-05-14 | GTC IT / AI Assistant | Added document 77 as CPG-EMP-007 implementation report for employer-side presented candidate visibility on /post-vacancy/ |
| 0.54 | 2026-05-14 | GTC IT / AI Assistant | Added document 76 as CPG-OPS-017 implementation report for vacancy application visibility and decisions in the protected operator queue |
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
