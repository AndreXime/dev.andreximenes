import { useStore } from "@nanostores/react";
import { CloudBackup } from "lucide-react";
import { useLayoutEffect, useRef } from "react";
import { masterProfile$, updateMasterProfile } from "../lib/store";

export function ContextTab() {
	const masterProfile = useStore(masterProfile$);
	const textareaRef = useRef<HTMLTextAreaElement>(null);

	useLayoutEffect(() => {
		if (textareaRef.current && masterProfile) {
			textareaRef.current.value = masterProfile;
		}
	}, [masterProfile]);

	return (
		<div className="flex-1 flex flex-col p-5 animate-in fade-in slide-in-from-left-4 duration-200 h-full">
			<div className="flex justify-between items-center mb-2">
				<div className="inline-flex items-center gap-3 text-sm font-semibold text-slate-800 uppercase tracking-[0.12em]">
					Seus Dados
					<CloudBackup />
				</div>
			</div>
			<p className="text-sm text-slate-500 mb-3 text-justify">
				Cole aqui toda sua trajetória, projetos detalhados e qualquer informação relevante. Estes dados serão injetados
				automaticamente no Prompt da IA.
			</p>
			<textarea
				ref={textareaRef}
				className="flex-1 w-full p-4 border border-slate-300 rounded-md text-sm font-mono focus:ring-2 focus:ring-accent/40 focus:border-accent focus:outline-none resize-none leading-relaxed bg-white"
				placeholder="Cole aqui seu arquivo 'About Me'..."
				value={masterProfile}
				onInput={(e) => updateMasterProfile(e.currentTarget.value)}
			/>
		</div>
	);
}
