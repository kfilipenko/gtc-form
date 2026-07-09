# TRAVELGTC-QA-001 - Playwright Responsive Testing Setup

- Project: TravelGTC
- Owner: Project Owner
- Source instruction: Project Owner requested eliminating the lack of browser-based screenshot testing and checking the existing setup before installation
- Document type: Task
- Version: 0.1
- Date: 2026-07-09
- Status: Implemented

## 1. Purpose

Enable full browser-based responsive testing for TravelGTC.

The previous WEB-005 report noted that mobile verification was limited because a browser engine was not available through the checked global commands. This task verifies the actual environment and creates a repeatable TravelGTC-specific Playwright test entry point.

## 2. Findings Before Installation

Pre-installation checks found:

1. global `chromium`, `google-chrome`, `firefox` and `playwright` commands are not available in `PATH`;
2. local npm Playwright dependencies already exist in the repository;
3. Chromium browser binaries already exist in `~/.cache/ms-playwright`;
4. therefore no system browser installation was required.

The correct command is:

```bash
npx playwright ...
```

## 3. Scope

This task includes:

1. add a TravelGTC-specific Playwright config;
2. add a TravelGTC responsive test suite;
3. add an npm script for repeatable execution;
4. save desktop, tablet and mobile screenshots as ignored project artifacts;
5. run the new test suite and inspect generated screenshots;
6. update TravelGTC documentation and memory.

## 4. Acceptance Criteria

The task is complete when:

1. `npm run test:travelgtc` runs successfully;
2. home page screenshots are generated for desktop, tablet and mobile;
3. all public routes pass mobile viewport overflow checks;
4. mobile menu opens in a browser test;
5. generated screenshot artifacts are not committed;
6. repository changes are committed.

## 5. Verification Plan

```bash
npx playwright --version
npx playwright install --dry-run chromium
npm run test:travelgtc
git diff --check
```

## 6. Revision History

| Version | Date | Author | Changes |
|---|---|---|---|
| 0.1 | 2026-07-09 | GTC IT / AI Assistant | Initial task |
