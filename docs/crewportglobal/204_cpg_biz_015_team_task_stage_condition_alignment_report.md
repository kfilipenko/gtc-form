# CPG-BIZ-015 - Отчет о приведении `/team/` My Tasks и group queue к модели computed task

- Project: CrewPortGlobal.com
- Company: GTC INFORMATION TECHNOLOGY FZ-LLC
- Stage: Stage 1 - Digital Maritime Crew Data and Matching Platform
- Document type: Implementation report
- Source task: continuation after CPG-BIZ-014
- Source control: CPG-BIZ-012, BP-012, BP-013
- Version: 1.0
- Date: 2026-05-27
- Status: Implemented and verified on GTC1

## 1. Назначение этапа

Этот этап переносит утвержденную модель отображения вычисленных задач из `/verify/` на командную страницу `/team/`.

Цель этапа - чтобы `My Tasks` и group queue показывали не техническую строку и не отдельную кнопку открытия, а одну понятную computed operation:

```text
task title + process stage + visibility condition
```

Название задачи и краткое описание объекта являются активной ссылкой на внутренний рабочий объект. Отдельная кнопка открытия не используется как самостоятельная задача.

## 2. Управляющее правило

Сохраняется правило CPG-BIZ-012:

```text
previous stage result + current object state + role/permission + assignment relationship = visible next task
```

Задача видна пользователю или группе только пока существует вычисленная причина ее выполнения. Поэтому строка задачи должна объяснять:

1. какой этап бизнес-процесса активен;
2. с каким безопасным объектом нужно работать;
3. почему задача видна;
4. какое право требуется для выполнения операции;
5. кто является ответственным: группа или назначенный сотрудник.

## 3. Что изменено на `/team/`

Измененная страница:

```text
/team/
```

Список задач теперь строит каждую карточку по бизнес-модели:

| Элемент | Новое поведение |
|---|---|
| Название задачи | Показывает одну главную computed operation. |
| Описание объекта | Показывает безопасную краткую сводку объекта в скобках. |
| Активная ссылка | Название и описание открывают внутренний work item. |
| Process stage | Показывает этап бизнес-процесса. |
| Visibility condition | Показывает причину и срок видимости задачи. |
| Responsible | Показывает ответственную группу или назначенного сотрудника. |
| Permission | Показывает право, требуемое для выполнения операции. |

Служебные технические коды операций не показываются пользователю как текст задачи. Они остаются только в ссылке и используются системой для открытия правильного рабочего объекта.

## 4. Примеры отображения задач

| Computed operation | Видимая задача | Process stage | Visibility condition |
|---|---|---|---|
| `confirm_vacancy_deletion` | `Confirm deletion request. (Deletion request: Crew request deletion confirmation.)` | Controlled deletion confirmation | Visible until manager confirms or rejects the deletion request. |
| `review_candidate_presentation` | `Approve candidate for employer presentation. (Candidate presentation: candidate presentation review.)` | Employer-facing candidate presentation review | Visible until this computed operation is completed or blocked by guard. |
| `approve_internal_shortlist` | `Approve internal shortlist. (Internal shortlist: internal shortlist draft.)` | Internal shortlist approval | Visible until this computed operation is completed or blocked by guard. |
| `create_review_applications` | `Create candidate presentation review. (Internal shortlist: approved internal shortlist.)` | Candidate presentation review preparation | Visible until this computed operation is completed or blocked by guard. |

## 5. Граница доступа и видимости

Этот этап не меняет права доступа и не меняет backend-логику.

Фактические права по-прежнему определяются существующими API и access-control checks. Frontend только показывает пользователю:

1. ответственную группу;
2. назначенного сотрудника, если он есть;
3. требуемое право;
4. причину видимости задачи.

Если задача видна как group queue, отображается группа. Если в payload уже есть назначенный сотрудник, карточка показывает назначение как персональную ответственность.

## 6. Граница side effects

Этот этап не выполняет:

1. DB migrations;
2. DDL/DML changes;
3. backend/API behavior changes;
4. workflow status changes;
5. employer-facing publication;
6. employment decisions;
7. automatic scoring implementation.

Изменение является presentation-layer correction для `/team/`.

## 7. Файлы изменены

| Файл | Изменение |
|---|---|
| `projects/crewportglobal/public/team/index.html` | Приведен список My Tasks / group queue к модели computed task: активное название задачи, описание объекта, process stage, visibility condition, responsible group/assignee и permission. |
| `tests/crewportglobal-operator-queue.spec.ts` | Обновлены focused UI checks для `/team/`: проверяется business task title, process stage, visibility condition, отсутствие технических operation-кодов как видимого текста и сохранение deep-link behavior. |
| `docs/crewportglobal/204_cpg_biz_015_team_task_stage_condition_alignment_report.md` | Добавлен этот отчет. |
| `docs/crewportglobal/00_documentation_register.md` | Добавлен документ 204 в documentation register. |

## 8. Проверка

### 8.1 Frontend syntax

```bash
node - <<'NODE'
const fs = require('fs');
const html = fs.readFileSync('projects/crewportglobal/public/team/index.html', 'utf8');
const scripts = Array.from(html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)).map((match) => match[1]).filter((script) => script.trim());
scripts.forEach((script) => new Function(script));
console.log(`checked ${scripts.length} inline script(s)`);
NODE
```

Result: passed, checked 1 inline script.

### 8.2 Diff safety

```bash
git diff --check
```

Result: passed.

### 8.3 Focused operator/team UI suite

```bash
npx playwright test -c playwright.crewportglobal.config.ts tests/crewportglobal-operator-queue.spec.ts
```

Result: 4 passed.

Проверка подтверждает:

1. `/team/` показывает computed task title вместо технического operation name;
2. задача открывается кликом по названию/описанию;
3. process stage отображается в карточке задачи;
4. visibility condition отображается в карточке задачи;
5. permission и responsible group сохраняются видимыми;
6. deep-link на `/verify/` сохраняет технический `task_operation` только в URL;
7. workflow actions остаются в рабочем объекте, а не конкурируют в списке задач.

## 9. Итог этапа

Этап CPG-BIZ-015 завершен.

`/team/` теперь использует тот же принцип, что и исправленный `/verify/`: пользователь видит одну главную вычисленную задачу, этап бизнес-процесса и причину видимости задачи.

## 10. Следующий этап

Следующий рекомендуемый этап:

```text
CPG-BIZ-016 - Remaining task surfaces and localized task wording review
```

Цель следующего этапа - проверить остальные страницы, где могут отображаться задачи или next operation:

1. `/team/shortlists/`;
2. `/team/matching/`;
3. task-specific panels opened from `/verify/`;
4. Russian/English wording for process-stage names and visibility conditions.

Если на этих поверхностях будут найдены конкурирующие действия или технические labels, их следует привести к той же модели:

```text
one computed task -> active title link -> process stage -> visibility condition -> workspace-contained outcomes
```
