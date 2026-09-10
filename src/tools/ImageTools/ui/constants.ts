import { FileOutput, Scissors, SlidersHorizontal, type Upload } from "lucide-react";
import type { ImageItemStatus, OperationType, OutputFormat } from "../domain";

export const OPERATIONS: { id: OperationType; label: string; icon: typeof Upload }[] = [
	{ id: "convert", label: "Converter", icon: FileOutput },
	{ id: "compress", label: "Comprimir", icon: SlidersHorizontal },
	{ id: "bg-removal", label: "Remover Fundo", icon: Scissors },
];

export const CONVERT_FORMATS: OutputFormat[] = ["png", "jpeg", "webp", "avif"];

export const PROGRESS_BAR_CLASS =
	"block w-full h-1.5 appearance-none overflow-hidden rounded-full bg-paper [&::-webkit-progress-bar]:rounded-full [&::-webkit-progress-bar]:bg-paper [&::-webkit-progress-value]:rounded-full [&::-webkit-progress-value]:bg-accent transition-all duration-300 [&::-moz-progress-bar]:rounded-full [&::-moz-progress-bar]:bg-accent";

export const PRELOAD_PROGRESS_BAR_CLASS =
	"block w-full h-1 appearance-none overflow-hidden rounded-full bg-rule/30 [&::-webkit-progress-bar]:rounded-full [&::-webkit-progress-bar]:bg-rule/30 [&::-webkit-progress-value]:rounded-full [&::-webkit-progress-value]:bg-accent/70 [&::-moz-progress-bar]:rounded-full [&::-moz-progress-bar]:bg-accent/70";

export const STATUS_LABEL: Record<ImageItemStatus, string> = {
	loading: "Carregando",
	ready: "Pronta",
	processing: "Processando",
	done: "Concluida",
	error: "Erro",
};
