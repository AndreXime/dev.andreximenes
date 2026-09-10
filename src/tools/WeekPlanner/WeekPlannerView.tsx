import {
	ArrowRight,
	CalendarDays,
	CalendarRange,
	Check,
	ChevronDown,
	ChevronUp,
	Clock3,
	LayoutList,
	Plus,
	Timer,
	Trash2,
} from "lucide-react";
import { type ReactNode, useMemo, useState } from "react";
import { ToolShell } from "../ToolShell";
import {
	blockSpanMinutes,
	canSaveBlockFields,
	DAY_THEME,
	type DayTheme,
	formatDuration,
	hasTime,
	isTimeRangeOk,
} from "./plannerDomain";
import {
	addWeekBlockToAllDays,
	moveWeekBlock,
	removeWeekBlock,
	saveWeekBlock,
	updateWeekBlock,
	WEEK_DAY_LABEL,
	WEEK_DAY_ORDER,
	type WeekDayId,
	type WeekPlan,
	type WeekTimeBlock,
	weekPlannerStorage,
} from "./store";

function TimeField({
	value,
	onChange,
	label,
	optional,
	className,
}: {
	readonly value: string;
	readonly onChange: (v: string) => void;
	readonly label: string;
	readonly optional?: boolean;
	readonly className?: string;
}) {
	return (
		<div className={["group/field flex flex-col gap-1.5 min-w-0", className].filter(Boolean).join(" ")}>
			<div className="flex items-end justify-between gap-1 min-h-3.5">
				<span className="text-[10px] font-medium uppercase tracking-[0.14em] text-muted group-focus-within/field:opacity-100 transition-colors">
					{label}
					{optional && <span className="text-muted/75 font-normal normal-case"> (opcional)</span>}
				</span>
				{optional && hasTime(value) && (
					<button type="button" onClick={() => onChange("")} className="text-[10px] text-muted hover:text-ink">
						Limpar
					</button>
				)}
			</div>
			<div className="relative rounded-lg border border-rule/90 bg-paper-2/80 transition-[border,box-shadow] group-focus-within/field:border-accent/40 group-focus-within/field:ring-2 group-focus-within/field:ring-accent/20">
				<Clock3 className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted/80 group-focus-within/field:text-accent/70" />
				<input
					type="time"
					value={value}
					onChange={(e) => onChange(e.target.value)}
					className="w-full min-h-10 rounded-lg bg-transparent pl-9 pr-2 py-2 text-sm font-medium text-ink tabular-nums tracking-tight focus:outline-none"
				/>
			</div>
		</div>
	);
}

function SavedBlockBody({
	block,
	day,
	theme,
	span,
	timeRangeOk,
}: {
	readonly block: WeekTimeBlock;
	readonly day: WeekDayId;
	readonly theme: DayTheme;
	readonly span: number;
	readonly timeRangeOk: boolean;
}) {
	const hs = hasTime(block.start);
	const he = hasTime(block.end);
	return (
		<div className="flex items-start justify-between gap-2">
			<div className="flex flex-col gap-1 min-w-0">
				<div className="flex flex-wrap items-baseline gap-x-2 gap-y-1 text-sm">
					{block.groupId && (
						<span
							className={[
								"inline-flex items-center rounded-md border px-1.5 py-0.5 text-[10px] font-semibold tracking-wide uppercase",
								theme.chip,
							].join(" ")}
						>
							Semana
						</span>
					)}
					{hs && he && (
						<>
							<time dateTime={`${block.start}/${block.end}`} className="font-medium tabular-nums text-ink">
								{block.start}
							</time>
							<ArrowRight className="size-3.5 text-muted/80 shrink-0 self-center" aria-hidden />
							<time className="font-medium tabular-nums text-ink-2">{block.end}</time>
						</>
					)}
					{hs && !he && (
						<span className="text-ink-2">
							<span className="text-muted text-xs font-normal mr-1.5">De</span>
							<time className="font-medium tabular-nums">{block.start}</time>
						</span>
					)}
					{!hs && he && (
						<span className="text-ink-2">
							<span className="text-muted text-xs font-normal mr-1.5">Até</span>
							<time className="font-medium tabular-nums">{block.end}</time>
						</span>
					)}
					{!hs && !he && <span className="text-muted">Sem horário</span>}
					{timeRangeOk && span > 0 && (
						<span
							className={[
								"inline-flex items-center rounded-md border px-1.5 py-0.5 text-[10px] font-semibold tracking-wide uppercase",
								theme.chip,
							].join(" ")}
						>
							{formatDuration(span)}
						</span>
					)}
				</div>
				{block.title.trim() !== "" && <p className="text-sm text-ink-2 leading-snug">{block.title}</p>}
				{!timeRangeOk && (
					<p className="text-xs text-accent flex items-center gap-1">
						<span className="size-1 rounded-full bg-accent" />
						Intervalo inválido; apague e crie outro.
					</p>
				)}
			</div>
			<button
				type="button"
				onClick={() => removeWeekBlock(day, block.id)}
				className="shrink-0 rounded-lg p-2 text-muted hover:text-accent hover:bg-accent-bg opacity-70 group-hover/day:opacity-100 transition-[opacity,background,color] focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
				aria-label="Apagar bloco"
			>
				<Trash2 className="size-4" />
			</button>
		</div>
	);
}

function DraftBlockBody({
	block,
	day,
	canSave,
	timeRangeBad,
	span,
}: {
	readonly block: WeekTimeBlock;
	readonly day: WeekDayId;
	readonly canSave: boolean;
	readonly timeRangeBad: boolean;
	readonly span: number;
}) {
	return (
		<div className="flex flex-col gap-3 w-full">
			<div className="flex items-center justify-between gap-2">
				<div className="flex items-center gap-2 flex-wrap">
					<span className="text-[10px] font-semibold uppercase tracking-widest text-accent/80">A definir</span>
					{block.groupId && (
						<span className="text-[10px] font-semibold tracking-wide uppercase rounded-md border border-accent/25 bg-[color-mix(in_srgb,var(--color-accent)_10%,transparent)] px-1.5 py-0.5 text-accent/95">
							Toda a semana
						</span>
					)}
				</div>
				<button
					type="button"
					onClick={() => removeWeekBlock(day, block.id)}
					className="shrink-0 text-xs text-muted hover:text-accent px-1.5 py-0.5 rounded-md hover:bg-accent-bg transition-colors"
				>
					Descartar
				</button>
			</div>
			<p className="text-xs text-muted/90 leading-relaxed -mt-1">
				Início, fim e título: escolhe o que precisar (basta preencher uma coisa, ou só horas, etc.).
			</p>
			<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
				<TimeField
					label="Início"
					optional
					value={block.start}
					onChange={(v) => updateWeekBlock(day, block.id, { start: v })}
				/>
				<TimeField
					label="Fim"
					optional
					value={block.end}
					onChange={(v) => updateWeekBlock(day, block.id, { end: v })}
				/>
			</div>
			<div className="flex flex-col gap-1.5">
				<span className="text-[10px] font-medium uppercase tracking-[0.12em] text-muted">
					O quê? <span className="text-muted/75 font-normal">(opcional)</span>
				</span>
				<div className="relative">
					<LayoutList className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted/80" />
					<input
						type="text"
						placeholder="Reunião, deep work, treino, estudo…"
						value={block.title}
						onChange={(e) => updateWeekBlock(day, block.id, { title: e.target.value })}
						className="w-full min-h-10 rounded-lg border border-rule/80 bg-paper-2 pl-9 pr-3 py-2 text-sm text-ink placeholder:text-muted/70 focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent/40 transition-shadow"
					/>
				</div>
			</div>
			{timeRangeBad && (
				<p className="text-xs text-accent flex items-center gap-1">
					<span className="size-1 rounded-full bg-accent" />
					Com início e fim preenchidos, a hora de fim tem de ser depois do início.
				</p>
			)}
			{!timeRangeBad && !canSave && (
				<p className="text-xs text-accent flex items-center gap-1">
					<span className="size-1 rounded-full bg-accent" />
					Indique pelo menos início, fim ou a atividade.
				</p>
			)}
			{canSave && span > 0 && (
				<p className="text-xs text-muted">
					Pré-visualização: <span className="text-ink-2 tabular-nums">{formatDuration(span)}</span>
				</p>
			)}
			<button
				type="button"
				disabled={!canSave}
				onClick={() => saveWeekBlock(day, block.id)}
				className={[
					"inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-card px-4 py-2.5 text-sm font-semibold transition-[opacity,transform,background,box-shadow]",
					canSave
						? "bg-accent text-accent-ink hover:brightness-110 active:scale-[0.99]"
						: "bg-paper-2 text-muted/60 cursor-not-allowed",
					"focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/60 focus-visible:ring-offset-2 focus-visible:ring-offset-paper",
				].join(" ")}
			>
				<Check className="size-4" strokeWidth={2.5} />
				Guardar bloco
			</button>
		</div>
	);
}

function WeekStatCard({
	label,
	value,
	title,
}: {
	readonly label: string;
	readonly value: ReactNode;
	readonly title?: string;
}) {
	return (
		<div className="flex-1 min-w-0 sm:flex-initial sm:min-w-34 flex flex-col justify-center rounded-card border border-rule/80 bg-paper-2 px-4 py-3 ">
			<div className="text-[10px] font-semibold uppercase tracking-[0.15em] text-muted">{label}</div>
			<div className="text-2xl font-bold tabular-nums text-ink" title={title}>
				{value}
			</div>
		</div>
	);
}

function DaySection({
	day,
	blocks,
	theme,
}: {
	readonly day: WeekDayId;
	readonly blocks: readonly WeekTimeBlock[];
	readonly theme: DayTheme;
}) {
	const [hovered, setHovered] = useState<string | null>(null);
	const hasBlocks = blocks.length > 0;
	const dayTotalMins = useMemo(
		() => blocks.filter((b) => b.saved).reduce((acc, b) => acc + blockSpanMinutes(b.start, b.end), 0),
		[blocks],
	);

	return (
		<section
			id={`week-day-${day}`}
			aria-labelledby={`week-day-heading-${day}`}
			className="scroll-mt-28 min-w-100 flex-[1_1_18rem] max-w-full"
		>
			<article
				className={[
					"group/day relative overflow-hidden rounded-card border backdrop-blur-sm transition-[box-shadow,transform] duration-300",
					"motion-reduce:transition-none",
					"bg-paper-2",
					"shadow-[0_1px_0_rgba(255,255,255,0.04)] hover:shadow-[0_8px_40px_-12px_rgba(0,0,0,0.55)]",
					theme.border,
					hasBlocks ? "min-h-0" : "min-h-34",
				]
					.filter(Boolean)
					.join(" ")}
			>
				<div aria-hidden className={`absolute inset-x-0 top-0 h-px bg-linear-to-r ${theme.topGradient}`} />
				<div className="relative p-1">
					<div className="px-3 pt-3 pb-2">
						<div className="flex flex-col gap-0.5 min-w-0">
							<div className="flex items-center gap-2 flex-wrap">
								<h2 id={`week-day-heading-${day}`} className="text-base font-semibold text-ink tracking-tight">
									{WEEK_DAY_LABEL[day]}
								</h2>
								{hasBlocks && (
									<span
										className={[
											"inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium tabular-nums",
											theme.chip,
										].join(" ")}
									>
										<Timer className="size-3 opacity-80" />
										{dayTotalMins > 0 ? formatDuration(dayTotalMins) : "—"}
									</span>
								)}
							</div>
							<p className="text-xs text-muted">
								{hasBlocks
									? `${blocks.length} ${blocks.length === 1 ? "bloco" : "blocos"} planejado${blocks.length === 1 ? "" : "s"}`
									: "Use o botão no topo da página para adicionar blocos a todos os dias de uma vez."}
							</p>
						</div>
					</div>

					<div className="px-3 pb-3 flex flex-col gap-2.5">
						{!hasBlocks ? (
							<button
								type="button"
								onClick={() => addWeekBlockToAllDays()}
								className="flex flex-col items-center justify-center gap-2 rounded-card border border-dashed border-rule/90 bg-paper-2/80 py-7 px-4 text-center transition-all hover:border-accent/35 hover:bg-accent-bg group/empty"
							>
								<div className="flex size-11 items-center justify-center rounded-card bg-paper-2 text-muted ring-1 ring-rule group-hover/empty:ring-accent/30 group-hover/empty:text-accent/95 transition-all">
									<CalendarRange className="size-5" />
								</div>
								<div>
									<p className="text-sm font-medium text-ink-2">Nada neste dia ainda</p>
									<p className="text-xs text-muted/90 mt-0.5 max-w-64 mx-auto leading-relaxed">
										Blocos são adicionados à semana inteira. Toque abaixo ou use o botão no topo.
									</p>
								</div>
								<span className="mt-0.5 inline-flex items-center gap-1.5 text-xs font-medium text-accent/85 group-hover/empty:text-accent">
									<Plus className="size-3.5" />
									Adicionar bloco à semana
								</span>
							</button>
						) : (
							<ul className="flex flex-col gap-2.5 list-none p-0 m-0">
								{blocks.map((block, index) => {
									const timeRangeOk = isTimeRangeOk(block.start, block.end);
									const span = blockSpanMinutes(block.start, block.end);
									const canSave = canSaveBlockFields(block.start, block.end, block.title);
									const timeRangeBad =
										hasTime(block.start) && hasTime(block.end) && !isTimeRangeOk(block.start, block.end);
									const isHovered = hovered === block.id;
									const canReorder = blocks.length > 1;
									return (
										<li
											key={block.id}
											onMouseEnter={() => setHovered(block.id)}
											onMouseLeave={() => setHovered(null)}
											className="relative"
										>
											<div
												className={[
													"relative flex gap-0 overflow-hidden rounded-card border border-rule/80 bg-paper-2/90",
													" transition-[box-shadow,transform] duration-200",
													"motion-reduce:transition-none",
													isHovered ? "ring-1 ring-inset ring-ink/5" : "",
													!block.saved ? "border-accent/20" : "",
												].join(" ")}
											>
												<div aria-hidden className={`w-1 shrink-0 bg-linear-to-b ${theme.bar}`} />
												{canReorder && (
													<div className="flex flex-col border-r border-rule/60 bg-paper-2/60 shrink-0">
														<button
															type="button"
															disabled={index === 0}
															onClick={() => moveWeekBlock(day, block.id, -1)}
															className="flex-1 p-1.5 text-muted enabled:hover:text-ink enabled:hover:bg-accent-bg disabled:opacity-25 disabled:cursor-not-allowed transition-colors"
															aria-label="Mover para cima"
														>
															<ChevronUp className="size-4" />
														</button>
														<div className="h-px bg-rule/80 shrink-0" aria-hidden />
														<button
															type="button"
															disabled={index === blocks.length - 1}
															onClick={() => moveWeekBlock(day, block.id, 1)}
															className="flex-1 p-1.5 text-muted enabled:hover:text-ink enabled:hover:bg-accent-bg disabled:opacity-25 disabled:cursor-not-allowed transition-colors"
															aria-label="Mover para baixo"
														>
															<ChevronDown className="size-4" />
														</button>
													</div>
												)}
												<div className="min-w-0 flex-1 p-3.5 pl-3 flex flex-col gap-3">
													{block.saved ? (
														<SavedBlockBody
															block={block}
															day={day}
															theme={theme}
															span={span}
															timeRangeOk={timeRangeOk}
														/>
													) : (
														<DraftBlockBody
															block={block}
															day={day}
															canSave={canSave}
															timeRangeBad={timeRangeBad}
															span={span}
														/>
													)}
												</div>
											</div>
										</li>
									);
								})}
							</ul>
						)}
					</div>
				</div>
			</article>
		</section>
	);
}

export function WeekPlannerView({
	plan,
	totalBlocks,
	hoursLabel,
}: {
	plan: WeekPlan;
	totalBlocks: number;
	hoursLabel: string;
}) {
	return (
		<ToolShell
			title="Planejador de semana"
			description="Adicione um bloco uma vez: o mesmo rascunho aparece em todos os dias. Editar ou guardar noutro dia mantém tudo alinhado. Dados só no seu dispositivo."
			icon={<CalendarRange className="size-6" strokeWidth={2} />}
			storage={weekPlannerStorage}
		>
			<div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
				<button
					type="button"
					onClick={() => addWeekBlockToAllDays()}
					className="w-full lg:w-auto flex items-center justify-center gap-2 rounded-card border border-rule/90 bg-paper-2 px-3.5 py-2 text-sm font-medium text-ink-2 hover:border-accent/45 hover:bg-accent-bg hover:text-ink transition-[border,background,color] focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 focus-visible:ring-offset-2 focus-visible:ring-offset-paper shrink-0"
				>
					<CalendarDays className="size-4 text-accent/85" strokeWidth={2.25} />
					Adicionar bloco à semana
				</button>
				<div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full lg:w-auto">
					<WeekStatCard
						label="Blocos"
						value={
							<span className="flex items-baseline gap-1">
								{totalBlocks}
								<span className="text-sm font-medium text-muted/80">/ semana</span>
							</span>
						}
					/>
					<WeekStatCard
						label="Carga"
						value={totalBlocks === 0 ? "—" : hoursLabel}
						title="Soma da duração de blocos em que a hora de fim é depois do início"
					/>
				</div>
			</div>
			<div className="flex flex-wrap gap-4">
				{WEEK_DAY_ORDER.map((day) => (
					<DaySection key={day} day={day} blocks={plan[day]} theme={DAY_THEME[day]} />
				))}
			</div>
		</ToolShell>
	);
}
