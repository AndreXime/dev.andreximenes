import { Pencil, Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import {
	toolBtnGhostClass,
	toolBtnPrimaryClass,
	toolEmptyPanelClass,
	toolIconBtnClass,
	toolInputClass,
	toolLabelClass,
	toolPanelClass,
	toolTextareaClass,
} from "@/lib/toolUi";
import { type CalendarEvent, type DayOccurrence, EVENT_COLORS, type EventColor, type Recurrence } from "../domain";
import { removeEvent, upsertEvent } from "../store";

export type PanelMode = { kind: "list" } | { kind: "create" } | { kind: "edit"; eventId: string };

const RECURRENCE_OPTIONS: { value: Recurrence; label: string }[] = [
	{ value: "none", label: "Nenhuma" },
	{ value: "daily", label: "Diária" },
	{ value: "weekly", label: "Semanal" },
	{ value: "monthly", label: "Mensal" },
	{ value: "yearly", label: "Anual" },
];

const COLOR_SWATCH: Record<EventColor, string> = {
	accent: "bg-accent",
	sky: "bg-sky-500",
	rose: "bg-rose-500",
	amber: "bg-amber-500",
	emerald: "bg-emerald-500",
	violet: "bg-violet-500",
};

const RECURRENCE_LABEL: Record<Recurrence, string> = {
	none: "Único",
	daily: "Diário",
	weekly: "Semanal",
	monthly: "Mensal",
	yearly: "Anual",
};

function formatDayTitle(dateKey: string): string {
	const [y, m, d] = dateKey.split("-").map(Number);
	const dt = new Date(y ?? 0, (m ?? 1) - 1, d ?? 1);
	return dt.toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
}

interface DayPanelProps {
	readonly selectedDay: string;
	readonly occurrences: readonly DayOccurrence[];
	readonly events: readonly CalendarEvent[];
	readonly mode: PanelMode;
	readonly editing: CalendarEvent | null;
	readonly onModeChange: (mode: PanelMode) => void;
}

export function DayPanel({ selectedDay, occurrences, events, mode, editing, onModeChange }: DayPanelProps) {
	if (mode.kind === "create" || mode.kind === "edit") {
		return (
			<EventForm
				selectedDay={selectedDay}
				initial={mode.kind === "edit" ? editing : null}
				onCancel={() => onModeChange({ kind: "list" })}
				onSaved={() => onModeChange({ kind: "list" })}
			/>
		);
	}

	const uniqueEventIds = [...new Set(occurrences.map((o) => o.eventId))];

	return (
		<div className={[toolPanelClass, "flex flex-col gap-md"].join(" ")}>
			<div className="flex flex-col gap-sm">
				<div>
					<p className={toolLabelClass}>Dia selecionado</p>
					<h2 className="m-0 mt-2xs font-display text-lg font-semibold capitalize text-ink">
						{formatDayTitle(selectedDay)}
					</h2>
				</div>
				<button type="button" className={toolBtnPrimaryClass} onClick={() => onModeChange({ kind: "create" })}>
					<Plus className="size-4" strokeWidth={2.5} />
					Novo evento
				</button>
			</div>

			{uniqueEventIds.length === 0 ? (
				<div className={toolEmptyPanelClass}>Nenhum evento neste dia.</div>
			) : (
				<ul className="m-0 flex list-none flex-col gap-2xs p-0">
					{uniqueEventIds.map((eventId) => {
						const ev = events.find((e) => e.id === eventId);
						const occ = occurrences.find((o) => o.eventId === eventId);
						if (!ev || !occ) return null;
						return (
							<li key={eventId} className="flex items-start gap-sm rounded-card border border-rule bg-paper p-sm">
								<span className={["mt-1 size-2.5 shrink-0 rounded-full", COLOR_SWATCH[ev.color]].join(" ")} />
								<div className="min-w-0 flex-1">
									<p className="m-0 font-semibold text-ink">{ev.title}</p>
									<p className="m-0 mt-3xs text-sm text-muted">
										{occ.occurrenceStart === occ.occurrenceEnd
											? RECURRENCE_LABEL[ev.recurrence]
											: `${occ.occurrenceStart} a ${occ.occurrenceEnd} · ${RECURRENCE_LABEL[ev.recurrence]}`}
									</p>
									{ev.notes !== "" && <p className="m-0 mt-2xs text-sm text-ink-2">{ev.notes}</p>}
								</div>
								<button
									type="button"
									className={toolIconBtnClass}
									aria-label={`Editar ${ev.title}`}
									onClick={() => onModeChange({ kind: "edit", eventId })}
								>
									<Pencil className="size-4" strokeWidth={2} />
								</button>
							</li>
						);
					})}
				</ul>
			)}
		</div>
	);
}

interface EventFormProps {
	readonly selectedDay: string;
	readonly initial: CalendarEvent | null;
	readonly onCancel: () => void;
	readonly onSaved: () => void;
}

function EventForm({ selectedDay, initial, onCancel, onSaved }: EventFormProps) {
	const [title, setTitle] = useState(initial?.title ?? "");
	const [notes, setNotes] = useState(initial?.notes ?? "");
	const [startDate, setStartDate] = useState(initial?.startDate ?? selectedDay);
	const [endDate, setEndDate] = useState(initial?.endDate ?? selectedDay);
	const [recurrence, setRecurrence] = useState<Recurrence>(initial?.recurrence ?? "none");
	const [recurrenceEndDate, setRecurrenceEndDate] = useState(initial?.recurrenceEndDate ?? "");
	const [color, setColor] = useState<EventColor>(initial?.color ?? "accent");
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		setTitle(initial?.title ?? "");
		setNotes(initial?.notes ?? "");
		setStartDate(initial?.startDate ?? selectedDay);
		setEndDate(initial?.endDate ?? selectedDay);
		setRecurrence(initial?.recurrence ?? "none");
		setRecurrenceEndDate(initial?.recurrenceEndDate ?? "");
		setColor(initial?.color ?? "accent");
		setError(null);
	}, [initial, selectedDay]);

	const canSave = title.trim() !== "";

	function submit(): void {
		const result = upsertEvent(
			{
				title,
				notes,
				startDate,
				endDate,
				recurrence,
				recurrenceEndDate: recurrence === "none" || recurrenceEndDate === "" ? null : recurrenceEndDate,
				color,
			},
			initial?.id,
		);
		if (!result.ok) {
			setError(result.error);
			return;
		}
		onSaved();
	}

	function handleDelete(): void {
		if (!initial) return;
		removeEvent(initial.id);
		onSaved();
	}

	return (
		<form
			className={[toolPanelClass, "flex flex-col gap-sm"].join(" ")}
			onSubmit={(e) => {
				e.preventDefault();
				submit();
			}}
		>
			<div>
				<p className={toolLabelClass}>{initial ? "Editar evento" : "Novo evento"}</p>
				{initial && <p className="m-0 mt-2xs text-sm text-muted">Alterações e exclusão afetam a série inteira.</p>}
			</div>

			<label className="flex flex-col gap-2xs">
				<span className={toolLabelClass}>Título</span>
				<input
					className={toolInputClass}
					value={title}
					onChange={(e) => setTitle(e.target.value)}
					placeholder="Ex.: consulta, viagem"
					required
				/>
			</label>

			<label className="flex flex-col gap-2xs">
				<span className={toolLabelClass}>Notas</span>
				<textarea
					className={[toolTextareaClass, "min-h-24"].join(" ")}
					value={notes}
					onChange={(e) => setNotes(e.target.value)}
					placeholder="Opcional"
				/>
			</label>

			<div className="grid grid-cols-1 gap-sm lg:grid-cols-2">
				<label className="flex flex-col gap-2xs">
					<span className={toolLabelClass}>Início</span>
					<input
						className={toolInputClass}
						type="date"
						value={startDate}
						onChange={(e) => setStartDate(e.target.value)}
						required
					/>
				</label>
				<label className="flex flex-col gap-2xs">
					<span className={toolLabelClass}>Fim</span>
					<input
						className={toolInputClass}
						type="date"
						value={endDate}
						onChange={(e) => setEndDate(e.target.value)}
						required
					/>
				</label>
			</div>

			<label className="flex flex-col gap-2xs">
				<span className={toolLabelClass}>Recorrência</span>
				<select
					className={toolInputClass}
					value={recurrence}
					onChange={(e) => setRecurrence(e.target.value as Recurrence)}
				>
					{RECURRENCE_OPTIONS.map((opt) => (
						<option key={opt.value} value={opt.value}>
							{opt.label}
						</option>
					))}
				</select>
			</label>

			{recurrence !== "none" && (
				<label className="flex flex-col gap-2xs">
					<span className={toolLabelClass}>Fim da recorrência</span>
					<input
						className={toolInputClass}
						type="date"
						value={recurrenceEndDate}
						onChange={(e) => setRecurrenceEndDate(e.target.value)}
					/>
					<span className="text-xs text-muted">Deixe vazio para repetir sem prazo.</span>
				</label>
			)}

			<fieldset className="m-0 border-0 p-0">
				<legend className={toolLabelClass}>Cor</legend>
				<div className="mt-2xs flex flex-wrap gap-2xs">
					{EVENT_COLORS.map((c) => (
						<button
							key={c}
							type="button"
							aria-label={`Cor ${c}`}
							aria-pressed={color === c}
							onClick={() => setColor(c)}
							className={[
								"size-8 rounded-full border-2 transition-transform",
								COLOR_SWATCH[c],
								color === c ? "scale-110 border-ink" : "border-transparent opacity-80 hover:opacity-100",
							].join(" ")}
						/>
					))}
				</div>
			</fieldset>

			{error !== null && <p className="m-0 text-sm text-danger">{error}</p>}

			<div className="flex flex-col gap-2xs lg:flex-row lg:flex-wrap">
				<button type="submit" className={toolBtnPrimaryClass} disabled={!canSave}>
					Salvar
				</button>
				<button type="button" className={toolBtnGhostClass} onClick={onCancel}>
					Cancelar
				</button>
				{initial && (
					<button
						type="button"
						className={[toolBtnGhostClass, "text-danger hover:text-danger"].join(" ")}
						onClick={handleDelete}
					>
						<Trash2 className="size-4" strokeWidth={2} />
						Apagar série
					</button>
				)}
			</div>
		</form>
	);
}
