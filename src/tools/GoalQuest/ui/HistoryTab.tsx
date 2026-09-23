import { Check, History } from "lucide-react";
import { useMemo } from "react";
import { toolEmptyPanelClass, toolLabelClass, toolStatCardClass } from "@/lib/toolUi";
import { addDays, type GoalQuestState, localDateKey } from "../domain";
import { CADENCE_ICON, CADENCE_LABEL, formatDayHeading } from "./labels";

interface HistoryTabProps {
	readonly state: GoalQuestState;
}

export function HistoryTab({ state }: HistoryTabProps) {
	const todayKey = localDateKey(new Date());
	const sinceKey = addDays(todayKey, -60);

	const groups = useMemo(() => {
		const filtered = state.completions.filter((c) => {
			const key = localDateKey(new Date(c.completedAt));
			return key >= sinceKey && key <= todayKey;
		});

		const map = new Map<string, typeof filtered>();
		for (const c of filtered) {
			const key = localDateKey(new Date(c.completedAt));
			const bucket = map.get(key) ?? [];
			bucket.push(c);
			map.set(key, bucket);
		}

		return [...map.entries()]
			.sort((a, b) => b[0].localeCompare(a[0]))
			.map(([date, items]) => ({
				date,
				items: [...items].sort((a, b) => b.completedAt.localeCompare(a.completedAt)),
				xpTotal: items.reduce((sum, c) => sum + c.xpAwarded, 0),
			}));
	}, [state.completions, sinceKey, todayKey]);

	const periodXp = groups.reduce((sum, g) => sum + g.xpTotal, 0);
	const periodCount = groups.reduce((sum, g) => sum + g.items.length, 0);

	if (groups.length === 0) {
		return (
			<div className={`${toolEmptyPanelClass} flex flex-col items-center gap-sm`}>
				<History className="size-10 text-accent/50" strokeWidth={1.5} />
				<p className="m-0 text-muted">Nenhuma conclusão nos últimos 60 dias.</p>
			</div>
		);
	}

	return (
		<div className="flex flex-col gap-md">
			<div className="flex flex-col gap-2xs lg:flex-row lg:gap-sm">
				<div className={`${toolStatCardClass} border-accent-muted bg-accent-bg`}>
					<span className={toolLabelClass}>XP no período</span>
					<span className="text-lg font-semibold text-ink">+{periodXp}</span>
					<span className="text-xs text-muted">Últimos 60 dias</span>
				</div>
				<div className={toolStatCardClass}>
					<span className={toolLabelClass}>Conclusões</span>
					<span className="text-lg font-semibold text-ink">{periodCount}</span>
					<span className="text-xs text-muted">{groups.length} dia(s) com atividade</span>
				</div>
			</div>

			{groups.map((group) => (
				<section key={group.date} className="flex flex-col gap-2xs">
					<div className="flex items-baseline justify-between gap-sm">
						<p className={`${toolLabelClass} m-0`}>{formatDayHeading(group.date, todayKey)}</p>
						<span className="font-mono text-xs text-accent">+{group.xpTotal} XP</span>
					</div>
					<ul className="m-0 flex list-none flex-col gap-2xs p-0">
						{group.items.map((c) => {
							const mission = state.missions.find((m) => m.id === c.missionId);
							const title = mission?.title ?? "Missão removida";
							const cadence = mission?.cadence;
							const Icon = cadence ? CADENCE_ICON[cadence] : Check;
							return (
								<li key={c.id} className="rounded-card border border-accent-muted bg-accent-bg p-sm">
									<div className="flex items-center gap-sm">
										<div className="flex size-9 shrink-0 items-center justify-center rounded-input bg-accent text-accent-ink">
											<Icon className="size-4" strokeWidth={2} />
										</div>
										<div className="min-w-0 flex-1">
											<p className="m-0 font-medium text-ink">{title}</p>
											<p className="m-0 text-xs text-muted">
												{cadence ? CADENCE_LABEL[cadence] : "Arquivada / removida"}
											</p>
										</div>
										<span className="shrink-0 rounded-input bg-accent px-2xs py-3xs font-mono text-xs font-semibold text-accent-ink">
											+{c.xpAwarded}
										</span>
									</div>
								</li>
							);
						})}
					</ul>
				</section>
			))}
		</div>
	);
}
