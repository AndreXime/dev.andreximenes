import type Konva from "konva";

export interface ExportOptions {
	readonly hideNodes?: Konva.Node[];
	readonly fileName?: string;
}

export function exportStagePng(stage: Konva.Stage, options: ExportOptions = {}): void {
	const hideNodes = options.hideNodes ?? [];
	const prevVisible = hideNodes.map((node) => node.visible());
	for (const node of hideNodes) node.visible(false);

	const scale = stage.scaleX() || 1;
	const dataUrl = stage.toDataURL({
		mimeType: "image/png",
		pixelRatio: 2 / scale,
	});

	for (let i = 0; i < hideNodes.length; i++) {
		const node = hideNodes[i];
		const wasVisible = prevVisible[i];
		if (node && wasVisible !== undefined) node.visible(wasVisible);
	}

	const link = document.createElement("a");
	link.href = dataUrl;
	link.download = options.fileName ?? `canvas-${Date.now()}.png`;
	link.click();
}
