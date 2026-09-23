import { createJsonPersistentAtom } from "@/lib/toolStorage/persistentAtom";
import type { ToolStorageEntry } from "@/lib/toolStorage/types";
import {
	applyBadges,
	type Cadence,
	completeMission,
	type Difficulty,
	emptyState,
	type GoalQuestState,
	localDateKey,
	type Mission,
	newId,
	reconcileStreak,
} from "./domain";

const STORAGE_KEY = "goal_quest:state_v1";

function isCadence(v: unknown): v is Cadence {
	return v === "daily" || v === "weekly" || v === "monthly" || v === "once";
}

function isDifficulty(v: unknown): v is Difficulty {
	return v === "easy" || v === "medium" || v === "hard";
}

function normalizeMission(raw: unknown): Mission | null {
	if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
	const o = raw as Record<string, unknown>;
	if (typeof o.id !== "string" || o.id === "") return null;
	if (typeof o.title !== "string" || o.title.trim() === "") return null;
	if (!isCadence(o.cadence) || !isDifficulty(o.difficulty)) return null;
	const dueDate =
		o.cadence === "once"
			? typeof o.dueDate === "string" && /^\d{4}-\d{2}-\d{2}$/.test(o.dueDate)
				? o.dueDate
				: null
			: null;
	if (o.cadence === "once" && dueDate === null) return null;
	const createdAt = typeof o.createdAt === "string" ? o.createdAt : new Date().toISOString();
	const updatedAt = typeof o.updatedAt === "string" ? o.updatedAt : createdAt;
	return {
		id: o.id,
		title: o.title.trim(),
		notes: typeof o.notes === "string" ? o.notes : "",
		cadence: o.cadence,
		difficulty: o.difficulty,
		required: o.required === true,
		active: o.active !== false,
		dueDate,
		createdAt,
		updatedAt,
	};
}

function normalizeState(raw: unknown): GoalQuestState {
	const base = emptyState();
	if (!raw || typeof raw !== "object" || Array.isArray(raw)) return base;
	const o = raw as Record<string, unknown>;
	const missions = Array.isArray(o.missions)
		? o.missions.map(normalizeMission).filter((m): m is Mission => m !== null)
		: [];
	const completions = Array.isArray(o.completions)
		? o.completions.flatMap((c) => {
				if (!c || typeof c !== "object") return [];
				const x = c as Record<string, unknown>;
				if (typeof x.id !== "string" || typeof x.missionId !== "string") return [];
				if (typeof x.completedAt !== "string" || typeof x.cycleKey !== "string") return [];
				const xpAwarded = typeof x.xpAwarded === "number" && Number.isFinite(x.xpAwarded) ? x.xpAwarded : 0;
				return [
					{
						id: x.id,
						missionId: x.missionId,
						completedAt: x.completedAt,
						xpAwarded,
						cycleKey: x.cycleKey,
					},
				];
			})
		: [];
	return {
		missions,
		completions,
		xp: typeof o.xp === "number" && Number.isFinite(o.xp) && o.xp >= 0 ? o.xp : 0,
		streakCurrent:
			typeof o.streakCurrent === "number" && Number.isFinite(o.streakCurrent) && o.streakCurrent >= 0
				? Math.floor(o.streakCurrent)
				: 0,
		streakBest:
			typeof o.streakBest === "number" && Number.isFinite(o.streakBest) && o.streakBest >= 0
				? Math.floor(o.streakBest)
				: 0,
		streakCheckedOn:
			typeof o.streakCheckedOn === "string" && /^\d{4}-\d{2}-\d{2}$/.test(o.streakCheckedOn) ? o.streakCheckedOn : null,
		unlockedBadges: Array.isArray(o.unlockedBadges)
			? o.unlockedBadges.filter((b): b is string => typeof b === "string")
			: [],
		lastXpLoss:
			typeof o.lastXpLoss === "number" && Number.isFinite(o.lastXpLoss) && o.lastXpLoss >= 0
				? Math.floor(o.lastXpLoss)
				: 0,
		lastXpLossOn:
			typeof o.lastXpLossOn === "string" && /^\d{4}-\d{2}-\d{2}$/.test(o.lastXpLossOn) ? o.lastXpLossOn : null,
	};
}

export const goalQuest$ = createJsonPersistentAtom<GoalQuestState>({
	storageKey: STORAGE_KEY,
	defaultValue: emptyState(),
	normalize: normalizeState,
});

export const goalQuestStorage: ToolStorageEntry = {
	toolId: "goal_quest",
	keys: [STORAGE_KEY],
	atoms: { [STORAGE_KEY]: goalQuest$ },
};

export interface MissionInput {
	readonly id?: string;
	readonly title: string;
	readonly notes: string;
	readonly cadence: Cadence;
	readonly difficulty: Difficulty;
	readonly required: boolean;
	readonly dueDate: string | null;
}

export function upsertMission(input: MissionInput): string {
	const now = new Date().toISOString();
	const state = goalQuest$.get();
	const id = input.id ?? newId();
	const existing = state.missions.find((m) => m.id === id);
	const nextMission: Mission = {
		id,
		title: input.title.trim(),
		notes: input.notes,
		cadence: input.cadence,
		difficulty: input.difficulty,
		required: input.required,
		active: existing?.active ?? true,
		dueDate: input.cadence === "once" ? input.dueDate : null,
		createdAt: existing?.createdAt ?? now,
		updatedAt: now,
	};
	if (nextMission.title === "") return "";
	if (nextMission.cadence === "once" && !nextMission.dueDate) return "";

	const missions = existing
		? state.missions.map((m) => (m.id === id ? nextMission : m))
		: [...state.missions, nextMission];
	goalQuest$.set({ ...state, missions });
	return id;
}

export function setMissionActive(id: string, active: boolean): void {
	const state = goalQuest$.get();
	goalQuest$.set({
		...state,
		missions: state.missions.map((m) => (m.id === id ? { ...m, active, updatedAt: new Date().toISOString() } : m)),
	});
}

export function reconcileNow(now = new Date()): void {
	const todayKey = localDateKey(now);
	const next = applyBadges(reconcileStreak(goalQuest$.get(), todayKey));
	goalQuest$.set(next);
}

export function completeMissionAction(missionId: string, now = new Date()): void {
	const todayKey = localDateKey(now);
	let next = completeMission(goalQuest$.get(), missionId, todayKey, now.toISOString());
	next = reconcileStreak(next, todayKey);
	next = applyBadges(next);
	goalQuest$.set(next);
}
