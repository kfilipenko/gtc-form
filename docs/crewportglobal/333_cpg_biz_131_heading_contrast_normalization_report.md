# CPG-BIZ-131 - Shared heading contrast normalization report

- Project: CrewPortGlobal.com
- Date: 2026-06-10
- Status: Implemented
- Scope: shared application CSS, team page theme variables, public/participant page typography contrast

## 1. Business Requirement

Participant and document pages must keep headings readable and visually strong on the dark CrewPortGlobal interface.

The issue was visible on section landing pages such as `/seafarers/`: secondary headings inherited low-contrast document styles and became difficult to read against the dark application surface.

## 2. Implemented Fix

Heading contrast is now normalized in the shared application stylesheet:

```text
projects/crewportglobal/public/assets/crewportglobal-app.css
```

The shared `.cpg-app-page` typography rules now explicitly set strong heading color and weight for:

- `h1`, `h2`, `h3`;
- `.app-title`, `.landing-title`, `.section-title`, `.details-title`, `.app-card-title`;
- headings inside `.prose` and `.doc-content` when rendered on application pages.

Dark theme app pages now use high-contrast heading color and brighter body copy so document prose styles cannot make participant-page headings unreadable.

## 3. Design Rule

Future page-specific CSS should not manually restyle the same heading hierarchy unless the page has a special visual requirement. The default heading contrast for application, participant and legal/document pages should come from the shared `.cpg-app-page` layer.

## 4. Verification

Focused checks were completed through the local public server:

```text
php -S 127.0.0.1:8787 -t projects/crewportglobal/public
Playwright computed-style check:
  /
  /seafarers/
  /shipowners/
  /agents/overview/
  /legal/
  /team/
  /shipowners/candidates/
```

Verification result in Russian dark-theme context:

```text
h1 color: rgb(244, 248, 251), font-weight: 900
h2 color: rgb(244, 248, 251), font-weight: 900
body/prose text color: rgb(201, 214, 226)
```

The standalone `/team/` page uses legacy inline variables, so it also received a dark-theme variable set and stronger title weight. This keeps the team landing page consistent with the shared header/menu environment without changing its login or task logic.
