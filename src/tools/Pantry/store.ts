import { createJsonPersistentAtom } from "@/lib/toolStorage/persistentAtom";
import type { ToolStorageEntry } from "@/lib/toolStorage/types";
import {
	addPending,
	adjustProductQuantity,
	completePurchase,
	completeTask,
	emptyState,
	isDateKey,
	type PantryState,
	type Pending,
	type PendingKind,
	type Product,
	removePending,
	removeProduct,
	syncPurchasePendings,
	upsertProduct,
} from "./domain";

const STORAGE_KEY = "pantry:state_v1";

function normalizeProduct(raw: unknown): Product | null {
	if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
	const o = raw as Record<string, unknown>;
	if (typeof o.id !== "string" || o.id === "") return null;
	if (typeof o.name !== "string" || o.name.trim() === "") return null;
	const quantity = typeof o.quantity === "number" && Number.isFinite(o.quantity) ? Math.max(0, o.quantity) : 0;
	const minQuantity =
		typeof o.minQuantity === "number" && Number.isFinite(o.minQuantity) ? Math.max(0, o.minQuantity) : 0;
	const unit = typeof o.unit === "string" && o.unit.trim() !== "" ? o.unit.trim() : "un";
	const expiresOn = typeof o.expiresOn === "string" && isDateKey(o.expiresOn) ? o.expiresOn : null;
	const createdAt = typeof o.createdAt === "string" ? o.createdAt : new Date().toISOString();
	const updatedAt = typeof o.updatedAt === "string" ? o.updatedAt : createdAt;
	return {
		id: o.id,
		name: o.name.trim(),
		quantity,
		minQuantity,
		unit,
		essential: o.essential === true,
		expiresOn,
		notes: typeof o.notes === "string" ? o.notes : "",
		createdAt,
		updatedAt,
	};
}

function isPendingKind(v: unknown): v is PendingKind {
	return v === "purchase" || v === "task";
}

function normalizePending(raw: unknown): Pending | null {
	if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
	const o = raw as Record<string, unknown>;
	if (typeof o.id !== "string" || o.id === "") return null;
	if (!isPendingKind(o.kind)) return null;
	if (typeof o.title !== "string" || o.title.trim() === "") return null;
	const createdAt = typeof o.createdAt === "string" ? o.createdAt : new Date().toISOString();
	const updatedAt = typeof o.updatedAt === "string" ? o.updatedAt : createdAt;
	const completedAt = typeof o.completedAt === "string" ? o.completedAt : null;
	return {
		id: o.id,
		kind: o.kind,
		title: o.title.trim(),
		done: o.done === true,
		productId: typeof o.productId === "string" && o.productId !== "" ? o.productId : null,
		auto: o.auto === true,
		createdAt,
		updatedAt,
		completedAt: o.done === true ? (completedAt ?? updatedAt) : null,
	};
}

function normalizeState(raw: unknown): PantryState {
	if (!raw || typeof raw !== "object" || Array.isArray(raw)) return emptyState();
	const o = raw as Record<string, unknown>;
	const products = Array.isArray(o.products)
		? o.products.map(normalizeProduct).filter((p): p is Product => p !== null)
		: [];
	const pendings = Array.isArray(o.pendings)
		? o.pendings.map(normalizePending).filter((p): p is Pending => p !== null)
		: [];
	return { products, pendings };
}

export const pantry$ = createJsonPersistentAtom<PantryState>({
	storageKey: STORAGE_KEY,
	defaultValue: emptyState(),
	normalize: normalizeState,
});

export const pantryStorage: ToolStorageEntry = {
	toolId: "pantry",
	keys: [STORAGE_KEY],
	atoms: { [STORAGE_KEY]: pantry$ },
};

export function syncNow(): void {
	pantry$.set(syncPurchasePendings(pantry$.get()));
}

export interface ProductInput {
	readonly id?: string;
	readonly name: string;
	readonly quantity: number;
	readonly minQuantity: number;
	readonly unit: string;
	readonly essential: boolean;
	readonly expiresOn: string | null;
	readonly notes: string;
}

export function saveProduct(input: ProductInput): string {
	const result = upsertProduct(pantry$.get(), input);
	if (!result) return "";
	pantry$.set(result.state);
	return result.id;
}

export function deleteProduct(productId: string): void {
	pantry$.set(removeProduct(pantry$.get(), productId));
}

export function bumpQuantity(productId: string, delta: number): void {
	const next = adjustProductQuantity(pantry$.get(), productId, delta);
	if (next) pantry$.set(next);
}

export function createPending(kind: PendingKind, title: string, productId: string | null = null): boolean {
	const next = addPending(pantry$.get(), { kind, title, productId });
	if (!next) return false;
	pantry$.set(next);
	return true;
}

export function deletePending(pendingId: string): void {
	pantry$.set(removePending(pantry$.get(), pendingId));
}

export function finishPurchase(pendingId: string, boughtQty: number): boolean {
	const next = completePurchase(pantry$.get(), pendingId, boughtQty);
	if (!next) return false;
	pantry$.set(next);
	return true;
}

export function finishTask(pendingId: string): boolean {
	const next = completeTask(pantry$.get(), pendingId);
	if (!next) return false;
	pantry$.set(next);
	return true;
}
