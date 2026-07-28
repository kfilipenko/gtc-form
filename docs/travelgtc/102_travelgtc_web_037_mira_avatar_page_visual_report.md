# TRAVELGTC-WEB-037 - Mira Avatar Page Visual Report

- Project: TravelGTC
- Code: TRAVELGTC-WEB-037
- Date: 2026-07-28
- Status: Implemented, refined and published
- Scope: `/mira/`, Mira avatar image, compact chat banner, responsive layout, Playwright guard

## 1. Source

Approved source image:

```text
projects/travelgtc/public/assets/images/inbox/Mira Avatar.png
```

Published optimized asset:

```text
projects/travelgtc/public/assets/images/processed/mira-avatar.webp
```

## 2. Implementation

The dedicated `/mira/` page now uses the approved Mira avatar inside a compact chat banner. The banner text is:

```text
Спросите
Вашего Агента
Мира:
```

The word `Персональный` was removed after visual review. WEB-038 later changed the banner from the shorter `Ваш / Агент / Мира` variant to a direct chat prompt: `Спросите / Вашего Агента / Мира:`. The avatar is placed on the right side of the banner with rounded/oval edges. This keeps the page chat-focused and prevents the image from taking over the first screen.

The chat panel header must not duplicate the site logo, `Мира TravelGTC` title or `AI-чат` subtitle because the top menu already carries the brand and page context. The page also must not reintroduce the removed Guest Pass / VIP explanatory copy.

## 3. Verification

Passed:

```text
npm run test:travelgtc
git diff --check
```

The Playwright suite verifies that `/mira/` loads `/assets/images/processed/mira-avatar.webp`, keeps the chat header free from a duplicate logo, renders the compact banner wording and does not reintroduce `Персональный`.
