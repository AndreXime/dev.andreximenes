# Home · Hero + índice (Direção A)

Redesign da home `/` do hub `dev.andreximenes`: abertura cinematográfica leve + índice recente, mantendo DNA visual (papel quente, teal, Hanken Grotesk, Media Index). Não é a Direção C (dark/âmbar).

## Objetivo

Dar presença de marca no primeiro viewport sem abandonar o hub. Visitante entende o site em segundos, desce para o catálogo recente e encontra atalhos claros para Apps, Notas, Links e Autor.

## Decisões fechadas

| Tema | Decisão |
|------|---------|
| Estrutura | Mix: hero forte + índice recente (opção C de fluxo) |
| Visual | Direção A: DNA atual (papel / teal / grotesk) |
| Seções | 6 blocos na home, na ordem abaixo |
| Identidade | Mantém tokens, tipografia, nav, acento teal ≤ ~5% |
| Destaque | Slug de tool explícito em config (`site.ts`) |
| Destaque ausente | Omitir a seção inteira |
| Listagens `/post` `/app` `/link` | Inalteradas |
| Footer de site | Continua inexistente |

## Fora de escopo

- Dark mode, nova palette, tipografia Monument/serif, acento âmbar
- Mudança de layout em `/post/[slug]`, `/autor`, chrome de `/app/[slug]`
- Footer sitemap, logo wall, KPIs, pills de marketing no hero
- Parallax agressivo (respeitar `prefers-reduced-motion`)

## Macroestrutura da home (`/`)

Atualiza a home em `design.md` de “só tagline + Recente” para:

1. **Hero**
2. **Rails** (Apps · Notas · Links)
3. **Recente** (`#recente`, `CoverGrid`)
4. **Destaque** (tool fixado por config)
5. **Notas** (teaser editorial)
6. **CTA autor**

Seções `/post`, `/app`, `/link` e o restante do sistema Media Index permanecem.

### 1. Hero

- Altura ~70–90vh, imagem full-bleed com overlay claro (tinta escura legível)
- Âncora: texto no canto inferior esquerdo (não split left-text / right-image)
- Conteúdo: label `HUB TÉCNICO`, H1 curto (6–8 palavras), uma linha de apoio (tagline ou variante), dois CTAs
- CTA primário `Ver recente`: scroll suave até `#recente`
- CTA secundário `Abrir ferramentas`: navega para `/app`
- Nav atual permanece no topo (wordmark · seções · busca)
- Sem badges, stats ou chips extras
- Motion: opcional e contida. Com `prefers-reduced-motion`, só opacity curta ou nenhuma animação

### 2. Rails (Apps · Notas · Links)

- Três painéis em offset editorial (masonry leve), não card genérico com sombra
- Cada painel: metáfora visual estática no repo + título + seta tipográfica
- Destinos: `/app`, `/post`, `/link` (labels alinhados à nav: Ferramentas / Notas / Links)
- Mobile: stack vertical na mesma ordem
- Borda hairline / corte tipográfico alinhado a `--color-rule`

### 3. Recente (`#recente`)

- Reusa `CoverGrid` e `loadPosts()` como hoje
- Label `Recente` + opcional uma linha de apoio
- Fundo paper sólido
- Empty state: mensagem atual (“Por enquanto não há publicações.”)
- Busca da nav continua filtrando itens da grade (comportamento existente)

### 4. Destaque

- Um post `kind: tool` cujo slug está em config (ex.: `HOME_FEATURED_TOOL_SLUG` em `src/content/site.ts`)
- Layout desktop: visual grande à esquerda (cover), copy à direita (label `EM DESTAQUE`, título, descrição, CTA `Abrir ferramenta`)
- Mobile: stack imagem → texto
- Se o slug não resolver no content: **omitir** a seção (sem fallback automático nesta versão)

### 5. Notas (teaser)

- Side-image editorial + headline + CTA `Ler notas` → `/post`
- Imagem estática no repo (não amarrada a um post específico)
- Densidade mais calma e arejada que o Destaque

### 6. CTA autor

- Bloco centrado, densidade mini
- Nome `André Ximenes`, uma linha de apoio, botão ghost `Conhecer o autor` → `/autor`
- Link secundário tipográfico `GitHub` → `https://github.com/AndreXime` (já em `AUTHOR.links`)
- Sem footer sitemap

## Arquitetura de componentes

| Peça | Papel |
|------|--------|
| `index.astro` | Orquestra seções da home (ou delega a um layout dedicado) |
| `HomeHero.astro` | Hero full-bleed + CTAs |
| `HomeRails.astro` | Três painéis Apps / Notas / Links |
| `CoverGrid.astro` | Intacta, usada em Recente |
| `HomeFeatured.astro` | Destaque de tool (render condicional) |
| `HomeNotesTeaser.astro` | Teaser Notas |
| `HomeAuthorCta.astro` | CTA autor |
| `ListingLayout.astro` | Continua nas listagens de seção. Home pode sair deste layout ou ganhar ramo `isHome` expandido |

Preferência: componentes Astro sob `src/components/home/`, tokens e utilitários existentes (`container-page`, cores, radius). Assets de hero/rails/notas em `src/assets/home/`.

### Dados

- Hero, Rails, Notas teaser, CTA autor: estáticos (copy + assets)
- Recente: `loadPosts()` (dinâmico)
- Destaque: resolve slug de config via collection de posts. Ausente → seção omitida

### Erros e vazios

- Feed recente vazio: empty state local, página sobe normal
- Slug de destaque inválido: omitir Destaque, demais seções intactas
- Imagens: commitadas no repo, otimizadas via `astro:assets`

## Atualização de `design.md`

Após implementação, ajustar:

- Home: de “Recente em grade” para “Hero + rails + Recente + destaque + teaser notas + CTA autor”
- Permitir enrichment visual só na home (full-bleed hero e metáforas estáticas), sem liberar marketing genérico nas listagens
- Manter: acento ≤ 5%, sem footer, nav compacta, Media Index nas seções

## Copy de partida (ajustável na implementação)

| Bloco | Texto |
|-------|--------|
| Hero label | HUB TÉCNICO |
| Hero H1 | Arquitetura web e ferramentas |
| Hero apoio | Notas de um desenvolvedor |
| Hero CTAs | Ver recente · Abrir ferramentas |
| Rails | Ferramentas · Notas · Links |
| Recente | Recente |
| Destaque label | EM DESTAQUE |
| Destaque CTA | Abrir ferramenta |
| Notas | Arquitetura em texto curto · Ler notas |
| Autor | André Ximenes · Conhecer o autor · GitHub |

## Critérios de aceite

1. `/` mostra os 6 blocos na ordem definida (Destaque só se o slug existir)
2. DNA visual intacta: paper, teal, Hanken, nav e busca
3. “Ver recente” leva a `#recente`. “Abrir ferramentas” leva a `/app`
4. Rails linkam corretamente para `/app`, `/post`, `/link`
5. Recente usa a mesma `CoverGrid` das listagens
6. CTA autor leva a `/autor`. GitHub abre o link oficial
7. Mobile: hero legível, rails em stack, destaque e notas em stack
8. `prefers-reduced-motion` respeitado
9. Listagens `/post` `/app` `/link` sem regressão de layout

## Referências visuais

Imagens geradas no brainstorm (Direção A), uma por seção:

- `home-a-01-hero` … `home-a-06-cta` (assets da sessão de art direction)

## Não fazer

- Copiar Direção C (dark / âmbar / display comprimido)
- Transformar a home em landing SaaS com pricing, FAQ ou marquee de logos
- Substituir a grade Recente por outro padrão de listagem nesta entrega
