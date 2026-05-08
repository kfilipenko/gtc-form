from __future__ import annotations

import html
from pathlib import Path
from typing import Any, Final
import re

import markdown
import yaml


SITE_ORIGIN: Final = "https://crewportglobal.com"
PROJECT_ROOT: Final = Path(__file__).resolve().parent.parent
PUBLIC_ROOT: Final = PROJECT_ROOT / "public"
CSS_PATH: Final = PUBLIC_ROOT / "assets" / "crewportglobal-docs.css"

DOC_ORDER: Final = [
    "about",
    "how-it-works",
    "for-shipowners",
    "for-seafarers",
    "legal/no-recruitment-fees",
    "legal/privacy",
    "legal/seafarer-candidate-agreement",
    "legal/terms",
    "legal/shipowner-service-terms",
    "legal/complaints",
]


def markdown_extensions() -> list[str]:
    return ["extra", "sane_lists"]


def clean_title(raw_title: str) -> str:
    return raw_title.replace("# ", "", 1).strip()


def split_frontmatter(markdown_text: str) -> tuple[dict[str, Any], str]:
    if not markdown_text.startswith("---\n"):
        return {}, markdown_text

    marker = "\n---\n"
    end_index = markdown_text.find(marker, 4)
    if end_index == -1:
        return {}, markdown_text

    frontmatter_text = markdown_text[4:end_index]
    body = markdown_text[end_index + len(marker):]
    loaded = yaml.safe_load(frontmatter_text) or {}
    return loaded if isinstance(loaded, dict) else {}, body


def extract_title(markdown_text: str) -> tuple[str, str]:
    lines = markdown_text.lstrip().splitlines()
    if not lines or not lines[0].startswith("# "):
        raise ValueError("Each document must start with a level-1 heading")
    return clean_title(lines[0]), "\n".join(lines[1:]).strip()


def load_doc(slug: str) -> dict[str, Any]:
    markdown_path = PUBLIC_ROOT / slug / "index.md"
    markdown_text = markdown_path.read_text(encoding="utf-8")
    metadata, content = split_frontmatter(markdown_text)
    heading, markdown_body = extract_title(content)

    doc = dict(metadata)
    doc["slug"] = slug
    doc["title"] = str(doc.get("title") or heading)
    doc["body_title"] = heading
    doc["nav_label"] = str(doc.get("nav_label") or heading.replace("CrewPortGlobal — ", ""))
    doc["category"] = str(doc.get("category") or "Document")
    doc["description"] = str(doc.get("description") or doc.get("summary") or "Public document")
    doc["html_body"] = markdown.markdown(markdown_body, extensions=markdown_extensions())
    return doc


def load_docs() -> list[dict[str, Any]]:
    return [load_doc(slug) for slug in DOC_ORDER]


def slug_to_clean_url(slug: str) -> str:
    return f"{SITE_ORIGIN}/{slug}/"


def slug_to_raw_url(slug: str) -> str:
    return f"{SITE_ORIGIN}/{slug}/index.md"


def first_section_title(html_body: str) -> str | None:
    match = re.search(r"<h2>(.*?)</h2>", html_body)
    return match.group(1) if match else None


def render_nav(current_slug: str, docs: list[dict[str, Any]]) -> str:
    items = []
    for doc in docs:
        class_name = "nav-link is-active" if doc["slug"] == current_slug else "nav-link"
        items.append(
            f'<a class="{class_name}" href="{slug_to_clean_url(str(doc["slug"]))}">{html.escape(str(doc["nav_label"]))}</a>'
        )
    return "\n".join(items)


def render_library(current_slug: str, docs: list[dict[str, Any]]) -> str:
    cards = []
    for doc in docs:
        class_name = "library-link is-active" if doc["slug"] == current_slug else "library-link"
        cards.append(
            "\n".join(
                [
                    f'<a class="{class_name}" href="{slug_to_clean_url(str(doc["slug"]))}">',
                    f'  <span class="library-type">{html.escape(str(doc["category"]))}</span>',
                    f'  <strong>{html.escape(str(doc["nav_label"]))}</strong>',
                    f'  <span>{html.escape(str(doc["description"]))}</span>',
                    "</a>",
                ]
            )
        )
    return "\n".join(cards)


def render_hero_ctas(doc: dict[str, Any]) -> str:
    items = []
    for item in doc.get("hero_ctas", []):
        if not isinstance(item, dict):
            continue
        label = html.escape(str(item.get("label") or "Open"))
        href = html.escape(str(item.get("href") or SITE_ORIGIN), quote=True)
        style = html.escape(str(item.get("style") or "secondary"))
        items.append(f'<a class="button {style}" href="{href}">{label}</a>')
    items.append(f'<a class="button secondary" href="{slug_to_raw_url(str(doc["slug"]))}">Canonical Markdown</a>')
    return "\n".join(items)


def render_summary_cards(doc: dict[str, Any]) -> str:
    cards = doc.get("summary_cards", [])
    if not cards:
        return ""

    items = []
    for item in cards:
        if not isinstance(item, dict):
            continue
        title = html.escape(str(item.get("title") or "Summary"))
        text = html.escape(str(item.get("text") or ""))
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

    return "\n".join([
        '<section class="summary-grid">',
        *items,
        "</section>",
    ])


def render_acknowledgements(doc: dict[str, Any]) -> str:
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
        lines.append(f'    <li class="acknowledgement-item">{html.escape(str(item))}</li>')
    lines.extend(["  </ul>", "</section>"])
    return "\n".join(lines)


def render_related_links(doc: dict[str, Any]) -> str:
    items = doc.get("related_links", [])
    if not items:
        return ""

    links = []
    for item in items:
        if not isinstance(item, dict):
            continue
        label = html.escape(str(item.get("label") or "Open"))
        href = html.escape(str(item.get("href") or SITE_ORIGIN), quote=True)
        links.append(f'<a class="related-link" href="{href}">{label}</a>')

    return "\n".join([
        '<section class="card related-panel">',
        '  <p class="eyebrow">Related Trust Center links</p>',
        '  <h2>Next documents to review</h2>',
        '  <div class="related-links">',
        *links,
        '  </div>',
        '</section>',
    ])


def render_page(doc: dict[str, Any], docs: list[dict[str, Any]]) -> str:
    doc_dir = PUBLIC_ROOT / str(doc["slug"])
    page_title = str(doc["title"])
    html_body = str(doc["html_body"])
    lead_heading = first_section_title(html_body)
    asset_href = Path("/".join([".."] * len(doc_dir.relative_to(PUBLIC_ROOT).parts)) or ".")
    stylesheet_href = (asset_href / "assets" / CSS_PATH.name).as_posix()
    if stylesheet_href.startswith("./"):
        stylesheet_href = stylesheet_href[2:]

    title_suffix = f"{page_title} | CrewPortGlobal"
    intro = str(doc["description"])
    key_focus = lead_heading or "Public document"
    trust_note = str(doc.get("trust_note") or "")
    summary_cards = render_summary_cards(doc)
    acknowledgements = render_acknowledgements(doc)
    related_links = render_related_links(doc)

    return f"""<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>{html.escape(title_suffix)}</title>
  <meta name="description" content="{html.escape(intro, quote=True)}">
  <link rel="canonical" href="{slug_to_clean_url(str(doc['slug']))}">
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
      {render_nav(str(doc['slug']), docs)}
    </nav>

    <main class="doc-main">
      <section class="doc-hero card">
        <div>
          <p class="eyebrow">{html.escape(str(doc['category']))}</p>
          <h1>{html.escape(page_title)}</h1>
          <p class="lead">{html.escape(intro)}</p>
          {'<p class="trust-note">' + html.escape(trust_note) + '</p>' if trust_note else ''}
        </div>
        <div class="hero-meta">
          <div>
            <span class="meta-label">Primary focus</span>
            <strong>{html.escape(key_focus)}</strong>
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
            {render_library(str(doc['slug']), docs)}
          </section>
        </aside>
      </section>
    </main>
  </div>
</body>
</html>
"""


def build_site() -> None:
    docs = load_docs()
    for doc in docs:
        doc_dir = PUBLIC_ROOT / str(doc["slug"])
        html_output = render_page(doc, docs)
        (doc_dir / "index.html").write_text(html_output, encoding="utf-8")


if __name__ == "__main__":
    build_site()