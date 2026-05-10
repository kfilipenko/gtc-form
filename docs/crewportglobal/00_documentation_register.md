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
| 0.6 | 2026-05-10 | GTC IT / AI Assistant | Added split SQL package consistency review and execution-plan discussion readiness verdict |
| 0.5 | 2026-05-10 | GTC IT / AI Assistant | Added split SQL planning package review plan and manual approval gate for any future execution discussion |
| 0.4 | 2026-05-10 | GTC IT / AI Assistant | Added v2 delta review and test-migration-review readiness assessment |
| 0.3 | 2026-05-10 | GTC IT / AI Assistant | Added schema design review follow-up and v1 fix-plan documentation |
| 0.2 | 2026-05-10 | GTC IT / AI Assistant | Added isolated database schema planning docs and project-local SQL planning path |
| 0.1 | 2026-05-08 | GTC IT / AI Assistant | Initial documentation register created |