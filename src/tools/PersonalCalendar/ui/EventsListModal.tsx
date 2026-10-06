import { X } from "lucide-react";
import { useEffect, useId } from "react";
import { toolBtnGhostClass, toolEmptyPanelClass, toolIconBtnClass, toolLabelClass } from "@/lib/toolUi";
import type { EventColor, Recurrence, UpcomingEventItem } from "../domain";

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

function formatDate(dateKey: string): string {
	const [y, m, d] = dateKey.split("-").map(Number);
	const dt = new Date(y ?? 0, (m ?? 1) - 1, d ?? 1);
	return dt.toLocaleDateString("pt-BR", { day: "numeric", month: "short", year: "numeric" });
}

function formatDaysUntil(days: number): string {
	if (days <= 0) return "Hoje";
	if (days === 1) return "Amanhã";
	return `${days} dias`;
}

interface EventsListModalProps {
	readonly open: boolean;
	readonly items: readonly UpcomingEventItem[];
	readonly onClose: () => void;
}

export function EventsListModal({ open, items, onClose }: EventsListModalProps) {
	const titleId = useId();

	useEffect(() => {
		if (!open) return;
		const onKey = (e: KeyboardEvent): void => {
			if (e.key === "Escape") onClose();
		};
		window.addEventListener("keydown", onKey);
		return () => window.removeEventListener("keydown", onKey);
	}, [open, onClose]);

	if (!open) return null;

	return (
		<div
			className="fixed inset-0 z-50 flex items-end justify-center bg-ink/45 p-sm lg:items-center lg:p-md"
			role="presentation"
			onClick={onClose}
		>
			<div
				role="dialog"
				aria-modal="true"
				aria-labelledby={titleId}
				className="flex h-[min(92vh,52rem)] w-[min(100%,48rem)] flex-col overflow-hidden rounded-card border border-rule bg-paper shadow-lg"
				onClick={(e) => e.stopPropagation()}
			>
				<div className="flex shrink-0 items-start justify-between gap-sm border-b border-rule px-md py-sm">
					<div className="min-w-0">
						<p className={toolLabelClass}>Agenda</p>
						<h2 id={titleId} className="m-0 mt-2xs font-display text-xl font-semibold text-ink">
							Próximos eventos
						</h2>
						<p className="m-0 mt-2xs text-sm text-muted">Recorrentes aparecem só na ocorrência mais próxima.</p>
					</div>
					<button type="button" className={toolIconBtnClass} aria-label="Fechar" onClick={onClose}>
						<X className="size-5" strokeWidth={2} />
					</button>
				</div>

				<div className="min-h-0 flex-1 overflow-y-auto px-md py-md">
					{items.length === 0 ? (
						<div className={toolEmptyPanelClass}>Nenhum evento futuro cadastrado.</div>
					) : (
						<ul className="m-0 flex list-none flex-col gap-2xs p-0">
							{items.map((item) => (
								<li
									key={`${item.eventId}-${item.occurrenceStart}`}
									className="flex flex-col gap-sm rounded-card border border-rule bg-paper-2 p-md lg:flex-row lg:items-center lg:justify-between"
								>
									<div className="flex min-w-0 items-start gap-sm">
										<span className={["mt-1.5 size-2.5 shrink-0 rounded-full", COLOR_SWATCH[item.color]].join(" ")} />
										<div className="min-w-0">
											<p className="m-0 font-semibold text-ink">{item.title}</p>
											<p className="m-0 mt-3xs text-sm text-muted">
												{item.occurrenceStart === item.occurrenceEnd
													? formatDate(item.occurrenceStart)
													: `${formatDate(item.occurrenceStart)} a ${formatDate(item.occurrenceEnd)}`}
												{" · "}
												{RECURRENCE_LABEL[item.recurrence]}
											</p>
										</div>
									</div>
									<div className="shrink-0 lg:text-right">
										<p className="m-0 font-display text-lg font-semibold tabular-nums text-accent">
											{formatDaysUntil(item.daysUntil)}
										</p>
										{item.daysUntil > 1 && <p className="m-0 text-xs text-muted">faltam</p>}
									</div>
								</li>
							))}
						</ul>
					)}
				</div>

				<div className="flex shrink-0 justify-end border-t border-rule px-md py-sm">
					<button type="button" className={toolBtnGhostClass} onClick={onClose}>
						Fechar
					</button>
				</div>
			</div>
		</div>
	);
}
