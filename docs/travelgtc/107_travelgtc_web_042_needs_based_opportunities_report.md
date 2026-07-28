# TRAVELGTC-WEB-042 - Needs-Based Opportunities Page Report

- Project: TravelGTC
- Code: TRAVELGTC-WEB-042
- Date: 2026-07-28
- Status: Implemented

## 1. Objective

Rework the former `События` direction into a needs-based `Возможности` section.

The page must help TravelGTC and Mira identify why a person is interested in Travel Advantage or MWR Life:

1. personal travel;
2. family and close people;
3. active trips, sport, wellness and retreats;
4. groups, students and clients;
5. club events and participant environment;
6. Lifestyle Ambassador and partner business.

## 2. Implemented Changes

The public `/events/` route was kept for URL stability, but its visible navigation label was changed to:

```text
Возможности
```

The page was rebuilt as an accordion instead of a plain event page. Each scenario now explains:

1. the user's possible need;
2. how Travel Advantage / MWR Life can be relevant;
3. how Mira should continue the conversation.

The main menu was updated across public pages so the route is easier to understand as a broad opportunity map, not only an event calendar.

## 3. Mira Integration

Mira knowledge was extended with the public scenario page:

```text
https://travelgtc.com/events/
```

Mira should use this page when the user is not yet sure what they need or when the user mentions:

1. family trips;
2. friends;
3. active travel;
4. yoga, qigong, wellness, retreat or sport;
5. a group, students, clients or community;
6. events, meetings or presentations;
7. network development, recommendations, partner role or Ambassador.

For business-oriented users, Mira should present Travel Advantage and MWR Life as a product-backed partner model based on trust, recommendations, useful travel scenarios and ready infrastructure. The language must stay compliant and must not use aggressive anti-skeptic or unrealistic-income wording.

## 4. Safety Boundary

The user-provided Google Doc note was treated as internal inspiration only. It was not published and was not added as an external source because it contained private operational details and sensitive data.

Public and AI-facing statements remain grounded in:

1. TravelGTC positioning;
2. official MWR Life / Travel Advantage public pages;
3. existing TravelGTC disclosure and Membership knowledge rules.

## 5. Verification

Verification scope:

1. public navigation uses `Возможности`;
2. `/events/` contains six scenario accordion items;
3. the accordion is responsive and does not create horizontal overflow on mobile;
4. Mira knowledge and fallback logic include scenario routing.

