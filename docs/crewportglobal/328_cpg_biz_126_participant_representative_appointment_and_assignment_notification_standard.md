# CPG-BIZ-126 - Participant Representative Appointment And Assignment Notification Standard

- Project: CrewPortGlobal.com
- Company: GTC INFORMATION TECHNOLOGY FZ-LLC
- Stage: Stage 1 - Digital Maritime Crew Data and Matching Platform
- Document type: Business-process and future implementation standard
- Source task: continuation after CPG-BIZ-125 and Project Owner clarification on agent dual-interest work, participant autonomy and one-active-manager principle
- Version: 1.0
- Date: 2026-06-10
- Status: Drafted for Project Owner review before runtime implementation

## 1. Purpose

This document expands the next agent-stage from simple assignment/reassignment notifications into a full participant representative appointment model.

The standard covers:

1. seafarer representative appointment;
2. shipowner/employer representative appointment;
3. agent-created participant records;
4. participant account activation and claim;
5. personal appointment or rejection of an agent by the represented participant;
6. replacement of a current managing agent;
7. notification of the represented party, new agent, previous agent and Platform Administration / Control.

## 2. Core Compromise

CrewPortGlobal must support real crewing practice.

An agent may search for seafarers for a shipowner and may assist seafarers during the same placement process. This is normal dual-interest facilitation.

But CrewPortGlobal must also preserve party autonomy.

The compromise standard is:

```text
agent may create and prepare participant records
+ participant must become a registered/claimed platform party
+ participant must personally accept platform participation
+ participant must appoint, reject or replace the managing representative
+ the system allows only one active managing representative per object
= practical workflow with controlled representation
```

This creates a workable middle path between three risky extremes:

1. forcing all participants to do everything themselves, which would make the platform impractical for agent-led crewing;
2. letting one agent silently control both sides, which can remove party choice and create conflict risk;
3. banning one agent from facilitating both sides, which does not match ordinary crewing practice.

One agent may be connected to both sides of a placement only when the connection is visible and controlled:

1. both sides are visible as separate platform participants;
2. each side has its own account activation or approved enhanced-authority route;
3. each side can see the agent relationship;
4. each side can appoint, reject or replace its own managing representative;
5. the system does not let the agent silently approve final contract-critical terms for both sides;
6. the contract workspace discloses the dual-side agent context before party review.

This is the preferred fourth option:

```text
permit disclosed dual-side facilitation
+ require personal party activation/appointment where possible
+ allow enhanced authority only as a controlled exception
+ preserve final party approvals
= practical crewing agency model with participant protection
```

## 3. One-Active-Manager Rule

For platform task routing, a participant object cannot have two active managing agents at the same time.

The current technical foundation already supports this direction through the active assignment uniqueness rule:

```text
agent_object_assignments(object_type, object_id)
WHERE assignment_status IN ('active', 'limited')
```

Future implementation must preserve this principle.

Allowed management states:

| State | Meaning |
|---|---|
| `self_managed` | The participant controls the object directly without an active managing agent. |
| `agent_created_pending_party_activation` | Agent created/requested the participant record, but the participant has not yet claimed/activated it personally. |
| `party_activation_pending` | Invitation or claim route has been sent to the represented participant. |
| `representation_agreement_pending_signature` | Participant is reviewing the agent representation agreement or authority evidence. |
| `active_agent_management` | Participant or Platform Administration / Control approved one active managing agent for the object. |
| `change_requested` | Participant, current agent, claimant agent or Platform Administration / Control requested representative replacement. |
| `reassignment_control_review` | Platform Administration / Control is reviewing replacement evidence. |
| `reassigned` | Previous assignment was replaced and remains only in audit/history. |
| `revoked` | Participant or control role ended the assignment. |
| `blocked_control_review` | Assignment cannot proceed because evidence, consent, conflict or authority is insufficient. |

## 4. Agent-Created Participant Records

An agent may create or request creation of:

1. physical person/user context;
2. seafarer profile;
3. employer/company card;
4. vessel card;
5. vacancy/crew request context.

But agent creation is not the same as participant self-authorization.

Until the participant has claimed/activated the account or a controlled power-of-attorney exception is approved:

1. the record may be used for preparation and duplicate checking;
2. the agent may upload authority/support evidence inside limited scope;
3. the record must show `pending_party_activation`;
4. contract-critical approvals must remain blocked;
5. final platform participation, representation appointment and contract signature must not be treated as personally accepted by the participant.

## 5. Participant Personal Appointment Route

Preferred route:

```text
agent creates/request participant object
-> platform sends safe invitation to participant
-> participant registers or claims account
-> participant accepts platform terms and no-fee / service boundaries where applicable
-> participant reviews agent representation agreement
-> participant appoints agent, rejects agent or selects self-management
-> system activates only one managing representative
-> previous agent, new agent and control roles receive safe notifications
```

This route should be the default for both:

1. seafarer-side representation;
2. shipowner/employer-side representation.

The participant's personal appointment must create audit evidence:

1. participant user ID;
2. object type and object ID;
3. agent organization ID;
4. representation capacity;
5. agreement/version reference;
6. timestamp;
7. IP/device/session evidence where available;
8. whether any contract-critical workspace was already open.

## 6. Enhanced Power-Of-Attorney Route

A power of attorney or broad agency agreement may permit the agent to act for a party in some circumstances.

CrewPortGlobal may support this route only as:

```text
enhanced_authority_exception
```

Required controls:

1. uploaded authority document;
2. identity of represented party;
3. scope of authority;
4. whether the agent may register the party on the platform;
5. whether the agent may appoint itself as managing representative;
6. whether the agent may approve non-contract-critical operational tasks;
7. whether the agent may approve contract-critical terms;
8. whether the agent may sign or only prepare documents;
9. validity period;
10. revocation route;
11. Platform Administration / Control review;
12. legal/control review where signature or dual-side final authority is claimed.

Even under enhanced authority, the participant should receive notice where contact details are available and should be able to claim the account or challenge the representation.

## 7. Representative Change And Reassignment

Representative change may be initiated by:

1. the represented seafarer;
2. the represented shipowner/employer;
3. the current managing agent;
4. a claimant/new agent with authority evidence;
5. Platform Administration / Control;
6. legal/control review outcome.

Change must not produce two active managers.

If a new assignment is approved:

1. existing active/limited assignment becomes `reassigned`, `revoked` or `expired`;
2. new assignment becomes the task-routing `Managed by` actor;
3. previous assignment remains visible only in audit/history;
4. ordinary future tasks route to the new managing participant;
5. open contract-critical tasks are recomputed and may require fresh party confirmation.

## 8. Required Notifications

Notification is required when:

1. agent creates a participant record that needs party activation;
2. participant claims a record created by an agent;
3. participant appoints an agent;
4. participant rejects an agent request;
5. new agent claim is approved;
6. current agent is replaced;
7. assignment is revoked, suspended, expired or limited;
8. contract-critical workspace is affected by representative change;
9. enhanced power-of-attorney route is approved or rejected.

Recipients:

| Event | Required recipients |
|---|---|
| Agent-created participant pending activation | Represented participant if contact is available; Platform Administration / Control; creating agent. |
| Participant account claim | Participant; current managing agent if any; Platform Administration / Control. |
| Agent appointment | Participant; appointed agent; previous agent if replaced; Platform Administration / Control. |
| Agent rejection | Participant; rejected agent; Platform Administration / Control. |
| Agent reassignment | Participant; new agent; previous agent; Platform Administration / Control. |
| Contract-critical reassignment | Participant; new agent; previous agent; opposite contract party where safe and necessary; Platform Administration / Control. |
| Enhanced authority exception | Participant where contact is available; agent; Platform Administration / Control; legal/control role where required. |

Notification payload must include only safe data:

1. object type;
2. safe object summary;
3. represented party type;
4. representation capacity;
5. current management status;
6. new agent organization name;
7. previous agent organization name where applicable;
8. authority reference/status;
9. whether party activation is pending;
10. whether contract-critical work is blocked or needs fresh review;
11. safe action link or blocker explanation.

## 9. Computed Tasks

The following tasks should be computable from records, not manually invented:

| Recipient | Task |
|---|---|
| Seafarer participant | Claim your account; Review agent appointment; Confirm or reject representation; Review contract-critical changes. |
| Shipowner/employer participant | Claim company/account; Review agent appointment; Confirm or reject representation; Review affected crew request/contract changes. |
| Agent organization | Complete authority evidence; Invite represented participant; Wait for party activation; Respond to rejected/expired assignment. |
| Previous agent | Assignment ended/reassigned notification; Close handoff tasks; Preserve audit-only access where required. |
| Platform Administration / Control | Review new representative request; Resolve duplicate/account claim; Approve/reject enhanced authority; Recompute affected tasks. |

## 10. Future Implementation Scope

This standard prepares the next runtime implementation stage.

Future implementation should add:

1. participant activation status in agent-created object responses;
2. representation capacity and party-activation fields in assignment metadata or dedicated schema;
3. safe notification/task records for appointment, rejection and reassignment events;
4. owner/participant cabinet tasks for agent appointment approval;
5. admin/control review actions for enhanced authority and representative change;
6. task recomputation after assignment status changes;
7. tests proving that two active managers cannot exist for the same object.

No runtime migration or API behavior is changed by this document itself.

## 11. Recommended Next Engineering Slice

Recommended implementation after Project Owner approval:

```text
CPG-BIZ-127 - Participant representative appointment notifications API/UI implementation
```

Suggested first slice:

1. preserve the existing one-active-assignment database rule;
2. add safe assignment notification records or audit-derived notification payloads;
3. expose participant-facing tasks for agent-created pending activation and agent appointment review;
4. expose previous-agent/new-agent notification tasks after reassignment;
5. keep contract-critical approvals blocked until party activation or enhanced authority is verified.
