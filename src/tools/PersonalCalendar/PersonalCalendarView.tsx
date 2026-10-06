import { useStore } from "@nanostores/react";
import { useMemo, useState } from "react";
import {
	buildMonthGrid,
	type CalendarEvent,
	type DayOccurrence,
	listUpcomingEvents,
	localDateKey,
	monthLabel,
	occurrencesByDay,
	shiftMonth,
} from "./domain";
import { calendar$ } from "./store";
import { DayPanel, type PanelMode } from "./ui/DayPanel";
import { EventsListModal } from "./ui/EventsListModal";
import { MonthGrid } from "./ui/MonthGrid";

export function PersonalCalendarView() {
	const state = useStore(calendar$);
	const today = localDateKey();
	const [year, setYear] = useState(() => Number(today.slice(0, 4)));
	const [month, setMonth] = useState(() => Number(today.slice(5, 7)));
	const [selectedDay, setSelectedDay] = useState<string | null>(null);
	const [mode, setMode] = useState<PanelMode>({ kind: "list" });
	const [listOpen, setListOpen] = useState(false);

	const cells = useMemo(() => buildMonthGrid(year, month), [year, month]);
	const rangeStart = cells[0]?.dateKey ?? today;
	const rangeEnd = cells[cells.length - 1]?.dateKey ?? today;

	const byDay = useMemo(
		() => occurrencesByDay(state.events, rangeStart, rangeEnd),
		[state.events, rangeStart, rangeEnd],
	);

	const upcoming = useMemo(() => listUpcomingEvents(state.events, today), [state.events, today]);

	const dayOccs: readonly DayOccurrence[] = selectedDay ? (byDay.get(selectedDay) ?? []) : [];
	const editing: CalendarEvent | null =
		mode.kind === "edit" ? (state.events.find((e) => e.id === mode.eventId) ?? null) : null;

	const goMonth = (delta: number): void => {
		const next = shiftMonth(year, month, delta);
		setYear(next.year);
		setMonth(next.month);
		setSelectedDay(null);
		setMode({ kind: "list" });
	};

	return (
		<div className="flex flex-col gap-md">
			{selectedDay !== null && (
				<DayPanel
					selectedDay={selectedDay}
					occurrences={dayOccs}
					events={state.events}
					mode={mode}
					editing={editing}
					onModeChange={setMode}
				/>
			)}
			<MonthGrid
				label={monthLabel(year, month)}
				cells={cells}
				byDay={byDay}
				selectedDay={selectedDay}
				today={today}
				onPrev={() => goMonth(-1)}
				onNext={() => goMonth(1)}
				onSelectDay={(day) => {
					setSelectedDay((current) => (current === day ? null : day));
					setMode({ kind: "list" });
				}}
				onList={() => setListOpen(true)}
			/>
			<EventsListModal open={listOpen} items={upcoming} onClose={() => setListOpen(false)} />
		</div>
	);
}
