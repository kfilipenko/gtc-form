# CrewPortGlobal — CPG-I1-001 Multilingual Frontend Shell Plan

- Project: CrewPortGlobal
- Document owner: GTC INFORMATION TECHNOLOGY FZ-LLC
- Version: 0.2
- Status: Frontend planning baseline
- Classification: Internal
- Effective date: 2026-05-12
- Review date: 2026-06-12
- Related issue: GitHub issue #3 — CPG-I1-001

## 1. Purpose

This document defines the planning-only multilingual frontend shell baseline for CPG-I1-001.

Its purpose is to describe how multilingual support should be planned into the first CrewPortGlobal application shell task without authorizing runtime UI implementation.

## 2. Scope

This document covers planning only for:

1. language coverage priorities;
2. language-selector expectations;
3. translation-dictionary strategy;
4. human-review requirements for sensitive content;
5. multilingual shell presentation boundaries.

This document does not authorize implementation execution.

## 3. Approved Baseline

The planning baseline for this document is:

1. CrewPortGlobal website application runtime: GTC1;
2. CrewPortGlobal SQL database locality: GTC1;
3. OpenClaw runtime / agent platform: GTC-AGENT;
4. OpenClaw usage: assisted operator support only, through controlled procedures.

## 4. Hard Constraints

The following constraints remain unchanged:

1. no runtime UI code may be written;
2. no routes may be implemented;
3. no components may be implemented;
4. no stylesheets may be created;
5. no scripts may be created;
6. no package or dependency files may be created;
7. no backend or API handlers may be created;
8. no SQL may be executed;
9. no database may be touched;
10. no auth changes may be made;
11. no Stripe changes may be made;
12. nginx must not be changed;
13. no OpenClaw configuration changes may be made;
14. no deployment may be performed.

Implementation execution remains not approved.

## 5. Planning Inputs

This multilingual frontend shell plan builds on:

- `docs/crewportglobal/48_architecture_decision_gtc1_app_gtc_agent_openclaw.md`
- `docs/crewportglobal/51_cpg_i1_001_application_shell_implementation_plan.md`
- `docs/crewportglobal/54_cpg_i1_001_frontend_shell_placeholder_plan.md`
- `docs/crewportglobal/55_cpg_i1_001_frontend_shell_placeholder_owner_review.md`
- `projects/crewportglobal/public/`
- GitHub issue #3 — `CPG-I1-001 — Website application shell planning`

## 6. Multilingual Planning Objective

Multilingual support is part of the first application shell planning task.

The planning objective is to ensure that the future frontend shell can present the seafarer-only Increment 1 prototype in a controlled multilingual form while keeping English as the canonical source language for initial content management.

## 7. Language Coverage Model

### 7.1 Mandatory Languages

The first multilingual planning set must include:

1. English;
2. Русский;
3. Português;
4. Українська.

### 7.2 Additional Languages

The additional planned language set is:

1. العربية;
2. Filipino;
3. हिन्दी;
4. Indonesian;
5. Español;
6. Français;
7. Türkçe;
8. Ελληνικά.

## 8. Canonical Source Language Rule

English must remain the canonical source language for the initial multilingual shell planning baseline.

Planning implications:

1. first-copy drafting should begin from English source text;
2. other language variants should be treated as controlled translated variants;
3. future shell content planning should not assume independent authoring drift across languages.

## 9. Language Selector Planning

The future frontend shell should include a visible language-selection menu.

The language selector must be located on the main page in the top-right corner, at the far-right edge of the header or navigation area.

It must be planned as a global website-level control rather than as a local registration-form-only control.

The planned language selector must:

1. show the language name in its own language where practical;
2. include a flag as a visual marker;
3. avoid relying on the flag as the only language identifier;
4. stay usable for both desktop and mobile shell planning;
5. remain understandable for users entering the shell in any supported language;
6. keep the current language clearly visible to the user.

## 10. Flag Usage Rule

Flags are planning-level visual markers only.

They must not be treated as:

1. the only language identifier;
2. a substitute for language names;
3. a sufficient accessibility label;
4. a replacement for structured language metadata.

## 11. Translation Dictionary Strategy

The multilingual shell planning baseline should use translation dictionaries rather than external translation APIs at this stage.

Planning requirements:

1. source strings should be organized into controlled dictionaries;
2. dictionary keys should support shell labels, notices, navigation text and state descriptions;
3. the strategy must remain project-local and reviewable;
4. external translation API dependency is not approved at this step.

## 12. Human Review Requirement for Sensitive Text

Human review remains mandatory for the following multilingual content classes:

1. legal text;
2. consent text;
3. no-fee notices;
4. seafarer-facing onboarding text.

This means translated variants for those content classes must not be treated as self-approved or final without human review.

## 13. Multilingual Shell Content Zones

The multilingual planning baseline should cover the following shell-visible content zones:

1. language selector label and menu entries;
2. shell entry notices;
3. start-page guidance;
4. blocked, incomplete and unavailable state explanations;
5. pending human-review explanation;
6. privacy, consent and no-fee notices.

The selected language must control the display language for the whole website or application shell rather than only the current registration section.

For the first static multilingual prototype, this means:

1. the language selector remains in the header at the top-right far-right position;
2. the selector opens the full list of available languages;
3. changing the language updates all translatable UI text on the visible page or shell;
4. the selected language should be persisted locally for the prototype;
5. page reload should preserve the selected language;
6. future pages should inherit the same language state and translation-dictionary approach.

## 14. Accessibility and Script Planning

The multilingual shell should be planned with accessibility and script variation in mind from the start.

Planning expectations:

1. language names must remain readable without flag-only interpretation;
2. translated labels should support screen-reader clarity;
3. long text expansion must be considered in future layout planning;
4. right-to-left language handling must be considered for Arabic;
5. non-Latin scripts must be treated as first-class supported content.

## 15. OpenClaw Boundary

OpenClaw remains outside the frontend shell runtime surface.

The multilingual shell must not be planned as depending on OpenClaw for:

1. language switching;
2. live translation;
3. legal-text approval;
4. consent-text approval;
5. autonomous content publication.

## 16. Planning Deliverables from This Slice

This document defines the expected planning outputs for the multilingual shell slice:

1. mandatory and additional language set;
2. language selector rules;
3. flag-usage rule;
4. canonical English-source rule;
5. translation-dictionary planning strategy;
6. human-review rule for sensitive translated content;
7. global header placement rule for the language selector;
8. whole-shell language-state and local-persistence expectations for the first static prototype.

These are planning outputs only and are not implementation deliverables.

## 17. Explicit Non-Goals

This document does not authorize or define:

1. runtime UI code;
2. implemented language switching;
3. routes or components;
4. stylesheets or scripts;
5. package or dependency files;
6. backend or API handlers;
7. SQL or database changes;
8. auth changes;
9. Stripe changes;
10. nginx changes;
11. OpenClaw configuration changes;
12. deployment.

## 18. Final Control Statement

Multilingual frontend shell plan is ready for project-owner review. Implementation execution remains not approved.
