import { Flame, Sparkles, Target } from "lucide-react";
import { useMemo } from "react";
import {
	toolAlertWarningClass,
	toolBtnPrimaryClass,
	toolEmptyPanelClass,
	toolLabelClass,
	toolStatCardClass,
} from "@/lib/toolUi";
import {
	type GoalQuestState,
	localDateKey,
	missionsForToday,
	requiredDailiesForDay,
	xpForMission,
	xpProgressInLevel,
} from "../domain";
import { completeMissionAction } from "../store";
import { CADENCE_ICON, CADENCE_LABEL, DIFFICULTY_LABEL } from "./labels";

interface TodayTabProps {
	readonly state: GoalQuestState;
}

export function TodayTab({ state }: TodayTabProps) {
	const todayKey = localDateKey(new Date());
	const progress = xpProgressInLevel(state.xp);
	const todayMissions = useMemo(() => {
		const list = missionsForToday(state, todayKey);
		return [...list].sort((a, b) => {
			if (a.required !== b.required) return a.required ? -1 : 1;
			return a.title.localeCompare(b.title, "pt-BR");
		});
	}, [state, todayKey]);

	const requiredToday = requiredDailiesForDay(state.missions, todayKey);
	const requiredPending = requiredToday.filter((m) => todayMissions.some((t) => t.id === m.id));
	const streakSafeToday = requiredToday.length === 0 || requiredPending.length === 0;
	const doneToday = state.completions.filter((c) => localDateKey(new Date(c.completedAt)) === todayKey).length;
	const showXpLoss = state.lastXpLossOn === todayKey && state.lastXpLoss > 0;

	const barPct =
		progress.xpForNextLevel <= 0
			? 100
			: Math.min(100, Math.round((progress.xpIntoLevel / progress.xpForNextLevel) * 100));

	return (
		<div className="flex flex-col gap-md">
			{showXpLoss && (
				<p className={toolAlertWarningClass}>
					Ausência sem streak de escudo: −{state.lastXpLoss} XP pelas diárias obrigatórias perdidas.
				</p>
			)}

			<div className="flex flex-col gap-2xs lg:flex-row lg:gap-sm">
				<div className={toolStatCardClass}>
					<span className={toolLabelClass}>Nível {progress.level}</span>
					<div className="mt-2xs h-2 w-full overflow-hidden rounded-input bg-paper-3">
						<div className="h-full bg-accent transition-[width]" style={{ width: `${barPct}%` }} />
					</div>
					<span className="mt-3xs text-xs text-muted">
						{progress.xpIntoLevel} / {progress.xpForNextLevel} XP
					</span>
				</div>
				<div className={[toolStatCardClass, streakSafeToday ? "border-accent-muted bg-accent-bg" : ""].join(" ")}>
					<span className={toolLabelClass}>Streak</span>
					<span className="flex items-center gap-2xs text-lg font-semibold text-ink">
						<Flame className={`size-5 ${streakSafeToday ? "text-accent" : "text-muted"}`} strokeWidth={2} />
						{state.streakCurrent} dias
					</span>
					<span className="text-xs text-muted">
						{streakSafeToday ? "Streak seguro hoje" : `Faltam ${requiredPending.length} obrigatória(s) · escudo do XP`}
					</span>
				</div>
				<div className={toolStatCardClass}>
					<span className={toolLabelClass}>Hoje</span>
					<span className="text-lg font-semibold text-ink">
						{doneToday} feitas · {todayMissions.length} abertas
					</span>
					<span className="text-xs text-muted">Missões do ciclo atual</span>
				</div>
			</div>

			<div>
				<p className={`${toolLabelClass} mb-sm`}>Para concluir</p>
				{todayMissions.length === 0 ? (
					<div className={`${toolEmptyPanelClass} flex flex-col items-center gap-sm`}>
						<Sparkles className="size-10 text-accent/50" strokeWidth={1.5} />
						<p className="m-0 text-muted">Nada pendente por agora. Crie missões ou volte amanhã.</p>
					</div>
				) : (
					<ul className="m-0 flex list-none flex-col gap-2xs p-0">
						{todayMissions.map((m) => {
							const Icon = CADENCE_ICON[m.cadence];
							const xp = xpForMission(m.cadence, m.difficulty);
							return (
								<li
									key={m.id}
									className={[
										"rounded-card border p-sm transition-colors",
										m.required ? "border-accent-muted bg-accent-bg" : "border-rule bg-paper-2",
									].join(" ")}
								>
									<div className="flex flex-col gap-sm lg:flex-row lg:items-center lg:justify-between">
										<div className="flex min-w-0 items-start gap-sm">
											<div
												className={[
													"flex size-10 shrink-0 items-center justify-center rounded-input",
													m.required ? "bg-accent text-accent-ink" : "bg-paper-3 text-muted",
												].join(" ")}
											>
												<Icon className="size-5" strokeWidth={2} />
											</div>
											<div className="flex min-w-0 flex-col gap-3xs">
												<div className="flex flex-wrap items-center gap-2xs">
													<span className="font-semibold text-ink">{m.title}</span>
													{m.required && (
														<span className="inline-flex items-center gap-3xs rounded-input bg-accent px-2xs py-3xs font-mono text-[0.65rem] uppercase tracking-label text-accent-ink">
															<Target className="size-3" strokeWidth={2.5} />
															Obrigatória
														</span>
													)}
												</div>
												<span className="text-sm text-muted">
													{CADENCE_LABEL[m.cadence]} · {DIFFICULTY_LABEL[m.difficulty]} · +{xp} XP
												</span>
												{m.notes.trim() !== "" && <span className="line-clamp-2 text-sm text-ink-2">{m.notes}</span>}
											</div>
										</div>
										<button type="button" className={toolBtnPrimaryClass} onClick={() => completeMissionAction(m.id)}>
											Concluir
										</button>
									</div>
								</li>
							);
						})}
					</ul>
				)}
			</div>
		</div>
	);
}
