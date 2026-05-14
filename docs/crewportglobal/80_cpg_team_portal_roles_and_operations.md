# CrewPortGlobal — Team Portal Roles and Operations

- Project: CrewPortGlobal.com
- Company: GTC INFORMATION TECHNOLOGY FZ-LLC
- Document code: CPG-TEAM-001
- Document type: Internal operational governance
- Version: 0.1
- Status: For project-owner and team review
- Date: 2026-05-14

## 1. Purpose

This document defines how the CrewPortGlobal portal team should work, how operational roles are separated, and which responsibilities belong to each role.

The document is intended for project-owner review, agent guidance, team onboarding and future operator-dashboard design.

The goal is to prevent a single generic admin model and instead create a controlled operational model with separated duties, human review, auditability and clear escalation rules.

## 2. Scope

This document covers the internal team roles required to operate CrewPortGlobal as a maritime jobs, crew data and candidate-matching platform.

Covered areas:

1. internal operator role model;
2. user and company review responsibilities;
3. document and evidence verification;
4. vacancy and candidate workflow review;
5. complaint handling;
6. billing and service entitlement control;
7. audit and change-control expectations;
8. future operator portal requirements.

This document is not a backend implementation, database migration, access-control implementation or deployment approval.

## 3. Current project basis

The current CrewPortGlobal planning model already separates external users and internal operators.

External categories include:

1. seafarer;
2. individual user / non-seafarer;
3. business client representative;
4. shipowner company;
5. vessel operator;
6. ship manager;
7. crew manager;
8. manning agency;
9. training provider;
10. medical provider;
11. travel provider.

Internal operator role codes already planned in the project schema are:

1. verifier;
2. reviewer;
3. complaint_operator;
4. billing_operator.

The `Admin` concept must remain internal-only and must not be exposed as a public self-registration category.

## 4. Core operating principle

CrewPortGlobal must operate through role separation.

A single operator must not silently control the full chain from intake to verification, candidate approval, employer presentation, billing entitlement and complaint closure without an audit trail.

The basic control model is:

```text
User input or employer request
  -> completeness check
  -> verification review
  -> operational review
  -> controlled decision
  -> audit record
  -> visible status for the relevant user side
```

For Stage 1, human review remains mandatory for sensitive workflow points.

## 5. Role model overview

| Role | Main purpose | Primary objects | Public self-registration | Decision power |
|---|---|---|---|---|
| Project Owner | Final product and governance authority | All platform areas | No | Final approval |
| Platform Administrator | Technical and controlled access administration | Operator accounts, settings, safe configuration | No | Operational administration only |
| Verifier | Evidence and document verification | Persons, seafarers, companies, vessels, documents | No | Verification recommendation / status update within assigned scope |
| Reviewer | Human workflow decision review | Profiles, vacancies, candidate matches, employer presentation | No | Operational decision within approved workflow |
| Complaint Operator | Complaint intake and escalation | Complaints, disputes, user reports | No | Complaint workflow decision or escalation |
| Billing Operator | Billing and entitlement control | Billing accounts, service entitlements, paid services | No | Billing status review within approved policy |
| Support Operator | User assistance and clarification | User questions, missing information, basic support | No | No final verification or billing authority |
| AI Assistant / Agent | Assisted drafting, summarization and workflow support | Draft notes, checklists, summaries | No | No autonomous final decision |

## 6. Project Owner

### 6.1 Purpose

The Project Owner is the final authority for product direction, compliance boundary, implementation approval and operational policy.

### 6.2 Responsibilities

1. Approves new implementation steps.
2. Approves changes to role model and operator permissions.
3. Approves publication of public legal and trust documents.
4. Approves changes to the no-fee seafarer policy.
5. Approves transition from planning-only documentation to backend implementation.
6. Approves high-risk operational exceptions.
7. Reviews agent reports and validates whether the work may proceed.

### 6.3 Restrictions

The Project Owner role should not be used as a daily operational shortcut. Routine review should be delegated to the defined operator roles once the workflow is implemented.

## 7. Platform Administrator

### 7.1 Purpose

The Platform Administrator manages controlled technical access and operator provisioning.

### 7.2 Responsibilities

1. Creates and disables internal operator access after approval.
2. Assigns operator roles according to the approved role model.
3. Maintains access records and operator status.
4. Coordinates safe configuration changes with the Project Owner.
5. Ensures secrets, keys and tokens are not exposed in documentation or public repositories.
6. Confirms that production configuration changes are separately approved.

### 7.3 Restrictions

The Platform Administrator must not use technical access to bypass business review, approve candidate submissions without reviewer action, or modify billing status without a documented billing workflow.

## 8. Verifier

### 8.1 Purpose

The Verifier checks facts, evidence and documents.

### 8.2 Main review areas

1. seafarer profile evidence;
2. seafarer documents;
3. business client KYB documents;
4. company representative authority evidence;
5. vessel evidence and vessel-company relationship;
6. expiry dates and document completeness;
7. mismatch flags and clarification requests.

### 8.3 Allowed actions

1. Mark evidence as received, incomplete, under review, verified, rejected, expired or needs clarification where the workflow supports it.
2. Add verification notes.
3. Request missing information.
4. Escalate suspicious or high-risk cases.
5. Prepare verification recommendation for Reviewer.

### 8.4 Prohibited actions

1. No autonomous candidate submission to employer.
2. No final hiring or placement decision.
3. No billing entitlement changes.
4. No deletion of user evidence without approved retention process.
5. No bypass of required human review.

## 9. Reviewer

### 9.1 Purpose

The Reviewer makes controlled workflow decisions after intake and verification evidence are available.

### 9.2 Main review areas

1. seafarer profile readiness;
2. document-verification outcome review;
3. business client and representative readiness;
4. vessel readiness;
5. crew request approval before matching;
6. candidate match review;
7. candidate presentation to employer;
8. correction reason and review notes.

### 9.3 Allowed actions

1. Move a record from pending_human_review to active_limited or active_verified where the workflow permits.
2. Return a record for correction with a clear reason.
3. Approve or reject operator-presented candidate visibility.
4. Approve candidate presentation to employer after required checks.
5. Add structured review notes.
6. Escalate high-risk cases to Project Owner or compliance review.

### 9.4 Prohibited actions

1. No approval without minimum evidence.
2. No candidate submission where no-fee and consent guardrails are incomplete.
3. No modification of raw evidence records to hide inconsistency.
4. No billing override.
5. No self-approval of a case where the Reviewer also created or materially edited the underlying evidence.

## 10. Complaint Operator

### 10.1 Purpose

The Complaint Operator manages complaints, disputes and user-reported issues.

### 10.2 Main review areas

1. seafarer complaint;
2. employer complaint;
3. document dispute;
4. candidate-presentation dispute;
5. no-fee policy complaint;
6. privacy or data-handling concern;
7. service quality complaint.

### 10.3 Allowed actions

1. Register complaint category and severity.
2. Request clarification from the reporting party.
3. Link complaint to a user, business client, vacancy, candidate match or document.
4. Escalate high-risk complaints.
5. Record resolution summary.
6. Close complaint only when the required resolution notes are complete.

### 10.4 Prohibited actions

1. No deletion of complaint records to avoid audit trail.
2. No retaliation against users who submit complaints.
3. No private settlement outside the recorded workflow.
4. No closing of critical complaints without escalation record.

## 11. Billing Operator

### 11.1 Purpose

The Billing Operator manages billing status and service-entitlement review within approved business policy.

### 11.2 Main review areas

1. business client billing account;
2. project-specific service entitlements;
3. employer access to paid services;
4. optional seafarer services where legally and operationally separated from job access;
5. billing disputes and entitlement corrections.

### 11.3 Allowed actions

1. Review billing status.
2. Confirm entitlement state based on approved payment or manual project-owner decision.
3. Flag billing inconsistencies.
4. Coordinate with support on billing-related user questions.
5. Escalate refund or exception requests.

### 11.4 Prohibited actions

1. No charging seafarers for recruitment, placement or job access.
2. No enabling vacancy access based on optional seafarer paid services.
3. No hidden fees.
4. No payment-link substitution.
5. No manual entitlement grant without documented approval.

## 12. Support Operator

### 12.1 Purpose

The Support Operator assists users and helps collect missing information without making final compliance or workflow decisions.

### 12.2 Allowed actions

1. Explain required steps.
2. Help users understand missing fields or missing documents.
3. Route questions to Verifier, Reviewer, Complaint Operator or Billing Operator.
4. Prepare support notes.
5. Help maintain clear communication with seafarers and business clients.

### 12.3 Prohibited actions

1. No verification approval.
2. No candidate approval.
3. No billing override.
4. No complaint closure.
5. No promises of employment, placement or guaranteed outcome.

## 13. AI Assistant / Agent

### 13.1 Purpose

The AI Assistant supports operators by drafting summaries, checklists, missing-item lists, review notes and explanations.

### 13.2 Allowed actions

1. Summarize user-provided information.
2. Produce missing-information checklists.
3. Draft operator notes for human review.
4. Explain workflow status in user-friendly language.
5. Compare input against published policy requirements.
6. Prepare draft reports for Project Owner review.

### 13.3 Prohibited actions

1. No autonomous verification.
2. No autonomous approval or rejection.
3. No candidate submission to employer.
4. No billing entitlement grant.
5. No legal, employment or immigration guarantee.
6. No instruction to bypass human review.

## 14. Mandatory human review checkpoints

Human review is mandatory for:

1. seafarer profile verification;
2. document verification;
3. business client KYB approval;
4. representative authority approval;
5. vessel verification;
6. crew request approval before matching;
7. candidate submission to shipowner or employer;
8. complaint escalation;
9. billing exceptions;
10. any high-risk or inconsistent record.

## 15. Status-control model

The portal should use clear workflow states.

Common intake states:

```text
draft
pending_consent
pending_documents
pending_human_review
active_limited
active_verified
suspended
rejected
```

Operational rule:

1. `draft` means data is not ready for review.
2. `pending_consent` means mandatory acknowledgements are incomplete.
3. `pending_documents` means required documents or evidence are incomplete.
4. `pending_human_review` means the item is ready for a human operator.
5. `active_limited` means limited use is allowed after review.
6. `active_verified` means the profile or entity has passed the defined review level.
7. `suspended` means access or workflow continuation is paused.
8. `rejected` means the item failed the required review or policy check.

## 16. Separation of duties

The future operator portal should support separation of duties.

Recommended rule:

1. Verifier checks evidence.
2. Reviewer decides operational readiness.
3. Complaint Operator handles disputes.
4. Billing Operator handles entitlements.
5. Project Owner handles exceptions and policy changes.
6. Platform Administrator manages access but does not replace business review.
7. AI Assistant prepares drafts but does not make final decisions.

For high-risk cases, the system should require a second human decision or Project Owner escalation.

## 17. Audit requirements

Every material operator action should create an audit event.

Minimum audit fields:

1. actor role;
2. actor identifier;
3. affected entity type;
4. affected entity identifier;
5. previous status;
6. new status;
7. reason or review note;
8. timestamp;
9. source surface;
10. metadata payload where useful.

Audit records should not be silently deleted.

## 18. Operator portal surface requirements

The future operator dashboard should include:

1. role-aware login;
2. operator queue filtered by role;
3. seafarer review queue;
4. document review queue;
5. business client review queue;
6. vessel review queue;
7. crew request review queue;
8. candidate match review queue;
9. complaint queue;
10. billing exception queue;
11. structured detail view;
12. review notes and correction reasons;
13. review history panel;
14. audit event visibility;
15. escalation controls.

## 19. Minimum role permissions matrix

| Workflow object | Support Operator | Verifier | Reviewer | Complaint Operator | Billing Operator | Platform Administrator | Project Owner |
|---|---:|---:|---:|---:|---:|---:|---:|
| Seafarer profile draft | View / request clarification | Verify evidence | Approve / return / reject | View if complaint-linked | No | No business decision | Final exception |
| Seafarer documents | View | Verify / reject / request clarification | Review outcome | View if complaint-linked | No | No business decision | Final exception |
| Business client profile | View / request clarification | Verify KYB evidence | Approve / return / reject | View if complaint-linked | View billing context | No business decision | Final exception |
| Representative authority | View | Verify evidence | Approve / return / reject | View if complaint-linked | No | No business decision | Final exception |
| Vessel | View | Verify evidence | Approve / return / reject | View if complaint-linked | No | No business decision | Final exception |
| Crew request | View | Verify evidence if needed | Approve before matching | View if complaint-linked | View entitlement if paid feature | No business decision | Final exception |
| Candidate match | View | Check evidence flags | Approve presentation / reject | View if complaint-linked | No | No business decision | Final exception |
| Complaint | Create support note | Provide evidence context | Provide decision context | Manage / escalate / close | Provide billing context | No business decision | Final exception |
| Billing entitlement | View basic support status | No | No | View if complaint-linked | Review / adjust under approval | No business decision | Final exception |
| Operator account | No | No | No | No | No | Provision / revoke after approval | Approve policy and exceptions |

## 20. No-fee seafarer control

The role model must enforce the no-fee principle.

Rules:

1. Seafarers must not be charged recruitment, placement or employment-access fees.
2. Optional services must remain separate from vacancy access.
3. Candidate presentation must not depend on a seafarer purchasing optional services.
4. Billing Operator must not create a paid access condition for job opportunities.
5. Reviewer must reject or escalate any workflow that appears to condition job access on payment by the seafarer.
6. Complaint Operator must escalate any no-fee complaint.

## 21. Employer-side control

Employer-side services may be paid B2B services.

Rules:

1. Employer access must be linked to a business client or representative path.
2. Company and representative authority should be reviewed before operational access.
3. Crew request publication should require minimum business readiness.
4. Candidate presentation to employer should require human review.
5. High-risk employers or inconsistent vessel data should be escalated before activation.

## 22. Data protection and confidentiality

Operators must process only the data needed for their role.

Rules:

1. Sensitive personal documents should be visible only to roles that need them.
2. Billing information should be visible only to Billing Operator, Project Owner and approved technical support where required.
3. Complaint details should be restricted to Complaint Operator, Project Owner and assigned reviewers.
4. Operator notes must remain professional, factual and audit-safe.
5. No secrets, keys or private credentials may be stored in this document or public comments.

## 23. Implementation boundary

This document defines the operating model only.

It does not authorize:

1. backend changes;
2. database migration execution;
3. production database writes;
4. authentication changes;
5. payment workflow changes;
6. nginx or server configuration changes;
7. OpenClaw configuration changes;
8. deployment.

Any implementation of these roles must be approved as a separate controlled task.

## 24. Recommended next steps

1. Project Owner reviews this role model.
2. Team accepts the role names and responsibility boundaries.
3. Agent prepares a future operator portal permission model based on this document.
4. Backend/API role enforcement is planned separately.
5. Operator dashboard UI is implemented only after approval.
6. Audit log implementation is planned as a separate task.

## 25. Final control statement

CrewPortGlobal team operations must be based on separated duties, human review, auditability and clear escalation.

The internal operator roles must support the maritime platform mission without turning the system into an uncontrolled generic admin panel.

Final decisions affecting verification, candidate presentation, complaints, billing exceptions and access rights must remain human-controlled and auditable.

## 26. Revision history

| Version | Date | Author | Changes |
|---|---|---|---|
| 0.1 | 2026-05-14 | GTC IT / AI Assistant | Initial team portal roles and operations model created for project-owner and team review |
