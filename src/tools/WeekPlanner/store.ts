import { createJsonPersistentAtom } from "@/lib/toolStorage/persistentAtom";
import type { ToolStorageEntry } from "@/lib/toolStorage/types";
import { canSaveBlockFields } from "./plannerDomain";

export const WEEK_DAY_ORDER = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"] as const;

export type WeekDayId = (typeof WEEK_DAY_ORDER)[number];

export const WEEK_DAY_LABEL: Record<WeekDayId, string> = {
	mon: "Segunda",
	tue: "Terça",
	wed: "Quarta",
	thu: "Quinta",
	fri: "Sexta",
	sat: "Sábado",
	sun: "Domingo",
};

export interface WeekTimeBlock {
	readonly id: string;
	readonly start: string;
	readonly end: string;
	readonly title: string;
	/** Rascunho: editável. Depois de guardar, fica fixo (só apagar). */
	readonly saved: boolean;
	/** O mesmo `groupId` = um único “bloco lógico” espelhado nesse id em todos os dias. */
	readonly groupId: string | null;
}

export type WeekPlan = Record<WeekDayId, readonly WeekTimeBlock[]>;

function emptyPlan(): WeekPlan {
	return {
		mon: [],
		tue: [],
		wed: [],
		thu: [],
		fri: [],
		sat: [],
		sun: [],
	};
}

function normalizePlan(raw: unknown): WeekPlan {
	const base = emptyPlan();
	if (!raw || typeof raw !== "object" || Array.isArray(raw)) return base;

	for (const key of WEEK_DAY_ORDER) {
		const v = (raw as Record<string, unknown>)[key];
		if (!Array.isArray(v)) continue;
		const blocks: WeekTimeBlock[] = [];
		for (const item of v) {
			if (!item || typeof item !== "object") continue;
			const o = item as Record<string, unknown>;
			if (typeof o.id !== "string") continue;
			const start = typeof o.start === "string" ? o.start : "";
			const end = typeof o.end === "string" ? o.end : "";
			const hasSavedKey = "saved" in o;
			blocks.push({
				id: o.id,
				start,
				end,
				title: typeof o.title === "string" ? o.title : "",
				saved: hasSavedKey ? o.saved === true : true,
				groupId: typeof o.groupId === "string" ? o.groupId : null,
			});
		}
		(base as Record<WeekDayId, WeekTimeBlock[]>)[key] = blocks;
	}
	return base;
}

const WEEK_PLANNER_STORAGE_KEY = "week_planner_v1";
const defaultPlan = emptyPlan();

export const weekPlan$ = createJsonPersistentAtom<WeekPlan>({
	storageKey: WEEK_PLANNER_STORAGE_KEY,
	defaultValue: defaultPlan,
	normalize: normalizePlan,
});

export const weekPlannerStorage: ToolStorageEntry = {
	toolId: "week_planner",
	keys: [WEEK_PLANNER_STORAGE_KEY],
	atoms: { [WEEK_PLANNER_STORAGE_KEY]: weekPlan$ },
};

function replaceDay(plan: WeekPlan, day: WeekDayId, blocks: readonly WeekTimeBlock[]): WeekPlan {
	return { ...plan, [day]: [...blocks] as WeekTimeBlock[] };
}

function newBlockInGroup(groupId: string | null): WeekTimeBlock {
	const id = globalThis.crypto?.randomUUID?.() ?? `b-${Date.now()}-${Math.random().toString(16).slice(2)}`;
	return {
		id,
		start: "",
		end: "",
		title: "",
		saved: false,
		groupId,
	};
}

/** Cria o mesmo rascunho lógico no fim de **cada** dia: uma edição, guardar ou apagar aplica a todos. */
export function addWeekBlockToAllDays(): void {
	const plan = weekPlan$.get();
	const groupId = globalThis.crypto?.randomUUID?.() ?? `g-${Date.now()}`;
	let next: WeekPlan = plan;
	for (const d of WEEK_DAY_ORDER) {
		const block = newBlockInGroup(groupId);
		next = { ...next, [d]: [...next[d], block] } as WeekPlan;
	}
	weekPlan$.set(next);
}

/** Cria um rascunho só neste dia (`groupId` null: edição/guardar/apagar não espelha). */
export function addWeekBlockToDay(day: WeekDayId): void {
	const plan = weekPlan$.get();
	const block = newBlockInGroup(null);
	weekPlan$.set(replaceDay(plan, day, [...plan[day], block]));
}

export function updateWeekBlock(
	day: WeekDayId,
	id: string,
	patch: Partial<Pick<WeekTimeBlock, "start" | "end" | "title">>,
): void {
	const plan = weekPlan$.get();
	const block = plan[day].find((b) => b.id === id);
	if (!block || block.saved) return;
	if (block.groupId) {
		const g = block.groupId;
		let next: WeekPlan = plan;
		for (const d of WEEK_DAY_ORDER) {
			next = {
				...next,
				[d]: next[d].map((b) => (b.groupId === g && !b.saved ? { ...b, ...patch } : b)),
			} as WeekPlan;
		}
		weekPlan$.set(next);
		return;
	}
	const list = plan[day].map((b) => (b.id === id && !b.saved ? { ...b, ...patch } : b));
	weekPlan$.set(replaceDay(plan, day, list));
}

export function saveWeekBlock(day: WeekDayId, id: string): void {
	const plan = weekPlan$.get();
	const block = plan[day].find((b) => b.id === id);
	if (!block || block.saved) return;
	if (!canSaveBlockFields(block.start, block.end, block.title)) return;
	if (block.groupId) {
		const g = block.groupId;
		let next: WeekPlan = plan;
		for (const d of WEEK_DAY_ORDER) {
			next = {
				...next,
				[d]: next[d].map((b) => (b.groupId === g ? { ...b, saved: true } : b)),
			} as WeekPlan;
		}
		weekPlan$.set(next);
		return;
	}
	const list = plan[day].map((b) => (b.id === id ? { ...b, saved: true } : b));
	weekPlan$.set(replaceDay(plan, day, list));
}

export function removeWeekBlock(day: WeekDayId, id: string): void {
	const plan = weekPlan$.get();
	const block = plan[day].find((b) => b.id === id);
	if (!block) return;
	if (block.groupId) {
		const g = block.groupId;
		let next: WeekPlan = plan;
		for (const d of WEEK_DAY_ORDER) {
			next = { ...next, [d]: next[d].filter((b) => b.groupId !== g) } as WeekPlan;
		}
		weekPlan$.set(next);
		return;
	}
	const list = plan[day].filter((b) => b.id !== id);
	weekPlan$.set(replaceDay(plan, day, list));
}

function canMoveGroupInAllDays(plan: WeekPlan, groupId: string, direction: -1 | 1): boolean {
	for (const d of WEEK_DAY_ORDER) {
		const L = plan[d];
		const i = L.findIndex((b) => b.groupId === groupId);
		if (i === -1) return false;
		const j = i + direction;
		if (j < 0 || j >= L.length) return false;
	}
	return true;
}

export function moveWeekBlock(day: WeekDayId, blockId: string, direction: -1 | 1): void {
	const plan = weekPlan$.get();
	const list = plan[day];
	const block = list.find((b) => b.id === blockId);
	if (!block) return;
	if (block.groupId) {
		const g = block.groupId;
		if (!canMoveGroupInAllDays(plan, g, direction)) return;
		let next: WeekPlan = plan;
		for (const d of WEEK_DAY_ORDER) {
			const L = [...next[d]];
			const i = L.findIndex((b) => b.groupId === g);
			const j = i + direction;
			if (i === -1 || j < 0 || j >= L.length) continue;
			const current = L[i];
			const target = L[j];
			if (!current || !target) continue;
			L[i] = target;
			L[j] = current;
			next = replaceDay(next, d, L);
		}
		weekPlan$.set(next);
		return;
	}
	const local = [...list];
	const i = local.findIndex((b) => b.id === blockId);
	if (i === -1) return;
	const j = i + direction;
	if (j < 0 || j >= local.length) return;
	const current = local[i];
	const target = local[j];
	if (!current || !target) return;
	local[i] = target;
	local[j] = current;
	weekPlan$.set(replaceDay(plan, day, local));
}
