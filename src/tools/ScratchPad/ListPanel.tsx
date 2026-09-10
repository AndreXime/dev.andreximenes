import { Pin, Plus, Search, StickyNote, X } from "lucide-react";
import {
	toolBtnPrimaryClass,
	toolEmptyPanelClass,
	toolInputClass,
	toolListItemActiveClass,
	toolListItemClass,
} from "@/lib/toolUi";
import { displayTitle, type Note, type Screen } from "./store";
import { formatDate } from "./utils";

function notePreview(body: string, max = 100): string {
	const t = body.trim();
	if (t === "") return "Nota vazia";
	return t.length > max ? `${t.slice(0, max)}…` : t;
}

interface ListPanelProps {
	notes: readonly Note[];
	filtered: readonly Note[];
	query: string;
	selectedId: string | null;
	screen: Screen;
	onQueryChange: (query: string) => void;
	onCreate: () => void;
	onSelect: (id: string) => void;
}

export function ListPanel({
	notes,
	filtered,
	query,
	selectedId,
	screen,
	onQueryChange,
	onCreate,
	onSelect,
}: ListPanelProps) {
	return (
		<div className="flex flex-col gap-3 h-full">
			<div className="relative">
				<Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted/70" />
				<input
					value={query}
					onChange={(e) => onQueryChange(e.target.value)}
					placeholder="Buscar notas…"
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
				onClick={onCreate}
				className={`inline-flex w-full items-center justify-center gap-2 ${toolBtnPrimaryClass}`}
			>
				<Plus className="size-4" strokeWidth={2.5} />
				Nova nota
			</button>

			{filtered.length === 0 ? (
				notes.length === 0 ? (
					<button
						type="button"
						onClick={onCreate}
						className={`${toolEmptyPanelClass} flex w-full flex-row items-center gap-md hover:border-accent-muted hover:bg-paper-2`}
					>
						<StickyNote className="size-10 shrink-0 text-muted/50" />
						<p className="text-left text-base leading-relaxed text-muted">
							Nenhuma nota ainda. Toque para começar a escrever.
						</p>
					</button>
				) : (
					<div className={toolEmptyPanelClass}>
						<p className="text-sm text-muted">Nenhum resultado para &quot;{query}&quot;</p>
					</div>
				)
			) : (
				<ul className="flex flex-col gap-2 list-none m-0 p-0 lg:overflow-y-auto lg:max-h-[calc(100dvh-16rem)] lg:pr-1">
					{filtered.map((note) => {
						const active = selectedId === note.id && screen !== "list";
						return (
							<li key={note.id}>
								<button
									type="button"
									onClick={() => onSelect(note.id)}
									className={["overflow-hidden", toolListItemClass, active ? toolListItemActiveClass : ""].join(" ")}
								>
									<div className="flex gap-0 min-h-17">
										<div className="relative flex min-h-17 w-20 shrink-0 items-center justify-center bg-accent-bg text-accent/50 sm:w-24">
											<StickyNote className="size-6" />
											{note.pinned && <Pin className="absolute right-1.5 top-1.5 size-3 text-accent fill-accent" />}
										</div>
										<div className="flex flex-col justify-center gap-0.5 min-w-0 flex-1 p-3">
											<span className="text-sm font-semibold text-ink truncate">{displayTitle(note)}</span>
											<span className="text-[10px] text-muted/75">{formatDate(note.updatedAt)}</span>
											<span className="text-xs text-muted/65 line-clamp-2 leading-snug">
												{notePreview(note.body, 80)}
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
