import { Trophy } from "lucide-react";
import { ToolShell } from "../ToolShell";
import { GoalQuestView } from "./GoalQuestView";
import { goalQuestStorage } from "./store";

export default function GoalQuest() {
	return (
		<ToolShell
			title="Goal Quest"
			description="Missões diárias, semanais, mensais e de data única com XP, nível, streak e badges."
			icon={<Trophy className="size-6" strokeWidth={2} />}
			storage={goalQuestStorage}
		>
			<GoalQuestView />
		</ToolShell>
	);
}
