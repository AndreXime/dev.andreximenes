export type PendingKind = "purchase" | "task";
export type ExpiryStatus = "ok" | "expiringSoon" | "expired";

export interface Product {
	readonly id: string;
	readonly name: string;
	readonly quantity: number;
	readonly minQuantity: number;
	readonly unit: string;
	readonly essential: boolean;
	readonly expiresOn: string | null;
	readonly notes: string;
	readonly createdAt: string;
	readonly updatedAt: string;
}

export interface Pending {
	readonly id: string;
	readonly kind: PendingKind;
	readonly title: string;
	readonly done: boolean;
	readonly productId: string | null;
	readonly auto: boolean;
	readonly createdAt: string;
	readonly updatedAt: string;
	readonly completedAt: string | null;
}

export interface PantryState {
	readonly products: readonly Product[];
	readonly pendings: readonly Pending[];
}

export function emptyState(): PantryState {
	return { products: [], pendings: [] };
}

export function newId(): string {
	return globalThis.crypto?.randomUUID?.() ?? `pantry-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function needsRestock(product: Product): boolean {
	return product.essential && product.quantity < product.minQuantity;
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export function isDateKey(value: string): boolean {
	return DATE_RE.test(value);
}

export function addDays(dateKey: string, days: number): string {
	const parts = dateKey.split("-").map(Number);
	const y = parts[0] ?? 0;
	const m = parts[1] ?? 1;
	const d = parts[2] ?? 1;
	const dt = new Date(Date.UTC(y, m - 1, d));
	dt.setUTCDate(dt.getUTCDate() + days);
	const yy = dt.getUTCFullYear();
	const mm = String(dt.getUTCMonth() + 1).padStart(2, "0");
	const dd = String(dt.getUTCDate()).padStart(2, "0");
	return `${yy}-${mm}-${dd}`;
}

export function localDateKey(now: Date = new Date()): string {
	const y = now.getFullYear();
	const m = String(now.getMonth() + 1).padStart(2, "0");
	const d = String(now.getDate()).padStart(2, "0");
	return `${y}-${m}-${d}`;
}

export function expiryStatus(expiresOn: string | null, today: string): ExpiryStatus {
	if (expiresOn === null || !isDateKey(expiresOn) || !isDateKey(today)) return "ok";
	if (expiresOn < today) return "expired";
	const limit = addDays(today, 7);
	if (expiresOn <= limit) return "expiringSoon";
	return "ok";
}

/** Pending aberta ligada ao produto (auto ou manual com productId) bloqueia nova auto. */
function hasOpenPurchaseForProduct(pendings: readonly Pending[], productId: string): boolean {
	return pendings.some((p) => p.kind === "purchase" && !p.done && p.productId === productId);
}

export function syncPurchasePendings(state: PantryState, nowIso: string = new Date().toISOString()): PantryState {
	const productIdsNeeding = new Set(state.products.filter(needsRestock).map((p) => p.id));

	const kept: Pending[] = [];
	for (const pending of state.pendings) {
		if (pending.kind === "purchase" && pending.auto && !pending.done) {
			const productId = pending.productId;
			if (productId === null || !productIdsNeeding.has(productId)) {
				continue;
			}
		}
		kept.push(pending);
	}

	const next: Pending[] = [...kept];
	for (const product of state.products) {
		if (!needsRestock(product)) continue;
		if (hasOpenPurchaseForProduct(next, product.id)) continue;
		next.push({
			id: newId(),
			kind: "purchase",
			title: product.name,
			done: false,
			productId: product.id,
			auto: true,
			createdAt: nowIso,
			updatedAt: nowIso,
			completedAt: null,
		});
	}

	return { products: state.products, pendings: next };
}

export function completePurchase(
	state: PantryState,
	pendingId: string,
	boughtQty: number,
	nowIso: string = new Date().toISOString(),
): PantryState | null {
	if (!(boughtQty > 0) || !Number.isFinite(boughtQty)) return null;
	const pending = state.pendings.find((p) => p.id === pendingId);
	if (pending?.kind !== "purchase" || pending.done) return null;

	let products = state.products;
	if (pending.productId !== null) {
		const product = products.find((p) => p.id === pending.productId);
		if (product) {
			products = products.map((p) =>
				p.id === product.id ? { ...p, quantity: p.quantity + boughtQty, updatedAt: nowIso } : p,
			);
		}
	}

	const pendings = state.pendings.map((p) =>
		p.id === pendingId ? { ...p, done: true, updatedAt: nowIso, completedAt: nowIso } : p,
	);

	return syncPurchasePendings({ products, pendings }, nowIso);
}

export function completeTask(
	state: PantryState,
	pendingId: string,
	nowIso: string = new Date().toISOString(),
): PantryState | null {
	const pending = state.pendings.find((p) => p.id === pendingId);
	if (pending?.kind !== "task" || pending.done) return null;
	const pendings = state.pendings.map((p) =>
		p.id === pendingId ? { ...p, done: true, updatedAt: nowIso, completedAt: nowIso } : p,
	);
	return { products: state.products, pendings };
}

export function adjustProductQuantity(
	state: PantryState,
	productId: string,
	delta: number,
	nowIso: string = new Date().toISOString(),
): PantryState | null {
	if (!Number.isFinite(delta) || delta === 0) return null;
	const product = state.products.find((p) => p.id === productId);
	if (!product) return null;
	const quantity = Math.max(0, product.quantity + delta);
	const products = state.products.map((p) => (p.id === productId ? { ...p, quantity, updatedAt: nowIso } : p));
	return syncPurchasePendings({ products, pendings: state.pendings }, nowIso);
}

export function upsertProduct(
	state: PantryState,
	input: {
		readonly id?: string;
		readonly name: string;
		readonly quantity: number;
		readonly minQuantity: number;
		readonly unit: string;
		readonly essential: boolean;
		readonly expiresOn: string | null;
		readonly notes: string;
	},
	nowIso: string = new Date().toISOString(),
): { state: PantryState; id: string } | null {
	const name = input.name.trim();
	if (name === "") return null;
	if (!Number.isFinite(input.quantity) || input.quantity < 0) return null;
	if (!Number.isFinite(input.minQuantity) || input.minQuantity < 0) return null;
	const unit = input.unit.trim() === "" ? "un" : input.unit.trim();
	const expiresOn = input.expiresOn !== null && isDateKey(input.expiresOn) ? input.expiresOn : null;

	const id = input.id ?? newId();
	const existing = state.products.find((p) => p.id === id);
	const product: Product = {
		id,
		name,
		quantity: input.quantity,
		minQuantity: input.minQuantity,
		unit,
		essential: input.essential,
		expiresOn,
		notes: input.notes,
		createdAt: existing?.createdAt ?? nowIso,
		updatedAt: nowIso,
	};

	const products = existing ? state.products.map((p) => (p.id === id ? product : p)) : [...state.products, product];

	return { state: syncPurchasePendings({ products, pendings: state.pendings }, nowIso), id };
}

export function removeProduct(
	state: PantryState,
	productId: string,
	nowIso: string = new Date().toISOString(),
): PantryState {
	const products = state.products.filter((p) => p.id !== productId);
	return syncPurchasePendings({ products, pendings: state.pendings }, nowIso);
}

export function addPending(
	state: PantryState,
	input: {
		readonly kind: PendingKind;
		readonly title: string;
		readonly productId?: string | null;
	},
	nowIso: string = new Date().toISOString(),
): PantryState | null {
	const title = input.title.trim();
	if (title === "") return null;
	const pending: Pending = {
		id: newId(),
		kind: input.kind,
		title,
		done: false,
		productId: input.productId ?? null,
		auto: false,
		createdAt: nowIso,
		updatedAt: nowIso,
		completedAt: null,
	};
	return { products: state.products, pendings: [...state.pendings, pending] };
}

export function removePending(state: PantryState, pendingId: string): PantryState {
	return {
		products: state.products,
		pendings: state.pendings.filter((p) => p.id !== pendingId),
	};
}
