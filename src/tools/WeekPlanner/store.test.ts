import { beforeEach, describe, expect, it } from "vitest";
import { addWeekBlockToAllDays, addWeekBlockToDay, WEEK_DAY_ORDER, weekPlan$ } from "./store";

describe("WeekPlanner store", () => {
	beforeEach(() => {
		weekPlan$.set({
			mon: [],
			tue: [],
			wed: [],
			thu: [],
			fri: [],
			sat: [],
			sun: [],
		});
	});

	it("addWeekBlockToDay cria um bloco só no dia pedido", () => {
		addWeekBlockToDay("wed");
		const plan = weekPlan$.get();

		expect(plan.wed).toHaveLength(1);
		expect(plan.wed[0]?.groupId).toBeNull();
		expect(plan.wed[0]?.saved).toBe(false);

		for (const day of WEEK_DAY_ORDER) {
			if (day === "wed") continue;
			expect(plan[day]).toHaveLength(0);
		}
	});

	it("addWeekBlockToAllDays espelha o mesmo groupId em todos os dias", () => {
		addWeekBlockToAllDays();
		const plan = weekPlan$.get();
		const groupId = plan.mon[0]?.groupId;

		expect(groupId).toBeTruthy();
		for (const day of WEEK_DAY_ORDER) {
			expect(plan[day]).toHaveLength(1);
			expect(plan[day][0]?.groupId).toBe(groupId);
		}
	});
});
