export type Cadence = "daily" | "weekly" | "monthly" | "once";
export type Difficulty = "easy" | "medium" | "hard";

export interface Mission {
	readonly id: string;
	readonly title: string;
	readonly notes: string;
	readonly cadence: Cadence;
	readonly difficulty: Difficulty;
	readonly required: boolean;
	readonly active: boolean;
	readonly dueDate: string | null;
	readonly createdAt: string;
	readonly updatedAt: string;
}

export interface Completion {
	readonly id: string;
	readonly missionId: string;
	readonly completedAt: string;
	readonly xpAwarded: number;
	readonly cycleKey: string;
}

export interface GoalQuestState {
	readonly missions: readonly Mission[];
	readonly completions: readonly Completion[];
	readonly xp: number;
	readonly streakCurrent: number;
	readonly streakBest: number;
	readonly streakCheckedOn: string | null;
	readonly unlockedBadges: readonly string[];
	/** XP perdido no último reconcile (ausência / prazo). */
	readonly lastXpLoss: number;
	readonly lastXpLossOn: string | null;
}

export const XP_BASE: Record<Cadence, number> = {
	daily: 10,
	weekly: 40,
	monthly: 120,
	once: 80,
};

export const XP_MULT: Record<Difficulty, number> = {
	easy: 1,
	medium: 1.5,
	hard: 2,
};

export function xpForMission(cadence: Cadence, difficulty: Difficulty): number {
	return Math.floor(XP_BASE[cadence] * XP_MULT[difficulty]);
}

export function xpToReachLevel(level: number): number {
	if (level <= 1) return 0;
	return 50 * level * (level - 1);
}

export function levelFromXp(xp: number): number {
	let level = 1;
	while (xpToReachLevel(level + 1) <= xp) level += 1;
	return level;
}

export function xpProgressInLevel(xp: number): {
	level: number;
	xpIntoLevel: number;
	xpForNextLevel: number;
} {
	const level = levelFromXp(xp);
	const floor = xpToReachLevel(level);
	const next = xpToReachLevel(level + 1);
	return {
		level,
		xpIntoLevel: xp - floor,
		xpForNextLevel: next - floor,
	};
}

/** YYYY-MM-DD no fuso local do Date informado. */
export function localDateKey(d: Date): string {
	const y = d.getFullYear();
	const m = String(d.getMonth() + 1).padStart(2, "0");
	const day = String(d.getDate()).padStart(2, "0");
	return `${y}-${m}-${day}`;
}

export function addDays(dateKey: string, delta: number): string {
	const [ys, ms, ds] = dateKey.split("-");
	const y = Number(ys);
	const m = Number(ms);
	const d = Number(ds);
	const dt = new Date(y, m - 1, d);
	dt.setDate(dt.getDate() + delta);
	return localDateKey(dt);
}

/** Semana ISO: segunda como início; formato YYYY-Www. */
export function isoWeekKey(dateKey: string): string {
	const parts = dateKey.split("-").map(Number);
	const ys = parts[0];
	const ms = parts[1];
	const ds = parts[2];
	if (ys === undefined || ms === undefined || ds === undefined) return dateKey;
	const date = new Date(ys, ms - 1, ds);
	const day = date.getDay() || 7;
	date.setDate(date.getDate() + 4 - day);
	const yearStart = new Date(date.getFullYear(), 0, 1);
	const week = Math.ceil(((date.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
	const year = date.getFullYear();
	return `${year}-W${String(week).padStart(2, "0")}`;
}

export function cycleKeyFor(cadence: Cadence, todayKey: string, dueDate: string | null): string {
	switch (cadence) {
		case "daily":
			return todayKey;
		case "weekly":
			return isoWeekKey(todayKey);
		case "monthly":
			return todayKey.slice(0, 7);
		case "once":
			return dueDate ?? todayKey;
	}
}

export function emptyState(): GoalQuestState {
	return {
		missions: [],
		completions: [],
		xp: 0,
		streakCurrent: 0,
		streakBest: 0,
		streakCheckedOn: null,
		unlockedBadges: [],
		lastXpLoss: 0,
		lastXpLossOn: null,
	};
}

export function newId(): string {
	return globalThis.crypto?.randomUUID?.() ?? `gq-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function isMissionPending(mission: Mission, completions: readonly Completion[], todayKey: string): boolean {
	if (!mission.active) return false;
	if (mission.cadence === "once") {
		return !completions.some((c) => c.missionId === mission.id);
	}
	const key = cycleKeyFor(mission.cadence, todayKey, mission.dueDate);
	return !completions.some((c) => c.missionId === mission.id && c.cycleKey === key);
}

export function missionsForToday(state: GoalQuestState, todayKey: string): Mission[] {
	return state.missions.filter((m) => {
		if (!m.active || !isMissionPending(m, state.completions, todayKey)) return false;
		if (m.cadence === "daily" || m.cadence === "weekly" || m.cadence === "monthly") return true;
		if (m.cadence === "once" && m.dueDate !== null && m.dueDate <= todayKey) return true;
		return false;
	});
}

export function completeMission(
	state: GoalQuestState,
	missionId: string,
	todayKey: string,
	completedAtIso: string,
): GoalQuestState {
	const mission = state.missions.find((m) => m.id === missionId);
	if (!mission?.active) return state;
	if (!isMissionPending(mission, state.completions, todayKey)) return state;

	const cycleKey = cycleKeyFor(mission.cadence, todayKey, mission.dueDate);
	const xpAwarded = xpForMission(mission.cadence, mission.difficulty);
	const completion: Completion = {
		id: newId(),
		missionId,
		completedAt: completedAtIso,
		xpAwarded,
		cycleKey,
	};

	return {
		...state,
		xp: state.xp + xpAwarded,
		completions: [...state.completions, completion],
	};
}

function createdDateKey(iso: string): string {
	return localDateKey(new Date(iso));
}

export function requiredDailiesForDay(missions: readonly Mission[], dayKey: string): Mission[] {
	return missions.filter(
		(m) => m.active && m.required && m.cadence === "daily" && createdDateKey(m.createdAt) <= dayKey,
	);
}

function missedRequiredXp(missions: readonly Mission[], completions: readonly Completion[], dayKey: string): number {
	const required = requiredDailiesForDay(missions, dayKey);
	let loss = 0;
	for (const m of required) {
		const done = completions.some((c) => c.missionId === m.id && c.cycleKey === dayKey);
		if (!done) loss += xpForMission(m.cadence, m.difficulty);
	}
	return loss;
}

/**
 * Percorre dias desde o último check até ontem.
 * Acerto: streak sobe.
 * Falha com streak > 0: streak zera (escudo).
 * Falha com streak 0: perde XP das obrigatórias não feitas naquele dia.
 * Primeira visita (streakCheckedOn null): só marca o dia, sem cobrar passado.
 */
export function reconcileStreak(state: GoalQuestState, todayKey: string): GoalQuestState {
	if (state.streakCheckedOn !== null && state.streakCheckedOn >= todayKey) {
		return state;
	}

	if (state.streakCheckedOn === null) {
		return {
			...state,
			streakCheckedOn: todayKey,
			lastXpLoss: 0,
			lastXpLossOn: null,
		};
	}

	let streakCurrent = state.streakCurrent;
	let streakBest = state.streakBest;
	let xp = state.xp;
	let xpLostTotal = 0;

	for (let day = state.streakCheckedOn; day < todayKey; day = addDays(day, 1)) {
		const required = requiredDailiesForDay(state.missions, day);
		if (required.length === 0) continue;

		const allDone = required.every((m) => state.completions.some((c) => c.missionId === m.id && c.cycleKey === day));

		if (allDone) {
			streakCurrent += 1;
			streakBest = Math.max(streakBest, streakCurrent);
			continue;
		}

		if (streakCurrent > 0) {
			streakCurrent = 0;
			continue;
		}

		const loss = missedRequiredXp(state.missions, state.completions, day);
		if (loss > 0) {
			const applied = Math.min(xp, loss);
			xp -= applied;
			xpLostTotal += applied;
		}
	}

	return {
		...state,
		xp,
		streakCurrent,
		streakBest,
		streakCheckedOn: todayKey,
		lastXpLoss: xpLostTotal,
		lastXpLossOn: xpLostTotal > 0 ? todayKey : null,
	};
}

export interface BadgeDef {
	readonly id: string;
	readonly title: string;
	readonly description: string;
}

export const BADGE_DEFS: readonly BadgeDef[] = [
	{ id: "completions_1", title: "Primeiro passo", description: "Concluiu a primeira missão" },
	{ id: "first_daily", title: "Dia 1", description: "Primeira missão diária" },
	{ id: "first_weekly", title: "Semana 1", description: "Primeira missão semanal" },
	{ id: "first_monthly", title: "Mês 1", description: "Primeira missão mensal" },
	{ id: "first_once", title: "Data marcada", description: "Primeira missão de data única" },
	{ id: "all_cadences", title: "Ciclo completo", description: "Concluiu ao menos uma missão de cada cadência" },
	{ id: "first_required", title: "Compromisso", description: "Concluiu a primeira missão obrigatória" },
	{ id: "first_hard", title: "Modo difícil", description: "Concluiu a primeira missão difícil" },
	{ id: "hard_10", title: "Veterano difícil", description: "10 conclusões em dificuldade difícil" },
	{ id: "hard_25", title: "Lenda difícil", description: "25 conclusões em dificuldade difícil" },
	{ id: "streak_3", title: "Aquecendo", description: "Streak recorde de 3 dias" },
	{ id: "streak_7", title: "Semana firme", description: "Streak recorde de 7 dias" },
	{ id: "streak_14", title: "Quinzena", description: "Streak recorde de 14 dias" },
	{ id: "streak_30", title: "Mês de ferro", description: "Streak recorde de 30 dias" },
	{ id: "streak_60", title: "Dois meses", description: "Streak recorde de 60 dias" },
	{ id: "streak_100", title: "Centena de fogo", description: "Streak recorde de 100 dias" },
	{ id: "level_2", title: "Subindo", description: "Alcançou o nível 2" },
	{ id: "level_5", title: "Nível 5", description: "Alcançou o nível 5" },
	{ id: "level_10", title: "Nível 10", description: "Alcançou o nível 10" },
	{ id: "level_15", title: "Nível 15", description: "Alcançou o nível 15" },
	{ id: "level_25", title: "Nível 25", description: "Alcançou o nível 25" },
	{ id: "completions_10", title: "Dez feitos", description: "10 conclusões" },
	{ id: "completions_25", title: "Vinte e cinco", description: "25 conclusões" },
	{ id: "completions_50", title: "Cinquenta", description: "50 conclusões" },
	{ id: "completions_100", title: "Centurião", description: "100 conclusões" },
	{ id: "completions_200", title: "Ducenturião", description: "200 conclusões" },
	{ id: "xp_250", title: "Bolso de XP", description: "Acumulou 250 XP" },
	{ id: "xp_1000", title: "Mil XP", description: "Acumulou 1000 XP" },
	{ id: "xp_5000", title: "Tesouro de XP", description: "Acumulou 5000 XP" },
	{ id: "weekly_4", title: "Rotina semanal", description: "4 conclusões de missões semanais" },
	{ id: "monthly_3", title: "Olhar longo", description: "3 conclusões de missões mensais" },
	{ id: "once_5", title: "Agenda cheia", description: "5 conclusões de data única" },
];

function missionOf(state: GoalQuestState, missionId: string): Mission | undefined {
	return state.missions.find((x) => x.id === missionId);
}

function cadenceHasCompletion(state: GoalQuestState, cadence: Cadence): boolean {
	return state.completions.some((c) => missionOf(state, c.missionId)?.cadence === cadence);
}

function cadenceDoneCount(state: GoalQuestState): number {
	let n = 0;
	for (const cadence of ["daily", "weekly", "monthly", "once"] as const) {
		if (cadenceHasCompletion(state, cadence)) n += 1;
	}
	return n;
}

function countByCadence(state: GoalQuestState, cadence: Cadence): number {
	return state.completions.filter((c) => missionOf(state, c.missionId)?.cadence === cadence).length;
}

function countByDifficulty(state: GoalQuestState, difficulty: Difficulty): number {
	return state.completions.filter((c) => missionOf(state, c.missionId)?.difficulty === difficulty).length;
}

function countRequiredCompletions(state: GoalQuestState): number {
	return state.completions.filter((c) => missionOf(state, c.missionId)?.required === true).length;
}

export function evaluateBadges(state: GoalQuestState): string[] {
	const level = levelFromXp(state.xp);
	const total = state.completions.length;
	const hard = countByDifficulty(state, "hard");
	const weekly = countByCadence(state, "weekly");
	const monthly = countByCadence(state, "monthly");
	const once = countByCadence(state, "once");
	const required = countRequiredCompletions(state);
	const cadences = cadenceDoneCount(state);

	const earned: string[] = [];
	if (total >= 1) earned.push("completions_1");
	if (cadenceHasCompletion(state, "daily")) earned.push("first_daily");
	if (cadenceHasCompletion(state, "weekly")) earned.push("first_weekly");
	if (cadenceHasCompletion(state, "monthly")) earned.push("first_monthly");
	if (cadenceHasCompletion(state, "once")) earned.push("first_once");
	if (cadences >= 4) earned.push("all_cadences");
	if (required >= 1) earned.push("first_required");
	if (hard >= 1) earned.push("first_hard");
	if (hard >= 10) earned.push("hard_10");
	if (hard >= 25) earned.push("hard_25");
	if (state.streakBest >= 3) earned.push("streak_3");
	if (state.streakBest >= 7) earned.push("streak_7");
	if (state.streakBest >= 14) earned.push("streak_14");
	if (state.streakBest >= 30) earned.push("streak_30");
	if (state.streakBest >= 60) earned.push("streak_60");
	if (state.streakBest >= 100) earned.push("streak_100");
	if (level >= 2) earned.push("level_2");
	if (level >= 5) earned.push("level_5");
	if (level >= 10) earned.push("level_10");
	if (level >= 15) earned.push("level_15");
	if (level >= 25) earned.push("level_25");
	if (total >= 10) earned.push("completions_10");
	if (total >= 25) earned.push("completions_25");
	if (total >= 50) earned.push("completions_50");
	if (total >= 100) earned.push("completions_100");
	if (total >= 200) earned.push("completions_200");
	if (state.xp >= 250) earned.push("xp_250");
	if (state.xp >= 1000) earned.push("xp_1000");
	if (state.xp >= 5000) earned.push("xp_5000");
	if (weekly >= 4) earned.push("weekly_4");
	if (monthly >= 3) earned.push("monthly_3");
	if (once >= 5) earned.push("once_5");
	return earned;
}

export function applyBadges(state: GoalQuestState): GoalQuestState {
	const earned = evaluateBadges(state);
	const set = new Set([...state.unlockedBadges, ...earned]);
	return { ...state, unlockedBadges: [...set] };
}

export interface BadgeProgress {
	readonly current: number;
	readonly target: number;
	/** 0..1 quanto falta para desbloquear (1 = pronto / já feito). */
	readonly ratio: number;
}

export function badgeProgress(state: GoalQuestState, badgeId: string): BadgeProgress | null {
	const level = levelFromXp(state.xp);
	const total = state.completions.length;
	const hard = countByDifficulty(state, "hard");

	const metric = (current: number, target: number): BadgeProgress => ({
		current: Math.min(current, target),
		target,
		ratio: target <= 0 ? 1 : Math.min(1, current / target),
	});

	switch (badgeId) {
		case "completions_1":
			return metric(total, 1);
		case "first_daily":
			return metric(cadenceHasCompletion(state, "daily") ? 1 : 0, 1);
		case "first_weekly":
			return metric(cadenceHasCompletion(state, "weekly") ? 1 : 0, 1);
		case "first_monthly":
			return metric(cadenceHasCompletion(state, "monthly") ? 1 : 0, 1);
		case "first_once":
			return metric(cadenceHasCompletion(state, "once") ? 1 : 0, 1);
		case "all_cadences":
			return metric(cadenceDoneCount(state), 4);
		case "first_required":
			return metric(countRequiredCompletions(state) > 0 ? 1 : 0, 1);
		case "first_hard":
			return metric(hard > 0 ? 1 : 0, 1);
		case "hard_10":
			return metric(hard, 10);
		case "hard_25":
			return metric(hard, 25);
		case "streak_3":
			return metric(state.streakBest, 3);
		case "streak_7":
			return metric(state.streakBest, 7);
		case "streak_14":
			return metric(state.streakBest, 14);
		case "streak_30":
			return metric(state.streakBest, 30);
		case "streak_60":
			return metric(state.streakBest, 60);
		case "streak_100":
			return metric(state.streakBest, 100);
		case "level_2":
			return metric(level, 2);
		case "level_5":
			return metric(level, 5);
		case "level_10":
			return metric(level, 10);
		case "level_15":
			return metric(level, 15);
		case "level_25":
			return metric(level, 25);
		case "completions_10":
			return metric(total, 10);
		case "completions_25":
			return metric(total, 25);
		case "completions_50":
			return metric(total, 50);
		case "completions_100":
			return metric(total, 100);
		case "completions_200":
			return metric(total, 200);
		case "xp_250":
			return metric(state.xp, 250);
		case "xp_1000":
			return metric(state.xp, 1000);
		case "xp_5000":
			return metric(state.xp, 5000);
		case "weekly_4":
			return metric(countByCadence(state, "weekly"), 4);
		case "monthly_3":
			return metric(countByCadence(state, "monthly"), 3);
		case "once_5":
			return metric(countByCadence(state, "once"), 5);
		default:
			return null;
	}
}

/**
 * Ordem: 1) conquista bloqueada mais perto de completar,
 * 2) já desbloqueadas,
 * 3) demais bloqueadas (mais perto primeiro).
 */
export function orderBadgesForDisplay(state: GoalQuestState): BadgeDef[] {
	const unlocked = new Set(state.unlockedBadges);
	const locked = BADGE_DEFS.filter((b) => !unlocked.has(b.id));
	const done = BADGE_DEFS.filter((b) => unlocked.has(b.id));

	const byClosest = (a: BadgeDef, b: BadgeDef) => {
		const ra = badgeProgress(state, a.id)?.ratio ?? 0;
		const rb = badgeProgress(state, b.id)?.ratio ?? 0;
		if (rb !== ra) return rb - ra;
		return BADGE_DEFS.findIndex((x) => x.id === a.id) - BADGE_DEFS.findIndex((x) => x.id === b.id);
	};

	const lockedSorted = [...locked].sort(byClosest);
	const closest = lockedSorted[0];
	const restLocked = lockedSorted.slice(1);

	if (!closest) return done;
	return [closest, ...done, ...restLocked];
}
