import { describe, expect, it } from "vitest";
import {
	addDays,
	completePurchase,
	emptyState,
	expiryStatus,
	needsRestock,
	type PantryState,
	type Pending,
	type Product,
	syncPurchasePendings,
} from "./domain";

function product(partial: Partial<Product> & Pick<Product, "id" | "name">): Product {
	return {
		quantity: 0,
		minQuantity: 1,
		unit: "un",
		essential: true,
		expiresOn: null,
		notes: "",
		createdAt: "2026-01-01T00:00:00.000Z",
		updatedAt: "2026-01-01T00:00:00.000Z",
		...partial,
	};
}

function pending(partial: Partial<Pending> & Pick<Pending, "id" | "kind" | "title">): Pending {
	return {
		done: false,
		productId: null,
		auto: false,
		createdAt: "2026-01-01T00:00:00.000Z",
		updatedAt: "2026-01-01T00:00:00.000Z",
		completedAt: null,
		...partial,
	};
}

describe("needsRestock", () => {
	it("só essenciais abaixo do mínimo", () => {
		expect(needsRestock(product({ id: "1", name: "Arroz", essential: true, quantity: 0, minQuantity: 1 }))).toBe(true);
		expect(needsRestock(product({ id: "1", name: "Arroz", essential: true, quantity: 1, minQuantity: 1 }))).toBe(false);
		expect(needsRestock(product({ id: "1", name: "Snack", essential: false, quantity: 0, minQuantity: 1 }))).toBe(
			false,
		);
	});
});

describe("expiryStatus", () => {
	it("classifica vencido, próximo e ok", () => {
		expect(expiryStatus(null, "2026-09-25")).toBe("ok");
		expect(expiryStatus("2026-09-24", "2026-09-25")).toBe("expired");
		expect(expiryStatus("2026-09-25", "2026-09-25")).toBe("expiringSoon");
		expect(expiryStatus(addDays("2026-09-25", 7), "2026-09-25")).toBe("expiringSoon");
		expect(expiryStatus(addDays("2026-09-25", 8), "2026-09-25")).toBe("ok");
	});
});

describe("syncPurchasePendings", () => {
	it("cria compra auto para essencial abaixo do mínimo", () => {
		const state: PantryState = {
			products: [product({ id: "p1", name: "Café", quantity: 0, minQuantity: 1 })],
			pendings: [],
		};
		const next = syncPurchasePendings(state, "2026-09-25T12:00:00.000Z");
		expect(next.pendings).toHaveLength(1);
		expect(next.pendings[0]).toMatchObject({
			kind: "purchase",
			title: "Café",
			productId: "p1",
			auto: true,
			done: false,
		});
	});

	it("não duplica se já existe compra aberta do produto", () => {
		const state: PantryState = {
			products: [product({ id: "p1", name: "Café", quantity: 0, minQuantity: 1 })],
			pendings: [
				pending({
					id: "x1",
					kind: "purchase",
					title: "Café",
					productId: "p1",
					auto: true,
				}),
			],
		};
		const next = syncPurchasePendings(state);
		expect(next.pendings).toHaveLength(1);
		expect(next.pendings[0]?.id).toBe("x1");
	});

	it("remove auto aberta quando estoque volta", () => {
		const state: PantryState = {
			products: [product({ id: "p1", name: "Café", quantity: 2, minQuantity: 1 })],
			pendings: [
				pending({
					id: "x1",
					kind: "purchase",
					title: "Café",
					productId: "p1",
					auto: true,
				}),
			],
		};
		const next = syncPurchasePendings(state);
		expect(next.pendings).toHaveLength(0);
	});

	it("não remove compra manual nem tarefa", () => {
		const state: PantryState = {
			products: [product({ id: "p1", name: "Café", quantity: 5, minQuantity: 1 })],
			pendings: [
				pending({ id: "m1", kind: "purchase", title: "Leite", auto: false }),
				pending({ id: "t1", kind: "task", title: "Instalar prateleira" }),
			],
		};
		const next = syncPurchasePendings(state);
		expect(next.pendings.map((p) => p.id).sort()).toEqual(["m1", "t1"]);
	});
});

describe("completePurchase", () => {
	it("soma quantidade, marca done e re-sincroniza", () => {
		const state: PantryState = {
			products: [product({ id: "p1", name: "Café", quantity: 0, minQuantity: 2 })],
			pendings: [
				pending({
					id: "x1",
					kind: "purchase",
					title: "Café",
					productId: "p1",
					auto: true,
				}),
			],
		};
		const next = completePurchase(state, "x1", 3, "2026-09-25T12:00:00.000Z");
		expect(next).not.toBeNull();
		expect(next?.products[0]?.quantity).toBe(3);
		expect(next?.pendings.find((p) => p.id === "x1")?.done).toBe(true);
		expect(next?.pendings.some((p) => !p.done && p.auto)).toBe(false);
	});

	it("compra manual sem produto só marca done", () => {
		const state: PantryState = {
			products: [],
			pendings: [pending({ id: "m1", kind: "purchase", title: "Esponja", auto: false })],
		};
		const next = completePurchase(state, "m1", 1);
		expect(next?.pendings[0]?.done).toBe(true);
		expect(next?.products).toHaveLength(0);
	});

	it("rejeita quantidade inválida", () => {
		const state = emptyState();
		expect(completePurchase(state, "x", 0)).toBeNull();
		expect(completePurchase(state, "x", -1)).toBeNull();
	});
});
