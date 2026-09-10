# Design · Hub de conteúdo técnico

Sistema visual locked para o hub. Páginas leem este arquivo antes de emitir código.

## Genre

modern-minimal (índice utilitário; não landing Stripe, não editorial)

## Macrostructure family

- **Hub e listagens** (`/`, `/post`, `/app`, `/link`): Index-First. A lista é a página. Sem hero, sem cards de seção, sem tabela de jornal.
- **Content pages** (`/post/[slug]`, `/autor`): Long Document. Notas usam `--page-max`; tipografia contínua.
- **App pages** (`/app/[slug]`): Workbench. Chrome mínimo, a ferramenta carrega a página.

## Theme

Index: papel quente quase branco · acento laranja · display geométrico

- `--color-paper`   oklch(97% 0.008 50)
- `--color-paper-2` oklch(94.5% 0.01 50)
- `--color-paper-3` oklch(91% 0.012 48)
- `--color-ink`     oklch(18% 0.022 42)
- `--color-ink-2`   oklch(24% 0.018 42)
- `--color-muted`   oklch(46% 0.014 42)
- `--color-rule`    oklch(88% 0.012 50)
- `--color-accent`  oklch(58% 0.20 42)
- `--color-focus`   oklch(58% 0.20 42)

## Typography

- Display: Hanken Grotesk, weight 600, normal
- Body: Hanken Grotesk, weight 400
- Mono: IBM Plex Mono, weight 400 (código, não chrome)
- Display tracking: -0.014em
- Type scale anchor: `--text-display` = clamp(2.25rem, 3.5vw + 1rem, 3.75rem)
- Hub e listagens não usam display size. Wordmark em `text-lg`. Títulos de seção em `text-xl` no máximo.

## Spacing

Escala 4pt nomeada em `src/styles/tokens.css`. Usar `var(--space-*)`, nunca valores crus.
`--page-max` do hub: 56rem. `--section-gap`: 2.5rem.

## Motion

- Easings: `--ease-out`, `--ease-in`, `--ease-in-out`
- Reveal: none
- Reduced-motion: opacity-only, ≤ 150ms

## Microinteractions stance

- Silent success
- Hover delay 800ms em tooltips · focus delay 0ms
- Linha do índice: o título muda para acento no hover. Sem card empilhado.

## CTA voice

- Primary no hub: a própria linha da lista
- Apps: botão filled acento, cantos `--radius-input`
- Secondary: link tipográfico

## Per-page allowances

- Hub e listagens: tipografia + lista. Sem enrichment.
- Content pages: tipografia only
- App pages: sem enrichment

## What pages MUST share

- Wordmark `dev.andreximenes` alinhado à esquerda, tamanho de texto
- Acento laranja ≤ 5% por viewport (foco, link ativo, hover de título)
- Hanken Grotesk + IBM Plex Mono
- Nav compacta (wordmark · seções · busca)
- Sem footer de site (RSS fica no `<link rel="alternate">` do head)
- Layout em coluna até `md`; `flex-row` só a partir de `lg`

## What pages MAY differ on

- Home é só Recente (mistura ferramentas, notas e links por data)
- `/post` `/app` `/link` são o mesmo índice, filtrado
- Chrome de ferramenta (back link + slot da app)

## Nav

Compacta, borda inferior `--color-rule`. Sem masthead, sem small caps, sem regra dupla. Busca com borda `--color-rule`; foco usa acento.
Até `md`: wordmark + botão de menu + busca; links no drawer lateral.
A partir de `lg`: wordmark · seções · busca em linha.

## Footer

Nenhum. Índice e conteúdo terminam na lista ou no artigo.

## Exports

Ver `src/styles/tokens.css` para tokens.css canônico.
