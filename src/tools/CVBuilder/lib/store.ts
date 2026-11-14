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
