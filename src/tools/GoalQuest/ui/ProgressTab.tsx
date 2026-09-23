import { Trophy } from "lucide-react";
import { useMemo } from "react";
import { toolLabelClass, toolStatCardClass } from "@/lib/toolUi";
import { badgeProgress, type GoalQuestState, orderBadgesForDisplay, xpProgressInLevel } from "../domain";

interface ProgressTabProps {
	readonly state: GoalQuestState;
}

export function ProgressTab({ state }: ProgressTabProps) {
	const progress = xpProgressInLevel(state.xp);
	const badges = useMemo(() => orderBadgesForDisplay(state), [state]);
	const barPct =
		progress.xpForNextLevel <= 0
			? 100
			: Math.min(100, Math.round((progress.xpIntoLevel / progress.xpForNextLevel) * 100));

	return (
		<div className="flex flex-col gap-md">
			<div className="flex flex-col gap-2xs lg:flex-row lg:gap-sm">
				<div className={toolStatCardClass}>
					<span className={toolLabelClass}>Nível {progress.level}</span>
					<div className="mt-2xs h-2 w-full overflow-hidden rounded-input bg-paper-3">
						<div className="h-full bg-accent transition-[width]" style={{ width: `${barPct}%` }} />
					</div>
					<span className="mt-3xs text-xs text-muted">
						{progress.xpIntoLevel} / {progress.xpForNextLevel} XP · total {state.xp}
					</span>
				</div>
				<div className={toolStatCardClass}>
					<span className={toolLabelClass}>Streak atual</span>
					<span className="text-lg font-semibold text-ink">{state.streakCurrent}</span>
					<span className="text-xs text-muted">Recorde: {state.streakBest}</span>
				</div>
				<div className={toolStatCardClass}>
					<span className={toolLabelClass}>Conclusões</span>
					<span className="text-lg font-semibold text-ink">{state.completions.length}</span>
				</div>
			</div>

			<div>
				<p className={`${toolLabelClass} mb-sm`}>Conquistas</p>
				<ul className="m-0 grid list-none grid-cols-1 gap-2xs p-0 lg:grid-cols-2">
					{badges.map((badge, index) => {
						const unlocked = state.unlockedBadges.includes(badge.id);
						const prog = badgeProgress(state, badge.id);
						const isFocus = index === 0 && !unlocked;
						const pct = prog ? Math.round(prog.ratio * 100) : 0;

						return (
							<li
								key={badge.id}
								className={[
									"rounded-card border p-md transition-colors",
									unlocked
										? "border-accent-muted bg-accent-bg"
										: isFocus
											? "border-accent-muted bg-paper-2"
											: "border-rule bg-paper-2 opacity-55",
								].join(" ")}
							>
								<div className="flex items-start gap-sm">
									<div
										className={[
											"flex size-10 shrink-0 items-center justify-center rounded-input",
											unlocked ? "bg-accent text-accent-ink" : "bg-paper-3 text-muted",
										].join(" ")}
									>
										<Trophy className="size-5" strokeWidth={2} />
									</div>
									<div className="min-w-0 flex-1">
										<div className="flex flex-wrap items-baseline justify-between gap-2xs">
											<p className="m-0 font-semibold text-ink">{badge.title}</p>
											{isFocus && (
												<span className="font-mono text-xs uppercase tracking-label text-accent">Próxima</span>
											)}
											{unlocked && (
												<span className="font-mono text-xs uppercase tracking-label text-accent">Concluída</span>
											)}
										</div>
										<p className="m-0 mt-3xs text-sm text-muted">{badge.description}</p>
										{prog && !unlocked && (
											<div className="mt-sm">
												<div className="mb-3xs flex justify-between text-xs text-muted">
													<span>
														{prog.current} / {prog.target}
													</span>
													<span>{pct}%</span>
												</div>
												<div className="h-1.5 w-full overflow-hidden rounded-input bg-paper-3">
													<div className="h-full bg-accent transition-[width]" style={{ width: `${pct}%` }} />
												</div>
											</div>
										)}
									</div>
								</div>
							</li>
						);
					})}
				</ul>
			</div>
		</div>
	);
}
