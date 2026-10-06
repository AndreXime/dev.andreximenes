import { describe, expect, it } from "vitest";
import {
	addDays,
	buildMonthGrid,
	type CalendarEvent,
	compareDateKeys,
	daysBetweenInclusive,
	isDateKey,
	listUpcomingEvents,
	occurrencesByDay,
	shiftMonth,
	validateEventInput,
} from "./domain";

describe("date helpers", () => {
	it("valida e soma dias em UTC", () => {
		expect(isDateKey("2026-10-06")).toBe(true);
		expect(isDateKey("2026-10-6")).toBe(false);
		expect(addDays("2026-10-31", 1)).toBe("2026-11-01");
		expect(daysBetweenInclusive("2026-10-01", "2026-10-03")).toBe(3);
		expect(compareDateKeys("2026-10-01", "2026-10-02")).toBeLessThan(0);
	});

	it("grade de outubro/2026 começa na segunda e cobre o mês", () => {
		const cells = buildMonthGrid(2026, 10);
		expect(cells[0]?.dateKey).toBe("2026-09-28");
		expect(cells[0]?.inMonth).toBe(false);
		expect(cells.some((c) => c.dateKey === "2026-10-01" && c.inMonth)).toBe(true);
		expect(cells.some((c) => c.dateKey === "2026-10-31" && c.inMonth)).toBe(true);
		expect(cells.length % 7).toBe(0);
		expect(shiftMonth(2026, 10, 1)).toEqual({ year: 2026, month: 11 });
		expect(shiftMonth(2026, 12, 1)).toEqual({ year: 2027, month: 1 });
	});
});

function event(
	partial: Partial<CalendarEvent> & Pick<CalendarEvent, "id" | "title" | "startDate" | "endDate">,
): CalendarEvent {
	return {
		notes: "",
		recurrence: "none",
		recurrenceEndDate: null,
		color: "accent",
		createdAt: "2026-01-01T00:00:00.000Z",
		updatedAt: "2026-01-01T00:00:00.000Z",
		...partial,
	};
}

describe("occurrencesByDay", () => {
	it("evento único multi-dia cobre cada dia", () => {
		const map = occurrencesByDay(
			[event({ id: "e1", title: "Viagem", startDate: "2026-10-10", endDate: "2026-10-12" })],
			"2026-10-01",
			"2026-10-31",
		);
		expect(map.get("2026-10-10")?.map((o) => o.eventId)).toEqual(["e1"]);
		expect(map.get("2026-10-11")?.map((o) => o.eventId)).toEqual(["e1"]);
		expect(map.get("2026-10-12")?.map((o) => o.eventId)).toEqual(["e1"]);
		expect(map.get("2026-10-13")).toBeUndefined();
	});

	it("recorrência semanal com fim", () => {
		const map = occurrencesByDay(
			[
				event({
					id: "e2",
					title: "Treino",
					startDate: "2026-10-05",
					endDate: "2026-10-05",
					recurrence: "weekly",
					recurrenceEndDate: "2026-10-19",
				}),
			],
			"2026-10-01",
			"2026-10-31",
		);
		expect(map.get("2026-10-05")?.[0]?.title).toBe("Treino");
		expect(map.get("2026-10-12")?.[0]?.title).toBe("Treino");
		expect(map.get("2026-10-19")?.[0]?.title).toBe("Treino");
		expect(map.get("2026-10-26")).toBeUndefined();
	});

	it("recorrência mensal ajusta dia inexistente", () => {
		const map = occurrencesByDay(
			[
				event({
					id: "e3",
					title: "Conta",
					startDate: "2026-01-31",
					endDate: "2026-01-31",
					recurrence: "monthly",
					recurrenceEndDate: "2026-03-31",
				}),
			],
			"2026-02-01",
			"2026-02-28",
		);
		expect(map.get("2026-02-28")?.[0]?.eventId).toBe("e3");
	});

	it("recorrência anual e diária respeitam range", () => {
		const yearly = occurrencesByDay(
			[
				event({
					id: "e4",
					title: "Aniversário",
					startDate: "2024-10-06",
					endDate: "2024-10-06",
					recurrence: "yearly",
				}),
			],
			"2026-10-01",
			"2026-10-31",
		);
		expect(yearly.get("2026-10-06")?.[0]?.title).toBe("Aniversário");

		const daily = occurrencesByDay(
			[
				event({
					id: "e5",
					title: "Check",
					startDate: "2026-10-01",
					endDate: "2026-10-01",
					recurrence: "daily",
					recurrenceEndDate: "2026-10-03",
				}),
			],
			"2026-10-01",
			"2026-10-05",
		);
		expect(daily.get("2026-10-01")).toBeDefined();
		expect(daily.get("2026-10-03")).toBeDefined();
		expect(daily.get("2026-10-04")).toBeUndefined();
	});
});

describe("listUpcomingEvents", () => {
	it("lista próximos e só a ocorrência mais próxima de recorrentes", () => {
		const items = listUpcomingEvents(
			[
				event({ id: "past", title: "Passado", startDate: "2026-09-01", endDate: "2026-09-01" }),
				event({ id: "soon", title: "Consulta", startDate: "2026-10-10", endDate: "2026-10-10" }),
				event({
					id: "weekly",
					title: "Treino",
					startDate: "2026-09-28",
					endDate: "2026-09-28",
					recurrence: "weekly",
				}),
			],
			"2026-10-06",
		);
		expect(items.map((i) => i.eventId)).toEqual(["soon", "weekly"]);
		expect(items[0]?.daysUntil).toBe(4);
		expect(items[1]?.occurrenceStart).toBe("2026-10-12");
		expect(items[1]?.daysUntil).toBe(6);
	});

	it("evento em andamento conta zero dias", () => {
		const items = listUpcomingEvents(
			[event({ id: "trip", title: "Viagem", startDate: "2026-10-05", endDate: "2026-10-08" })],
			"2026-10-06",
		);
		expect(items).toHaveLength(1);
		expect(items[0]?.daysUntil).toBe(0);
	});
});

describe("validateEventInput", () => {
	it("exige título e datas coerentes", () => {
		expect(
			validateEventInput({
				title: "  ",
				startDate: "2026-10-01",
				endDate: "2026-10-01",
				recurrence: "none",
				recurrenceEndDate: null,
				color: "accent",
			}).ok,
		).toBe(false);
		expect(
			validateEventInput({
				title: "Ok",
				startDate: "2026-10-02",
				endDate: "2026-10-01",
				recurrence: "none",
				recurrenceEndDate: null,
				color: "accent",
			}).ok,
		).toBe(false);
		expect(
			validateEventInput({
				title: "Ok",
				startDate: "2026-10-01",
				endDate: "2026-10-02",
				recurrence: "weekly",
				recurrenceEndDate: "2026-09-01",
				color: "accent",
			}).ok,
		).toBe(false);
		expect(
			validateEventInput({
				title: "Ok",
				startDate: "2026-10-01",
				endDate: "2026-10-02",
				recurrence: "none",
				recurrenceEndDate: null,
				color: "accent",
			}).ok,
		).toBe(true);
	});
});
