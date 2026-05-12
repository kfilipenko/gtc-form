from __future__ import annotations

from pathlib import Path
from typing import Final
import re

import markdown
import yaml


SITE_ORIGIN: Final = "https://crewportglobal.com"
PROJECT_ROOT: Final = Path(__file__).resolve().parent.parent
PUBLIC_ROOT: Final = PROJECT_ROOT / "public"
CSS_PATH: Final = PUBLIC_ROOT / "assets" / "crewportglobal-docs.css"
I18N_JS_PATH: Final = PUBLIC_ROOT / "assets" / "crewportglobal-public-i18n.js"

NAV_TRANSLATION_KEYS: Final = {
    "about": "nav.projectScope",
    "how-it-works": "nav.howItWorks",
    "for-shipowners": "nav.forShipowners",
    "for-seafarers": "nav.forSeafarers",
    "legal/no-recruitment-fees": "nav.noRecruitmentFees",
    "legal/privacy": "nav.privacy",
    "legal/seafarer-candidate-agreement": "nav.seafarerAgreement",
    "legal/terms": "nav.terms",
    "legal/shipowner-service-terms": "nav.shipownerAgreement",
    "legal/recruitment-and-matching-policy": "nav.matchingPolicy",
    "legal/verification-policy": "nav.verificationPolicy",
    "legal/complaints": "nav.complaints",
}

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
    "legal/recruitment-and-matching-policy",
    "legal/verification-policy",
    "legal/complaints",
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


def split_frontmatter(markdown_text: str) -> tuple[dict[str, object], str]:
    if not markdown_text.startswith("---\n"):
        raise ValueError("Each document must start with YAML frontmatter")
    frontmatter_block, separator, body = markdown_text[4:].partition("\n---\n")
    if not separator:
        raise ValueError("YAML frontmatter must be closed with ---")
    metadata = yaml.safe_load(frontmatter_block) or {}
    if not isinstance(metadata, dict):
        raise ValueError("YAML frontmatter must parse to a mapping")
    return metadata, body.strip()


def require_text(metadata: dict[str, object], field_name: str) -> str:
    value = metadata.get(field_name)
    if not isinstance(value, str) or not value.strip():
        raise ValueError(f"Frontmatter field '{field_name}' is required")
    return value.strip()


def read_text_list(metadata: dict[str, object], field_name: str) -> list[str]:
    raw_items = metadata.get(field_name, [])
    if raw_items in (None, ""):
        return []
    if not isinstance(raw_items, list):
        raise ValueError(f"Frontmatter field '{field_name}' must be a list")
    items: list[str] = []
    for raw_item in raw_items:
        if not isinstance(raw_item, str) or not raw_item.strip():
            raise ValueError(f"Each '{field_name}' item must be a non-empty string")
        items.append(raw_item.strip())
    return items


def read_link_items(metadata: dict[str, object], field_name: str) -> list[dict[str, str]]:
    raw_items = metadata.get(field_name, [])
    if raw_items in (None, ""):
        return []
    if not isinstance(raw_items, list):
        raise ValueError(f"Frontmatter field '{field_name}' must be a list")

    items: list[dict[str, str]] = []
    for raw_item in raw_items:
        if not isinstance(raw_item, dict):
            raise ValueError(f"Each '{field_name}' item must be a mapping")
        label = require_text(raw_item, "label")
        href = require_text(raw_item, "href")
        style = raw_item.get("style", "secondary")
        if not isinstance(style, str) or not style.strip():
            raise ValueError(f"Each '{field_name}' item must have a valid style")
        items.append({"label": label, "href": href, "style": style.strip()})
    return items


def read_summary_cards(metadata: dict[str, object]) -> list[dict[str, str]]:
    raw_cards = metadata.get("summary_cards", [])
    if raw_cards in (None, ""):
        return []
    if not isinstance(raw_cards, list):
        raise ValueError("Frontmatter field 'summary_cards' must be a list")

    cards: list[dict[str, str]] = []
    for raw_card in raw_cards:
        if not isinstance(raw_card, dict):
            raise ValueError("Each 'summary_cards' item must be a mapping")
        cards.append(
            {
                "title": require_text(raw_card, "title"),
                "text": require_text(raw_card, "text"),
            }
        )
    return cards


def slug_to_clean_url(slug: str) -> str:
    return f"{SITE_ORIGIN}/{slug}/"


def slug_to_raw_url(slug: str) -> str:
    return f"{SITE_ORIGIN}/{slug}/index.md"


def first_section_title(html_body: str) -> str | None:
    match = re.search(r"<h2>(.*?)</h2>", html_body)
    return match.group(1) if match else None


def load_doc(slug: str) -> dict[str, object]:
    markdown_path = PUBLIC_ROOT / slug / "index.md"
    metadata, markdown_body = split_frontmatter(markdown_path.read_text(encoding="utf-8"))
    page_title, body_markdown = extract_title(markdown_body)
    return {
        "slug": slug,
        "title": page_title,
        "body_markdown": body_markdown,
        "category": require_text(metadata, "category"),
        "nav_label": require_text(metadata, "nav_label"),
        "summary": require_text(metadata, "summary"),
        "trust_note": str(metadata.get("trust_note", "")).strip(),
        "primary_focus": str(metadata.get("primary_focus", "")).strip(),
        "hero_ctas": read_link_items(metadata, "hero_ctas"),
        "summary_cards": read_summary_cards(metadata),
        "acknowledgements": read_text_list(metadata, "acknowledgements"),
        "related_links": read_link_items(metadata, "related_links"),
    }


def load_docs() -> list[dict[str, object]]:
    return [load_doc(slug) for slug in DOC_ORDER]


def render_nav(docs: list[dict[str, object]], current_slug: str) -> str:
    items = []
    for doc in docs:
        class_name = "nav-link is-active" if doc["slug"] == current_slug else "nav-link"
        translation_key = NAV_TRANSLATION_KEYS[doc["slug"]]
        items.append(
            f'<a class="{class_name}" href="{slug_to_clean_url(doc["slug"])}" data-i18n="{translation_key}">{doc["nav_label"]}</a>'
        )
    return "\n".join(items)


def render_library(docs: list[dict[str, object]], current_slug: str) -> str:
    cards = []
    for doc in docs:
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
    for item in doc.get("hero_ctas", []):
        items.append(f'<a class="button {item["style"]}" href="{item["href"]}">{item["label"]}</a>')
    items.append(
        f'<a class="button secondary" href="{slug_to_raw_url(doc["slug"])}" data-i18n="doc.canonicalMarkdown">Canonical Markdown</a>'
    )
    return "\n".join(items)


def render_summary_cards(doc: dict[str, object]) -> str:
    cards = doc.get("summary_cards", [])
    if not cards:
        return ""

    items = []
    for card in cards:
        items.append(
            "\n".join(
                [
                    '<article class="summary-card">',
                    f'  <h2>{card["title"]}</h2>',
                    f'  <p>{card["text"]}</p>',
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
        '  <p class="eyebrow" data-i18n="doc.acknowledgementEyebrow">Onboarding acknowledgement</p>',
        '  <h2 data-i18n="doc.acknowledgementTitle">Candidate confirmations for registration</h2>',
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
    for item in items:
        links.append(f'<a class="related-link" href="{item["href"]}">{item["label"]}</a>')

    return "\n".join(
        [
            '<section class="card related-panel">',
            '  <p class="eyebrow" data-i18n="doc.relatedEyebrow">Related Trust Center links</p>',
            '  <h2 data-i18n="doc.relatedTitle">Next documents to review</h2>',
            '  <div class="related-links">',
            *links,
            '  </div>',
            '</section>',
        ]
    )


def render_page(doc: dict[str, object], docs: list[dict[str, object]]) -> str:
    doc_dir = PUBLIC_ROOT / doc["slug"]
    html_body = markdown.markdown(doc["body_markdown"], extensions=markdown_extensions())
    lead_heading = first_section_title(html_body)
    asset_href = Path("/".join([".."] * len(doc_dir.relative_to(PUBLIC_ROOT).parts)) or ".")
    stylesheet_href = (asset_href / "assets" / CSS_PATH.name).as_posix()
    script_href = (asset_href / "assets" / I18N_JS_PATH.name).as_posix()
    if stylesheet_href.startswith("./"):
        stylesheet_href = stylesheet_href[2:]
    if script_href.startswith("./"):
        script_href = script_href[2:]

    title_suffix = f"{doc['title']} | CrewPortGlobal"
    intro = doc["summary"]
    key_focus = doc.get("primary_focus") or lead_heading or "Public document"
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
    <script src="{script_href}" defer></script>
</head>
<body class="doc-body" data-enable-public-translate="true">
  <div class="site-shell">
    <header class="site-header">
      <a class="brand" href="{SITE_ORIGIN}/">
        <span class="brand-mark">CPG</span>
        <span class="brand-copy">
          <strong>CrewPortGlobal</strong>
                    <span data-i18n="site.tagline">Maritime documentation and matching platform</span>
        </span>
      </a>
            <div id="language-selector" class="language-selector">
                <button id="current-language-toggle" class="language-toggle" type="button" aria-expanded="false" aria-controls="header-language-menu" aria-label="Open language selector">
                    <span class="language-toggle__flag" id="current-language-flag" aria-hidden="true">🇬🇧</span>
                    <span class="language-toggle__copy">
                        <span class="language-toggle__hint" data-i18n="site.languageLabel">Language</span>
                        <span class="language-toggle__label" id="current-language-label">English</span>
                    </span>
                    <span class="language-toggle__chevron" aria-hidden="true">▾</span>
                </button>
                <div id="header-language-menu" class="language-menu" hidden>
                    <div id="header-language-options" class="language-menu__options" role="listbox" aria-label="Language options"></div>
                </div>
            </div>
    </header>

    <nav class="site-nav" aria-label="Document navigation">
      {render_nav(docs, doc['slug'])}
    </nav>

    <main class="doc-main">
      <section class="doc-hero card">
        <div>
          <p class="eyebrow">{doc['category']}</p>
          <h1>{doc['title']}</h1>
          <p class="lead">{intro}</p>
          {'<p class="trust-note">' + trust_note + '</p>' if trust_note else ''}
        </div>
        <div class="hero-meta">
          <div>
                        <span class="meta-label" data-i18n="doc.primaryFocus">Primary focus</span>
            <strong>{key_focus}</strong>
          </div>
          <div class="hero-actions">
                        <a class="button primary" href="{SITE_ORIGIN}/" data-i18n="doc.backToHome">Back to home</a>
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
                        <p class="eyebrow" data-i18n="doc.publicationSet">Publication set</p>
                        <h2 data-i18n="doc.clientFacingLibrary">Client-facing library</h2>
                        <p data-i18n="doc.libraryBody">All public CrewPortGlobal documents share the same navigation, routing model and visual treatment.</p>
          </section>

          {related_links}

          <section class="card library-grid">
            {render_library(docs, doc['slug'])}
          </section>
        </aside>
      </section>
    </main>
  </div>
    <div id="google_translate_element" class="google-translate-anchor" aria-hidden="true"></div>
</body>
</html>
"""


def build_site() -> None:
    docs = load_docs()
    for doc in docs:
        doc_dir = PUBLIC_ROOT / doc["slug"]
        html = render_page(doc, docs)
        (doc_dir / "index.html").write_text(html, encoding="utf-8")


if __name__ == "__main__":
    build_site()
