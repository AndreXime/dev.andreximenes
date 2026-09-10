import { useStore } from "@nanostores/react";
import { ChevronDown, ChevronUp, Eye, EyeOff, Lock, Unlock } from "lucide-react";
import { toolIconBtnClass, toolListItemActiveClass, toolListItemClass, toolPanelClass } from "@/lib/toolUi";
import { history, ReorderElementCommand, snapshotPatches, UpdateElementsCommand } from "../engine/history";
import { shapeLabel } from "../shapes";
import { canvasScene$, setSelection, sortedElements } from "../store";
import type { CanvasElement } from "../types";

function layerLabel(el: CanvasElement): string {
	if (el.type === "text") return el.content?.trim() || "Texto";
	return shapeLabel(el.type);
}

export function LayersPanel() {
	const scene = useStore(canvasScene$);
	const layers = [...sortedElements(scene.elements)].reverse();
	const selected = new Set(scene.selection);

	function toggleFlag(el: CanvasElement, field: "visible" | "locked"): void {
		const before = snapshotPatches(scene, [el.id], [field]);
		const after = { [el.id]: { [field]: !el[field] } };
		history.dispatch(new UpdateElementsCommand(before, after));
	}

	if (layers.length === 0) {
		return (
			<div className={toolPanelClass}>
				<p className="m-0 text-sm text-muted">Nenhuma camada ainda.</p>
			</div>
		);
	}

	return (
		<div className={`${toolPanelClass} flex max-h-112 flex-col gap-2xs overflow-y-auto`}>
			{layers.map((el) => {
				const active = selected.has(el.id);
				return (
					<div
						key={el.id}
						className={[
							toolListItemClass,
							active ? toolListItemActiveClass : "",
							"flex items-center gap-2xs p-2xs",
						].join(" ")}
					>
						<button
							type="button"
							className="min-w-0 flex-1 truncate px-2xs py-2 text-left text-sm text-ink"
							onClick={() => setSelection([el.id])}
						>
							{layerLabel(el)}
						</button>
						<button
							type="button"
							className={toolIconBtnClass}
							aria-label={el.visible ? "Ocultar" : "Mostrar"}
							onClick={() => toggleFlag(el, "visible")}
						>
							{el.visible ? <Eye className="size-4" strokeWidth={2} /> : <EyeOff className="size-4" strokeWidth={2} />}
						</button>
						<button
							type="button"
							className={toolIconBtnClass}
							aria-label={el.locked ? "Desbloquear" : "Bloquear"}
							onClick={() => toggleFlag(el, "locked")}
						>
							{el.locked ? <Lock className="size-4" strokeWidth={2} /> : <Unlock className="size-4" strokeWidth={2} />}
						</button>
						<button
							type="button"
							className={toolIconBtnClass}
							aria-label="Subir camada"
							onClick={() => history.dispatch(new ReorderElementCommand(el.id, "up"))}
						>
							<ChevronUp className="size-4" strokeWidth={2} />
						</button>
						<button
							type="button"
							className={toolIconBtnClass}
							aria-label="Descer camada"
							onClick={() => history.dispatch(new ReorderElementCommand(el.id, "down"))}
						>
							<ChevronDown className="size-4" strokeWidth={2} />
						</button>
					</div>
				);
			})}
		</div>
	);
}
