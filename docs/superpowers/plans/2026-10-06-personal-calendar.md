# Calendário Pessoal Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Entregar a tool web Calendário pessoal em `/app/calendario-pessoal/` com grade mensal, eventos de dia inteiro (únicos e recorrentes), painel do dia e persistência local.

**Architecture:** Domínio puro em `domain.ts` gera ocorrências sob demanda a partir das definições de evento. Estado em `store.ts` via `createJsonPersistentAtom`. UI em `ToolShell` com grade + painel do dia (coluna até `md`, lado a lado a partir de `lg`), tokens de `toolUi.ts`.

**Tech Stack:** Astro 7, React 19, TypeScript, nanostores, `@nanostores/react`, Vitest, Lucide, Tailwind v4 (tokens do hub).

## Global Constraints

- Nomes: componente `PersonalCalendar`, slug `calendario-pessoal`, toolId `personal_calendar`, storage `personal_calendar:state_v1`
- Copy/UI em português brasileiro
- Layout: coluna até `md`; `flex-row` / multi-coluna só a partir de `lg`
- Sem `any`; sem `@ts-ignore`; null/undefined explícitos
- Sem em dash / en dash em textos
- Eventos só dia inteiro (sem horário)
- Editar/apagar sempre a série inteira
- Commits: Conventional Commits em português somente quando o usuário autorizar

## File structure

| File | Responsibility |
|------|----------------|
| `src/tools/PersonalCalendar/domain.ts` | Tipos, datas UTC-safe, grade do mês, expansão de recorrência, validação |
| `src/tools/PersonalCalendar/domain.test.ts` | Testes unitários do domínio |
| `src/tools/PersonalCalendar/store.ts` | Atom persistente, normalize, upsert/remove |
| `src/tools/PersonalCalendar/PersonalCalendar.tsx` | Entry + ToolShell |
| `src/tools/PersonalCalendar/PersonalCalendarView.tsx` | Orquestra mês selecionado, dia, modo form |
| `src/tools/PersonalCalendar/ui/MonthGrid.tsx` | Navegação + grade |
| `src/tools/PersonalCalendar/ui/DayPanel.tsx` | Lista do dia + form criar/editar |
| `src/content/posts/tools/calendario-pessoal.md` | Listagem da tool |
| `src/pages/app/[slug].astro` | Import + case |

---

### Task 1: Domínio — datas, tipos e grade do mês

**Files:**
- Create: `src/tools/PersonalCalendar/domain.ts`
- Create: `src/tools/PersonalCalendar/domain.test.ts`

**Interfaces:**
- Produces: `Recurrence`, `EventColor`, `CalendarEvent`, `CalendarState`, `DayOccurrence`, `MonthCell`, `EVENT_COLORS`, `emptyState`, `newId`, `isDateKey`, `addDays`, `daysBetweenInclusive`, `compareDateKeys`, `localDateKey`, `monthLabel`, `shiftMonth`, `buildMonthGrid`

- [ ] **Step 1: Write the failing test**

```ts
// src/tools/PersonalCalendar/domain.test.ts
import { describe, expect, it } from "vitest";
import {
	addDays,
	buildMonthGrid,
	compareDateKeys,
	daysBetweenInclusive,
	isDateKey,
	shiftMonth,
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/tools/PersonalCalendar/domain.test.ts`
Expected: FAIL (módulo ou exports ausentes)

- [ ] **Step 3: Write minimal implementation**

```ts
// src/tools/PersonalCalendar/domain.ts
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
	const weekday = firstDt.getUTCDay(); // 0=dom ... 6=sab
	const mondayOffset = weekday === 0 ? -6 : 1 - weekday;
	const gridStart = addDays(first, mondayOffset);
	const next = shiftMonth(year, month, 1);
	const firstNext = `${next.year}-${String(next.month).padStart(2, "0")}-01`;
	const cells: MonthCell[] = [];
	let cursor = gridStart;
	while (compareDateKeys(cursor, firstNext) < 0 || cells.length % 7 !== 0 || cells.length === 0) {
		const inMonth = cursor.startsWith(`${year}-${String(month).padStart(2, "0")}`);
		cells.push({ dateKey: cursor, inMonth });
		cursor = addDays(cursor, 1);
		if (compareDateKeys(cursor, firstNext) >= 0 && cells.length % 7 === 0) break;
		if (cells.length > 42) break;
	}
	return cells;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- src/tools/PersonalCalendar/domain.test.ts`
Expected: PASS

- [ ] **Step 5: Commit** (somente se o usuário pedir commit)

```bash
git add src/tools/PersonalCalendar/domain.ts src/tools/PersonalCalendar/domain.test.ts
git commit -m "$(cat <<'EOF'
feat(personal-calendar): adicionar helpers de data e grade mensal

EOF
)"
```

---

### Task 2: Domínio — expansão de ocorrências e validação

**Files:**
- Modify: `src/tools/PersonalCalendar/domain.ts`
- Modify: `src/tools/PersonalCalendar/domain.test.ts`

**Interfaces:**
- Consumes: tipos e helpers da Task 1
- Produces: `occurrencesByDay`, `validateEventInput`, `isEventColor`, `isRecurrence`

- [ ] **Step 1: Write the failing tests**

```ts
// append to domain.test.ts
import {
	type CalendarEvent,
	occurrencesByDay,
	validateEventInput,
} from "./domain";

function event(partial: Partial<CalendarEvent> & Pick<CalendarEvent, "id" | "title" | "startDate" | "endDate">): CalendarEvent {
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

describe("validateEventInput", () => {
	it("exige título e datas coerentes", () => {
		expect(validateEventInput({ title: "  ", startDate: "2026-10-01", endDate: "2026-10-01", recurrence: "none", recurrenceEndDate: null, color: "accent" }).ok).toBe(false);
		expect(validateEventInput({ title: "Ok", startDate: "2026-10-02", endDate: "2026-10-01", recurrence: "none", recurrenceEndDate: null, color: "accent" }).ok).toBe(false);
		expect(validateEventInput({ title: "Ok", startDate: "2026-10-01", endDate: "2026-10-02", recurrence: "weekly", recurrenceEndDate: "2026-09-01", color: "accent" }).ok).toBe(false);
		expect(validateEventInput({ title: "Ok", startDate: "2026-10-01", endDate: "2026-10-02", recurrence: "none", recurrenceEndDate: null, color: "accent" }).ok).toBe(true);
	});
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/tools/PersonalCalendar/domain.test.ts`
Expected: FAIL (`occurrencesByDay` / `validateEventInput` ausentes)

- [ ] **Step 3: Implement occurrence engine + validation**

```ts
// append to domain.ts

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
	if (input.recurrence !== "none") {
		if (input.recurrenceEndDate !== null) {
			if (!isDateKey(input.recurrenceEndDate)) return { ok: false, error: "Fim da recorrência inválido." };
			if (compareDateKeys(input.recurrenceEndDate, input.startDate) < 0) {
				return { ok: false, error: "O fim da recorrência deve ser igual ou posterior ao início." };
			}
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
		const seriesEnd = ev.recurrence === "none" ? ev.startDate : (ev.recurrenceEndDate ?? null);

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
			// Se a próxima ocorrência começa depois do range e o fim da série permite, ainda pode haver
			// ocorrências, mas se next > rangeEnd e occEnd < rangeStart já saímos pelo overlap.
			if (compareDateKeys(next, rangeEnd) > 0) break;
			occStart = next;
		}
	}

	for (const [, list] of map) {
		list.sort((a, b) => compareDateKeys(a.occurrenceStart, b.occurrenceStart) || a.title.localeCompare(b.title, "pt-BR"));
	}
	return map;
}
```

Nota de implementação: no loop semanal/mensal, se `occStart` ainda está antes de `rangeStart`, continue avançando sem expandir dias (já coberto pelo check de overlap). O `break` quando `next > rangeEnd` é seguro porque a série só avança para frente.

- [ ] **Step 4: Run tests**

Run: `npm test -- src/tools/PersonalCalendar/domain.test.ts`
Expected: PASS

- [ ] **Step 5: Commit** (somente se o usuário pedir)

```bash
git add src/tools/PersonalCalendar/domain.ts src/tools/PersonalCalendar/domain.test.ts
git commit -m "$(cat <<'EOF'
feat(personal-calendar): expandir recorrências sob demanda

EOF
)"
```

---

### Task 3: Store persistente

**Files:**
- Create: `src/tools/PersonalCalendar/store.ts`

**Interfaces:**
- Consumes: `CalendarState`, `CalendarEvent`, `EventInput`, `validateEventInput`, `emptyState`, `newId`, `isDateKey`, `isRecurrence`, `isEventColor`
- Produces: `calendar$`, `personalCalendarStorage`, `upsertEvent`, `removeEvent`

- [ ] **Step 1: Implement store**

```ts
// src/tools/PersonalCalendar/store.ts
import { createJsonPersistentAtom } from "@/lib/toolStorage/persistentAtom";
import type { ToolStorageEntry } from "@/lib/toolStorage/types";
import {
	type CalendarEvent,
	type CalendarState,
	type EventColor,
	type EventInput,
	emptyState,
	isDateKey,
	isEventColor,
	isRecurrence,
	newId,
	type Recurrence,
	validateEventInput,
} from "./domain";

const STORAGE_KEY = "personal_calendar:state_v1";

function normalizeEvent(raw: unknown): CalendarEvent | null {
	if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
	const o = raw as Record<string, unknown>;
	if (typeof o.id !== "string" || o.id === "") return null;
	if (typeof o.title !== "string" || o.title.trim() === "") return null;
	if (typeof o.startDate !== "string" || !isDateKey(o.startDate)) return null;
	if (typeof o.endDate !== "string" || !isDateKey(o.endDate)) return null;
	const recurrence: Recurrence = isRecurrence(o.recurrence) ? o.recurrence : "none";
	const recurrenceEndDate =
		typeof o.recurrenceEndDate === "string" && isDateKey(o.recurrenceEndDate) ? o.recurrenceEndDate : null;
	const color: EventColor = isEventColor(o.color) ? o.color : "accent";
	const createdAt = typeof o.createdAt === "string" ? o.createdAt : new Date().toISOString();
	const updatedAt = typeof o.updatedAt === "string" ? o.updatedAt : createdAt;
	return {
		id: o.id,
		title: o.title.trim(),
		notes: typeof o.notes === "string" ? o.notes : "",
		startDate: o.startDate,
		endDate: o.endDate,
		recurrence,
		recurrenceEndDate: recurrence === "none" ? null : recurrenceEndDate,
		color,
		createdAt,
		updatedAt,
	};
}

function normalizeState(raw: unknown): CalendarState {
	if (!raw || typeof raw !== "object" || Array.isArray(raw)) return emptyState();
	const o = raw as Record<string, unknown>;
	const events = Array.isArray(o.events)
		? o.events.map(normalizeEvent).filter((e): e is CalendarEvent => e !== null)
		: [];
	return { events };
}

export const calendar$ = createJsonPersistentAtom<CalendarState>({
	storageKey: STORAGE_KEY,
	defaultValue: emptyState(),
	normalize: normalizeState,
});

export const personalCalendarStorage: ToolStorageEntry = {
	toolId: "personal_calendar",
	keys: [STORAGE_KEY],
	atoms: { [STORAGE_KEY]: calendar$ },
};

export function upsertEvent(input: EventInput, id?: string): { ok: true; id: string } | { ok: false; error: string } {
	const checked = validateEventInput(input);
	if (!checked.ok) return checked;

	const now = new Date().toISOString();
	const state = calendar$.get();
	const existing = id ? state.events.find((e) => e.id === id) : undefined;
	const eventId = existing?.id ?? newId();
	const next: CalendarEvent = {
		id: eventId,
		title: input.title.trim(),
		notes: (input.notes ?? "").trim(),
		startDate: input.startDate,
		endDate: input.endDate,
		recurrence: input.recurrence,
		recurrenceEndDate: input.recurrence === "none" ? null : input.recurrenceEndDate,
		color: input.color,
		createdAt: existing?.createdAt ?? now,
		updatedAt: now,
	};

	const events = existing
		? state.events.map((e) => (e.id === eventId ? next : e))
		: [...state.events, next];
	calendar$.set({ events });
	return { ok: true, id: eventId };
}

export function removeEvent(id: string): void {
	const state = calendar$.get();
	calendar$.set({ events: state.events.filter((e) => e.id !== id) });
}
```

- [ ] **Step 2: Smoke check TypeScript via testes existentes do domínio**

Run: `npm test -- src/tools/PersonalCalendar/domain.test.ts`
Expected: PASS

- [ ] **Step 3: Commit** (somente se o usuário pedir)

```bash
git add src/tools/PersonalCalendar/store.ts
git commit -m "$(cat <<'EOF'
feat(personal-calendar): persistir eventos no localStorage

EOF
)"
```

---

### Task 4: UI — grade do mês e painel do dia

**Files:**
- Create: `src/tools/PersonalCalendar/PersonalCalendar.tsx`
- Create: `src/tools/PersonalCalendar/PersonalCalendarView.tsx`
- Create: `src/tools/PersonalCalendar/ui/MonthGrid.tsx`
- Create: `src/tools/PersonalCalendar/ui/DayPanel.tsx`

**Interfaces:**
- Consumes: `calendar$`, `upsertEvent`, `removeEvent`, `personalCalendarStorage`, `buildMonthGrid`, `occurrencesByDay`, `monthLabel`, `shiftMonth`, `localDateKey`, `EVENT_COLORS`, tipos do domínio
- Produces: entry React montável no Astro

- [ ] **Step 1: Entry + ToolShell**

```tsx
// src/tools/PersonalCalendar/PersonalCalendar.tsx
import { CalendarDays } from "lucide-react";
import { ToolShell } from "../ToolShell";
import { PersonalCalendarView } from "./PersonalCalendarView";
import { personalCalendarStorage } from "./store";

export default function PersonalCalendar() {
	return (
		<ToolShell
			title="Calendário pessoal"
			description="Grade mensal com eventos de dia inteiro, únicos ou recorrentes. Dados só no seu dispositivo."
			icon={<CalendarDays className="size-6" strokeWidth={2} />}
			storage={personalCalendarStorage}
		>
			<PersonalCalendarView />
		</ToolShell>
	);
}
```

- [ ] **Step 2: View orquestradora**

```tsx
// src/tools/PersonalCalendar/PersonalCalendarView.tsx
import { useStore } from "@nanostores/react";
import { useMemo, useState } from "react";
import {
	buildMonthGrid,
	type CalendarEvent,
	type DayOccurrence,
	localDateKey,
	monthLabel,
	occurrencesByDay,
	shiftMonth,
} from "./domain";
import { calendar$ } from "./store";
import { DayPanel } from "./ui/DayPanel";
import { MonthGrid } from "./ui/MonthGrid";

export type PanelMode = { kind: "list" } | { kind: "create" } | { kind: "edit"; eventId: string };

export function PersonalCalendarView() {
	const state = useStore(calendar$);
	const today = localDateKey();
	const [year, setYear] = useState(() => Number(today.slice(0, 4)));
	const [month, setMonth] = useState(() => Number(today.slice(5, 7)));
	const [selectedDay, setSelectedDay] = useState(today);
	const [mode, setMode] = useState<PanelMode>({ kind: "list" });

	const cells = useMemo(() => buildMonthGrid(year, month), [year, month]);
	const rangeStart = cells[0]?.dateKey ?? today;
	const rangeEnd = cells[cells.length - 1]?.dateKey ?? today;

	const byDay = useMemo(
		() => occurrencesByDay(state.events, rangeStart, rangeEnd),
		[state.events, rangeStart, rangeEnd],
	);

	const dayOccs: readonly DayOccurrence[] = byDay.get(selectedDay) ?? [];
	const editing: CalendarEvent | null =
		mode.kind === "edit" ? (state.events.find((e) => e.id === mode.eventId) ?? null) : null;

	const goMonth = (delta: number): void => {
		const next = shiftMonth(year, month, delta);
		setYear(next.year);
		setMonth(next.month);
		setMode({ kind: "list" });
	};

	const goToday = (): void => {
		const t = localDateKey();
		setYear(Number(t.slice(0, 4)));
		setMonth(Number(t.slice(5, 7)));
		setSelectedDay(t);
		setMode({ kind: "list" });
	};

	return (
		<div className="flex flex-col gap-md lg:flex-row lg:items-start">
			<div className="min-w-0 flex-1">
				<MonthGrid
					label={monthLabel(year, month)}
					cells={cells}
					byDay={byDay}
					selectedDay={selectedDay}
					today={today}
					onPrev={() => goMonth(-1)}
					onNext={() => goMonth(1)}
					onToday={goToday}
					onSelectDay={(day) => {
						setSelectedDay(day);
						setMode({ kind: "list" });
					}}
				/>
			</div>
			<div className="w-full shrink-0 lg:w-96">
				<DayPanel
					selectedDay={selectedDay}
					occurrences={dayOccs}
					events={state.events}
					mode={mode}
					editing={editing}
					onModeChange={setMode}
				/>
			</div>
		</div>
	);
}
```

- [ ] **Step 3: MonthGrid**

Usar `toolIconBtnClass`, `toolBtnGhostClass`, `toolPanelClass` de `@/lib/toolUi`.

Cabeçalho: botões ChevronLeft / ChevronRight / "Hoje" + `label`.

Header da semana: `["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"]`.

Grid: `grid grid-cols-7 gap-3xs`.

Cada célula:
- botão full width, min-height ~5.5rem
- número do dia
- até 2 chips (`title` truncado + cor via mapa de classes)
- se `occs.length > 2`, texto `+N`
- `today`: ring/accent-bg discreto
- `selected`: `border-accent`
- `!inMonth`: `opacity-50`

Mapa de cor sugerido (classes Tailwind do hub ou fallbacks):

```ts
const COLOR_DOT: Record<EventColor, string> = {
	accent: "bg-accent",
	sky: "bg-sky-500",
	rose: "bg-rose-500",
	amber: "bg-amber-500",
	emerald: "bg-emerald-500",
	violet: "bg-violet-500",
};
```

Props:

```ts
interface MonthGridProps {
	label: string;
	cells: readonly MonthCell[];
	byDay: Map<string, DayOccurrence[]>;
	selectedDay: string;
	today: string;
	onPrev: () => void;
	onNext: () => void;
	onToday: () => void;
	onSelectDay: (dateKey: string) => void;
}
```

- [ ] **Step 4: DayPanel**

Modos:
- `list`: data formatada (`pt-BR`), lista de ocorrências (botão abre edit da série), "Novo evento", empty state
- `create` / `edit`: form com campos
  - título (input)
  - notas (textarea curto)
  - início / fim (`type="date"`)
  - recorrência (`select`: Nenhuma, Diária, Semanal, Mensal, Anual)
  - fim da recorrência (`type="date"`, só se recorrência !== none)
  - cor (chips da paleta)
  - Salvar / Cancelar / Apagar (só edit)

Defaults no create: `startDate = endDate = selectedDay`, `recurrence = none`, `color = accent`.

Salvar chama `upsertEvent` (com `id` no edit). Apagar chama `removeEvent` e volta para list.

Formatar data do painel:

```ts
function formatDayTitle(dateKey: string): string {
	const [y, m, d] = dateKey.split("-").map(Number);
	const dt = new Date(y ?? 0, (m ?? 1) - 1, d ?? 1);
	return dt.toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
}
```

- [ ] **Step 5: Lint mental / classes**

Confirmar: nenhum `md:flex-row` na estrutura principal; só `lg:flex-row`. Sem `console.log`. Copy em pt-BR.

- [ ] **Step 6: Commit** (somente se o usuário pedir)

```bash
git add src/tools/PersonalCalendar
git commit -m "$(cat <<'EOF'
feat(personal-calendar): montar grade mensal e painel do dia

EOF
)"
```

---

### Task 5: Registrar a tool no site

**Files:**
- Create: `src/content/posts/tools/calendario-pessoal.md`
- Modify: `src/pages/app/[slug].astro`

**Interfaces:**
- Consumes: default export `PersonalCalendar`

- [ ] **Step 1: Content entry**

```md
---
slug: "calendario-pessoal"
type: tool
title: "Calendário pessoal"
description: "Grade mensal com eventos de dia inteiro, únicos ou recorrentes. Dados só no seu dispositivo."
date: 2026-10-06
target: "PersonalCalendar"
---
```

- [ ] **Step 2: Wire slug page**

Em `src/pages/app/[slug].astro`:
- `import PersonalCalendar from "../../tools/PersonalCalendar/PersonalCalendar";`
- case `"PersonalCalendar": return <PersonalCalendar client:load />;`

- [ ] **Step 3: Verify**

Run: `npm test -- src/tools/PersonalCalendar/domain.test.ts`
Run: `npm run lint` (ou ao menos `astro check` se lint completo for pesado)
Expected: testes PASS; sem erros novos no PersonalCalendar / slug

Smoke manual: `npm run dev` → `/app/calendario-pessoal/` → navegar mês, criar único, criar semanal, editar série, apagar.

- [ ] **Step 4: Commit** (somente se o usuário pedir)

```bash
git add src/content/posts/tools/calendario-pessoal.md src/pages/app/[slug].astro src/tools/PersonalCalendar
git commit -m "$(cat <<'EOF'
feat(personal-calendar): registrar tool no hub

EOF
)"
```

---

## Self-review

1. **Spec coverage (design aprovado no chat):** grade mensal, dia inteiro, único + diário/semanal/mensal/anual com fim opcional, multi-dia, editar/apagar série inteira, painel do dia, localStorage, registro no site. Fora de escopo omitido.
2. **Placeholders:** nenhum TBD/TODO residual nas tasks.
3. **Tipos:** `CalendarEvent`, `EventInput`, `DayOccurrence`, `PanelMode` consistentes entre tasks.
