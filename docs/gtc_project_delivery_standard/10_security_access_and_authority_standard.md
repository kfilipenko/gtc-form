# GTC-STD-010 - Security, Access And Authority Standard

- Owner: GTC INFORMATION TECHNOLOGY FZ-LLC
- Scope: authentication, authorization, protected operations and representative authority
- Version: 0.1
- Date: 2026-07-08
- Status: Baseline standard extracted from CrewPortGlobal

## 1. Purpose

This standard defines baseline access and authority controls for future GTC projects.

The goal is to prevent uncontrolled account use, unclear admin access and representative actions without evidence.

## 2. Personal Account Rule

Personal credentials should remain personal.

Another participant, agent or operator should not create or operate an ordinary active personal account instead of the actual person unless an approved exception flow exists.

If a representative prepares data for another party, the platform should distinguish:

```text
preparation/invitation context
!=
personal account ownership
```

## 3. Role And Permission Rule

Access should be based on:

1. authenticated identity;
2. active account status;
3. role;
4. group/membership;
5. permission;
6. object relationship;
7. assignment/authority scope where applicable.

Do not rely only on route hiding. Backend guards must enforce protected operations.

## 4. Admin Access

Admin access should:

1. require an eligible user;
2. use auditable login/access events;
3. avoid exposing whether a non-eligible email exists when privacy requires masking;
4. separate ordinary team links from owner/admin executable links;
5. log management actions.

## 5. Representative Authority

If a representative or agent acts for a participant, record:

1. represented party;
2. representative identity/organization;
3. authority evidence;
4. scope;
5. start/end status;
6. restrictions;
7. one-active-manager rule if operational control is delegated;
8. notifications to affected parties.

## 6. One Active Manager Rule

For a delegated operational scope:

```text
one object/scope -> one active managing representative
```

If a new representative is appointed, replacement/revocation must be controlled and audited.

## 7. Notification Rule

Important authority and account events should create notification/evidence records.

Examples:

1. authority requested;
2. authority accepted;
3. assignment activated;
4. representative changed;
5. contract draft prepared;
6. document generated;
7. access changed;
8. admin action performed.

## 8. Secret Handling

Secrets must not be committed.

Runtime configuration with secrets should live in host-managed environment/config, not public roots and not general documentation.

When investigating delivery or auth issues, report statuses and configuration gaps without printing secret values.

## 9. Acceptance Criteria

An access/authority feature is ready when:

1. backend guard exists;
2. UI only exposes allowed actions;
3. object scope is checked;
4. audit event or evidence record exists;
5. notifications are created for participant-important events;
6. tests cover allowed and blocked paths.

## 10. Revision History

| Version | Date | Author | Changes |
|---|---|---|---|
| 0.1 | 2026-07-08 | GTC IT / AI Assistant | Initial security, access and authority standard |
