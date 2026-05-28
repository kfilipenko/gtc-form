# CPG-BIZ-036 - Анализ И Синхронизация Обязательных Полей Анкет

- Project: CrewPortGlobal.com
- Company: GTC INFORMATION TECHNOLOGY FZ-LLC
- Stage: Stage 1 - Digital Maritime Crew Data and Matching Platform
- Document type: Рабочий аналитический документ / addendum to CPG-BIZ-035
- Source task: Project Owner clarification after CPG-BIZ-034 / CPG-BIZ-035
- Version: 1.0
- Date: 2026-05-28
- Status: Mandatory-field synchronization model prepared for implementation task

## 1. Назначение

Этот документ уточняет стандарт сохранения и проверки анкет.

Project Owner подтвердил два обязательных правила:

1. В анкете должна быть одна основная кнопка `Сохранить / подтвердить данные`. Фактически каждое заполненное поле может сохраняться автоматически, но пользовательская контрольная кнопка одна: она запускает проверку обязательных полей, документов и готовности к отправке.
2. Признак `обязательное поле` должен быть синхронизирован между анкетами. Если поле является обязательным на стороне заявки / судовладельца и используется для matching, соответствующее поле на стороне моряка также должно быть обязательным. Если поле является обязательным на стороне моряка и используется для matching, соответствующее поле должно быть обязательным на стороне судна / заявки, где оно применимо.

Этот документ не меняет код, UI, DB, миграции или runtime behavior. Он задает матрицу для следующего implementation slice.

## 2. Проверенные Формы

| Form | File | Current role |
|---|---|---|
| Seafarer profile | `projects/crewportglobal/public/create-profile/index.html` | Supply-side profile, source sections, documents, readiness and review package. |
| Employer / vessel / vacancy request | `projects/crewportglobal/public/post-vacancy/index.html` | Demand-side company, representative, vessel hints and crew-request intake. |
| Draft helper | `projects/crewportglobal/public/assets/crewportglobal-registration-drafts.js` | Shared draft create/update and document upload frontend helper. |
| Backend draft/API | `projects/crewportglobal/app/backend/api/public/index.php` | Draft upsert, profile/company/vacancy persistence, review status changes and task computation. |
| Document upload | `projects/crewportglobal/app/backend/api/lib/document_uploads.php` | Protected file upload, scan and document metadata. |

## 3. Current HTML Required Fields

Current browser-level `required` attributes are too narrow for automated matching.

| Page | Fields currently marked `required` in HTML | Gap |
|---|---|---|
| `/create-profile/` | `Full name`, `Email` | Rank, department, availability, phone, vessel type preference, document readiness and matching-critical fields are not consistently HTML-required. |
| `/post-vacancy/` | `Work email`, `Company name` | Rank, department, vessel type, join date, contract duration, salary and authority/vessel evidence are not consistently HTML-required. |

Decision:

```text
HTML required is not the source of truth.
The backend completeness schema is the source of truth.
Frontend required markers must be generated from the same schema.
```

## 4. Required Field Flags

Every field in the future questionnaire schema should have explicit flags.

| Flag | Meaning |
|---|---|
| `autosave_enabled` | Field changes may be saved automatically while the user edits. |
| `required_for_save` | Rare; normally only technical identity needed to create a draft. |
| `required_for_submit` | Required before `Submit to operator review` becomes active. |
| `required_for_matching` | Required before the object can be treated as matching-ready. |
| `conditional_required` | Required only when a rule is true, for example rank, vessel type, visa area or demand constraint. |
| `mirrored_required_key` | Canonical field key that links supply and demand fields. |
| `visibility_class` | Public/internal/restricted field class used for minimization and employer payload controls. |

## 5. Synchronization Rule

Mandatory-field synchronization must follow this rule:

```text
If a field is used as a hard matching requirement on demand,
the corresponding supply field must be required for matching-ready supply.

If a field is required to make supply match-ready,
the corresponding demand/vessel/request field must be required where that object uses the same matching dimension.
```

Examples:

| Demand-side required field | Supply-side synchronized field |
|---|---|
| Requested rank | Primary rank. |
| Requested department | Department. |
| Vessel type | Preferred vessel types and/or sea-service vessel type evidence. |
| Joining date | Availability status and availability date. |
| Salary band | Salary expectation. |
| COC requirement | COC type, issuing country, expiry and COC document. |
| Training requirement | Training course records and certificates. |
| Visa requirement | Visa readiness / visa record. |
| Education requirement | Education grade / specialization. |
| Sea-service requirement | Sea-service rank, vessel type and service period. |

## 6. Canonical Mandatory Matching Matrix

| Canonical key | Supply field(s) | Demand / vessel / request field(s) | Target requirement | Matching role |
|---|---|---|---|---|
| `account_contact_email` | `S-1.2 Email` | `E-1.1 Work email` | Required for submit on both owner forms. | Account/contact, not employer-facing candidate data. |
| `person_or_contact_name` | `S-1.1 Full name` | `E-1.2 Primary contact name` | Required for submit on both owner forms. | Object ownership and human review. |
| `rank` | `S-1.4 Primary rank` | `R-1.1 Vacancy title / rank` | Required for matching-ready supply and demand submit. | Hard matching dimension. |
| `department` | `S-1.5 Department` | `R-1.2 Department` | Required for matching-ready supply and demand submit. | Hard matching dimension. |
| `availability_or_joining_date` | `S-1.6 Availability`, `S-1.7 Availability date if later` | `R-3.1 Joining date` | Required; availability date conditional when not available now. | Timing match / blocker. |
| `vessel_type` | `S-1.11 Preferred vessel types`; `S-8.2 Last vessel type` as evidence | `V-2.1 Vessel type`, `R-2.1 Vessel type` | Required for demand/vessel; required for supply matching preference, sea-service evidence conditional. | Hard or strong matching dimension. |
| `salary` | `S-1.10 Salary expectation` | `R-4.2 Salary min`, `R-4.3 Salary max`, `R-4.4 Currency` | Required for submit to review on demand; required for matching-ready supply. | Commercial fit / soft blocker. |
| `nationality_residence` | `S-1.8 Nationality`, `S-1.9 Residence/current country` | Future demand nationality/residence constraint | Supply required for compliance/mobility; demand required only when constraint is stated. | Visa/mobility/compliance filtering. |
| `education` | `S-7.7 Education institution`, `S-7.8 Grade`, `S-7.11 Specialisation` | Future structured `R-5 Education requirement` | Conditional required when demand/rank requires education evidence. | Qualification fit. |
| `coc` | `S-7.1 COC type`, `S-7.3 issuing country`, `S-7.6 expiry`, `S-12.D3 COC document` | Future structured `R-5 COC requirement` | Required for officer/engineer/rank requiring COC; otherwise conditional. | Hard qualification blocker. |
| `training_stcw` | `S-7 training courses`, `S-12.D4/D8 training documents` | Future structured `R-5 STCW/training requirement` | Conditional required by rank/vessel/demand requirement. | Hard or soft qualification blocker. |
| `medical_certificate` | `S-10 medical expiry`, `S-12.D5 medical certificate` | Future demand medical readiness requirement | Required for seafarer submit/readiness; demand may require current validity window. | Readiness blocker. |
| `visa_readiness` | `S-6 visa metadata`, `S-12 visa evidence if required` | Future structured `R-6 visa category / area` | Conditional required when demand/vessel route requires visa. | Mobility blocker. |
| `sea_service` | `S-8 last vessel/rank/service dates/history` | Future structured `R-5 sea-service requirement` | Conditional required for non-entry ranks and when demand specifies experience. | Experience fit. |
| `language` | Currently only `language_certificate` upload; no structured language field | Future structured `R-6 language / level` | Gap: add structured language and level to both sides before making hard blocker. | Communication requirement. |
| `company_identity` | Not applicable | `E-2 company name/country/registration number` | Required for employer-side submit. | B2B client authority. |
| `representative_authority` | Not applicable | `E-3 role in company`, `E-4 authority documents` | Required for employer-side submit. | Authority/control blocker. |
| `vessel_identity` | Sea-service vessel evidence conditional | `V-1 vessel name`, `V-1 IMO`, `V-2 vessel type` | Required for vessel profile; if exact vessel unknown, vessel type remains required. | Vessel context. |
| `crew_request_terms` | Availability/salary counterparts | `R-3 join date`, `R-4 duration`, `R-4 salary/currency` | Required for demand submit. | Workability/commercial fit. |

## 7. Baseline Required Fields By Stream

### 7.1 Seafarer supply

Required before `Submit to operator review`:

1. `S-1.1` full name;
2. `S-1.2` email;
3. `S-1.3` contact phone;
4. `S-1.4` rank;
5. `S-1.5` department;
6. `S-1.6` availability status;
7. `S-1.7` availability date if `available_later`;
8. `S-1.8` nationality / citizenship;
9. `S-1.9` residence or current country;
10. `S-1.10` salary expectation;
11. `S-1.11` preferred vessel types;
12. `S-6` passport or identity expiry metadata;
13. `S-7` COC/training fields when rank or demand requires them;
14. `S-10` medical certificate expiry/readiness;
15. `S-11` data-processing confirmation for profile review/matching preparation;
16. required `S-12` documents according to rank/readiness policy.

Restricted family/medical declaration details must not become broad matching fields. They may be required only for controlled compliance or dedicated medical workflows.

### 7.2 Employer / shipowner demand account

Required before employer-side submit:

1. `E-1.1` work email;
2. `E-1.2` primary contact name;
3. `E-1.3` employer role;
4. `E-2.1` company name;
5. `E-2.2` company country;
6. `E-2.3` company registration number;
7. `E-3.1` role in company;
8. `E-4` authority evidence document set.

### 7.3 Vessel context

Required before vessel/demand matching:

1. `V-1.1` vessel name when known;
2. `V-1.2` IMO when exact vessel is provided;
3. `V-2.1` vessel type;
4. `V-2.2` flag country - currently missing in `/post-vacancy/`;
5. `V-4` vessel evidence documents when a vessel profile is submitted for verification.

If the employer is creating an early request without an exact vessel, `V-2.1 vessel type` is still mandatory and `vessel name / IMO` may remain conditional.

### 7.4 Crew request / vacancy requirement

Required before demand submit:

1. `R-1.1` requested rank;
2. `R-1.2` department;
3. `R-2.1` vessel type or vessel link;
4. `R-3.1` joining date;
5. `R-4.1` contract duration;
6. `R-4.2` salary minimum;
7. `R-4.3` salary maximum;
8. `R-4.4` currency;
9. `R-5` structured qualification/experience requirements or explicit `no special requirement` flags;
10. `R-7` supporting request document when required by authority/commercial policy.

The current `Key requirements` free text should not be the final source of hard matching. It can remain as narrative support, but structured requirement fields are required for reliable automated matching.

## 8. Current Form Gaps

| Gap | Current state | Required change |
|---|---|---|
| Single save button | `/create-profile/` has many section save buttons; `/post-vacancy/` has one main save. | Move toward field autosave plus one `Save / confirm data` control per questionnaire. Section buttons may become autosave status indicators or be removed in implementation. |
| Required markers | Browser required only covers a few fields. | Generate required markers from backend schema and show them consistently. |
| Demand structure | Key requirements are free text. | Add structured requirement fields for COC, training, education, visa, language, sea-service and special constraints before using them as hard blockers. |
| Vessel flag | Required in process but missing from current `/post-vacancy/` form. | Add vessel flag field or record it as blocked from full vessel matching. |
| Language / level | Language certificate upload exists but no structured language/level pair. | Add structured language and level on both supply and demand before hard matching. |
| Education sync | Seafarer education exists; demand education requirement does not yet exist as structured field. | Add demand education requirement or keep education as conditional soft score only. |
| Documents | Upload types exist; required-document set is not centrally computed. | Define required documents by stream/rank/vessel/request policy in completeness analyzer. |

## 9. Implementation Impact On CPG-BIZ-035

CPG-BIZ-035 must start with this sequence:

1. create a canonical mandatory field schema;
2. add synchronized supply-demand mandatory keys;
3. implement field-level autosave or preserve current save mechanics behind one visible save/confirm action;
4. generate required markers and missing-section tasks from the same schema;
5. implement `Submit to operator review` only after schema checks pass.

The implementation must not hard-code separate, conflicting required rules in `/create-profile/`, `/post-vacancy/`, `/cabinet/`, `/verify/` or `/team/`.

## 10. Next Planned Step

Update CPG-BIZ-035 implementation task so the first implementation phase becomes:

```text
Phase 0 - Canonical mandatory field schema and synchronized supply-demand required keys
```

Only after this phase should UI/API behavior be changed.

