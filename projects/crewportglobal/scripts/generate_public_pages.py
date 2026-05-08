from __future__ import annotations

from pathlib import Path
from typing import Final
import re

import markdown


SITE_ORIGIN: Final = "https://crewportglobal.com"
PROJECT_ROOT: Final = Path(__file__).resolve().parent.parent
PUBLIC_ROOT: Final = PROJECT_ROOT / "public"
CSS_PATH: Final = PUBLIC_ROOT / "assets" / "crewportglobal-docs.css"

DOCS: Final = [
    {
        "slug": "about",
        "category": "Positioning",
        "nav_label": "Project Scope",
        "summary": "Defines what CrewPortGlobal is, what it is not, and how the Stage 1 commercial model is framed.",
    },
    {
        "slug": "how-it-works",
        "category": "Overview",
        "nav_label": "How It Works",
        "summary": "Explains the initial workflow for seafarers, shipowners and human-reviewed shortlist preparation.",
    },
    {
        "slug": "for-shipowners",
        "category": "Audience",
        "nav_label": "For Shipowners",
        "summary": "Structured intake, candidate readiness review and compliance-oriented shortlist support for maritime employers.",
    },
    {
        "slug": "for-seafarers",
        "category": "Audience",
        "nav_label": "For Seafarers",
        "summary": "Profile, documents, complaint handling and no-fee access expectations for seafarers.",
    },
    {
        "slug": "legal/no-recruitment-fees",
        "category": "Policy",
        "nav_label": "No Recruitment Fees",
        "summary": "Core trust rule: seafarers must not be charged recruitment, placement or employment-access fees.",
    },
    {
        "slug": "legal/privacy",
        "category": "Legal",
        "nav_label": "Privacy",
        "summary": "Initial public privacy baseline for profile, document, operational and compliance data.",
    },
    {
      "slug": "legal/seafarer-candidate-agreement",
      "category": "Trust Center",
      "nav_label": "Seafarer Agreement",
      "summary": "No-fee candidate agreement for seafarers covering profiles, documents, document readiness and human-reviewed matching workflows.",
      "trust_note": "CrewPortGlobal does not charge seafarers recruitment, placement or employment fees.",
      "hero_ctas": [
        ("Create Seafarer Profile", f"{SITE_ORIGIN}/for-seafarers/", "primary"),
        ("Read No Recruitment Fees Policy", f"{SITE_ORIGIN}/legal/no-recruitment-fees/", "secondary"),
        ("Contact Support", f"{SITE_ORIGIN}/legal/complaints/", "secondary"),
      ],
      "summary_cards": [
        ("No recruitment fees", "No payment is required to create a profile, enter the matching pool or be considered for a relevant crew request."),
        ("Professional profile", "Candidates manage a structured maritime profile with rank, experience, documents and availability."),
        ("Document readiness", "Uploaded documents can be reviewed, flagged as incomplete, expired or verified for workflow support."),
        ("Human-reviewed workflow", "AI may assist with structuring and matching, but serious actions and shortlist submissions remain human-reviewed."),
      ],
      "acknowledgements": [
        "I understand that CrewPortGlobal does not charge seafarers recruitment, placement or employment fees.",
        "I understand that optional paid services are not required for job access.",
        "I understand that creating a profile does not guarantee employment.",
        "I confirm that the information and documents I submit are accurate and belong to me.",
        "I agree that my professional profile may be processed for crew matching purposes.",
        "I agree to the Privacy Policy, Complaint Handling Procedure and this Seafarer Candidate Agreement.",
      ],
      "related_links": [
        ("No Recruitment Fees Policy", f"{SITE_ORIGIN}/legal/no-recruitment-fees/"),
        ("Privacy Policy", f"{SITE_ORIGIN}/legal/privacy/"),
        ("Complaint Handling Procedure", f"{SITE_ORIGIN}/legal/complaints/"),
        ("Terms of Service", f"{SITE_ORIGIN}/legal/terms/"),
      ],
    },
    {
        "slug": "legal/terms",
        "category": "Legal",
        "nav_label": "Terms",
        "summary": "Core platform rules for the early public launch and AI-assisted workflow support.",
    },
    {
      "slug": "legal/shipowner-service-terms",
      "category": "B2B",
      "nav_label": "Shipowner Agreement",
      "summary": "Commercial and compliance baseline for shipowners, vessel operators, ship managers and crew managers using CrewPortGlobal.",
    },
    {
        "slug": "legal/complaints",
        "category": "Procedure",
        "nav_label": "Complaints",
        "summary": "Public complaint intake, expected evidence, priority handling and temporary contact channels.",
    },
]


def markdown_extensions() -> list[str]:
    return ["extra", "sane_lists"]


def clean_title(raw_title: str) -> str:
    return raw_title.replace("# ", "", 1).strip()


def extract_title(markdown_text: str) -> tuple[str, str]:
    lines = markdown_text.splitlines()
    if not lines or not lines[0].startswith("# "):
        raise ValueError("Each document must start with a level-1 heading")
    return clean_title(lines[0]), "\n".join(lines[1:]).strip()


def slug_to_clean_url(slug: str) -> str:
    return f"{SITE_ORIGIN}/{slug}/"


def slug_to_raw_url(slug: str) -> str:
    return f"{SITE_ORIGIN}/{slug}/index.md"


def first_section_title(html_body: str) -> str | None:
    match = re.search(r"<h2>(.*?)</h2>", html_body)
    return match.group(1) if match else None


def render_nav(current_slug: str) -> str:
    items = []
    for doc in DOCS:
        class_name = "nav-link is-active" if doc["slug"] == current_slug else "nav-link"
        items.append(
            f'<a class="{class_name}" href="{slug_to_clean_url(doc["slug"])}">{doc["nav_label"]}</a>'
        )
    return "\n".join(items)


def render_library(current_slug: str) -> str:
    cards = []
    for doc in DOCS:
        class_name = "library-link is-active" if doc["slug"] == current_slug else "library-link"
        cards.append(
            "\n".join(
                [
                    f'<a class="{class_name}" href="{slug_to_clean_url(doc["slug"])}">',
                    f'  <span class="library-type">{doc["category"]}</span>',
                    f'  <strong>{doc["nav_label"]}</strong>',
                    f'  <span>{doc["summary"]}</span>',
                    "</a>",
                ]
            )
        )
    return "\n".join(cards)


def render_hero_ctas(doc: dict[str, object]) -> str:
    items = []
    for label, href, style in doc.get("hero_ctas", []):
        items.append(f'<a class="button {style}" href="{href}">{label}</a>')
    items.append(f'<a class="button secondary" href="{slug_to_raw_url(doc["slug"])}">Canonical Markdown</a>')
    return "\n".join(items)


def render_summary_cards(doc: dict[str, object]) -> str:
    cards = doc.get("summary_cards", [])
    if not cards:
        return ""
    items = []
    for title, text in cards:
        items.append(
            "\n".join(
                [
                    '<article class="summary-card">',
                    f'  <h2>{title}</h2>',
                    f'  <p>{text}</p>',
                    "</article>",
                ]
            )
        )
    return "\n".join(
        [
            '<section class="summary-grid">',
            *items,
            "</section>",
        ]
    )


def render_acknowledgements(doc: dict[str, object]) -> str:
    items = doc.get("acknowledgements", [])
    if not items:
        return ""
    lines = [
        '<section class="acknowledgement-panel">',
        '  <p class="eyebrow">Onboarding acknowledgement</p>',
        '  <h2>Candidate confirmations for registration</h2>',
        '  <ul class="acknowledgement-list">',
    ]
    for item in items:
        lines.append(f'    <li class="acknowledgement-item">{item}</li>')
    lines.extend(["  </ul>", "</section>"])
    return "\n".join(lines)


def render_related_links(doc: dict[str, object]) -> str:
    items = doc.get("related_links", [])
    if not items:
        return ""
    links = []
    for label, href in items:
        links.append(f'<a class="related-link" href="{href}">{label}</a>')
    return "\n".join(
        [
            '<section class="card related-panel">',
            '  <p class="eyebrow">Related Trust Center links</p>',
            '  <h2>Next documents to review</h2>',
            '  <div class="related-links">',
            *links,
            '  </div>',
            '</section>',
        ]
    )


def render_page(doc: dict[str, object]) -> str:
    doc_dir = PUBLIC_ROOT / doc["slug"]
    markdown_text = (doc_dir / "index.md").read_text(encoding="utf-8")
    page_title, markdown_body = extract_title(markdown_text)
    html_body = markdown.markdown(markdown_body, extensions=markdown_extensions())
    lead_heading = first_section_title(html_body)
    asset_href = Path("/".join([".."] * len(doc_dir.relative_to(PUBLIC_ROOT).parts)) or ".")
    stylesheet_href = (asset_href / "assets" / CSS_PATH.name).as_posix()
    if stylesheet_href.startswith("./"):
        stylesheet_href = stylesheet_href[2:]

    title_suffix = f"{page_title} | CrewPortGlobal"
    intro = doc["summary"]
    key_focus = lead_heading or "Public document"
    trust_note = doc.get("trust_note", "")
    summary_cards = render_summary_cards(doc)
    acknowledgements = render_acknowledgements(doc)
    related_links = render_related_links(doc)

    return f"""<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>{title_suffix}</title>
  <meta name="description" content="{intro}">
  <link rel="canonical" href="{slug_to_clean_url(doc['slug'])}">
  <link rel="stylesheet" href="{stylesheet_href}">
</head>
<body class="doc-body">
  <div class="site-shell">
    <header class="site-header">
      <a class="brand" href="{SITE_ORIGIN}/">
        <span class="brand-mark">CPG</span>
        <span class="brand-copy">
          <strong>CrewPortGlobal</strong>
          <span>Maritime documentation and matching platform</span>
        </span>
      </a>
      <a class="home-link" href="{SITE_ORIGIN}/">Overview</a>
    </header>

    <nav class="site-nav" aria-label="Document navigation">
      {render_nav(doc['slug'])}
    </nav>

    <main class="doc-main">
      <section class="doc-hero card">
        <div>
          <p class="eyebrow">{doc['category']}</p>
          <h1>{page_title}</h1>
          <p class="lead">{intro}</p>
          {'<p class="trust-note">' + trust_note + '</p>' if trust_note else ''}
        </div>
        <div class="hero-meta">
          <div>
            <span class="meta-label">Primary focus</span>
            <strong>{key_focus}</strong>
          </div>
          <div class="hero-actions">
            <a class="button primary" href="{SITE_ORIGIN}/">Back to home</a>
            {render_hero_ctas(doc)}
          </div>
        </div>
      </section>

      {summary_cards}

      <section class="doc-layout">
        <article class="doc-content card prose">
          {html_body}
          {acknowledgements}
        </article>

        <aside class="doc-sidebar">
          <section class="card sidebar-panel">
            <p class="eyebrow">Publication set</p>
            <h2>Client-facing library</h2>
            <p>All public CrewPortGlobal documents share the same navigation, routing model and visual treatment.</p>
          </section>

          {related_links}

          <section class="card library-grid">
            {render_library(doc['slug'])}
          </section>
        </aside>
      </section>
    </main>
  </div>
</body>
</html>
"""


def build_site() -> None:
    for doc in DOCS:
        doc_dir = PUBLIC_ROOT / doc["slug"]
        html = render_page(doc)
        (doc_dir / "index.html").write_text(html, encoding="utf-8")


if __name__ == "__main__":
    build_site()