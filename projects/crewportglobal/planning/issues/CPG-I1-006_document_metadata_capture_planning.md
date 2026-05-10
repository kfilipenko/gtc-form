# CPG-I1-006 — Document Metadata Capture Planning

- Ticket ID: CPG-I1-006
- Title: Document metadata capture planning
- Status: Draft issue, not approved for implementation.
- Increment: Increment 1
- Scope: Seafarer-only website prototype planning

## 1. Objective

Define the planning baseline for document metadata fields, completeness checks and operator-visible missing-item summaries.

## 2. Planning Tasks

1. define metadata categories for submitted evidence;
2. define completeness and missing-item rules for planning review;
3. define operator-visible document-status expectations;
4. define incomplete-submission behavior without DB execution.

## 3. Draft Acceptance Criteria

1. metadata planning remains storage-agnostic;
2. no provider integration or production write is assumed;
3. completeness rules are bounded to seafarer prototype scope;
4. review visibility requirements are identified.

## 4. Explicit Exclusions

1. no file-storage implementation;
2. no provider integration;
3. no production writes;
4. no code implementation.

## 5. Dependencies

Depends on form-planning and route-planning assumptions.

## 6. Mandatory Restriction

No code may be written, no SQL may be executed, no database may be touched, no authentication or payment workflow may be changed, no nginx configuration may be changed, no OpenClaw configuration may be modified, no n8n workflow may be created, and no deployment may be performed without separate explicit project-owner approval.

## 7. Final Control Statement

This draft issue is prepared for project-owner review only. Implementation remains not approved.