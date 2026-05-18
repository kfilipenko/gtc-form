#!/usr/bin/env python3
"""Build CrewPortGlobal seafarer reference-catalog review artifacts from a private Excel source.

The script intentionally reads the private source file from outside Git and writes generated
review artifacts outside Git by default. It does not apply SQL to PostgreSQL.
"""

from __future__ import annotations

import argparse
import datetime as dt
import hashlib
import json
import re
import sys
import unicodedata
from pathlib import Path
from typing import Any

try:
    import xlrd  # type: ignore
except ImportError as exc:  # pragma: no cover - exercised by operator environment.
    raise SystemExit(
        "Missing dependency: xlrd. Install project requirements or run in a venv with "
        "`python -m pip install -r projects/crewportglobal/requirements.txt`."
    ) from exc


DEFAULT_SOURCE = Path(
    "/var/www/crewportglobal-private-sources/seafarer_fields/incoming/"
    "seafarer_fields_dictionary_2026_05_18.xls"
)
DEFAULT_OUTPUT_DIR = Path("/var/www/crewportglobal-private-sources/seafarer_fields/processed")
SOURCE_SHEET = "DROPDOWN_LISTS"
SOURCE_NAME = "seafarer_fields_dictionary_2026_05_18.xls"

CATALOG_MAP: dict[str, dict[str, str]] = {
    "POSITION": {
        "catalog_code": "seafarer_positions",
        "catalog_name": "Seafarer positions",
        "catalog_scope": "seafarer",
        "description": "Ranks and positions used in seafarer workforce and matching workflows.",
    },
    "NATIONALITY": {
        "catalog_code": "nationalities",
        "catalog_name": "Nationalities",
        "catalog_scope": "global",
        "description": "Nationality values from the seafarer source workbook; requires ISO alignment before publication.",
    },
    "SEX": {
        "catalog_code": "gender_values",
        "catalog_name": "Gender values",
        "catalog_scope": "global",
        "description": "Gender values from the seafarer source workbook.",
    },
    "CIVIL STATUS": {
        "catalog_code": "civil_status_values",
        "catalog_name": "Civil status values",
        "catalog_scope": "global",
        "description": "Civil status values used in personal details.",
    },
    "RELIGION": {
        "catalog_code": "religion_values",
        "catalog_name": "Religion values",
        "catalog_scope": "seafarer",
        "description": "Sensitive source values; requires owner/compliance decision before any production collection.",
    },
    "COUNTRY": {
        "catalog_code": "countries",
        "catalog_name": "Countries",
        "catalog_scope": "global",
        "description": "Country values from the source workbook; requires ISO 3166 normalization before publication.",
    },
    "AIRPORT": {
        "catalog_code": "airports",
        "catalog_name": "Airports",
        "catalog_scope": "global",
        "description": "Airport values for travel/logistics context.",
    },
    "CITY": {
        "catalog_code": "cities",
        "catalog_name": "Cities",
        "catalog_scope": "global",
        "description": "City values from the source workbook.",
    },
    "RELATION": {
        "catalog_code": "relation_types",
        "catalog_name": "Relation types",
        "catalog_scope": "global",
        "description": "Next-of-kin and beneficiary relation values.",
    },
    "RELATION_CHILDREN": {
        "catalog_code": "child_relation_types",
        "catalog_name": "Child relation types",
        "catalog_scope": "global",
        "description": "Child relation values.",
    },
    "EDUCATION_INSTITUTE": {
        "catalog_code": "education_institutions",
        "catalog_name": "Education institutions",
        "catalog_scope": "seafarer",
        "description": "Maritime education institution values.",
    },
    "GRADE": {
        "catalog_code": "education_grades",
        "catalog_name": "Education grades",
        "catalog_scope": "seafarer",
        "description": "Education grade values.",
    },
    "COC": {
        "catalog_code": "certificate_of_competence_types",
        "catalog_name": "Certificate of competence types",
        "catalog_scope": "seafarer",
        "description": "Certificate of competence and proficiency values.",
    },
    "ENDORSMENT INSTITUTE": {
        "catalog_code": "endorsement_institutions",
        "catalog_name": "Endorsement institutions",
        "catalog_scope": "seafarer",
        "description": "Source spelling preserved in source header; normalized catalog for endorsement issuing institutions.",
    },
    "VESSELTYPE": {
        "catalog_code": "vessel_types",
        "catalog_name": "Vessel types",
        "catalog_scope": "vessel",
        "description": "Broad vessel type values for matching, service complexity and pricing context.",
    },
    "NATIONAL_DOC": {
        "catalog_code": "national_document_types",
        "catalog_name": "National document types",
        "catalog_scope": "seafarer",
        "description": "National endorsement and document type values.",
    },
    "TRAINING_COURSES": {
        "catalog_code": "training_course_types",
        "catalog_name": "Training course types",
        "catalog_scope": "seafarer",
        "description": "Training course values used in qualification records.",
    },
    "HARBOURMASTER": {
        "catalog_code": "harbourmasters",
        "catalog_name": "Harbourmasters",
        "catalog_scope": "seafarer",
        "description": "Harbourmaster / maritime administration values.",
    },
    "SHENGENCOUNTRY": {
        "catalog_code": "schengen_countries",
        "catalog_name": "Schengen countries",
        "catalog_scope": "global",
        "description": "Source header spelling preserved; normalized catalog for Schengen country values.",
    },
    "VESSELTYPE2": {
        "catalog_code": "vessel_type_matching_categories",
        "catalog_name": "Vessel type matching categories",
        "catalog_scope": "vessel",
        "description": "Shortlist vessel type categories; overlaps with vessel_types and requires owner review before publication.",
    },
    "Yes/No": {
        "catalog_code": "yes_no_values",
        "catalog_name": "Yes / No values",
        "catalog_scope": "global",
        "description": "Binary choice values.",
    },
    "CONFIRMATION": {
        "catalog_code": "confirmation_values",
        "catalog_name": "Confirmation values",
        "catalog_scope": "system",
        "description": "Confirmation choice values.",
    },
    "AGREEMENT": {
        "catalog_code": "agreement_values",
        "catalog_name": "Agreement values",
        "catalog_scope": "system",
        "description": "Agreement choice values.",
    },
    "INFORMATION FROM": {
        "catalog_code": "information_source_values",
        "catalog_name": "Information source values",
        "catalog_scope": "seafarer",
        "description": "Marketing source values from the source workbook.",
    },
}


def sql_quote(value: str | None) -> str:
    if value is None:
        return "NULL"
    return "'" + value.replace("'", "''") + "'"


def normalize_cell(value: Any) -> str:
    if value is None:
        return ""
    if isinstance(value, float) and value.is_integer():
        value = int(value)
    return str(value).strip()


def slugify(value: str) -> str:
    normalized = unicodedata.normalize("NFKD", value)
    ascii_value = normalized.encode("ascii", "ignore").decode("ascii")
    slug = re.sub(r"[^a-z0-9]+", "_", ascii_value.lower()).strip("_")
    if not slug:
        slug = "value_" + hashlib.sha1(value.encode("utf-8")).hexdigest()[:10]
    if not re.match(r"^[a-z0-9]", slug):
        slug = "value_" + slug
    return slug[:80].strip("_") or "value"


def unique_code(base: str, used: set[str]) -> str:
    candidate = base
    index = 2
    while candidate in used:
        suffix = f"_{index}"
        candidate = base[: 80 - len(suffix)] + suffix
        index += 1
    used.add(candidate)
    return candidate


def read_catalogs(source: Path) -> list[dict[str, Any]]:
    book = xlrd.open_workbook(str(source))
    sheet = book.sheet_by_name(SOURCE_SHEET)
    catalogs: list[dict[str, Any]] = []

    for column_index in range(sheet.ncols):
        header = normalize_cell(sheet.cell_value(0, column_index))
        if not header:
            continue
        if header not in CATALOG_MAP:
            raise SystemExit(f"Unmapped reference catalog header in {SOURCE_SHEET}: {header!r}")

        config = CATALOG_MAP[header]
        values: list[dict[str, Any]] = []
        seen_values: set[str] = set()
        used_codes: set[str] = set()
        duplicate_count = 0

        for row_index in range(1, sheet.nrows):
            display_name = normalize_cell(sheet.cell_value(row_index, column_index))
            if not display_name:
                continue
            normalized_key = display_name.casefold()
            if normalized_key in seen_values:
                duplicate_count += 1
                continue
            seen_values.add(normalized_key)

            values.append(
                {
                    "value_code": unique_code(slugify(display_name), used_codes),
                    "display_name": display_name,
                    "source_value": display_name,
                    "source_row_number": row_index + 1,
                    "sort_order": len(values) + 1,
                    "metadata": {
                        "source_header": header,
                        "source_column_number": column_index + 1,
                        "requires_owner_review": True,
                    },
                }
            )

        catalogs.append(
            {
                **config,
                "source_header": header,
                "source_name": SOURCE_NAME,
                "source_sheet": SOURCE_SHEET,
                "publication_state": "pending_owner_review",
                "value_count": len(values),
                "duplicate_count": duplicate_count,
                "values": values,
            }
        )

    return catalogs


def build_sql(catalogs: list[dict[str, Any]]) -> str:
    lines = [
        "-- CPG-REF-001",
        "-- Generated review seed for CrewPortGlobal reference catalogs.",
        "-- Source values are pending owner review and are not published by this seed.",
        "-- Generated at: " + dt.datetime.now(dt.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "",
        "BEGIN;",
        "",
    ]

    for catalog in catalogs:
        metadata = {
            "source_header": catalog["source_header"],
            "value_count": catalog["value_count"],
            "duplicate_count": catalog["duplicate_count"],
            "requires_owner_review": True,
        }
        lines.extend(
            [
                f"-- {catalog['catalog_code']} ({catalog['value_count']} values)",
                "INSERT INTO crewportglobal.reference_catalogs (",
                "  catalog_code, catalog_name, catalog_scope, source_name, source_sheet,",
                "  description, is_active, publication_state",
                ") VALUES (",
                "  "
                + ", ".join(
                    [
                        sql_quote(catalog["catalog_code"]),
                        sql_quote(catalog["catalog_name"]),
                        sql_quote(catalog["catalog_scope"]),
                        sql_quote(catalog["source_name"]),
                        sql_quote(catalog["source_sheet"]),
                        sql_quote(catalog["description"]),
                        "TRUE",
                        sql_quote(catalog["publication_state"]),
                    ]
                ),
                ")",
                "ON CONFLICT (catalog_code) DO UPDATE SET",
                "  catalog_name = EXCLUDED.catalog_name,",
                "  catalog_scope = EXCLUDED.catalog_scope,",
                "  source_name = EXCLUDED.source_name,",
                "  source_sheet = EXCLUDED.source_sheet,",
                "  description = EXCLUDED.description,",
                "  is_active = EXCLUDED.is_active,",
                "  publication_state = EXCLUDED.publication_state,",
                "  updated_at = now();",
                "",
            ]
        )

        for value in catalog["values"]:
            value_metadata = dict(value["metadata"])
            value_metadata["catalog_metadata"] = metadata
            lines.extend(
                [
                    "WITH catalog AS (",
                    "  SELECT reference_catalog_id",
                    "  FROM crewportglobal.reference_catalogs",
                    f"  WHERE catalog_code = {sql_quote(catalog['catalog_code'])}",
                    ")",
                    "INSERT INTO crewportglobal.reference_catalog_values (",
                    "  reference_catalog_id, value_code, display_name, source_value,",
                    "  source_row_number, sort_order, metadata, is_active, publication_state",
                    ")",
                    "SELECT",
                    "  catalog.reference_catalog_id,",
                    "  "
                    + ", ".join(
                        [
                            sql_quote(value["value_code"]),
                            sql_quote(value["display_name"]),
                            sql_quote(value["source_value"]),
                            str(value["source_row_number"]),
                            str(value["sort_order"]),
                            sql_quote(json.dumps(value_metadata, ensure_ascii=False, sort_keys=True)) + "::jsonb",
                            "TRUE",
                            sql_quote("pending_owner_review"),
                        ]
                    ),
                    "FROM catalog",
                    "ON CONFLICT (reference_catalog_id, value_code) DO UPDATE SET",
                    "  display_name = EXCLUDED.display_name,",
                    "  source_value = EXCLUDED.source_value,",
                    "  source_row_number = EXCLUDED.source_row_number,",
                    "  sort_order = EXCLUDED.sort_order,",
                    "  metadata = EXCLUDED.metadata,",
                    "  is_active = EXCLUDED.is_active,",
                    "  publication_state = EXCLUDED.publication_state,",
                    "  updated_at = now();",
                    "",
                ]
            )

    lines.extend(["COMMIT;", ""])
    return "\n".join(lines)


def build_markdown(catalogs: list[dict[str, Any]], source: Path, generated_at: str) -> str:
    total_values = sum(int(catalog["value_count"]) for catalog in catalogs)
    lines = [
        "# CrewPortGlobal Seafarer Reference Catalog Import Review",
        "",
        f"- Generated at: {generated_at}",
        f"- Source path: `{source}`",
        f"- Source sheet: `{SOURCE_SHEET}`",
        f"- Catalogs: {len(catalogs)}",
        f"- Values: {total_values}",
        "",
        "## Catalog Summary",
        "",
        "| Catalog code | Source header | Scope | Values | Duplicates skipped |",
        "|---|---|---|---:|---:|",
    ]
    for catalog in catalogs:
        lines.append(
            "| {catalog_code} | {source_header} | {catalog_scope} | {value_count} | {duplicate_count} |".format(
                **catalog
            )
        )
    lines.extend(
        [
            "",
            "## Publication Boundary",
            "",
            "All generated values are marked `pending_owner_review`.",
            "",
            "The importer does not publish reference values to the public UI and does not apply SQL to PostgreSQL.",
            "",
            "Review required before publication:",
            "",
            "1. normalize countries/nationalities against a controlled standard;",
            "2. decide whether sensitive religion values should be collected;",
            "3. normalize overlapping vessel type catalogs;",
            "4. review airport/city source values;",
            "5. prepare Russian/English display labels through the project i18n model.",
            "",
        ]
    )
    return "\n".join(lines)


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--source", type=Path, default=DEFAULT_SOURCE)
    parser.add_argument("--output-dir", type=Path, default=DEFAULT_OUTPUT_DIR)
    args = parser.parse_args()

    source = args.source
    if not source.is_file():
        raise SystemExit(f"Source Excel file was not found: {source}")

    output_dir = args.output_dir
    output_dir.mkdir(parents=True, exist_ok=True)
    generated_at = dt.datetime.now(dt.timezone.utc).strftime("%Y%m%dT%H%M%SZ")

    catalogs = read_catalogs(source)
    artifact = {
        "generated_at": generated_at,
        "source_path": str(source),
        "source_sheet": SOURCE_SHEET,
        "catalog_count": len(catalogs),
        "value_count": sum(int(catalog["value_count"]) for catalog in catalogs),
        "catalogs": catalogs,
    }

    json_path = output_dir / f"seafarer_reference_catalogs_review_{generated_at}.json"
    sql_path = output_dir / f"seafarer_reference_catalogs_seed_{generated_at}.sql"
    md_path = output_dir / f"seafarer_reference_catalogs_summary_{generated_at}.md"

    json_path.write_text(json.dumps(artifact, ensure_ascii=False, indent=2, sort_keys=True) + "\n", encoding="utf-8")
    sql_path.write_text(build_sql(catalogs), encoding="utf-8")
    md_path.write_text(
        build_markdown(catalogs, source, dt.datetime.now(dt.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")),
        encoding="utf-8",
    )

    print(f"catalogs={artifact['catalog_count']}")
    print(f"values={artifact['value_count']}")
    print(f"json={json_path}")
    print(f"sql={sql_path}")
    print(f"summary={md_path}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
