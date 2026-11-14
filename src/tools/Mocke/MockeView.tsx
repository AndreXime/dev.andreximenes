import { Copy, Plus, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { toolBtnGhostClass, toolBtnPrimaryClass, toolInputClass, toolLabelClass, toolPanelClass } from "@/lib/toolUi";
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
		const next: QueryParams = {
			order,
			limit: clampLimit(limit, records.length),
		};
		const trimmedQ = q.trim();
		if (trimmedQ) Object.assign(next, { q: trimmedQ });
		if (searchFields.length > 0) Object.assign(next, { searchFields });
		if (Object.keys(filterMap).length > 0) Object.assign(next, { filters: filterMap });
		if (sort) Object.assign(next, { sort });
		if (fields.length > 0) Object.assign(next, { fields });
		return next;
	}, [q, searchFields, filters, sort, order, fields, limit, records.length]);

	const result = useMemo(() => queryDataset(records, meta.fields, params), [records, meta.fields, params]);

	const matchedBeforeLimit = useMemo(() => {
		const unlimited = queryDataset(records, meta.fields, {
			...params,
			limit: records.length || 1,
		});
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
	const copyLabel = copyStatus === "ok" ? "Copiado" : copyStatus === "err" ? "Falha ao copiar" : "Copiar JSON";

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
						onChange={(e) => setSearchFields(Array.from(e.target.selectedOptions, (opt) => opt.value))}
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
										prev.map((item) => (item.key === row.key ? { ...item, field: e.target.value } : item)),
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
										prev.map((item) => (item.key === row.key ? { ...item, value: e.target.value } : item)),
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
