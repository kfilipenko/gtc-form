# CrewPortGlobal.com — задача на создание и регистрацию сайта

- Проект: CrewPortGlobal.com
- Владелец: GTC INFORMATION TECHNOLOGY FZ-LLC
- Версия: 0.1
- Статус: In Progress
- Классификация: Internal
- Дата: 2026-05-08

## Цель

Запустить новый сайт CrewPortGlobal.com как цифровую платформу для публикации клиентской maritime-документации, публичных legal-страниц и дальнейшего онбординга shipowners и seafarers.

## Рабочая позиция

- Stage 1: сайт запускается как technology and documentation platform.
- Публичный контент публикуется в Markdown как канонический источник.
- На сайте сразу должны быть доступны базовые trust and compliance documents.
- Сайт не должен позиционироваться как licensed manning agency до отдельного подтверждения лицензирования.

## Потоки работ

### 1. Домен и регистрация

- Проверить фактический статус домена CrewPortGlobal.com у регистратора.
- Определить владельца домена, аккаунт регистратора и контакт для renewal.
- Подготовить DNS-план: A/AAAA, www, MX при необходимости, SPF, DKIM, DMARC.
- Подготовить SSL/TLS: Let's Encrypt или сертификат через панель хостинга.
- Зафиксировать whois/registrar данные во внутреннем operational note.

### 2. Публичная структура сайта

- Создать стартовую страницу.
- Создать разделы About, How It Works, For Shipowners, For Seafarers.
- Создать legal-раздел для trust documents.
- Подготовить публикационную структуру для Markdown-документов.
- Подготовить public complaints page.

### 3. Документы первой очереди

- No Recruitment Fees Policy.
- Project Scope and Positioning.
- Privacy Policy.
- Terms of Service.
- Complaint Handling Procedure.

### 4. Техническая публикация

- Подготовить исходники сайта в репозитории.
- Отделить internal documents от public markdown.
- Согласовать схему публикации: raw markdown, HTML rendering, либо статическая сборка.
- Подготовить директорию для дальнейшего деплоя на сервер.
- Подготовить nginx-конфиг и deployment scaffold для GTC1.

### 5. Governance и запуск

- Утвердить owner для legal content.
- Утвердить review cycle и revision history.
- Определить publish workflow: draft, internal review, legal review, published.
- Зафиксировать launch checklist перед выводом сайта в production.

## Что уже запускаем в этом пакете

- Создан внутренний documentation register.
- Создан каркас проекта в репозитории.
- Подготовлены первые public markdown pages.
- Подготовлена стартовая HTML-страница для раннего preview.
- Подготовлены страницы For Shipowners, For Seafarers и Complaint Handling Procedure.
- Подготовлен operational checklist по домену, DNS, SSL и публикации.
- Подготовлен стартовый nginx/deployment scaffold для GTC1.

## Внешние блокеры

- Регистрация или перенос домена требуют доступа к регистратору.
- DNS и SSL требуют доступа к панели домена или серверной конфигурации.
- Публикация на production требует подтверждённого target path и nginx/site config.

## Следующие практические шаги

1. Утвердить complaint contact channels и итоговые email-адреса.
2. Определить окончательный deployment path на GTC1.
3. Подтвердить домен, DNS authority и SSL issuance flow.
4. После получения доступа завершить production activation checklist.

## Revision History

| Version | Date | Author | Changes |
|---|---|---|---|
| 0.1 | 2026-05-08 | GitHub Copilot | Initial launch and registration task created |