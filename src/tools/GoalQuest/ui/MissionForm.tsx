import { useState } from "react";
import {
	toolBtnGhostClass,
	toolBtnPrimaryClass,
	toolInputClass,
	toolLabelClass,
	toolTextareaClass,
} from "@/lib/toolUi";
import type { Cadence, Difficulty, Mission } from "../domain";

export interface MissionFormValues {
	readonly title: string;
	readonly notes: string;
	readonly cadence: Cadence;
	readonly difficulty: Difficulty;
	readonly required: boolean;
	readonly dueDate: string | null;
}

interface MissionFormProps {
	readonly initial?: Mission | null;
	readonly onSave: (values: MissionFormValues) => void;
	readonly onCancel: () => void;
}

const CADENCE_OPTIONS: { value: Cadence; label: string }[] = [
	{ value: "daily", label: "Diária" },
	{ value: "weekly", label: "Semanal" },
	{ value: "monthly", label: "Mensal" },
	{ value: "once", label: "Data única" },
];

const DIFFICULTY_OPTIONS: { value: Difficulty; label: string }[] = [
	{ value: "easy", label: "Fácil" },
	{ value: "medium", label: "Médio" },
	{ value: "hard", label: "Difícil" },
];

export function MissionForm({ initial = null, onSave, onCancel }: MissionFormProps) {
	const [title, setTitle] = useState(initial?.title ?? "");
	const [notes, setNotes] = useState(initial?.notes ?? "");
	const [cadence, setCadence] = useState<Cadence>(initial?.cadence ?? "daily");
	const [difficulty, setDifficulty] = useState<Difficulty>(initial?.difficulty ?? "easy");
	const [required, setRequired] = useState(initial?.required ?? false);
	const [dueDate, setDueDate] = useState(initial?.dueDate ?? "");

	const canSave = title.trim() !== "" && (cadence !== "once" || /^\d{4}-\d{2}-\d{2}$/.test(dueDate));

	function submit() {
		if (!canSave) return;
		onSave({
			title: title.trim(),
			notes,
			cadence,
			difficulty,
			required,
			dueDate: cadence === "once" ? dueDate : null,
		});
	}

	return (
		<form
			className="flex flex-col gap-sm"
			onSubmit={(e) => {
				e.preventDefault();
				submit();
			}}
		>
			<label className="flex flex-col gap-2xs">
				<span className={toolLabelClass}>Título</span>
				<input
					className={toolInputClass}
					value={title}
					onChange={(e) => setTitle(e.target.value)}
					placeholder="Ex.: treinar 30 min"
					required
				/>
			</label>

			<label className="flex flex-col gap-2xs">
				<span className={toolLabelClass}>Notas</span>
				<textarea
					className={toolTextareaClass}
					value={notes}
					onChange={(e) => setNotes(e.target.value)}
					placeholder="Opcional"
					rows={3}
				/>
			</label>

			<div className="flex flex-col gap-sm lg:flex-row">
				<label className="flex min-w-0 flex-1 flex-col gap-2xs">
					<span className={toolLabelClass}>Cadência</span>
					<select className={toolInputClass} value={cadence} onChange={(e) => setCadence(e.target.value as Cadence)}>
						{CADENCE_OPTIONS.map((o) => (
							<option key={o.value} value={o.value}>
								{o.label}
							</option>
						))}
					</select>
				</label>

				<label className="flex min-w-0 flex-1 flex-col gap-2xs">
					<span className={toolLabelClass}>Dificuldade</span>
					<select
						className={toolInputClass}
						value={difficulty}
						onChange={(e) => setDifficulty(e.target.value as Difficulty)}
					>
						{DIFFICULTY_OPTIONS.map((o) => (
							<option key={o.value} value={o.value}>
								{o.label}
							</option>
						))}
					</select>
				</label>
			</div>

			{cadence === "once" && (
				<label className="flex flex-col gap-2xs">
					<span className={toolLabelClass}>Data</span>
					<input
						type="date"
						className={toolInputClass}
						value={dueDate}
						onChange={(e) => setDueDate(e.target.value)}
						required
					/>
				</label>
			)}

			<label className="flex items-center gap-2xs text-sm text-ink-2">
				<input
					type="checkbox"
					checked={required}
					onChange={(e) => setRequired(e.target.checked)}
					className="size-4 accent-accent"
				/>
				Obrigatória (conta no streak se for diária)
			</label>

			<div className="flex flex-wrap gap-2xs">
				<button type="submit" className={toolBtnPrimaryClass} disabled={!canSave}>
					Salvar
				</button>
				<button type="button" className={toolBtnGhostClass} onClick={onCancel}>
					Cancelar
				</button>
			</div>
		</form>
	);
}
