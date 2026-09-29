import "./styles.css";
import { BookOpen, Briefcase, Database, Download, Eye, FileSearch, FileText, Loader2, User } from "lucide-react";
import type React from "react";
import { useCallback, useEffect, useState } from "react";

import { ToolShell } from "../ToolShell";
import { cvBuilderStorage, downloadResumePdf, type PdfDownloadPhase } from "./lib/store";
import ResumeContent from "./Page";
import { ContextTab } from "./tabs/ContextTab";
import { EditorTab } from "./tabs/EditorTab";
import { JobTab } from "./tabs/JobTab";
import { PromptTab } from "./tabs/PromptTab";
import { SavedResumesTab } from "./tabs/SavedResumesTab";

type TabId = 1 | 2 | 3 | 4 | 5 | 6;

type ToastTone = "ok" | "error";

interface ToastState {
	message: string;
	tone: ToastTone;
}

const TABS: { id: TabId; label: string; icon: React.ReactNode }[] = [
	{ id: 1, label: "Dados pessoais", icon: <BookOpen size={16} /> },
	{ id: 2, label: "Vaga", icon: <FileSearch size={16} /> },
	{ id: 3, label: "Prompt IA", icon: <Briefcase size={16} /> },
	{ id: 4, label: "Editor", icon: <User size={16} /> },
	{ id: 6, label: "Preview", icon: <Eye size={16} /> },
	{ id: 5, label: "Salvos", icon: <Database size={16} /> },
];

const PHASE_LABEL: Record<PdfDownloadPhase, string> = {
	sending: "Enviando currículo…",
	generating: "Gerando PDF…",
	downloading: "Preparando download…",
};

export default function CVBuilderApp() {
	const [activeTab, setActiveTab] = useState<TabId>(1);
	const [pdfPhase, setPdfPhase] = useState<PdfDownloadPhase | null>(null);
	const [pdfError, setPdfError] = useState<string | null>(null);
	const [toast, setToast] = useState<ToastState | null>(null);

	useEffect(() => {
		if (!toast) return;
		const t = setTimeout(() => setToast(null), 3200);
		return () => clearTimeout(t);
	}, [toast]);

	const notify = useCallback((message: string, tone: ToastTone) => {
		setToast({ message, tone });
	}, []);

	async function handleDownloadPdf() {
		if (pdfPhase) return;
		setPdfError(null);
		setPdfPhase("sending");
		try {
			await downloadResumePdf((phase) => setPdfPhase(phase));
			notify("PDF baixado com sucesso.", "ok");
		} catch (error) {
			const message = error instanceof Error ? error.message : "Falha ao gerar o PDF. Tente novamente.";
			setPdfError(message);
			notify(message, "error");
		} finally {
			setPdfPhase(null);
		}
	}

	const busy = pdfPhase !== null;
	const statusLabel = pdfPhase ? PHASE_LABEL[pdfPhase] : null;

	return (
		<div className="cv-builder min-h-full w-full">
			{toast && (
				<output
					aria-live={toast.tone === "error" ? "assertive" : "polite"}
					className={[
						"fixed bottom-6 left-1/2 z-50 block -translate-x-1/2 rounded-full px-4 py-2 text-sm font-medium shadow-sm",
						toast.tone === "error"
							? "border border-accent/50 bg-accent-bg text-accent"
							: "border border-accent/40 bg-paper-2 text-ink",
					].join(" ")}
				>
					{toast.message}
				</output>
			)}

			<ToolShell
				title="Gerador de CV"
				description="Monte currículos em Markdown, gere prompts para IA e exporte em PDF."
				icon={<FileText className="size-6" strokeWidth={2} />}
				storage={cvBuilderStorage}
				actions={
					<div className="flex flex-wrap items-center gap-2">
						<button
							type="button"
							onClick={handleDownloadPdf}
							disabled={busy}
							aria-busy={busy}
							className="inline-flex items-center justify-center gap-2 rounded-card px-4 py-2.5 text-sm font-semibold bg-accent text-accent-ink hover:opacity-90 active:scale-[0.99] transition-[opacity,transform] focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-paper shrink-0 disabled:opacity-60 disabled:pointer-events-none"
							title="Gerar PDF no servidor"
						>
							{busy && pdfPhase ? (
								<Loader2 size={16} className="animate-spin" aria-hidden="true" />
							) : (
								<Download size={16} aria-hidden="true" />
							)}
							<span>{busy && pdfPhase ? PHASE_LABEL[pdfPhase] : "Baixar PDF"}</span>
						</button>
						<div className="sr-only" aria-live="polite" aria-atomic="true">
							{statusLabel}
						</div>
						{pdfError && (
							<p className="m-0 max-w-80 text-xs leading-snug text-accent" role="alert" aria-live="assertive">
								{pdfError}
							</p>
						)}
					</div>
				}
			>
				<div className="flex flex-col flex-1 min-h-0 -mt-1">
					<nav className="flex gap-1 overflow-x-auto pb-px" aria-label="Abas do gerador">
						{TABS.map((tab) => {
							const isActive = activeTab === tab.id;
							return (
								<button
									key={tab.id}
									type="button"
									onClick={() => setActiveTab(tab.id)}
									className={[
										"flex shrink-0 items-center justify-center gap-2 rounded-t-card border border-b-0 px-3 py-2.5 text-xs font-semibold uppercase tracking-wider transition-all",
										isActive
											? "border-accent-muted bg-paper text-ink"
											: "border-rule bg-paper-2 text-muted hover:border-accent-muted hover:text-ink",
									].join(" ")}
								>
									{tab.icon}
									<span className="truncate hidden sm:inline">{tab.label}</span>
								</button>
							);
						})}
					</nav>
					{activeTab === 6 ? (
						<div className="flex-1 w-full overflow-x-auto pt-4">
							<div className="flex justify-center">
								<div className="origin-top scale-[0.45] sm:scale-75 lg:scale-100 transition-transform duration-300 shadow-2xl bg-white inline-block">
									<ResumeContent />
								</div>
							</div>
						</div>
					) : (
						<div className="pointer-events-auto relative -mt-px flex min-h-100 flex-1 flex-col overflow-hidden rounded-b-card rounded-tr-card border border-rule bg-paper-2">
							{activeTab === 1 && <ContextTab />}
							{activeTab === 2 && <JobTab />}
							{activeTab === 3 && <PromptTab />}
							{activeTab === 4 && <EditorTab />}
							{activeTab === 5 && <SavedResumesTab />}
						</div>
					)}
				</div>
			</ToolShell>
		</div>
	);
}
