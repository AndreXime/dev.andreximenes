export type Recurrence = "none" | "daily" | "weekly" | "monthly" | "yearly";

export const EVENT_COLORS = ["accent", "sky", "rose", "amber", "emerald", "violet"] as const;
export type EventColor = (typeof EVENT_COLORS)[number];

export interface CalendarEvent {
	readonly id: string;
	readonly title: string;
	readonly notes: string;
	readonly startDate: string;
	readonly endDate: string;
	readonly recurrence: Recurrence;
	readonly recurrenceEndDate: string | null;
	readonly color: EventColor;
	readonly createdAt: string;
	readonly updatedAt: string;
}

export interface CalendarState {
	readonly events: readonly CalendarEvent[];
}

export interface DayOccurrence {
	readonly eventId: string;
	readonly title: string;
	readonly color: EventColor;
	readonly occurrenceStart: string;
	readonly occurrenceEnd: string;
}

export interface MonthCell {
	readonly dateKey: string;
	readonly inMonth: boolean;
}

export function emptyState(): CalendarState {
	return { events: [] };
}

export function newId(): string {
	return globalThis.crypto?.randomUUID?.() ?? `cal-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export function isDateKey(value: string): boolean {
	if (!DATE_RE.test(value)) return false;
	const [ys, ms, ds] = value.split("-");
	const y = Number(ys);
	const m = Number(ms);
	const d = Number(ds);
	const dt = new Date(Date.UTC(y, m - 1, d));
	return dt.getUTCFullYear() === y && dt.getUTCMonth() === m - 1 && dt.getUTCDate() === d;
}

function parseParts(dateKey: string): { y: number; m: number; d: number } {
	const parts = dateKey.split("-").map(Number);
	return { y: parts[0] ?? 0, m: parts[1] ?? 1, d: parts[2] ?? 1 };
}

export function addDays(dateKey: string, days: number): string {
	const { y, m, d } = parseParts(dateKey);
	const dt = new Date(Date.UTC(y, m - 1, d));
	dt.setUTCDate(dt.getUTCDate() + days);
	const yy = dt.getUTCFullYear();
	const mm = String(dt.getUTCMonth() + 1).padStart(2, "0");
	const dd = String(dt.getUTCDate()).padStart(2, "0");
	return `${yy}-${mm}-${dd}`;
}

export function compareDateKeys(a: string, b: string): number {
	if (a === b) return 0;
	return a < b ? -1 : 1;
}

export function daysBetweenInclusive(start: string, end: string): number {
	const a = parseParts(start);
	const b = parseParts(end);
	const ms = Date.UTC(b.y, b.m - 1, b.d) - Date.UTC(a.y, a.m - 1, a.d);
	return Math.floor(ms / 86_400_000) + 1;
}

export function localDateKey(now: Date = new Date()): string {
	const y = now.getFullYear();
	const m = String(now.getMonth() + 1).padStart(2, "0");
	const d = String(now.getDate()).padStart(2, "0");
	return `${y}-${m}-${d}`;
}

const MONTH_NAMES = [
	"Janeiro",
	"Fevereiro",
	"Março",
	"Abril",
	"Maio",
	"Junho",
	"Julho",
	"Agosto",
	"Setembro",
	"Outubro",
	"Novembro",
	"Dezembro",
] as const;

export function monthLabel(year: number, month: number): string {
	return `${MONTH_NAMES[month - 1] ?? ""} ${year}`;
}

export function shiftMonth(year: number, month: number, delta: number): { year: number; month: number } {
	const idx = year * 12 + (month - 1) + delta;
	return { year: Math.floor(idx / 12), month: (idx % 12) + 1 };
}

/** Grade com semanas começando na segunda (ISO). */
export function buildMonthGrid(year: number, month: number): readonly MonthCell[] {
	const first = `${year}-${String(month).padStart(2, "0")}-01`;
	const { y, m, d } = parseParts(first);
	const firstDt = new Date(Date.UTC(y, m - 1, d));
	const weekday = firstDt.getUTCDay();
	const mondayOffset = weekday === 0 ? -6 : 1 - weekday;
	const gridStart = addDays(first, mondayOffset);
	const next = shiftMonth(year, month, 1);
	const firstNext = `${next.year}-${String(next.month).padStart(2, "0")}-01`;
	const cells: MonthCell[] = [];
	let cursor = gridStart;
	while (cells.length < 42) {
		const inMonth = cursor.startsWith(`${year}-${String(month).padStart(2, "0")}`);
		cells.push({ dateKey: cursor, inMonth });
		cursor = addDays(cursor, 1);
		if (compareDateKeys(cursor, firstNext) >= 0 && cells.length % 7 === 0) break;
	}
	return cells;
}

export function isRecurrence(value: unknown): value is Recurrence {
	return value === "none" || value === "daily" || value === "weekly" || value === "monthly" || value === "yearly";
}

export function isEventColor(value: unknown): value is EventColor {
	return typeof value === "string" && (EVENT_COLORS as readonly string[]).includes(value);
}

export interface EventInput {
	readonly title: string;
	readonly notes?: string;
	readonly startDate: string;
	readonly endDate: string;
	readonly recurrence: Recurrence;
	readonly recurrenceEndDate: string | null;
	readonly color: EventColor;
}

export type ValidateResult = { ok: true } | { ok: false; error: string };

export function validateEventInput(input: EventInput): ValidateResult {
	if (input.title.trim() === "") return { ok: false, error: "Informe um título." };
	if (!isDateKey(input.startDate) || !isDateKey(input.endDate)) {
		return { ok: false, error: "Datas inválidas." };
	}
	if (compareDateKeys(input.endDate, input.startDate) < 0) {
		return { ok: false, error: "A data fim deve ser igual ou posterior ao início." };
	}
	if (input.recurrence !== "none" && input.recurrenceEndDate !== null) {
		if (!isDateKey(input.recurrenceEndDate)) return { ok: false, error: "Fim da recorrência inválido." };
		if (compareDateKeys(input.recurrenceEndDate, input.startDate) < 0) {
			return { ok: false, error: "O fim da recorrência deve ser igual ou posterior ao início." };
		}
	}
	if (!isEventColor(input.color)) return { ok: false, error: "Cor inválida." };
	return { ok: true };
}

function clampDayInMonth(year: number, month: number, day: number): string {
	const last = new Date(Date.UTC(year, month, 0)).getUTCDate();
	const d = Math.min(day, last);
	return `${year}-${String(month).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

function addMonthsClamped(dateKey: string, months: number): string {
	const { y, m, d } = parseParts(dateKey);
	const idx = y * 12 + (m - 1) + months;
	const ny = Math.floor(idx / 12);
	const nm = (idx % 12) + 1;
	return clampDayInMonth(ny, nm, d);
}

function addYearsClamped(dateKey: string, years: number): string {
	const { y, m, d } = parseParts(dateKey);
	return clampDayInMonth(y + years, m, d);
}

function nextOccurrenceStart(current: string, recurrence: Recurrence): string | null {
	switch (recurrence) {
		case "none":
			return null;
		case "daily":
			return addDays(current, 1);
		case "weekly":
			return addDays(current, 7);
		case "monthly":
			return addMonthsClamped(current, 1);
		case "yearly":
			return addYearsClamped(current, 1);
	}
}

export interface UpcomingEventItem {
	readonly eventId: string;
	readonly title: string;
	readonly color: EventColor;
	readonly recurrence: Recurrence;
	readonly occurrenceStart: string;
	readonly occurrenceEnd: string;
	readonly daysUntil: number;
}

/** Próxima ocorrência relevante de cada evento (recorrentes: só a mais próxima). */
export function listUpcomingEvents(events: readonly CalendarEvent[], today: string): UpcomingEventItem[] {
	const items: UpcomingEventItem[] = [];

	for (const ev of events) {
		if (!isDateKey(ev.startDate) || !isDateKey(ev.endDate) || !isDateKey(today)) continue;
		const span = daysBetweenInclusive(ev.startDate, ev.endDate);
		const seriesEnd = ev.recurrence === "none" ? null : ev.recurrenceEndDate;

		let occStart = ev.startDate;
		let guard = 0;
		while (guard < 10_000) {
			guard += 1;
			const occEnd = addDays(occStart, span - 1);

			if (compareDateKeys(occEnd, today) >= 0) {
				const daysUntil = compareDateKeys(occStart, today) >= 0 ? daysBetweenInclusive(today, occStart) - 1 : 0;
				items.push({
					eventId: ev.id,
					title: ev.title,
					color: ev.color,
					recurrence: ev.recurrence,
					occurrenceStart: occStart,
					occurrenceEnd: occEnd,
					daysUntil,
				});
				break;
			}

			if (ev.recurrence === "none") break;
			const next = nextOccurrenceStart(occStart, ev.recurrence);
			if (next === null) break;
			if (seriesEnd !== null && compareDateKeys(next, seriesEnd) > 0) break;
			occStart = next;
		}
	}

	items.sort(
		(a, b) =>
			a.daysUntil - b.daysUntil ||
			compareDateKeys(a.occurrenceStart, b.occurrenceStart) ||
			a.title.localeCompare(b.title, "pt-BR"),
	);
	return items;
}

/**
 * Gera mapa dateKey -> ocorrências que tocam aquele dia no range inclusivo.
 * Recorrência repete o bloco [startDate, endDate] a cada ciclo.
 */
export function occurrencesByDay(
	events: readonly CalendarEvent[],
	rangeStart: string,
	rangeEnd: string,
): Map<string, DayOccurrence[]> {
	const map = new Map<string, DayOccurrence[]>();

	const push = (day: string, occ: DayOccurrence): void => {
		const list = map.get(day);
		if (list) list.push(occ);
		else map.set(day, [occ]);
	};

	for (const ev of events) {
		if (!isDateKey(ev.startDate) || !isDateKey(ev.endDate)) continue;
		const span = daysBetweenInclusive(ev.startDate, ev.endDate);
		const seriesEnd = ev.recurrence === "none" ? ev.startDate : ev.recurrenceEndDate;

		let occStart = ev.startDate;
		let guard = 0;
		while (guard < 10_000) {
			guard += 1;
			const occEnd = addDays(occStart, span - 1);

			if (compareDateKeys(occEnd, rangeStart) >= 0 && compareDateKeys(occStart, rangeEnd) <= 0) {
				const occ: DayOccurrence = {
					eventId: ev.id,
					title: ev.title,
					color: ev.color,
					occurrenceStart: occStart,
					occurrenceEnd: occEnd,
				};
				let day = occStart;
				while (compareDateKeys(day, occEnd) <= 0) {
					if (compareDateKeys(day, rangeStart) >= 0 && compareDateKeys(day, rangeEnd) <= 0) {
						push(day, occ);
					}
					day = addDays(day, 1);
				}
			}

			if (ev.recurrence === "none") break;
			if (seriesEnd !== null && compareDateKeys(occStart, seriesEnd) >= 0) break;

			const next = nextOccurrenceStart(occStart, ev.recurrence);
			if (next === null) break;
			if (seriesEnd !== null && compareDateKeys(next, seriesEnd) > 0) break;
			if (compareDateKeys(next, rangeEnd) > 0) break;
			occStart = next;
		}
	}

	for (const [, list] of map) {
		list.sort(
			(a, b) => compareDateKeys(a.occurrenceStart, b.occurrenceStart) || a.title.localeCompare(b.title, "pt-BR"),
		);
	}
	return map;
}
