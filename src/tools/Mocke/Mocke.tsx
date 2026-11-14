import { Database } from "lucide-react";
import { ToolShell } from "../ToolShell";
import { MockeView } from "./MockeView";

export default function Mocke() {
	return (
		<ToolShell
			title="Gerador de mocks"
			description="Filtra datasets fictícios e copia JSON ou CSV no navegador para prototipar frontends."
			icon={<Database className="size-6" strokeWidth={2} />}
		>
			<MockeView />
		</ToolShell>
	);
}
