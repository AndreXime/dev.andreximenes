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

function matchesSearch(record: DataRecord, knownFields: readonly string[], params: QueryParams): boolean {
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
