import { Package } from "lucide-react";
import { ToolShell } from "../ToolShell";
import { PantryView } from "./PantryView";
import { pantryStorage } from "./store";

export default function Pantry() {
	return (
		<ToolShell
			title="Despensa"
			description="Estoque da casa com validade, tarefas e lista de compras que se atualiza sozinha."
			icon={<Package className="size-6" strokeWidth={2} />}
			storage={pantryStorage}
		>
			<PantryView />
		</ToolShell>
	);
}
