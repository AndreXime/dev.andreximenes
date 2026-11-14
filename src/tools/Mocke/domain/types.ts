export type DataRecord = Record<string, string>;

export type DatasetId = "products" | "cep" | "news" | "movies" | "users" | "companies";

export interface QueryParams {
	readonly q?: string;
	readonly searchFields?: readonly string[];
	readonly filters?: Readonly<Record<string, string>>;
	readonly sort?: string;
	readonly order?: "asc" | "desc";
	readonly fields?: readonly string[];
	readonly limit?: number;
}

export interface DatasetMeta {
	readonly id: DatasetId;
	readonly label: string;
	readonly description: string;
	readonly fields: readonly string[];
	readonly idField: string;
	readonly previewFields: readonly string[];
}
