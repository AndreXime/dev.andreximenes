import { useStore } from "@nanostores/react";
import { ChefHat } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ToolShell } from "../ToolShell";
import { DetailPanel } from "./DetailPanel";
import { FormPanel } from "./FormPanel";
import { ListPanel } from "./ListPanel";
import type { Screen } from "./store";
import {
	cookingBook$,
	cookingBookStorage,
	displayTitle,
	duplicateRecipe,
	type Recipe,
	removeRecipe,
	saveRecipe,
} from "./store";

export default function CookingBook() {
	const { recipes } = useStore(cookingBook$);
	const [screen, setScreen] = useState<Screen>("list");
	const [selectedId, setSelectedId] = useState<string | null>(null);
	const [query, setQuery] = useState("");
	const [toast, setToast] = useState<string | null>(null);

	const [title, setTitle] = useState("");
	const [recipeContent, setRecipeContent] = useState("");
	const [formDirty, setFormDirty] = useState(false);

	const titleInputRef = useRef<HTMLInputElement>(null);

	useEffect(() => {
		if (!toast) return;
		const t = setTimeout(() => setToast(null), 2800);
		return () => clearTimeout(t);
	}, [toast]);

	useEffect(() => {
		if (screen === "form" && !selectedId) {
			titleInputRef.current?.focus();
		}
	}, [screen, selectedId]);

	const selected = useMemo(
		() => (selectedId ? recipes.find((r) => r.id === selectedId) : undefined),
		[recipes, selectedId],
	);

	const filtered = useMemo(() => {
		const q = query.trim().toLowerCase();
		const base =
			q === ""
				? recipes
				: recipes.filter((r) => {
						const label = displayTitle(r).toLowerCase();
						return label.includes(q) || r.body.toLowerCase().includes(q) || r.title.toLowerCase().includes(q);
					});
		return [...base].sort((a, b) => b.updatedAt - a.updatedAt);
	}, [recipes, query]);

	const canSave = title.trim() !== "" || recipeContent.trim() !== "";

	const notify = useCallback((msg: string) => setToast(msg), []);

	function markDirty() {
		setFormDirty(true);
	}

	function openNew() {
		setSelectedId(null);
		setTitle("");
		setRecipeContent("");
		setFormDirty(false);
		setScreen("form");
	}

	function openEdit(recipe: Recipe) {
		setSelectedId(recipe.id);
		setTitle(recipe.title);
		setRecipeContent(recipe.body);
		setFormDirty(false);
		setScreen("form");
	}

	function openDetail(id: string) {
		setSelectedId(id);
		setScreen("detail");
	}

	function backToList() {
		if (screen === "form" && formDirty) {
			const ok = globalThis.confirm("Descartar alterações não salvas?");
			if (!ok) return;
		}
		setScreen("list");
		setSelectedId(null);
		setFormDirty(false);
	}

	function leaveForm(target: Screen) {
		if (formDirty) {
			const ok = globalThis.confirm("Descartar alterações não salvas?");
			if (!ok) return;
		}
		setFormDirty(false);
		setScreen(target);
	}

	function handleSave() {
		if (!canSave) return;
		const id = saveRecipe({
			...(selectedId ? { id: selectedId } : {}),
			title,
			body: recipeContent,
		});
		if (id === "") return;
		setSelectedId(id);
		setFormDirty(false);
		setScreen("detail");
		notify(selectedId ? "Receita atualizada" : "Receita salva");
	}

	function handleDelete(recipe: Recipe) {
		const ok = globalThis.confirm(`Remover "${displayTitle(recipe)}"?`);
		if (!ok) return;
		removeRecipe(recipe.id);
		backToList();
		notify("Receita removida");
	}

	function handleDuplicate(recipe: Recipe) {
		const newId = duplicateRecipe(recipe.id);
		if (newId === "") return;
		setSelectedId(newId);
		setScreen("detail");
		notify("Receita duplicada");
	}

	async function handleCopy(recipe: Recipe) {
		const text = [displayTitle(recipe), "", recipe.body.trim()].filter(Boolean).join("\n");
		try {
			await navigator.clipboard.writeText(text);
			notify("Copiado para a área de transferência");
		} catch {
			notify("Não foi possível copiar");
		}
	}

	const mainPanel =
		selected && screen === "detail" ? (
			<DetailPanel
				recipe={selected}
				onBack={backToList}
				onCopy={handleCopy}
				onDuplicate={handleDuplicate}
				onEdit={openEdit}
				onDelete={handleDelete}
			/>
		) : screen === "form" ? (
			<FormPanel
				selectedId={selectedId}
				title={title}
				recipeContent={recipeContent}
				canSave={canSave}
				titleInputRef={titleInputRef}
				onTitleChange={(value) => {
					setTitle(value);
					markDirty();
				}}
				onContentChange={(value) => {
					setRecipeContent(value);
					markDirty();
				}}
				onBack={() => (selectedId && selected ? leaveForm("detail") : backToList())}
				onSave={handleSave}
			/>
		) : screen === "list" ? (
			<div className="hidden min-h-80 w-full flex-col items-center justify-center gap-md rounded-card border border-dashed border-rule bg-paper-2/30 p-12 lg:flex">
				<ChefHat className="size-14 shrink-0 text-accent/45" strokeWidth={1.5} />
				<p className="text-left text-base leading-relaxed text-muted">
					{recipes.length === 0
						? "Comece criando sua primeira receita."
						: "Selecione uma receita na lista ou crie uma nova."}
				</p>
			</div>
		) : null;

	return (
		<div className="min-h-full w-full">
			{toast && (
				<output
					aria-live="polite"
					className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 block px-4 py-2 rounded-full text-sm font-medium bg-paper-2 border border-accent/40 text-ink shadow-sm"
				>
					{toast}
				</output>
			)}

			<ToolShell
				title="Livro de receitas"
				description="Caderno pessoal no navegador. Texto livre, compartilhe por link."
				icon={<ChefHat className="size-6" strokeWidth={2} />}
				storage={cookingBookStorage}
			>
				<div className="flex flex-col lg:flex-row lg:gap-8 lg:items-start">
					<aside
						className={[
							"w-full lg:w-[min(100%,22rem)] lg:shrink-0 lg:sticky lg:top-6",
							screen === "list" ? "block" : "hidden lg:block",
						].join(" ")}
					>
						<ListPanel
							recipes={recipes}
							filtered={filtered}
							query={query}
							selectedId={selectedId}
							screen={screen}
							onQueryChange={setQuery}
							onOpenNew={openNew}
							onOpenDetail={openDetail}
						/>
					</aside>

					<section
						className={["flex-1 min-w-0 mt-4 lg:mt-0", screen === "list" ? "hidden lg:block" : "block"].join(" ")}
					>
						{mainPanel}
					</section>
				</div>
			</ToolShell>
		</div>
	);
}
