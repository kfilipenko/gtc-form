# RJAKA: какие страницы реально отдаются

Дата проверки: 2026-04-15.

Этот документ фиксирует фактический роутинг для домена `rjaka.pro`.

## Базовый источник правды
- Nginx vhost: `/etc/nginx/sites-available/www.rjaka.pro`
- Подключаемый роутинг: `/var/www/gtc-form/projects/shared/nginx/rjaka-compat.conf`

## Соответствие URL -> файл

| Публичный URL | Что делает nginx | Фактический файл |
|---|---|---|
| `/chat` | `301` на `/chat/` | - |
| `/chat/` | `try_files /game-chat.html` | `/var/www/gtc-form/game-chat.html` |
| `/chat/history` | `301` на `/chat/history/` | - |
| `/chat/history/` | `try_files /chat-qa.html` | `/var/www/gtc-form/chat-qa.html` |
| `/game-chat.html` | `301` на `/chat/` | - |
| `/chat-qa.html` | `301` на `/chat/history/` | - |

## Важное уточнение
- Файлы `/var/www/gtc-form/chat/index.html` и `/var/www/gtc-form/chat/history/index.html` в текущем роутинге домена `rjaka.pro` напрямую не отдаются.
- Поэтому правки для страницы `https://rjaka.pro/chat/history/` нужно вносить в `/var/www/gtc-form/chat-qa.html`.

## API-эндпоинты, используемые страницами
- `/game_chat.php` (чат)
- `/admin/chat-qa.php` (история Q/A)
- `/admin/chat-qa-feedback.php` (лайк/дизлайк)

## Операционная памятка
- Нужно поменять страницу `https://rjaka.pro/chat/`:
	править `/var/www/gtc-form/game-chat.html`.
- Нужно поменять страницу `https://rjaka.pro/chat/history/`:
	править `/var/www/gtc-form/chat-qa.html`.
- Если правка сделана в `/var/www/gtc-form/chat/index.html` или `/var/www/gtc-form/chat/history/index.html`,
	на текущем роутинге `rjaka.pro` она не появится.
- Быстрая проверка после правки:
	открыть `https://rjaka.pro/chat/?v=<timestamp>` или `https://rjaka.pro/chat/history/?v=<timestamp>`.
