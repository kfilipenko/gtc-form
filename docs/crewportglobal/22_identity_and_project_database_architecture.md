# CrewPortGlobal — Identity and Project Database Architecture

This document defines the current architectural boundary for CrewPortGlobal identity and project data.

The main rule for Stage 1 is simple: CrewPortGlobal may live inside the broader repository, but its project-specific source, documentation, scripts, CSS and deployment artifacts must remain inside `projects/crewportglobal/` and `docs/crewportglobal/`. Authentication and cross-project identity coupling are intentionally deferred.

## 1. Architectural goal

CrewPortGlobal needs a project-local data architecture that can later integrate with wider platform services without being defined by them.

At this stage, the public site and its documentation are the authoritative product surface. Shared GTC authentication, billing or user-app coupling must not drive the public CrewPortGlobal project structure.

## 2. Identity boundary

The current repository contains a wider `gtc_user_id` model used by other products.

For CrewPortGlobal, the architectural position is:

1. do not assume shared authentication as a prerequisite for the public site;
2. do not bind public onboarding pages to `app.gtstor.com` or generic `/auth/*` flows at this stage;
3. treat future CrewPortGlobal identity integration as a separate workstream with its own design review.

This preserves a clean project boundary and avoids accidental cross-project coupling.

## 3. Source-of-truth directories

CrewPortGlobal source of truth is currently split into two roots only:

- `docs/crewportglobal/` for project documentation, compliance documents and architectural notes;
- `projects/crewportglobal/` for public content, CSS, scripts and deployment artifacts.

The live publication root and system nginx configuration are deployment targets, not project-source directories.

## 4. Project data domains

When CrewPortGlobal-specific data storage is formalized, the project should separate at least these domains:

1. seafarer profile and readiness data;
2. business client onboarding and KYB data;
3. vessel and crew-request context;
4. matching workflow state and review decisions;
5. verification evidence and audit metadata;
6. publication and document-source metadata.

These domains should be separable even if they later share infrastructure.

## 5. Recommended identifier model

A future CrewPortGlobal database design should distinguish between:

- platform-level identifiers that may come from shared infrastructure later;
- CrewPortGlobal project-level entities such as candidate profiles, business accounts, vessels, crew requests and review cases.

The project should avoid inventing ad-hoc identity shortcuts in frontend code. Canonical identifiers should be issued and resolved by the data layer once the dedicated identity workstream begins.

## 6. Recommended table groups

A future CrewPortGlobal schema should likely organize around these table groups:

1. `crewport_candidates` or equivalent candidate profile table;
2. `crewport_candidate_documents` for document metadata and readiness states;
3. `crewport_business_accounts` for business-client KYB and representative authority;
4. `crewport_vessels` for vessel identity and ownership or management context;
5. `crewport_crew_requests` for vacancy and operational demand records;
6. `crewport_matching_cases` for shortlist and review workflows;
7. `crewport_verification_events` for audit trail, outcomes and supporting evidence references.

The exact table names can change, but the separation of concerns should remain.

## 7. Verification data model principles

Verification should not be modeled as a business-only concern.

The data model should support verification records for:

- seafarer identity and professional readiness;
- business-client legal and authority checks;
- vessel identity and operational legitimacy;
- workflow-level flags, exceptions and review outcomes.

This is why the public policy was renamed from KYB Policy to Verification Policy.

## 8. Publication architecture

The public site is generated from canonical Markdown and project-local assets.

Current publication structure:

- canonical public Markdown: `projects/crewportglobal/public/**/index.md`;
- generated HTML: sibling `index.html` files;
- generator script: `projects/crewportglobal/scripts/generate_public_pages.py`;
- project CSS: `projects/crewportglobal/public/assets/crewportglobal-docs.css`;
- repo deployment artifacts: `projects/crewportglobal/deploy/`.

This structure should remain self-contained.

## 9. Stage 1 conclusion

Stage 1 architecture favors separation over premature integration.

CrewPortGlobal should keep its own documentation, source files, publishing logic and future project-data design coherent inside its project roots first. Shared authentication and deeper cross-product data links can be introduced later only as an explicit follow-up architecture task.