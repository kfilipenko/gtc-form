# Migration Executive Summary

## Что происходит
Текущий контур объединяет два разных продукта в одном техническом пространстве:
- **RJAKA** (игровой чат + история чатов)
- **GTSTOR** (платформа + user/admin чаты + сайтовые разделы)

Это увеличивает стоимость изменений, риск регрессий и усложняет перенос/масштабирование.

## Цель
Разделить направления на независимые контуры так, чтобы:
1. каждое направление деплоилось отдельно;
2. изменения в одном проекте не ломали второй;
3. маршруты, БД, assets и документация имели явного владельца;
4. дальнейший перенос (в отдельные репо/хосты) выполнялся безопасно и предсказуемо.

---

## Принятое целевое решение
- **Контур 1: RJAKA**
  - игровой чат,
  - история чатов,
  - feedback (лайк/дизлайк),
  - RJAKA favicon/branding.

- **Контур 2: GTSTOR**
  - платформа/сайтовые разделы,
  - пользовательский и админский бизнес-чаты,
  - GTSTOR favicon/branding.

- Приоритетная модель: **2 отдельных репозитория** (с возможным shared-infra шаблоном).

---

## Что уже подготовлено
Сформирован полный planning-пакет:
- `docs/migration-blueprint-v1.md`
- `docs/component-inventory.csv`
- `docs/dependency-map.md`
- `docs/db-ownership-matrix.md`
- `docs/route-compatibility-plan.md`
- `docs/cutover-checklist.md`

Сделан backup snapshot перед реорганизацией (код + БД), верифицирован на читаемость.

---

## Ключевые риски и контроль
1. **Скрытые зависимости между чатами**
   - Контроль: dependency-map + dry-run перед cutover.

2. **Смешение данных в БД**
   - Контроль: db-ownership-matrix + разделение ролей доступа.

3. **Поломка URL при переходе**
   - Контроль: route-compatibility-plan (proxy/redirect staging).

4. **Смешение брендов (favicon/manifest)**
   - Контроль: раздельные asset sets RJAKA/GTSTOR и smoke-check перед go-live.

---

## План исполнения (высокий уровень)
1. Freeze + финальный pre-cutover backup.
2. Dry-run на staging (routes/API/DB/assets).
3. Поэтапный cutover: DB → API → frontend → routing.
4. Smoke-check RJAKA и GTSTOR по чек-листу.
5. Stabilization window и снятие compatibility-layer.

---

## Критерии успеха
- Нулевые P0/P1 инциденты в cutover-window.
- Оба контура работают независимо по своим маршрутам и данным.
- Нет cross-project зависимостей в runtime.
- Корректные favicon/branding по проектам.
- Команда может планировать релизы RJAKA и GTSTOR независимо.

---

## Решение для старта execution-фазы
**Go to execution** возможен после формального sign-off по 3 пунктам:
1. ownership данных и маршрутов утверждён;
2. rollback runbook утверждён;
3. dry-run прошёл без блокеров P0/P1.
