# CrewPortGlobal — Architecture Decision: GTC1 App Runtime and GTC-AGENT OpenClaw Separation

- Project: CrewPortGlobal
- Document owner: GTC INFORMATION TECHNOLOGY FZ-LLC
- Version: 0.1
- Status: Draft ADR
- Classification: Internal
- Effective date: 2026-05-10
- Review date: 2026-06-10
- ADR number: 48

## 1. Decision Summary

CrewPortGlobal website and application runtime are planned on GTC1.

CrewPortGlobal SQL database is planned on GTC1.

OpenClaw runtime and agent platform remain on GTC-AGENT.

`n8n` is excluded from the planned architecture.

## 2. Decision Statement

The CrewPortGlobal public website at `https://crewportglobal.com/` and the CrewPortGlobal website application runtime are planned to run on GTC1.

The CrewPortGlobal SQL database layer for the `crewport` schema is also planned on GTC1.

OpenClaw remains a separate runtime on GTC-AGENT and is planned only as an assistive operator or agent-support layer with a controlled connection to GTC1 where separately approved.

This ADR does not approve implementation.

## 3. Context

The current planning package already establishes the following architectural direction:

1. the CrewPortGlobal website application is the primary public-facing surface;
2. the CrewPortGlobal database boundary remains project-local;
3. OpenClaw is assistive only and not a final decision authority;
4. `n8n` is not part of the planned architecture.

The remaining unresolved placement question was where the website application runtime, SQL runtime and assistive-agent runtime should live operationally.

## 4. Approved Runtime Placement

### 4.1 GTC1

GTC1 is the planned runtime location for:

1. `crewportglobal.com` public website hosting;
2. CrewPortGlobal website application runtime;
3. CrewPortGlobal app files;
4. PostgreSQL and the `crewport` schema;
5. local application logs and static assets;
6. existing local web or chat examples that remain on the same host for broader repository operations.

### 4.2 GTC-AGENT

GTC-AGENT is the planned runtime location for:

1. OpenClaw;
2. agent or operator support functions;
3. review summaries;
4. document completeness support;
5. controlled assistive interaction with GTC1 where separately approved.

## 5. Recommended Architecture Shape

Recommended planning shape:

```text
GTC1
  - crewportglobal.com
  - CrewPortGlobal website application
  - CrewPortGlobal app files
  - PostgreSQL / crewport schema
  - existing web/chat examples
  - local application logs / static assets

GTC-AGENT
  - OpenClaw
    - agent/operator support
    - regulated support tasks
    - review summaries
    - document completeness support
    - controlled connection to GTC1
```

## 6. Key Architectural Implications

This decision means:

1. the public site and application runtime stay co-located on GTC1;
2. the app runtime and SQL boundary stay co-located on GTC1 for Stage 1 planning;
3. assistive-agent runtime remains separated from the public application host;
4. OpenClaw stays outside the primary application runtime and database host;
5. `n8n` remains excluded and is not used as a workflow, app or integration layer.

## 7. Explicit Non-Goals

This ADR does not authorize:

1. code changes;
2. SQL execution;
3. database changes;
4. auth changes;
5. Stripe changes;
6. nginx changes;
7. OpenClaw configuration changes;
8. `n8n` workflow creation;
9. deployment.

## 8. OpenClaw Boundary

OpenClaw on GTC-AGENT remains limited to assistive uses such as:

1. operator support;
2. review summaries;
3. document completeness support;
4. controlled agent assistance for human-reviewed workflows.

OpenClaw is not approved for:

1. autonomous hiring or placement decisions;
2. autonomous verification approval;
3. candidate submission decisions;
4. payment decisions;
5. bypass of human review.

## 9. n8n Exclusion

`n8n` is excluded from the CrewPortGlobal planned architecture.

It is not planned as:

1. website runtime;
2. application runtime;
3. orchestration layer;
4. integration dependency;
5. workflow engine for this project.

## 10. Operational Safety Note

Even with this runtime-placement decision, all existing Stage 1 restrictions remain in force.

This ADR authorizes only architectural direction for owner review and later planning alignment.

It does not approve runtime changes on GTC1, runtime changes on GTC-AGENT, service activation, deployment, SQL execution or infrastructure modification.

## 11. Final Control Statement

ADR 48 is ready for project-owner review. Implementation remains not approved.