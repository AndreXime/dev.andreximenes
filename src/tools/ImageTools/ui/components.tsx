import { Loader2, Trash2, X } from "lucide-react";
import {
	toolAlertDangerClass,
	toolAlertWarningClass,
	toolBtnGhostClass,
	toolCardClass,
	toolChipClass,
	toolLabelClass,
	toolListItemActiveClass,
	toolListItemClass,
} from "@/lib/toolUi";
import { COMPRESS_MAX_WIDTH_OPTIONS, type ImageItem, type ModelPreloadStatus, type OutputFormat } from "../domain";
import { isFormatSupported } from "../lib/formatSupport";
import { $compressMaxWidth, $error, $outputFormat, $quality } from "../store";
import { CONVERT_FORMATS, PRELOAD_PROGRESS_BAR_CLASS, PROGRESS_BAR_CLASS, STATUS_LABEL } from "./constants";

export function Label({ children, htmlFor }: { children: React.ReactNode; htmlFor?: string }) {
	return (
		<label htmlFor={htmlFor} className={`${toolLabelClass} mb-1 block`}>
			{children}
		</label>
	);
}

export function ErrorBanner({ message, onDismiss }: { message: string; onDismiss?: () => void }) {
	return (
		<div role="alert" className={toolAlertDangerClass}>
			<span>{message}</span>
			{onDismiss && (
				<button
					type="button"
					onClick={onDismiss}
					className="shrink-0 cursor-pointer"
					aria-label="Fechar mensagem de erro"
				>
					<X className="size-4" aria-hidden="true" />
				</button>
			)}
		</div>
	);
}

export function ImageListItem({
	item,
	active,
	selected,
	onSelect,
	onToggleSelected,
	onRemove,
}: {
	item: ImageItem;
	active: boolean;
	selected: boolean;
	onSelect: () => void;
	onToggleSelected: () => void;
	onRemove: () => void;
}) {
	return (
		<li>
			<div
				className={`${toolListItemClass} flex items-center gap-2 px-2 py-1.5 ${active ? toolListItemActiveClass : ""}`}
			>
				<input
					type="checkbox"
					checked={selected}
					onChange={onToggleSelected}
					onClick={(e) => e.stopPropagation()}
					aria-label={`Incluir ${item.file.name} na selecao multipla`}
					className="size-5 shrink-0 cursor-pointer accent-accent"
				/>
				<button
					type="button"
					onClick={onSelect}
					aria-label={`Usar so ${item.file.name}`}
					className="flex min-w-0 flex-1 cursor-pointer items-center gap-2 text-left"
				>
					{item.sourceUrl ? (
						<img src={item.sourceUrl} alt="" className="size-10 shrink-0 rounded-input bg-paper-3 object-cover" />
					) : (
						<div className="size-10 shrink-0 rounded-input bg-paper-3" />
					)}
					<div className="min-w-0 flex-1">
						<p className="truncate text-sm text-ink">{item.file.name}</p>
						<p
							className={`text-xs ${
								item.status === "error" ? "text-danger" : item.status === "done" ? "text-success" : "text-muted"
							}`}
						>
							{STATUS_LABEL[item.status]}
						</p>
					</div>
				</button>
				<button
					type="button"
					onClick={onRemove}
					className="shrink-0 p-1 text-muted hover:text-ink"
					aria-label={`Remover ${item.file.name}`}
				>
					<Trash2 className="size-3.5" aria-hidden="true" />
				</button>
			</div>
		</li>
	);
}

export function ConvertControls({
	format,
	quality,
	supportedFormats,
}: {
	format: OutputFormat;
	quality: number;
	supportedFormats: Record<OutputFormat, boolean> | null;
}) {
	return (
		<div className="space-y-3">
			<div>
				<Label>Formato de saida</Label>
				<div className="flex flex-wrap gap-2">
					{CONVERT_FORMATS.map((f) => {
						const supported = isFormatSupported(supportedFormats, f);
						return (
							<button
								key={f}
								type="button"
								disabled={!supported}
								title={supported ? undefined : "Nao suportado neste navegador"}
								onClick={() => $outputFormat.set(f)}
								className={toolChipClass(format === f)}
							>
								{f.toUpperCase()}
							</button>
						);
					})}
				</div>
			</div>
			{(format === "jpeg" || format === "webp") && (
				<div>
					<Label htmlFor="convert-quality">Qualidade: {quality}%</Label>
					<input
						id="convert-quality"
						type="range"
						min={1}
						max={100}
						value={quality}
						onChange={(e) => $quality.set(Number(e.target.value))}
						className="w-full accent-accent"
					/>
				</div>
			)}
		</div>
	);
}

export function CompressControls({
	quality,
	maxWidth,
	hasAlpha,
}: {
	quality: number;
	maxWidth: number;
	hasAlpha: boolean;
}) {
	return (
		<div className="space-y-3">
			{hasAlpha && (
				<p className={toolAlertWarningClass}>
					Esta imagem tem transparencia. A compressao usara WebP ou PNG para preservar o fundo transparente.
				</p>
			)}
			<div>
				<Label htmlFor="compress-quality">Qualidade: {quality}%</Label>
				<input
					id="compress-quality"
					type="range"
					min={1}
					max={100}
					value={quality}
					onChange={(e) => $quality.set(Number(e.target.value))}
					className="w-full accent-accent"
				/>
				<div className="mt-1 flex justify-between text-xs text-muted">
					<span>Menor arquivo</span>
					<span>Maior qualidade</span>
				</div>
			</div>
			<div>
				<Label>Largura maxima</Label>
				<div className="flex flex-wrap gap-2">
					{COMPRESS_MAX_WIDTH_OPTIONS.map((opt) => (
						<button
							key={opt.value}
							type="button"
							onClick={() => $compressMaxWidth.set(opt.value)}
							className={toolChipClass(maxWidth === opt.value)}
						>
							{opt.label}
						</button>
					))}
				</div>
			</div>
		</div>
	);
}

export function ModelPreloadBanner({
	status,
	progress,
	onRetry,
}: {
	status: ModelPreloadStatus;
	progress: number;
	onRetry: () => void;
}) {
	if (status === "idle" || status === "ready") return null;

	if (status === "error") {
		return (
			<div
				className={`${toolCardClass} flex flex-col gap-2 px-sm py-2 text-sm text-muted lg:flex-row lg:items-center lg:justify-between`}
			>
				<p>
					Nao foi possivel preparar o modelo de IA em segundo plano. A remocao de fundo ainda funciona, mas pode demorar
					mais na primeira execucao.
				</p>
				<button type="button" onClick={onRetry} className={`${toolBtnGhostClass} shrink-0`}>
					Tentar novamente
				</button>
			</div>
		);
	}

	return (
		<output className={`${toolCardClass} block space-y-1.5 px-sm py-2 text-sm text-muted`} aria-live="polite">
			<span className="flex items-center justify-between gap-2">
				<span className="flex items-center gap-1.5">
					<Loader2 className="size-3.5 animate-spin text-accent" aria-hidden="true" />
					Preparando modelo de IA em segundo plano...
				</span>
				<span>{progress}%</span>
			</span>
			<progress
				value={progress}
				max={100}
				aria-label="Download do modelo de IA"
				className={PRELOAD_PROGRESS_BAR_CLASS}
			/>
		</output>
	);
}

export function BgRemovalInfo({ modelPreloadStatus }: { modelPreloadStatus: ModelPreloadStatus }) {
	return (
		<div className="space-y-2 text-sm text-muted">
			<p>Remove o fundo da imagem usando IA diretamente no navegador.</p>
			<p className="text-sm text-muted">
				{modelPreloadStatus === "ready"
					? "Modelo de IA pronto. O resultado sera salvo em PNG."
					: modelPreloadStatus === "loading"
						? "Aguarde o download do modelo (~30MB) terminar para usar esta ferramenta."
						: "O modelo sera baixado na primeira execucao. O resultado sera salvo em PNG."}
			</p>
		</div>
	);
}

export function ProcessingStatus({
	label,
	current,
	total,
	batchRunning,
	onCancel,
}: {
	label: string;
	current: number;
	total: number;
	batchRunning: boolean;
	onCancel: () => void;
}) {
	return (
		<div className="space-y-1.5">
			<div className="flex items-center justify-between text-sm text-muted">
				<span className="flex items-center gap-1.5">
					<Loader2 className="size-3.5 animate-spin text-accent" aria-hidden="true" />
					{label || "Processando..."}
				</span>
				{batchRunning && total > 0 && (
					<span>
						{current}/{total}
					</span>
				)}
			</div>
			{batchRunning && total > 0 && (
				<progress
					value={(current / total) * 100}
					max={100}
					aria-label={label || "Progresso do processamento"}
					className={PROGRESS_BAR_CLASS}
				/>
			)}
			<button
				type="button"
				onClick={onCancel}
				className="cursor-pointer text-sm text-muted transition-colors hover:text-ink"
			>
				Cancelar
			</button>
		</div>
	);
}

export function dismissGlobalError(): void {
	$error.set(null);
}
