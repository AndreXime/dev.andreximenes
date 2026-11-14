# Mockê Tool Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Tool client-only em `/app/mocke/` que filtra amostras JSON estilo API Mockê e copia um array puro para o clipboard.

**Architecture:** Motor `queryDataset` em memória (sem SQLite/HTTP), 6 datasets JSON (~100 registros) embutidos, UI React em `ToolShell` com filtros dinâmicos e CTA Copiar. Sem persistência/`storage` na v1.

**Tech Stack:** Astro + React 19, TypeScript strict, Vitest, lucide-react, tokens/`toolUi` do andre_OS. Script one-shot Python 3 para amostrar CSVs do repo irmão `Projetos/mocke`.

**Spec:** `docs/superpowers/specs/2026-11-14-mocke-tool-design.md`

## Global Constraints

- Zero `any`, zero `@ts-ignore`. Preferir `interface` para objetos, `type` para unions.
- Comentários só no “porquê”, nunca no “o quê”.
- UI mobile-first: multi-coluna só a partir de `lg`.
- Classes de UI: `@/lib/toolUi` + tokens existentes. Não inventar design system paralelo.
- Clipboard devolve array pretty-printed: `JSON.stringify(rows, null, 2)`.
- Sem API, auth, mutações, envelope paginado, faker, download fallback.
- Textos da UI e commits em português brasileiro.
- Commits Conventional Commits (`feat`, `test`, `chore`, …). Só commitar se o usuário pedir na sessão de execução. Se não pedir, pule os steps de commit e siga.

## File structure

| Path | Responsabilidade |
|------|------------------|
| `src/tools/Mocke/domain/types.ts` | `DataRecord`, `QueryParams`, `DatasetId`, `DatasetMeta` |
| `src/tools/Mocke/domain/query.ts` | `queryDataset`, helpers de filtro/busca/sort/projeção/limit |
| `src/tools/Mocke/domain/query.test.ts` | Vitest do motor |
| `src/tools/Mocke/domain/catalog.ts` | Metadados dos 6 datasets + loader do JSON |
| `src/tools/Mocke/data/*.json` | Amostras estáticas |
| `scripts/sample-mocke-datasets.py` | One-shot: CSV Mockê → JSON (não roda no build do site) |
| `src/tools/Mocke/MockeView.tsx` | UI completa |
| `src/tools/Mocke/Mocke.tsx` | Entry + `ToolShell` |
| `src/content/posts/tools/mocke.md` | Listagem |
| `src/assets/covers/tools/mocke.webp` | Capa editorial |
| `src/pages/app/[slug].astro` | Import + `case "Mocke"` |

---

### Task 1: Tipos + motor de query (TDD)

**Files:**
- Create: `src/tools/Mocke/domain/types.ts`
- Create: `src/tools/Mocke/domain/query.ts`
- Create: `src/tools/Mocke/domain/query.test.ts`

**Interfaces:**
- Consumes: nada
- Produces:
  - `type DataRecord = Record<string, string>`
  - `type DatasetId = "products" | "cep" | "news" | "movies" | "users" | "companies"`
  - `interface QueryParams { q?: string; searchFields?: readonly string[]; filters?: Readonly<Record<string, string>>; sort?: string; order?: "asc" | "desc"; fields?: readonly string[]; limit?: number }`
  - `function queryDataset(records: readonly DataRecord[], knownFields: readonly string[], params: QueryParams): DataRecord[]`

- [ ] **Step 1: Criar `types.ts`**

```ts
export type DataRecord = Record<string, string>;

export type DatasetId =
	| "products"
	| "cep"
	| "news"
	| "movies"
	| "users"
	| "companies";

export interface QueryParams {
	readonly q?: string;
	readonly searchFields?: readonly string[];
	readonly filters?: Readonly<Record<string, string>>;
	readonly sort?: string;
	readonly order?: "asc" | "desc";
	readonly fields?: readonly string[];
	readonly limit?: number;
}

export interface DatasetMeta {
	readonly id: DatasetId;
	readonly label: string;
	readonly description: string;
	readonly fields: readonly string[];
	readonly idField: string;
	readonly previewFields: readonly string[];
}
```

- [ ] **Step 2: Escrever testes falhando em `query.test.ts`**

```ts
import { describe, expect, it } from "vitest";
import { queryDataset } from "./query";
import type { DataRecord } from "./types";

const fields = ["id", "title", "category", "price", "tags"] as const;

const sample: DataRecord[] = [
	{ id: "1", title: "Alpha Shoes", category: "shoes", price: "10", tags: "sale|new" },
	{ id: "2", title: "Beta Hat", category: "hats", price: "30", tags: "new" },
	{ id: "3", title: "Gamma Shoes", category: "shoes", price: "20", tags: "sale" },
	{ id: "4", title: "Delta Belt", category: "belts", price: "15", tags: "classic,leather" },
];

describe("queryDataset", () => {
	it("filtra por igualdade simples", () => {
		const rows = queryDataset(sample, fields, { filters: { category: "shoes" } });
		expect(rows.map((r) => r.id)).toEqual(["1", "3"]);
	});

	it("OR por vírgula no valor do filtro", () => {
		const rows = queryDataset(sample, fields, { filters: { category: "hats,belts" } });
		expect(rows.map((r) => r.id).sort()).toEqual(["2", "4"]);
	});

	it("bate valor dentro de lista separada por | ou ,", () => {
		const byPipe = queryDataset(sample, fields, { filters: { tags: "sale" } });
		expect(byPipe.map((r) => r.id).sort()).toEqual(["1", "3"]);
		const byComma = queryDataset(sample, fields, { filters: { tags: "leather" } });
		expect(byComma.map((r) => r.id)).toEqual(["4"]);
	});

	it("busca q case-insensitive em todos os campos", () => {
		const rows = queryDataset(sample, fields, { q: "shoes" });
		expect(rows.map((r) => r.id).sort()).toEqual(["1", "3"]);
	});

	it("restringe busca com searchFields", () => {
		const rows = queryDataset(sample, fields, { q: "shoes", searchFields: ["title"] });
		expect(rows.map((r) => r.id).sort()).toEqual(["1", "3"]);
		const none = queryDataset(sample, fields, { q: "shoes", searchFields: ["price"] });
		expect(none).toEqual([]);
	});

	it("ordena asc/desc por campo", () => {
		const asc = queryDataset(sample, fields, {
			filters: { category: "shoes" },
			sort: "price",
			order: "asc",
		});
		expect(asc.map((r) => r.id)).toEqual(["1", "3"]);
		const desc = queryDataset(sample, fields, {
			filters: { category: "shoes" },
			sort: "price",
			order: "desc",
		});
		expect(desc.map((r) => r.id)).toEqual(["3", "1"]);
	});

	it("projeta fields e ignora nomes inválidos", () => {
		const rows = queryDataset(sample, fields, { fields: ["id", "title", "nope"], limit: 1 });
		expect(rows).toEqual([{ id: "1", title: "Alpha Shoes" }]);
	});

	it("fields só inválidos devolve registro completo", () => {
		const rows = queryDataset(sample, fields, { fields: ["nope"], limit: 1 });
		expect(rows[0]).toEqual(sample[0]);
	});

	it("aplica limit com default 20 e clamp", () => {
		const many = Array.from({ length: 25 }, (_, i) => ({
			id: String(i),
			title: `t${i}`,
			category: "x",
			price: "1",
			tags: "",
		}));
		expect(queryDataset(many, fields, {}).length).toBe(20);
		expect(queryDataset(many, fields, { limit: 0 }).length).toBe(20);
		expect(queryDataset(many, fields, { limit: 3 }).length).toBe(3);
		expect(queryDataset(many, fields, { limit: 999 }).length).toBe(25);
	});

	it("ignora filtro/sort em campo desconhecido", () => {
		const rows = queryDataset(sample, fields, {
			filters: { ghost: "1" },
			sort: "ghost",
			order: "desc",
		});
		expect(rows.map((r) => r.id)).toEqual(["1", "2", "3", "4"]);
	});
});
```

- [ ] **Step 3: Rodar testes e confirmar falha**

Run: `npm test -- src/tools/Mocke/domain/query.test.ts`  
Expected: FAIL (módulo `./query` ausente ou exports faltando)

- [ ] **Step 4: Implementar `query.ts`**

```ts
import type { DataRecord, QueryParams } from "./types";

const DEFAULT_LIMIT = 20;

function splitCsv(raw: string): string[] {
	return raw
		.split(",")
		.map((part) => part.trim())
		.filter((part) => part.length > 0);
}

function normalizeListCell(raw: string): string {
	return raw.replaceAll("|", ",").replaceAll(", ", ",");
}

function cellMatchesFilter(cell: string, wanted: string): boolean {
	if (cell === wanted) return true;
	const normalized = `,${normalizeListCell(cell)},`;
	return normalized.includes(`,${wanted},`);
}

function matchesFilters(
	record: DataRecord,
	knownFields: ReadonlySet<string>,
	filters: Readonly<Record<string, string>> | undefined,
): boolean {
	if (!filters) return true;
	for (const [key, raw] of Object.entries(filters)) {
		if (!knownFields.has(key)) continue;
		const values = splitCsv(raw);
		if (values.length === 0) continue;
		const cell = record[key] ?? "";
		const hit = values.some((value) => cellMatchesFilter(cell, value));
		if (!hit) return false;
	}
	return true;
}

function matchesSearch(
	record: DataRecord,
	knownFields: readonly string[],
	params: QueryParams,
): boolean {
	const term = params.q?.trim();
	if (!term) return true;
	const needle = term.toLowerCase();
	const fieldSet = new Set(knownFields);
	const requested = (params.searchFields ?? []).filter((name) => fieldSet.has(name));
	const haystackFields = requested.length > 0 ? requested : knownFields;
	return haystackFields.some((field) => (record[field] ?? "").toLowerCase().includes(needle));
}

function projectRecord(
	record: DataRecord,
	knownFields: ReadonlySet<string>,
	fields: readonly string[] | undefined,
): DataRecord {
	if (!fields || fields.length === 0) return { ...record };
	const requested = fields.filter((name) => knownFields.has(name));
	if (requested.length === 0) return { ...record };
	const projected: DataRecord = {};
	for (const name of requested) {
		projected[name] = record[name] ?? "";
	}
	return projected;
}

function resolveLimit(raw: number | undefined, max: number): number {
	const n = typeof raw === "number" && Number.isFinite(raw) ? Math.trunc(raw) : DEFAULT_LIMIT;
	if (n < 1) return Math.min(DEFAULT_LIMIT, max);
	return Math.min(n, max);
}

export function queryDataset(
	records: readonly DataRecord[],
	knownFields: readonly string[],
	params: QueryParams,
): DataRecord[] {
	const fieldSet = new Set(knownFields);
	let rows = records.filter(
		(record) => matchesFilters(record, fieldSet, params.filters) && matchesSearch(record, knownFields, params),
	);

	const sort = params.sort;
	if (sort && fieldSet.has(sort)) {
		const direction = params.order === "desc" ? -1 : 1;
		rows = [...rows].sort((a, b) => {
			const left = a[sort] ?? "";
			const right = b[sort] ?? "";
			if (left < right) return -1 * direction;
			if (left > right) return 1 * direction;
			return 0;
		});
	}

	const limit = resolveLimit(params.limit, rows.length === 0 ? records.length : rows.length);
	const sliced = rows.slice(0, Math.min(limit, rows.length));
	return sliced.map((record) => projectRecord(record, fieldSet, params.fields));
}
```

Nota: quando `rows.length === 0`, o clamp de `limit` usa `records.length` só para não quebrar math. O slice em array vazio continua `[]`.

- [ ] **Step 5: Rodar testes e confirmar PASS**

Run: `npm test -- src/tools/Mocke/domain/query.test.ts`  
Expected: PASS em todos os casos

- [ ] **Step 6: Commit (só se o usuário pedir)**

```bash
git add src/tools/Mocke/domain/types.ts src/tools/Mocke/domain/query.ts src/tools/Mocke/domain/query.test.ts
git commit -m "$(cat <<'EOF'
test(mocke): adiciona motor de query em memória

EOF
)"
```

---

### Task 2: Amostrar CSVs do Mockê → JSON

**Files:**
- Create: `scripts/sample-mocke-datasets.py`
- Create: `src/tools/Mocke/data/products.json`
- Create: `src/tools/Mocke/data/cep.json`
- Create: `src/tools/Mocke/data/news.json`
- Create: `src/tools/Mocke/data/movies.json`
- Create: `src/tools/Mocke/data/users.json`
- Create: `src/tools/Mocke/data/companies.json`

**Interfaces:**
- Consumes: CSVs em `/home/andre/Projetos/mocke/data/` (path configurável)
- Produces: arrays JSON de até 100 objetos `Record<string, string>`

- [ ] **Step 1: Criar o script**

```python
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
            cleaned = {key: ("" if value is None else str(value)) for key, value in row.items() if key is not None}
            rows.append(cleaned)
            if len(rows) >= limit:
                break
    return rows


def main() -> int:
    source_root = Path(sys.argv[1]) if len(sys.argv) > 1 else Path("/home/andre/Projetos/mocke/data")
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
        out_path.write_text(json.dumps(rows, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        print(f"{dataset_id}: {len(rows)} → {out_path}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
```

- [ ] **Step 2: Rodar o script**

Run: `python3 scripts/sample-mocke-datasets.py /home/andre/Projetos/mocke/data`  
Expected: seis linhas `products: 100 → ...` (ou menos se o CSV for menor, ex. usuários). Arquivos em `src/tools/Mocke/data/`.

- [ ] **Step 3: Sanity check rápido**

Run:

```bash
python3 - <<'PY'
import json
from pathlib import Path
root = Path("src/tools/Mocke/data")
for p in sorted(root.glob("*.json")):
    data = json.loads(p.read_text())
    assert isinstance(data, list) and len(data) > 0
    assert all(isinstance(v, str) for v in data[0].values())
    print(p.name, len(data), list(data[0])[:4])
PY
```

Expected: 6 arquivos, counts > 0, valores string.

- [ ] **Step 4: Commit (só se o usuário pedir)**

```bash
git add scripts/sample-mocke-datasets.py src/tools/Mocke/data
git commit -m "$(cat <<'EOF'
chore(mocke): adiciona amostras JSON dos datasets

EOF
)"
```

---

### Task 3: Catálogo + loader

**Files:**
- Create: `src/tools/Mocke/domain/catalog.ts`

**Interfaces:**
- Consumes: `DatasetMeta` / `DatasetId` / `DataRecord` de `types.ts`, JSON em `../data/*.json`
- Produces:
  - `export const DATASETS: readonly DatasetMeta[]`
  - `export function getDatasetMeta(id: DatasetId): DatasetMeta`
  - `export function loadDatasetRecords(id: DatasetId): readonly DataRecord[]`

- [ ] **Step 1: Implementar `catalog.ts`**

Campos e `previewFields` alinhados aos schemas do Mockê:

```ts
import type { DataRecord, DatasetId, DatasetMeta } from "./types";
import products from "../data/products.json";
import cep from "../data/cep.json";
import news from "../data/news.json";
import movies from "../data/movies.json";
import users from "../data/users.json";
import companies from "../data/companies.json";

export const DATASETS: readonly DatasetMeta[] = [
	{
		id: "products",
		label: "Produtos",
		description: "Catálogo de e-commerce para listagens e filtros de categoria.",
		idField: "id",
		previewFields: ["id", "title", "brand"],
		fields: [
			"id",
			"source",
			"title",
			"description",
			"brand",
			"category",
			"price",
			"listPrice",
			"packSize",
			"images",
			"url",
			"stars",
			"reviews",
			"inStock",
			"isBestSeller",
			"boughtInLastMonth",
		],
	},
	{
		id: "cep",
		label: "CEPs",
		description: "CEP brasileiro com longitude e latitude.",
		idField: "POSTCODE",
		previewFields: ["POSTCODE", "LAT", "LON"],
		fields: ["POSTCODE", "LON", "LAT"],
	},
	{
		id: "news",
		label: "Notícias",
		description: "Artigos com título, assunto e data.",
		idField: "id",
		previewFields: ["id", "title", "subject"],
		fields: ["id", "title", "text", "subject", "date"],
	},
	{
		id: "movies",
		label: "Filmes",
		description: "Filmes com gêneros, elenco e métricas.",
		idField: "id",
		previewFields: ["id", "title", "release_date"],
		fields: [
			"id",
			"title",
			"original_title",
			"original_language",
			"overview",
			"tagline",
			"status",
			"release_date",
			"runtime",
			"budget",
			"revenue",
			"popularity",
			"vote_average",
			"vote_count",
			"homepage",
			"genres",
			"keywords",
			"production_companies",
			"production_countries",
			"spoken_languages",
			"cast",
			"directors",
		],
	},
	{
		id: "users",
		label: "Usuários",
		description: "Usuários fake estilo randomuser.",
		idField: "id",
		previewFields: ["id", "first_name", "email"],
		fields: [
			"id",
			"first_name",
			"last_name",
			"email",
			"username",
			"gender",
			"age",
			"birth_date",
			"phone",
			"cell",
			"street",
			"city",
			"state",
			"country",
			"postcode",
			"latitude",
			"longitude",
			"nationality",
			"picture",
			"registered_at",
		],
	},
	{
		id: "companies",
		label: "Empresas",
		description: "Empresas com indústria, porte e localização.",
		idField: "id",
		previewFields: ["id", "name", "industry"],
		fields: [
			"id",
			"name",
			"domain",
			"year_founded",
			"industry",
			"size_range",
			"locality",
			"country",
			"linkedin_url",
			"current_employee_estimate",
			"total_employee_estimate",
		],
	},
] as const;

const BY_ID: Record<DatasetId, DatasetMeta> = Object.fromEntries(
	DATASETS.map((meta) => [meta.id, meta]),
) as Record<DatasetId, DatasetMeta>;

const RECORDS: Record<DatasetId, readonly DataRecord[]> = {
	products: products as DataRecord[],
	cep: cep as DataRecord[],
	news: news as DataRecord[],
	movies: movies as DataRecord[],
	users: users as DataRecord[],
	companies: companies as DataRecord[],
};

export function getDatasetMeta(id: DatasetId): DatasetMeta {
	return BY_ID[id];
}

export function loadDatasetRecords(id: DatasetId): readonly DataRecord[] {
	return RECORDS[id];
}
```

Se o `resolveJsonModule` / tipagem reclamar dos imports JSON, use `with { type: "json" }` no import (mesmo padrão do Mockê) ou garanta `resolveJsonModule: true` no `tsconfig` do site (já costuma estar).

- [ ] **Step 2: Smoke TypeScript do catálogo**

Run: `npx tsc --noEmit` (ou `npm run lint`)  
Expected: sem erro novo em `catalog.ts`. Se `as DataRecord[]` for o único ponto frágil, mantenha o cast estreito (JSON tipado como unknown seria overkill aqui).

- [ ] **Step 3: Commit (só se o usuário pedir)**

```bash
git add src/tools/Mocke/domain/catalog.ts
git commit -m "$(cat <<'EOF'
feat(mocke): adiciona catálogo e loader dos datasets

EOF
)"
```

---

### Task 4: UI `MockeView`

**Files:**
- Create: `src/tools/Mocke/MockeView.tsx`

**Interfaces:**
- Consumes: `DATASETS`, `getDatasetMeta`, `loadDatasetRecords`, `queryDataset`, classes `@/lib/toolUi`
- Produces: componente exportado `MockeView`

- [ ] **Step 1: Implementar a view**

Comportamento obrigatório da spec:

- Select nativo de dataset
- `q`, multi-select `searchFields` (select `multiple` nativo)
- Filtros dinâmicos campo+valor (add/remove)
- `sort` + `order`
- multi-select `fields`
- `limit` (number input)
- Troca de dataset: zera filtros/sort/fields/searchFields, mantém `q` e `limit` (re-clamp)
- Preview: “N de M”, lista dos primeiros min(20, result.length) com `idField` + `previewFields`
- Copiar: `JSON.stringify(result, null, 2)` (array completo pós-query, inclusive `[]`)
- Feedback “Copiado” / erro curto

Esqueleto (implementar completo no arquivo, sem deixar stubs):

```tsx
import { useMemo, useState } from "react";
import { Copy, Plus, Trash2 } from "lucide-react";
import {
	toolBtnGhostClass,
	toolBtnPrimaryClass,
	toolInputClass,
	toolLabelClass,
	toolPanelClass,
} from "@/lib/toolUi";
import { DATASETS, getDatasetMeta, loadDatasetRecords } from "./domain/catalog";
import { queryDataset } from "./domain/query";
import type { DatasetId, QueryParams } from "./domain/types";

interface FilterRow {
	readonly key: string;
	readonly field: string;
	readonly value: string;
}

function newFilterRow(): FilterRow {
	return { key: crypto.randomUUID(), field: "", value: "" };
}

function clampLimit(raw: number, max: number): number {
	if (!Number.isFinite(raw) || raw < 1) return Math.min(20, max);
	return Math.min(Math.trunc(raw), max);
}

export function MockeView() {
	const [datasetId, setDatasetId] = useState<DatasetId>("products");
	const meta = getDatasetMeta(datasetId);
	const records = loadDatasetRecords(datasetId);

	const [q, setQ] = useState("");
	const [searchFields, setSearchFields] = useState<string[]>([]);
	const [filters, setFilters] = useState<FilterRow[]>([newFilterRow()]);
	const [sort, setSort] = useState("");
	const [order, setOrder] = useState<"asc" | "desc">("asc");
	const [fields, setFields] = useState<string[]>([]);
	const [limit, setLimit] = useState(20);
	const [copyStatus, setCopyStatus] = useState<"idle" | "ok" | "err">("idle");

	const params: QueryParams = useMemo(() => {
		const filterMap: Record<string, string> = {};
		for (const row of filters) {
			if (!row.field || !row.value.trim()) continue;
			filterMap[row.field] = row.value.trim();
		}
		return {
			q: q.trim() || undefined,
			searchFields: searchFields.length > 0 ? searchFields : undefined,
			filters: Object.keys(filterMap).length > 0 ? filterMap : undefined,
			sort: sort || undefined,
			order,
			fields: fields.length > 0 ? fields : undefined,
			limit: clampLimit(limit, records.length),
		};
	}, [q, searchFields, filters, sort, order, fields, limit, records.length]);

	const result = useMemo(
		() => queryDataset(records, meta.fields, params),
		[records, meta.fields, params],
	);

	const matchedBeforeLimit = useMemo(() => {
		const unlimited = queryDataset(records, meta.fields, { ...params, limit: records.length || 1 });
		return unlimited.length;
	}, [records, meta.fields, params]);

	function onDatasetChange(next: DatasetId) {
		setDatasetId(next);
		setSearchFields([]);
		setFilters([newFilterRow()]);
		setSort("");
		setOrder("asc");
		setFields([]);
		const nextLen = loadDatasetRecords(next).length;
		setLimit((prev) => clampLimit(prev, nextLen));
	}

	async function copyJson() {
		try {
			if (!navigator.clipboard?.writeText) throw new Error("Clipboard indisponível");
			await navigator.clipboard.writeText(JSON.stringify(result, null, 2));
			setCopyStatus("ok");
		} catch {
			setCopyStatus("err");
		}
		window.setTimeout(() => setCopyStatus("idle"), 2000);
	}

	const previewRows = result.slice(0, 20);
	const copyLabel =
		copyStatus === "ok" ? "Copiado" : copyStatus === "err" ? "Falha ao copiar" : "Copiar JSON";

	return (
		<div className="flex flex-col gap-md lg:flex-row lg:items-start">
			<section className={`${toolPanelClass} flex w-full flex-col gap-sm lg:max-w-md`}>
				<label className="flex flex-col gap-2xs">
					<span className={toolLabelClass}>Dataset</span>
					<select
						className={toolInputClass}
						value={datasetId}
						onChange={(e) => onDatasetChange(e.target.value as DatasetId)}
					>
						{DATASETS.map((item) => (
							<option key={item.id} value={item.id}>
								{item.label}
							</option>
						))}
					</select>
					<span className="text-sm text-muted">{meta.description}</span>
				</label>

				<label className="flex flex-col gap-2xs">
					<span className={toolLabelClass}>Busca (q)</span>
					<input
						className={toolInputClass}
						value={q}
						onChange={(e) => setQ(e.target.value)}
						placeholder="texto livre"
					/>
				</label>

				<label className="flex flex-col gap-2xs">
					<span className={toolLabelClass}>searchFields</span>
					<select
						multiple
						className={`${toolInputClass} min-h-24`}
						value={searchFields}
						onChange={(e) =>
							setSearchFields(Array.from(e.target.selectedOptions, (opt) => opt.value))
						}
					>
						{meta.fields.map((field) => (
							<option key={field} value={field}>
								{field}
							</option>
						))}
					</select>
				</label>

				<div className="flex flex-col gap-2xs">
					<span className={toolLabelClass}>Filtros</span>
					{filters.map((row) => (
						<div key={row.key} className="flex flex-col gap-2xs lg:flex-row">
							<select
								className={toolInputClass}
								value={row.field}
								onChange={(e) =>
									setFilters((prev) =>
										prev.map((item) =>
											item.key === row.key ? { ...item, field: e.target.value } : item,
										),
									)
								}
							>
								<option value="">campo</option>
								{meta.fields.map((field) => (
									<option key={field} value={field}>
										{field}
									</option>
								))}
							</select>
							<input
								className={toolInputClass}
								value={row.value}
								placeholder="valor (a,b = OR)"
								onChange={(e) =>
									setFilters((prev) =>
										prev.map((item) =>
											item.key === row.key ? { ...item, value: e.target.value } : item,
										),
									)
								}
							/>
							<button
								type="button"
								className={toolBtnGhostClass}
								onClick={() => setFilters((prev) => prev.filter((item) => item.key !== row.key))}
								aria-label="Remover filtro"
							>
								<Trash2 className="size-4" />
							</button>
						</div>
					))}
					<button
						type="button"
						className={toolBtnGhostClass}
						onClick={() => setFilters((prev) => [...prev, newFilterRow()])}
					>
						<Plus className="size-4" />
						Filtro
					</button>
				</div>

				<div className="flex flex-col gap-2xs lg:flex-row">
					<label className="flex min-w-0 flex-1 flex-col gap-2xs">
						<span className={toolLabelClass}>sort</span>
						<select className={toolInputClass} value={sort} onChange={(e) => setSort(e.target.value)}>
							<option value="">nenhum</option>
							{meta.fields.map((field) => (
								<option key={field} value={field}>
									{field}
								</option>
							))}
						</select>
					</label>
					<label className="flex w-full flex-col gap-2xs lg:w-28">
						<span className={toolLabelClass}>order</span>
						<select
							className={toolInputClass}
							value={order}
							onChange={(e) => setOrder(e.target.value as "asc" | "desc")}
						>
							<option value="asc">asc</option>
							<option value="desc">desc</option>
						</select>
					</label>
				</div>

				<label className="flex flex-col gap-2xs">
					<span className={toolLabelClass}>fields</span>
					<select
						multiple
						className={`${toolInputClass} min-h-24`}
						value={fields}
						onChange={(e) => setFields(Array.from(e.target.selectedOptions, (opt) => opt.value))}
					>
						{meta.fields.map((field) => (
							<option key={field} value={field}>
								{field}
							</option>
						))}
					</select>
				</label>

				<label className="flex flex-col gap-2xs">
					<span className={toolLabelClass}>limit</span>
					<input
						type="number"
						min={1}
						max={records.length}
						className={toolInputClass}
						value={limit}
						onChange={(e) => setLimit(Number(e.target.value))}
					/>
				</label>
			</section>

			<section className={`${toolPanelClass} flex min-w-0 flex-1 flex-col gap-sm`}>
				<div className="flex flex-col gap-sm lg:flex-row lg:items-center lg:justify-between">
					<p className="text-sm text-ink-2">
						{result.length} de {matchedBeforeLimit} (amostra {records.length})
					</p>
					<button type="button" className={toolBtnPrimaryClass} onClick={() => void copyJson()}>
						<Copy className="size-4" />
						{copyLabel}
					</button>
				</div>

				{previewRows.length === 0 ? (
					<p className="text-sm text-muted">0 registros. Copiar grava [].</p>
				) : (
					<ul className="flex flex-col gap-2xs">
						{previewRows.map((row) => {
							const key = row[meta.idField] ?? JSON.stringify(row);
							const bits = meta.previewFields
								.map((field) => row[field] ?? "")
								.filter(Boolean)
								.join(" · ");
							return (
								<li key={key} className="rounded-input border border-rule px-sm py-2 text-sm text-ink-2">
									{bits}
								</li>
							);
						})}
					</ul>
				)}
			</section>
		</div>
	);
}
```

Contagem: `{result.length} de {matchedBeforeLimit}`. Preview visual cap em 20. Clipboard leva `result` completo.

- [ ] **Step 2: Lint do arquivo**

Run: `npx biome check src/tools/Mocke/MockeView.tsx`  
Expected: limpo (ou só avisos já padronizados no repo)

- [ ] **Step 3: Commit (só se o usuário pedir)**

```bash
git add src/tools/Mocke/MockeView.tsx
git commit -m "$(cat <<'EOF'
feat(mocke): adiciona UI de filtros e cópia de JSON

EOF
)"
```

---

### Task 5: Entry, post, rota e capa

**Files:**
- Create: `src/tools/Mocke/Mocke.tsx`
- Create: `src/content/posts/tools/mocke.md`
- Create: `src/assets/covers/tools/mocke.webp`
- Modify: `src/pages/app/[slug].astro`

**Interfaces:**
- Consumes: `MockeView`
- Produces: tool listável em `/app/mocke/`

- [ ] **Step 1: Entry**

```tsx
import { Database } from "lucide-react";
import { ToolShell } from "../ToolShell";
import { MockeView } from "./MockeView";

export default function Mocke() {
	return (
		<ToolShell
			title="Mockê"
			description="Gera e copia JSON de datasets mock (produtos, usuários, CEPs…) no navegador."
			icon={<Database className="size-6" strokeWidth={2} />}
		>
			<MockeView />
		</ToolShell>
	);
}
```

- [ ] **Step 2: Post**

```md
---
slug: "mocke"
type: tool
title: "Mockê"
description: "Gera e copia JSON de datasets mock (produtos, usuários, CEPs…) no navegador."
date: 2026-11-14
target: "Mocke"
cover: "../../../assets/covers/tools/mocke.webp"
---
```

- [ ] **Step 3: Registrar na rota**

Em `src/pages/app/[slug].astro`:

1. Adicionar import:

```astro
import Mocke from "../../tools/Mocke/Mocke";
```

2. Adicionar case antes do `default`:

```astro
case "Mocke":
	return <Mocke client:load />;
```

- [ ] **Step 4: Capa editorial**

Gerar `src/assets/covers/tools/mocke.webp` (~16:10, ~1200px de largura): metáfora literal de dados/mock/fixtures (não screenshot da UI). Seguir o brief de capas do projeto se existir em docs. Se geração de imagem não estiver disponível na sessão, copiar temporariamente uma capa existente e renomear, depois substituir.

- [ ] **Step 5: Commit (só se o usuário pedir)**

```bash
git add src/tools/Mocke/Mocke.tsx src/content/posts/tools/mocke.md src/assets/covers/tools/mocke.webp src/pages/app/\[slug\].astro
git commit -m "$(cat <<'EOF'
feat(mocke): registra tool Mockê no site

EOF
)"
```

---

### Task 6: Verificação final

**Files:**
- Verify only

- [ ] **Step 1: Testes**

Run: `npm test -- src/tools/Mocke/domain/query.test.ts`  
Expected: PASS

- [ ] **Step 2: Lint + check**

Run: `npm run lint`  
Expected: exit 0

- [ ] **Step 3: Build**

Run: `npm run build`  
Expected: exit 0, rota `/app/mocke/` gerada

- [ ] **Step 4: Smoke manual**

Run: `npm run dev`  
Abrir `/app/mocke/`:

1. Trocar dataset → preview muda, filtros resetam
2. `q` + filtro de campo + sort + fields + limit → lista atualiza
3. Copiar → colar em editor = array JSON válido
4. Filtro sem match → “0 …” e clipboard `[]`

---

## Self-review do plano (checklist)

| Spec | Task |
|------|------|
| Motor query completo | Task 1 |
| Datasets enxutos JSON | Task 2 |
| Catálogo 6 datasets | Task 3 |
| UI filtros + preview + copiar | Task 4 |
| tools.md integração + capa | Task 5 |
| lint/build/smoke | Task 6 |
| Sem storage/API/auth | Global + fora das tasks |
| Array puro no clipboard | Task 4 |
| Troca de dataset limpa schema-bound state | Task 4 |
| Preview cap 20 / clipboard completo | Task 4 |

Sem placeholders TBD. Assinaturas `queryDataset` / `DatasetMeta` consistentes entre tasks.
