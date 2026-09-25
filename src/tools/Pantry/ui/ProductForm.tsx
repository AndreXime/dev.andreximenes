import { useState } from "react";
import {
	toolBtnGhostClass,
	toolBtnPrimaryClass,
	toolInputClass,
	toolLabelClass,
	toolTextareaClass,
} from "@/lib/toolUi";
import type { Product } from "../domain";

export interface ProductFormValues {
	readonly name: string;
	readonly quantity: number;
	readonly minQuantity: number;
	readonly unit: string;
	readonly essential: boolean;
	readonly expiresOn: string | null;
	readonly notes: string;
}

interface ProductFormProps {
	readonly initial?: Product | null;
	readonly onSave: (values: ProductFormValues) => void;
	readonly onCancel: () => void;
}

export function ProductForm({ initial = null, onSave, onCancel }: ProductFormProps) {
	const [name, setName] = useState(initial?.name ?? "");
	const [quantity, setQuantity] = useState(String(initial?.quantity ?? 0));
	const [minQuantity, setMinQuantity] = useState(String(initial?.minQuantity ?? 1));
	const [unit, setUnit] = useState(initial?.unit ?? "un");
	const [essential, setEssential] = useState(initial?.essential ?? false);
	const [expiresOn, setExpiresOn] = useState(initial?.expiresOn ?? "");
	const [notes, setNotes] = useState(initial?.notes ?? "");

	const qty = Number(quantity);
	const min = Number(minQuantity);
	const canSave = name.trim() !== "" && Number.isFinite(qty) && qty >= 0 && Number.isFinite(min) && min >= 0;

	function submit() {
		if (!canSave) return;
		onSave({
			name: name.trim(),
			quantity: qty,
			minQuantity: min,
			unit: unit.trim() === "" ? "un" : unit.trim(),
			essential,
			expiresOn: /^\d{4}-\d{2}-\d{2}$/.test(expiresOn) ? expiresOn : null,
			notes,
		});
	}

	return (
		<form
			className="flex flex-col gap-sm rounded-card border border-rule bg-paper-2 p-md"
			onSubmit={(e) => {
				e.preventDefault();
				submit();
			}}
		>
			<label className="flex flex-col gap-2xs">
				<span className={toolLabelClass}>Nome</span>
				<input
					className={toolInputClass}
					value={name}
					onChange={(e) => setName(e.target.value)}
					placeholder="Ex.: arroz"
					required
				/>
			</label>

			<div className="grid grid-cols-1 gap-sm lg:grid-cols-3">
				<label className="flex flex-col gap-2xs">
					<span className={toolLabelClass}>Quantidade</span>
					<input
						className={toolInputClass}
						type="number"
						min={0}
						step="any"
						value={quantity}
						onChange={(e) => setQuantity(e.target.value)}
					/>
				</label>
				<label className="flex flex-col gap-2xs">
					<span className={toolLabelClass}>Mínimo</span>
					<input
						className={toolInputClass}
						type="number"
						min={0}
						step="any"
						value={minQuantity}
						onChange={(e) => setMinQuantity(e.target.value)}
					/>
				</label>
				<label className="flex flex-col gap-2xs">
					<span className={toolLabelClass}>Unidade</span>
					<input className={toolInputClass} value={unit} onChange={(e) => setUnit(e.target.value)} placeholder="un" />
				</label>
			</div>

			<label className="flex flex-col gap-2xs">
				<span className={toolLabelClass}>Validade</span>
				<input
					className={toolInputClass}
					type="date"
					value={expiresOn}
					onChange={(e) => setExpiresOn(e.target.value)}
				/>
			</label>

			<label className="flex items-center gap-sm text-sm text-ink">
				<input
					type="checkbox"
					checked={essential}
					onChange={(e) => setEssential(e.target.checked)}
					className="size-4 accent-[var(--color-accent)]"
				/>
				Essencial (entra na lista se ficar abaixo do mínimo)
			</label>

			<label className="flex flex-col gap-2xs">
				<span className={toolLabelClass}>Notas</span>
				<textarea
					className={toolTextareaClass}
					value={notes}
					onChange={(e) => setNotes(e.target.value)}
					placeholder="Marca, local na prateleira…"
					rows={3}
				/>
			</label>

			<div className="flex flex-col gap-2xs lg:flex-row lg:justify-end">
				<button type="button" className={toolBtnGhostClass} onClick={onCancel}>
					Cancelar
				</button>
				<button type="submit" className={toolBtnPrimaryClass} disabled={!canSave}>
					Salvar
				</button>
			</div>
		</form>
	);
}
