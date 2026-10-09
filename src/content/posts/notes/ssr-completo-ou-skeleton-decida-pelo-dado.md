---
slug: "ssr-completo-ou-skeleton-decida-pelo-dado"
type: note
title: "SSR completo ou skeleton na tela: decida pelo dado, não pelo framework"
date: 2026-06-16
cover: "../../../assets/covers/notes/ssr-completo-ou-skeleton-decida-pelo-dado.webp"
---

Você monta um dashboard com quatro widgets. Três queries respondem em 80 ms; a quarta bate numa API de terceiros que às vezes leva dois segundos. Com **SSR bloqueante**, o usuário fica olhando tela branca até a mais lenta terminar. Não sabe se travou, se caiu a rede ou se o deploy quebrou. A pergunta "espero tudo no servidor ou mando skeleton e busco depois?" aparece em toda stack com App Router, RSC ou equivalente. A resposta errada é escolher um lado e aplicar em tudo.

Skeleton com fetch assíncrono ganhou tração porque resolve dor real em apps autenticados: feed, inbox, painel de métricas, home pós-login. O layout sobe rápido, o menu fica clicável, o cérebro enxerga progresso em vez de vazio. TTFB e FCP melhoram porque o servidor não segura a resposta HTTP esperando o pior caso da cadeia de dependências. Para dados que mudam a cada refresh e vêm de fontes com latência imprevisível, travar o HTML inteiro é UX ruim.

Mas generalizar isso para página de artigo, ficha de produto ou landing de campanha é desperdício. Esse conteúdo é **idêntico para todos os visitantes**. Não há ganho em mostrar skeleton do título e do corpo se você já tem o texto no banco ou no CMS. O usuário quer o artigo completo na primeira pintura, não um placeholder pulsando onde deveria estar o parágrafo. Robô de busca também quer HTML com conteúdo, não shell vazio hidratado depois.

### Conteúdo público: SSR completo e cache na borda

Página de blog, documentação, e-commerce público: renderize tudo no servidor, envie HTML cheio, cacheie na CDN. O bloqueio no origin só acontece no cache miss; depois disso o TTFB cai para milissegundos na edge, independente do usuário estar em São Paulo ou Lisboa. Você fica com performance de estático e flexibilidade de template dinâmico.

Headers típicos para conteúdo que muda pouco:

```http
Cache-Control: public, s-maxage=3600, stale-while-revalidate=86400
```

`s-maxage` vale para proxies compartilhados (CDN); o browser ainda respeita `max-age` se você definir. `stale-while-revalidate` entrega resposta velha enquanto revalida em background, o que evita pico de latência quando o TTL expira. Página de produto com estoque que muda a cada minuto pede TTL menor; artigo de blog aguenta horas ou dias.

O erro comum é tratar "SSR" como sinônimo de "lento". SSR lento é SSR **sem cache** em rota que deveria ser cacheável. Se o HTML varia por usuário logado, você não pode jogar na CDN sem pensar. Aí entra a divisão.

| Tipo de dado | Abordagem | Por quê |
|--------------|-----------|---------|
| Artigo, LP, produto público | SSR completo + CDN | Mesmo HTML para todos; SEO e FCP com conteúdo real |
| Feed, dashboard, inbox | Skeleton + fetch/stream | Várias fontes lentas; progresso visual |
| Nome no header, carrinho, wishlist | Client fetch | Não contamina cache público |

### Dados do usuário ficam fora do HTML cacheável

Avatar, badge de notificação, itens no carrinho, recomendação "pra você": isso não entra no payload que a CDN guarda. Você busca no client com `fetch`, SWR ou TanStack Query depois que o shell público já está na tela. O HTML base permanece `Cache-Control: public` sem risco de **cache poisoning** (usuário A receber fragmento de usuário B).

O detalhe que derruba a experiência é CLS. Se o header reserva 40 px de altura e o nome do usuário empurra o layout quando chega, você troca tela branca por flicker. Reserve espaço fixo ou skeleton só na região privada: um retângulo cinza onde o avatar entra, largura mínima no slot do carrinho. O restante da página já veio completo do SSR.

### Streaming SSR não resolve confusão de responsabilidade

React Server Components e streaming permitem mandar o shell cedo e completar blocos depois. Útil quando um trecho público é rápido e outro depende de query pesada **na mesma página pública**. Ainda assim: se o bloco lento é conteúdo que deveria estar no cache (corpo do post, preço do produto), o problema é arquitetura de dados, não falta de Suspense. Mover a query lenta para build time, ISR ou edge cache costuma ser mais simples que empilhar boundaries.

Dashboard é outra história. Lá faz sentido streamar: sidebar estática primeiro, gráfico que depende de warehouse depois. O usuário já está dentro do app; expectativa de latência é outra. Misturar os dois mundos na mesma rota sem separar o que é público do que é privado é como usar SPA em landing de marketing porque o tutorial mandou.

Na próxima revisão de arquitetura, liste o que cada rota entrega antes de escolher padrão de render. Conteúdo igual para anônimo e logado vai pro SSR cacheável. Só o que muda por sessão vai pro client, com espaço reservado. O framework segue a classificação dos dados; inverter essa ordem é o que gera página rápida sem conteúdo ou página cheia que demora dois segundos à toa.
