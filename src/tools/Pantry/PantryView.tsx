import { useStore } from "@nanostores/react";
import { ClipboardList, Package } from "lucide-react";
import { type ReactNode, useEffect, useState } from "react";
import { toolSegmentTabClass, toolTabBarClass } from "@/lib/toolUi";
import { pantry$, syncNow } from "./store";
import { PantryTab } from "./ui/PantryTab";
import { PendingTab } from "./ui/PendingTab";

type TabId = "pantry" | "pending";

const TABS: { id: TabId; label: string; icon: ReactNode }[] = [
	{ id: "pantry", label: "Dispensa", icon: <Package className="size-3.5" strokeWidth={2} /> },
	{ id: "pending", label: "Pendências", icon: <ClipboardList className="size-3.5" strokeWidth={2} /> },
];

export function PantryView() {
	const state = useStore(pantry$);
	const [tab, setTab] = useState<TabId>("pantry");

	useEffect(() => {
		syncNow();
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
			{tab === "pantry" && <PantryTab state={state} />}
			{tab === "pending" && <PendingTab state={state} />}
		</div>
	);
}
