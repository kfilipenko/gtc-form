# GTC-STD-008 - Frontend Navigation And Page Publication Standard

- Owner: GTC INFORMATION TECHNOLOGY FZ-LLC
- Scope: public/application pages, navigation and visual publication
- Version: 0.1
- Date: 2026-07-08
- Status: Baseline standard extracted from CrewPortGlobal

## 1. Purpose

This standard defines how frontend pages should be created and published in GTC projects.

The goal is to keep pages useful, consistent and connected to real workflows.

## 2. Action-First Page Rule

A project page should lead to action or a controlled decision.

Avoid building:

1. long brochure pages with no next step;
2. duplicate explanatory pages;
3. landing pages when the user needs a working application;
4. disconnected cards that do not open real workspaces.

For operational tools, prioritize:

1. clear navigation;
2. compact workflow panels;
3. exact object links;
4. readable headings;
5. stable mobile layout;
6. task/action buttons.

## 3. Shared Header And Navigation

Use shared components for:

1. brand/header;
2. language selector;
3. theme selector;
4. account menu;
5. main navigation;
6. document navigation.

Do not manually edit the same top block on many pages when a shared runtime can own it.

## 4. Section Landing Pages

Top-level menu tabs should open understandable landing pages.

Each landing page should explain:

1. who the participant is;
2. what role they play;
3. what the section is for;
4. primary actions;
5. links to executable workspaces.

Dropdown entries may link to deeper workflows.

## 5. Documents Hub

Public documents should live in a clear documents/legal hub.

The hub should:

1. explain the document set;
2. group documents by participant or purpose;
3. show active documents;
4. show future documents only as roadmap items if needed;
5. link to canonical full-text URLs.

## 6. Translation And Language

Projects using multilingual UI should define:

1. authoritative source language;
2. page-local translation mechanism or catalog mechanism;
3. machine translation policy;
4. human-review requirements for sensitive content;
5. validation command.

Operational form data may require a separate data-language rule.

## 7. Visual Verification

For new or materially changed pages, verify:

1. desktop viewport;
2. mobile viewport;
3. active navigation state;
4. text contrast;
5. no overlapping UI;
6. main CTA/action visibility;
7. important links are clickable;
8. page is not blank after JS loads.

Screenshots should be used for user-facing design changes.

## 8. Text Fit And Contrast

Pages must not ship with:

1. unreadable headings;
2. low-contrast section titles;
3. text clipped inside buttons/cards;
4. overlapping dropdowns hiding primary content;
5. large text in compact panels where it cannot fit.

## 9. Acceptance Criteria

A frontend page is ready when:

1. it is linked from the right navigation or hub;
2. it has a clear purpose and primary action;
3. it uses shared header/navigation where available;
4. i18n coverage is valid if used;
5. desktop/mobile visual checks pass;
6. live URL works after publication.

## 10. Revision History

| Version | Date | Author | Changes |
|---|---|---|---|
| 0.1 | 2026-07-08 | GTC IT / AI Assistant | Initial frontend navigation and page publication standard |
