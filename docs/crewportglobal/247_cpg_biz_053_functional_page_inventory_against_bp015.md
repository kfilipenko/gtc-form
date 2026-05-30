# CPG-BIZ-053 - Functional Page Inventory Against BP-015

- Project: CrewPortGlobal.com
- Company: GTC INFORMATION TECHNOLOGY FZ-LLC
- Stage: Stage 1 - Digital Maritime Crew Data and Matching Platform
- Source task: Project Owner approval after BP-015 commercial operating cycle
- Version: 1.0
- Date: 2026-05-30
- Document type: Page inventory and implementation planning report
- Status: Prepared for Project Owner review

## 1. Purpose

This document maps the current CrewPortGlobal portal pages to BP-015 commercial operating cycle.

The goal is to stop expanding the portal as an explanatory website and reorganize it as a functional maritime crewing platform:

```text
seafarer registers and updates availability
employer registers demand, vessel and crew request
team verifies, matches, presents, confirms embarkation and billing evidence
```

This document is an inventory and planning report only. It does not approve code, UI, DB, migration or runtime changes by itself.

## 2. Controlling Principle

Each active page must have at least one clear process function:

1. attract a seafarer or employer to a registration/action;
2. collect structured data needed for automated matching;
3. show real contact-free platform data;
4. provide a working cabinet or team operation;
5. record consent, legal terms or audit evidence;
6. support billing, service evidence or repeat marketing.

If a page only explains what crewing is, repeats other pages or does not create a record, task, evidence or action, it must be merged, shortened, moved to Trust Center or removed from the normal user route.

## 3. BP-015 Page Alignment Model

The target site model follows the BP-015 operating cycle:

```text
marketing attraction
-> registration
-> profile / company / vessel / crew request completion
-> verification
-> matching
-> shortlist and presentation
-> employer decision
-> embarkation confirmation
-> monthly service evidence
-> billing
-> retention and repeat voyage/request
```

The public website should lead users into the functional cycle, not educate professional seafarers and shipowners with long explanatory pages.

## 4. Current Page Inventory

The inventory was prepared from the current `projects/crewportglobal/public/**/index.html` route set.

| Route | Current purpose | BP-015 stage | User role | Decision | Implementation note |
|---|---|---|---|---|---|
| `/` | Main public entry with live counts and role CTAs | Marketing attraction, public trust | Public, investor, seafarer, employer | Keep and strengthen | Add compact BP-015 process infographic; keep real contact-free counters and role actions above long explanations. |
| `/about/` | Project scope / positioning explanation | Public trust | Public | Merge / remove from main menu | Move only essential positioning to home or Trust Center. Avoid standalone descriptive page unless needed for legal/compliance reference. |
| `/for-seafarers/` | Seafarer-facing explanation and CTA | Seafarer marketing, registration | Seafarer | Keep, make compact | Convert to action page: register, complete profile, update availability, view vacancies. Remove general crewing explanation. |
| `/for-shipowners/` | Employer-facing explanation and CTA | Employer marketing, service inquiry | Employer, shipowner, vessel operator | Keep, make compact | Convert to action page: register company, add vessel, post crew request, review service model. |
| `/how-it-works/` | Long process explanation | Public trust / process overview | Public | Merge into home as infographic | Do not keep as a long standalone route in the main journey. Replace with compact BP-015 circular process infographic on `/`; later redirect or keep as support-only page if needed. |
| `/language.html` | Language fallback page | Technical support | Public | Keep as fallback only | Do not show in main menu while header language selector exists. |
| `/vacancies/` | Public vacancy information and registry preview | Employer demand visibility, seafarer acquisition | Seafarer, public | Keep as functional board | Reduce explanatory copy; show real reviewed vacancies/requests with safe columns, filters and CTA to profile/apply flow. |
| `/vacancies/detail/` | Vacancy detail route | Crew request detail | Seafarer | Keep as object route | Do not show in main menu. It should open from vacancy rows and preserve safe public visibility. |
| `/create-profile/` | Seafarer profile workspace | Seafarer profile completion, consent, document readiness | Seafarer | Keep as primary functional page | Continue as main seafarer form, save/completeness gate, upload, consent and future document-first AI extraction workspace. |
| `/post-vacancy/` | Employer company, vessel and crew request workspace | Employer registration, vessel context, crew request intake | Employer | Keep as primary functional page | Continue standard form lifecycle rollout and matching-first mandatory fields. |
| `/register/` | Account registration entry | Person registration | Public | Keep | Keep as unified account creation entry. It should route users to role-specific functional workspaces after registration. |
| `/register/confirm/` | Email confirmation | Registration control | Registered user | Keep technical route | No main-menu item. |
| `/register/next/` | Post-registration next step | Registration handoff | Registered user | Keep temporarily | Later fold into cabinet or role selector if it duplicates other pages. |
| `/register/authorization/` | Authorization request selector | Authority / role authorization | Authenticated user | Keep technical/protected route | No public menu entry. |
| `/register/authorization/selected/` | Selected authorization path | Authority / role authorization | Authenticated user | Keep technical/protected route | No public menu entry. |
| `/register/authorization/seafarer-specialist/` | Seafarer/specialist authorization | Authority / role authorization | Authenticated user | Keep technical/protected route | No public menu entry. |
| `/register/authorization/buyer-employer/` | Buyer/employer authorization | Authority / role authorization | Authenticated user | Keep technical/protected route | No public menu entry. |
| `/cabinet/` | Personal cabinet | User-specific tasks and records | Authenticated user | Keep | Target home for user tasks, corrections, applications and lifecycle state. |
| `/team/` | Team computed tasks | Internal operations | Team | Keep protected | Keep as internal entry. Not a public user menu item except for authorized team users. |
| `/team/documents/` | Protected document review | Evidence review | Team | Keep protected | Route from team tasks and documents menu for authorized users only. |
| `/team/matching/` | Request-supply comparison | Matching and blocker review | Team | Keep protected | Route from matching tasks and crew request workspaces. |
| `/team/registry/` | Safe registry detail | Internal demo / control registry | Team, investor demo under control | Keep protected | Use for internal/investor-safe rows without contact data. |
| `/team/shortlists/` | Shortlist history and drill-down | Internal shortlist control | Team | Keep protected | Route from team tasks and demand workspaces. |
| `/verify/` | Transitional operator workbench | Operator review / legacy workbench | Team | Keep until replaced | Continue reducing to object-specific review workspace; do not expose as public page. |
| `/admin/access/` | Access control console | Access administration | Project Owner / admin | Keep protected | Admin-only route, not public navigation. |
| `/legal/terms/` | Platform terms | Legal / Trust Center | Public | Keep | Place under Documents / Trust Center. |
| `/legal/privacy/` | Privacy policy | Legal / Trust Center | Public | Keep | Place under Documents / Trust Center. |
| `/legal/no-recruitment-fees/` | No-fee policy | Legal / Trust Center | Public | Keep | Keep visible enough for seafarer trust and compliance. |
| `/legal/seafarer-candidate-agreement/` | Seafarer agreement | Legal / Trust Center | Seafarer | Keep | Link from final consent block in `/create-profile/`. |
| `/legal/shipowner-service-terms/` | Shipowner service terms | Legal / Trust Center | Employer | Keep | Link from employer registration and service package flow. |
| `/legal/complaints/` | Complaint handling | Legal / Trust Center | Public | Keep | Link from footer/documents and consent flow. |
| `/legal/recruitment-and-matching-policy/` | Recruitment and matching policy | Legal / Trust Center | Public, audit | Keep | Keep as Trust Center policy, not marketing filler. |
| `/legal/verification-policy/` | Verification policy | Legal / Trust Center | Public, audit | Keep | Keep as Trust Center policy, not marketing filler. |

## 5. Decision On `/how-it-works/`

Project Owner decision:

```text
/how-it-works/ must be reduced to a compact BP-015 scheme or embedded into the home page.
```

Implementation direction:

1. remove `/how-it-works/` from the main navigation;
2. add a compact circular BP-015 infographic to `/`;
3. avoid long explanatory text about crewing;
4. keep only process labels that lead to actions:
   - Register;
   - Complete profile / request;
   - Verify;
   - Match;
   - Present;
   - Confirm embarkation;
   - Bill service evidence;
   - Return to next voyage/request.
5. after visual review, either retire `/how-it-works/` or make it a short support route that points back to the home infographic.

The preferred Stage 1 direction is to retire it from the normal route and let `/` carry the infographic.

## 6. Target Public Menu

The target public menu should be short and role-based:

```text
Home
Seafarers
Employers
Vacancies
Documents
Login / Cabinet
Team
```

Notes:

1. `Team` appears only for authorized team/admin users or as a protected entry.
2. Legal pages remain inside `Documents / Trust Center`.
3. Registration and role-specific workspaces are reached through action buttons, not by listing every technical route in the top menu.
4. During audit only, a temporary full site-map menu may be useful for Project Owner review. It should not become the permanent public navigation.

## 7. Target Page Types

| Page type | Example | Required behavior |
|---|---|---|
| Public entry | `/` | Real platform indicators, compact BP-015 infographic, role actions. |
| Role action page | `/for-seafarers/`, `/for-shipowners/` | Minimal explanation, direct route to registration/workspace. |
| Functional workspace | `/create-profile/`, `/post-vacancy/` | Save, completeness, upload, consent and structured matching data. |
| Object detail | `/vacancies/detail/`, `/team/matching/` | Open from object link; not top-menu filler. |
| Protected internal operation | `/team/`, `/verify/`, `/admin/access/` | Authenticated role/group access and computed task context. |
| Trust document | `/legal/...` | Stable legal/compliance content; not repeated on marketing pages. |
| Technical transition | `/register/confirm/`, `/register/next/`, authorization routes | Used by flows; hidden from public navigation. |

## 8. Implementation Sequence After Approval

### Phase 1 - Home and `/how-it-works/`

1. Add compact BP-015 circular infographic to `/`.
2. Remove or de-emphasize long explanatory blocks.
3. Remove `/how-it-works/` from main navigation.
4. Replace `/how-it-works/` content with short redirect/support wording or retire route after Project Owner approval.

### Phase 2 - Public Navigation

1. Replace temporary broad site-map menu with target role-based menu.
2. Keep legal pages under `Documents`.
3. Keep team/admin pages protected and visible only to authorized users where possible.
4. Ensure no removed route leaves broken links.

### Phase 3 - Role Pages

1. Compact `/for-seafarers/` into actions: register, complete profile, upload documents, update availability, view vacancies.
2. Compact `/for-shipowners/` into actions: register company, add vessel, post crew request, review service package.
3. Remove explanations that duplicate BP/legal documents.

### Phase 4 - Vacancy Page

1. Convert `/vacancies/` from explanation page into a functional safe vacancy board.
2. Preserve no automatic employment promise and no contact exposure.
3. Show reviewed/public-safe records only.

### Phase 5 - Registration Transition Routes

1. Keep technical registration and authorization pages only where needed by the flow.
2. Move post-registration decisions toward cabinet/role workspaces over time.
3. Remove duplicate onboarding consent pages from active routes.

### Phase 6 - Verification

1. Test all public menu links.
2. Test all role CTA links.
3. Test removed/retired routes for safe behavior.
4. Verify desktop and mobile layouts.
5. Update documentation with implementation results.

## 9. Acceptance Criteria For The Next Code Stage

The next code stage can be accepted only when:

1. `/` contains a compact BP-015 infographic and real safe platform indicators;
2. `/how-it-works/` is no longer a long explanatory page in the normal user journey;
3. the top menu is role-based and does not expose every technical route as a public page;
4. legal pages remain accessible through Documents / Trust Center;
5. functional routes remain reachable through clear actions;
6. all existing internal team/admin routes remain protected;
7. no public link points to a removed or broken route;
8. desktop and mobile screenshots confirm compact layout without large empty blocks;
9. no DB, migration or backend behavior is changed unless separately approved.

## 10. Next Stage

After Project Owner approval of this inventory, the next implementation stage should be:

```text
CPG-BIZ-054 - Implement functional public navigation and homepage BP-015 infographic
```

Recommended first code slice:

1. update the shared public navigation;
2. add the BP-015 infographic to the home page;
3. remove `/how-it-works/` from visible public navigation;
4. shorten or retire `/how-it-works/`;
5. run link and visual checks.

