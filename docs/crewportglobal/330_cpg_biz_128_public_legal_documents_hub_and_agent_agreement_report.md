# CPG-BIZ-128 - Public legal documents hub and agent agreement publication report

- Project: CrewPortGlobal.com
- Date: 2026-06-10
- Status: Implemented
- Scope: public legal/document section, shipowner agent appointment agreement links

## 1. Business Decision

CrewPortGlobal public documents must be published in the portal legal/document section, not exposed as raw internal `/docs/crewportglobal/*.md` links.

The `/legal/` section is now treated as the public map of real platform standards, agreements, policies and operating rules. It should gradually move from general educational descriptions to the actual documents used by the CrewPortGlobal system.

Each formal document must have one canonical public full-text URL under `/legal/`. Other portal pages may show only a short description, document status/version and a link to the canonical legal URL. Public `index.md` links, duplicate full-text pages and working-page copies of legal text are not allowed.

## 2. Implemented Result

The public legal section now includes:

1. A new `/legal/` landing page for documents and platform standards.
2. A new `/legal/agent-agreement/` public page for the Shipowner-Agent Framework Agreement.
3. Documents navigation links for the legal hub and the agent agreement.
4. A redirect from the previous `/shipowners/agent-agreement/` preview route to the public legal document.
5. The shipowner candidate workspace now opens the full agreement template through `/legal/agent-agreement/`.

## 3. Published Document Model

The new legal hub presents current and upcoming documents as working system documents:

- platform terms with participants;
- shipowner service terms;
- seafarer candidate agreement;
- shipowner-agent framework agreement;
- no-recruitment-fees policy;
- recruitment and matching policy;
- verification policy;
- privacy policy;
- complaint handling procedure.

Planned publication slots remain visible for:

- portal agreements with participants;
- agent agreement with seafarer;
- seafarer and shipowner employment contract;
- commercial orders, service orders and addenda.

## 4. Shipowner-Agent Agreement Publication

The public agreement page records the current platform standard:

- agreement is concluded inside CrewPortGlobal as an accession framework;
- shipowner sends an in-system offer;
- agent accepts the published framework terms;
- authority, assignment and notification events are recorded by the platform;
- only one active managing agent may control the same shipowner object at a time;
- commercial terms are agreed separately through Service Order, commercial addendum or approved price-basis record;
- the represented participant keeps governance rights to see important events and revoke or replace the representative through controlled procedures.

## 5. Verification

Focused checks were completed:

```text
git diff --check
test -f projects/crewportglobal/public/legal/index.html
test -f projects/crewportglobal/public/legal/agent-agreement/index.html
test -f projects/crewportglobal/public/shipowners/agent-agreement/index.html
rg -n "docs/crewportglobal/324|href=\"/shipowners/agent-agreement/\"|window\.location\.replace\('/docs" projects/crewportglobal/public
php -S 127.0.0.1:8787 -t projects/crewportglobal/public
curl -I http://127.0.0.1:8787/legal/
curl -I http://127.0.0.1:8787/legal
curl -I http://127.0.0.1:8787/legal/agent-agreement/
curl -I http://127.0.0.1:8787/shipowners/agent-agreement/
```

HTTP route results:

```text
/legal/                         200 OK
/legal                          200 OK
/legal/agent-agreement/         200 OK
/shipowners/agent-agreement/    200 OK redirect page
```

Additional localization correction after visual review:

```text
2026-06-10
- added page-level English/Russian dictionaries for /legal/
- added page-level English/Russian dictionaries for /legal/agent-agreement/
- bound visible document text to data-i18n keys
- marked the CPG brand abbreviation as non-translatable on the new public legal pages
- verified with Playwright using crewportglobal.language=ru
```

## 6. Next Relevant Work

The next document-publication slices should convert remaining real platform agreements into `/legal/` pages and connect generated agreement previews to those canonical public URLs.
