# TRAVELGTC-WEB-022 - Post Submit Home Return Button Task

- Project: TravelGTC
- Code: TRAVELGTC-WEB-022
- Date: 2026-07-10
- Status: Implemented

## 1. Context

The Project Owner completed registration and submitted the home request form on the live site.

After successful submission, the form status correctly showed that the request was received, but the button still displayed the original submit label:

```text
Отправить заявку
```

This could invite accidental repeated submission and does not match the expected post-submit flow.

## 2. Requirement

After a successful TravelGTC lead form submission:

1. the submit button must change to `Вернуться на главную`;
2. the button must navigate to `/`;
3. the button must not submit the form again;
4. the behavior must apply through the shared TravelGTC lead-form handler.

## 3. Acceptance Criteria

The task is complete when:

1. the authenticated funnel test verifies the post-submit button text;
2. clicking the button after successful submission returns to the home page;
3. responsive and funnel checks pass locally and on the live domain.
