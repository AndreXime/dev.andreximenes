import { Minus, Pencil, Plus, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import {
	toolAlertDangerClass,
	toolAlertWarningClass,
	toolBtnPrimaryClass,
	toolChipClass,
	toolEmptyPanelClass,
	toolIconBtnClass,
	toolInputClass,
	toolLabelClass,
} from "@/lib/toolUi";
import { expiryStatus, localDateKey, needsRestock, type PantryState, type Product } from "../domain";
import { bumpQuantity, deleteProduct, saveProduct } from "../store";
import { ProductForm, type ProductFormValues } from "./ProductForm";

type FilterId = "all" | "essential" | "low" | "expiry";

interface PantryTabProps {
	readonly state: PantryState;
}

export function PantryTab({ state }: PantryTabProps) {
	const [query, setQuery] = useState("");
	const [filter, setFilter] = useState<FilterId>("all");
	const [creating, setCreating] = useState(false);
	const [editing, setEditing] = useState<Product | null>(null);
	const today = localDateKey();

	const filters: { id: FilterId; label: string }[] = [
		{ id: "all", label: "Todos" },
		{ id: "essential", label: "Essenciais" },
		{ id: "low", label: "Estoque baixo" },
		{ id: "expiry", label: "Validade" },
	];

	const list = useMemo(() => {
		const q = query.trim().toLowerCase();
		return state.products
			.filter((p) => {
				if (q !== "" && !p.name.toLowerCase().includes(q) && !p.notes.toLowerCase().includes(q)) {
					return false;
				}
				if (filter === "essential") return p.essential;
				if (filter === "low") return needsRestock(p);
				if (filter === "expiry") {
					const status = expiryStatus(p.expiresOn, today);
					return status === "expired" || status === "expiringSoon";
				}
				return true;
			})
			.sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
	}, [state.products, query, filter, today]);

	const showForm = creating || editing !== null;

	function handleSave(values: ProductFormValues) {
		const id = saveProduct({
			...(editing ? { id: editing.id } : {}),
			...values,
		});
		if (id === "") return;
		setCreating(false);
		setEditing(null);
	}

	function openCreate() {
		setEditing(null);
		setCreating(true);
	}

	function openEdit(p: Product) {
		setCreating(false);
		setEditing(p);
	}

	function cancelForm() {
		setCreating(false);
		setEditing(null);
	}

	return (
		<div className="flex flex-col gap-md">
			<div className="flex flex-col gap-sm lg:flex-row lg:items-center lg:justify-between">
				<input
					className={toolInputClass}
					value={query}
					onChange={(e) => setQuery(e.target.value)}
					placeholder="Buscar produto…"
					aria-label="Buscar produto"
				/>
				{!showForm && (
					<button type="button" className={toolBtnPrimaryClass} onClick={openCreate}>
						<Plus className="size-4" strokeWidth={2.5} />
						Novo produto
					</button>
				)}
			</div>

			<div className="flex flex-wrap gap-2xs">
				{filters.map((f) => (
					<button key={f.id} type="button" className={toolChipClass(filter === f.id)} onClick={() => setFilter(f.id)}>
						{f.label}
					</button>
				))}
			</div>

			{showForm && <ProductForm initial={editing} onSave={handleSave} onCancel={cancelForm} />}

			{list.length === 0 ? (
				<div className={toolEmptyPanelClass}>
					{state.products.length === 0
						? "Nenhum produto ainda. Cadastre o que tem na dispensa."
						: "Nenhum produto neste filtro."}
				</div>
			) : (
				<ul className="flex flex-col gap-2xs">
					{list.map((p) => {
						const status = expiryStatus(p.expiresOn, today);
						const low = needsRestock(p);
						return (
							<li
								key={p.id}
								className="flex flex-col gap-sm rounded-card border border-rule bg-paper-2 p-md lg:flex-row lg:items-center lg:justify-between"
							>
								<div className="min-w-0 flex-1">
									<div className="flex flex-wrap items-center gap-2xs">
										<span className="font-semibold text-ink">{p.name}</span>
										{p.essential && (
											<span className="rounded-input border border-accent-muted bg-accent-bg px-2xs py-0.5 text-xs font-medium text-accent">
												Essencial
											</span>
										)}
										{low && (
											<span className="rounded-input border border-warning/25 bg-warning-bg px-2xs py-0.5 text-xs font-medium text-warning">
												Estoque baixo
											</span>
										)}
									</div>
									<p className="mt-2xs text-sm text-muted">
										{p.quantity} / mín. {p.minQuantity} {p.unit}
										{p.expiresOn ? ` · validade ${p.expiresOn}` : ""}
									</p>
									{status === "expired" && <p className={`${toolAlertDangerClass} mt-2xs`}>Vencido</p>}
									{status === "expiringSoon" && <p className={`${toolAlertWarningClass} mt-2xs`}>Vence em breve</p>}
									{p.notes.trim() !== "" && <p className="mt-2xs text-sm text-ink-2">{p.notes}</p>}
								</div>
								<div className="flex items-center gap-2xs">
									<button
										type="button"
										className={toolIconBtnClass}
										aria-label={`Diminuir ${p.name}`}
										onClick={() => bumpQuantity(p.id, -1)}
									>
										<Minus className="size-4" strokeWidth={2} />
									</button>
									<span className={`${toolLabelClass} min-w-8 text-center`}>{p.quantity}</span>
									<button
										type="button"
										className={toolIconBtnClass}
										aria-label={`Aumentar ${p.name}`}
										onClick={() => bumpQuantity(p.id, 1)}
									>
										<Plus className="size-4" strokeWidth={2} />
									</button>
									<button
										type="button"
										className={toolIconBtnClass}
										aria-label={`Editar ${p.name}`}
										onClick={() => openEdit(p)}
									>
										<Pencil className="size-4" strokeWidth={2} />
									</button>
									<button
										type="button"
										className={toolIconBtnClass}
										aria-label={`Excluir ${p.name}`}
										onClick={() => {
											if (window.confirm(`Excluir “${p.name}”?`)) deleteProduct(p.id);
										}}
									>
										<Trash2 className="size-4" strokeWidth={2} />
									</button>
								</div>
							</li>
						);
					})}
				</ul>
			)}
		</div>
	);
}
