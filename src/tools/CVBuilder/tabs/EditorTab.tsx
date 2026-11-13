import { useStore } from "@nanostores/react";
import { CloudBackup, RotateCcw } from "lucide-react";
import { useLayoutEffect, useRef } from "react";
import { activeResume$, resetActiveResume, updateResumeContent } from "../lib/store";

export function EditorTab() {
	const activeResume = useStore(activeResume$);
	const textareaRef = useRef<HTMLTextAreaElement>(null);

	// Mantém o hack do useLayoutEffect para garantir atualização do textarea ao trocar de CV
	useLayoutEffect(() => {
		if (textareaRef.current && activeResume) {
			textareaRef.current.value = activeResume.data;
		}
	}, [activeResume]);

	return (
		<div className="flex-1 flex flex-col p-5 animate-in fade-in slide-in-from-left-4 duration-200 h-full">
			<div className="flex justify-between items-center mb-2 flex-wrap gap-3">
				<label
					htmlFor="cv-content"
					className="inline-flex items-center gap-3 text-sm font-semibold text-slate-800 uppercase tracking-[0.12em] truncate"
				>
					{activeResume?.name} <CloudBackup />
				</label>
				<button
					type="button"
					onClick={resetActiveResume}
					className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all bg-white border border-slate-300 text-slate-600 hover:bg-red-50 hover:text-red-600 hover:border-red-200 shadow-sm"
				>
					<RotateCcw size={14} />
					Resetar
				</button>
			</div>
			<p className="text-sm text-slate-500 mb-3 text-justify">
				Edite aqui a versão final do seu currículo. Você pode preencher tudo manualmente, mas o ideal é colar o texto
				gerado pela IA usando o prompt configurado na aba de Prompt.
			</p>
			<textarea
				ref={textareaRef}
				id="cv-content"
				name="cv-content"
				autoComplete="off"
				key={activeResume?.id}
				className="flex-1 w-full p-4 border border-slate-300 rounded-md text-sm font-mono focus:ring-2 focus:ring-accent/40 focus:border-accent focus:outline-none resize-none leading-relaxed bg-white"
				placeholder="Siga o exemplo padrão"
				defaultValue={activeResume?.data}
				onInput={(e) => updateResumeContent(e.currentTarget.value)}
			/>
		</div>
	);
}
