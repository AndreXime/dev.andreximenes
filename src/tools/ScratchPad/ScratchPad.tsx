import { useStore } from "@nanostores/react";
import { StickyNote } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ToolShell } from "../ToolShell";
import { ListPanel } from "./ListPanel";
import { NotePanel } from "./NotePanel";
import { createNote, displayTitle, type Screen, scratchPad$, scratchPadStorage } from "./store";

export default function ScratchPad() {
	const { notes } = useStore(scratchPad$);
	const [screen, setScreen] = useState<Screen>("list");
	const [selectedId, setSelectedId] = useState<string | null>(null);
	const [query, setQuery] = useState("");
	const [preview, setPreview] = useState(false);
	const [toast, setToast] = useState<string | null>(null);

	useEffect(() => {
		if (!toast) return;
		const t = setTimeout(() => setToast(null), 2800);
		return () => clearTimeout(t);
	}, [toast]);

	useEffect(() => {
		if (selectedId && !notes.some((n) => n.id === selectedId)) {
			setSelectedId(null);
			setScreen("list");
		}
	}, [notes, selectedId]);

	const selected = useMemo(
		() => (selectedId ? notes.find((n) => n.id === selectedId) : undefined),
		[notes, selectedId],
	);

	const filtered = useMemo(() => {
		const q = query.trim().toLowerCase();
		const base =
			q === ""
				? notes
				: notes.filter((n) => {
						const label = displayTitle(n).toLowerCase();
						return label.includes(q) || n.body.toLowerCase().includes(q) || n.title.toLowerCase().includes(q);
					});
		return [...base];
	}, [notes, query]);

	const notify = useCallback((msg: string) => setToast(msg), []);

	function backToList() {
		setScreen("list");
		setSelectedId(null);
		setPreview(false);
	}

	function handleCreate() {
		const id = createNote();
		setSelectedId(id);
		setPreview(false);
		setScreen("note");
	}

	function handleSelect(id: string) {
		setSelectedId(id);
		setPreview(false);
		setScreen("note");
	}

	async function handleCopy() {
		if (!selected) return;
		const text = [displayTitle(selected), "", selected.body.trim()].filter(Boolean).join("\n");
		try {
			await navigator.clipboard.writeText(text);
			notify("Copiado para a área de transferência");
		} catch {
			notify("Não foi possível copiar");
		}
	}

	const mainPanel =
		selected && screen === "note" ? (
			<NotePanel
				key={selected.id}
				note={selected}
				preview={preview}
				onPreviewChange={setPreview}
				onBack={backToList}
				onDelete={backToList}
				onCopy={handleCopy}
			/>
		) : screen === "list" ? (
			<div className="hidden min-h-80 w-full flex-col items-center justify-center gap-md rounded-card border border-dashed border-rule bg-paper-2/30 p-12 lg:flex">
				<StickyNote className="size-14 shrink-0 text-accent/45" strokeWidth={1.5} />
				<p className="text-left text-base leading-relaxed text-muted">
					{notes.length === 0 ? "Comece criando sua primeira nota." : "Selecione uma nota na lista ou crie uma nova."}
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
				title="Bloco de Notas"
				description="Notas locais no navegador, com busca, pin e preview em Markdown."
				icon={<StickyNote className="size-6" strokeWidth={2} />}
				storage={scratchPadStorage}
			>
				<div className="flex flex-col lg:flex-row lg:gap-8 lg:items-start">
					<aside
						className={[
							"w-full lg:w-[min(100%,22rem)] lg:shrink-0 lg:sticky lg:top-6",
							screen === "list" ? "block" : "hidden lg:block",
						].join(" ")}
					>
						<ListPanel
							notes={notes}
							filtered={filtered}
							query={query}
							selectedId={selectedId}
							screen={screen}
							onQueryChange={setQuery}
							onCreate={handleCreate}
							onSelect={handleSelect}
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
