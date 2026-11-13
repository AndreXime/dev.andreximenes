import { useStore } from "@nanostores/react";
import { FileText, Plus, Trash2 } from "lucide-react";
import { createNewResume, deleteResume, resumes$, setActiveResume } from "../lib/store";

export function SavedResumesTab() {
	const resumes = useStore(resumes$);

	return (
		<div className="p-5 flex flex-col gap-4 animate-in fade-in slide-in-from-right-4 duration-200 h-full overflow-y-auto">
			<div className="flex justify-between items-center">
				<h3 className="text-sm font-semibold text-slate-800 uppercase tracking-[0.12em]">Seus Documentos</h3>
				<button
					type="button"
					onClick={createNewResume}
					className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-semibold bg-slate-800 text-white hover:bg-slate-900 shadow-sm"
				>
					<Plus size={14} /> Novo CV
				</button>
			</div>

			<div className="grid gap-3 content-start">
				{resumes.map((resume) => (
					<div
						key={resume.id}
						onClick={() => setActiveResume(resume.id)}
						className={`flex items-center justify-between p-4 rounded-lg border cursor-pointer transition-all ${
							resume.selected
								? "bg-accent-bg border-accent/70 shadow-md ring-1 ring-accent/30"
								: "bg-white border-slate-200 hover:border-slate-300 hover:shadow-sm"
						}`}
					>
						<div className="flex items-center gap-3 overflow-hidden">
							<div
								className={`p-2 rounded-full ${
									resume.selected ? "bg-accent-bg text-accent" : "bg-slate-100 text-slate-500"
								}`}
							>
								<FileText size={18} />
							</div>
							<div className="flex flex-col truncate">
								<span className={`text-sm font-bold truncate ${resume.selected ? "text-slate-900" : "text-slate-700"}`}>
									{resume.name}
								</span>
								<span className="text-xs text-slate-400">
									{resume.selected ? "Editando agora" : "Clique para editar"}
								</span>
							</div>
						</div>

						<button
							type="button"
							onClick={(e) => {
								e.stopPropagation();
								deleteResume(resume.id);
							}}
							className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-100 rounded transition-colors"
							title="Deletar"
						>
							<Trash2 size={16} />
						</button>
					</div>
				))}
			</div>
		</div>
	);
}
