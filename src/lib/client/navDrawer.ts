const LG_QUERY = "(min-width: 64rem)";

export function initNavDrawer(): void {
	const drawer = document.getElementById("nav-drawer");
	const panel = document.getElementById("nav-drawer-panel");
	const openBtn = document.getElementById("nav-drawer-open");
	const closeBtn = document.getElementById("nav-drawer-close");

	if (!(drawer instanceof HTMLDialogElement) || !panel || !openBtn || !closeBtn) return;

	const setExpanded = (open: boolean): void => {
		openBtn.setAttribute("aria-expanded", open ? "true" : "false");
	};

	const openDrawer = (): void => {
		if (window.matchMedia(LG_QUERY).matches) return;
		if (drawer.open) return;
		drawer.showModal();
		setExpanded(true);
		closeBtn.focus();
	};

	const closeDrawer = (): void => {
		if (!drawer.open) return;
		drawer.close();
		setExpanded(false);
		openBtn.focus();
	};

	openBtn.addEventListener("click", openDrawer);
	closeBtn.addEventListener("click", closeDrawer);

	drawer.addEventListener("click", (event) => {
		if (event.target === drawer) closeDrawer();
	});

	drawer.addEventListener("close", () => {
		setExpanded(false);
	});

	window.matchMedia(LG_QUERY).addEventListener("change", (event) => {
		if (event.matches) closeDrawer();
	});
}
