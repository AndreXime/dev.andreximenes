import { Check, Plus, ShoppingCart, Trash2, Wrench } from "lucide-react";
import { useMemo, useState } from "react";
import {
	toolBtnGhostClass,
	toolBtnPrimaryClass,
	toolChipClass,
	toolEmptyPanelClass,
	toolIconBtnClass,
	toolInputClass,
	toolLabelClass,
} from "@/lib/toolUi";
import type { PantryState, Pending } from "../domain";
import { createPending, deletePending, finishPurchase, finishTask } from "../store";
import { RestockDialog } from "./RestockDialog";

type FilterId = "open" | "done" | "purchase" | "task";

interface PendingTabProps {
	readonly state: PantryState;
}

export function PendingTab({ state }: PendingTabProps) {
	const [filter, setFilter] = useState<FilterId>("open");
	const [draftKind, setDraftKind] = useState<"purchase" | "task" | null>(null);
	const [draftTitle, setDraftTitle] = useState("");
	const [restockTarget, setRestockTarget] = useState<Pending | null>(null);

	const filters: { id: FilterId; label: string }[] = [
		{ id: "open", label: "Abertas" },
		{ id: "done", label: "Feitas" },
		{ id: "purchase", label: "Compras" },
		{ id: "task", label: "Tarefas" },
	];

	const list = useMemo(() => {
		return state.pendings
			.filter((p) => {
				if (filter === "open") return !p.done;
				if (filter === "done") return p.done;
				if (filter === "purchase") return p.kind === "purchase";
				return p.kind === "task";
			})
			.sort((a, b) => {
				if (a.done !== b.done) return a.done ? 1 : -1;
				return b.createdAt.localeCompare(a.createdAt);
			});
	}, [state.pendings, filter]);

	function submitDraft() {
		if (draftKind === null) return;
		if (!createPending(draftKind, draftTitle)) return;
		setDraftTitle("");
		setDraftKind(null);
	}

	return (
		<div className="flex flex-col gap-md">
			<div className="flex flex-col gap-sm lg:flex-row lg:items-center lg:justify-between">
				<div className="flex flex-wrap gap-2xs">
					{filters.map((f) => (
						<button key={f.id} type="button" className={toolChipClass(filter === f.id)} onClick={() => setFilter(f.id)}>
							{f.label}
						</button>
					))}
				</div>
				<div className="flex flex-col gap-2xs lg:flex-row">
					<button
						type="button"
						className={toolBtnGhostClass}
						onClick={() => {
							setDraftKind("purchase");
							setDraftTitle("");
						}}
					>
						<ShoppingCart className="size-4" strokeWidth={2} />
						Adicionar compra
					</button>
					<button
						type="button"
						className={toolBtnPrimaryClass}
						onClick={() => {
							setDraftKind("task");
							setDraftTitle("");
						}}
					>
						<Plus className="size-4" strokeWidth={2.5} />
						Nova tarefa
					</button>
				</div>
			</div>

			{draftKind !== null && (
				<form
					className="flex flex-col gap-sm rounded-card border border-rule bg-paper-2 p-md lg:flex-row lg:items-end"
					onSubmit={(e) => {
						e.preventDefault();
						submitDraft();
					}}
				>
					<label className="flex min-w-0 flex-1 flex-col gap-2xs">
						<span className={toolLabelClass}>{draftKind === "task" ? "Tarefa" : "Compra"}</span>
						<input
							className={toolInputClass}
							value={draftTitle}
							onChange={(e) => setDraftTitle(e.target.value)}
							placeholder={draftKind === "task" ? "Ex.: instalar prateleira" : "Ex.: esponja"}
						/>
					</label>
					<div className="flex gap-2xs">
						<button type="button" className={toolBtnGhostClass} onClick={() => setDraftKind(null)}>
							Cancelar
						</button>
						<button type="submit" className={toolBtnPrimaryClass} disabled={draftTitle.trim() === ""}>
							Adicionar
						</button>
					</div>
				</form>
			)}

			{list.length === 0 ? (
				<div className={toolEmptyPanelClass}>
					Nenhuma pendência aqui. Essenciais abaixo do mínimo aparecem sozinhos.
				</div>
			) : (
				<ul className="flex flex-col gap-2xs">
					{list.map((p) => (
						<li
							key={p.id}
							className="flex flex-col gap-sm rounded-card border border-rule bg-paper-2 p-md lg:flex-row lg:items-center lg:justify-between"
						>
							<div className="flex min-w-0 items-start gap-sm">
								<span className="mt-0.5 text-muted">
									{p.kind === "purchase" ? (
										<ShoppingCart className="size-4" strokeWidth={2} />
									) : (
										<Wrench className="size-4" strokeWidth={2} />
									)}
								</span>
								<div className="min-w-0">
									<p className={["font-semibold text-ink", p.done ? "line-through opacity-60" : ""].join(" ")}>
										{p.title}
									</p>
									<p className="mt-2xs text-sm text-muted">
										{p.kind === "purchase" ? "Compra" : "Tarefa"}
										{p.auto ? " · da dispensa" : ""}
										{p.done && p.completedAt ? ` · feita ${p.completedAt.slice(0, 10)}` : ""}
									</p>
								</div>
							</div>
							<div className="flex items-center gap-2xs">
								{!p.done && (
									<button
										type="button"
										className={toolBtnGhostClass}
										onClick={() => {
											if (p.kind === "purchase") {
												setRestockTarget(p);
											} else {
												finishTask(p.id);
											}
										}}
									>
										<Check className="size-4" strokeWidth={2} />
										Concluir
									</button>
								)}
								<button
									type="button"
									className={toolIconBtnClass}
									aria-label={`Excluir ${p.title}`}
									onClick={() => deletePending(p.id)}
								>
									<Trash2 className="size-4" strokeWidth={2} />
								</button>
							</div>
						</li>
					))}
				</ul>
			)}

			<RestockDialog
				open={restockTarget !== null}
				productName={restockTarget?.title ?? ""}
				unit={
					restockTarget?.productId
						? (state.products.find((pr) => pr.id === restockTarget.productId)?.unit ?? "un")
						: "un"
				}
				onCancel={() => setRestockTarget(null)}
				onConfirm={(qty) => {
					if (restockTarget === null) return;
					finishPurchase(restockTarget.id, qty);
					setRestockTarget(null);
				}}
			/>
		</div>
	);
}
