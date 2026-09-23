# Goal Quest Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Entregar a tool web Goal Quest em `/app/goal-quest/` com missões por cadência, XP/nível, streak de diárias obrigatórias, badges, histórico e persistência local.

**Architecture:** Domínio puro em `domain.ts` (testável sem React); estado em `store.ts` via `createJsonPersistentAtom`; UI em abas dentro de `ToolShell`, seguindo `tools.md` e tokens de `toolUi.ts`.

**Tech Stack:** Astro 7, React 19, TypeScript, nanostores, `@nanostores/react`, Vitest, Lucide, Tailwind v4 (tokens do hub).

## Global Constraints

- Nomes: componente `GoalQuest`, slug `goal-quest`, toolId `goal_quest`, storage `goal_quest:state_v1`
- Copy/UI em português brasileiro
- Layout: coluna até `md`; `flex-row` / multi-coluna só a partir de `lg`
- Sem `any`; sem `@ts-ignore`; null/undefined explícitos
- Sem em dash / en dash em textos
- Commits: Conventional Commits em português quando o usuário autorizar commits
- Spec: `docs/superpowers/specs/2026-09-23-goal-quest-design.md`

## File structure

| File | Responsibility |
|------|----------------|
| `src/tools/GoalQuest/domain.ts` | Tipos + XP, level, cycleKey, pending, complete, streak, badges |
| `src/tools/GoalQuest/domain.test.ts` | Testes unitários do domínio |
| `src/tools/GoalQuest/store.ts` | Atom persistente, normalize, ações |
| `src/tools/GoalQuest/GoalQuest.tsx` | Entry + ToolShell |
| `src/tools/GoalQuest/GoalQuestView.tsx` | Abas e orquestração de UI |
| `src/tools/GoalQuest/ui/TodayTab.tsx` | Lista do dia + resumo + concluir |
| `src/tools/GoalQuest/ui/MissionsTab.tsx` | CRUD + filtros |
| `src/tools/GoalQuest/ui/MissionForm.tsx` | Formulário criar/editar |
| `src/tools/GoalQuest/ui/ProgressTab.tsx` | XP, nível, streak, badges |
| `src/tools/GoalQuest/ui/HistoryTab.tsx` | Completions 60 dias |
| `src/content/posts/tools/goal-quest.md` | Listagem |
| `src/pages/app/[slug].astro` | Import + case |

---

### Task 1: Domínio — tipos, XP, nível, cycleKey

**Files:**
- Create: `src/tools/GoalQuest/domain.ts`
- Create: `src/tools/GoalQuest/domain.test.ts`

**Interfaces:**
- Produces: tipos `Cadence`, `Difficulty`, `Mission`, `Completion`, `GoalQuestState`, `BadgeId`; funções `xpForMission`, `xpToReachLevel`, `levelFromXp`, `xpProgressInLevel`, `localDateKey`, `addDays`, `cycleKeyFor`, `isoWeekKey`

- [ ] **Step 1: Write the failing test**

```ts
// src/tools/GoalQuest/domain.test.ts
import { describe, expect, it } from "vitest";
import {
	cycleKeyFor,
	isoWeekKey,
	levelFromXp,
	xpForMission,
	xpProgressInLevel,
	xpToReachLevel,
} from "./domain";

describe("xpForMission", () => {
	it("aplica base e multiplicador", () => {
		expect(xpForMission("daily", "easy")).toBe(10);
		expect(xpForMission("daily", "medium")).toBe(15);
		expect(xpForMission("daily", "hard")).toBe(20);
		expect(xpForMission("weekly", "easy")).toBe(40);
		expect(xpForMission("monthly", "hard")).toBe(240);
		expect(xpForMission("once", "medium")).toBe(120);
	});
});

describe("levelFromXp", () => {
	it("segue curva 50*N*(N-1)", () => {
		expect(xpToReachLevel(1)).toBe(0);
		expect(xpToReachLevel(2)).toBe(100);
		expect(xpToReachLevel(3)).toBe(300);
		expect(levelFromXp(0)).toBe(1);
		expect(levelFromXp(99)).toBe(1);
		expect(levelFromXp(100)).toBe(2);
		expect(levelFromXp(300)).toBe(3);
	});

	it("progresso dentro do nível", () => {
		const p = xpProgressInLevel(150);
		expect(p.level).toBe(2);
		expect(p.xpIntoLevel).toBe(50);
		expect(p.xpForNextLevel).toBe(200); // 300 - 100
	});
});

describe("cycleKeyFor", () => {
	it("gera chaves por cadência", () => {
		expect(cycleKeyFor("daily", "2026-09-23", null)).toBe("2026-09-23");
		expect(cycleKeyFor("monthly", "2026-09-23", null)).toBe("2026-09");
		expect(cycleKeyFor("once", "2026-09-23", "2026-12-31")).toBe("2026-12-31");
		expect(cycleKeyFor("weekly", "2026-09-23", null)).toBe(isoWeekKey("2026-09-23"));
		expect(isoWeekKey("2026-09-23")).toBe("2026-W39");
	});
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/tools/GoalQuest/domain.test.ts`
Expected: FAIL (módulo ou exports ausentes)

- [ ] **Step 3: Write minimal implementation**

```ts
// src/tools/GoalQuest/domain.ts
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
	const [ys, ms, ds] = dateKey.split("-").map(Number);
	const date = new Date(ys!, ms! - 1, ds!);
	const day = date.getDay() || 7;
	date.setDate(date.getDate() + 4 - day);
	const yearStart = new Date(date.getFullYear(), 0, 1);
	const week = Math.ceil(((date.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
	const year = date.getFullYear();
	return `${year}-W${String(week).padStart(2, "0")}`;
}

export function cycleKeyFor(
	cadence: Cadence,
	todayKey: string,
	dueDate: string | null,
): string {
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
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test -- src/tools/GoalQuest/domain.test.ts`
Expected: PASS

- [ ] **Step 5: Commit** (somente se o usuário autorizar commits nesta sessão)

```bash
git add src/tools/GoalQuest/domain.ts src/tools/GoalQuest/domain.test.ts
git commit -m "$(cat <<'EOF'
feat(goal-quest): add XP, level and cycleKey domain

EOF
)"
```

---

### Task 2: Domínio — pending, completeMission

**Files:**
- Modify: `src/tools/GoalQuest/domain.ts`
- Modify: `src/tools/GoalQuest/domain.test.ts`

**Interfaces:**
- Consumes: tipos e `xpForMission`, `cycleKeyFor` da Task 1
- Produces: `isMissionPending`, `missionsForToday`, `completeMission`, `emptyState`, `newId`

- [ ] **Step 1: Append failing tests**

```ts
import {
	completeMission,
	emptyState,
	isMissionPending,
	missionsForToday,
	type Mission,
	type GoalQuestState,
} from "./domain";

function mission(partial: Partial<Mission> & Pick<Mission, "id" | "cadence">): Mission {
	return {
		title: "t",
		notes: "",
		difficulty: "easy",
		required: false,
		active: true,
		dueDate: null,
		createdAt: "2026-09-01T00:00:00.000Z",
		updatedAt: "2026-09-01T00:00:00.000Z",
		...partial,
	};
}

describe("isMissionPending", () => {
	it("pendente sem completion no ciclo", () => {
		const m = mission({ id: "1", cadence: "daily" });
		const state: GoalQuestState = { ...emptyState(), missions: [m] };
		expect(isMissionPending(m, state.completions, "2026-09-23")).toBe(true);
	});

	it("não pendente após completion do ciclo", () => {
		const m = mission({ id: "1", cadence: "daily" });
		const state: GoalQuestState = {
			...emptyState(),
			missions: [m],
			completions: [
				{
					id: "c1",
					missionId: "1",
					completedAt: "2026-09-23T12:00:00.000Z",
					xpAwarded: 10,
					cycleKey: "2026-09-23",
				},
			],
		};
		expect(isMissionPending(m, state.completions, "2026-09-23")).toBe(false);
		expect(isMissionPending(m, state.completions, "2026-09-24")).toBe(true);
	});

	it("once concluída nunca volta", () => {
		const m = mission({ id: "1", cadence: "once", dueDate: "2026-09-20" });
		const completions = [
			{
				id: "c1",
				missionId: "1",
				completedAt: "2026-09-20T12:00:00.000Z",
				xpAwarded: 80,
				cycleKey: "2026-09-20",
			},
		];
		expect(isMissionPending(m, completions, "2026-09-23")).toBe(false);
	});
});

describe("missionsForToday", () => {
	it("inclui diárias pendentes e once atrasadas", () => {
		const daily = mission({ id: "d", cadence: "daily" });
		const onceOverdue = mission({ id: "o", cadence: "once", dueDate: "2026-09-20" });
		const weekly = mission({ id: "w", cadence: "weekly" });
		const state: GoalQuestState = {
			...emptyState(),
			missions: [daily, onceOverdue, weekly],
		};
		const list = missionsForToday(state, "2026-09-23");
		expect(list.map((x) => x.id).sort()).toEqual(["d", "o"]);
	});
});

describe("completeMission", () => {
	it("soma XP e grava completion", () => {
		const m = mission({ id: "1", cadence: "daily", difficulty: "hard" });
		const state: GoalQuestState = { ...emptyState(), missions: [m] };
		const next = completeMission(state, "1", "2026-09-23", "2026-09-23T15:00:00.000Z");
		expect(next.xp).toBe(20);
		expect(next.completions).toHaveLength(1);
		expect(next.completions[0]?.cycleKey).toBe("2026-09-23");
		expect(isMissionPending(m, next.completions, "2026-09-23")).toBe(false);
	});

	it("é no-op se já concluída no ciclo", () => {
		const m = mission({ id: "1", cadence: "daily" });
		let state: GoalQuestState = { ...emptyState(), missions: [m] };
		state = completeMission(state, "1", "2026-09-23", "2026-09-23T15:00:00.000Z");
		const again = completeMission(state, "1", "2026-09-23", "2026-09-23T16:00:00.000Z");
		expect(again.completions).toHaveLength(1);
		expect(again.xp).toBe(10);
	});
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/tools/GoalQuest/domain.test.ts`
Expected: FAIL (exports ausentes)

- [ ] **Step 3: Implement**

```ts
export function emptyState(): GoalQuestState {
	return {
		missions: [],
		completions: [],
		xp: 0,
		streakCurrent: 0,
		streakBest: 0,
		streakCheckedOn: null,
		unlockedBadges: [],
	};
}

export function newId(): string {
	return globalThis.crypto?.randomUUID?.() ?? `gq-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function isMissionPending(
	mission: Mission,
	completions: readonly Completion[],
	todayKey: string,
): boolean {
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
		if (m.cadence === "daily") return true;
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
	if (!mission || !mission.active) return state;
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
```

- [ ] **Step 4: Run tests — expect PASS**

Run: `npm test -- src/tools/GoalQuest/domain.test.ts`

- [ ] **Step 5: Commit** (se autorizado)

```bash
git add src/tools/GoalQuest/domain.ts src/tools/GoalQuest/domain.test.ts
git commit -m "$(cat <<'EOF'
feat(goal-quest): add pending and completeMission logic

EOF
)"
```

---

### Task 3: Domínio — reconcileStreak

**Files:**
- Modify: `src/tools/GoalQuest/domain.ts`
- Modify: `src/tools/GoalQuest/domain.test.ts`

**Interfaces:**
- Produces: `requiredDailiesForDay`, `reconcileStreak`

**Nota de implementação:** sem snapshot histórico de “quais missões existiam no dia R”. Contar missões `daily && required && active` com data local de `createdAt` ≤ R.

- [ ] **Step 1: Append failing tests**

```ts
import { reconcileStreak } from "./domain";

describe("reconcileStreak", () => {
	it("não altera se já reconciliou hoje", () => {
		const m = mission({ id: "1", cadence: "daily", required: true });
		const state: GoalQuestState = {
			...emptyState(),
			missions: [m],
			streakCurrent: 2,
			streakCheckedOn: "2026-09-23",
		};
		const next = reconcileStreak(state, "2026-09-23");
		expect(next.streakCurrent).toBe(2);
	});

	it("incrementa quando ontem todas obrigatórias foram feitas", () => {
		const m = mission({
			id: "1",
			cadence: "daily",
			required: true,
			createdAt: "2026-09-01T00:00:00.000Z",
		});
		const state: GoalQuestState = {
			...emptyState(),
			missions: [m],
			streakCurrent: 1,
			streakBest: 1,
			streakCheckedOn: "2026-09-22",
			completions: [
				{
					id: "c1",
					missionId: "1",
					completedAt: "2026-09-22T10:00:00.000Z",
					xpAwarded: 10,
					cycleKey: "2026-09-22",
				},
			],
		};
		const next = reconcileStreak(state, "2026-09-23");
		expect(next.streakCurrent).toBe(2);
		expect(next.streakBest).toBe(2);
		expect(next.streakCheckedOn).toBe("2026-09-23");
	});

	it("zera quando ontem faltou obrigatória", () => {
		const m = mission({
			id: "1",
			cadence: "daily",
			required: true,
			createdAt: "2026-09-01T00:00:00.000Z",
		});
		const state: GoalQuestState = {
			...emptyState(),
			missions: [m],
			streakCurrent: 5,
			streakBest: 5,
			streakCheckedOn: "2026-09-22",
		};
		const next = reconcileStreak(state, "2026-09-23");
		expect(next.streakCurrent).toBe(0);
		expect(next.streakBest).toBe(5);
	});

	it("pausa (não sobe nem zera) sem diárias obrigatórias ativas ontem", () => {
		const state: GoalQuestState = {
			...emptyState(),
			streakCurrent: 3,
			streakBest: 3,
			streakCheckedOn: "2026-09-22",
		};
		const next = reconcileStreak(state, "2026-09-23");
		expect(next.streakCurrent).toBe(3);
		expect(next.streakCheckedOn).toBe("2026-09-23");
	});
});
```

- [ ] **Step 2: Run — expect FAIL**

- [ ] **Step 3: Implement**

```ts
function createdDateKey(iso: string): string {
	return localDateKey(new Date(iso));
}

export function requiredDailiesForDay(
	missions: readonly Mission[],
	dayKey: string,
): Mission[] {
	return missions.filter(
		(m) =>
			m.active &&
			m.required &&
			m.cadence === "daily" &&
			createdDateKey(m.createdAt) <= dayKey,
	);
}

export function reconcileStreak(state: GoalQuestState, todayKey: string): GoalQuestState {
	if (state.streakCheckedOn !== null && state.streakCheckedOn >= todayKey) {
		return state;
	}

	const refDay = addDays(todayKey, -1);
	const required = requiredDailiesForDay(state.missions, refDay);

	let streakCurrent = state.streakCurrent;
	if (required.length > 0) {
		const allDone = required.every((m) =>
			state.completions.some((c) => c.missionId === m.id && c.cycleKey === refDay),
		);
		streakCurrent = allDone ? state.streakCurrent + 1 : 0;
	}

	const streakBest = Math.max(state.streakBest, streakCurrent);
	return {
		...state,
		streakCurrent,
		streakBest,
		streakCheckedOn: todayKey,
	};
}
```

- [ ] **Step 4: Run — expect PASS**

- [ ] **Step 5: Commit** (se autorizado)

```bash
git add src/tools/GoalQuest/domain.ts src/tools/GoalQuest/domain.test.ts
git commit -m "$(cat <<'EOF'
feat(goal-quest): add streak reconcile rules

EOF
)"
```

---

### Task 4: Domínio — badges

**Files:**
- Modify: `src/tools/GoalQuest/domain.ts`
- Modify: `src/tools/GoalQuest/domain.test.ts`

**Interfaces:**
- Produces: `BADGE_DEFS`, `evaluateBadges`, `applyBadges`; ids exatamente como na spec

- [ ] **Step 1: Append failing tests**

```ts
import { applyBadges, evaluateBadges, levelFromXp } from "./domain";

describe("evaluateBadges", () => {
	it("desbloqueia first_daily e completions_10", () => {
		const m = mission({ id: "1", cadence: "daily" });
		const completions = Array.from({ length: 10 }, (_, i) => ({
			id: `c${i}`,
			missionId: "1",
			completedAt: `2026-09-${String(i + 1).padStart(2, "0")}T12:00:00.000Z`,
			xpAwarded: 10,
			cycleKey: `2026-09-${String(i + 1).padStart(2, "0")}`,
		}));
		const state: GoalQuestState = {
			...emptyState(),
			missions: [m],
			completions,
			xp: 100,
			streakBest: 3,
		};
		const ids = evaluateBadges(state);
		expect(ids).toContain("first_daily");
		expect(ids).toContain("completions_10");
		expect(ids).toContain("streak_3");
		expect(ids).toContain("level_5"); // levelFromXp(100) === 2? Wait: 100 XP = level 2
	});
});
```

**Correção do teste:** com 100 XP o nível é 2; `level_5` precisa de `xpToReachLevel(5) = 50*5*4 = 1000`. Ajuste o teste:

```ts
expect(ids).toContain("first_daily");
expect(ids).toContain("completions_10");
expect(ids).toContain("streak_3");
expect(levelFromXp(state.xp)).toBe(2);
expect(ids).not.toContain("level_5");

const rich = applyBadges({ ...state, xp: 1000, streakBest: 30 });
expect(rich.unlockedBadges).toContain("level_5");
expect(rich.unlockedBadges).toContain("streak_30");
```

- [ ] **Step 2: Run — expect FAIL**

- [ ] **Step 3: Implement**

```ts
export interface BadgeDef {
	readonly id: string;
	readonly title: string;
	readonly description: string;
}

export const BADGE_DEFS: readonly BadgeDef[] = [
	{ id: "streak_3", title: "Aquecendo", description: "Streak recorde de 3 dias" },
	{ id: "streak_7", title: "Semana firme", description: "Streak recorde de 7 dias" },
	{ id: "streak_30", title: "Mês de ferro", description: "Streak recorde de 30 dias" },
	{ id: "level_5", title: "Nível 5", description: "Alcançou o nível 5" },
	{ id: "level_10", title: "Nível 10", description: "Alcançou o nível 10" },
	{ id: "completions_10", title: "Dez feitos", description: "10 conclusões" },
	{ id: "completions_50", title: "Cinquenta", description: "50 conclusões" },
	{ id: "completions_100", title: "Centurião", description: "100 conclusões" },
	{ id: "first_daily", title: "Dia 1", description: "Primeira missão diária" },
	{ id: "first_weekly", title: "Semana 1", description: "Primeira missão semanal" },
	{ id: "first_monthly", title: "Mês 1", description: "Primeira missão mensal" },
	{ id: "first_once", title: "Data marcada", description: "Primeira missão de data única" },
];

export function evaluateBadges(state: GoalQuestState): string[] {
	const level = levelFromXp(state.xp);
	const total = state.completions.length;
	const cadenceDone = (cadence: Cadence) =>
		state.completions.some((c) => {
			const m = state.missions.find((x) => x.id === c.missionId);
			return m?.cadence === cadence;
		});

	const earned: string[] = [];
	if (state.streakBest >= 3) earned.push("streak_3");
	if (state.streakBest >= 7) earned.push("streak_7");
	if (state.streakBest >= 30) earned.push("streak_30");
	if (level >= 5) earned.push("level_5");
	if (level >= 10) earned.push("level_10");
	if (total >= 10) earned.push("completions_10");
	if (total >= 50) earned.push("completions_50");
	if (total >= 100) earned.push("completions_100");
	if (cadenceDone("daily")) earned.push("first_daily");
	if (cadenceDone("weekly")) earned.push("first_weekly");
	if (cadenceDone("monthly")) earned.push("first_monthly");
	if (cadenceDone("once")) earned.push("first_once");
	return earned;
}

export function applyBadges(state: GoalQuestState): GoalQuestState {
	const earned = evaluateBadges(state);
	const set = new Set([...state.unlockedBadges, ...earned]);
	return { ...state, unlockedBadges: [...set] };
}
```

Atualizar `completeMission` para, no final, chamar `applyBadges` no estado retornado (ou deixar o store fazer `applyBadges(reconcileStreak(completeMission(...)))`). Preferência do plano: **store compõe**; `completeMission` puro só XP/completion. Testes de badge usam `applyBadges` direto.

- [ ] **Step 4: Run — expect PASS**

- [ ] **Step 5: Commit** (se autorizado)

```bash
git add src/tools/GoalQuest/domain.ts src/tools/GoalQuest/domain.test.ts
git commit -m "$(cat <<'EOF'
feat(goal-quest): add badge evaluation

EOF
)"
```

---

### Task 5: Store persistente + ações

**Files:**
- Create: `src/tools/GoalQuest/store.ts`

**Interfaces:**
- Consumes: domínio Task 1–4
- Produces: `goalQuest$`, `goalQuestStorage`, `upsertMission`, `archiveMission`, `completeMissionAction`, `reconcileNow`

- [ ] **Step 1: Implement store** (padrão ScratchPad/CookingBook)

```ts
// src/tools/GoalQuest/store.ts
import { createJsonPersistentAtom } from "@/lib/toolStorage/persistentAtom";
import type { ToolStorageEntry } from "@/lib/toolStorage/types";
import {
	applyBadges,
	completeMission,
	emptyState,
	localDateKey,
	newId,
	reconcileStreak,
	type Cadence,
	type Difficulty,
	type GoalQuestState,
	type Mission,
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
				return [{ id: x.id, missionId: x.missionId, completedAt: x.completedAt, xpAwarded, cycleKey: x.cycleKey }];
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
			typeof o.streakCheckedOn === "string" && /^\d{4}-\d{2}-\d{2}$/.test(o.streakCheckedOn)
				? o.streakCheckedOn
				: null,
		unlockedBadges: Array.isArray(o.unlockedBadges)
			? o.unlockedBadges.filter((b): b is string => typeof b === "string")
			: [],
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
		missions: state.missions.map((m) =>
			m.id === id ? { ...m, active, updatedAt: new Date().toISOString() } : m,
		),
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
```

- [ ] **Step 2: Typecheck sanity**

Run: `npx tsc --noEmit -p tsconfig.json` (ou confiar no `npm run lint` na Task 8)
Se houver erro de tipo em `atoms`, espelhar o typing de `cookingBookStorage` em `src/tools/CookingBook/store.ts`.

- [ ] **Step 3: Commit** (se autorizado)

```bash
git add src/tools/GoalQuest/store.ts
git commit -m "$(cat <<'EOF'
feat(goal-quest): add persistent store and actions

EOF
)"
```

---

### Task 6: Shell, rota, post e abas vazias

**Files:**
- Create: `src/tools/GoalQuest/GoalQuest.tsx`
- Create: `src/tools/GoalQuest/GoalQuestView.tsx`
- Create: `src/tools/GoalQuest/ui/TodayTab.tsx` (stub)
- Create: `src/tools/GoalQuest/ui/MissionsTab.tsx` (stub)
- Create: `src/tools/GoalQuest/ui/ProgressTab.tsx` (stub)
- Create: `src/tools/GoalQuest/ui/HistoryTab.tsx` (stub)
- Create: `src/content/posts/tools/goal-quest.md`
- Modify: `src/pages/app/[slug].astro`

- [ ] **Step 1: Post**

```md
---
slug: "goal-quest"
type: tool
title: "Goal Quest"
description: "Missões diárias, semanais, mensais e de data única com XP, nível, streak e badges."
date: 2026-09-23
target: "GoalQuest"
---
```

- [ ] **Step 2: Entry + View**

```tsx
// GoalQuest.tsx
import { Trophy } from "lucide-react";
import { ToolShell } from "../ToolShell";
import { GoalQuestView } from "./GoalQuestView";
import { goalQuestStorage } from "./store";

export default function GoalQuest() {
	return (
		<ToolShell
			title="Goal Quest"
			description="Missões diárias, semanais, mensais e de data única com XP, nível, streak e badges."
			icon={<Trophy className="size-6" strokeWidth={2} />}
			storage={goalQuestStorage}
		>
			<GoalQuestView />
		</ToolShell>
	);
}
```

```tsx
// GoalQuestView.tsx
import { useStore } from "@nanostores/react";
import { useEffect, useState } from "react";
import { toolSegmentTabClass, toolTabBarClass } from "@/lib/toolUi";
import { goalQuest$, reconcileNow } from "./store";
import { HistoryTab } from "./ui/HistoryTab";
import { MissionsTab } from "./ui/MissionsTab";
import { ProgressTab } from "./ui/ProgressTab";
import { TodayTab } from "./ui/TodayTab";

type TabId = "today" | "missions" | "progress" | "history";

const TABS: { id: TabId; label: string }[] = [
	{ id: "today", label: "Hoje" },
	{ id: "missions", label: "Missões" },
	{ id: "progress", label: "Progresso" },
	{ id: "history", label: "Histórico" },
];

export function GoalQuestView() {
	const state = useStore(goalQuest$);
	const [tab, setTab] = useState<TabId>("today");

	useEffect(() => {
		reconcileNow();
	}, []);

	return (
		<div className="flex flex-col gap-md">
			<div className={toolTabBarClass} role="tablist" aria-label="Seções">
				{TABS.map((t) => (
					<button
						key={t.id}
						type="button"
						role="tab"
						aria-selected={tab === t.id}
						className={toolSegmentTabClass(tab === t.id)}
						onClick={() => setTab(t.id)}
					>
						{t.label}
					</button>
				))}
			</div>
			{tab === "today" && <TodayTab state={state} />}
			{tab === "missions" && <MissionsTab state={state} />}
			{tab === "progress" && <ProgressTab state={state} />}
			{tab === "history" && <HistoryTab state={state} />}
		</div>
	);
}
```

Stubs iniciais de cada tab: `return <p className="text-muted">…</p>;` com props `state: GoalQuestState`.

- [ ] **Step 3: Registrar rota**

Em `src/pages/app/[slug].astro`:

```astro
import GoalQuest from "../../tools/GoalQuest/GoalQuest";
```

```astro
case "GoalQuest":
	return <GoalQuest client:load />;
```

- [ ] **Step 4: Verificar listagem**

Run: `npm run dev` e abrir `/app/goal-quest/`
Expected: shell + abas; sem “Ferramenta não encontrada.”

- [ ] **Step 5: Commit** (se autorizado)

```bash
git add src/tools/GoalQuest src/content/posts/tools/goal-quest.md src/pages/app/[slug].astro
git commit -m "$(cat <<'EOF'
feat(goal-quest): scaffold tool shell, route and tabs

EOF
)"
```

---

### Task 7: MissionForm + MissionsTab (CRUD + filtro)

**Files:**
- Create: `src/tools/GoalQuest/ui/MissionForm.tsx`
- Modify: `src/tools/GoalQuest/ui/MissionsTab.tsx`

**Interfaces:**
- Consumes: `upsertMission`, `setMissionActive`, tipos do domínio
- UI: `toolInputClass`, `toolBtnPrimaryClass`, `toolBtnGhostClass`, `toolChipClass`, `toolListItemClass`, `toolLabelClass`

- [ ] **Step 1: MissionForm**

Campos: título (obrigatório), notas (textarea), cadência (select), dificuldade (select), obrigatória (checkbox), dueDate (input `type="date"`, só se `once`).
Botões: Salvar / Cancelar.
Props: `initial?: Mission | null`, `onSave`, `onCancel`.

- [ ] **Step 2: MissionsTab**

- Estado local: `filter: Cadence | "all"`, `editing: Mission | null`, `creating: boolean`
- Chips de filtro: Todas / Diária / Semanal / Mensal / Data única
- Lista: título, cadência, dificuldade, badge “Obrigatória” se `required`, botões Editar / Arquivar (ou Reativar se `!active`)
- Botão “Nova missão” abre formulário
- Incluir arquivadas no fim ou toggle “Mostrar arquivadas” (MVP: mostrar ativas por padrão + chip “Arquivadas”)

- [ ] **Step 3: Smoke manual**

Criar uma missão de cada cadência; editar; arquivar; recarregar página e confirmar persistência.

- [ ] **Step 4: Commit** (se autorizado)

```bash
git add src/tools/GoalQuest/ui/MissionForm.tsx src/tools/GoalQuest/ui/MissionsTab.tsx
git commit -m "$(cat <<'EOF'
feat(goal-quest): add mission CRUD and cadence filters

EOF
)"
```

---

### Task 8: TodayTab + ProgressTab + HistoryTab

**Files:**
- Modify: `src/tools/GoalQuest/ui/TodayTab.tsx`
- Modify: `src/tools/GoalQuest/ui/ProgressTab.tsx`
- Modify: `src/tools/GoalQuest/ui/HistoryTab.tsx`

- [ ] **Step 1: TodayTab**

- Resumo no topo: nível, `xpIntoLevel` / `xpForNextLevel` (barra), streak atual
- Indicador textual “Streak seguro hoje” se todas as diárias `required` ativas pendentes de hoje já foram concluídas (ou não há obrigatórias)
- Lista `missionsForToday(state, localDateKey(new Date()))`
- Cada item: título, cadência/dificuldade, chip obrigatória, botão “Concluir” → `completeMissionAction(id)`
- Empty: “Nenhuma missão para hoje. Crie em Missões.”

- [ ] **Step 2: ProgressTab**

- Mesmo resumo de XP/nível/streak + `streakBest`
- Grid de `BADGE_DEFS`: desbloqueado se `state.unlockedBadges.includes(id)`; senão muted/opaco
- Título + descrição de cada badge

- [ ] **Step 3: HistoryTab**

- Filtrar completions com `completedAt` nos últimos 60 dias (data local)
- Agrupar por `localDateKey(new Date(completedAt))`, ordem decrescente
- Cada linha: título da missão (lookup; se sumiu, “Missão removida”), XP, cadência se disponível

- [ ] **Step 4: Testes + lint + build**

```bash
npm test -- src/tools/GoalQuest/domain.test.ts
npm run lint
npm run build
```

Expected: tudo PASS / exit 0

- [ ] **Step 5: Commit** (se autorizado)

```bash
git add src/tools/GoalQuest
git commit -m "$(cat <<'EOF'
feat(goal-quest): add today, progress and history tabs

EOF
)"
```

---

### Task 9: Aceite final

- [ ] **Step 1: Checklist da spec**

- [ ] Criar e concluir daily/weekly/monthly/once
- [ ] Recorrente some do ciclo e volta no próximo (simular mudando `cycleKey` via completion de ontem ou teste de domínio já cobre)
- [ ] XP e nível sobem
- [ ] Streak: cenário de teste unitário já cobre; UI mostra valores
- [ ] Badges desbloqueiam
- [ ] Reload + Copiar link / import
- [ ] lint + build

- [ ] **Step 2: Ajuste fino de copy/espaçamento** se algo quebrar o visual do hub (sem inventar tema novo)

- [ ] **Step 3: Commit final** (se autorizado) só se houver diffs pendentes

---

## Spec coverage (self-review)

| Spec | Task |
|------|------|
| Cadências + once dueDate | 1, 2, 7 |
| Renasce no próximo ciclo | 2 |
| XP base × dificuldade | 1 |
| Nível curva | 1 |
| Streak só diárias obrigatórias | 3 |
| Badges lista fixa | 4 |
| Abas Hoje/Missões/Progresso/Histórico | 6–8 |
| Persistência + ToolShell link | 5–6 |
| Post + rota | 6 |
| Testes domain | 1–4 |
| Layout lg-only row | 6–8 (toolUi + flex-col) |

## Placeholder scan

Sem TBD/TODO abertos nas tasks. Teste de badge na Task 4 inclui correção explícita para não esperar `level_5` com 100 XP.
