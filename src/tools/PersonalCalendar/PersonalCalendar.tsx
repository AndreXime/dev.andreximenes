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
