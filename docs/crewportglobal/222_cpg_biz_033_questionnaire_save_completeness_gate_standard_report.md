# CPG-BIZ-033 - Стандарт Сохранения Анкеты И Проверки Полноты Перед Review

- Project: CrewPortGlobal.com
- Company: GTC INFORMATION TECHNOLOGY FZ-LLC
- Stage: Stage 1 - Digital Maritime Crew Data and Matching Platform
- Document type: Отчет об уточнении бизнес-процесса
- Source task: Project Owner instruction after CPG-BIZ-032
- Version: 1.0
- Date: 2026-05-28
- Status: Business-process standard documented; implementation remains a future controlled slice

## 1. Назначение

Этот отчет фиксирует новый общий стандарт для всех анкет CrewPortGlobal.

Стандарт нужен, чтобы пользователь не мог направить на проверку оператору неполную анкету, а оператор не тратил ручное время на первичное выявление очевидно незаполненных полей или отсутствующих документов.

Основной принцип:

```text
Save
-> automated completeness and document-readability check
-> Submit to operator review only if complete
-> otherwise owner task with numbered missing sections
```

## 2. Область Применения

Стандарт распространяется на все виды анкет и рабочих форм:

| Поток | Анкеты / формы |
|---|---|
| Seafarer supply | профиль моряка, source cards, документы, сертификаты, доступность, предпочтения |
| Employer / shipowner demand account | компания, представитель, полномочия, commercial context |
| Vessel context | судно, тип судна, флаг, операционные данные, документы судна |
| Crew request / vacancy requirement | должность, отдел, дата посадки, контракт, зарплата, сертификаты, требования |

## 3. Утвержденное Поведение

### 3.1 Save

Кнопка `Save` / `Сохранить` должна быть доступна пользователю при редактировании разрешенного draft или correction.

Сохранение:

1. сохраняет введенные данные;
2. оставляет объект в draft/correction состоянии;
3. запускает проверку полноты;
4. запускает доступные проверки формата и читаемости документов;
5. вычисляет следующую видимую задачу или действие.

Сохранение не означает передачу на проверку оператору.

### 3.2 Submit To Operator Review

Кнопка `Submit to operator review` / `Направить на проверку оператору` должна становиться активной только если:

1. все обязательные поля заполнены;
2. обязательные документы загружены;
3. формат документов допустим;
4. документы прошли protected storage / scan checks, где применимо;
5. документы читаются достаточно для review;
6. поля со справочниками имеют структурированные допустимые значения;
7. по этому объекту нет открытых owner correction tasks.

Если хотя бы одно условие не выполнено, кнопка направления оператору не должна быть исполнимой.

### 3.3 Incomplete State

Если анкета неполная, система должна показать задачу владельцу:

```text
Complete questionnaire sections. (Form: {safe object summary}; Sections: {section numbers}.)
```

Задача должна указывать не общий текст, а номера разделов и пунктов, которые нужно заполнить или исправить.

## 4. Нумерация Разделов Анкет

Все анкеты должны получить стабильную нумерацию разделов и пунктов.

Рекомендуемая модель:

| Level | Example | Meaning |
|---|---|---|
| Stream prefix | `S`, `E`, `V`, `R` | Seafarer, Employer, Vessel, Request |
| Section | `S-2` | Раздел анкеты |
| Field point | `S-2.3` | Конкретное обязательное поле |
| Document point | `S-7.D1` | Конкретный обязательный документ |

Один и тот же номер должен использоваться в:

1. UI формы;
2. completeness output;
3. owner cabinet tasks;
4. operator correction requests;
5. audit events;
6. будущих AI validation prompts.

## 5. Примеры Задач

| Объект | Причина | Задача |
|---|---|---|
| Seafarer profile | нет документа и доступности | `Complete questionnaire sections. (Seafarer profile: Chief Officer; Sections: S-4.2, S-7.D1.)` |
| Employer authority | нет authority evidence | `Complete questionnaire sections. (Employer authority: Ocean Manager LLC; Sections: E-1.3, E-1.D1.)` |
| Vessel profile | нет vessel type / flag | `Complete questionnaire sections. (Vessel profile: Container Vessel; Sections: V-2.1, V-2.4.)` |
| Crew request | нет contract term / certificate requirements | `Complete questionnaire sections. (Crew request: Second Engineer; Sections: R-3.2, R-4.1.)` |

## 6. Изменения В Бизнес-Документации

| File | Change |
|---|---|
| `docs/crewportglobal/business_processes/12_crew_formation_service_business_process_manual.md` | Added section `9.1 Standard Form Save And Completeness Gate`. |
| `docs/crewportglobal/business_processes/13_crew_formation_operating_instructions_for_users_team_ai.md` | Added user/team/AI instruction `3.4 Save, Completeness Check And Submit Rule`. |
| `docs/crewportglobal/business_processes/00_business_process_register.md` | Added core control 39 and revision 2.2. |
| `docs/crewportglobal/00_documentation_register.md` | Added document 222. |
| `docs/crewportglobal/222_cpg_biz_033_questionnaire_save_completeness_gate_standard_report.md` | Added this report. |

## 7. Контрольная Граница

Этот этап является documentation-only.

На этом этапе не изменялись:

1. UI;
2. backend/API behavior;
3. DB schema;
4. migrations;
5. tests.

Текущие работающие изменения CPG-BIZ-032 остаются отдельной implementation slice. Реализация кнопки `Сохранить`, completeness analyzer, numbered missing-section output и submit gate должна выполняться отдельным утвержденным implementation slice.

## 8. Следующий Запланированный Этап

Следующий этап:

```text
CPG-BIZ-034 - Questionnaire numbering and completeness gate implementation plan
```

Рекомендуемый план:

1. inventory всех текущих анкет и секций;
2. назначить стабильные номера `S/E/V/R`;
3. определить required / optional / conditional required поля;
4. определить required document points;
5. спроектировать completeness analyzer output;
6. добавить owner cabinet task format;
7. только после утверждения выполнить UI/API implementation.

