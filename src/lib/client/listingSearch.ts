const SEARCH_PARAM = "q";
const SEARCH_PATH = "/buscar";

function getSearchInput(): HTMLInputElement | null {
	return document.getElementById("search") as HTMLInputElement | null;
}

function getFilterableItems(): NodeListOf<HTMLElement> {
	return document.querySelectorAll<HTMLElement>("[data-search-text]");
}

function syncIndexSections(): void {
	const sections = document.querySelectorAll<HTMLElement>("section[data-index-section]");

	for (const section of sections) {
		const items = section.querySelectorAll<HTMLElement>("[data-search-text]");
		if (items.length === 0) continue;

		let visibleCount = 0;
		for (const item of items) {
			if (!item.hidden) visibleCount++;
		}

		section.hidden = visibleCount === 0;
	}
}

function readQueryFromUrl(): string {
	return new URLSearchParams(window.location.search).get(SEARCH_PARAM)?.trim() ?? "";
}

function writeQueryToUrl(query: string): void {
	const url = new URL(window.location.href);
	const trimmed = query.trim();
	if (trimmed) url.searchParams.set(SEARCH_PARAM, trimmed);
	else url.searchParams.delete(SEARCH_PARAM);
	const next = url.search ? `${url.pathname}${url.search}` : url.pathname;
	window.history.replaceState({}, "", next);
}

export function isSearchPagePath(pathname: string): boolean {
	return pathname === SEARCH_PATH || pathname === `${SEARCH_PATH}/`;
}

export function buildSearchHref(query: string): string {
	const trimmed = query.trim();
	if (!trimmed) return SEARCH_PATH;
	const params = new URLSearchParams();
	params.set(SEARCH_PARAM, trimmed);
	return `${SEARCH_PATH}?${params.toString()}`;
}

function goToSearchWithQuery(query: string): void {
	window.location.assign(buildSearchHref(query));
}

export function initListingSearch(): void {
	const searchInput = getSearchInput();
	if (!searchInput) return;

	const onSearchPage = isSearchPagePath(window.location.pathname);

	if (!onSearchPage) {
		const queryFromUrl = readQueryFromUrl();
		if (queryFromUrl) {
			window.location.replace(buildSearchHref(queryFromUrl));
			return;
		}

		searchInput.addEventListener("keydown", (event) => {
			if (event.key !== "Enter") return;
			event.preventDefault();
			goToSearchWithQuery(searchInput.value);
		});
		return;
	}

	const emptyState = document.getElementById("search-empty");
	const emptyTerm = document.getElementById("search-empty-term");
	const clearBtn = document.getElementById("search-clear");

	const filterItems = (): void => {
		const query = searchInput.value.trim().toLowerCase();
		const items = getFilterableItems();
		let visibleCount = 0;

		for (const item of items) {
			const text = item.dataset.searchText ?? "";
			const match = !query || text.includes(query);
			item.hidden = !match;
			if (match) visibleCount++;
		}

		syncIndexSections();

		if (emptyState && emptyTerm) {
			if (query && visibleCount === 0) {
				emptyState.classList.remove("hidden");
				emptyTerm.textContent = `"${query}"`;
			} else {
				emptyState.classList.add("hidden");
			}
		}
	};

	searchInput.addEventListener("input", filterItems);

	searchInput.addEventListener("keydown", (event) => {
		if (event.key !== "Enter") return;
		event.preventDefault();
		writeQueryToUrl(searchInput.value);
		filterItems();
	});

	if (clearBtn) {
		clearBtn.addEventListener("click", () => {
			searchInput.value = "";
			filterItems();
			writeQueryToUrl("");
			searchInput.focus();
		});
	}

	const query = readQueryFromUrl();
	if (query) searchInput.value = query;
	filterItems();
}
