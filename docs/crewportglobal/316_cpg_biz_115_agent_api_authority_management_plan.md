# CPG-BIZ-115 - Agent API Authority And Management Scope Plan

- Project: CrewPortGlobal.com
- Company: GTC INFORMATION TECHNOLOGY FZ-LLC
- Stage: Stage 1 - Digital Maritime Crew Data and Matching Platform
- Document type: API implementation plan for Project Owner review
- Source task: continuation after CPG-BIZ-114 and Project Owner clarification
- Version: 1.0
- Date: 2026-06-08
- Status: Drafted for implementation approval

## 1. Назначение

Этот документ фиксирует уточненную модель подключения агентских организаций к API CrewPortGlobal.

Главное правило:

```text
agent may create an object request
but agent may manage the object only after verified authority
and active object assignment.
```

Агент может начать создание любого объекта в интересах клиента, но это не означает автоматического права управлять этим объектом.

## 2. Разделение Создания И Управления

### 2.1 Создание объекта агентом

Агенту должно быть разрешено инициировать создание:

1. физического лица / пользователя;
2. профиля моряка;
3. судовладельца / компании;
4. судна;
5. вакансии / crew request;
6. заявки на подбор;
7. будущего contract workspace, если это разрешено состоянием процесса.

Создание выполняется через:

```text
agent_object_creation_requests
```

На этом этапе агент создает не окончательный управляемый объект, а контролируемый запрос на создание или связывание объекта.

### 2.2 Управление объектом агентом

Агент получает право управлять объектом только если выполнены все условия:

```text
agent organization is active
+ agent user is active
+ authority document is verified
+ authority scope covers the object
+ agent_object_assignment is active
+ user has required permission
+ object state requires the operation
= allowed agent operation
```

Иначе агент может видеть только безопасный статус запроса, но не может действовать от имени участника.

## 3. Доверенность / Authority Evidence

Доверенность или иной документ полномочий должны храниться в базе данных как отдельная проверяемая запись:

```text
agent_authority_documents
```

Обязательные поля контроля:

| Field | Meaning |
|---|---|
| `agent_organization_id` | Агентская организация, заявляющая полномочие. |
| `document_id` | Защищенный загруженный документ из `uploaded_documents`, если применимо. |
| `authority_type` | Тип основания: доверенность, соглашение, authorization, representative authority. |
| `authority_scope_type` | Область действия: platform, company, vessel, seafarer_profile, vacancy_request, contract_workspace. |
| `authority_scope_object_id` | Конкретный объект, если полномочие объектное. |
| `authority_status` | draft, submitted, under_review, verified, limited, rejected, expired, revoked. |
| `valid_from` / `valid_until` | Срок действия полномочий. |
| `reviewed_by_user_id` / `reviewed_at` | Кто проверил полномочие. |
| `scope_snapshot` | Безопасный снимок области полномочий. |

## 4. Где Должна Отображаться Доверенность

Доверенность должна быть видима в двух рабочих местах.

### 4.1 Список объектов, управляемых агентом

В списке объектов агента каждая строка должна показывать:

| Element | Requirement |
|---|---|
| Object safe summary | Краткое безопасное описание участника или объекта. |
| Object type | Seafarer, shipowner, vessel, vacancy, contract workspace. |
| Assignment status | active, limited, suspended, expired. |
| Authority status | verified, limited, expired, rejected, missing. |
| Authority type | Power of attorney, seafarer authorization, shipowner agency agreement, vessel authority. |
| Authority valid until | Дата окончания полномочий. |
| Management allowed | yes/no, вычисляется API. |
| Next computed operation | Следующее действие, если оно разрешено. |

Если доверенность отсутствует или не проверена, строка должна показывать:

```text
Management blocked: authority not verified.
```

### 4.2 Карточка участника / объекта

Если объект управляется агентом, карточка участника должна показывать полный агентский контекст:

1. название агентской организации;
2. ответственный agent user, если назначен;
3. статус assignment;
4. тип доверенности / authority basis;
5. статус проверки доверенности;
6. срок действия полномочий;
7. ссылку на безопасную карточку authority evidence для Platform Administration / Control;
8. историю assignment / reassignment;
9. предупреждение, если полномочия истекли, ограничены или отозваны.

Эта информация должна быть доступна Platform Administration / Control и пользователям, которым разрешено видеть управление их объектом.

## 5. API Слои

### 5.1 Agent-facing API

Минимальный agent-facing API:

| Method | Path | Purpose |
|---|---|---|
| `GET` | `/api/v1/agents/me` | Вернуть active agent organizations текущего пользователя и их статусы. |
| `GET` | `/api/v1/agents/objects` | Вернуть только assigned/created objects в пределах agent scope. |
| `GET` | `/api/v1/agents/tasks` | Вернуть вычисленные задачи агента. |
| `POST` | `/api/v1/agents/authority-documents` | Создать/подать authority evidence. |
| `POST` | `/api/v1/agents/object-creation-requests` | Создать запрос на создание/связывание объекта. |
| `GET` | `/api/v1/agents/object-creation-requests` | Список собственных creation requests агента. |

### 5.2 Platform Administration / Control API

Минимальный control API:

| Method | Path | Purpose |
|---|---|---|
| `GET` | `/api/v1/admin/agents` | Список агентских организаций. |
| `PATCH` | `/api/v1/admin/agents/{id}` | Approve, limit, suspend, reject, archive. |
| `GET` | `/api/v1/admin/agent-authority-documents` | Список authority evidence для проверки. |
| `PATCH` | `/api/v1/admin/agent-authority-documents/{id}` | Verify, limit, reject, expire, revoke. |
| `GET` | `/api/v1/admin/agent-object-creation-requests` | Проверка agent-created object requests. |
| `PATCH` | `/api/v1/admin/agent-object-creation-requests/{id}` | Approve, request evidence, block duplicate, reject, link. |
| `POST` | `/api/v1/admin/agent-object-assignments` | Назначить объект агенту после проверки основания. |
| `PATCH` | `/api/v1/admin/agent-object-assignments/{id}` | Suspend, revoke, expire, reassign. |

## 6. Computed Task Rule

Задача агента должна вычисляться так:

```text
object state
+ active agent organization
+ active agent user
+ verified authority covering object
+ active object assignment
+ required permission
= visible agent task
```

Отдельное правило для creation request:

```text
agent user may create object-creation request
without existing object assignment,
but may not manage the created/linked object
until Platform Administration / Control verifies authority
and creates active object assignment.
```

## 7. Duplicate / Existing Record Check

Перед созданием или связыванием объекта API должен выполнить duplicate check:

| Object type | Duplicate signals |
|---|---|
| person_user | e-mail, phone where safe, identity signals. |
| seafarer_profile | user link, document signals, name/date of birth where available. |
| employer_company | registration number, country, company name. |
| vessel | IMO, vessel name, flag, owner/operator link. |
| vacancy_request | company, vessel, rank, join date, contract context. |

Если найден возможный дубль, создается или обновляется:

```text
account_object_claims
```

До решения Platform Administration / Control агент не получает полный доступ к существующему объекту.

## 8. Audit Rule

Каждое действие должно фиксироваться в:

```text
agent_scope_audit_events
```

Минимальные event types:

```text
agent_authority_submitted
agent_authority_reviewed
agent_object_creation_requested
agent_object_duplicate_check_completed
agent_object_creation_approved
agent_object_created_or_linked
agent_object_assignment_created
agent_object_assignment_suspended
agent_object_reassigned
agent_management_blocked_missing_authority
```

## 9. Acceptance Criteria

Этап CPG-BIZ-115 считается готовым к реализации, когда:

1. API не путает создание объекта и право управления объектом.
2. Агент может подать controlled object creation request для любого поддержанного типа объекта.
3. Управление объектом возможно только при verified authority и active assignment.
4. Доверенность хранится в `agent_authority_documents`.
5. Доверенность отображается в списке управляемых агентом объектов.
6. Доверенность отображается в карточке участника/объекта, если объект управляется агентом.
7. Duplicate / existing-record check выполняется до предоставления полного доступа.
8. Все authority, creation, assignment и blocked-management события пишутся в audit.
9. `/agents/` можно подключить к API без предоставления широкого доступа к чужим данным.

## 10. Next Stage

После утверждения этого плана следующий этап:

```text
CPG-BIZ-116 - Agent API skeleton and verified-authority guard implementation
```

Рекомендуемый порядок реализации:

1. `GET /api/v1/agents/me`;
2. `POST /api/v1/agents/object-creation-requests`;
3. `GET /api/v1/agents/objects`;
4. `GET /api/v1/agents/tasks`;
5. `POST /api/v1/agents/authority-documents`;
6. admin review endpoints for authority and assignment;
7. `/agents/` UI connection to live API.

