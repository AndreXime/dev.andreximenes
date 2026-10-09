# Media Index Listings Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Trocar o Index-First das listagens por Media Index: capas commitadas no repo, home em linhas com thumbnail, seções em grade de cards, sem mudar a identidade visual.

**Architecture:** `cover` via `image()` no Content Collection aponta para WebP em `src/assets/covers/<type>/<slug>.webp`. `loadPosts` passa a capa no `Post`. Home usa `IndexList` com thumb; `/post` `/app` `/link` usam `CoverGrid`. Sem fetch de imagem no build.

**Tech Stack:** Astro 7 Content Collections (`image()`), `astro:assets` `Image`, Tailwind v4 + tokens do hub, Vitest para helpers.

## Global Constraints

- Spec: `docs/superpowers/specs/2026-10-09-media-index-listings-design.md`
- Identidade: papel quente, laranja, Hanken (não rebrandar)
- Layout: coluna até `md`; multi-coluna só a partir de `lg`
- `cover` obrigatório ao final da migração (build quebra sem arquivo)
- Capas: tools = screenshot UI; notes = IA editorial; links = OG/screenshot commitado
- Home = linhas com thumb; seções = grade 1 col / 2 cols em `lg`; aspect capa ~16:10
- Imagem decorativa nas listagens: `alt=""`
- Copy em português brasileiro; sem em dash / en dash
- Sem `any`; sem `@ts-ignore`
- Commits: Conventional Commits em português só quando o usuário autorizar (nos steps de commit, preparar a mensagem e pedir ok se a sessão exigir)

## File structure

| File | Responsibility |
|------|----------------|
| `src/assets/covers/tools/*.webp` | Screenshots das tools |
| `src/assets/covers/notes/*.webp` | Capas IA das notas |
| `src/assets/covers/links/*.webp` | OG/screenshots dos links |
| `src/content.config.ts` | Schema com `cover: image()` |
| `src/lib/coverPath.ts` | Convenção de path relativo MD → asset |
| `src/lib/coverPath.test.ts` | Testes da convenção |
| `src/lib/listing.ts` | `Post` com `cover`; `loadPosts` preserva capa |
| `src/components/ui/IndexList.astro` | Home: linha + thumb |
| `src/components/ui/CoverGrid.astro` | Seções: grade de cards |
| `src/components/layout/ListingLayout.astro` | Home → IndexList; seção → CoverGrid |
| `design.md` | Macrostructure Media Index |
| `tools.md` | Passo de capa ao criar tool |
| `README.md` | Menção breve às capas |
| `src/content/posts/**/*.md` | Frontmatter `cover` em todos os posts |

Posts a cobrir (slugs):

**tools:** `bloco-de-notas`, `calendario-pessoal`, `canvas`, `criador-de-curriculos`, `despensa`, `ferramentas-de-imagem`, `ferramentas-para-o-dia-a-dia`, `goal-quest`, `planejador-de-independencia-financeira`, `planejador-financeiro`, `planejador-semanal`, `temas-css`, `transmissao-optica-qr`

**notes:** `6-livros-essenciais-para-desenvolvedores-de-software`, `a-falacia-da-api-fullstack-use-hono-e-nestjs`, `astro-vs-nextjs-o-custo-da-preguica-no-vibe-coding`, `cloudflare-neon-vps-mapa-infra-typescript`, `dev-junior-remoto-10-plataformas-brasil`, `go-vs-typescript-otimizando-a-runtime-da-api`, `nestjs-a-melhor-framework-para-apis-convencionais-em-typescript`, `pipeline-hibrido-biome-e-eslint-para-seguranca-e-performance`, `sincronizar-estado-web-app-com-hash-na-url`, `ssr-cacheavel-na-borda-viral-sem-deploy`, `ssr-completo-ou-skeleton-decida-pelo-dado`, `token-assimetrico-no-ssr-sem-round-trip-na-api`, `wayland-x11-gtk-qt-mapas-do-desktop-linux`

**links:** `design-prompts`, `editor-de-fotos-online`, `gerador-de-favicon`, `imagem-para-svg`

Ignorar `src/content/posts/notes/prompt.txt` (não é post).

---

### Task 1: Helper de path da capa + pastas

**Files:**
- Create: `src/lib/coverPath.ts`
- Create: `src/lib/coverPath.test.ts`
- Create: `src/assets/covers/tools/.gitkeep`
- Create: `src/assets/covers/notes/.gitkeep`
- Create: `src/assets/covers/links/.gitkeep`

**Interfaces:**
- Produces: `CoverPostType`, `coverAssetPath(type, slug)`, `coverFrontmatterPath(type, slug)`

- [ ] **Step 1: Write the failing test**

```ts
// src/lib/coverPath.test.ts
import { describe, expect, it } from "vitest";
import { coverAssetPath, coverFrontmatterPath } from "./coverPath";

describe("coverPath", () => {
	it("monta path do asset no repo", () => {
		expect(coverAssetPath("tool", "goal-quest")).toBe(
			"src/assets/covers/tools/goal-quest.webp",
		);
		expect(coverAssetPath("note", "astro-vs-nextjs-o-custo-da-preguica-no-vibe-coding")).toBe(
			"src/assets/covers/notes/astro-vs-nextjs-o-custo-da-preguica-no-vibe-coding.webp",
		);
		expect(coverAssetPath("link", "gerador-de-favicon")).toBe(
			"src/assets/covers/links/gerador-de-favicon.webp",
		);
	});

	it("monta path relativo do MD (tools/notes/links) até o asset", () => {
		expect(coverFrontmatterPath("tool", "goal-quest")).toBe(
			"../../../assets/covers/tools/goal-quest.webp",
		);
		expect(coverFrontmatterPath("note", "ssr-completo-ou-skeleton-decida-pelo-dado")).toBe(
			"../../../assets/covers/notes/ssr-completo-ou-skeleton-decida-pelo-dado.webp",
		);
		expect(coverFrontmatterPath("link", "imagem-para-svg")).toBe(
			"../../../assets/covers/links/imagem-para-svg.webp",
		);
	});
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/lib/coverPath.test.ts`
Expected: FAIL (módulo ausente)

- [ ] **Step 3: Write minimal implementation**

```ts
// src/lib/coverPath.ts
export type CoverPostType = "tool" | "note" | "link";

const FOLDER: Record<CoverPostType, string> = {
	tool: "tools",
	note: "notes",
	link: "links",
};

export function coverAssetPath(type: CoverPostType, slug: string): string {
	return `src/assets/covers/${FOLDER[type]}/${slug}.webp`;
}

/** Path relativo a partir de src/content/posts/<tools|notes|links>/<slug>.md */
export function coverFrontmatterPath(type: CoverPostType, slug: string): string {
	return `../../../assets/covers/${FOLDER[type]}/${slug}.webp`;
}
```

Criar as três pastas com `.gitkeep`.

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- src/lib/coverPath.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/coverPath.ts src/lib/coverPath.test.ts src/assets/covers
git commit -m "$(cat <<'EOF'
feat(listings): adicionar convenção de path das capas

EOF
)"
```

---

### Task 2: Schema com `cover` opcional + tipo `Post`

**Files:**
- Modify: `src/content.config.ts`
- Modify: `src/lib/listing.ts`

**Interfaces:**
- Consumes: `image()` do SchemaContext do Astro
- Produces: `Post.cover` tipado como metadata de imagem quando presente; `loadPosts` preserva `cover`

- [ ] **Step 1: Write the failing test**

```ts
// src/lib/listing.cover.test.ts
import { describe, expect, it } from "vitest";
import type { Post } from "@/content.config";

describe("Post cover typing", () => {
	it("Post aceita cover ImageMetadata-like", () => {
		const cover = {
			src: "/_astro/x.webp",
			width: 1200,
			height: 750,
			format: "webp" as const,
		};
		const post: Post = {
			slug: "goal-quest",
			type: "tool",
			title: "Goal Quest",
			date: new Date("2026-09-23"),
			cover,
		};
		expect(post.cover.width).toBe(1200);
	});
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/lib/listing.cover.test.ts`
Expected: FAIL de tipo/compilação ou propriedade `cover` inexistente em `Post` (ajustar se Vitest não typecheck: nesse caso o step 2 vira `npx tsc --noEmit` / `npm run lint` falhando por uso de `cover` em um arquivo `.ts` de teste que importa `Post`)

Se o projeto não typechecka testes, use este teste de runtime no mesmo arquivo após atualizar `Post`, e no Step 2 confirme que `Post` ainda não tem `cover` via leitura: se já tiver, pule para Step 3.

- [ ] **Step 3: Update schema and Post**

```ts
// src/content.config.ts
import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { z } from "astro/zod";

export interface PostCover {
	src: string;
	width: number;
	height: number;
	format: string;
}

export interface Post {
	slug: string;
	type: "tool" | "note" | "link";
	title: string;
	date: Date;
	description?: string | undefined;
	content?: string | undefined;
	target?: string | undefined;
	cover?: PostCover | undefined;
}

const posts = defineCollection({
	loader: glob({ pattern: "**/*.md", base: "./src/content/posts" }),
	schema: ({ image }) =>
		z.object({
			title: z.string(),
			slug: z.string(),
			type: z.enum(["tool", "note", "link"]),
			date: z.coerce.date(),
			description: z.string().optional(),
			target: z.string().optional(),
			cover: image().optional(),
		}),
});

export const collections = { posts };
```

Em `src/lib/listing.ts`, garantir que `loadPosts` faz spread de `entry.data` (já faz) para `cover` fluir. Sem mudança estrutural além de tipagem se necessário.

- [ ] **Step 4: Run tests / check**

Run: `npm test -- src/lib/listing.cover.test.ts src/lib/coverPath.test.ts`
Expected: PASS

Run: `npm run lint`
Expected: PASS (schema opcional não exige capas ainda)

- [ ] **Step 5: Commit**

```bash
git add src/content.config.ts src/lib/listing.ts src/lib/listing.cover.test.ts
git commit -m "$(cat <<'EOF'
feat(content): aceitar cover opcional no schema dos posts

EOF
)"
```

---

### Task 3: Capas das tools (screenshots)

**Files:**
- Create: `src/assets/covers/tools/<slug>.webp` (13 arquivos)
- Modify: cada `src/content/posts/tools/<slug>.md` (campo `cover`)

**Interfaces:**
- Consumes: `coverFrontmatterPath("tool", slug)`
- Produces: WebP ~16:10, largura ~1200px, screenshot real da UI

- [ ] **Step 1: Subir o app local**

Run: `npm run dev`
Abrir cada tool em `http://localhost:4321/app/<slug>/`.

- [ ] **Step 2: Capturar screenshots**

Para cada slug de tool na lista da File structure:
1. Abrir a tool, estado visual representativo (não empty morto se der para popular demo rápido).
2. Capturar a área da UI (sem chrome do browser).
3. Exportar/converter para WebP 16:10 (~1200×750) em `src/assets/covers/tools/<slug>.webp`.

Ferramentas úteis: DevTools device screenshot, `gnome-screenshot`, ou browser MCP `browser_take_screenshot` + conversão `cwebp` / ImageMagick:

```bash
# exemplo se tiver PNG intermediário
cwebp -q 80 input.png -o src/assets/covers/tools/goal-quest.webp
```

- [ ] **Step 3: Setar frontmatter**

Em cada `src/content/posts/tools/<slug>.md`, adicionar (exemplo Goal Quest):

```yaml
cover: "../../../assets/covers/tools/goal-quest.webp"
```

Usar o path exato de `coverFrontmatterPath("tool", slug)`.

- [ ] **Step 4: Verify files exist**

```bash
for s in bloco-de-notas calendario-pessoal canvas criador-de-curriculos despensa ferramentas-de-imagem ferramentas-para-o-dia-a-dia goal-quest planejador-de-independencia-financeira planejador-financeiro planejador-semanal temas-css transmissao-optica-qr; do
  test -f "src/assets/covers/tools/$s.webp" || echo "MISSING $s"
done
```

Expected: nenhum `MISSING`

- [ ] **Step 5: Commit**

```bash
git add src/assets/covers/tools src/content/posts/tools
git commit -m "$(cat <<'EOF'
chore(covers): adicionar screenshots das tools

EOF
)"
```

---

### Task 4: Capas das notes (IA)

**Files:**
- Create: `src/assets/covers/notes/<slug>.webp` (13 arquivos)
- Modify: cada `src/content/posts/notes/<slug>.md`

**Interfaces:**
- Consumes: título/tema do post
- Produces: capa editorial ~16:10 WebP

- [ ] **Step 1: Brief visual comum**

Todas as capas de nota:
- Aspect 16:10, composição editorial limpa
- Sem texto ilegível, sem logo genérico de IA
- Harmonizar com hub (papel quente / tinta / acento laranja permitido com parcimônia)
- Sem colagem de UI de produto

- [ ] **Step 2: Gerar uma capa por nota**

Para cada slug de note, gerar imagem a partir do **título** do post (ler o `title` do frontmatter). Salvar como `src/assets/covers/notes/<slug>.webp` (converter se a ferramenta entregar PNG).

- [ ] **Step 3: Frontmatter**

```yaml
cover: "../../../assets/covers/notes/<slug>.webp"
```

- [ ] **Step 4: Verify**

```bash
for s in 6-livros-essenciais-para-desenvolvedores-de-software a-falacia-da-api-fullstack-use-hono-e-nestjs astro-vs-nextjs-o-custo-da-preguica-no-vibe-coding cloudflare-neon-vps-mapa-infra-typescript dev-junior-remoto-10-plataformas-brasil go-vs-typescript-otimizando-a-runtime-da-api nestjs-a-melhor-framework-para-apis-convencionais-em-typescript pipeline-hibrido-biome-e-eslint-para-seguranca-e-performance sincronizar-estado-web-app-com-hash-na-url ssr-cacheavel-na-borda-viral-sem-deploy ssr-completo-ou-skeleton-decida-pelo-dado token-assimetrico-no-ssr-sem-round-trip-na-api wayland-x11-gtk-qt-mapas-do-desktop-linux; do
  test -f "src/assets/covers/notes/$s.webp" || echo "MISSING $s"
done
```

Expected: nenhum `MISSING`

- [ ] **Step 5: Commit**

```bash
git add src/assets/covers/notes src/content/posts/notes
git commit -m "$(cat <<'EOF'
chore(covers): adicionar capas editoriais das notas

EOF
)"
```

---

### Task 5: Capas dos links (OG/screenshot commitado)

**Files:**
- Create: `src/assets/covers/links/<slug>.webp` (4 arquivos)
- Modify: cada `src/content/posts/links/<slug>.md`

**Interfaces:**
- Consumes: `target` URL do post
- Produces: WebP commitado (OG baixado ou screenshot)

- [ ] **Step 1: Obter imagem por link**

Para cada link, ler `target` no MD. Preferência:
1. Baixar `og:image` (ou `twitter:image`) da página
2. Se faltar, screenshot da landing

Exemplo de extração rápida:

```bash
# pega og:image (ajustar URL)
curl -fsSL "$URL" | tr '\n' ' ' | grep -oE 'property=["'\'']og:image["'\''][^>]+content=["'\''][^"'\'']+|"'\'']|content=["'\''][^"'\'']+["'\''][^>]+property=["'\'']og:image["'\'']' | head -1
```

Baixar o arquivo, converter para WebP 16:10 em `src/assets/covers/links/<slug>.webp`.

- [ ] **Step 2: Frontmatter**

```yaml
cover: "../../../assets/covers/links/<slug>.webp"
```

- [ ] **Step 3: Verify**

```bash
for s in design-prompts editor-de-fotos-online gerador-de-favicon imagem-para-svg; do
  test -f "src/assets/covers/links/$s.webp" || echo "MISSING $s"
done
```

Expected: nenhum `MISSING`

- [ ] **Step 4: Commit**

```bash
git add src/assets/covers/links src/content/posts/links
git commit -m "$(cat <<'EOF'
chore(covers): adicionar capas dos links curados

EOF
)"
```

---

### Task 6: Tornar `cover` obrigatório

**Files:**
- Modify: `src/content.config.ts`
- Modify: `src/lib/listing.cover.test.ts` (cover obrigatório no objeto `Post`)

**Interfaces:**
- Produces: `cover` required no schema e em `Post`

- [ ] **Step 1: Exigir cover**

```ts
// em content.config.ts
export interface Post {
	slug: string;
	type: "tool" | "note" | "link";
	title: string;
	date: Date;
	description?: string | undefined;
	content?: string | undefined;
	target?: string | undefined;
	cover: PostCover;
}

// no schema:
cover: image(),
```

Remover `.optional()` de `cover`.

- [ ] **Step 2: Build verify**

Run: `npm run build`
Expected: SUCCESS (todas as capas resolvem)

Se falhar com path de imagem, corrigir frontmatter/arquivo antes de seguir.

- [ ] **Step 3: Commit**

```bash
git add src/content.config.ts src/lib/listing.cover.test.ts
git commit -m "$(cat <<'EOF'
feat(content): tornar cover obrigatório nos posts

EOF
)"
```

---

### Task 7: `IndexList` com thumbnail (home)

**Files:**
- Modify: `src/components/ui/IndexList.astro`

**Interfaces:**
- Consumes: `post.cover` (`PostCover` / ImageMetadata)
- Produces: linha com thumb 64–80px, `alt=""`, sem ícones Wrench/FileText/favicon (capa substitui)

- [ ] **Step 1: Implementar layout com Image**

Substituir o conteúdo visual da linha para:

```astro
---
import { Image } from "astro:assets";
import type { Post } from "@/content.config";
import { formatDate, listingDescription } from "@/lib/listing";
import { getPostMeta } from "@/lib/postMeta";
import { ExternalLinkIcon } from "lucide-react";

interface Props {
	posts: Post[];
}

const { posts } = Astro.props;

const items = await Promise.all(
	posts.map(async (post) => ({
		post,
		meta: await getPostMeta(post),
		excerpt: listingDescription(post),
	})),
);
---

{
	items.length > 0 ? (
		<ul class="m-0 list-none divide-y divide-rule p-0">
			{items.map(({ post, meta, excerpt }) => (
				<li
					data-search-text={`${post.title} ${excerpt ?? ""} ${meta.typeLabel}`.toLowerCase()}
				>
					<a
						href={meta.href}
						class="focus-ring group flex min-h-11 flex-col gap-3xs py-sm no-underline lg:flex-row lg:items-center lg:justify-between lg:gap-md"
						title={post.title}
						{...(meta.external
							? { target: "_blank", rel: "noopener noreferrer" }
							: {})}
					>
						<span class="flex min-w-0 items-start gap-sm">
							<Image
								src={post.cover}
								alt=""
								width={80}
								height={50}
								class="size-20 shrink-0 rounded-[var(--radius-sm)] object-cover"
								loading="lazy"
								decoding="async"
							/>
							<span class="min-w-0">
								<span class="flex items-center gap-2xs font-medium text-ink wrap-anywhere group-hover:text-accent">
									<span>{post.title}</span>
									{meta.external ? (
										<ExternalLinkIcon className="size-3.5 shrink-0 text-muted" />
									) : null}
								</span>
								{excerpt ? (
									<span class="mt-3xs line-clamp-2 text-sm leading-normal text-muted wrap-anywhere">
										{excerpt}
									</span>
								) : null}
							</span>
						</span>
						<span class="shrink-0 text-sm text-muted lg:pl-md">
							{meta.typeLabel}
							{" · "}
							<time datetime={post.date.toISOString()}>
								{formatDate(post.date)}
							</time>
						</span>
					</a>
				</li>
			))}
		</ul>
	) : null
}
```

Ajustar classes se `size-20` (80px) ficar alto demais na home: alvo 64–80px (`size-16` / `size-20`). Manter `object-cover` e radius do token.

Nota: `Image` do Astro tipa `src` como `ImageMetadata`. Se `PostCover` for estreito demais, tipar `cover` como o retorno de `image()` (usar `ImageMetadata` de `astro`) em `content.config.ts`:

```ts
import type { ImageMetadata } from "astro";
// cover: ImageMetadata
```

- [ ] **Step 2: Visual check**

Run: `npm run dev` → abrir `/`
Expected: lista Recente com thumbs; busca por `data-search-text` ainda funciona.

- [ ] **Step 3: Lint**

Run: `npm run lint`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add src/components/ui/IndexList.astro src/content.config.ts
git commit -m "$(cat <<'EOF'
feat(listings): mostrar thumbnail na lista da home

EOF
)"
```

---

### Task 8: `CoverGrid` + `ListingLayout`

**Files:**
- Create: `src/components/ui/CoverGrid.astro`
- Modify: `src/components/layout/ListingLayout.astro`

**Interfaces:**
- Consumes: `posts: Post[]` com `cover`
- Produces: grade 1 col / `lg:grid-cols-2`, card link com imagem 16:10

- [ ] **Step 1: Create CoverGrid**

```astro
---
import { Image } from "astro:assets";
import type { Post } from "@/content.config";
import { formatDate, listingDescription } from "@/lib/listing";
import { getPostMeta } from "@/lib/postMeta";
import { ExternalLinkIcon } from "lucide-react";

interface Props {
	posts: Post[];
}

const { posts } = Astro.props;

const items = await Promise.all(
	posts.map(async (post) => ({
		post,
		meta: await getPostMeta(post),
		excerpt: listingDescription(post),
	})),
);
---

{
	items.length > 0 ? (
		<ul class="m-0 grid list-none grid-cols-1 gap-md p-0 lg:grid-cols-2">
			{items.map(({ post, meta, excerpt }) => (
				<li
					data-search-text={`${post.title} ${excerpt ?? ""} ${meta.typeLabel}`.toLowerCase()}
				>
					<a
						href={meta.href}
						class="focus-ring group flex flex-col gap-2xs no-underline"
						title={post.title}
						{...(meta.external
							? { target: "_blank", rel: "noopener noreferrer" }
							: {})}
					>
						<Image
							src={post.cover}
							alt=""
							width={640}
							height={400}
							class="aspect-16/10 w-full rounded-[var(--radius-card)] object-cover"
							loading="lazy"
							decoding="async"
						/>
						<span class="flex items-center gap-2xs font-medium text-ink wrap-anywhere group-hover:text-accent">
							<span>{post.title}</span>
							{meta.external ? (
								<ExternalLinkIcon className="size-3.5 shrink-0 text-muted" />
							) : null}
						</span>
						{excerpt ? (
							<span class="line-clamp-2 text-sm leading-normal text-muted wrap-anywhere">
								{excerpt}
							</span>
						) : null}
						<span class="text-sm text-muted">
							{meta.typeLabel}
							{" · "}
							<time datetime={post.date.toISOString()}>
								{formatDate(post.date)}
							</time>
						</span>
					</a>
				</li>
			))}
		</ul>
	) : null
}
```

Sem sombra pesada, sem borda de card empilhada além do radius na imagem.

- [ ] **Step 2: Wire ListingLayout**

Na branch de seção (`!isHome`), trocar `<IndexList posts={recentPosts} />` por `<CoverGrid posts={recentPosts} />`. Home permanece `IndexList`.

Importar `CoverGrid` no topo do arquivo.

Manter `data-index-section` e empty/search como estão (busca continua via `data-search-text` nos `<li>`).

- [ ] **Step 3: Verify pages**

Run: `npm run dev`
- `/` → linhas + thumb
- `/app` → grade
- `/post` → grade
- `/link` → grade

Run: `npm run build && npm run lint`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add src/components/ui/CoverGrid.astro src/components/layout/ListingLayout.astro
git commit -m "$(cat <<'EOF'
feat(listings): grade com capa nas seções dedicadas

EOF
)"
```

---

### Task 9: `design.md`, `tools.md`, `README`

**Files:**
- Modify: `design.md`
- Modify: `tools.md`
- Modify: `README.md`

**Interfaces:**
- Produces: docs alinhados ao Media Index

- [ ] **Step 1: Update design.md**

Alterações mínimas e explícitas:
- Genre/macrostructure: Index-First → **Media Index**
- Hub e listagens: home = linhas com thumb; seções = grade com capa
- Remover “Sem enrichment” / “tipografia + lista”
- Manter tokens, tipografia, nav, footer none, acento ≤ 5%
- Atualizar header comment em `src/styles/tokens.css` se citar Index-First

- [ ] **Step 2: Update tools.md**

No passo do post Markdown, exigir:

```yaml
cover: "../../../assets/covers/tools/<slug>.webp"
```

E instruir: screenshot da UI em `src/assets/covers/tools/<slug>.webp` (~16:10 WebP).

- [ ] **Step 3: Update README**

Na seção Design / Conteúdo, uma frase: listagens usam capas (screenshot / editorial / OG commitado).

- [ ] **Step 4: Commit**

```bash
git add design.md tools.md README.md src/styles/tokens.css
git commit -m "$(cat <<'EOF'
docs: alinhar design system ao Media Index

EOF
)"
```

---

### Task 10: Verificação final

**Files:** nenhuma criação nova

- [ ] **Step 1: Full suite**

```bash
npm test
npm run lint
npm run build
```

Expected: tudo PASS / build SUCCESS

- [ ] **Step 2: Checklist manual**

- [ ] Home: thumbs + meta
- [ ] `/app` `/post` `/link`: grade 2 cols em viewport `lg`
- [ ] Busca ainda filtra itens (`data-search-text`)
- [ ] Links externos abrem em nova aba
- [ ] Nenhum post sem `cover` no frontmatter

- [ ] **Step 3: Commit vazio não criar**

Se só houver ajustes finais de bugfix, commit convencional `fix(listings): ...`. Senão, encerrar.

---

## Spec coverage (self-review)

| Spec | Task |
|------|------|
| Home linhas + thumb | 7 |
| Seções grade 2 cols `lg` | 8 |
| Tools screenshot / notes IA / links OG commitado | 3–5 |
| `cover` obrigatório + assets path | 1, 2, 6 |
| Identidade preservada | 9 (design.md) + UI sem rebrand |
| Sem fetch OG no build | 5 (manual) |
| `alt=""` | 7, 8 |
| Migração todos os posts | 3–6 |
| `tools.md` / docs | 9 |
| Fora de escopo (hero, rebrand, automação) | não há task |

## Type consistency

- `CoverPostType` / `Post["type"]`: `tool` \| `note` \| `link`
- Frontmatter path sempre via `coverFrontmatterPath`
- `Post.cover` vira obrigatório na Task 6; UI Tasks 7–8 assumem obrigatório (rodar depois da 6)
