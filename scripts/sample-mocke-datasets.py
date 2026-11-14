#!/usr/bin/env python3
"""One-shot: amostra CSVs do Mockê para fixtures da tool. Não roda no build do site."""

from __future__ import annotations

import csv
import json
import sys
from pathlib import Path

SAMPLE_SIZE = 100
ROOT = Path(__file__).resolve().parents[1]
OUT_DIR = ROOT / "src" / "tools" / "Mocke" / "data"

DATASETS = {
    "products": "products.csv",
    "cep": "code_cep_coordinates.csv",
    "news": "news.csv",
    "movies": "movies.csv",
    "users": "users.csv",
    "companies": "companies.csv",
}


def sample_csv(path: Path, limit: int) -> list[dict[str, str]]:
    rows: list[dict[str, str]] = []
    with path.open(newline="", encoding="utf-8", errors="replace") as handle:
        reader = csv.DictReader(handle)
        for row in reader:
            cleaned = {
                key: ("" if value is None else str(value))
                for key, value in row.items()
                if key is not None
            }
            rows.append(cleaned)
            if len(rows) >= limit:
                break
    return rows


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
        rows = sample_csv(csv_path, SAMPLE_SIZE)
        out_path = OUT_DIR / f"{dataset_id}.json"
        out_path.write_text(
            json.dumps(rows, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
        )
        print(f"{dataset_id}: {len(rows)} → {out_path}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
