# gtc-form
Форма для регистрации на ProdAn
Создана для регистрации пользователей с проверкой повторения @адресов. 
Данные формы передаются во внешнее хранилище GT
Новая запись передается в WF на n8n

## Утилиты

### Telegram Text Processing (`/utils/telegram-text.js`)

Модуль для обработки текста для отправки в Telegram через n8n workflows:

- **escapeMarkdownV2** - Экранирование специальных символов для MarkdownV2 формата Telegram
- **chunkText** - Разбивка длинных сообщений на части (лимит Telegram 4096 символов)
- **sanitizeStageNumber** - Валидация и нормализация номера стадии для БД
- **createTelegramOutput** - Создание форматированного объекта для вывода в n8n

Документация: [utils/README.md](utils/README.md)  
Примеры использования: [utils/n8n-examples.js](utils/n8n-examples.js)
