import { computed } from "nanostores";
import { createJsonPersistentAtom } from "@/lib/toolStorage/persistentAtom";
import type { ToolStorageEntry } from "@/lib/toolStorage/types";
import defaultCV from "../markdown/cvExample.md?raw";
import { parseResumeMarkdown } from "./parserMd";

export interface Resume {
	id: string;
	name: string;
	data: string;
	selected: boolean;
}

const CV_BUILDER_RESUMES_KEY = "resume_list";
const CV_BUILDER_PROFILE_KEY = "resume_profile";
const CV_BUILDER_JOB_KEY = "resume_job_description";

const defaultState: Resume[] = [
	{
		id: "default",
		name: "Currículo Padrão",
		data: defaultCV,
		selected: true,
	},
];

function normalizeResumes(raw: unknown): Resume[] {
	if (!Array.isArray(raw)) return defaultState;

	let parsed = raw as Resume[];
	if (parsed.length === 0) return defaultState;

	let selectedIndex = parsed.findIndex((r) => r.selected);
	if (selectedIndex === -1) selectedIndex = 0;

	parsed = parsed.map((r, index) => ({ ...r, selected: index === selectedIndex }));
	return parsed;
}

function normalizeStoredString(raw: unknown): string {
	return typeof raw === "string" ? raw : "";
}

export const resumes$ = createJsonPersistentAtom<Resume[]>({
	storageKey: CV_BUILDER_RESUMES_KEY,
	defaultValue: defaultState,
	normalize: normalizeResumes,
});

export const masterProfile$ = createJsonPersistentAtom<string>({
	storageKey: CV_BUILDER_PROFILE_KEY,
	defaultValue: "",
	normalize: normalizeStoredString,
});

export const jobDescription$ = createJsonPersistentAtom<string>({
	storageKey: CV_BUILDER_JOB_KEY,
	defaultValue: "",
	normalize: normalizeStoredString,
});

export const cvBuilderStorage: ToolStorageEntry = {
	toolId: "cv_builder",
	keys: [CV_BUILDER_RESUMES_KEY, CV_BUILDER_PROFILE_KEY, CV_BUILDER_JOB_KEY],
	atoms: {
		[CV_BUILDER_RESUMES_KEY]: resumes$,
		[CV_BUILDER_PROFILE_KEY]: masterProfile$,
		[CV_BUILDER_JOB_KEY]: jobDescription$,
	},
};

// --- Computed Values ---

export function updateMasterProfile(content: string) {
	masterProfile$.set(content);
}

export function updateJobDescription(content: string) {
	jobDescription$.set(content);
}

// Encontra o currículo onde selected === true
export const activeResume$ = computed(resumes$, (resumes: Resume[]) => {
	return resumes.find((r) => r.selected) || defaultState[0];
});

export const parsedContent$ = computed(activeResume$, (resume) => {
	if (!resume) return null;
	try {
		return parseResumeMarkdown(resume.data);
	} catch (e) {
		console.error("Erro ao parsear markdown", e);
		return null;
	}
});

// --- Actions ---

export function updateResumeContent(content: string) {
	const list = resumes$.get();

	// Atualiza o conteúdo APENAS do currículo selecionado
	const updatedList = list.map((r: Resume) => (r.selected ? { ...r, data: content } : r));

	resumes$.set(updatedList);
}

export function createNewResume() {
	const name = prompt("Nome do novo currículo:");
	if (!name) return;

	const newList = resumes$.get().map((r: Resume) => ({ ...r, selected: false })); // Desmarca todos

	const newResume: Resume = {
		id: crypto.randomUUID(),
		name,
		data: defaultCV,
		selected: true, // O novo nasce selecionado
	};

	const finalList = [...newList, newResume];

	resumes$.set(finalList);
}

export function deleteResume(id: string) {
	const list = resumes$.get();
	if (list.length <= 1) {
		alert("Você precisa manter pelo menos um currículo.");
		return;
	}

	if (!confirm("Tem certeza que deseja deletar este currículo?")) return;

	// Se estamos deletando o selecionado, precisamos passar a coroa para outro
	const isDeletingSelected = list.find((r: Resume) => r.id === id)?.selected;

	const newList = list.filter((r: Resume) => r.id !== id);

	if (isDeletingSelected) {
		const first = newList.at(0);
		if (first) {
			newList[0] = { ...first, selected: true };
		}
	}

	resumes$.set(newList);
}

export function setActiveResume(id: string) {
	const list = resumes$.get();

	// Percorre a lista: se o ID bater, selected=true, senão selected=false
	const updatedList = list.map((r: Resume) => ({
		...r,
		selected: r.id === id,
	}));

	resumes$.set(updatedList);
}

export function resetActiveResume() {
	if (confirm("Deseja voltar ao modelo padrão? Isso apagará suas alterações atuais neste currículo.")) {
		updateResumeContent(defaultCV);
	}
}

export type PdfDownloadPhase = "sending" | "generating" | "downloading";

function httpErrorMessage(status: number, serverMessage: string | null): string {
	if (serverMessage) return serverMessage;

	switch (status) {
		case 429:
			return "Limite de geração atingido. Aguarde alguns minutos e tente de novo.";
		case 503:
			return "O servidor está ocupado gerando outro PDF. Tente de novo em instantes.";
		case 413:
			return "O currículo é grande demais para exportar.";
		case 400:
		case 415:
			return "Não foi possível processar o currículo. Confira o conteúdo e tente de novo.";
		default:
			return "Falha ao gerar o PDF. Tente novamente.";
	}
}

function mapDownloadFailure(error: unknown): Error {
	if (error instanceof TypeError) {
		return new Error("Não foi possível conectar ao servidor. Verifique sua conexão e tente de novo.");
	}
	if (error instanceof Error) return error;
	return new Error("Falha ao gerar o PDF. Tente novamente.");
}

export async function downloadResumePdf(onPhase?: (phase: PdfDownloadPhase) => void): Promise<void> {
	const resume = activeResume$.get();
	if (!resume?.data?.trim()) {
		throw new Error("Nenhum currículo para exportar. Abra o editor e preencha o conteúdo.");
	}

	onPhase?.("sending");

	let response: Response;
	try {
		onPhase?.("generating");
		response = await fetch("/api/cv-pdf", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ markdown: resume.data }),
		});
	} catch (error) {
		throw mapDownloadFailure(error);
	}

	if (!response.ok) {
		let serverMessage: string | null = null;
		try {
			const payload: unknown = await response.json();
			if (typeof payload === "object" && payload !== null && "error" in payload && typeof payload.error === "string") {
				serverMessage = payload.error;
			}
		} catch {
			// usa fallback por status
		}
		throw new Error(httpErrorMessage(response.status, serverMessage));
	}

	onPhase?.("downloading");

	const blob = await response.blob();
	if (blob.size === 0) {
		throw new Error("O servidor devolveu um PDF vazio. Tente gerar de novo.");
	}

	const parsed = parsedContent$.get();
	const nome = parsed?.header?.name?.trim() || "Curriculo";
	const role = parsed?.header?.role?.trim() || "";
	const filename = role ? `${nome} - ${role}.pdf` : `${nome}.pdf`;

	const url = URL.createObjectURL(blob);
	try {
		const anchor = document.createElement("a");
		anchor.href = url;
		anchor.download = filename;
		anchor.rel = "noopener";
		document.body.appendChild(anchor);
		anchor.click();
		anchor.remove();
	} finally {
		URL.revokeObjectURL(url);
	}
}
