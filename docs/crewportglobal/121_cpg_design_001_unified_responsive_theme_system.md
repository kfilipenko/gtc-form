# CrewPortGlobal — CPG-DESIGN-001 Unified Responsive Theme System

- Project: CrewPortGlobal.com
- Date: 2026-05-18
- Status: Design baseline approved for implementation planning
- Scope: public site, document pages, user cabinet, team cabinet, admin console and functional application pages

## 1. Purpose

This document defines the new unified CrewPortGlobal visual design direction.

CrewPortGlobal must feel like one professional maritime application, not a set of unrelated public pages, documents and work portals.

The site will use one design system with two themes:

```text
Dark Maritime — deep blue primary theme
Light Work — light operational theme
```

Both themes must share the same layout, components, typography scale, spacing system, interaction states and responsive behavior.

## 2. Design Decision

The previous temporary split is no longer the target model:

```text
functional pages = light
document pages = dark blue
```

The new target model is:

```text
one CrewPortGlobal design system
two switchable themes
same components everywhere
same compact professional layout everywhere
same adaptive behavior everywhere
```

Dark Maritime should become the primary brand theme because the current dark-blue document pages feel more distinctive, maritime and trustworthy.

Light Work remains available for users who prefer light operational screens or work in bright environments.

## 3. Product Tone

The visual tone must be:

```text
professional
compact
maritime
trust-focused
data-oriented
operational
clear
serious
international
```

The design must not feel like:

```text
a book
a marketing landing page
a decorative startup template
a set of oversized cards
a legal document archive
a prototype with large empty blocks
```

CrewPortGlobal is becoming a working platform. The interface should look ready for repeated daily use by:

```text
seafarers
employer-side clients
shipowners
crewing managers
verification team
support team
reviewers
billing operators
Project Owner
```

## 4. Theme Model

### 4.1 Dark Maritime

Dark Maritime is the primary theme.

Suggested palette direction:

```text
canvas: deep navy, not pure black
surface: controlled blue-black panels
surface elevated: slightly lighter navy
line: visible blue-grey border
text primary: near-white with strong contrast
text secondary: muted cool grey-blue
accent primary: teal/cyan for verified, active and navigational states
accent action: restrained orange/amber for primary actions only
success: green
warning: amber
danger: red
info: blue/cyan
```

The interface must not become a one-color dark-blue page. It needs enough neutral surface separation, teal actions, restrained amber highlights and clear status colors.

### 4.2 Light Work

Light Work is the alternate operational theme.

Suggested palette direction:

```text
canvas: cool off-white
surface: white
surface elevated: very light blue-grey
line: clear cool grey
text primary: deep navy
text secondary: blue-grey
accent primary: teal
accent action: orange/amber
status colors: same semantic colors as Dark Maritime
```

Light Work should not be a separate design. It is the same system with different tokens.

## 5. Theme Switching

The theme switcher should be available in the account/header area.

Expected behavior:

```text
Auto / System
Dark
Light
```

User preference should be persisted locally first:

```text
localStorage
```

Future account-level persistence can be added later after profile settings mature.

Rules:

```text
public visitors can switch theme locally;
authenticated users can switch theme locally;
admin/team/user cabinets use the same switch;
theme choice must not affect permissions, visibility or workflow state.
```

## 6. Typography

The current headline scale is too large for a professional application. The new scale must be smaller and more disciplined.

Recommended scale:

```text
body: 15-16px
small metadata: 12-13px
eyebrow / label: 11-12px uppercase
card title: 17-20px
section title: 22-26px
application page h1: 28-34px
public hero h1: 36-44px desktop, 30-34px mobile
document h1: 32-40px desktop, 28-32px mobile
```

Rules:

```text
do not scale font-size directly with viewport width;
do not use negative letter spacing;
avoid oversized all-page hero typography inside app screens;
compact dashboards should use smaller headings;
forms should prioritize label/input readability, not dramatic headlines.
```

## 7. Layout Density

The layout must become more compact.

Current issues to correct:

```text
too much empty horizontal space;
large card padding;
oversized hero blocks;
too many full-height panels;
forms look sparse;
headings dominate operational content;
mobile/tablet behavior needs stronger rules.
```

Target density:

```text
desktop content max width: 1180-1280px depending on page type;
document reading width: 860-980px;
dashboard width: 1180-1320px;
card radius: 8-12px for operational UI;
document panels may use 12-16px;
standard card padding: 16-20px desktop, 14-16px mobile;
section gap: 16-24px;
form field gap: 12-16px;
toolbar height: compact, predictable and stable.
```

Nested cards should be avoided. A page section should not look like a card containing more cards unless the inner cards are repeated items or controls.

## 8. Responsive Requirements

The entire site must be adaptive for:

```text
mobile
tablet
desktop
wide desktop
```

### 8.1 Mobile

Suggested breakpoint:

```text
up to 640px
```

Rules:

```text
single-column layout;
compact header;
navigation collapsed into menu/dropdown;
theme switch remains reachable;
buttons wrap but keep readable size;
forms use full-width fields;
cards default collapsed except primary task card;
tables become stacked lists;
no horizontal scrolling for normal content;
text must not overflow buttons, cards or panels.
```

### 8.2 Tablet

Suggested breakpoint:

```text
641px to 1024px
```

Rules:

```text
one or two columns depending on content;
dashboard cards may use 2-column summary grid;
forms may use 2 columns only when fields remain readable;
sidebars should become top tabs or collapsible panels;
document pages keep comfortable reading width.
```

### 8.3 Desktop

Suggested breakpoint:

```text
1025px and above
```

Rules:

```text
use constrained width;
avoid giant left/right empty areas;
dashboards can use 12-column grid;
primary work area should stay central and scannable;
right-side support panels are allowed only when they add current task context.
```

### 8.4 Wide Desktop

Suggested breakpoint:

```text
1440px and above
```

Rules:

```text
do not stretch text blocks endlessly;
use max-width and grid constraints;
wide space can show secondary panels, queues or summaries;
do not enlarge fonts just because the viewport is wide.
```

## 9. Component Standards

### 9.1 Header

The header should include:

```text
brand
primary navigation
account menu
theme switch
language selector
```

It should be compact and stable across themes.

### 9.2 Navigation

Public navigation remains simple:

```text
Home
Vacancies
Documents
Account / Login
```

After authentication, navigation is generated from:

```text
confirmed capabilities
group membership
scoped visibility
available service areas
```

The design must not expose functional links to users who do not have the right context.

### 9.3 Cards

Standard cabinet presentation:

```text
first card = My tasks / Мои задачи
My tasks is open by default
all other cards are collapsed by default
cards open by clicking the card header
```

This standard applies to:

```text
personal cabinet
team cabinet
admin console
operator queues
document review
future service-area pages
```

### 9.4 Forms

Forms should be compact and readable:

```text
labels above fields;
clear required/optional state;
consistent height;
visible focus;
clear validation message;
short helper text only where useful;
document upload sections placed near relevant authorization request fields.
```

### 9.5 Buttons

Rules:

```text
primary action: one per local task area;
secondary action: quieter outline or neutral fill;
danger action: red and never visually similar to primary;
icon buttons should use familiar icons where available;
button text must fit at mobile widths.
```

### 9.6 Tables And Queues

Team and operator pages should prioritize scan speed:

```text
compact rows;
clear status badges;
filter bar;
sortable columns later;
row details as expandable panel;
mobile representation as stacked record cards.
```

## 10. Accessibility And Readability

Minimum requirements:

```text
strong text contrast in both themes;
visible focus state;
keyboard-operable menus and collapsible cards;
no text hidden by low-contrast placeholder styling;
no critical information encoded by color alone;
status badges include text labels;
forms readable at 320px width.
```

Dark theme must be checked carefully because the current admin/login contrast issue showed that pale text on white or low-contrast surfaces can make pages unusable.

## 11. Page Type Rules

### 11.1 Public Pages

Public pages should be informational and compact.

They should not show old registration-service shortcuts. Their job is:

```text
explain the platform;
explain trust boundaries;
send the user to Account / Login;
show public reviewed information only.
```

### 11.2 Document Pages

Document pages should keep the dark maritime authority look but become part of the same theme system.

Rules:

```text
comfortable reading width;
clear document metadata;
compact document navigation;
no functional service buttons except Account / Login or permitted public links;
same theme tokens as the application.
```

### 11.3 User Cabinet

The user cabinet must be task-first:

```text
My tasks open first;
documents/status/services collapsed;
clear next action;
compact profile summary;
theme switch visible in account/header area.
```

### 11.4 Team Cabinet

The team cabinet must be work-queue-first:

```text
assigned tasks;
my clients;
document review queue;
filters;
SLA colors;
compact record rows;
restricted visibility by relationship and permission.
```

### 11.5 Admin Console

Admin pages must be compact, high-contrast and cautious:

```text
permissions and groups visible;
audit collapsed by default;
dangerous actions visually separated;
no oversized empty surfaces.
```

## 12. Implementation Phases

### Phase 1 — Design Tokens

Create shared CSS variables:

```text
color tokens
surface tokens
border tokens
text tokens
status tokens
spacing tokens
radius tokens
shadow tokens
typography tokens
```

### Phase 2 — Theme Switcher

Add theme switching in the shared header/account area:

```text
Auto / Dark / Light
```

Persist preference in localStorage.

### Phase 3 — Functional Pages Compact Pass

Apply compact layout and typography to:

```text
/register/
/register/authorization/
/register/authorization/selected/
/cabinet/
/create-profile/
/post-vacancy/
/team/
/team/documents/
/admin/access/
/verify/
```

### Phase 4 — Document Pages Token Alignment

Keep current dark-blue look, but move it to shared tokens.

### Phase 5 — Responsive QA

Verify:

```text
mobile 360px
mobile 390px
tablet 768px
desktop 1366px
wide desktop 1440px+
```

## 13. Acceptance Criteria

The redesign is acceptable only when:

```text
all page types use the same theme system;
Dark Maritime and Light Work both work;
theme preference persists;
headings are smaller and proportional;
cards are compact;
mobile layout has no horizontal overflow;
forms remain readable;
document pages still feel maritime/trust-focused;
cabinet/team/admin pages feel like one application;
navigation stays consistent;
old public functional shortcuts are not reintroduced.
```

## 14. Design Recommendation

Proceed with Dark Maritime as the primary visual identity and Light Work as the secondary user-selectable theme.

The immediate implementation should not redesign one page at a time with one-off CSS. It should first introduce shared tokens and compact component rules, then apply them to page groups.

This avoids creating a third design while trying to fix the first two.
