# Media Index — Design das listagens

Redesign das listagens do hub `dev.andreximenes` para sair do Index-First puro (só tipografia) e passar a um **Media Index**: capas commitadas no repo, home em linhas com thumbnail, seções dedicadas em grade de cards. Identidade visual atual permanece.

## Objetivo

Fazer o hub parecer compartilhavel com pessoas leigas: a lista mostra o que cada item é (screenshot de tool, capa editorial de nota, OG/screenshot de link), sem virar landing de marketing nem mudar palette/tipo.

## Decisões fechadas

| Tema | Decisão |
|------|---------|
| Tools | Screenshot real da UI |
| Notes | Capa gerada por IA (tema/título) |
| Links | OG image ou screenshot do destino, baixada e commitada |
| Home | Linha compacta com thumbnail à esquerda |
| `/post`, `/app`, `/link` | Grade de cards |
| Identidade | Mantém papel quente, laranja, Hanken, nav atual |
| Pipeline de imagem | Manual: tudo no repo, sem fetch de OG no build |
| Campo | `cover` obrigatório no frontmatter |

## Fora de escopo

- Nova palette, tipografia ou atmosfera
- Hero / masthead / seções de marketing na home
- Automação de screenshot, geração de IA ou download de OG
- Mudança de layout em `/post/[slug]`, `/autor` ou chrome de `/app/[slug]`
- Placeholder tipográfico permanente para posts sem capa (schema exige `cover`)

## Macroestrutura

Atualiza `design.md`:

- **Antes:** Hub e listagens = Index-First. Sem enrichment.
- **Depois:** Hub e listagens = **Media Index**. Home = linhas com thumb. Seções = grade com capa. Tokens, tipografia, nav, acento ≤ 5% e “sem footer de site” permanecem.

### Home (`/`)

- Tagline + seção “Recente” (todos os posts misturados por data).
- Cada item: thumbnail (~64–80px, `object-cover`, radius alinhado ao sistema) + título + excerpt + meta (`tipo · data`).
- Hover: título → acento (comportamento atual). Sem card empilhado na home.
- Layout: coluna até `md`; em `lg` a linha pode alinhar meta à direita (padrão atual da lista).

### Seções (`/post`, `/app`, `/link`)

- Header de seção (título + descrição) inalterado em papel.
- Grade: 1 coluna no mobile/`md`; 2 colunas a partir de `lg` (cards largos o bastante pra screenshot 16:10 + excerpt).
- Card: imagem no topo (aspect ~16:10), título, excerpt curto (`line-clamp`), meta. Interação = o card inteiro é o link. Sem sombra pesada; borda ou gap alinhados a `--color-rule` / tokens existentes.

## Conteúdo e schema

### Frontmatter

```ts
// schema (conceito)
{
  title: string;
  slug: string;
  type: "tool" | "note" | "link";
  date: Date;
  description?: string;
  target?: string;
  cover: ImageMetadata; // via image() do Astro Content
}
```

`cover` é obrigatório. Build falha se faltar.

### Assets

```
src/assets/covers/tools/<slug>.webp
src/assets/covers/notes/<slug>.webp
src/assets/covers/links/<slug>.webp
```

Referência no Markdown relativa ao arquivo do post (caminho até `src/assets/covers/...`), resolvida pelo `image()` do content schema para otimização via `astro:assets`.

### Regras de produção (editoriais)

| Tipo | Conteúdo | Formato alvo |
|------|----------|--------------|
| tool | Screenshot da UI, crop limpo, sem chrome do browser | WebP, ~16:10, largura ~1200px |
| note | Capa editorial IA a partir do tema/título | idem |
| link | OG do destino ou screenshot, arquivo no repo | idem |

Acessibilidade: na listagem a imagem é decorativa em relação ao link que já tem o título em texto (`alt=""`), ou `alt` com o título nas tools se a screenshot for considerada informativa. Preferência única no plano de implementação: `alt=""` + título no texto do link (evita duplicar anúncio no leitor de tela).

### Fluxo de publicação

1. Gerar ou capturar a capa.
2. Salvar em `src/assets/covers/<type>/<slug>.webp`.
3. Setar `cover` no frontmatter do MD.
4. Commitar MD + imagem juntos.

## Componentes e dados

| Peça | Papel |
|------|--------|
| `IndexList` (ou sucessor) | Home: linhas com thumb |
| `CoverGrid` (novo) | Seções: grade de cards |
| `ListingLayout` | Home → linhas; seção → grade |
| `content.config.ts` | `cover: image()` obrigatório |
| `getPostMeta` / listing helpers | Expor URL/metadata da capa para os dois layouts |
| `design.md` | Genre/macrostructure Media Index |
| `README.md` | Mencionar capas nas listagens (se necessário, mínimo) |

Links continuam com favicon onde já usado (ex.: detalhe externo); na listagem Media Index a capa `cover` é a mídia principal, não o favicon.

## Migração

Há ~30 posts (tools, notes, links). O redesign de UI entra **junto** com capas para todos os posts existentes: sem capa, o schema quebra o build. Ordem sugerida:

1. Adicionar pasta de assets + schema `cover` (ainda sem exigir, ou exigir só após backfill).
2. Backfill de todas as capas.
3. Tornar `cover` obrigatório.
4. Trocar listagens (home linhas + seções grade) e atualizar `design.md`.

Na prática, um único PR/plano pode fazer 2→4 depois que as imagens existirem; o schema obrigatório não sobe sem o backfill.

## Critérios de sucesso

- Pessoa leiga olha a home e entende “tem apps e artigos” pelas thumbs, sem precisar ler só tipografia.
- `/app` parece vitrine de ferramentas (screenshots), `/post` parece revista com capas, `/link` mostra o destino.
- Build continua estático e determinístico (nenhum fetch de imagem no build).
- Tokens e nav atuais intactos.

## Riscos

- Volume de trabalho editorial no backfill inicial (~30 capas).
- Screenshots desatualizam quando a UI da tool muda (atualizar capa no mesmo PR de mudança visual relevante).
- Capas de IA inconsistentes entre notas se não houver brief visual mínimo (manter aspect e tratamento similares).
