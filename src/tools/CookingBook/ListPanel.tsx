import { BookOpen, ChefHat, Plus, Search, X } from "lucide-react";
import {
	toolBtnPrimaryClass,
	toolEmptyPanelClass,
	toolInputClass,
	toolListItemActiveClass,
	toolListItemClass,
} from "@/lib/toolUi";
import type { Screen } from "./store";
import { displayTitle, type Recipe } from "./store";
import { formatDate } from "./utils";

function recipePreview(body: string, max = 120): string {
	const t = body.trim();
	if (t === "") return "Sem conteúdo";
	return t.length > max ? `${t.slice(0, max)}…` : t;
}

interface ListPanelProps {
	recipes: readonly Recipe[];
	filtered: readonly Recipe[];
	query: string;
	selectedId: string | null;
	screen: Screen;
	onQueryChange: (query: string) => void;
	onOpenNew: () => void;
	onOpenDetail: (id: string) => void;
}

export function ListPanel({
	recipes,
	filtered,
	query,
	selectedId,
	screen,
	onQueryChange,
	onOpenNew,
	onOpenDetail,
}: ListPanelProps) {
	return (
		<div className="flex flex-col gap-3 h-full">
			<div className="relative">
				<Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted/70" />
				<input
					value={query}
					onChange={(e) => onQueryChange(e.target.value)}
					placeholder="Buscar receitas…"
					className={`${toolInputClass} pl-10 pr-9`}
				/>
				{query && (
					<button
						type="button"
						onClick={() => onQueryChange("")}
						className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-md text-muted hover:text-ink"
						aria-label="Limpar busca"
					>
						<X className="size-3.5" />
					</button>
				)}
			</div>

			<button
				type="button"
				onClick={onOpenNew}
				className={`inline-flex w-full items-center justify-center gap-2 ${toolBtnPrimaryClass}`}
			>
				<Plus className="size-4" strokeWidth={2.5} />
				Nova receita
			</button>

			{filtered.length === 0 ? (
				recipes.length === 0 ? (
					<button
						type="button"
						onClick={onOpenNew}
						className={`${toolEmptyPanelClass} flex w-full flex-row items-center gap-md hover:border-accent-muted hover:bg-paper-2`}
					>
						<BookOpen className="size-10 shrink-0 text-muted/50" />
						<p className="text-left text-base leading-relaxed text-muted">
							Seu caderno está vazio. Toque para anotar a primeira receita.
						</p>
					</button>
				) : (
					<div className={toolEmptyPanelClass}>
						<p className="text-sm text-muted">Nenhum resultado para &quot;{query}&quot;</p>
					</div>
				)
			) : (
				<ul className="flex flex-col gap-2 list-none m-0 p-0 lg:overflow-y-auto lg:max-h-[calc(100dvh-16rem)] lg:pr-1">
					{filtered.map((recipe) => {
						const active = selectedId === recipe.id && screen !== "list";
						return (
							<li key={recipe.id}>
								<button
									type="button"
									onClick={() => onOpenDetail(recipe.id)}
									className={["overflow-hidden", toolListItemClass, active ? toolListItemActiveClass : ""].join(" ")}
								>
									<div className="flex gap-0 min-h-17">
										<div className="flex min-h-17 w-20 shrink-0 items-center justify-center bg-accent-bg text-accent/50 sm:w-24">
											<ChefHat className="size-6" />
										</div>
										<div className="flex flex-col justify-center gap-0.5 min-w-0 flex-1 p-3">
											<span className="text-sm font-semibold text-ink truncate">{displayTitle(recipe)}</span>
											<span className="text-[10px] text-muted/75">{formatDate(recipe.updatedAt)}</span>
											<span className="text-xs text-muted/65 line-clamp-2 leading-snug">
												{recipePreview(recipe.body, 80)}
											</span>
										</div>
									</div>
								</button>
							</li>
						);
					})}
				</ul>
			)}
		</div>
	);
}
