function textoBusca(item: HTMLElement): string {
	return item.querySelector("[data-busca]")?.textContent?.toLowerCase() ?? "";
}

function contagem(visiveis: number, total: number): string {
	if (visiveis === total) return String(total).padStart(2, "0");
	return `${visiveis} de ${total}`;
}

export function initAplicativosFiltro(): void {
	const busca = document.querySelector<HTMLInputElement>("#aplicativos-busca");
	const lista = document.querySelector<HTMLElement>("#aplicativos-lista");
	const listaRoms = document.querySelector<HTMLElement>("#roms-lista");
	if (!busca || !lista || !listaRoms) return;

	const appItems = [...lista.querySelectorAll<HTMLElement>("[data-app]")];
	const romItems = [...listaRoms.querySelectorAll<HTMLElement>("[data-rom]")];
	const cabecalhos = [...listaRoms.querySelectorAll<HTMLElement>("[data-rom-cabecalho]")];
	const botoes = [...document.querySelectorAll<HTMLButtonElement>("[data-sistema]")];
	const contador = document.querySelector<HTMLElement>("#aplicativos-contador");
	const contadorRoms = document.querySelector<HTMLElement>("#roms-contador");
	const vazio = document.querySelector<HTMLElement>("#aplicativos-vazio");
	const vazioRoms = document.querySelector<HTMLElement>("#roms-vazio");

	let sistemaAtual = "todas";

	const marcarSistema = (): void => {
		for (const botao of botoes) {
			const ativo = botao.dataset.sistema === sistemaAtual;
			botao.setAttribute("aria-pressed", ativo ? "true" : "false");
			botao.classList.toggle("bg-ink", ativo);
			botao.classList.toggle("text-paper", ativo);
			botao.classList.toggle("text-ink", !ativo);
		}
	};

	const render = (): void => {
		const termo = busca.value.trim().toLowerCase();
		let appsVisiveis = 0;

		for (const item of appItems) {
			const visivel = termo.length === 0 || textoBusca(item).includes(termo);
			item.hidden = !visivel;
			if (!visivel) continue;
			appsVisiveis += 1;
			const ordem = item.querySelector("[data-ordem]");
			if (ordem) ordem.textContent = String(appsVisiveis).padStart(2, "0");
		}

		if (contador) contador.textContent = contagem(appsVisiveis, appItems.length);
		if (vazio) vazio.hidden = appsVisiveis > 0;
		lista.hidden = appsVisiveis === 0;

		let romsVisiveis = 0;
		for (const item of romItems) {
			const sistemaOk = sistemaAtual === "todas" || item.dataset.sistema === sistemaAtual;
			const visivel = sistemaOk && (termo.length === 0 || textoBusca(item).includes(termo));
			item.hidden = !visivel;
			if (visivel) romsVisiveis += 1;
		}

		for (const cabecalho of cabecalhos) {
			const grupo = cabecalho.dataset.grupo;
			const algumVisivel = romItems.some((item) => item.dataset.grupo === grupo && !item.hidden);
			cabecalho.hidden = !algumVisivel;
		}

		if (contadorRoms) contadorRoms.textContent = contagem(romsVisiveis, romItems.length);
		if (vazioRoms) vazioRoms.hidden = romsVisiveis > 0;
		listaRoms.hidden = romsVisiveis === 0;
	};

	busca.addEventListener("input", render);

	for (const botao of botoes) {
		botao.addEventListener("click", () => {
			sistemaAtual = botao.dataset.sistema ?? "todas";
			marcarSistema();
			render();
		});
	}

	for (const botao of document.querySelectorAll<HTMLButtonElement>("[data-mais]")) {
		botao.addEventListener("click", () => {
			const descricao = botao.parentElement?.querySelector("[data-descricao]");
			if (!(descricao instanceof HTMLElement)) return;
			const fechado = descricao.classList.toggle("line-clamp-3");
			botao.textContent = fechado ? "Ver mais" : "Ver menos";
		});
	}

	marcarSistema();
}
