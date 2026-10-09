---
slug: "ssr-cacheavel-na-borda-viral-sem-deploy"
type: note
title: "SSR cacheável na borda: aguenta viral e edição do cliente sem deploy"
date: 2026-06-23
cover: "../../../assets/covers/notes/ssr-cacheavel-na-borda-viral-sem-deploy.webp"
---

Cliente pede painel pra trocar hero, depoimentos e preços sem abrir PR. Você não quer voltar pro WordPress, mas também não quer herdar conta de compute porque a landing viralizou num tweet errado. O padrão de acesso é leitura pura: mil visitantes por dia, um editor entrando duas vezes na semana. Montar app server com Postgres e fila de deploy pra isso é overkill; gerar HTML estático no CI e mandar o cliente editar Markdown no Git é underkill. O meio-termo que fecha a conta é **SSR cacheável na Cloudflare**: render no Worker, conteúdo mutável no banco, HTML público servido da borda como se fosse SSG.

### O tráfego comum nunca chega no Worker

A rota pública (`/`, `/blog/[slug]`, `/precos`) renderiza no servidor, consulta o D1 uma vez no cache miss e devolve HTML com header explícito:

```http
Cache-Control: public, s-maxage=86400
```

`s-maxage` manda a CDN compartilhada (Cloudflare) guardar a resposta por 24 horas. O browser pode ter `max-age` menor se quiser, mas o que importa pro custo é a borda: cem mil pageviews no dia viram quase cem mil hits em RAM na PoP mais próxima, TTFB na casa de dezenas de milissegundos, zero execução de Worker, zero leitura no D1. Comportamento indistinguível de site estático exportado no build.

O Worker só acorda quando o TTL expira, quando você publica deploy novo com hash de asset diferente, ou quando dispara **Purge** depois de edição no admin. Uma query D1 por invalidação de página, não por visitante. Se o artigo mais lido recebe dez mil acessos entre dois purges manuais, você pagou uma leitura, não dez mil.

Comparar com SSR "puro" na Vercel ou num container sem CDN na frente: cada request é cold start + query + render. Funciona no preview com três acessos; no pico vira GB-s e read units acumulando enquanto o cliente acha que "é só uma landing".

### Picos e DDoS morrem antes do D1

Plataformas serverless cobram por tempo de CPU e por invocação. Tráfego malicioso ou post viral que você não planejou não diferencia visitante legítimo de bot na hora de fechar a fatura. Na Cloudflare, a camada de cache é o primeiro filtro: request repetido com mesma URL e mesmos headers de cache não desce pro origin. Ataque de volumetria contra `/` esgota budget de edge (que no plano gratuito é generoso) muito antes de esgotar o free tier do D1 ou estourar limite de requests do Worker.

Isso não substitui WAF nem rate limit em rota de login, mas pra superfície pública de leitura o modelo é assimétrico a seu favor. O adversário gasta banda batendo em HTML já materializado; você não paga query de banco por bot.

| Caminho | Worker | D1 | Custo marginal no pico |
|---------|--------|-----|------------------------|
| Visitante, cache HIT | não | não | zero |
| Visitante, cache MISS | sim | 1 read | uma invocação |
| Editor salva no `/admin` | sim | 1 write | fixo por edição |
| Purge após save | API call | não | invalida HTML antigo |

### Admin, purge e DX que o cliente entende

O painel fica no mesmo domínio (`/admin`), autenticado, fora do cache público. Salvar atualiza linha no D1 e chama a API de purge da Cloudflare pros paths afetados (`/`, `/blog/meu-post`). O próximo visitante pega MISS, o Worker re-renderiza com dado novo, a CDN cacheia de novo. Fluxo inteiro sem rebuild, sem commit no Git do cliente, sem webhook de CMS externo se você não quiser.

Do lado do desenvolvedor a stack continua a que você já usa: TypeScript, Tailwind, histórico Git só com código. O conteúdo mutável vive no banco edge, não espalhado em dez arquivos JSON versionados. Pra freelancer, isso fecha o contrato: entrega profissional, cliente autônomo, você não fica de plantão porque "precisa rodar deploy pra trocar telefone".

Detalhe que derruba o esquema: colocar cookie de sessão ou header `Authorization` na mesma rota cacheável que o visitante anônimo usa. A CDN não pode servir HTML de usuário A pra usuário B. Mantenha rotas públicas sem variável por sessão; admin e API de escrita em paths separados com `Cache-Control: private` ou sem cache. O HTML que vai pra borda precisa ser **byte-identical** pra qualquer anônimo.

Snippet mínimo do purge após update (o token fica em secret do Worker):

```ts
await fetch(
  `https://api.cloudflare.com/client/v4/zones/${ZONE_ID}/purge_cache`,
  {
    method: "POST",
    headers: {
      Authorization: `Bearer ${CF_API_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ files: [`https://example.com/`, `https://example.com/blog/${slug}`] }),
  }
);
```

Não precisa purgar o site inteiro; invalidar só as URLs que o D1 alimenta reduz MISS desnecessário nas páginas que não mudaram.

Projetos nessa faixa (institucional, blog de empresa, landing de campanha) raramente precisam de invalidação em tempo real ao segundo. TTL de um dia com purge manual no save é aceitável pro negócio e excelente pro bolso. Você ganha flexibilidade de CMS leve sem assinar a arquitetura de um SaaS multi-tenant; o preço de um viral é tempo de cache servido de graça, não surpresa na fatura do mês que vem.
