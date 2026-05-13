# Registration Draft Endpoint Stubs (CPG-BE-002)

These stubs define expected handler responsibilities without implementation.

## create_registration_draft(request)

Input:
- role (required)
- email (required)
- optional profile/company fields

Expected behavior:
1. validate payload shape
2. normalize role/email
3. open transaction
4. create or resolve user record
5. create role mapping
6. create/update role-specific draft profile/company context
7. write registration audit event
8. return 201 with draft payload

Not implemented in this stub:
- DB access code
- auth/session checks
- password handling

## get_registration_draft(draft_id)

Expected behavior:
1. validate UUID
2. load draft aggregate by id
3. return 200 or 404

Not implemented in this stub:
- DB access code
- auth/session checks

## update_registration_draft(draft_id, request)

Expected behavior:
1. validate UUID + payload shape
2. apply partial updates to allowed fields
3. write registration audit event
4. return updated aggregate

Not implemented in this stub:
- DB access code
- auth/session checks
