# RJAKA → GTC1 Migration Runbook — 2026-03-05

Цель: перенести чат-сайт `rjaka.pro` на `gtc1`, сначала подняв новый контур, затем безопасно передав ему текущее доменное имя.

## 0) Текущая фактическая картина (preflight findings)

- `rjaka.pro` сейчас резолвится в Wix (`185.230.63.107`, `185.230.63.171`, `185.230.63.186`).
- `www.rjaka.pro` резолвится через Wix/Google edge (`34.160.37.117`).
- На `gtc1` нет `nginx` server block для `rjaka.pro`.
- На `gtc1` нет certbot-сертификата для `rjaka.pro`.

Вывод: нужен полноценный blue/green cutover через новый staging-host + DNS switch.

## 1) Целевая стратегия

1. Поднять новый сайт на `gtc1` под временным доменом (например `new-rjaka.gtstor.com`).
2. Проверить функционал и стабильность на временном домене.
3. Выпустить TLS для `rjaka.pro` на `gtc1`.
4. Переключить DNS `rjaka.pro`/`www.rjaka.pro` на IP `gtc1`.
5. Выполнить post-cutover smoke и оставить быстрый rollback.

## 2) Подготовка (T-48h … T-24h)

### 2.1 DNS
- Уменьшить TTL для `rjaka.pro` и `www.rjaka.pro` до `60–300` секунд.
- Зафиксировать текущие записи в execution log.

### 2.2 GTC1 / nginx
- Создать новый vhost для временного хоста (статик + php, если нужно).
- Подключить basic-auth или IP allowlist на время теста.
- Убедиться, что `nginx -t` и `systemctl reload nginx` проходят.

### 2.3 Сертификаты
- Выпустить cert для временного хоста.
- Подготовить cert issuance для `rjaka.pro`/`www.rjaka.pro` на окно cutover.

## 3) Staging validation (обязательно до cutover)

- Открывается главная страница чата.
- Отправка сообщения работает.
- Ответ приходит в ожидаемое время.
- Проверены все используемые endpoint-ы.
- В логах нет критичных ошибок (`nginx`, `php-fpm`, app logs).

## 4) Cutover window (T0)

1. Freeze контента/изменений на старом контуре.
2. Финальная проверка `gtc1`:
   - `sudo nginx -t`
   - `sudo systemctl status nginx --no-pager`
3. Выпуск/проверка cert для `rjaka.pro` и `www.rjaka.pro`.
4. DNS switch:
   - `A rjaka.pro -> <GTC1_IP>`
   - `A www.rjaka.pro -> <GTC1_IP>` (или `CNAME` на `rjaka.pro` по вашей политике)
5. Подождать 5–15 минут (с учётом TTL) и выполнить smoke.

## 5) Post-cutover acceptance

- `curl -I https://rjaka.pro` возвращает `200/301/302` ожидаемо.
- `curl -I https://www.rjaka.pro` возвращает ожидаемый код.
- UI smoke: открыть сайт, отправить тестовое сообщение, получить ответ.
- Мониторинг ошибок: нет всплеска `5xx` в `nginx`/`php`/app logs.

## 6) Rollback plan (быстрый)

Триггеры rollback:
- недоступность сайта,
- критичные ошибки API,
- деградация чата.

Действия:
1. Вернуть DNS записи `rjaka.pro`/`www.rjaka.pro` на прежние значения (Wix).
2. Проверить доступность старого контура.
3. Зафиксировать причину и артефакты инцидента.

## 7) Команды (шаблон)

```bash
# DNS snapshot
dig +short rjaka.pro A
dig +short www.rjaka.pro A

# nginx validation on gtc1
sudo nginx -t
sudo systemctl reload nginx

# post-switch quick checks
curl -Ik https://rjaka.pro
curl -Ik https://www.rjaka.pro
```

## 8) Критерии завершения

- DNS указывает на `gtc1`.
- TLS валиден для `rjaka.pro` и `www.rjaka.pro`.
- Smoke и лог-контроль `PASS`.
- Rollback-план проверен и задокументирован.