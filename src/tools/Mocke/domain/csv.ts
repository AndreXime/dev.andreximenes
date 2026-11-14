import type { DataRecord } from "./types";

function escapeCsvCell(value: string): string {
	if (/[",\n\r]/.test(value)) {
		return `"${value.replaceAll('"', '""')}"`;
	}
	return value;
}

export function recordsToCsv(rows: readonly DataRecord[]): string {
	if (rows.length === 0) return "";

	const columns = Object.keys(rows[0] ?? {});
	if (columns.length === 0) return "";

	const header = columns.map(escapeCsvCell).join(",");
	const lines = rows.map((row) => columns.map((column) => escapeCsvCell(row[column] ?? "")).join(","));
	return [header, ...lines].join("\n");
}
