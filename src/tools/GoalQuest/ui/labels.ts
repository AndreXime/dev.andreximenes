import type { LucideIcon } from "lucide-react";
import { CalendarDays, CalendarRange, Flag, Sun } from "lucide-react";
import type { Cadence, Difficulty } from "../domain";
import { addDays } from "../domain";

export const CADENCE_LABEL: Record<Cadence, string> = {
	daily: "Diária",
	weekly: "Semanal",
	monthly: "Mensal",
	once: "Data única",
};

export const DIFFICULTY_LABEL: Record<Difficulty, string> = {
	easy: "Fácil",
	medium: "Médio",
	hard: "Difícil",
};

export const CADENCE_ICON: Record<Cadence, LucideIcon> = {
	daily: Sun,
	weekly: CalendarDays,
	monthly: CalendarRange,
	once: Flag,
};

export function formatDayHeading(dateKey: string, todayKey: string): string {
	if (dateKey === todayKey) return "Hoje";
	if (dateKey === addDays(todayKey, -1)) return "Ontem";
	const parts = dateKey.split("-");
	const ys = parts[0];
	const ms = parts[1];
	const ds = parts[2];
	if (!ys || !ms || !ds) return dateKey;
	return `${ds}/${ms}/${ys}`;
}
