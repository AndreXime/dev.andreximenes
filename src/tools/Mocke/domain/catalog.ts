import type { DataRecord, DatasetId, DatasetMeta } from "./types";

export const DATASETS: readonly DatasetMeta[] = [
	{
		id: "products",
		label: "Produtos",
		description: "Catálogo de e-commerce para listagens e filtros de categoria.",
		idField: "id",
		previewFields: ["id", "title", "brand"],
		fields: [
			"id",
			"source",
			"title",
			"description",
			"brand",
			"category",
			"price",
			"listPrice",
			"packSize",
			"images",
			"url",
			"stars",
			"reviews",
			"inStock",
			"isBestSeller",
			"boughtInLastMonth",
		],
	},
	{
		id: "cep",
		label: "CEPs",
		description: "CEP brasileiro com longitude e latitude.",
		idField: "POSTCODE",
		previewFields: ["POSTCODE", "LAT", "LON"],
		fields: ["POSTCODE", "LON", "LAT"],
	},
	{
		id: "news",
		label: "Notícias",
		description: "Artigos com título, assunto e data.",
		idField: "id",
		previewFields: ["id", "title", "subject"],
		fields: ["id", "title", "text", "subject", "date"],
	},
	{
		id: "movies",
		label: "Filmes",
		description: "Filmes com gêneros, elenco e métricas.",
		idField: "id",
		previewFields: ["id", "title", "release_date"],
		fields: [
			"id",
			"title",
			"original_title",
			"original_language",
			"overview",
			"tagline",
			"status",
			"release_date",
			"runtime",
			"budget",
			"revenue",
			"popularity",
			"vote_average",
			"vote_count",
			"homepage",
			"genres",
			"keywords",
			"production_companies",
			"production_countries",
			"spoken_languages",
			"cast",
			"directors",
		],
	},
	{
		id: "users",
		label: "Usuários",
		description: "Usuários fake estilo randomuser.",
		idField: "id",
		previewFields: ["id", "first_name", "email"],
		fields: [
			"id",
			"first_name",
			"last_name",
			"email",
			"username",
			"gender",
			"age",
			"birth_date",
			"phone",
			"cell",
			"street",
			"city",
			"state",
			"country",
			"postcode",
			"latitude",
			"longitude",
			"nationality",
			"picture",
			"registered_at",
		],
	},
	{
		id: "companies",
		label: "Empresas",
		description: "Empresas com indústria, porte e localização.",
		idField: "id",
		previewFields: ["id", "name", "industry"],
		fields: [
			"id",
			"name",
			"domain",
			"year_founded",
			"industry",
			"size_range",
			"locality",
			"country",
			"linkedin_url",
			"current_employee_estimate",
			"total_employee_estimate",
		],
	},
];

const BY_ID: Record<DatasetId, DatasetMeta> = Object.fromEntries(DATASETS.map((meta) => [meta.id, meta])) as Record<
	DatasetId,
	DatasetMeta
>;

type DatasetModule = { readonly default: readonly DataRecord[] };

const loaders: Record<DatasetId, () => Promise<DatasetModule>> = {
	products: () => import("../data/products.json"),
	cep: () => import("../data/cep.json"),
	news: () => import("../data/news.json"),
	movies: () => import("../data/movies.json"),
	users: () => import("../data/users.json"),
	companies: () => import("../data/companies.json"),
};

const cache = new Map<DatasetId, readonly DataRecord[]>();

export function getDatasetMeta(id: DatasetId): DatasetMeta {
	return BY_ID[id];
}

export async function loadDatasetRecords(id: DatasetId): Promise<readonly DataRecord[]> {
	const hit = cache.get(id);
	if (hit) return hit;

	const mod = await loaders[id]();
	const rows = mod.default;
	cache.set(id, rows);
	return rows;
}
