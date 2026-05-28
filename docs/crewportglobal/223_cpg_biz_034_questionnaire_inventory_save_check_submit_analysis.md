# CPG-BIZ-034 - Анализ Анкет И Процесса Save / Check / Submit

- Project: CrewPortGlobal.com
- Company: GTC INFORMATION TECHNOLOGY FZ-LLC
- Stage: Stage 1 - Digital Maritime Crew Data and Matching Platform
- Document type: Рабочий аналитический документ
- Source task: Project Owner instruction after CPG-BIZ-033
- Version: 1.0
- Date: 2026-05-28
- Status: Analysis complete; implementation task prepared separately

## 1. Назначение

Этот документ фиксирует анализ текущих анкет CrewPortGlobal относительно утвержденного стандарта:

```text
Save
-> automated completeness and document-readability check
-> Submit to operator review only if complete
-> otherwise owner task with numbered missing sections
```

Цель анализа - определить, как каждая существующая форма должна сохраняться, проверяться и отправляться на операторскую проверку, чтобы команда не получала неполные анкеты как активные review tasks.

Этот документ не меняет код, UI, DB, миграции или runtime behavior.

## 2. Проверенные Области

| Area | File / source | Current role |
|---|---|---|
| Seafarer questionnaire | `projects/crewportglobal/public/create-profile/index.html` | Основная анкета моряка, source-card sections, document readiness, upload, review package. |
| Employer / vacancy questionnaire | `projects/crewportglobal/public/post-vacancy/index.html` | Company, representative, vessel hints and crew request / vacancy intake. |
| Registration draft helper | `projects/crewportglobal/public/assets/crewportglobal-registration-drafts.js` | Общий frontend helper для create/update draft and document upload. |
| Backend draft API | `projects/crewportglobal/app/backend/api/public/index.php` | Draft creation/update, seafarer workspace section save, document readiness save, company/vacancy upsert. |
| Protected document upload | `projects/crewportglobal/app/backend/api/lib/document_uploads.php` | File type/size/hash/storage/scan metadata and document review states. |
| Business-process standard | BP-012, BP-013, document 222 | Save/completeness gate control source. |

## 3. Главный Вывод

В текущем приложении уже есть много нужных элементов: анкеты, разделы, protected upload, document review states, source-card sections, draft helper and computed tasks.

Основной gap не в отсутствии формы, а в смешении двух операций:

| Operation | Current tendency | Required standard |
|---|---|---|
| Save / Сохранить | Часто сохраняет данные и переводит объект в review-related status. | Только сохраняет draft/correction и запускает completeness check. |
| Submit to operator review | Не выделен как отдельный проверенный gate для всех анкет. | Отдельное действие, активно только после успешной проверки полноты и документов. |
| Missing data task | Частично есть для corrections, но нет единого numbered-section output до operator review. | Owner task must list numbered missing sections and fields. |

## 4. Единая Модель Для Всех Анкет

Каждая анкета должна работать по одному контракту.

| Step | User-visible behavior | Backend / task behavior |
|---|---|---|
| 1. Save draft | Кнопка `Сохранить` активна при разрешенном редактировании. | Данные сохраняются без создания активной operator-review задачи. |
| 2. Completeness check | Система показывает, что заполнено и чего не хватает. | Analyzer возвращает missing numbered sections, document status and `can_submit_to_operator`. |
| 3. Owner correction task | Если данных не хватает, владелец видит задачу с номерами разделов. | Team queue не получает active review task. |
| 4. Submit to operator review | Кнопка активна только при полном пакете данных. | Только тогда объект получает review status and computed team task. |
| 5. Operator review | Команда проверяет уже полный пакет. | Review outcome может approve, request correction, reject or route to next stage. |

## 5. Нумерация Анкет

Для управления задачами и будущей автоматической проверки нужно использовать стабильные коды.

| Prefix | Stream | Working object |
|---|---|---|
| `S` | Seafarer supply | Seafarer profile, source cards, documents, readiness. |
| `E` | Employer / shipowner demand account | Company, representative, authority and commercial context. |
| `V` | Vessel context | Vessel identity, type, operation context and vessel evidence. |
| `R` | Crew request / vacancy requirement | Rank, department, joining date, contract, pay, requirements. |

Формат:

```text
S-1      section
S-1.2    required field
S-1.D1   required document
```

## 6. Seafarer Supply Questionnaire

### 6.1 Current form areas

| Section code | Current UI section | Current save source | Target role |
|---|---|---|---|
| `S-1` | CV basics / rank / availability | Main form draft payload | Required before submit. |
| `S-2` | Personal contact and name components | `personal_details`, `contact_and_addresses`, `name_components` | Required / conditional. |
| `S-3` | Address details | `address_details` | Required according to owner/compliance rule. |
| `S-4` | Family / next-of-kin / beneficiary | `family_details` | Restricted; required only when process policy requires. |
| `S-5` | Physical / uniform data | `physical_details` | Operational / conditional. |
| `S-6` | Identity documents and visas | `identity_documents` | Required identity readiness fields. |
| `S-7` | Qualifications, COC, endorsements, training | `qualifications`, `qualification_details` | Required for matching readiness. |
| `S-8` | Sea service | `sea_service` | Required / conditional by rank and future matching policy. |
| `S-9` | Previous employer references | `previous_employer_references` | Restricted reference workflow. |
| `S-10` | Medical history / certificate readiness | `medical_history` and document readiness | Restricted medical; certificate readiness required. |
| `S-11` | Publication / matching / consent | `matching_publication`, `consent_details` | Required before matching/presentation boundaries. |
| `S-12` | Uploaded documents | Protected document upload | Required documents must be uploaded, clean and readable. |
| `S-13` | Review package | Main submit area | Submit gate only. |
| `S-14` | Applications history | Application records | Read-only; not part of profile submit gate. |

### 6.2 Current behavior

The current seafarer form has:

1. section save buttons;
2. protected document upload;
3. partial frontend completeness checks;
4. document readiness metadata;
5. final form submit.

Observed gap:

```text
Save and submit-to-review are not yet cleanly separated.
```

Backend section and readiness saves currently move review-related state in several places. The target implementation must keep section saves as draft/correction saves and reserve team-review task creation for a separate submit action.

### 6.3 Target Save / Check / Submit

| Operation | Required behavior |
|---|---|
| Save section | Store the section, recalculate profile completeness, keep object with owner until submit. |
| Save main profile | Store profile summary and workspace data, recalculate missing `S-*` points. |
| Upload document | Store protected document, scan, classify by document type, include in `S-12` readiness. |
| Check completeness | Return missing `S-*` fields/documents and unresolved correction blocks. |
| Submit to operator review | Enabled only when required `S-*` checks pass. |

## 7. Employer / Shipowner Demand Account Questionnaire

### 7.1 Current form areas

| Section code | Current UI field group | Target role |
|---|---|---|
| `E-1` | Work email, contact name, employer role | Required contact and account context. |
| `E-2` | Company name, country, registration number | Required company identity. |
| `E-3` | Role in company / representative authority | Required authority context. |
| `E-4` | Employer authority documents | Required or conditional protected evidence. |
| `E-5` | Commercial / billing context | Future / conditional before billing stage. |

### 7.2 Current behavior

The `/post-vacancy/` form currently validates only a small subset before saving:

1. email;
2. company name.

It already supports employer document upload categories through protected upload, but the current save action also participates in creating reviewable company/vacancy state. The target model must separate draft save from review submission.

### 7.3 Target Save / Check / Submit

| Operation | Required behavior |
|---|---|
| Save company/employer data | Store `E-*` draft values only. |
| Check employer completeness | Confirm company identity, representative context and required authority evidence. |
| Missing data | Create owner task with `E-*` numbered sections. |
| Submit to operator review | Create verification-team task only after `E-*` gate passes. |

## 8. Vessel Context Questionnaire

### 8.1 Current form areas

| Section code | Current data source | Target role |
|---|---|---|
| `V-1` | Vessel name and IMO number in `/post-vacancy/` | Vessel identity. |
| `V-2` | Vessel type datalist | Structured matching field. |
| `V-3` | Operational context | Mostly missing / future structured demand fields. |
| `V-4` | Vessel documents | Backend supports `vessel` document category, but current public form does not expose full vessel upload workflow. |

### 8.2 Current behavior

Vessel data exists mainly as part of vacancy intake. Backend document upload configuration already includes vessel document types, but the visible form does not yet provide a complete vessel-specific questionnaire and required evidence gate.

### 8.3 Target Save / Check / Submit

| Operation | Required behavior |
|---|---|
| Save vessel context | Store vessel identity/type fields as draft. |
| Check vessel completeness | Confirm vessel identity, vessel type and required evidence policy. |
| Missing data | Create owner task with `V-*` numbered sections. |
| Submit to operator review | Create vessel-context review task only after required `V-*` checks pass, or keep vessel review embedded in demand intake until a separate vessel workflow is approved. |

## 9. Crew Request / Vacancy Requirement Questionnaire

### 9.1 Current form areas

| Section code | Current UI field group | Target role |
|---|---|---|
| `R-1` | Vacancy title / rank / department | Required demand identity. |
| `R-2` | Vessel link / vessel type | Required matching context. |
| `R-3` | Joining date | Required timing context. |
| `R-4` | Contract duration, salary min/max, currency | Required commercial and filtering context. |
| `R-5` | Free-text requirements | Must become structured as much as possible. |
| `R-6` | Visa, language, risk, special operation constraints | Mostly future / partial structured fields. |
| `R-7` | Crew request supporting documents | Required or conditional protected evidence. |
| `R-8` | Submit package | Submit gate only. |

### 9.2 Current behavior

The existing `/post-vacancy/` form can save a crew request with enough fields to start review/search work, but it does not yet block review submission until all required `R-*` fields and documents are complete.

### 9.3 Target Save / Check / Submit

| Operation | Required behavior |
|---|---|
| Save crew request | Store `R-*` values as draft. |
| Check demand completeness | Confirm structured rank, department, vessel type, joining date, duration, pay range and required document/evidence policy. |
| Missing data | Create owner task with `R-*` numbered fields. |
| Submit to operator review | Create `review_team` task only after `R-*` gate passes. |

## 10. Document Readiness Gate

Protected upload already performs important technical controls:

1. allowed format;
2. size limit;
3. sha256 hashing;
4. protected storage;
5. malware scanning;
6. review status.

The missing standard layer is the required-document policy by stream.

| Stream | Required document policy status |
|---|---|
| Seafarer | Must define minimum required documents by rank/profile stage; initial gate can include passport/ID, COC where rank requires it, medical certificate and maritime CV where applicable. |
| Employer | Must define authority evidence: company registration/license, representative ID, authorization letter or equivalent. |
| Vessel | Must define when vessel particulars/class/registration evidence is required. |
| Crew request | Must define when crew request brief, service request document or commercial evidence is required. |

The implementation should make this policy configurable inside backend completeness helpers instead of hard-coding final legal conclusions in UI text.

## 11. Required Completeness Analyzer Output

The next implementation should expose a stable object that can be rendered in form UI, owner cabinet and future AI prompts:

```json
{
  "object_type": "seafarer_profile",
  "object_id": "uuid",
  "overall_status": "incomplete",
  "can_save": true,
  "can_submit_to_operator": false,
  "missing_items": [
    {
      "section_code": "S-6",
      "field_code": "S-6.2",
      "label": "Passport expiry date",
      "severity": "required",
      "target_url": "/create-profile/#profile-section-identity-documents"
    }
  ],
  "required_documents": [
    {
      "document_code": "S-12.D1",
      "document_type": "medical_certificate",
      "status": "missing"
    }
  ],
  "unresolved_corrections": []
}
```

## 12. Current Gaps To Implementation

| Gap | Impact | Implementation direction |
|---|---|---|
| Save and submit are not separate everywhere | Incomplete objects can become active team-review work. | Add explicit submit-to-review action after completeness check. |
| Completeness checks are partial and frontend-local | Cabinet/team/AI cannot rely on one source of truth. | Add backend completeness helper/API. |
| Numbered field dictionary is not applied to every form | Owner tasks cannot point to precise missing sections. | Add stable `S/E/V/R` section and field codes. |
| Required document policy is not unified by stream | Upload can be clean but still insufficient for review. | Add required document checks per stream. |
| Vessel context is embedded in vacancy intake | Vessel review cannot be fully separated yet. | Start with embedded `V-*` checks and document future separate vessel form. |
| Free-text demand requirements remain broad | Matching can be weak. | Preserve current text but identify structured fields for next demand slices. |

## 13. Implementation Readiness Decision

The standard is ready to implement as a controlled additive slice if the first slice is limited to:

1. stable numbering configuration;
2. backend completeness analyzer;
3. separate save and submit actions for seafarer and demand forms;
4. UI rendering of missing numbered sections;
5. owner task output;
6. focused tests proving incomplete forms do not enter active operator review.

DB migration should be avoided if existing status fields can express draft/correction/submitted states. If a migration becomes necessary, it must be additive and idempotent, and the SQL patch must be shown before execution.

## 14. Next Planned Stage

The next task is documented separately as:

```text
docs/crewportglobal/224_cpg_biz_035_questionnaire_save_completeness_gate_implementation_task.md
```

That task should be approved before implementation begins.

