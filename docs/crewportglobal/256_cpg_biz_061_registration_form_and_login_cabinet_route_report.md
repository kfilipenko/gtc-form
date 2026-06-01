# CPG-BIZ-061 - Отчет о компактной форме регистрации и маршруте входа в кабинет

- Проект: CrewPortGlobal.com
- Компания: GTC INFORMATION TECHNOLOGY FZ-LLC
- Этап: Stage 1 - Digital Maritime Crew Data and Matching Platform
- Тип документа: отчет о реализации
- Основание: доработка после CPG-BIZ-060
- Версия: 1.0
- Дата: 2026-06-01
- Статус: реализовано и проверено

## 1. Цель

Цель этапа - привести первый шаг регистрации к минимально необходимой форме и разделить два пользовательских маршрута:

1. регистрация нового участника платформы ведет к заполнению профильной формы по выбранной роли;
2. авторизация существующего пользователя всегда ведет в личный кабинет.

## 2. Изменения в регистрации

На странице:

```text
/register/
```

из формы регистрации участника платформы удалено поле:

```text
Country / residence
Страна / место проживания
```

Причина: страна проживания уже относится к профильным данным и должна запрашиваться в профильной форме моряка или работодателя, а не на первом шаге создания аккаунта.

Текущий первый шаг регистрации оставляет только данные, необходимые для создания сервисного аккаунта:

1. email;
2. полное юридическое имя;
3. роль на платформе;
4. телефон;
5. пароль;
6. повтор пароля;
7. подтверждение условий и согласия.

Поля пароля и повторения пароля остаются в одной строке на desktop-layout за счет двухколоночной сетки формы. На мобильных устройствах поля переходят в одну колонку.

## 3. Маршруты после регистрации

После регистрации пользователь направляется по выбранной роли:

| Роль | Маршрут |
|---|---|
| Моряк | `/create-profile/?draft_id=...` |
| Судовладелец / работодатель | `/post-vacancy/?draft_id=...` |

Это сохраняет утвержденную бизнес-логику:

```text
регистрация участника платформы
-> выбор роли
-> заполнение полной профильной формы
```

## 4. Маршрут после авторизации

Общий login в верхнем меню теперь после успешного ответа:

```text
POST /api/v1/auth/login
```

направляет пользователя в:

```text
/cabinet/
```

Если backend вернет `next_url`, используется он; базовый fallback остается `/cabinet/`.

Это фиксирует правило:

```text
регистрация = начало профильного маршрута
авторизация = вход в личный кабинет
```

## 5. Файлы изменены

| Файл | Изменение |
|---|---|
| `projects/crewportglobal/public/register/index.html` | Удалено поле страны проживания, обновлены тексты валидации и payload регистрации. |
| `projects/crewportglobal/public/assets/crewportglobal-navigation.js` | После успешного login добавлен переход в кабинет. |
| `tests/crewportglobal-homepage-language.spec.ts` | Обновлены проверки регистрации без поля страны. |
| `tests/crewportglobal-register-routing.spec.ts` | Обновлена проверка ролевой регистрации без поля страны. |
| `tests/crewportglobal-auth-password-session.spec.ts` | Добавлена проверка, что login из верхнего меню ведет в `/cabinet/`; регистрация работодателя ведет в `/post-vacancy/`. |
| `docs/crewportglobal/00_documentation_register.md` | Добавлена ссылка на настоящий отчет. |

## 6. Проверка

Проверено:

1. встроенные скрипты registration/navigation;
2. i18n-ключи публичных страниц;
3. ролевой переход после регистрации;
4. переход в кабинет после авторизации;
5. отсутствие устаревшего поля `Country / residence` в форме регистрации.

Команды проверки:

```bash
node - <<'NODE'
const fs = require('fs');
for (const file of [
  'projects/crewportglobal/public/register/index.html',
  'projects/crewportglobal/public/assets/crewportglobal-navigation.js',
]) {
  const source = fs.readFileSync(file, 'utf8');
  if (file.endsWith('.html')) {
    const scripts = Array.from(source.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g))
      .map((match) => match[1])
      .filter((script) => script.trim());
    scripts.forEach((script) => new Function(script));
  } else {
    new Function(source);
  }
}
NODE
```

Результат: passed.

```bash
npm run check:cpg-i18n
```

Результат: passed.

```bash
npx playwright test -c playwright.crewportglobal.config.ts \
  tests/crewportglobal-homepage-language.spec.ts \
  tests/crewportglobal-register-routing.spec.ts \
  tests/crewportglobal-auth-password-session.spec.ts \
  -g "register page creates platform participant|employer participant registration|public register page creates|password registration, login session|register page creates password credential"
```

Результат: 5 passed.

## 7. Следующий этап

Следующий этап:

```text
CPG-BIZ-062 - Cabinet first-screen compaction and role-specific next actions
```

Цель следующего этапа - сделать личный кабинет не справочной страницей, а коротким рабочим экраном: текущая роль, текущая задача, ссылка на незавершенную профильную форму и понятное следующее действие.
