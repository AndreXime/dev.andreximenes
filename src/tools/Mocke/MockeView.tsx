import { Copy, Loader2, Plus, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
	toolBtnGhostClass,
	toolBtnPrimaryClass,
	toolEmptyPanelClass,
	toolInputClass,
	toolLabelClass,
	toolPanelClass,
} from "@/lib/toolUi";
import { DATASETS, getDatasetMeta, loadDatasetRecords } from "./domain/catalog";
import { recordsToCsv } from "./domain/csv";
import { queryDataset } from "./domain/query";
import type { DataRecord, DatasetId, QueryParams } from "./domain/types";

interface EqFilterRow {
	readonly key: string;
	readonly kind: "eq";
	readonly field: string;
	readonly value: string;
}

interface TextFilterRow {
	readonly key: string;
	readonly kind: "text";
	readonly value: string;
	readonly searchFields: readonly string[];
}

type FilterRow = EqFilterRow | TextFilterRow;

type LoadState = "loading" | "ready" | "error";

function newEqFilterRow(): EqFilterRow {
	return { key: crypto.randomUUID(), kind: "eq", field: "", value: "" };
}

function newTextFilterRow(): TextFilterRow {
	return { key: crypto.randomUUID(), kind: "text", value: "", searchFields: [] };
}

function FieldCheckboxList(props: {
	readonly legend: string;
	readonly fields: readonly string[];
	readonly selected: readonly string[];
	readonly hint: string;
	readonly onToggle: (field: string) => void;
}) {
	const { legend, fields, selected, hint, onToggle } = props;
	return (
		<fieldset className="m-0 flex flex-col gap-2xs border-0 p-0">
			<legend className={toolLabelClass}>{legend}</legend>
			<div className="max-h-40 overflow-y-auto rounded-input border border-rule bg-paper px-sm py-2">
				<ul className="m-0 flex list-none flex-col gap-2xs p-0">
					{fields.map((field) => {
						const checked = selected.includes(field);
						return (
							<li key={field}>
								<label className="flex cursor-pointer items-center gap-2xs text-sm text-ink-2">
									<input
										type="checkbox"
										className="size-4 accent-accent"
										checked={checked}
										onChange={() => onToggle(field)}
									/>
									<span className="font-mono text-xs">{field}</span>
								</label>
							</li>
						);
					})}
				</ul>
			</div>
			<span className="text-xs text-muted">{hint}</span>
		</fieldset>
	);
}

function clampLimit(raw: number, max: number): number {
	if (!Number.isFinite(raw) || raw < 1) return Math.min(20, Math.max(max, 1));
	return Math.min(Math.trunc(raw), Math.max(max, 1));
}

export function MockeView() {
	const [datasetId, setDatasetId] = useState<DatasetId>("products");
	const meta = getDatasetMeta(datasetId);
	const [records, setRecords] = useState<readonly DataRecord[]>([]);
	const [loadState, setLoadState] = useState<LoadState>("loading");

	const [filters, setFilters] = useState<FilterRow[]>([]);
	const [sort, setSort] = useState("");
	const [order, setOrder] = useState<"asc" | "desc">("asc");
	const [fields, setFields] = useState<string[]>(() => [...getDatasetMeta("products").fields]);
	const [limit, setLimit] = useState(20);
	const [copyStatus, setCopyStatus] = useState<"idle" | "json" | "csv" | "err">("idle");

	useEffect(() => {
		let cancelled = false;
		setLoadState("loading");
		setRecords([]);

		void loadDatasetRecords(datasetId)
			.then((rows) => {
				if (cancelled) return;
				setRecords(rows);
				setLimit((prev) => clampLimit(prev, rows.length));
				setLoadState("ready");
			})
			.catch(() => {
				if (cancelled) return;
				setRecords([]);
				setLoadState("error");
			});

		return () => {
			cancelled = true;
		};
	}, [datasetId]);

	const params: QueryParams = useMemo(() => {
		const filterMap: Record<string, string> = {};
		const textTerms: string[] = [];
		const textFields = new Set<string>();

		for (const row of filters) {
			if (row.kind === "eq") {
				if (!row.field || !row.value.trim()) continue;
				filterMap[row.field] = row.value.trim();
				continue;
			}
			const term = row.value.trim();
			if (!term) continue;
			textTerms.push(term);
			for (const field of row.searchFields) textFields.add(field);
		}

		const next: QueryParams = {
			order,
			limit: clampLimit(limit, records.length || 1),
		};
		if (textTerms.length > 0) Object.assign(next, { q: textTerms.join(" ") });
		if (textFields.size > 0) Object.assign(next, { searchFields: [...textFields] });
		if (Object.keys(filterMap).length > 0) Object.assign(next, { filters: filterMap });
		if (sort) Object.assign(next, { sort });
		Object.assign(next, { fields });
		return next;
	}, [filters, sort, order, fields, limit, records.length]);

	const result = useMemo(() => {
		if (loadState !== "ready") return [];
		return queryDataset(records, meta.fields, params);
	}, [loadState, records, meta.fields, params]);

	const matchedBeforeLimit = useMemo(() => {
		if (loadState !== "ready") return 0;
		const unlimited = queryDataset(records, meta.fields, {
			...params,
			limit: records.length || 1,
		});
		return unlimited.length;
	}, [loadState, records, meta.fields, params]);

	function onDatasetChange(next: DatasetId) {
		setDatasetId(next);
		setFilters([]);
		setSort("");
		setOrder("asc");
		setFields([...getDatasetMeta(next).fields]);
	}

	function toggleFieldSelection(selected: readonly string[], field: string): string[] {
		const next = selected.includes(field) ? selected.filter((name) => name !== field) : [...selected, field];
		return meta.fields.filter((name) => next.includes(name));
	}

	function toggleCopiedField(field: string) {
		setFields((prev) => toggleFieldSelection(prev, field));
	}

	function toggleTextSearchField(rowKey: string, field: string) {
		setFilters((prev) =>
			prev.map((item) =>
				item.key === rowKey && item.kind === "text"
					? { ...item, searchFields: toggleFieldSelection(item.searchFields, field) }
					: item,
			),
		);
	}

	async function copyText(payload: string, kind: "json" | "csv") {
		try {
			if (!navigator.clipboard?.writeText) throw new Error("Clipboard indisponível");
			await navigator.clipboard.writeText(payload);
			setCopyStatus(kind);
		} catch {
			setCopyStatus("err");
		}
		window.setTimeout(() => setCopyStatus("idle"), 2000);
	}

	function copyJson() {
		void copyText(JSON.stringify(result, null, 2), "json");
	}

	function copyCsv() {
		void copyText(recordsToCsv(result), "csv");
	}

	const previewRows = result.slice(0, 20);
	const tableColumns = previewRows[0] !== undefined ? Object.keys(previewRows[0]) : [...meta.previewFields];
	const jsonCopyLabel =
		copyStatus === "json" ? "JSON copiado" : copyStatus === "err" ? "Falha ao copiar" : "Copiar JSON";
	const csvCopyLabel = copyStatus === "csv" ? "CSV copiado" : copyStatus === "err" ? "Falha ao copiar" : "Copiar CSV";
	const hasTextFilter = filters.some((row) => row.kind === "text");

	function cellPreview(value: string): string {
		const flat = value.replaceAll(/\s+/g, " ").trim();
		if (flat.length <= 80) return flat;
		return `${flat.slice(0, 77)}...`;
	}

	return (
		<div className="flex flex-col gap-md">
			<section className={`${toolPanelClass} flex w-full flex-col gap-sm`}>
				<p className="m-0 text-sm text-muted">{meta.description}</p>

				<div className="grid grid-cols-1 gap-sm lg:grid-cols-4">
					<label className="flex flex-col gap-2xs lg:col-span-1">
						<span className={toolLabelClass}>Dataset</span>
						<select
							className={toolInputClass}
							value={datasetId}
							disabled={loadState === "loading"}
							onChange={(e) => onDatasetChange(e.target.value as DatasetId)}
						>
							{DATASETS.map((item) => (
								<option key={item.id} value={item.id}>
									{item.label}
								</option>
							))}
						</select>
					</label>

					<label className="flex flex-col gap-2xs lg:col-span-1">
						<span className={toolLabelClass}>Quantidade</span>
						<input
							type="number"
							min={1}
							max={Math.max(records.length, 1)}
							className={toolInputClass}
							value={limit}
							disabled={loadState !== "ready"}
							onChange={(e) => setLimit(Number(e.target.value))}
						/>
					</label>

					<label className="flex flex-col gap-2xs lg:col-span-1">
						<span className={toolLabelClass}>Ordenar por</span>
						<select className={toolInputClass} value={sort} onChange={(e) => setSort(e.target.value)}>
							<option value="">nenhum</option>
							{meta.fields.map((field) => (
								<option key={field} value={field}>
									{field}
								</option>
							))}
						</select>
					</label>

					<label className="flex flex-col gap-2xs lg:col-span-1">
						<span className={toolLabelClass}>Direção</span>
						<select
							className={toolInputClass}
							value={order}
							onChange={(e) => setOrder(e.target.value as "asc" | "desc")}
						>
							<option value="asc">crescente</option>
							<option value="desc">decrescente</option>
						</select>
					</label>
				</div>

				<FieldCheckboxList
					legend="Campos ativados"
					fields={meta.fields}
					selected={fields}
					hint=""
					onToggle={toggleCopiedField}
				/>

				<div className="flex flex-col gap-2xs">
					<span className={toolLabelClass}>Filtros</span>
					{filters.length === 0 ? (
						<p className="m-0 text-sm text-muted">Nenhum filtro. Adicione igualdade por campo ou busca por texto.</p>
					) : null}
					{filters.map((row) =>
						row.kind === "eq" ? (
							<div key={row.key} className="flex flex-col gap-2xs lg:flex-row lg:items-center">
								<span className={`${toolLabelClass} shrink-0 lg:w-24`}>Campo</span>
								<select
									className={toolInputClass}
									value={row.field}
									onChange={(e) =>
										setFilters((prev) =>
											prev.map((item) =>
												item.key === row.key && item.kind === "eq" ? { ...item, field: e.target.value } : item,
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
												item.key === row.key && item.kind === "eq" ? { ...item, value: e.target.value } : item,
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
						) : (
							<div key={row.key} className="flex flex-col gap-2xs rounded-input border border-rule p-sm">
								<div className="flex flex-col gap-2xs lg:flex-row lg:items-center">
									<span className={`${toolLabelClass} shrink-0 lg:w-24`}>Texto</span>
									<input
										className={toolInputClass}
										value={row.value}
										placeholder="busca livre no texto dos campos"
										onChange={(e) =>
											setFilters((prev) =>
												prev.map((item) =>
													item.key === row.key && item.kind === "text" ? { ...item, value: e.target.value } : item,
												),
											)
										}
									/>
									<button
										type="button"
										className={toolBtnGhostClass}
										onClick={() => setFilters((prev) => prev.filter((item) => item.key !== row.key))}
										aria-label="Remover busca por texto"
									>
										<Trash2 className="size-4" />
									</button>
								</div>
								<FieldCheckboxList
									legend="Só nestes campos (opcional)"
									fields={meta.fields}
									selected={row.searchFields}
									hint="Desmarque para tirar campos da busca. Nenhum marcado = busca em todos."
									onToggle={(field) => toggleTextSearchField(row.key, field)}
								/>
							</div>
						),
					)}
					<div className="flex flex-wrap gap-2xs">
						<button
							type="button"
							className={toolBtnGhostClass}
							onClick={() => setFilters((prev) => [...prev, newEqFilterRow()])}
						>
							<Plus className="size-4" />
							Filtro de campo
						</button>
						<button
							type="button"
							className={toolBtnGhostClass}
							disabled={hasTextFilter}
							onClick={() => setFilters((prev) => [...prev, newTextFilterRow()])}
						>
							<Plus className="size-4" />
							Busca por texto
						</button>
					</div>
				</div>
			</section>

			<section className={`${toolPanelClass} flex w-full flex-col gap-sm`}>
				<div className="flex flex-col gap-sm lg:flex-row lg:items-center lg:justify-between">
					<p className="m-0 text-sm text-ink-2">
						{loadState === "loading"
							? "Carregando dataset…"
							: loadState === "error"
								? "Falha ao carregar dataset."
								: `${result.length} de ${matchedBeforeLimit} (amostra ${records.length})`}
					</p>
					<div className="flex flex-wrap gap-2xs">
						<button type="button" className={toolBtnPrimaryClass} disabled={loadState !== "ready"} onClick={copyJson}>
							<Copy className="size-4" />
							{jsonCopyLabel}
						</button>
						<button type="button" className={toolBtnGhostClass} disabled={loadState !== "ready"} onClick={copyCsv}>
							<Copy className="size-4" />
							{csvCopyLabel}
						</button>
					</div>
				</div>

				{loadState === "loading" ? (
					<div className={toolEmptyPanelClass} role="status" aria-live="polite">
						<span className="inline-flex items-center justify-center gap-2xs text-sm text-muted">
							<Loader2 className="size-4 animate-spin" aria-hidden />
							Carregando {meta.label.toLowerCase()}…
						</span>
						<p className="m-0 mt-2 text-xs text-muted">Baixando o dataset sob demanda (~até 1 MB).</p>
					</div>
				) : loadState === "error" ? (
					<p className="m-0 text-sm text-danger">Não foi possível carregar os registros.</p>
				) : previewRows.length === 0 ? (
					<p className="m-0 text-sm text-muted">0 registros. Copiar grava [].</p>
				) : (
					<div className="w-full overflow-x-auto">
						<table className="w-full min-w-full border-collapse text-left text-sm text-ink-2">
							<thead>
								<tr className="border-b border-rule">
									{tableColumns.map((column) => (
										<th
											key={column}
											scope="col"
											className="whitespace-nowrap px-sm py-2 font-mono text-xs font-semibold uppercase tracking-label text-muted"
										>
											{column}
										</th>
									))}
								</tr>
							</thead>
							<tbody>
								{previewRows.map((row, index) => (
									<tr key={row[meta.idField] ?? `row-${index}`} className="border-b border-rule/60 last:border-b-0">
										{tableColumns.map((column) => (
											<td
												key={column}
												className="max-w-56 overflow-hidden px-sm py-2 align-top text-ellipsis whitespace-nowrap"
												title={row[column] ?? ""}
											>
												{cellPreview(row[column] ?? "")}
											</td>
										))}
									</tr>
								))}
							</tbody>
						</table>
					</div>
				)}
			</section>
		</div>
	);
}
