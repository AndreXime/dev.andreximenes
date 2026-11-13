import { useStore } from "@nanostores/react";
import { CloudBackup } from "lucide-react";
import { jobDescription$, updateJobDescription } from "../lib/store";

export function JobTab() {
	const jobDescription = useStore(jobDescription$);

	return (
		<div className="flex-1 flex flex-col p-5 animate-in fade-in slide-in-from-left-4 duration-200 h-full">
			<div className="flex justify-between items-center mb-2">
				<div className="inline-flex items-center gap-3 text-sm font-semibold text-slate-800 uppercase tracking-[0.12em]">
					Vaga <CloudBackup />
				</div>
			</div>
			<p className="text-sm text-slate-500 mb-3 text-justify">
				Cole aqui a descrição completa da vaga. Esses dados serão injetados automaticamente no Prompt da IA em conjunto
				com seu contexto.
			</p>
			<textarea
				className="flex-1 w-full p-4 border border-slate-300 rounded-md text-sm font-mono focus:ring-2 focus:ring-accent/40 focus:border-accent focus:outline-none resize-none leading-relaxed bg-white"
				placeholder="Cole aqui o texto da vaga..."
				value={jobDescription}
				onInput={(e) => updateJobDescription(e.currentTarget.value)}
			/>
		</div>
	);
}
