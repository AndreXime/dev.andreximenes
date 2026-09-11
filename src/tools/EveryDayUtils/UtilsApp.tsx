import { ArrowLeft, ChevronRight, Wrench } from "lucide-react";
import { useState } from "react";
import { toolBtnGhostClass, toolSelectCardClass } from "@/lib/toolUi";
import { ToolShell } from "../ToolShell";
import { type ToolListItem, tools } from "./toolsData";

export default function UtilsApp() {
	const [selectedTool, setSelectedTool] = useState<ToolListItem>();
	const isListView = !selectedTool;

	return (
		<ToolShell
			title={selectedTool?.title ?? "Ferramentas Úteis"}
			{...(isListView
				? {
						description:
							"Calculadoras, geradores e conversores práticos para o dia a dia. Tudo roda localmente no navegador.",
					}
				: {})}
			icon={
				selectedTool ? (
					<selectedTool.icon className="size-6" strokeWidth={2} />
				) : (
					<Wrench className="size-6" strokeWidth={2} />
				)
			}
			{...(!isListView
				? {
						actions: (
							<button type="button" onClick={() => setSelectedTool(undefined)} className={toolBtnGhostClass}>
								<ArrowLeft className="size-4" />
								Voltar
							</button>
						),
					}
				: {})}
		>
			{isListView ? (
				<section id="tool-list-view" className="animate-in fade-in slide-in-from-bottom-4 duration-500">
					<div className="flex flex-col gap-2">
						{tools.map((tool) => {
							const Icon = tool.icon;

							return (
								<button
									key={tool.title}
									type="button"
									className={toolSelectCardClass}
									onClick={() => setSelectedTool(tool)}
								>
									<span className="flex flex-1 items-center pr-2 text-base font-medium text-ink-2 transition-colors group-hover:text-ink lg:text-lg">
										<Icon className="w-5 h-5 mr-3 opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-all text-accent" />
										{tool.title}
									</span>
									<ChevronRight className="h-5 w-5 opacity-50 group-hover:opacity-100 group-hover:translate-x-1 transition-all text-accent" />
								</button>
							);
						})}
					</div>
				</section>
			) : (
				selectedTool && (
					<div className="animate-in fade-in slide-in-from-right-8 duration-300">
						<selectedTool.component />
					</div>
				)
			)}
		</ToolShell>
	);
}
