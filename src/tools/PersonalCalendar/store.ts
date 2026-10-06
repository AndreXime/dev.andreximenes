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

	const events = existing ? state.events.map((e) => (e.id === eventId ? next : e)) : [...state.events, next];
	calendar$.set({ events });
	return { ok: true, id: eventId };
}

export function removeEvent(id: string): void {
	const state = calendar$.get();
	calendar$.set({ events: state.events.filter((e) => e.id !== id) });
}
