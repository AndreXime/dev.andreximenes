import { ChevronLeft, ChevronRight, List } from "lucide-react";
import { toolBtnGhostClass, toolIconBtnClass, toolPanelClass } from "@/lib/toolUi";
import type { DayOccurrence, EventColor, MonthCell } from "../domain";

const WEEKDAYS = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"] as const;

const COLOR_DOT: Record<EventColor, string> = {
	accent: "bg-accent",
	sky: "bg-sky-500",
	rose: "bg-rose-500",
	amber: "bg-amber-500",
	emerald: "bg-emerald-500",
	violet: "bg-violet-500",
};

interface MonthGridProps {
	readonly label: string;
	readonly cells: readonly MonthCell[];
	readonly byDay: Map<string, DayOccurrence[]>;
	readonly selectedDay: string | null;
	readonly today: string;
	readonly onPrev: () => void;
	readonly onNext: () => void;
	readonly onSelectDay: (dateKey: string) => void;
	readonly onList: () => void;
}

export function MonthGrid({
	label,
	cells,
	byDay,
	selectedDay,
	today,
	onPrev,
	onNext,
	onSelectDay,
	onList,
}: MonthGridProps) {
	return (
		<div className={[toolPanelClass, "flex flex-col gap-sm"].join(" ")}>
			<div className="flex flex-col gap-sm lg:flex-row lg:items-center lg:justify-between">
				<div className="flex items-center gap-2xs">
					<button type="button" className={toolIconBtnClass} aria-label="Mês anterior" onClick={onPrev}>
						<ChevronLeft className="size-5" strokeWidth={2} />
					</button>
					<h2 className="m-0 min-w-0 flex-1 text-center font-display text-lg font-semibold text-ink lg:text-left">
						{label}
					</h2>
					<button type="button" className={toolIconBtnClass} aria-label="Próximo mês" onClick={onNext}>
						<ChevronRight className="size-5" strokeWidth={2} />
					</button>
				</div>
				<button type="button" className={toolBtnGhostClass} onClick={onList}>
					<List className="size-4" strokeWidth={2} />
					Listar
				</button>
			</div>

			<div className="grid grid-cols-7 gap-3xs">
				{WEEKDAYS.map((day) => (
					<div key={day} className="px-3xs py-2xs text-center font-mono text-xs tracking-label text-muted uppercase">
						{day}
					</div>
				))}
			</div>

			<div className="grid grid-cols-7 gap-3xs">
				{cells.map((cell) => {
					const occs = byDay.get(cell.dateKey) ?? [];
					const visible = occs.slice(0, 2);
					const extra = occs.length - visible.length;
					const isSelected = cell.dateKey === selectedDay;
					const isToday = cell.dateKey === today;
					const dayNum = cell.dateKey.slice(8, 10).replace(/^0/, "");

					let surfaceClass: string;
					if (isSelected) {
						surfaceClass = "border-accent bg-accent";
					} else if (isToday) {
						surfaceClass = "border-accent bg-accent-bg";
					} else if (cell.inMonth) {
						surfaceClass = "border-rule bg-paper hover:border-accent-muted hover:bg-accent-bg";
					} else {
						surfaceClass = "border-rule bg-paper-2/40 opacity-55 hover:border-accent-muted";
					}

					const titleClass = isSelected ? "text-accent-ink" : isToday ? "text-accent" : "text-ink";
					const metaClass = isSelected ? "text-accent-ink/90" : isToday ? "text-accent-weak" : "text-ink-2";
					const extraClass = isSelected ? "text-accent-ink/80" : isToday ? "text-accent-weak" : "text-muted";

					return (
						<button
							key={cell.dateKey}
							type="button"
							aria-pressed={isSelected}
							aria-current={isToday ? "date" : undefined}
							aria-label={cell.dateKey}
							onClick={() => onSelectDay(cell.dateKey)}
							className={[
								"flex min-h-[5.5rem] flex-col gap-3xs rounded-input border p-2xs text-left transition-colors",
								"focus:outline-none focus-visible:ring-2 focus-visible:ring-accent",
								surfaceClass,
							].join(" ")}
						>
							<span className={["text-sm font-semibold tabular-nums", titleClass].join(" ")}>
								{isToday ? `${dayNum} - Hoje` : dayNum}
							</span>
							<div className="flex min-h-0 flex-1 flex-col gap-3xs overflow-hidden">
								{visible.map((occ) => (
									<span
										key={`${occ.eventId}-${occ.occurrenceStart}`}
										className={["flex min-w-0 items-center gap-3xs truncate text-[11px] leading-tight", metaClass].join(
											" ",
										)}
									>
										<span
											className={[
												"size-1.5 shrink-0 rounded-full",
												isSelected ? "bg-accent-ink" : COLOR_DOT[occ.color],
											].join(" ")}
										/>
										<span className="truncate">{occ.title}</span>
									</span>
								))}
								{extra > 0 && <span className={["text-[11px]", extraClass].join(" ")}>+{extra}</span>}
							</div>
						</button>
					);
				})}
			</div>
		</div>
	);
}
