const SEARCH_PARAM = "q";

function getSearchInput(): HTMLInputElement | null {
	return document.getElementById("search") as HTMLInputElement | null;
}

function getFilterableItems(): NodeListOf<HTMLElement> {
	return document.querySelectorAll<HTMLElement>("[data-search-text]");
}

function hasFilterableItems(): boolean {
	return getFilterableItems().length > 0;
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

function clearQueryFromUrl(): void {
	const url = new URL(window.location.href);
	if (!url.searchParams.has(SEARCH_PARAM)) return;
	url.searchParams.delete(SEARCH_PARAM);
	const next = url.search ? `${url.pathname}${url.search}` : url.pathname;
	window.history.replaceState({}, "", next);
}

export function buildSearchHref(query: string): string {
	const trimmed = query.trim();
	if (!trimmed) return "/buscar";
	const params = new URLSearchParams();
	params.set(SEARCH_PARAM, trimmed);
	return `/buscar?${params.toString()}`;
}

function goToSearchWithQuery(query: string): void {
	window.location.assign(buildSearchHref(query));
}

export function initListingSearch(): void {
	const searchInput = getSearchInput();
	if (!searchInput) return;

	const emptyState = document.getElementById("search-empty");
	const emptyTerm = document.getElementById("search-empty-term");
	const clearBtn = document.getElementById("search-clear");

	const filterItems = (): void => {
		if (!hasFilterableItems()) return;

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

	const syncFromUrl = (): void => {
		const query = readQueryFromUrl();
		if (query) searchInput.value = query;
		filterItems();
	};

	searchInput.addEventListener("input", filterItems);

	searchInput.addEventListener("keydown", (event) => {
		if (event.key !== "Enter") return;
		if (hasFilterableItems()) return;

		event.preventDefault();
		goToSearchWithQuery(searchInput.value);
	});

	if (clearBtn) {
		clearBtn.addEventListener("click", () => {
			searchInput.value = "";
			filterItems();
			clearQueryFromUrl();
			searchInput.focus();
		});
	}

	syncFromUrl();
}
