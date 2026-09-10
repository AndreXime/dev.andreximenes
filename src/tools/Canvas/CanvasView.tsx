import { useEffect, useRef, useState } from "react";
import { toolSegmentTabClass, toolTabBarClass } from "@/lib/toolUi";
import { LayersPanel } from "./components/LayersPanel";
import { PagePanel } from "./components/PagePanel";
import { PropertiesPanel } from "./components/PropertiesPanel";
import { CanvasStage, type CanvasStageHandle } from "./components/Stage";
import { ToolsPanel } from "./components/ToolsPanel";
import { DeleteElementsCommand, history } from "./engine/history";
import { canvasScene$ } from "./store";

type SideTab = "page" | "tools" | "properties" | "layers";

const SIDE_TABS: { id: SideTab; label: string }[] = [
	{ id: "page", label: "Página" },
	{ id: "tools", label: "Ferramentas" },
	{ id: "properties", label: "Propriedades" },
	{ id: "layers", label: "Camadas" },
];

export function CanvasView() {
	const stageHandleRef = useRef<CanvasStageHandle | null>(null);
	const [notice, setNotice] = useState<string | null>(null);
	const [sideTab, setSideTab] = useState<SideTab>("page");

	useEffect(() => {
		if (!notice) return;
		const t = setTimeout(() => setNotice(null), 3200);
		return () => clearTimeout(t);
	}, [notice]);

	useEffect(() => {
		function onKeyDown(e: KeyboardEvent) {
			const target = e.target as HTMLElement | null;
			const tag = target?.tagName;
			const typing = tag === "INPUT" || tag === "TEXTAREA" || target?.isContentEditable;

			const mod = e.metaKey || e.ctrlKey;
			if (mod && e.key.toLowerCase() === "z") {
				e.preventDefault();
				if (e.shiftKey) history.redo();
				else history.undo();
				return;
			}
			if (mod && e.key.toLowerCase() === "y") {
				e.preventDefault();
				history.redo();
				return;
			}

			if (typing) return;

			if (e.key === "Delete" || e.key === "Backspace") {
				const ids = canvasScene$.get().selection;
				if (ids.length === 0) return;
				e.preventDefault();
				history.dispatch(new DeleteElementsCommand(ids));
			}
		}

		window.addEventListener("keydown", onKeyDown);
		return () => window.removeEventListener("keydown", onKeyDown);
	}, []);

	return (
		<div className="flex h-full min-h-0 flex-1 flex-col gap-md">
			{notice && (
				<output
					aria-live="polite"
					className="block shrink-0 rounded-input border border-accent/40 bg-paper-2 px-sm py-2 text-sm text-ink"
				>
					{notice}
				</output>
			)}

			<div className="flex min-h-0 flex-1 flex-col gap-md lg:flex-row lg:items-stretch">
				<div className="flex min-h-96 min-w-0 flex-1 flex-col lg:min-h-0">
					<CanvasStage stageRef={stageHandleRef} />
				</div>

				<aside className="flex w-full shrink-0 flex-col gap-sm lg:max-h-full lg:w-[min(100%,22rem)] lg:overflow-y-auto">
					<div className={toolTabBarClass} role="tablist" aria-label="Painel do editor">
						{SIDE_TABS.map((tab) => (
							<button
								key={tab.id}
								type="button"
								role="tab"
								aria-selected={sideTab === tab.id}
								className={toolSegmentTabClass(sideTab === tab.id)}
								onClick={() => setSideTab(tab.id)}
							>
								{tab.label}
							</button>
						))}
					</div>

					<div role="tabpanel" hidden={sideTab !== "page"}>
						{sideTab === "page" && <PagePanel />}
					</div>
					<div role="tabpanel" hidden={sideTab !== "tools"}>
						{sideTab === "tools" && <ToolsPanel stageHandleRef={stageHandleRef} onNotice={setNotice} />}
					</div>
					<div role="tabpanel" hidden={sideTab !== "properties"}>
						{sideTab === "properties" && <PropertiesPanel />}
					</div>
					<div role="tabpanel" hidden={sideTab !== "layers"}>
						{sideTab === "layers" && <LayersPanel />}
					</div>
				</aside>
			</div>
		</div>
	);
}
