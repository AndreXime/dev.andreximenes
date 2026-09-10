import { useStore } from "@nanostores/react";
import type Konva from "konva";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
	Circle,
	Ellipse,
	Image as KonvaImage,
	Stage as KonvaStage,
	Layer,
	Line,
	Rect,
	RegularPolygon,
	Star,
	Text,
	Transformer,
} from "react-konva";
import { AddElementCommand, history, snapshotPatches, UpdateElementsCommand } from "../engine/history";
import { computeSnap, type SnapGuide } from "../engine/snapEngine";
import { isCenterBasedShape, regularPolygonSides } from "../shapes";
import {
	applyElementPatches,
	canvasScene$,
	createElement,
	editorTool$,
	isTransparentBackground,
	setSelection,
	sortedElements,
} from "../store";
import type { CanvasElement, ElementPatch } from "../types";

export interface CanvasStageHandle {
	getStage: () => Konva.Stage | null;
	getOverlayNodes: () => Konva.Node[];
}

interface CanvasStageProps {
	stageRef: React.RefObject<CanvasStageHandle | null>;
}

function useHtmlImage(src: string | undefined): HTMLImageElement | undefined {
	const [image, setImage] = useState<HTMLImageElement | undefined>();

	useEffect(() => {
		if (!src) {
			setImage(undefined);
			return;
		}
		const img = new window.Image();
		img.onload = () => setImage(img);
		img.onerror = () => setImage(undefined);
		img.src = src;
	}, [src]);

	return image;
}

function ElementNode({
	element,
	interactive,
	onSelect,
	onDragStart,
	onDragMove,
	onDragEnd,
	onTransformEnd,
	registerNode,
}: {
	element: CanvasElement;
	selected: boolean;
	interactive: boolean;
	onSelect: (e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => void;
	onDragStart: (id: string) => void;
	onDragMove: (id: string, node: Konva.Node) => void;
	onDragEnd: (id: string, node: Konva.Node) => void;
	onTransformEnd: (id: string, node: Konva.Node) => void;
	registerNode: (id: string, node: Konva.Node | null) => void;
}) {
	const image = useHtmlImage(element.type === "image" ? element.src : undefined);
	const common = {
		id: element.id,
		rotation: element.rotation,
		scaleX: element.scaleX,
		scaleY: element.scaleY,
		opacity: element.opacity,
		visible: element.visible,
		listening: interactive,
		draggable: interactive && !element.locked,
		onClick: onSelect,
		onTap: onSelect,
		onDragStart: () => onDragStart(element.id),
		onDragMove: (e: Konva.KonvaEventObject<DragEvent>) => onDragMove(element.id, e.target),
		onDragEnd: (e: Konva.KonvaEventObject<DragEvent>) => onDragEnd(element.id, e.target),
		onTransformEnd: (e: Konva.KonvaEventObject<Event>) => onTransformEnd(element.id, e.target),
		ref: (node: Konva.Node | null) => registerNode(element.id, node),
	};

	if (element.type === "rect") {
		return (
			<Rect
				{...common}
				x={element.x}
				y={element.y}
				width={element.width}
				height={element.height}
				fill={element.fill ?? "#d7e0ea"}
				stroke={element.stroke ?? "#1a2330"}
				strokeWidth={element.strokeWidth ?? 0}
			/>
		);
	}

	if (element.type === "circle") {
		const radius = Math.min(element.width, element.height) / 2;
		return (
			<Circle
				{...common}
				x={element.x + element.width / 2}
				y={element.y + element.height / 2}
				radius={radius}
				fill={element.fill ?? "#e8a06a"}
				stroke={element.stroke ?? "#1a2330"}
				strokeWidth={element.strokeWidth ?? 0}
			/>
		);
	}

	if (element.type === "ellipse") {
		return (
			<Ellipse
				{...common}
				x={element.x + element.width / 2}
				y={element.y + element.height / 2}
				radiusX={element.width / 2}
				radiusY={element.height / 2}
				fill={element.fill ?? "#e8a06a"}
				stroke={element.stroke ?? "#1a2330"}
				strokeWidth={element.strokeWidth ?? 0}
			/>
		);
	}

	const polygonSides = regularPolygonSides(element.type);
	if (polygonSides !== null) {
		const radius = Math.min(element.width, element.height) / 2;
		return (
			<RegularPolygon
				{...common}
				x={element.x + element.width / 2}
				y={element.y + element.height / 2}
				sides={polygonSides}
				radius={radius}
				fill={element.fill ?? "#7eb0c8"}
				stroke={element.stroke ?? "#1a2330"}
				strokeWidth={element.strokeWidth ?? 0}
			/>
		);
	}

	if (element.type === "star") {
		const outerRadius = Math.min(element.width, element.height) / 2;
		return (
			<Star
				{...common}
				x={element.x + element.width / 2}
				y={element.y + element.height / 2}
				numPoints={5}
				innerRadius={outerRadius * 0.45}
				outerRadius={outerRadius}
				fill={element.fill ?? "#7eb0c8"}
				stroke={element.stroke ?? "#1a2330"}
				strokeWidth={element.strokeWidth ?? 0}
			/>
		);
	}

	if (element.type === "line") {
		const points = element.points ?? [0, element.height / 2, element.width, element.height / 2];
		return (
			<Line
				{...common}
				x={element.x}
				y={element.y}
				points={points}
				stroke={element.stroke ?? "#1a2330"}
				strokeWidth={element.strokeWidth ?? 3}
				lineCap="round"
				lineJoin="round"
			/>
		);
	}

	if (element.type === "text") {
		return (
			<Text
				{...common}
				x={element.x}
				y={element.y}
				width={element.width}
				height={element.height}
				text={element.content ?? ""}
				fill={element.fill ?? "#1a2330"}
				fontSize={24}
				fontFamily="Hanken Grotesk, sans-serif"
			/>
		);
	}

	if (element.type === "image" && image) {
		return (
			<KonvaImage {...common} x={element.x} y={element.y} width={element.width} height={element.height} image={image} />
		);
	}

	if (element.type === "path" && element.points && element.points.length >= 4) {
		return (
			<Line
				{...common}
				x={element.x}
				y={element.y}
				points={element.points}
				stroke={element.stroke ?? "#1a2330"}
				strokeWidth={element.strokeWidth ?? 3}
				lineCap="round"
				lineJoin="round"
				tension={0.2}
			/>
		);
	}

	return null;
}

function nodeToBoxPatch(element: CanvasElement, node: Konva.Node): ElementPatch {
	if (element.type === "path" || element.type === "line") {
		return {
			x: node.x(),
			y: node.y(),
			rotation: node.rotation(),
			scaleX: node.scaleX(),
			scaleY: node.scaleY(),
		};
	}

	if (element.type === "ellipse") {
		const scaleX = node.scaleX();
		const scaleY = node.scaleY();
		const ellipse = node as Konva.Ellipse;
		const width = Math.max(5, ellipse.radiusX() * 2 * Math.abs(scaleX));
		const height = Math.max(5, ellipse.radiusY() * 2 * Math.abs(scaleY));
		node.scaleX(1);
		node.scaleY(1);
		ellipse.radiusX(width / 2);
		ellipse.radiusY(height / 2);
		return {
			x: node.x() - width / 2,
			y: node.y() - height / 2,
			width,
			height,
			rotation: node.rotation(),
			scaleX: 1,
			scaleY: 1,
		};
	}

	if (isCenterBasedShape(element.type)) {
		const scaleX = node.scaleX();
		const scaleY = node.scaleY();
		const factor = Math.max(Math.abs(scaleX), Math.abs(scaleY));
		let radius = Math.min(element.width, element.height) / 2;
		if (element.type === "circle") radius = (node as Konva.Circle).radius();
		else if (element.type === "star") radius = (node as Konva.Star).outerRadius();
		else radius = (node as Konva.RegularPolygon).radius();

		const size = Math.max(5, radius * 2 * factor);
		node.scaleX(1);
		node.scaleY(1);
		if (element.type === "circle") (node as Konva.Circle).radius(size / 2);
		else if (element.type === "star") {
			(node as Konva.Star).outerRadius(size / 2);
			(node as Konva.Star).innerRadius((size / 2) * 0.45);
		} else (node as Konva.RegularPolygon).radius(size / 2);

		return {
			x: node.x() - size / 2,
			y: node.y() - size / 2,
			width: size,
			height: size,
			rotation: node.rotation(),
			scaleX: 1,
			scaleY: 1,
		};
	}

	const scaleX = node.scaleX();
	const scaleY = node.scaleY();
	const width = Math.max(5, (node.width?.() ?? element.width) * Math.abs(scaleX));
	const height = Math.max(5, (node.height?.() ?? element.height) * Math.abs(scaleY));
	node.scaleX(1);
	node.scaleY(1);
	if ("width" in node && typeof node.width === "function") node.width(width);
	if ("height" in node && typeof node.height === "function") node.height(height);

	return {
		x: node.x(),
		y: node.y(),
		width,
		height,
		rotation: node.rotation(),
		scaleX: 1,
		scaleY: 1,
	};
}

export function CanvasStage({ stageRef }: CanvasStageProps) {
	const scene = useStore(canvasScene$);
	const editorTool = useStore(editorTool$);
	const drawingMode = editorTool === "draw";
	const containerRef = useRef<HTMLDivElement>(null);
	const konvaStageRef = useRef<Konva.Stage>(null);
	const transformerRef = useRef<Konva.Transformer>(null);
	const guidesLayerRef = useRef<Konva.Layer>(null);
	const nodeMapRef = useRef<Map<string, Konva.Node>>(new Map());
	const dragBeforeRef = useRef<Record<string, ElementPatch>>({});
	const isStrokeActiveRef = useRef(false);
	const draftPointsRef = useRef<number[] | null>(null);
	const [size, setSize] = useState({ width: 320, height: 320 });
	const [guides, setGuides] = useState<SnapGuide[]>([]);
	const [draftPoints, setDraftPoints] = useState<number[] | null>(null);

	const elements = useMemo(() => sortedElements(scene.elements), [scene.elements]);
	const selectedSet = useMemo(() => new Set(scene.selection), [scene.selection]);

	const scale = Math.min(size.width / scene.canvas.width, size.height / scene.canvas.height, 1);
	const stageWidth = scene.canvas.width * scale;
	const stageHeight = scene.canvas.height * scale;

	useEffect(() => {
		if (!drawingMode) {
			isStrokeActiveRef.current = false;
			draftPointsRef.current = null;
			setDraftPoints(null);
		}
	}, [drawingMode]);

	useEffect(() => {
		const el = containerRef.current;
		if (!el) return;
		const observer = new ResizeObserver((entries) => {
			const entry = entries[0];
			if (!entry) return;
			const { width, height } = entry.contentRect;
			setSize({ width: Math.max(1, width), height: Math.max(1, height) });
		});
		observer.observe(el);
		return () => observer.disconnect();
	}, []);

	useEffect(() => {
		const handle: CanvasStageHandle = {
			getStage: () => konvaStageRef.current,
			getOverlayNodes: () => {
				const nodes: Konva.Node[] = [];
				if (transformerRef.current) nodes.push(transformerRef.current);
				if (guidesLayerRef.current) nodes.push(guidesLayerRef.current);
				return nodes;
			},
		};
		stageRef.current = handle;
		return () => {
			stageRef.current = null;
		};
	}, [stageRef]);

	useEffect(() => {
		const tr = transformerRef.current;
		if (!tr) return;
		if (drawingMode) {
			tr.nodes([]);
			tr.getLayer()?.batchDraw();
			return;
		}
		const nodes = scene.selection
			.map((id) => nodeMapRef.current.get(id))
			.filter((node): node is Konva.Node => {
				if (!node) return false;
				if (!node.visible()) return false;
				const el = scene.elements[node.id()];
				return Boolean(el) && !el?.locked;
			});

		tr.nodes(nodes);
		tr.getLayer()?.batchDraw();
	}, [scene.selection, scene.elements, elements, drawingMode]);

	const registerNode = useCallback((id: string, node: Konva.Node | null) => {
		if (node) nodeMapRef.current.set(id, node);
		else nodeMapRef.current.delete(id);
	}, []);

	const handleSelect = useCallback((elementId: string, e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => {
		if (editorTool$.get() === "draw") return;
		e.cancelBubble = true;
		const shift = e.evt.shiftKey;
		const current = canvasScene$.get().selection;
		if (shift) {
			if (current.includes(elementId)) {
				setSelection(current.filter((id) => id !== elementId));
			} else {
				setSelection([...current, elementId]);
			}
		} else {
			setSelection([elementId]);
		}
	}, []);

	const finishStroke = useCallback((points: number[]) => {
		isStrokeActiveRef.current = false;
		draftPointsRef.current = null;
		setDraftPoints(null);
		if (points.length < 4) return;

		let minX = Number.POSITIVE_INFINITY;
		let minY = Number.POSITIVE_INFINITY;
		let maxX = Number.NEGATIVE_INFINITY;
		let maxY = Number.NEGATIVE_INFINITY;
		for (let i = 0; i < points.length; i += 2) {
			const px = points[i];
			const py = points[i + 1];
			if (px === undefined || py === undefined) continue;
			minX = Math.min(minX, px);
			minY = Math.min(minY, py);
			maxX = Math.max(maxX, px);
			maxY = Math.max(maxY, py);
		}

		const relative: number[] = [];
		for (let i = 0; i < points.length; i += 2) {
			const px = points[i];
			const py = points[i + 1];
			if (px === undefined || py === undefined) continue;
			relative.push(px - minX, py - minY);
		}

		const element = createElement("path", {
			x: minX,
			y: minY,
			width: Math.max(1, maxX - minX),
			height: Math.max(1, maxY - minY),
			points: relative,
		});
		history.dispatch(new AddElementCommand(element));
	}, []);

	const handleStagePointerDown = useCallback((e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => {
		if (editorTool$.get() === "draw") {
			const stage = e.target.getStage();
			const pos = stage?.getRelativePointerPosition();
			if (!pos) return;
			e.cancelBubble = true;
			isStrokeActiveRef.current = true;
			const next = [pos.x, pos.y];
			draftPointsRef.current = next;
			setDraftPoints(next);
			setSelection([]);
			return;
		}

		if (e.target === e.target.getStage()) {
			setSelection([]);
			setGuides([]);
		}
	}, []);

	const handleStagePointerMove = useCallback((e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => {
		if (!isStrokeActiveRef.current || editorTool$.get() !== "draw") return;
		const stage = e.target.getStage();
		const pos = stage?.getRelativePointerPosition();
		if (!pos) return;
		const prev = draftPointsRef.current ?? [];
		const lastX = prev[prev.length - 2];
		const lastY = prev[prev.length - 1];
		if (lastX !== undefined && lastY !== undefined) {
			const dx = pos.x - lastX;
			const dy = pos.y - lastY;
			if (dx * dx + dy * dy < 4) return;
		}
		const next = [...prev, pos.x, pos.y];
		draftPointsRef.current = next;
		setDraftPoints(next);
	}, []);

	const handleStagePointerUp = useCallback(() => {
		if (!isStrokeActiveRef.current) return;
		const points = draftPointsRef.current;
		finishStroke(points ?? []);
	}, [finishStroke]);

	const onDragStart = useCallback((id: string) => {
		const sceneNow = canvasScene$.get();
		dragBeforeRef.current = snapshotPatches(sceneNow, [id], ["x", "y"]);
	}, []);

	const onDragMove = useCallback((id: string, node: Konva.Node) => {
		const sceneNow = canvasScene$.get();
		const el = sceneNow.elements[id];
		if (!el || el.locked) return;

		let box: { x: number; y: number; width: number; height: number };
		if (isCenterBasedShape(el.type)) {
			if (el.type === "ellipse") {
				const rx = (node as Konva.Ellipse).radiusX() * Math.abs(node.scaleX());
				const ry = (node as Konva.Ellipse).radiusY() * Math.abs(node.scaleY());
				box = { x: node.x() - rx, y: node.y() - ry, width: rx * 2, height: ry * 2 };
			} else {
				const r =
					el.type === "star"
						? (node as Konva.Star).outerRadius() * Math.max(Math.abs(node.scaleX()), Math.abs(node.scaleY()))
						: el.type === "circle"
							? (node as Konva.Circle).radius() * Math.max(Math.abs(node.scaleX()), Math.abs(node.scaleY()))
							: (node as Konva.RegularPolygon).radius() * Math.max(Math.abs(node.scaleX()), Math.abs(node.scaleY()));
				box = { x: node.x() - r, y: node.y() - r, width: r * 2, height: r * 2 };
			}
		} else {
			box = {
				x: node.x(),
				y: node.y(),
				width: el.width * Math.abs(node.scaleX()),
				height: el.height * Math.abs(node.scaleY()),
			};
		}

		const others = Object.values(sceneNow.elements)
			.filter((other) => other.id !== id && other.visible)
			.map((other) => ({
				x: other.x,
				y: other.y,
				width: other.width * other.scaleX,
				height: other.height * other.scaleY,
			}));

		const snapped = computeSnap(box, others, sceneNow.canvas, 5);
		setGuides(snapped.guides);

		if (isCenterBasedShape(el.type)) {
			node.position({ x: snapped.x + box.width / 2, y: snapped.y + box.height / 2 });
		} else {
			node.position({ x: snapped.x, y: snapped.y });
		}
	}, []);

	const onDragEnd = useCallback((id: string, node: Konva.Node) => {
		const sceneNow = canvasScene$.get();
		const el = sceneNow.elements[id];
		setGuides([]);
		if (!el) return;

		const nextXY = isCenterBasedShape(el.type)
			? {
					x: node.x() - (el.width * Math.abs(node.scaleX())) / 2,
					y: node.y() - (el.height * Math.abs(node.scaleY())) / 2,
				}
			: { x: node.x(), y: node.y() };

		const before = dragBeforeRef.current;
		dragBeforeRef.current = {};
		const beforePos = before[id];
		if (!beforePos) return;
		if (beforePos.x === nextXY.x && beforePos.y === nextXY.y) return;

		history.dispatch(new UpdateElementsCommand(before, { [id]: nextXY }));
	}, []);

	const onTransformEnd = useCallback((id: string, node: Konva.Node) => {
		const sceneNow = canvasScene$.get();
		const el = sceneNow.elements[id];
		if (!el) return;
		const before = snapshotPatches(sceneNow, [id], ["x", "y", "width", "height", "rotation", "scaleX", "scaleY"]);
		const patch = nodeToBoxPatch(el, node);
		const after = { [id]: patch };
		applyElementPatches(after);
		history.dispatch(new UpdateElementsCommand(before, after));
		setGuides([]);
	}, []);

	const transparent = isTransparentBackground(scene.canvas.backgroundColor);

	return (
		<div
			ref={containerRef}
			className="relative flex min-h-80 w-full flex-1 items-center justify-center overflow-hidden rounded-card border border-rule bg-paper-3/40 lg:min-h-0"
		>
			<div
				className="overflow-hidden rounded-sm shadow-sm"
				style={
					transparent
						? {
								backgroundImage:
									"linear-gradient(45deg, #c8ced6 25%, transparent 25%), linear-gradient(-45deg, #c8ced6 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #c8ced6 75%), linear-gradient(-45deg, transparent 75%, #c8ced6 75%)",
								backgroundSize: "16px 16px",
								backgroundPosition: "0 0, 0 8px, 8px -8px, -8px 0",
								backgroundColor: "#eef1f5",
							}
						: undefined
				}
			>
				<KonvaStage
					ref={konvaStageRef}
					width={stageWidth}
					height={stageHeight}
					scaleX={scale}
					scaleY={scale}
					style={{ cursor: drawingMode ? "crosshair" : "default" }}
					onMouseDown={handleStagePointerDown}
					onTouchStart={handleStagePointerDown}
					onMouseMove={handleStagePointerMove}
					onTouchMove={handleStagePointerMove}
					onMouseUp={handleStagePointerUp}
					onTouchEnd={handleStagePointerUp}
					onMouseLeave={handleStagePointerUp}
				>
					<Layer>
						{!transparent && (
							<Rect
								x={0}
								y={0}
								width={scene.canvas.width}
								height={scene.canvas.height}
								fill={scene.canvas.backgroundColor}
								listening={false}
							/>
						)}
						{elements.map((element) => (
							<ElementNode
								key={element.id}
								element={element}
								selected={selectedSet.has(element.id)}
								interactive={!drawingMode}
								onSelect={(e) => handleSelect(element.id, e)}
								onDragStart={onDragStart}
								onDragMove={onDragMove}
								onDragEnd={onDragEnd}
								onTransformEnd={onTransformEnd}
								registerNode={registerNode}
							/>
						))}
						{draftPoints && draftPoints.length >= 4 && (
							<Line
								points={draftPoints}
								stroke="#1a2330"
								strokeWidth={3}
								lineCap="round"
								lineJoin="round"
								tension={0.2}
								listening={false}
							/>
						)}
						{!drawingMode && (
							<Transformer
								ref={transformerRef}
								rotateEnabled
								boundBoxFunc={(oldBox, newBox) => {
									if (newBox.width < 5 || newBox.height < 5) return oldBox;
									return newBox;
								}}
							/>
						)}
					</Layer>
					<Layer ref={guidesLayerRef} listening={false}>
						{guides.map((guide) =>
							guide.orientation === "v" ? (
								<Line
									key={`v-${guide.position}`}
									points={[guide.position, 0, guide.position, scene.canvas.height]}
									stroke="#c45c26"
									strokeWidth={1 / scale}
									dash={[4 / scale, 4 / scale]}
								/>
							) : (
								<Line
									key={`h-${guide.position}`}
									points={[0, guide.position, scene.canvas.width, guide.position]}
									stroke="#c45c26"
									strokeWidth={1 / scale}
									dash={[4 / scale, 4 / scale]}
								/>
							),
						)}
					</Layer>
				</KonvaStage>
			</div>
		</div>
	);
}
