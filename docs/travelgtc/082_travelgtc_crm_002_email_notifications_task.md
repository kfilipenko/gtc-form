# TRAVELGTC-CRM-002 - Lead Email Notifications

- Project: TravelGTC
- Code: TRAVELGTC-CRM-002
- Date: 2026-07-11
- Status: Implemented in code, SMTP credentials required for production sending

## 1. Objective

Every new TravelGTC lead should notify the project owner by email so that the CRM does not require constant manual checking.

Primary notification recipient:

```text
kfilipenko@kmf.ru
```

## 2. Implemented Behavior

After a lead is saved through:

1. `POST /api/travelgtc/v1/public/leads`;
2. `POST /api/travelgtc/v1/account/leads`;

the API attempts to send an email notification.

The lead is not rolled back if email delivery fails. CRM data remains the source of truth.

## 3. Runtime Configuration

Email sending is controlled by `/etc/travelgtc/travelgtc-api.env`.

Required SMTP settings:

```bash
TRAVELGTC_EMAIL_NOTIFICATION_MODE=smtp
TRAVELGTC_LEAD_NOTIFICATION_TO=kfilipenko@kmf.ru
TRAVELGTC_LEAD_NOTIFICATION_FROM=TravelGTC <no-reply@travelgtc.com>
TRAVELGTC_SMTP_HOST=
TRAVELGTC_SMTP_PORT=587
TRAVELGTC_SMTP_SECURE=false
TRAVELGTC_SMTP_USER=
TRAVELGTC_SMTP_PASSWORD=
```

Until SMTP credentials are entered, the mode remains:

```bash
TRAVELGTC_EMAIL_NOTIFICATION_MODE=disabled
```

## 4. Email Content

The notification includes:

1. lead ID;
2. user name;
3. contact value;
4. preferred contact channel;
5. primary interest;
6. declared role;
7. business-interest level;
8. message text;
9. landing path and referrer;
10. link to `https://travelgtc.com/crm/`.

## 5. Verification

Current verification:

1. TypeScript build passed;
2. API tests passed: `17 passed`;
3. production API health exposes `email_notification_mode`.

Production email delivery must be verified after SMTP credentials are entered.

