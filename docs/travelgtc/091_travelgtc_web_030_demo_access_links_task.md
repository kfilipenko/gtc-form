# TRAVELGTC-WEB-030 - Travel Advantage Demo Access Links Task

- Project: TravelGTC
- Code: TRAVELGTC-WEB-030
- Date: 2026-07-28
- Status: Draft for Project Owner approval
- Depends on: TRAVELGTC-WEB-029, TRAVELGTC-CRM-003

## 1. Objective

Add official Travel Advantage demo access links to the TravelGTC site and to Mira's knowledge/context so users can explore the product before paid registration.

Provided demo links:

```text
VIP demo:
https://vip.traveladvantage.com/KFilip909

Free demo:
https://free.traveladvantage.com/KFilip909
```

Existing purchase referral link:

```text
https://www.mwrlife.com/KFilip909
```

## 2. Business Purpose

Demo access should become a softer funnel step before purchase.

Instead of pushing only the registration link, Mira and the site can offer:

1. see the platform first;
2. compare what a guest/free/VIP demo experience shows;
3. return to Mira with questions;
4. then choose Membership or Ambassador path.

This supports a cleaner progression:

```text
Interest -> Demo -> Questions -> Membership fit -> Purchase intent -> Referral registration
```

## 3. Public Site Placement

Recommended placement:

1. home page block near Membership / official documents;
2. dedicated Mira page `/mira/`;
3. footer or official links area only if the wording is compact and not distracting.

Recommended button labels:

```text
Открыть VIP demo Travel Advantage
Открыть free demo Travel Advantage
```

Recommended explanatory copy:

```text
Демо-доступ помогает посмотреть интерфейс Travel Advantage до регистрации и оплаты. Доступ, условия, состав предложений и доступность сервисов необходимо проверять на официальных страницах Travel Advantage.
```

## 4. Mira Agent Requirements

Mira may provide demo links when the user:

1. asks what Travel Advantage looks like;
2. wants to see the platform before registration;
3. hesitates before paid Membership;
4. asks for free access, demo, trial or examples;
5. compares Membership levels.

Mira must clearly distinguish:

1. demo access;
2. official paid registration through `https://www.mwrlife.com/KFilip909`;
3. consultation / CRM follow-up through TravelGTC.

## 5. CRM Requirements

When Mira gives a demo link, the interaction should remain in CRM history.

Future optional enhancement:

1. add metadata flag `demo_link_shared`;
2. raise lead stage to `demo_shared` only if we decide to extend CRM stages.

For this first task, no new DB field is required.

## 6. Risk Notes

Before implementation, the Project Owner accepts that:

1. these links are provided by the Project Owner as active Travel Advantage demo links;
2. TravelGTC will not represent demo access as guaranteed availability, price or final Membership condition;
3. Mira must not promise that demo offers equal paid account inventory or final booking terms;
4. if company support later gives restrictions, links and wording must be updated.

## 7. Acceptance Criteria

The task is complete when:

1. demo links are visible on approved public page locations;
2. links open in a new tab with `rel="noopener"`;
3. Mira can mention both demo links in relevant answers;
4. purchase-intent behavior still uses `https://www.mwrlife.com/KFilip909`;
5. tests confirm the links are present and correctly attributed;
6. documentation and memory are updated.

## 8. Approval Question

Approve publishing both demo links publicly:

```text
https://vip.traveladvantage.com/KFilip909
https://free.traveladvantage.com/KFilip909
```
