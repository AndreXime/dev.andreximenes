import { useEffect, useId, useState } from "react";
import { toolBtnGhostClass, toolBtnPrimaryClass, toolInputClass, toolLabelClass } from "@/lib/toolUi";

interface RestockDialogProps {
	readonly open: boolean;
	readonly productName: string;
	readonly unit: string;
	readonly onConfirm: (qty: number) => void;
	readonly onCancel: () => void;
}

export function RestockDialog({ open, productName, unit, onConfirm, onCancel }: RestockDialogProps) {
	const titleId = useId();
	const [qty, setQty] = useState("1");

	useEffect(() => {
		if (open) setQty("1");
	}, [open]);

	if (!open) return null;

	const value = Number(qty);
	const canConfirm = Number.isFinite(value) && value > 0;

	return (
		<div
			className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40 p-md lg:items-center"
			role="presentation"
			onClick={onCancel}
		>
			<div
				role="dialog"
				aria-modal="true"
				aria-labelledby={titleId}
				className="w-full max-w-md rounded-card border border-rule bg-paper p-md shadow-lg"
				onClick={(e) => e.stopPropagation()}
			>
				<h2 id={titleId} className="text-base font-semibold text-ink">
					Quanto comprou?
				</h2>
				<p className="mt-2xs text-sm text-muted">
					{productName}
					{unit ? ` (${unit})` : ""}
				</p>
				<label className="mt-sm flex flex-col gap-2xs">
					<span className={toolLabelClass}>Quantidade</span>
					<input
						className={toolInputClass}
						type="number"
						min={0.01}
						step="any"
						value={qty}
						onChange={(e) => setQty(e.target.value)}
						onKeyDown={(e) => {
							if (e.key === "Enter" && canConfirm) {
								e.preventDefault();
								onConfirm(value);
							}
						}}
					/>
				</label>
				<div className="mt-md flex flex-col gap-2xs lg:flex-row lg:justify-end">
					<button type="button" className={toolBtnGhostClass} onClick={onCancel}>
						Cancelar
					</button>
					<button
						type="button"
						className={toolBtnPrimaryClass}
						disabled={!canConfirm}
						onClick={() => {
							if (canConfirm) onConfirm(value);
						}}
					>
						Confirmar
					</button>
				</div>
			</div>
		</div>
	);
}
