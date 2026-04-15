#!/usr/bin/env python3
from __future__ import annotations

import argparse
from dataclasses import dataclass
from html.parser import HTMLParser
from pathlib import Path
from typing import List

PHRASE = "правила игры"
DEFAULT_FILES = [
    "index-3d-mvp.html",
    "buy/index.html",
    "rules/index.html",
    "rgame/index.html",
    "meaning/index.html",
    "game-card/index.html",
]


@dataclass
class Violation:
    file_path: Path
    reason: str
    text: str


class PhraseLinkParser(HTMLParser):
    def __init__(self, file_path: Path):
        super().__init__(convert_charrefs=True)
        self.file_path = file_path
        self.tag_stack: List[str] = []
        self.anchor_href_stack: List[str] = []
        self.violations: List[Violation] = []

    def handle_starttag(self, tag, attrs):
        self.tag_stack.append(tag)
        if tag == "a":
            attrs_dict = dict(attrs)
            self.anchor_href_stack.append(attrs_dict.get("href", "").strip())

    def handle_endtag(self, tag):
        if tag == "a" and self.anchor_href_stack:
            self.anchor_href_stack.pop()

        for i in range(len(self.tag_stack) - 1, -1, -1):
            if self.tag_stack[i] == tag:
                del self.tag_stack[i]
                break

    def handle_data(self, data):
        text = " ".join(data.split())
        if not text:
            return

        if PHRASE not in text.lower():
            return

        if "head" in self.tag_stack:
            return

        if not self.anchor_href_stack:
            self.violations.append(
                Violation(
                    file_path=self.file_path,
                    reason="Фраза не обёрнута ссылкой",
                    text=text,
                )
            )
            return

        href = self.anchor_href_stack[-1].lower()
        if "/rules" not in href:
            self.violations.append(
                Violation(
                    file_path=self.file_path,
                    reason=f"Ссылка ведёт не на /rules/ (href={href})",
                    text=text,
                )
            )


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Проверка: вхождения 'правила игры' должны быть ссылками на /rules/."
    )
    parser.add_argument(
        "--root",
        default=".",
        help="Корневая папка проекта (по умолчанию текущая)",
    )
    parser.add_argument(
        "--files",
        nargs="*",
        default=DEFAULT_FILES,
        help="Список HTML-файлов для проверки (относительно --root)",
    )
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    root = Path(args.root).resolve()

    violations: List[Violation] = []
    checked_files = 0

    for rel_file in args.files:
        file_path = (root / rel_file).resolve()
        if not file_path.exists():
            print(f"[SKIP] Не найден файл: {file_path}")
            continue

        parser = PhraseLinkParser(file_path)
        parser.feed(file_path.read_text(encoding="utf-8", errors="ignore"))
        violations.extend(parser.violations)
        checked_files += 1

    print(f"Проверено файлов: {checked_files}")

    if not violations:
        print("OK: все вхождения 'правила игры' в теле страниц являются ссылками на /rules/.")
        return 0

    print(f"Найдено нарушений: {len(violations)}")
    for idx, violation in enumerate(violations, start=1):
        print(f"{idx}. {violation.file_path}")
        print(f"   Причина: {violation.reason}")
        print(f"   Текст: {violation.text}")

    return 1


if __name__ == "__main__":
    raise SystemExit(main())
