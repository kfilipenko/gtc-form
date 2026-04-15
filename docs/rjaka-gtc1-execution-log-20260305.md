# RJAKA → GTC1 Execution Log — 2026-03-05

Связанный runbook: [docs/rjaka-gtc1-migration-runbook-20260305.md](docs/rjaka-gtc1-migration-runbook-20260305.md)

## A) Preflight snapshot (already collected)

- [x] `dig +short rjaka.pro A` → `185.230.63.107`, `185.230.63.171`, `185.230.63.186`
- [x] `dig +short www.rjaka.pro A` → `34.160.37.117` (через Wix chain)
- [x] На `gtc1` нет vhost с `server_name rjaka.pro`
- [x] На `gtc1` нет `/etc/letsencrypt/live/rjaka.pro`
- [x] Runtime evidence: [docs/runtime/rjaka-gtc1-preflight-20260305-165754Z.md](docs/runtime/rjaka-gtc1-preflight-20260305-165754Z.md)

## B) Preparation (to execute)

- [ ] Снизить DNS TTL для `rjaka.pro` и `www.rjaka.pro`
- [x] Создать временный host (пример: `new-rjaka.gtstor.com`) на `gtc1`
- [x] Ограничить доступ к временному host (IP allowlist: localhost + 10.0.0.0/8)
- [ ] Выпустить TLS cert для временного host
- [x] Прогнать `sudo nginx -t` и `sudo systemctl reload nginx`
- [x] Runtime evidence: [docs/runtime/rjaka-gtc1-staging-host-20260305-165846Z.md](docs/runtime/rjaka-gtc1-staging-host-20260305-165846Z.md)
- [x] Runtime evidence (hardening): [docs/runtime/rjaka-gtc1-staging-hardening-20260305-170109Z.md](docs/runtime/rjaka-gtc1-staging-hardening-20260305-170109Z.md)

## C) Staging validation (to execute)

- [x] Главная страница открывается
- [ ] Сообщение отправляется
- [ ] Ответ возвращается
- [ ] Проверены ключевые endpoint-ы
- [ ] Логи без критичных ошибок
- [x] Runtime evidence (functional): [docs/runtime/rjaka-gtc1-staging-functional-20260305-170316Z.md](docs/runtime/rjaka-gtc1-staging-functional-20260305-170316Z.md)
- [ ] Блокер: `POST /game_chat.php` возвращает `502 webhook_empty_response` (пустой body от n8n webhook)
- [x] Runtime evidence (webhook probe): [docs/runtime/rjaka-gtc1-webhook-probe-20260305-170506Z.md](docs/runtime/rjaka-gtc1-webhook-probe-20260305-170506Z.md)

## D) Cutover window (to execute)

- [ ] Freeze изменений на старом контуре
- [ ] Выпустить cert для `rjaka.pro` и `www.rjaka.pro` на `gtc1`
- [ ] Переключить DNS `rjaka.pro` на `gtc1`
- [ ] Переключить DNS `www.rjaka.pro` на `gtc1`
- [ ] Подтвердить резолв и доступность после TTL

## E) Post-cutover acceptance (to execute)

- [ ] `curl -Ik https://rjaka.pro` ожидаемый ответ
- [ ] `curl -Ik https://www.rjaka.pro` ожидаемый ответ
- [ ] UI smoke `PASS`
- [ ] Ошибки `5xx` не выросли

## F) Rollback (if needed)

- [ ] Вернуть DNS на прежние значения
- [ ] Проверить восстановление старого контура
- [ ] Зафиксировать incident report