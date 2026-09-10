import { ArrowLeft, Copy, Files, Pencil, Trash2 } from "lucide-react";
import { displayTitle, type Recipe } from "./store";
import { formatDate } from "./utils";

function RecipeBody({ body }: { readonly body: string }) {
	return (
		<pre className="whitespace-pre-wrap font-sans text-sm sm:text-[15px] leading-[1.7] text-ink-2 m-0">{body}</pre>
	);
}

interface DetailPanelProps {
	recipe: Recipe;
	onBack: () => void;
	onCopy: (recipe: Recipe) => void;
	onDuplicate: (recipe: Recipe) => void;
	onEdit: (recipe: Recipe) => void;
	onDelete: (recipe: Recipe) => void;
}

export function DetailPanel({ recipe, onBack, onCopy, onDuplicate, onEdit, onDelete }: DetailPanelProps) {
	return (
		<article className="flex flex-col gap-4">
			<div className="flex flex-wrap items-center gap-2">
				<button
					type="button"
					onClick={onBack}
					className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm text-muted hover:text-ink hover:bg-accent/10 lg:hidden"
				>
					<ArrowLeft className="size-4" />
					Voltar
				</button>
				<div className="flex-1 min-w-32" />
				<button
					type="button"
					onClick={() => onCopy(recipe)}
					className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm text-muted border border-rule hover:border-accent/50 hover:text-ink"
				>
					<Copy className="size-3.5" />
					Copiar
				</button>
				<button
					type="button"
					onClick={() => onDuplicate(recipe)}
					className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm text-muted border border-rule hover:border-accent/50 hover:text-ink"
				>
					<Files className="size-3.5" />
					Duplicar
				</button>
				<button
					type="button"
					onClick={() => onEdit(recipe)}
					className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium text-ink border border-rule hover:border-accent/50"
				>
					<Pencil className="size-4" />
					Editar
				</button>
				<button
					type="button"
					onClick={() => onDelete(recipe)}
					className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm text-muted hover:text-red-300 hover:bg-red-500/10"
				>
					<Trash2 className="size-4" />
				</button>
			</div>

			<div className="rounded-card border border-rule bg-paper-2 overflow-hidden shadow-sm">
				<div className="p-4 sm:p-6 flex flex-col gap-3">
					<h2 className="text-2xl sm:text-3xl font-bold text-ink tracking-tight leading-tight">
						{displayTitle(recipe)}
					</h2>
					<p className="text-xs text-muted/80">
						Atualizado em {formatDate(recipe.updatedAt)}
						{recipe.createdAt !== recipe.updatedAt && (
							<span className="text-muted/55"> · Criado em {formatDate(recipe.createdAt)}</span>
						)}
					</p>
					<div className="h-px bg-linear-to-r from-transparent via-rule to-transparent" />
					<RecipeBody body={recipe.body} />
				</div>
			</div>
		</article>
	);
}
