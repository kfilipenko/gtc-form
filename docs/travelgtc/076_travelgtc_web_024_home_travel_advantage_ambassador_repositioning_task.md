# TRAVELGTC-WEB-024 - Home Travel Advantage And Ambassador Repositioning Task

- Project: TravelGTC
- Code: TRAVELGTC-WEB-024
- Date: 2026-07-11
- Status: Approved for implementation

## 1. Context

The Project Owner approved a strategic repositioning of the TravelGTC home page.

The current public site can be interpreted as an independent travel organization offering its own tourism services. This is not the intended positioning.

TravelGTC must be presented as:

```text
A partner information page of an independent Lifestyle Ambassador.
```

The page should explain MWR Life, Travel Advantage and the next consultation step without implying that TravelGTC is the official corporate website, booking platform or legal representative of MWR Life / Travel Advantage.

## 2. Official Source Baseline

The implementation must use only cautious claims that can be traced to official or public company materials:

1. MWR Life official site: `https://www.mwrlife.com/`
2. MWR Life membership page: `https://www.mwrlife.com/home/membership`
3. MWR Life opportunity page: `https://www.mwrlife.com/home/opportunity`
4. MWR Life company page: `https://www.mwrlife.com/home/company`
5. MWR Life Policies and Procedures: `https://www.mwrlife.com/content/policiesandprocedures.pdf`
6. MWR Life Income Disclosure: `https://www.mwrlife.com/content/IncomeDisclosure.pdf`
7. Travel Advantage official portal: `https://www.traveladvantage.com/`

The implementation must not publish unverified numerical claims such as member count, served countries or supported language count unless an official current source is available and documented.

## 3. Product Positioning

### 3.1 TravelGTC May Say

1. TravelGTC is a partner information page.
2. TravelGTC is operated as a recommendation and consultation channel of an independent Lifestyle Ambassador.
3. TravelGTC helps users understand Travel Advantage membership, MWR Life, events and the Lifestyle Ambassador role.
4. TravelGTC can prepare a user for a personal consultation and official next step.
5. Final conditions, prices, membership rules, availability, official registration and regional limits must be checked through official company resources and procedures.

### 3.2 TravelGTC Must Not Say

1. that TravelGTC is the official website of MWR Life or Travel Advantage;
2. that TravelGTC is an independent travel company or booking provider;
3. that income is guaranteed;
4. that savings, discounts, availability or booking results are guaranteed;
5. that a user can officially enroll, pay or become a member directly through TravelGTC unless an approved official integration is later implemented;
6. that the AI-consultant can make final membership, price, income, eligibility or regional-availability decisions.

## 4. Home Page Required Changes

### 4.1 Hero

Replace the current route/community-first hero with a membership-first but compliant hero.

Recommended content:

```text
Ваш вход в Travel Advantage
через партнёрское сопровождение TravelGTC
```

Supporting copy:

```text
TravelGTC — партнёрская информационная страница независимого Lifestyle Ambassador. Мы помогаем разобраться в возможностях MWR Life, членстве Travel Advantage и партнёрской модели участия.
```

Primary actions:

1. `Узнать о членстве`
2. `Спросить AI-консультанта`

Disclosure line:

```text
Мы не являемся головной компанией. Мы рекомендуем официальный проект как независимые партнёры и помогаем перейти к следующему шагу.
```

### 4.2 Partner Disclosure Block

Add a compact block immediately after the hero:

```text
Мы не создаём отдельную travel-компанию. Мы рекомендуем официальный проект.
```

Purpose:

1. prevent the impression that TravelGTC is a separate travel provider;
2. explain that official prices, rules, registration, booking and restrictions remain with official sources;
3. frame TravelGTC as explanation, consultation and lead routing.

### 4.3 MWR Life / Travel Advantage / TravelGTC Relationship

Add three cards:

1. `MWR Life` - business side, company, Lifestyle Ambassador model, events, training and network development.
2. `Travel Advantage` - product side, travel membership and online travel club categories.
3. `TravelGTC` - independent partner information page and local consultation / CRM funnel.

### 4.4 Travel Advantage Membership Categories

Add a compact icon grid:

1. Hotels
2. Flights
3. Resorts
4. Car Rentals
5. Cruises
6. Excursions
7. Activities
8. Ground Transport
9. Travel Credits
10. Member Support

Copy must say that exact conditions, prices, availability and regional restrictions require official confirmation.

### 4.5 Trust And Compliance

Add a trust block using cautious facts:

1. official company resources are used for final terms;
2. independent Ambassador positioning is disclosed;
3. income is not guaranteed;
4. pricing, availability and membership conditions are confirmed through official resources.

Do not publish unverified promotional numbers.

### 4.6 Next Step Process

Add a horizontal/compact process:

```text
Вопрос AI -> Выбор интереса -> Вход или регистрация -> Заявка -> Консультация -> Официальный следующий шаг
```

The process must map to the existing TravelGTC business process:

```text
visitor -> interest -> authenticated form -> lead -> consultation -> official next step -> membership / Ambassador
```

### 4.7 AI Consultant Stub

Implement a front-end AI-consultant widget in safe FAQ/stub mode for this task.

Required behavior:

1. floating button at the bottom right;
2. home page section after the process block;
3. hero CTA opens the widget;
4. answer safely about MWR Life, Travel Advantage, membership, Ambassador role and TravelGTC's independent status;
5. never promise income or guaranteed savings;
6. route next-step questions to the authenticated lead form.

Live `/api/chat` integration is out of scope for this task and must be implemented as a later backend/agent task.

### 4.8 Lead Form

Keep the approved registration-first model:

1. the user must log in or register before submitting a lead;
2. name, email, phone and preferred contact channel are taken from the TravelGTC account profile;
3. the home lead form must not ask for name, contact value or channel again.

Update the home form interests to match the new positioning:

1. Travel Advantage membership;
2. learn MWR Life;
3. Lifestyle Ambassador;
4. partner model;
5. events;
6. presentation request;
7. question.

Country can be added only as a lightweight field if needed for checking official availability.

## 5. Navigation And Footer

### 5.1 Header Navigation

Update the home page navigation labels toward:

1. `Главная`
2. `Travel Advantage`
3. `MWR Life`
4. `Членство`
5. `Ambassador`
6. `События`
7. `Вопрос AI`
8. `Контакты`

Right-side primary action should become:

```text
Узнать о членстве
```

Account login/register controls remain.

### 5.2 Footer

Footer must explicitly state:

```text
TravelGTC является партнёрской информационной страницей независимого Lifestyle Ambassador. Сайт не является официальным сайтом MWR Life или Travel Advantage и не заменяет официальные документы, условия, цены, правила членства, компенсационный план или региональные ограничения.
```

Footer links must include official source links and existing legal pages.

## 6. Out Of Scope

1. creating a live AI model integration;
2. building `POST /api/chat`;
3. replacing the existing authenticated lead API;
4. creating official MWR Life / Travel Advantage enrollment;
5. collecting payments;
6. claiming exact prices or official availability;
7. rebuilding supporting pages into the new navigation model.

## 7. Acceptance Criteria

The task is complete when:

1. the home page clearly identifies TravelGTC as a partner information page;
2. the hero is Travel Advantage membership-first;
3. TravelGTC no longer appears to be an independent tourism service provider;
4. MWR Life, Travel Advantage and TravelGTC roles are explained;
5. the home page includes a safe AI-consultant stub and widget;
6. the lead form uses account profile contact data and new interest options;
7. the footer includes official-source links and stronger independent-status disclosure;
8. no income or guaranteed savings claims are published;
9. local responsive and funnel tests pass;
10. live publication is verified after deployment.
