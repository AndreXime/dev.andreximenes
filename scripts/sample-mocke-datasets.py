#!/usr/bin/env python3
"""One-shot: amostra CSVs do Mockê para fixtures da tool. Não roda no build do site."""

from __future__ import annotations

import csv
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT_DIR = ROOT / "src" / "tools" / "Mocke" / "data"
TARGET_BYTES = 1024 * 1024
BATCH = 50

DATASETS: dict[str, str] = {
    "products": "products.csv",
    "cep": "code_cep_coordinates.csv",
    "movies": "movies.csv",
    "users": "users.csv",
    "companies": "companies.csv",
    "news": "news.csv",
}

# Evita sample só das primeiras linhas quando o CSV começa com campos vazios
PREFER_NONEMPTY: dict[str, tuple[str, ...]] = {
    "products": ("description",),
}

# Colunas com textos enormes: corta pra caber mais rows no orçamento
TRUNCATE_FIELDS: dict[str, dict[str, int]] = {
    "products": {
        "description": 300,
    },
    "movies": {
        "overview": 300,
        "keywords": 300,
    },
    "news": {
        "text": 400,
    },
}

PRODUCTS_MAX_IMAGES = 3


def clean_row(row: dict[str | None, str | None]) -> dict[str, str]:
    return {
        key: ("" if value is None else str(value))
        for key, value in row.items()
        if key is not None
    }


def truncate_row(row: dict[str, str], limits: dict[str, int]) -> dict[str, str]:
    if not limits:
        return row
    out = dict(row)
    for field, max_len in limits.items():
        value = out.get(field)
        if value is None or len(value) <= max_len:
            continue
        if max_len <= 3:
            out[field] = value[:max_len]
        else:
            out[field] = f"{value[: max_len - 3]}..."
    return out


def limit_product_images(row: dict[str, str], max_images: int = PRODUCTS_MAX_IMAGES) -> dict[str, str]:
    raw = row.get("images", "")
    if not raw.strip():
        return row
    parts = [part.strip() for part in raw.split("|") if part.strip()]
    if len(parts) <= max_images:
        return row
    out = dict(row)
    out["images"] = "|".join(parts[:max_images])
    return out


def dump_json(rows: list[dict[str, str]]) -> str:
    return json.dumps(rows, ensure_ascii=False, separators=(",", ":"))


def dump_size(rows: list[dict[str, str]]) -> int:
    return len(dump_json(rows).encode("utf-8"))


def trim_to_target(rows: list[dict[str, str]], target_bytes: int) -> list[dict[str, str]]:
    if not rows or dump_size(rows) < target_bytes:
        return rows

    low, high = 1, len(rows)
    best = rows[:1]
    while low <= high:
        mid = (low + high) // 2
        candidate = rows[:mid]
        size = dump_size(candidate)
        if size < target_bytes:
            low = mid + 1
            best = candidate
        else:
            best = candidate
            high = mid - 1
            if size <= target_bytes * 1.08:
                break
    return best


def sample_until_size(
    path: Path,
    target_bytes: int,
    prefer_nonempty: tuple[str, ...] = (),
    truncate_fields: dict[str, int] | None = None,
    *,
    limit_images: bool = False,
) -> list[dict[str, str]]:
    preferred: list[dict[str, str]] = []
    fallback: list[dict[str, str]] = []
    limits = truncate_fields or {}

    with path.open(newline="", encoding="utf-8", errors="replace") as handle:
        reader = csv.DictReader(handle)
        for raw in reader:
            row = truncate_row(clean_row(raw), limits)
            if limit_images:
                row = limit_product_images(row)
            has_preferred = prefer_nonempty and all(
                (row.get(field) or "").strip() for field in prefer_nonempty
            )

            if has_preferred:
                preferred.append(row)
                if len(preferred) % BATCH == 0 and dump_size(preferred) >= target_bytes:
                    return trim_to_target(preferred, target_bytes)
                continue

            fallback.append(row)
            if not prefer_nonempty and len(fallback) % BATCH == 0 and dump_size(fallback) >= target_bytes:
                return trim_to_target(fallback, target_bytes)

    if prefer_nonempty:
        if preferred and dump_size(preferred) >= target_bytes:
            return trim_to_target(preferred, target_bytes)
        return trim_to_target(preferred + fallback, target_bytes)

    return trim_to_target(fallback, target_bytes)


def main() -> int:
    source_root = (
        Path(sys.argv[1]) if len(sys.argv) > 1 else Path("/home/andre/Projetos/mocke/data")
    )
    if not source_root.is_dir():
        print(f"Pasta de dados não encontrada: {source_root}", file=sys.stderr)
        return 1

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    for dataset_id, filename in DATASETS.items():
        csv_path = source_root / filename
        if not csv_path.is_file():
            print(f"CSV ausente: {csv_path}", file=sys.stderr)
            return 1

        prefer = PREFER_NONEMPTY.get(dataset_id, ())
        truncate = TRUNCATE_FIELDS.get(dataset_id, {})
        limit_images = dataset_id == "products"
        rows = sample_until_size(
            csv_path,
            TARGET_BYTES,
            prefer,
            truncate,
            limit_images=limit_images,
        )
        out_path = OUT_DIR / f"{dataset_id}.json"
        payload = dump_json(rows) + "\n"
        out_path.write_text(payload, encoding="utf-8")
        size_kb = len(payload.encode("utf-8")) / 1024
        note = "" if size_kb >= TARGET_BYTES / 1024 * 0.9 else " (CSV esgotado)"
        if prefer:
            filled = sum(
                1 for row in rows if all((row.get(field) or "").strip() for field in prefer)
            )
            note += f", {filled}/{len(rows)} com {'+'.join(prefer)}"
        if truncate:
            note += f", trunc={','.join(truncate)}"
        if limit_images:
            note += f", images<= {PRODUCTS_MAX_IMAGES}"
        print(f"{dataset_id}: {len(rows)} rows, {size_kb:.1f} KB{note} → {out_path}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
