# TRAVELGTC-INTEGRATION-001 - Authorized Source Access And Integration

## 1. Task Contract

```yaml
task_id: TRAVELGTC-INTEGRATION-001
title: Авторизованное изучение MWR Life / Travel Advantage и интеграция с TravelGTC
initiator: OWNER
status: OWNER_APPROVED / READY_FOR_DISCOVERY
date: 2026-09-17
execution_allowed: true
execution_scope: discovery_and_integration_proposal_only
integration_activation: NOT_AUTHORIZED
risk_or_impact_class: HIGH / SECURITY-SENSITIVE
```

`execution_allowed` is derived from the Owner approval and applies only to the
current phase and its resolved prerequisites. It is not permission to activate
data exchange. This record is registered in the project documentation register;
its creation does not claim Git publication or a completed browser connection.

**Owner decision:** 2026-09-17, Owner approved the revised task and requested its
creation and a handoff procedure for a Codex agent. Owner reports that a terminal
session on their computer is connected to GTC1. No further acceptance of this
same discovery scope is required.

### objective

Изучить официальные сайты через предоставленный Owner доступ, определить
доступные материалы и данные, подготовить связь с TravelGTC и затем реализовать
разрешённую синхронизацию после утверждения конкретного контракта интеграции.

### expected_result

Проверенные источники и персональные маршруты для TravelGTC/Миры; карта данных,
доступа и допустимого использования; минимальный контракт интеграции с тестами,
отключением и точными границами полномочий. Автоматическое подтверждение внешней
регистрации допустимо только при проверенном источнике и разрешении провайдера.

### known_inputs

- Owner сообщает об успешном открытии TravelGTC через BrowserAct в отдельном
  профиле `travelgtc-test`, без входа и отправки форм; сессия закрыта. Сам отчёт
  BrowserAct ещё не прочитан исполнителем этой записи. Это Owner-reported
  evidence, не независимая проверка доступности инструмента новому агенту.
- По указанию Owner, MWR Life и Travel Advantage требуют авторизации. Не
  планировать изучение их внутренних разделов как публичных страниц.
- Owner самостоятельно вводит данные входа и MFA в интерфейсе сайта.
- Owner запросит у поддержки MWR Life сведения об API; ответ и доступность
  интеграции пока не подтверждены.
- Предыдущий отчёт 152 фиксирует Mira v35 и отсутствие автоматической проверки
  внешней регистрации. Это исторический baseline, не новая проверка runtime.

### scope

- Проверка среды исполнения, доступных Skills/tools и существующего BrowserAct.
- TravelGTC; авторизованные MWR Life / Travel Advantage: My Links, презентации,
  обучение, условия участия и доступные интеграции в пределах прав Owner.
- Минимальная проверка структуры регистраций/статусов, без копирования базы
  участников и без сбора не относящихся к задаче персональных данных.
- Карта источников, права использования и интеграционный контракт.
- Документирование результатов в этом разделе проекта и обновление его реестра.

### authority

Сейчас разрешены проверка существующих возможностей, навигация и чтение
согласованных разделов после самостоятельного входа Owner, анализ локального
кода TravelGTC без изменения, подготовка документов и отчёта. Вход Owner является
явным исключением к запрету отправки форм; это не разрешение отправлять другие
формы. Не выводить пароль, MFA, cookies или токены в инструменты агента.

Создание новых credentials, перенос персональных данных, изменение кода/runtime
и постоянная синхронизация требуют утверждения точного контракта: механизм,
данные, права, частота, хранение, файлы и способ отключения. После утверждения
решения фиксируются в этой задаче без новой задачи или повторного согласования
уже принятого scope.

### dependencies

- [Стратегия TRAVELGTC-MKT-001](142_travelgtc_mkt_001_master_marketing_strategy.md).
- [Текущий источник инструкции Миры](080_travelgtc_ai_001_mira_consultant_instruction.md).
- [Предыдущий отчёт об ограничениях и публикации](152_travelgtc_ai_018_guest_first_instruction_report.md).
- BrowserAct, Chrome и изолированный профиль в фактической среде: UNKNOWN до
  preflight; установка плагина на компьютере не доказывает наличие на GTC1.
- Доступ Owner к нужным разделам: проверить через ручной вход, не извлекая секреты.
- API/экспорт/webhooks и разрешения провайдера: UNKNOWN; это зависимость будущей
  интеграции, а не основание блокировать доступное изучение и формализацию.

### constraints / out_of_scope

- Не выполнять покупки, бронирования, регистрацию участников, отправку заявок,
  поддержку/рассылки, изменение кабинетов и финансовые операции.
- Не использовать основной браузерный профиль; не переносить cookies или
  сохранённые пароли между Windows, WSL, GTC1 и Agent-01.
- Не публиковать закрытые материалы без проверки условий. Доступ к чтению не
  означает право копирования, повторного распространения или передачи в Миру.
- Не делать массовый экспорт, HAR/network dumps, скачивание всей базы или
  скриншоты с лишними персональными данными. Отчёты содержат обезличенные примеры.
- Не сохранять секреты в Git, задачах, логах, чатах или снимках экрана. Не давать
  публичной Мире браузерную сессию, кабинет Owner или административный доступ.
- Не менять sandbox, permissions, SSH keys, browser debug ports, прокси и
  сетевую архитектуру; не ставить новые компоненты автоматически.
- Не менять Azure, OpenClaw, Agent-01, production TravelGTC и существующие
  незакоммиченные изменения. Задача AUTO-001 этим поручением не запускается.
- «Только чтение» в инструкции не является техническим запретом записи в
  кабинете; фиксировать фактические права и избегать элементов изменения данных.
- Новые домены авторизации и расширение доступа согласовать до перехода.

## 2. Execution Sequence

### Phase A - Environment And Login

1. Прочитать canonical governance entrypoint, эту задачу и только связанные
   источники. Проверить существующие Skills/tools/connectors прежде чем заявлять
   отсутствие возможности. Не загружать полные каталоги.
2. Зафиксировать host/OS/cwd, местоположение BrowserAct CLI и его версию,
   доступность Skill и отдельного профиля. Проверки сначала read-only; не
   устанавливать пакеты, не читать credential stores. UNKNOWN != NOT_FOUND.
3. Определить, где выполняется Codex и где живёт браузер. SSH-терминал GTC1 сам
   по себе не даёт этому агенту управление браузером Windows. Проверить уже
   существующее поддерживаемое соединение, не создавать туннели или мосты.
4. Если BrowserAct есть только в локальном Codex, этот Codex выполняет браузерную
   часть, а GTC1 остаётся местом работы с проектом. Передавать только task scope и
   обезличенный отчёт. Не переносить сессию и не запускать два агента на изменение
   одних файлов. Не объявлять наличие доступа к файлам GTC1 без проверки.
5. Открыть нужный сайт в выделенном профиле и передать управление Owner для
   входа/MFA поддерживаемым способом. Во время ввода секретов не снимать DOM,
   экран или трафик. После подтверждения Owner проверить доступ по несекретному
   признаку. При истечении сессии запросить повторный ручной вход.
6. Если нет существующего безопасного способа продолжить работу в нужной среде,
   сообщить точную недостающую возможность и минимальное необходимое действие;
   продолжать независимую документальную часть, не обходить ограничение.

### Phase B - Sources And Integration Contract

1. Изучить согласованные разделы, начиная с My Links и официальных материалов.
2. Составить таблицу: источник/URL -> назначение -> аудитория -> требуемый вход ->
   проверенная дата -> разрешённое использование -> назначение в TravelGTC.
   Исключать секретные URL-параметры; персональные guest codes не публиковать.
3. Отделить ссылку на источник от права опубликовать его содержимое. Уточнить,
   какие источники посетитель сможет открыть по разрешённому гостевому маршруту.
4. По официальной документации и ответу поддержки определить API, webhooks,
   разрешённый экспорт либо другой поддерживаемый способ. Не выводить возможность
   постоянной интеграции из факта успешного browser login.
5. Подготовить контракт одностороннего обмена внешние системы -> TravelGTC:
   объекты/поля, идентификаторы, разрешения, срок хранения, частота, лимиты,
   проверка подлинности, повторы, дедупликация, ошибки и отзыв доступа.
6. Разделить аккаунт TravelGTC, гостя Travel Advantage, платное Membership и
   Ambassador. Клик/выдача ссылки и заявление пользователя не подтверждают
   регистрацию. Имя не является надёжным ключом связи; неоднозначные совпадения
   требуют ручной проверки. Показать источник и время подтверждённого статуса.
7. Представить точный план файлов/настроек и передачу только разрешённых сведений
   Мире через серверный слой. При отсутствии поддерживаемого механизма сохранить
   ручную проверку Owner и описать альтернативу, не включать скрытый scraping.
8. Остановиться перед активацией интеграции для решения Owner по контракту.

### Phase C - Conditional Implementation

Не разрешена текущим execution gate. После утверждения контракта в рамках этой
же задачи: ограниченная реализация, синтетические/разрешённые тестовые данные,
проверка точности сопоставления и отрицательных случаев, ограниченный pilot,
проверка отключения и затем согласованная активация. Не обещать синхронизацию
данных, которых внешний провайдер не предоставляет или не разрешает передавать.

## 3. Outputs And Acceptance

### required_outputs

- Несекретный preflight: среда, версии, доступные инструменты, проверенный маршрут
  входа, границы прав, срок/отзыв сессии и состояние зависимостей.
- Таблица проверенных источников и допустимого использования.
- Карта данных и предлагаемых связей с сайтом, CRM и Мирой.
- Контракт интеграции с техническими основаниями, конкретным scope, тестами,
  способом отключения и вопросами, действительно требующими Owner.
- Короткий отчёт: что проверено лично, что сообщил Owner, что не подтверждено.

### acceptance_criteria

1. Среда и изолированный доступ проверены; работа без него не выдаётся за
   выполненное изучение личного кабинета.
2. Источники классифицированы; закрытые материалы и секреты не опубликованы.
3. Механизм интеграции подтверждён либо конкретное ограничение документировано.
4. Критерии будущих тестов включают сопоставление, неподтверждённую регистрацию,
   дубликаты, события не по порядку, сетевой сбой, лимиты, истечение/отзыв доступа,
   отсутствие лишних полей и безопасное отключение синхронизации.
5. Текущий результат называется DISCOVERY_COMPLETE / CONTRACT_FOR_OWNER_REVIEW,
   а не работающей интеграцией. Полная задача закрывается только после проверки
   согласованного обмена или явно принятого Owner сокращённого результата.

## 4. Codex Handoff

Передать этот блок в чат Codex, а не в командную строку SSH:

```text
Приступай к TRAVELGTC-INTEGRATION-001, этапы A и B.
Owner утвердил задачу; повторное утверждение изучения не требуется.
На GTC1 прочитай:
/srv/repos/personal/gtc-docs/governance/README.md
/var/www/gtc-form/docs/travelgtc/153_travelgtc_integration_001_authorized_access_task.md
Затем только перечисленные зависимости.

Сначала проверь фактическую среду Codex, наличие BrowserAct Skill/CLI
и отдельного браузерного профиля. Не считай, что SSH-терминал на GTC1
автоматически предоставляет доступ к локальному браузеру Windows.
Не устанавливай новые компоненты и не переноси cookies.
Сообщи, в каком окне мне выполнить вход, без запроса пароля в чате.
Если доступ к GTC1 или BrowserAct отсутствует, укажи точно какой;
не утверждай, что прочитал недоступный task record.

После моего ручного входа изучи разрешённые разделы MWR Life и
Travel Advantage, подготовь таблицу источников и контракт интеграции.
Не отправляй формы и не меняй аккаунты. Не переноси персональные данные,
не включай синхронизацию, не меняй production до утверждения контракта.
Отчёт: доступ/источники/схема обмена/тесты/одно необходимое решение Owner.
```

Если выполняющий BrowserAct локальный Codex не видит серверный путь, Owner
передаёт ему сам этот несекретный документ как вложение. Путь на GTC1 не является
вложением и не доказывает чтение. Не передавать вместо задачи всю историю чата,
секреты, env-файлы или browser profile. Результат браузерной части возвращается
исполнителю GTC1 как обезличенный отчёт; только один исполнитель ведёт документы.

## 5. Registration Evidence

- 2026-09-17: created from the Owner-approved revised contract; indexed in
  `00_documentation_register.md` as a project task.
- This step changes documentation only. Browser login, API connection, package
  installation, production modifications and Git commit/push are not performed
  by registering this record. A future executor must inspect the current dirty
  worktree before making scoped documentation changes.


## 6. Discovery Execution — 2026-09-17

Execution evidence and proposal: [154_travelgtc_integration_001_discovery_contract.md](154_travelgtc_integration_001_discovery_contract.md).

Owner completed manual login in the isolated Windows BrowserAct profile. Travel Advantage Home and MWR Life Dashboard/My Links/Marketing were independently verified. Public terms do not establish permission for automated exchange or private-content reuse. Proposed current boundary: LINK_ONLY + EXISTING_OWNER_MANUAL_CHECK. Provider mechanism/permission, registration schema and new-domain training access remain unresolved. Result: CONTRACT_FOR_OWNER_REVIEW, not a working integration or full task closure. Phase C and integration activation remain NOT_AUTHORIZED. No application/runtime/credential change or Git publication was performed.


## 7. Owner Content Scope Clarification — 2026-09-17

Owner explicitly authorized reviewing mwracademy.com and available training/marketing content to prepare useful client links for Mira and project promotion. This resolves the prior new-domain content-access dependency; no new approval of the same content review is required. Credentials, production changes and status synchronization remain outside this clarification.

Result: [155_travelgtc_integration_001_content_catalog.md](155_travelgtc_integration_001_content_catalog.md). 39 Academy pages were read without cookies; catalog contains 71 records including lesson topics, documents and video destinations. Video labels and relevant page contents were inspected; full video playback/transcription was not completed. Public-content link work proceeds independently of API availability. Earlier report 154 remains the status-integration proposal, with its Academy/public-content unknowns superseded by this evidence. No production-Mira update or sync activation occurred.
