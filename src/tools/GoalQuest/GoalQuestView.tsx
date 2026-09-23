import { useStore } from "@nanostores/react";
import { CalendarCheck, History, ListTodo, Trophy } from "lucide-react";
import { type ReactNode, useEffect, useState } from "react";
import { toolSegmentTabClass, toolTabBarClass } from "@/lib/toolUi";
import { goalQuest$, reconcileNow } from "./store";
import { HistoryTab } from "./ui/HistoryTab";
import { MissionsTab } from "./ui/MissionsTab";
import { ProgressTab } from "./ui/ProgressTab";
import { TodayTab } from "./ui/TodayTab";

type TabId = "today" | "missions" | "progress" | "history";

const TABS: { id: TabId; label: string; icon: ReactNode }[] = [
	{ id: "today", label: "Hoje", icon: <CalendarCheck className="size-3.5" strokeWidth={2} /> },
	{ id: "missions", label: "Missões", icon: <ListTodo className="size-3.5" strokeWidth={2} /> },
	{ id: "progress", label: "Progresso", icon: <Trophy className="size-3.5" strokeWidth={2} /> },
	{ id: "history", label: "Histórico", icon: <History className="size-3.5" strokeWidth={2} /> },
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
						className={[toolSegmentTabClass(tab === t.id), "inline-flex items-center justify-center gap-2xs"].join(" ")}
						onClick={() => setTab(t.id)}
					>
						{t.icon}
						<span>{t.label}</span>
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
