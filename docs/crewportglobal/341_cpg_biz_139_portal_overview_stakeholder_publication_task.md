# CPG-BIZ-139 - CrewPortGlobal Portal Overview And International Standards Publication Task

- Project: CrewPortGlobal.com
- Company: GTC INFORMATION TECHNOLOGY FZ-LLC
- Document type: Public stakeholder overview task and content source
- Source instruction: Project Owner request to consolidate portal purpose, realized functions, business-process logic and international-law alignment
- Version: 1.0
- Date: 2026-07-08
- Status: Implemented and published
- Proposed canonical public URL: `/legal/platform-overview/`

## 1. Purpose

CrewPortGlobal needs one consolidated public-facing document for interested parties.

The document must explain:

1. what CrewPortGlobal is;
2. what practical work the portal performs;
3. which participant groups use the portal;
4. which functions are already implemented;
5. how portal actions are connected to business processes, tasks, evidence and contracts;
6. how the product direction is aligned with international maritime labour and qualification standards.

This task prevents duplication. The public full text should be published once, under the legal/documents section, and other pages should link to it with short descriptions.

## 2. Duplication Check

Existing documents contain important source material, but none of them is the single public stakeholder overview requested here.

| Existing document | Existing purpose | Decision |
|---|---|---|
| `01_project_scope_and_positioning.md` | Short initial scope and positioning note | Keep as source; do not expand into the public overview because it is an early baseline document. |
| `69_international_maritime_application_goal_and_task_backlog.md` | Active product goal and task backlog | Keep as internal product direction source; do not publish as a stakeholder overview. |
| `326_cpg_project_memory_handoff_refresh_after_chat_review.md` | Current memory handoff after major discussion | Keep as internal memory; use as source for accepted standards. |
| `business_processes/15_crewportglobal_commercial_operating_cycle.md` | Commercial operating cycle | Keep as controlling business-process manual; summarize only. |
| `business_processes/16_business_process_stage_standard_mapping_matrix.md` | Stage-to-standard matrix and task routing model | Keep as controlling matrix; summarize only. |
| `business_processes/17_shipowner_agent_appointment_and_framework_agreement_process.md` | Dedicated shipowner-agent process | Keep as process standard; link/summarize only. |
| `implemented_code_standards/01_standard_form_lifecycle.md` | Implemented form lifecycle standard | Keep as code standard; summarize only. |
| `implemented_code_standards/04_standard_shipowner_agent_framework_offer_acceptance.md` | Implemented shipowner-agent offer/acceptance standard | Keep as code standard; summarize only. |
| `implemented_code_standards/05_standard_agent_assisted_direct_contract_drafting.md` | Implemented agent-assisted direct contract drafting standard | Keep as code standard; summarize only. |
| `projects/crewportglobal/content/public_pages/about/index.md` | Short public about/positioning page | Keep as short route content; it may link to the new overview after publication. |
| `/legal/` public documents hub | Canonical public publication place for standards, contracts and policies | Use as the only public publication area for this full overview. |

Conclusion: create one new task/content-source document. Do not create competing overview pages elsewhere.

## 3. Publication Rule

The full public overview must have one canonical public URL:

```text
/legal/platform-overview/
```

Other pages may show:

1. a short summary;
2. publication status and version;
3. a link to `/legal/platform-overview/`.

Other pages must not duplicate the full overview text.

This follows the existing CrewPortGlobal rule that public documents, standards, contracts and operating conditions are published through the `/legal/` section.

## 4. Source Standards And External References

Internal controlling sources:

1. BP-015 - commercial operating cycle;
2. BP-016 - business-process stage and standard mapping matrix;
3. BP-017 - shipowner agent appointment and framework agreement process;
4. ICS-001 - standard form lifecycle;
5. ICS-002 - protected upload standard;
6. ICS-003 - submit-review gate standard;
7. ICS-004 - shipowner-agent framework offer acceptance standard;
8. ICS-005 - agent-assisted direct contract drafting standard;
9. CPG-BIZ-132 - authoritative English shipowner-agent agreement package;
10. CPG-BIZ-135 - unified contract workspace for direct and agent agreements.

External international standards used for alignment:

1. ILO Maritime Labour Convention, 2006 overview: `https://www.ilo.org/international-labour-standards/maritime-labour-convention-2006`
2. ILO Maritime Labour Convention, 2006, as amended text: `https://www.ilo.org/sites/default/files/2024-10/NORMES_MLC%20Amendments-EN_2022_Web_1.pdf`
3. IMO STCW Convention overview: `https://www.imo.org/en/ourwork/humanelement/pages/stcw-conv-link.aspx`

This overview is an informational platform document, not legal advice and not a substitute for flag-state, port-state, employment, licensing, tax, immigration or data-protection advice.

## 5. Public Page Draft

### 5.1 Page Title

```text
CrewPortGlobal portal overview and operating standards
```

### 5.2 Short Positioning Text

CrewPortGlobal is an international maritime workflow platform for seafarers, shipowners, vessel operators, ship managers, agents and platform review teams.

The portal is designed as an action-first system: participants create records, upload evidence, receive tasks, review conditions, prepare contracts and move controlled work objects through a traceable business process.

At the current stage, CrewPortGlobal is operated as a technology and workflow service. It does not present itself as a licensed manning agency or employment agency unless and until required approvals are confirmed. Recruitment or placement activity requiring licensing must be performed only after regulatory confirmation or through appropriately licensed partners.

### 5.3 What The Portal Is Built To Do

CrewPortGlobal organizes maritime crewing work around structured data, reviewed evidence and controlled tasks.

The platform supports:

1. physical-person account registration and authentication;
2. role/capacity selection after registration;
3. seafarer profile creation and document readiness control;
4. shipowner, employer, vessel and crew-request intake;
5. human-reviewed request-supply matching;
6. controlled candidate presentation;
7. agent organization onboarding and authority review;
8. shipowner-agent framework agreement offer and acceptance;
9. one-active-manager assignment logic for represented objects;
10. participant notification ledger records;
11. unified contract workspace preparation;
12. agent-assisted drafting of direct seafarer-shipowner contracts;
13. team workspaces for document review, matching, shortlists, registry review and translation review;
14. access administration for owners and authorized administrators.

### 5.4 Participants

| Participant | Portal role |
|---|---|
| Seafarer | Creates and maintains a professional maritime profile, uploads documents, reviews opportunities and must not be charged recruitment or placement fees for access to work opportunities. |
| Shipowner / employer | Registers company, vessel and crew-request context, reviews controlled candidate presentations and may initiate contracts and agent appointment processes. |
| Agent / agent company | May act within verified authority, prepare work objects, assist with contract drafting and support both sides within controlled platform boundaries. |
| Platform review team | Reviews profiles, documents, companies, vessels, matching results, shortlists and presentation readiness. |
| Platform Administration / Control | Reviews authority, access, conflicts, assignment exceptions, governance blockers and admin-level permission changes. |
| Billing / commercial group | Handles future Service Orders, commercial addenda, price-basis records and billing evidence. |

### 5.5 How Work Moves Through The Portal

The portal does not rely on static pages alone. It computes participant tasks from business records.

The operating chain is:

```text
information stream
-> working object
-> object state
-> business-process stage
-> responsible participant / representative / group
-> visible task
-> exact working object link
-> evidence and audit record
-> next computed stage
```

This model is used so that every participant sees the work that belongs to the current stage instead of searching through unrelated pages.

### 5.6 Current Implemented Functional Areas

The current implementation includes these functional areas:

1. shared CrewPortGlobal application shell, navigation and multilingual page structure;
2. user registration, authentication and email-code access flow;
3. seafarer profile workspace with structured forms, autosave, completeness navigation and document readiness controls;
4. employer and shipowner intake for company, vessel and crew-request context;
5. operator and team review surfaces for profiles, companies, vessels, documents and vacancies;
6. vacancy and job-search flows with controlled review before candidate-facing or employer-facing use;
7. shipowner candidate selection workspace;
8. protected team pages for document review, request-supply comparison, shortlists, registry detail and translation review;
9. agent organization scope, authority evidence, object assignments, agent tasks and managed object workspaces;
10. shipowner-to-agent in-system framework offer, agent acceptance, platform authority evidence, one-active-manager assignment and participant notification ledger entries;
11. unified Contract Agreement Workspace foundation;
12. agent-assisted drafting of direct seafarer-shipowner contracts through the guarded contract workspace;
13. public legal documents hub with canonical publication of platform terms, policies and contract standards;
14. admin access controls and owner/admin executable menu links.

### 5.7 International Maritime Standards Alignment

CrewPortGlobal is designed around maritime labour and qualification principles rather than ordinary generic job-board logic.

The platform aligns with the Maritime Labour Convention, 2006 (MLC) by building controls for:

1. no recruitment or placement fee charged to seafarers for access to employment opportunities;
2. seafarer access to contract conditions before signature;
3. direct party review of critical employment terms;
4. wage, joining, return and repatriation data inside contract preparation workflows;
5. complaint and correction routes;
6. controlled recruitment/placement evidence and authority records;
7. human review before candidate presentation and contract-critical steps.

The platform aligns with STCW principles by treating rank, certificates, training, endorsements, watchkeeping-related qualifications and document readiness as structured evidence rather than free marketing text.

CrewPortGlobal does not automatically certify that a participant, vessel, document, contract or employment decision satisfies all applicable law. The portal provides workflow discipline, evidence structure, review controls and audit records that support lawful decision-making by the responsible parties and competent professionals.

### 5.8 Contract And Authority Model

CrewPortGlobal separates legal authority, operational workflow and commercial terms.

Important principles:

1. a physical person should control their own account credentials;
2. a participant may appoint or revoke a representative inside the platform when the relevant authority process exists;
3. a representative's operational rights must be based on verified authority evidence;
4. only one active managing representative may control the same delegated object scope at a time;
5. a shipowner sends an offer to an agent; the appointment becomes active only after the agent accepts the standard framework agreement inside the platform and authority records are created;
6. commercial price, Service Order, paid service activation and billing basis remain separate from the framework agreement unless separately accepted;
7. direct seafarer-shipowner contract terms must remain visible to the real parties for review and approval;
8. agent-assisted drafting is preparation, not automatic final signature by the agent.

### 5.9 What CrewPortGlobal Does Not Do

The portal must not be presented as:

1. a source of fake vacancies, fake employers or decorative marketplace activity;
2. a system that charges seafarers for recruitment or placement;
3. an automatic legal certification system;
4. an automatic employment-decision engine;
5. a substitute for required maritime, labour, immigration, tax, flag-state or licensing advice;
6. a tool that turns an external private contract into platform authority without CrewPortGlobal's controlled authority and assignment process.

### 5.10 Useful Public Links

The published page should link to:

```text
/legal/
/legal/terms/
/legal/privacy/
/legal/no-recruitment-fees/
/legal/candidate-agreement/
/legal/shipowner-service-terms/
/legal/agent-agreement/
/legal/complaints/
```

The page may also include a short "International references" block with the ILO and IMO links listed in section 4.

## 6. Implementation Task

Create the public page:

```text
/legal/platform-overview/
```

The page must:

1. use the shared CrewPortGlobal public/header/navigation components;
2. appear as a link/card on `/legal/`;
3. preserve the public legal/document hub as the single canonical publication area;
4. use this document as the content source;
5. provide English primary text and Russian translation through the existing i18n/content workflow;
6. show document status, version and effective/review date;
7. avoid duplicating full contract text already published under other canonical legal URLs;
8. avoid marketing claims that contradict the Stage 1 technology/workflow-service positioning;
9. include a clear non-legal-advice statement;
10. include links to the public legal documents and external ILO/IMO references.

## 7. Acceptance Criteria

The task is complete when:

1. `/legal/platform-overview/` opens without 404;
2. `/legal/` links to the overview page;
3. the page content matches the approved source text or approved edits to this document;
4. English and Russian texts are available through the accepted localization mechanism;
5. the page does not duplicate the full text of platform terms, privacy policy, no-fee policy, candidate agreement, shipowner terms or agent agreement;
6. all internal links use public portal URLs, not raw repository paths;
7. the page passes visual review in desktop and mobile layouts;
8. publication is recorded in the documentation register and implementation report if runtime code is changed.

## 8. Deferred Decisions

The following items are deliberately left for later implementation:

1. whether the page should also be linked from the main home page;
2. whether a short PDF export is required for meetings with external parties;
3. whether the page should include live portal metrics after verified production data is available;
4. whether the page should include separate stakeholder tabs for seafarers, shipowners, agents and regulators;
5. whether legal counsel wants narrower wording for licensing and jurisdiction references.

## 9. Revision History

| Version | Date | Author | Changes |
|---|---|---|---|
| 1.1 | 2026-07-08 | GTC IT / AI Assistant | Marked as implemented and published through `/legal/platform-overview/`; implementation report recorded in document 342 |
| 1.0 | 2026-07-08 | GTC IT / AI Assistant | Initial consolidated stakeholder overview task and public-page content source |
