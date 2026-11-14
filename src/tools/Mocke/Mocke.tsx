import { Database } from "lucide-react";
import { ToolShell } from "../ToolShell";
import { MockeView } from "./MockeView";

export default function Mocke() {
	return (
		<ToolShell
			title="Mockê"
			description="Gera e copia JSON de datasets mock (produtos, usuários, CEPs…) no navegador."
			icon={<Database className="size-6" strokeWidth={2} />}
		>
			<MockeView />
		</ToolShell>
	);
}
