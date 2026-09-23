import { describe, expect, it } from "vitest";
import {
	applyBadges,
	completeMission,
	cycleKeyFor,
	emptyState,
	type GoalQuestState,
	isMissionPending,
	isoWeekKey,
	levelFromXp,
	type Mission,
	missionsForToday,
	orderBadgesForDisplay,
	reconcileStreak,
	xpForMission,
	xpProgressInLevel,
	xpToReachLevel,
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
		expect(p.xpForNextLevel).toBe(200);
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
	it("inclui diárias, semanais, mensais pendentes e once atrasadas", () => {
		const daily = mission({ id: "d", cadence: "daily" });
		const onceOverdue = mission({ id: "o", cadence: "once", dueDate: "2026-09-20" });
		const weekly = mission({ id: "w", cadence: "weekly" });
		const monthly = mission({ id: "m", cadence: "monthly" });
		const onceFuture = mission({ id: "f", cadence: "once", dueDate: "2026-12-01" });
		const state: GoalQuestState = {
			...emptyState(),
			missions: [daily, onceOverdue, weekly, monthly, onceFuture],
		};
		const list = missionsForToday(state, "2026-09-23");
		expect(list.map((x) => x.id).sort()).toEqual(["d", "m", "o", "w"]);
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

	it("na primeira visita só marca o dia, sem cobrar passado", () => {
		const m = mission({ id: "1", cadence: "daily", required: true });
		const state: GoalQuestState = {
			...emptyState(),
			missions: [m],
			xp: 50,
			streakCurrent: 0,
			streakCheckedOn: null,
		};
		const next = reconcileStreak(state, "2026-09-23");
		expect(next.xp).toBe(50);
		expect(next.streakCurrent).toBe(0);
		expect(next.streakCheckedOn).toBe("2026-09-23");
		expect(next.lastXpLoss).toBe(0);
	});

	it("incrementa quando o dia pendente foi cumprido", () => {
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

	it("falha com streak: zera streak e não tira XP (escudo)", () => {
		const m = mission({
			id: "1",
			cadence: "daily",
			required: true,
			createdAt: "2026-09-01T00:00:00.000Z",
		});
		const state: GoalQuestState = {
			...emptyState(),
			missions: [m],
			xp: 80,
			streakCurrent: 5,
			streakBest: 5,
			streakCheckedOn: "2026-09-22",
		};
		const next = reconcileStreak(state, "2026-09-23");
		expect(next.streakCurrent).toBe(0);
		expect(next.streakBest).toBe(5);
		expect(next.xp).toBe(80);
		expect(next.lastXpLoss).toBe(0);
	});

	it("ausência longa: primeiro dia queima streak, dias seguintes tiram XP", () => {
		const m = mission({
			id: "1",
			cadence: "daily",
			required: true,
			difficulty: "easy",
			createdAt: "2026-09-01T00:00:00.000Z",
		});
		const state: GoalQuestState = {
			...emptyState(),
			missions: [m],
			xp: 100,
			streakCurrent: 3,
			streakBest: 3,
			streakCheckedOn: "2026-09-20",
		};
		const next = reconcileStreak(state, "2026-09-23");
		expect(next.streakCurrent).toBe(0);
		expect(next.xp).toBe(80);
		expect(next.lastXpLoss).toBe(20);
		expect(next.lastXpLossOn).toBe("2026-09-23");
	});

	it("pausa (não sobe nem zera) sem diárias obrigatórias ativas", () => {
		const state: GoalQuestState = {
			...emptyState(),
			xp: 40,
			streakCurrent: 3,
			streakBest: 3,
			streakCheckedOn: "2026-09-22",
		};
		const next = reconcileStreak(state, "2026-09-23");
		expect(next.streakCurrent).toBe(3);
		expect(next.xp).toBe(40);
		expect(next.streakCheckedOn).toBe("2026-09-23");
	});
});

describe("evaluateBadges", () => {
	it("desbloqueia first_daily, completions_10 e streak_3", () => {
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
		const richBase = applyBadges(state);
		expect(richBase.unlockedBadges).toContain("first_daily");
		expect(richBase.unlockedBadges).toContain("completions_1");
		expect(richBase.unlockedBadges).toContain("completions_10");
		expect(richBase.unlockedBadges).toContain("streak_3");
		expect(levelFromXp(state.xp)).toBe(2);
		expect(richBase.unlockedBadges).toContain("level_2");
		expect(richBase.unlockedBadges).not.toContain("level_5");

		const rich = applyBadges({ ...state, xp: 1000, streakBest: 30 });
		expect(rich.unlockedBadges).toContain("level_5");
		expect(rich.unlockedBadges).toContain("streak_30");
		expect(rich.unlockedBadges).toContain("xp_1000");
	});

	it("desbloqueia all_cadences e first_hard", () => {
		const missions = [
			mission({ id: "d", cadence: "daily" }),
			mission({ id: "w", cadence: "weekly" }),
			mission({ id: "m", cadence: "monthly" }),
			mission({ id: "o", cadence: "once", dueDate: "2026-09-01", difficulty: "hard" }),
		];
		const state: GoalQuestState = {
			...emptyState(),
			missions,
			completions: [
				{ id: "1", missionId: "d", completedAt: "2026-09-01T12:00:00.000Z", xpAwarded: 10, cycleKey: "2026-09-01" },
				{ id: "2", missionId: "w", completedAt: "2026-09-01T12:00:00.000Z", xpAwarded: 40, cycleKey: "2026-W36" },
				{ id: "3", missionId: "m", completedAt: "2026-09-01T12:00:00.000Z", xpAwarded: 120, cycleKey: "2026-09" },
				{ id: "4", missionId: "o", completedAt: "2026-09-01T12:00:00.000Z", xpAwarded: 160, cycleKey: "2026-09-01" },
			],
			xp: 330,
		};
		const next = applyBadges(state);
		expect(next.unlockedBadges).toContain("all_cadences");
		expect(next.unlockedBadges).toContain("first_hard");
		expect(next.unlockedBadges).toContain("xp_250");
	});
});

describe("orderBadgesForDisplay", () => {
	it("coloca a mais perto primeiro, depois concluídas, depois o resto", () => {
		const m = mission({ id: "1", cadence: "daily" });
		const state: GoalQuestState = {
			...emptyState(),
			missions: [m],
			completions: [
				{
					id: "c1",
					missionId: "1",
					completedAt: "2026-09-01T12:00:00.000Z",
					xpAwarded: 10,
					cycleKey: "2026-09-01",
				},
			],
			xp: 100,
			streakBest: 5,
			unlockedBadges: ["first_daily", "streak_3", "completions_1", "level_2"],
		};
		const ordered = orderBadgesForDisplay(state);
		expect(ordered[0]?.id).toBe("streak_7");
		const unlockedIds = ordered.filter((b) => state.unlockedBadges.includes(b.id)).map((b) => b.id);
		expect(
			ordered
				.slice(1, 1 + unlockedIds.length)
				.map((b) => b.id)
				.sort(),
		).toEqual([...unlockedIds].sort());
		expect(ordered.slice(1 + unlockedIds.length).every((b) => !state.unlockedBadges.includes(b.id))).toBe(true);
	});
});
