# CPG-BIZ-130 - Participant section landing pages and menu synchronization report

- Project: CrewPortGlobal.com
- Date: 2026-06-10
- Status: Implemented
- Scope: top navigation, participant section overview pages, runtime menu translation

## 1. Business Requirement

Top navigation sections must not behave only as containers for nested links. Each main participant section needs a clear landing page that explains:

- why the section exists;
- who the participant is for the system;
- what role the participant performs;
- the basic order of actions;
- where the participant should go next.

The menu must remain synchronized across pages and support translation.

## 2. Implemented Pages

New participant landing pages:

```text
/seafarers/
/shipowners/
/agents/overview/
```

The existing `/agents/` route remains the operational agent portal because current backend notifications and agent tasks already target it.

## 3. Menu Model

The shared menu now gives each major tab a main route:

```text
Home        -> /
Seafarers   -> /seafarers/
Shipowners  -> /shipowners/
Agents      -> /agents/overview/
Documents   -> /legal/
Team        -> /team/
```

The tab label itself is a link to the section landing page. The dropdown still exposes the direct workflow actions.

## 4. Translation Model

The new landing pages include explicit English/Russian page dictionaries.

The shared `crewportglobal-navigation.js` runtime now also includes a minimal Russian navigation dictionary. This keeps the top menu translated on older protected/workbench pages where the full public page i18n script is not the controlling translator.

## 5. Verification

Focused checks were completed:

```text
git diff --check
test -f projects/crewportglobal/public/seafarers/index.html
test -f projects/crewportglobal/public/shipowners/index.html
test -f projects/crewportglobal/public/agents/overview/index.html
php -S 127.0.0.1:8787 -t projects/crewportglobal/public
Playwright: /seafarers/
Playwright: /shipowners/
Playwright: /agents/overview/
Playwright: /legal/
Playwright: /team/
Playwright: /admin/access/
```

Verification result:

```text
/seafarers/          title: Моряки
/shipowners/         title: Судовладельцы
/agents/overview/    title: Агенты
/team/               menu homes: Моряки, Судовладельцы, Агенты, Документы, Команда
/admin/access/       menu homes: Моряки, Судовладельцы, Агенты, Документы, Команда
```

## 6. Remaining Future Work

The explanatory participant pages are intentionally concise. Future slices can enrich them with live task counts, role-specific onboarding state and direct status from the user account/capacity model.
