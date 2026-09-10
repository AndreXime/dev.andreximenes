import { Download, ImagePlus, Loader2 } from "lucide-react";
import {
	buildSizeDiffLabel,
	formatFileSize,
	type ImageItem,
	type ModelPreloadStatus,
	type OperationType,
	type OutputFormat,
} from "../domain";
import { $activeOperation, selectSolo } from "../store";
import {
	BgRemovalInfo,
	CompressControls,
	ConvertControls,
	dismissGlobalError,
	ErrorBanner,
	ProcessingStatus,
} from "./components";
import { OPERATIONS } from "./constants";

export function WorkspacePanel({
	activeItem,
	selectedItems,
	selectedIds,
	showMultiPreview,
	doneSelectedCount,
	activeOperation,
	outputFormat,
	quality,
	compressMaxWidth,
	supportedFormats,
	modelPreloadStatus,
	anyProcessing,
	batchRunning,
	batchProgress,
	error,
	isBgRemovalLoading,
	isApplyDisabled,
	isBatchDisabled,
	onCancel,
	onExecute,
	onBatchExecute,
	onDownloadSingle,
	onDownloadZip,
	onUseResultAsSource,
}: {
	activeItem: ImageItem | null;
	selectedItems: ImageItem[];
	selectedIds: string[];
	showMultiPreview: boolean;
	doneSelectedCount: number;
	activeOperation: OperationType | null;
	outputFormat: OutputFormat;
	quality: number;
	compressMaxWidth: number;
	supportedFormats: Record<OutputFormat, boolean> | null;
	modelPreloadStatus: ModelPreloadStatus;
	anyProcessing: boolean;
	batchRunning: boolean;
	batchProgress: { current: number; total: number; label: string };
	error: string | null;
	isBgRemovalLoading: boolean;
	isApplyDisabled: boolean;
	isBatchDisabled: boolean;
	onCancel: () => void;
	onExecute: () => void;
	onBatchExecute: () => void;
	onDownloadSingle: () => void;
	onDownloadZip: () => void;
	onUseResultAsSource: () => void;
}) {
	if (!activeItem) {
		return <p className="text-sm text-muted">Selecione uma imagem na lista.</p>;
	}

	const doneItems = selectedItems.filter((item) => item.status === "done" && item.resultBlob);
	const resultItems =
		doneItems.length > 0 ? doneItems : activeItem.resultBlob && activeItem.status === "done" ? [activeItem] : [];
	const originalBytes = resultItems.reduce((sum, item) => sum + item.file.size, 0);
	const resultBytes = resultItems.reduce((sum, item) => sum + (item.resultBlob?.size ?? 0), 0);
	const showResultBanner = resultItems.length > 0;

	return (
		<div className="min-w-0 space-y-4">
			{showMultiPreview ? (
				<MultiPreview selectedItems={selectedItems} activeItemId={activeItem.id} />
			) : (
				<SinglePreview item={activeItem} />
			)}

			{anyProcessing && (
				<ProcessingStatus
					label={batchProgress.label}
					current={batchProgress.current}
					total={batchProgress.total}
					batchRunning={batchRunning}
					onCancel={onCancel}
				/>
			)}

			{error && <ErrorBanner message={error} onDismiss={dismissGlobalError} />}

			{activeItem.error && <ErrorBanner message={activeItem.error} />}

			{showResultBanner && (
				<div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between bg-emerald-400/10 border border-emerald-400/20 rounded-lg px-3 py-2">
					<div className="text-emerald-600 font-bold">
						<div>
							Resultado
							{resultItems.length > 1 ? ` (${resultItems.length})` : ""}: {formatFileSize(resultBytes)}
						</div>
						<div className="text-emerald-600/80 font-medium">{buildSizeDiffLabel(originalBytes, resultBytes)}</div>
					</div>
					<div className="flex flex-wrap items-center gap-3">
						{!showMultiPreview && activeItem.resultBlob && activeItem.status === "done" && (
							<>
								<button
									type="button"
									onClick={onUseResultAsSource}
									className="flex items-center gap-1.5 font-medium text-muted hover:text-ink transition-colors cursor-pointer"
								>
									<ImagePlus className="w-4 h-4" aria-hidden="true" />
									Usar como nova imagem
								</button>
								<button
									type="button"
									onClick={onDownloadSingle}
									className="flex items-center gap-1.5 font-medium text-accent hover:text-ink transition-colors cursor-pointer"
								>
									<Download className="w-4 h-4" aria-hidden="true" />
									Baixar
								</button>
							</>
						)}
						{showMultiPreview && doneSelectedCount === 1 && (
							<button
								type="button"
								onClick={onDownloadSingle}
								className="flex items-center gap-1.5 font-medium text-accent hover:text-ink transition-colors cursor-pointer"
							>
								<Download className="w-4 h-4" aria-hidden="true" />
								Baixar
							</button>
						)}
						{doneSelectedCount >= 2 && (
							<button
								type="button"
								onClick={onDownloadZip}
								className="flex items-center gap-1.5 font-medium text-accent hover:text-ink transition-colors cursor-pointer"
							>
								<Download className="w-4 h-4" aria-hidden="true" />
								Baixar ZIP ({doneSelectedCount})
							</button>
						)}
					</div>
				</div>
			)}

			<div className="grid grid-cols-2 lg:grid-cols-3 gap-2">
				{OPERATIONS.map((op) => {
					const Icon = op.icon;
					const isActive = activeOperation === op.id;
					const isDisabled = anyProcessing || (op.id === "bg-removal" && isBgRemovalLoading);
					return (
						<button
							key={op.id}
							type="button"
							disabled={isDisabled}
							title={
								op.id === "bg-removal" && isBgRemovalLoading ? "Aguarde o modelo de IA terminar de carregar" : undefined
							}
							onClick={() => {
								$activeOperation.set(isActive ? null : op.id);
							}}
							className={`cursor-pointer flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-all border ${
								isActive
									? "bg-accent/15 border-accent/40 text-accent"
									: "bg-paper-2 border-rule/30 text-ink-2 hover:border-accent/30 hover:text-ink"
							} disabled:opacity-40 disabled:cursor-not-allowed`}
						>
							<Icon className="w-4 h-4 shrink-0" aria-hidden="true" />
							{op.label}
						</button>
					);
				})}
			</div>

			{activeOperation && (
				<div className="bg-paper-2 border border-rule/30 rounded-lg p-4 space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-200">
					{activeOperation === "convert" && (
						<ConvertControls format={outputFormat} quality={quality} supportedFormats={supportedFormats} />
					)}
					{activeOperation === "compress" && (
						<CompressControls quality={quality} maxWidth={compressMaxWidth} hasAlpha={activeItem.hasAlpha} />
					)}
					{activeOperation === "bg-removal" && <BgRemovalInfo modelPreloadStatus={modelPreloadStatus} />}

					<div className="flex flex-col gap-2">
						{showMultiPreview ? (
							<button
								disabled={isBatchDisabled || !activeOperation}
								onClick={onBatchExecute}
								type="button"
								className="cursor-pointer w-full py-2.5 rounded-lg font-medium text-sm bg-accent text-accent-ink hover:brightness-110 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
							>
								{anyProcessing ? (
									<span className="flex items-center justify-center gap-2">
										<Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
										Processando...
									</span>
								) : activeOperation === "bg-removal" && isBgRemovalLoading ? (
									"Aguardando modelo de IA..."
								) : (
									`Aplicar nas selecionadas (${selectedIds.length})`
								)}
							</button>
						) : (
							<>
								<button
									disabled={isApplyDisabled}
									onClick={onExecute}
									type="button"
									className="cursor-pointer w-full py-2.5 rounded-lg font-medium text-sm bg-accent text-accent-ink hover:brightness-110 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
								>
									{anyProcessing ? (
										<span className="flex items-center justify-center gap-2">
											<Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
											Processando...
										</span>
									) : activeOperation === "bg-removal" && isBgRemovalLoading ? (
										"Aguardando modelo de IA..."
									) : (
										"Aplicar"
									)}
								</button>
								{selectedIds.length > 0 && (
									<button
										disabled={isBatchDisabled || !activeOperation}
										onClick={onBatchExecute}
										type="button"
										className="cursor-pointer w-full py-2.5 rounded-lg font-medium text-sm border border-rule/40 text-ink-2 hover:border-accent/40 hover:text-ink transition-all disabled:opacity-40 disabled:cursor-not-allowed"
									>
										Aplicar nas selecionadas ({selectedIds.length})
									</button>
								)}
							</>
						)}
					</div>
				</div>
			)}
		</div>
	);
}

function MultiPreview({ selectedItems, activeItemId }: { selectedItems: ImageItem[]; activeItemId: string }) {
	return (
		<>
			<div className="flex items-center justify-between gap-3 flex-wrap text-sm text-muted">
				<span className="font-medium text-ink">{selectedItems.length} imagens selecionadas</span>
			</div>

			<div className="relative bg-paper border border-rule/30 rounded-lg overflow-hidden">
				<div className="checkered-bg absolute inset-0" aria-hidden="true" />
				<ul className="relative grid grid-cols-1 lg:grid-cols-3 xl:grid-cols-4 gap-3 p-3">
					{selectedItems.map((item) => {
						const previewUrl = item.resultUrl ?? item.sourceUrl;
						return (
							<li key={item.id}>
								<button
									type="button"
									onClick={() => selectSolo(item.id)}
									className={`w-full flex flex-col gap-1.5 rounded-md border p-2 text-left cursor-pointer transition-colors ${
										activeItemId === item.id
											? "border-accent/50 bg-accent/10"
											: "border-rule/30 bg-black/10 hover:border-rule/50"
									}`}
								>
									<div className="relative aspect-square w-full overflow-hidden rounded bg-black/20">
										{previewUrl ? (
											<img src={previewUrl} alt={item.file.name} className="h-full w-full object-contain" />
										) : (
											<div className="flex h-full items-center justify-center text-sm text-muted">
												{item.error ?? "Indisponivel"}
											</div>
										)}
										{item.resultUrl && (
											<span className="absolute top-1.5 left-1.5 text-[10px] bg-black/50 text-white px-1.5 py-0.5 rounded">
												Resultado
											</span>
										)}
									</div>
								</button>
							</li>
						);
					})}
				</ul>
			</div>
		</>
	);
}

function SinglePreview({ item }: { item: ImageItem }) {
	return (
		<>
			<div className="flex items-center justify-between gap-3 flex-wrap text-sm text-muted">
				<span className="truncate font-medium text-ink">{item.file.name}</span>
				<div className="flex items-center gap-2">
					<span>{formatFileSize(item.file.size)}</span>
					{item.dimensions && (
						<>
							<span className="opacity-50" aria-hidden="true">
								|
							</span>
							<span>
								{item.dimensions.width}x{item.dimensions.height}
							</span>
						</>
					)}
				</div>
			</div>

			<div className="relative bg-paper border border-rule/30 rounded-lg overflow-hidden min-h-48">
				<div className="checkered-bg absolute inset-0" aria-hidden="true" />
				{item.resultUrl ? (
					<div className="relative flex flex-col lg:flex-row gap-2 p-2">
						<div className="relative flex-1 flex items-center justify-center bg-black/10 rounded-md overflow-hidden min-h-48 max-h-[50vh]">
							<img src={item.sourceUrl} alt="Imagem original" className="max-w-full max-h-[50vh] object-contain" />
							<span className="absolute top-2 left-2 text-[10px] bg-black/50 text-white px-1.5 py-0.5 rounded">
								Original
							</span>
						</div>
						<div className="relative flex-1 flex items-center justify-center bg-black/10 rounded-md overflow-hidden min-h-48 max-h-[50vh]">
							<img src={item.resultUrl} alt="Imagem processada" className="max-w-full max-h-[50vh] object-contain" />
							<span className="absolute top-2 left-2 text-[10px] bg-black/50 text-white px-1.5 py-0.5 rounded">
								Resultado
							</span>
						</div>
					</div>
				) : item.sourceUrl ? (
					<img
						src={item.sourceUrl}
						alt="Imagem original"
						className="relative max-w-full max-h-[50vh] object-contain mx-auto"
					/>
				) : (
					<p className="relative text-sm text-muted p-8 text-center">{item.error ?? "Imagem indisponivel"}</p>
				)}
			</div>
		</>
	);
}
