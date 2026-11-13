# Design · Hub de conteúdo técnico

Sistema visual locked para o hub. Páginas leem este arquivo antes de emitir código.

## Genre

modern-minimal (índice com mídia; não landing Stripe, não editorial puro)

## Macrostructure family

- **Hub e listagens** (`/`, `/post`, `/app`, `/link`): Media Index. Capas commitadas no repo. Seções em grade de cards com capa 16:10. Home (`/`): Hero full-bleed + rails editoriais + Recente (`CoverGrid`) + destaque de tool + teaser de notas + CTA autor. Listagens sem hero.
- **Content pages** (`/post/[slug]`, `/autor`): Long Document. Notas usam `--page-max`; tipografia contínua.
- **App pages** (`/app/[slug]`): Workbench. Chrome mínimo, a ferramenta carrega a página.

## Theme

Index: papel quente quase branco · acento teal · display geométrico

- `--color-paper`   oklch(97% 0.008 50)
- `--color-paper-2` oklch(94.5% 0.01 50)
- `--color-paper-3` oklch(91% 0.012 48)
- `--color-ink`     oklch(18% 0.022 42)
- `--color-ink-2`   oklch(24% 0.018 42)
- `--color-muted`   oklch(46% 0.014 42)
- `--color-rule`    oklch(88% 0.012 50)
- `--color-accent`  oklch(48% 0.09 180)
- `--color-focus`   oklch(48% 0.09 180)

## Typography

- Display: Hanken Grotesk, weight 600, normal
- Body: Hanken Grotesk, weight 400
- Mono: IBM Plex Mono, weight 400 (código, não chrome)
- Display tracking: -0.014em
- Type scale anchor: `--text-display` = clamp(2.25rem, 3.5vw + 1rem, 3.75rem)
- Wordmark em `text-lg`. Títulos de seção em `text-xl` no máximo. Home hero pode usar `--text-display`. Demais listagens não usam display size.

## Spacing

Escala 4pt nomeada em `src/styles/tokens.css`. Usar `var(--space-*)`, nunca valores crus.
`--page-max` do hub: 56rem. `--section-gap`: 2.5rem.

## Motion

- Easings: `--ease-out`, `--ease-in`, `--ease-in-out`
- Reveal: none
- Home: `scroll-behavior: smooth` no `html`. Com `prefers-reduced-motion`: `auto`
- Reduced-motion: opacity-only, ≤ 150ms. Zerar `--dur-*`

## Microinteractions stance

- Silent success
- Hover delay 800ms em tooltips · focus delay 0ms
- Título da listagem muda para acento no hover. Card = link inteiro com borda `--color-rule`, sem sombra pesada.

## CTA voice

- Primary no hub (listagens): o próprio card da listagem
- Home: link tipográfico com seta (`Ver recente`) + ghost/outline (`Abrir ferramentas`). Destaque usa botão filled acento
- Apps: botão filled acento, cantos `--radius-input`
- Secondary: link tipográfico

## Per-page allowances

- Home: tipografia + capa + hero full-bleed + metáforas estáticas em `src/assets/home/`
- Listagens `/post` `/app` `/link`: tipografia + capa (Media Index)
- Content pages: tipografia only
- App pages: sem enrichment

## What pages MUST share

- Wordmark `dev.andreximenes` alinhado à esquerda, tamanho de texto
- Acento teal ≤ 5% por viewport (foco, link ativo, hover de título)
- Hanken Grotesk + IBM Plex Mono
- Nav compacta (wordmark · seções · busca)
- Sem footer de site (RSS fica no `<link rel="alternate">` do head)
- Layout em coluna até `md`; `flex-row` / multi-coluna só a partir de `lg`
- Todo post publicado tem `cover` (WebP em `src/assets/covers/<type>/<slug>.webp`)
- Capas de tools: editorial plana (metáfora literal), não screenshot; notes: editorial; links: OG/screenshot do destino

## What pages MAY differ on

- Home: Hero → Rails (Ferramentas / Notas / Links) → Recente (`CoverGrid`) → Destaque (slug em `HOME_FEATURED_TOOL_SLUG`) → Teaser Notas → CTA autor. Sem footer.
- `/post` `/app` `/link`: grade 1 coluna / 2 colunas em `lg`, capa 16:10
- Chrome de ferramenta (back link + slot da app)

## Nav

Compacta, borda inferior `--color-rule`. Sem masthead, sem small caps, sem regra dupla. Busca com borda `--color-rule`; foco usa acento.
Até `md`: wordmark + botão de menu + busca; links no drawer lateral.
A partir de `lg`: wordmark · seções · busca em linha.

## Footer

Nenhum. Índice e conteúdo terminam na lista ou no artigo.

## Exports

Ver `src/styles/tokens.css` para tokens.css canônico.
