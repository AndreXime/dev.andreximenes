import { ArrowLeft } from "lucide-react";
import type { ReactNode, RefObject } from "react";

export function FieldLabel({ children, optional }: { readonly children: ReactNode; readonly optional?: boolean }) {
	return (
		<span className="text-[10px] font-medium uppercase tracking-[0.14em] text-muted/80">
			{children}
			{optional && <span className="normal-case font-normal text-muted/60"> (opcional)</span>}
		</span>
	);
}

interface FormPanelProps {
	selectedId: string | null;
	title: string;
	recipeContent: string;
	canSave: boolean;
	titleInputRef: RefObject<HTMLInputElement | null>;
	onTitleChange: (value: string) => void;
	onContentChange: (value: string) => void;
	onBack: () => void;
	onSave: () => void;
}

export function FormPanel({
	selectedId,
	title,
	recipeContent,
	canSave,
	titleInputRef,
	onTitleChange,
	onContentChange,
	onBack,
	onSave,
}: FormPanelProps) {
	return (
		<form
			className="flex flex-col gap-4"
			onSubmit={(e) => {
				e.preventDefault();
				onSave();
			}}
		>
			<div className="flex flex-wrap items-center gap-2">
				<button
					type="button"
					onClick={onBack}
					className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm text-muted hover:text-ink lg:hidden"
				>
					<ArrowLeft className="size-4" />
					Voltar
				</button>
				<h2 className="text-lg sm:text-xl font-semibold text-ink">{selectedId ? "Editar receita" : "Nova receita"}</h2>
			</div>

			<div className="rounded-card border border-rule bg-paper-2 p-4 sm:p-5 flex flex-col gap-4 shadow-lg shadow-black/10">
				<div className="flex flex-col gap-1.5">
					<label htmlFor="recipe-title">
						<FieldLabel optional>Título</FieldLabel>
					</label>
					<input
						ref={titleInputRef}
						id="recipe-title"
						value={title}
						onChange={(e) => onTitleChange(e.target.value)}
						placeholder="Bolo de cenoura, risoto…"
						className="w-full min-h-10 rounded-lg border border-rule bg-paper px-3 py-2 text-sm text-ink placeholder:text-muted/70 focus:outline-none focus:ring-2 focus:ring-accent"
					/>
				</div>

				<div className="flex flex-col gap-1.5">
					<label htmlFor="recipe-body">
						<FieldLabel>Receita</FieldLabel>
					</label>
					<textarea
						id="recipe-body"
						value={recipeContent}
						onChange={(e) => onContentChange(e.target.value)}
						rows={12}
						placeholder={
							"Ingredientes, modo de preparo, temperos, tempo no forno…\nEscreva como quiser, sem formato fixo."
						}
						className="w-full min-h-40 rounded-lg border border-rule bg-paper px-3 py-2.5 text-sm text-ink placeholder:text-muted/70 focus:outline-none focus:ring-2 focus:ring-accent resize-y leading-relaxed"
					/>
				</div>

				<button
					type="submit"
					disabled={!canSave}
					className={[
						"inline-flex w-full items-center justify-center gap-2 rounded-card px-4 py-2.5 text-sm font-semibold transition-[opacity,transform]",
						canSave
							? "bg-accent text-accent-ink hover:opacity-90 active:scale-[0.99]"
							: "bg-rule/40 text-muted/60 cursor-not-allowed",
					].join(" ")}
				>
					{selectedId ? "Salvar alterações" : "Salvar receita"}
				</button>
			</div>
		</form>
	);
}
