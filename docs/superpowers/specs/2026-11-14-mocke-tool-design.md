# Mockê (tool client-only) — Design

Data: 2026-11-14  
Status: aprovado (brainstorming)  
Origem: port conceitual do repo `Projetos/mocke` (API Hono) para tool no `dev.andreximenes`

## Problema

O Mockê atual é uma API HTTP com CSV + SQLite. Neste site as ferramentas são apps React no navegador. O usuário quer **escolher um dataset, filtrar no estilo da API e copiar um array JSON** para colar em fixtures, Storybook ou prototipagem, sem backend.

## Decisões fechadas

| Tema | Decisão |
|------|----------|
| Fluxo | Dataset → filtros/quantidade → copiar JSON |
| Dados | Amostras enxutas (~100 registros) embutidas no bundle |
| Filtros | Completos estilo API: `q`/`search`, filtro por campo, `sort`/`order`, `fields`, `limit` |
| Envelope no clipboard | Array puro `[{...}, {...}]` (pretty-printed) |
| Datasets v1 | products, cep, news, movies, users, companies (sem auth) |
| Arquitetura | Tool standalone + motor de query em memória |
| Persistência | Sem `storage` / “Copiar link” na v1 |
| Sync com repo Mockê | Não; amostragem one-shot na implementação, depois versionada aqui |

## Fora de escopo (v1)

- API HTTP, OpenAPI, Swagger
- Auth mock e mutações fake
- SQLite / rate limit / CORS
- Envelope paginado `{ data, page, total, ... }`
- Snippet TypeScript/`fetch` mock
- Geração sintética (faker)
- Download de arquivo como fallback de clipboard
- Testes de UI React

## Arquitetura

```
src/tools/Mocke/
  Mocke.tsx                 # entry + ToolShell
  MockeView.tsx             # UI
  domain/
    types.ts
    catalog.ts              # metadados por dataset
    query.ts                # filter / search / sort / project / limit
    query.test.ts
  data/
    products.json
    cep.json                # amostra de code_cep_coordinates
    news.json
    movies.json
    users.json
    companies.json
```

Fluxo:

1. Usuário seleciona dataset → carrega array estático do JSON correspondente
2. UI monta `QueryParams`
3. `queryDataset(records, params)` devolve array filtrado
4. Preview + `navigator.clipboard.writeText(JSON.stringify(rows, null, 2))`

Integração no site (`tools.md`):

- Post `src/content/posts/tools/mocke.md` (`slug: mocke`, `target: Mocke`, type tool, capa obrigatória)
- `case "Mocke"` em `src/pages/app/[slug].astro`
- Capa `src/assets/covers/tools/mocke.webp`
- URL pública: `/app/mocke/`

Nome público: **Mockê**  
Descrição sugerida: gera e copia JSON de datasets mock (produtos, usuários, CEPs…) no navegador.

## Domínio: query

Semântica alinhada ao Mockê original, sem SQL:

| Param | Comportamento |
|--------|----------------|
| `q` / `search` | Substring case-insensitive; campos = todos ou só `searchFields` |
| filtro por campo | Igualdade; valores separados por vírgula = OR; campos com lista (`|` ou `,`) também batem “contém valor” |
| `sort` + `order` | `asc` / `desc`; comparação como string |
| `fields` | Projeção; se vazio ou só nomes inválidos, registro completo |
| `limit` | Corta após filtro/sort. Sem `page` (quantidade útil para copiar) |

Tipos:

- `DataRecord = Record<string, string>`
- Catálogo: `id`, label, descrição curta, `fields[]` (para selects da UI)

Defaults e clamps:

- `limit` inválido → 20
- `limit` clamp entre 1 e tamanho do dataset selecionado
- Campo desconhecido em filtro / `sort` / `fields` → ignora

## UI

Uma tela, mobile-first, tokens e classes `toolUi` / andre_OS.

1. Seletor de dataset: select nativo (mais simples com 6 opções e labels longas)
2. Busca (`q`) + multi-select opcional `searchFields`
3. Filtros dinâmicos: pares campo + valor (add/remove); valor aceita vírgulas (OR)
4. Ordenação: `sort` + `order`
5. Projeção: multi-select `fields`
6. Quantidade: `limit` (default 20)
7. Preview: “N de M” + lista compacta das linhas resultantes (id + até 2 campos de destaque do catálogo), limitada visualmente aos primeiros 20 itens mesmo se `limit` for maior; o clipboard sempre leva o array completo pós-query
8. CTA Copiar JSON + feedback “Copiado” / erro de clipboard

Layout: coluna até `lg`; a partir de `lg`, filtros à esquerda e preview/CTA à direita.

Troca de dataset: zera filtros / sort / fields ligados ao schema anterior; mantém `q` e `limit` (com re-clamp).

Resultado vazio: preview “0 registros”; Copiar ainda disponível e grava `[]`.

## Dados

Seis JSON estáticos (~100 registros cada). Na implementação, script one-shot local lê os CSVs do Mockê, amostra 100 linhas e grava os JSON neste repo; o script não entra no runtime do site nem vira dependência permanente. Campos normalizados como string.

Mapeamento de ids:

| Dataset id | Origem Mockê |
|------------|--------------|
| `products` | `products` |
| `cep` | `code_cep_coordinates` |
| `news` | `news` |
| `movies` | `movies` |
| `users` | `users` |
| `companies` | `companies` |

## Erros

- Clipboard indisponível / rejeitado → toast/feedback curto; sem download
- Params inválidos → defaults/ignore acima (nunca throw na UI)

## Testes e verificação

- Vitest: `domain/query.test.ts` (busca, OR, sort, fields, limit, combinação)
- Sem teste de componente React na v1
- Verificação: `npm run lint`, `npm run build`, smoke em `/app/mocke/`

## Critérios de sucesso

- Usuário escolhe qualquer um dos 6 datasets, aplica filtros estilo API e copia um array JSON válido
- Bundle não embute os CSVs completos do Mockê
- Tool aparece em `/app` via post + rota, no padrão das demais ferramentas
