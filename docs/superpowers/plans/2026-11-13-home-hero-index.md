# Home Hero + Índice (Direção A) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesignar `/` com hero cinematográfico leve, rails de seções, Recente (`CoverGrid`), destaque de tool, teaser de notas e CTA do autor, sem sair da DNA paper/teal/Hanken.

**Architecture:** Home deixa de usar o ramo `isHome` de `ListingLayout` e passa a ser montada em `index.astro` com `MainLayout` + componentes em `src/components/home/`. Dados estáticos (copy/assets) nos componentes. Recente via `loadPosts()`. Destaque via `HOME_FEATURED_TOOL_SLUG` + `resolveFeaturedTool`. Listagens `/post` `/app` `/link` inalteradas.

**Tech Stack:** Astro 7, `astro:assets` `Image`, Tailwind v4 + tokens do hub, Vitest para helpers puros.

## Global Constraints

- Spec: `docs/superpowers/specs/2026-11-13-home-hero-index-design.md`
- Identidade: papel quente, teal, Hanken (não rebrandar. Sem Direção C)
- Layout: coluna até `md`. Multi-coluna só a partir de `lg`
- Acento teal ≤ ~5% do viewport
- Sem footer de site
- Copy em português brasileiro. Sem em dash / en dash
- Sem `any`. Sem `@ts-ignore` / `@ts-nocheck`
- Imagens decorativas: `alt=""`
- Commits: Conventional Commits em português. Só commit quando o usuário autorizar o passo (ou a sessão pedir commit)

## File structure

| File | Responsibility |
|------|----------------|
| `src/content/site.ts` | `HOME_FEATURED_TOOL_SLUG` + copy/constants da home se útil |
| `src/lib/homeFeatured.ts` | `resolveFeaturedTool(posts, slug)` |
| `src/lib/homeFeatured.test.ts` | Testes do resolver |
| `src/assets/home/hero.webp` | Fundo full-bleed do hero |
| `src/assets/home/rail-tools.webp` | Metáfora Rails · Ferramentas |
| `src/assets/home/rail-notes.webp` | Metáfora Rails · Notas |
| `src/assets/home/rail-links.webp` | Metáfora Rails · Links |
| `src/assets/home/notes-teaser.webp` | Side-image do teaser Notas |
| `src/components/home/HomeHero.astro` | Hero full-bleed + CTAs |
| `src/components/home/HomeRails.astro` | Painéis Ferramentas / Notas / Links |
| `src/components/home/HomeFeatured.astro` | Destaque condicional de tool |
| `src/components/home/HomeNotesTeaser.astro` | Teaser `/post` |
| `src/components/home/HomeAuthorCta.astro` | CTA autor + GitHub |
| `src/pages/index.astro` | Orquestra home completa |
| `src/components/layout/ListingLayout.astro` | Remove ramo `isHome` (só seções) |
| `src/styles/global.css` | `scroll-behavior` com respeito a reduced-motion |
| `design.md` | Macrostructure da home atualizada |

Assets de art direction da sessão (referência visual, não paths do repo): `home-a-01-hero` … `home-a-06-cta`. Na Task 2, gerar WebP editoriais alinhados à Direção A (papel/teal) ou converter referências. Placeholder aceitável: crop temporário de capa existente, desde que o path final seja o da tabela.

Slug inicial de destaque: `criador-de-curriculos` (tool existente). Troca só em `site.ts`.

---

### Task 1: Config + `resolveFeaturedTool`

**Files:**
- Modify: `src/content/site.ts`
- Create: `src/lib/homeFeatured.ts`
- Create: `src/lib/homeFeatured.test.ts`

**Interfaces:**
- Produces: `HOME_FEATURED_TOOL_SLUG: string`
- Produces: `resolveFeaturedTool(posts: Post[], slug: string): Post | null` (retorna o post se `type === "tool"` e `slug` bater. Caso contrário `null`)

- [ ] **Step 1: Write the failing test**

```ts
// src/lib/homeFeatured.test.ts
import { describe, expect, it } from "vitest";
import type { Post } from "@/content.config";
import { resolveFeaturedTool } from "./homeFeatured";

const cover = {
	src: "/_astro/x.webp",
	width: 1200,
	height: 750,
	format: "webp" as const,
};

function tool(slug: string, title = slug): Post {
	return {
		slug,
		type: "tool",
		title,
		date: new Date("2026-01-01"),
		description: "desc",
		cover,
	};
}

describe("resolveFeaturedTool", () => {
	it("retorna o tool cujo slug bate", () => {
		const posts = [tool("goal-quest"), tool("criador-de-curriculos", "Criador de currículos")];
		const found = resolveFeaturedTool(posts, "criador-de-curriculos");
		expect(found?.title).toBe("Criador de currículos");
	});

	it("retorna null se o slug não existir", () => {
		expect(resolveFeaturedTool([tool("goal-quest")], "sumido")).toBeNull();
	});

	it("retorna null se o slug existir mas não for tool", () => {
		const note: Post = {
			slug: "uma-nota",
			type: "note",
			title: "Nota",
			date: new Date("2026-01-01"),
			cover,
		};
		expect(resolveFeaturedTool([note], "uma-nota")).toBeNull();
	});
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/lib/homeFeatured.test.ts`
Expected: FAIL (módulo inexistente)

- [ ] **Step 3: Write minimal implementation**

```ts
// src/content/site.ts (acrescentar)
export const HOME_FEATURED_TOOL_SLUG = "criador-de-curriculos";
```

```ts
// src/lib/homeFeatured.ts
import type { Post } from "@/content.config";

export function resolveFeaturedTool(posts: Post[], slug: string): Post | null {
	const match = posts.find((post) => post.slug === slug);
	if (!match || match.type !== "tool") return null;
	return match;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- src/lib/homeFeatured.test.ts`
Expected: PASS

- [ ] **Step 5: Commit** (só se o usuário autorizar)

```bash
git add src/content/site.ts src/lib/homeFeatured.ts src/lib/homeFeatured.test.ts
git commit -m "$(cat <<'EOF'
feat(home): resolver tool em destaque por slug

EOF
)"
```

---

### Task 2: Assets estáticos da home

**Files:**
- Create: `src/assets/home/hero.webp`
- Create: `src/assets/home/rail-tools.webp`
- Create: `src/assets/home/rail-notes.webp`
- Create: `src/assets/home/rail-links.webp`
- Create: `src/assets/home/notes-teaser.webp`

**Interfaces:**
- Produces: cinco WebP importáveis por `astro:assets`
- Direção: papel quente, metáforas editoriais planas (não screenshot de UI nas rails/teaser). Hero: arquitetura/luz suave adequada a overlay claro

- [ ] **Step 1: Criar pasta e imagens**

```bash
mkdir -p src/assets/home
```

Gerar ou converter WebP (largura sugerida 1600–2400px para hero. Rails/teaser ~1200px). Se a geração por IA não estiver disponível nesta sessão, copiar temporariamente capas existentes e renomear, depois substituir por arte final alinhada às refs `home-a-*`.

Exemplo de cópia temporária (substituir depois):

```bash
cp src/assets/covers/tools/criador-de-curriculos.webp src/assets/home/hero.webp
cp src/assets/covers/tools/ferramentas-de-imagem.webp src/assets/home/rail-tools.webp
cp src/assets/covers/notes/astro-vs-nextjs-o-custo-da-preguica-no-vibe-coding.webp src/assets/home/rail-notes.webp
cp src/assets/covers/links/design-prompts.webp src/assets/home/rail-links.webp
cp src/assets/covers/notes/a-falacia-da-api-fullstack-use-hono-e-nestjs.webp src/assets/home/notes-teaser.webp
```

- [ ] **Step 2: Confirmar arquivos**

Run: `ls -la src/assets/home`
Expected: os cinco `.webp` listados

- [ ] **Step 3: Commit** (só se o usuário autorizar)

```bash
git add src/assets/home
git commit -m "$(cat <<'EOF'
chore(home): adicionar assets estáticos do hero e rails

EOF
)"
```

---

### Task 3: `HomeHero` + scroll suave

**Files:**
- Create: `src/components/home/HomeHero.astro`
- Modify: `src/styles/global.css`

**Interfaces:**
- Consumes: `src/assets/home/hero.webp`, copy do spec
- Produces: âncora `#recente` via `<a href="#recente">`. Link `/app` no CTA secundário

- [ ] **Step 1: Adicionar scroll-behavior em `global.css`**

Dentro de `@layer base`, no bloco `html` existente (ou estendendo-o):

```css
html {
	scrollbar-gutter: stable;
	scroll-behavior: smooth;
}

@media (prefers-reduced-motion: reduce) {
	html {
		scroll-behavior: auto;
	}
}
```

Manter o bloco `prefers-reduced-motion` que zera `--dur-*` (não duplicar a media query se já existir. Fundir regras no mesmo `@media`).

- [ ] **Step 2: Criar `HomeHero.astro`**

```astro
---
import { Image } from "astro:assets";
import heroImage from "@/assets/home/hero.webp";
---

<section
	class="relative isolate flex min-h-[70vh] max-h-[90vh] items-end overflow-hidden"
	aria-labelledby="home-hero-heading"
>
	<Image
		src={heroImage}
		alt=""
		class="absolute inset-0 -z-20 size-full object-cover"
		widths={[960, 1440, 1920]}
		sizes="100vw"
		loading="eager"
		fetchpriority="high"
		decoding="async"
	/>
	<div
		class="absolute inset-0 -z-10 bg-linear-to-t from-paper via-paper/80 to-paper/35"
		aria-hidden="true"
	/>

	<div class="container-page flex w-full flex-col gap-sm pb-xl pt-3xl">
		<p class="m-0 text-xs font-medium tracking-label text-muted uppercase">
			Hub técnico
		</p>
		<h1
			id="home-hero-heading"
			class="m-0 max-w-measure font-display text-display font-semibold leading-tight tracking-display text-ink"
		>
			Arquitetura web e ferramentas
		</h1>
		<p class="m-0 max-w-measure text-md text-muted">
			Notas de um desenvolvedor
		</p>
		<div class="mt-xs flex flex-wrap items-center gap-md">
			<a
				href="#recente"
				class="focus-ring text-sm font-medium text-accent no-underline hover:underline"
			>
				Ver recente →
			</a>
			<a
				href="/app"
				class="focus-ring inline-flex min-h-11 items-center rounded-input border border-rule px-sm text-sm text-ink no-underline hover:border-accent"
			>
				Abrir ferramentas
			</a>
		</div>
	</div>
</section>
```

Ajustar classes de gradiente ao que o Tailwind v4 do projeto aceitar (`bg-gradient-to-t` vs `bg-linear-to-t`). Preferir o padrão já usado no repo se houver. Overlay deve deixar texto legível.

- [ ] **Step 3: Smoke visual**

Run: montar temporariamente o hero em `index.astro` (ou pular e integrar na Task 5) e `npm run dev`. Conferir overlay e CTAs.

- [ ] **Step 4: Commit** (só se o usuário autorizar)

```bash
git add src/components/home/HomeHero.astro src/styles/global.css
git commit -m "$(cat <<'EOF'
feat(home): adicionar hero full-bleed com CTAs

EOF
)"
```

---

### Task 4: `HomeRails`

**Files:**
- Create: `src/components/home/HomeRails.astro`

**Interfaces:**
- Consumes: `rail-tools.webp`, `rail-notes.webp`, `rail-links.webp`
- Produces: links `/app`, `/post`, `/link` com labels Ferramentas / Notas / Links

- [ ] **Step 1: Criar componente**

```astro
---
import { Image } from "astro:assets";
import railTools from "@/assets/home/rail-tools.webp";
import railNotes from "@/assets/home/rail-notes.webp";
import railLinks from "@/assets/home/rail-links.webp";

const rails = [
	{ href: "/app", label: "Ferramentas", image: railTools },
	{ href: "/post", label: "Notas", image: railNotes },
	{ href: "/link", label: "Links", image: railLinks },
] as const;
---

<section class="container-page py-2xl" aria-label="Seções do hub">
	<ul class="m-0 grid list-none grid-cols-1 gap-md p-0 lg:grid-cols-3 lg:gap-lg">
		{
			rails.map((rail, index) => (
				<li class:list={[index === 1 && "lg:mt-lg", index === 2 && "lg:mt-sm"]}>
					<a
						href={rail.href}
						class="focus-ring group flex flex-col gap-sm no-underline"
					>
						<span class="overflow-hidden rounded-card border border-rule">
							<Image
								src={rail.image}
								alt=""
								class="aspect-square w-full object-cover transition-opacity duration-150 ease-out group-hover:opacity-90"
								widths={[400, 800]}
								sizes="(min-width: 1024px) 30vw, 100vw"
								loading="lazy"
								decoding="async"
							/>
						</span>
						<span class="text-md font-medium text-ink group-hover:text-accent">
							{rail.label} →
						</span>
					</a>
				</li>
			))
		}
	</ul>
</section>
```

Offset `lg:mt-*` dá o masonry leve do spec. Sem sombra pesada.

- [ ] **Step 2: Commit** (só se o usuário autorizar)

```bash
git add src/components/home/HomeRails.astro
git commit -m "$(cat <<'EOF'
feat(home): adicionar rails editoriais de seções

EOF
)"
```

---

### Task 5: Montar shell da home (Hero + Rails + Recente) e limpar `ListingLayout`

**Files:**
- Modify: `src/pages/index.astro`
- Modify: `src/components/layout/ListingLayout.astro`

**Interfaces:**
- Consumes: `HomeHero`, `HomeRails`, `CoverGrid`, `loadPosts`, `MainLayout`, `SEOLayout`
- Produces: `/` com `#recente` e busca da nav ainda filtrando `data-search-text` da grade

- [ ] **Step 1: Reescrever `index.astro`**

```astro
---
import HomeHero from "@/components/home/HomeHero.astro";
import HomeRails from "@/components/home/HomeRails.astro";
import MainLayout from "@/components/layout/MainLayout.astro";
import SEOLayout from "@/components/layout/SEOLayout.astro";
import CoverGrid from "@/components/ui/CoverGrid.astro";
import { SITE_NAME } from "@/content/site";
import { loadPosts } from "@/lib/listing";

const recentPosts = await loadPosts();
---

<SEOLayout title={SITE_NAME}>
	<MainLayout activeCategory="all">
		<HomeHero />
		<HomeRails />

		<div class="container-page flex flex-col gap-xl py-lg pb-3xl">
			<section
				id="recente"
				class="flex flex-col gap-sm scroll-mt-lg"
				data-index-section
				aria-labelledby="rail-recente"
			>
				<h2
					id="rail-recente"
					class="m-0 text-sm font-medium text-muted"
				>
					Recente
				</h2>
				{
					recentPosts.length ? (
						<CoverGrid posts={recentPosts} />
					) : (
						<p class="m-0 text-muted">Por enquanto não há publicações.</p>
					)
				}
			</section>

			<div id="search-empty" class="hidden py-md text-muted">
				<p class="m-0">
					Nenhum resultado para <span id="search-empty-term" />.
				</p>
				<button
					type="button"
					id="search-clear"
					class="mt-sm inline-flex min-h-11 items-center border-0 bg-transparent p-0 text-sm text-accent hover:underline"
				>
					Limpar busca
				</button>
			</div>
		</div>
	</MainLayout>
</SEOLayout>
```

Manter `#search-empty` / `#search-clear` / `#search-empty-term` se `listingSearch` depender deles (conferir `src/lib/client/listingSearch.ts` e espelhar o markup necessário).

- [ ] **Step 2: Remover ramo `isHome` de `ListingLayout.astro`**

`ListingLayout` fica só para seções (`activeCategory !== "all"`). Remover imports/`SITE_TAGLINE`/branch home. Páginas `/post` `/app` `/link` continuam passando posts tipados.

Garantir que nenhuma página ainda chama `ListingLayout` com `activeCategory="all"`.

- [ ] **Step 3: Verificar listagens e home**

Run: `npm run lint`
Expected: sem erros novos

Run: `npm run dev` e abrir `/`, `/app`, `/post`, `/link`
Expected: home com hero+rails+recente. Seções iguais a antes.

- [ ] **Step 4: Commit** (só se o usuário autorizar)

```bash
git add src/pages/index.astro src/components/layout/ListingLayout.astro
git commit -m "$(cat <<'EOF'
feat(home): montar shell com hero, rails e recente

EOF
)"
```

---

### Task 6: `HomeFeatured`

**Files:**
- Create: `src/components/home/HomeFeatured.astro`
- Modify: `src/pages/index.astro`

**Interfaces:**
- Consumes: `Post` (tool), `getPostMeta` ou href `/app/${slug}`
- Props: `post: Post` (pai só renderiza se `resolveFeaturedTool` ≠ `null`)

- [ ] **Step 1: Criar componente**

```astro
---
import { Image } from "astro:assets";
import type { Post } from "@/content.config";
import { listingDescription } from "@/lib/listing";

interface Props {
	post: Post;
}

const { post } = Astro.props;
const href = `/app/${post.slug}`;
const excerpt = listingDescription(post);
---

<section
	class="container-page grid grid-cols-1 items-center gap-lg py-2xl lg:grid-cols-2"
	aria-labelledby="home-featured-heading"
>
	<a href={href} class="focus-ring overflow-hidden rounded-card border border-rule no-underline">
		<Image
			src={post.cover}
			alt=""
			class="aspect-16/10 w-full object-cover"
			widths={[640, 960]}
			sizes="(min-width: 1024px) 45vw, 100vw"
			loading="lazy"
			decoding="async"
		/>
	</a>
	<div class="flex flex-col gap-sm">
		<p class="m-0 text-xs font-medium tracking-label text-accent uppercase">
			Em destaque
		</p>
		<h2
			id="home-featured-heading"
			class="m-0 font-display text-xl font-semibold tracking-display text-ink"
		>
			{post.title}
		</h2>
		{
			excerpt ? (
				<p class="m-0 max-w-measure text-md text-muted">{excerpt}</p>
			) : null
		}
		<a
			href={href}
			class="focus-ring inline-flex min-h-11 w-fit items-center rounded-input bg-accent px-sm text-sm font-medium text-accent-ink no-underline"
		>
			Abrir ferramenta
		</a>
	</div>
</section>
```

- [ ] **Step 2: Integrar em `index.astro`**

```astro
---
import HomeFeatured from "@/components/home/HomeFeatured.astro";
import { HOME_FEATURED_TOOL_SLUG } from "@/content/site";
import { resolveFeaturedTool } from "@/lib/homeFeatured";
// ...
const featured = resolveFeaturedTool(recentPosts, HOME_FEATURED_TOOL_SLUG);
---

{/* depois de #recente, ainda dentro do fluxo da página */}
{featured ? <HomeFeatured post={featured} /> : null}
```

- [ ] **Step 3: Teste manual de omissão**

Temporariamente setar `HOME_FEATURED_TOOL_SLUG = "nao-existe"`, recarregar `/`, confirmar que a seção some. Restaurar `criador-de-curriculos`.

- [ ] **Step 4: Commit** (só se o usuário autorizar)

```bash
git add src/components/home/HomeFeatured.astro src/pages/index.astro
git commit -m "$(cat <<'EOF'
feat(home): adicionar seção de ferramenta em destaque

EOF
)"
```

---

### Task 7: `HomeNotesTeaser` + `HomeAuthorCta`

**Files:**
- Create: `src/components/home/HomeNotesTeaser.astro`
- Create: `src/components/home/HomeAuthorCta.astro`
- Modify: `src/pages/index.astro`

**Interfaces:**
- Consumes: `notes-teaser.webp`, `AUTHOR` de `src/content/author.ts`
- Produces: links `/post`, `/autor`, GitHub externo

- [ ] **Step 1: Criar `HomeNotesTeaser.astro`**

```astro
---
import { Image } from "astro:assets";
import notesTeaser from "@/assets/home/notes-teaser.webp";
---

<section
	class="container-page grid grid-cols-1 items-center gap-lg py-2xl lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]"
	aria-labelledby="home-notes-heading"
>
	<div class="flex flex-col gap-sm lg:order-1">
		<p class="m-0 text-xs font-medium tracking-label text-muted uppercase">
			Notas
		</p>
		<h2
			id="home-notes-heading"
			class="m-0 font-display text-xl font-semibold tracking-display text-ink"
		>
			Arquitetura em texto curto
		</h2>
		<a
			href="/post"
			class="focus-ring text-sm font-medium text-accent no-underline hover:underline"
		>
			Ler notas →
		</a>
	</div>
	<div class="overflow-hidden rounded-card border border-rule lg:order-2">
		<Image
			src={notesTeaser}
			alt=""
			class="aspect-16/10 w-full object-cover"
			widths={[640, 960]}
			sizes="(min-width: 1024px) 50vw, 100vw"
			loading="lazy"
			decoding="async"
		/>
	</div>
</section>
```

- [ ] **Step 2: Criar `HomeAuthorCta.astro`**

```astro
---
import { AUTHOR } from "@/content/author";

const github = AUTHOR.links.find((link) => link.label === "GitHub");
---

<section
	class="container-page flex flex-col items-center gap-sm py-3xl text-center"
	aria-labelledby="home-author-heading"
>
	<p class="m-0 text-xs font-medium tracking-label text-muted uppercase">
		Autor
	</p>
	<h2
		id="home-author-heading"
		class="m-0 font-display text-display-s font-semibold tracking-display text-ink"
	>
		{AUTHOR.name}
	</h2>
	<p class="m-0 max-w-measure text-md text-muted">
		{AUTHOR.role}
	</p>
	<div class="mt-sm flex flex-wrap items-center justify-center gap-md">
		<a
			href="/autor"
			class="focus-ring inline-flex min-h-11 items-center rounded-input border border-rule px-sm text-sm text-ink no-underline hover:border-accent"
		>
			Conhecer o autor
		</a>
		{
			github ? (
				<a
					href={github.href}
					class="focus-ring text-sm text-accent no-underline hover:underline"
					target="_blank"
					rel="noopener noreferrer"
				>
					GitHub
				</a>
			) : null
		}
	</div>
</section>
```

- [ ] **Step 3: Anexar após Featured em `index.astro`**

```astro
import HomeNotesTeaser from "@/components/home/HomeNotesTeaser.astro";
import HomeAuthorCta from "@/components/home/HomeAuthorCta.astro";
// ...
<HomeNotesTeaser />
<HomeAuthorCta />
```

- [ ] **Step 4: Commit** (só se o usuário autorizar)

```bash
git add src/components/home/HomeNotesTeaser.astro src/components/home/HomeAuthorCta.astro src/pages/index.astro
git commit -m "$(cat <<'EOF'
feat(home): adicionar teaser de notas e CTA do autor

EOF
)"
```

---

### Task 8: `design.md` + verificação final

**Files:**
- Modify: `design.md`

**Interfaces:**
- Nenhuma API de código. Documenta a home nova para próximos agentes

- [ ] **Step 1: Atualizar `design.md`**

Em Macrostructure / Hub e listagens / Home:

- Trocar “Sem hero de marketing” por permissão explícita: home pode ter hero full-bleed + rails + destaque + teaser + CTA autor. Listagens continuam Media Index sem hero.
- Em “What pages MAY differ on”, atualizar bullet da Home para a ordem dos 6 blocos.
- Manter: acento ≤ 5%, sem footer, nav compacta, capas obrigatórias.

- [ ] **Step 2: Verificação de aceite**

Run:

```bash
npm test
npm run lint
npm run build
```

Expected: testes verdes. `astro check`/biome limpos. Build OK.

Checklist manual (`npm run dev`):

1. `/` mostra Hero → Rails → Recente → Destaque → Notas → Autor (Destaque some se slug inválido)
2. DNA paper/teal/Hanken e nav/busca intactas
3. `Ver recente` scrolla até `#recente`. `Abrir ferramentas` → `/app`
4. Rails → `/app` `/post` `/link`
5. Recente = mesma `CoverGrid`
6. Autor → `/autor`. GitHub externo correto
7. Mobile: stacks legíveis
8. `prefers-reduced-motion`: scroll sem smooth (DevTools)
9. `/post` `/app` `/link` sem regressão

- [ ] **Step 3: Commit** (só se o usuário autorizar)

```bash
git add design.md
git commit -m "$(cat <<'EOF'
docs(design): documentar home com hero e índice

EOF
)"
```

---

## Spec coverage (self-review)

| Requisito do spec | Task |
|-------------------|------|
| Hero full-bleed bottom-left + CTAs | 3, 5 |
| Rails Apps/Notas/Links | 4, 5 |
| Recente + CoverGrid + empty state | 5 |
| Destaque por slug + omitir se ausente | 1, 6 |
| Teaser Notas | 7 |
| CTA autor + GitHub | 7 |
| DNA paper/teal/Hanken | Global + todas UI tasks |
| Sem Direção C / sem footer / listagens intactas | Global, 5, 8 |
| `prefers-reduced-motion` | 3, 8 |
| Atualizar `design.md` | 8 |
| Assets em `src/assets/home/` | 2 |

Placeholders: nenhum TBD. CTA secundário unificado em `Abrir ferramentas`. Slug inicial explícito: `criador-de-curriculos`.
