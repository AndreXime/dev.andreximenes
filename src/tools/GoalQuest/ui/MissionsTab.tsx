import { Archive, Pencil, Plus, ScrollText } from "lucide-react";
import { useMemo, useState } from "react";
import {
	toolBtnGhostClass,
	toolBtnPrimaryClass,
	toolChipClass,
	toolEmptyPanelClass,
	toolLabelClass,
} from "@/lib/toolUi";
import type { Cadence, GoalQuestState, Mission } from "../domain";
import { xpForMission } from "../domain";
import { setMissionActive, upsertMission } from "../store";
import { CADENCE_ICON, CADENCE_LABEL, DIFFICULTY_LABEL } from "./labels";
import { MissionForm, type MissionFormValues } from "./MissionForm";

type FilterId = Cadence | "all" | "archived";

interface MissionsTabProps {
	readonly state: GoalQuestState;
}

export function MissionsTab({ state }: MissionsTabProps) {
	const [filter, setFilter] = useState<FilterId>("all");
	const [creating, setCreating] = useState(false);
	const [editing, setEditing] = useState<Mission | null>(null);

	const filters: { id: FilterId; label: string }[] = [
		{ id: "all", label: "Ativas" },
		{ id: "daily", label: "Diária" },
		{ id: "weekly", label: "Semanal" },
		{ id: "monthly", label: "Mensal" },
		{ id: "once", label: "Data única" },
		{ id: "archived", label: "Arquivadas" },
	];

	const counts = useMemo(() => {
		const active = state.missions.filter((m) => m.active);
		return {
			active: active.length,
			daily: active.filter((m) => m.cadence === "daily").length,
			weekly: active.filter((m) => m.cadence === "weekly").length,
			monthly: active.filter((m) => m.cadence === "monthly").length,
			once: active.filter((m) => m.cadence === "once").length,
			archived: state.missions.filter((m) => !m.active).length,
		};
	}, [state.missions]);

	const list = useMemo(() => {
		if (filter === "archived") {
			return state.missions.filter((m) => !m.active);
		}
		return state.missions.filter((m) => {
			if (!m.active) return false;
			if (filter === "all") return true;
			return m.cadence === filter;
		});
	}, [state.missions, filter]);

	function handleSave(values: MissionFormValues) {
		const id = upsertMission({
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

	function openEdit(m: Mission) {
		setCreating(false);
		setEditing(m);
	}

	function cancelForm() {
		setCreating(false);
		setEditing(null);
	}

	const showForm = creating || editing !== null;

	return (
		<div className="flex flex-col gap-md">
			<div className="flex flex-col gap-2xs lg:flex-row lg:gap-sm">
				{(
					[
						{ label: "Ativas", value: counts.active },
						{ label: "Diárias", value: counts.daily },
						{ label: "Semanais", value: counts.weekly },
						{ label: "Mensais", value: counts.monthly },
					] as const
				).map((stat) => (
					<div
						key={stat.label}
						className="flex min-w-0 flex-1 flex-col justify-center rounded-card border border-rule bg-paper-2 px-md py-sm"
					>
						<span className={toolLabelClass}>{stat.label}</span>
						<span className="text-lg font-semibold text-ink">{stat.value}</span>
					</div>
				))}
			</div>

			<div className="flex flex-col gap-sm lg:flex-row lg:items-center lg:justify-between">
				<div className="flex flex-wrap gap-2xs">
					{filters.map((f) => (
						<button key={f.id} type="button" className={toolChipClass(filter === f.id)} onClick={() => setFilter(f.id)}>
							{f.label}
						</button>
					))}
				</div>
				{!showForm && (
					<button type="button" className={toolBtnPrimaryClass} onClick={openCreate}>
						<Plus className="size-4" strokeWidth={2.5} />
						Nova missão
					</button>
				)}
			</div>

			{showForm && (
				<div className="rounded-card border border-accent-muted border-l-4 border-l-accent bg-accent-bg p-md">
					<p className={`${toolLabelClass} mb-sm`}>{editing ? "Editar missão" : "Nova missão"}</p>
					<MissionForm {...(editing ? { initial: editing } : {})} onSave={handleSave} onCancel={cancelForm} />
				</div>
			)}

			{list.length === 0 ? (
				<div className={`${toolEmptyPanelClass} flex flex-col items-center gap-sm`}>
					<ScrollText className="size-10 text-accent/50" strokeWidth={1.5} />
					<p className="m-0 text-muted">
						{filter === "archived" ? "Nenhuma missão arquivada." : "Nenhuma missão neste filtro. Crie a primeira."}
					</p>
					{filter !== "archived" && !showForm && (
						<button type="button" className={toolBtnPrimaryClass} onClick={openCreate}>
							<Plus className="size-4" strokeWidth={2.5} />
							Criar missão
						</button>
					)}
				</div>
			) : (
				<ul className="m-0 flex list-none flex-col gap-2xs p-0">
					{list.map((m) => {
						const Icon = CADENCE_ICON[m.cadence];
						const xp = xpForMission(m.cadence, m.difficulty);
						return (
							<li
								key={m.id}
								className={[
									"rounded-card border p-sm transition-colors",
									m.active
										? "border-rule bg-paper-2 hover:border-accent-muted"
										: "border-rule bg-paper-2/60 opacity-70",
								].join(" ")}
							>
								<div className="flex flex-col gap-sm lg:flex-row lg:items-center lg:justify-between">
									<div className="flex min-w-0 items-start gap-sm">
										<div className="flex size-10 shrink-0 items-center justify-center rounded-input bg-paper-3 text-muted">
											<Icon className="size-5" strokeWidth={2} />
										</div>
										<div className="flex min-w-0 flex-col gap-3xs">
											<span className="font-semibold text-ink">{m.title}</span>
											<span className="text-sm text-muted">
												{CADENCE_LABEL[m.cadence]} · {DIFFICULTY_LABEL[m.difficulty]} · +{xp} XP
												{m.required ? " · Obrigatória" : ""}
												{m.cadence === "once" && m.dueDate ? ` · ${m.dueDate}` : ""}
											</span>
											{m.notes.trim() !== "" && <span className="line-clamp-2 text-sm text-ink-2">{m.notes}</span>}
										</div>
									</div>
									<div className="flex flex-wrap gap-2xs">
										{m.active && (
											<button type="button" className={toolBtnGhostClass} onClick={() => openEdit(m)}>
												<Pencil className="size-3.5" strokeWidth={2} />
												Editar
											</button>
										)}
										<button
											type="button"
											className={toolBtnGhostClass}
											onClick={() => setMissionActive(m.id, !m.active)}
										>
											<Archive className="size-3.5" strokeWidth={2} />
											{m.active ? "Arquivar" : "Reativar"}
										</button>
									</div>
								</div>
							</li>
						);
					})}
				</ul>
			)}
		</div>
	);
}
