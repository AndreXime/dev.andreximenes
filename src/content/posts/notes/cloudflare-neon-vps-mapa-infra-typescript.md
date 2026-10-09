---
slug: "cloudflare-neon-vps-mapa-infra-typescript"
type: note
title: "Cloudflare, Neon e VPS: mapa de infra TypeScript para fechar orçamento"
date: 2026-07-01
cover: "../../../assets/covers/notes/cloudflare-neon-vps-mapa-infra-typescript.webp"
---

Cliente pergunta quanto custa hospedar o sistema. Você olha o escopo, pensa em Workers, Postgres, fila, PDF em lote... e responde "depende". Não é evasiva: orçamento de infra em TypeScript hoje cai em três caminhos que se repetem em quase todo briefing. Ter o mapa na cabeça corta a reunião técnica para cinco minutos e evita vender VPS de R$ 150 para CRUD que cabe no free tier da Cloudflare.

A pergunta certa não é "qual stack é melhor". É quanto o cliente aceita pagar, quanto processamento pesado existe e quanto você quer brigar com SQLite no código.

### Combo Cloudflare: barato e unificado

**Pages + Workers + D1 + R2** fecha MVPs, portfólios dinâmicos, SaaS inicial e sistema interno leve. Custo real fica entre zero e uns R$ 30/mês se passar do free e precisar do Workers Paid.

A dor aparece no banco. D1 é SQLite distribuído: sem enums nativos como no Postgres, JSONB com semântica diferente, migração que exige pensar em compatibilidade de schema entre regiões. **Prisma** tradicional atrita; **Drizzle** encaixa melhor porque o modelo já nasce enxuto para edge. Você escreve queries conscientes de que não está num Postgres completo. Para CRUD com poucas tabelas e sem RBAC elaborado, funciona. Para e-commerce com permissões em árvore, você vai sentir falta de tipos de coluna que o ORM assume por default.

Escolha esse caminho quando o cliente quer barato, o domínio é simples e você topa adaptar o data layer em vez de forçar Prisma como se fosse Neon.

### Neon na borda: o meio-termo que eu fecho na maioria

**Pages + Workers + Neon + R2** é o ponto onde DX e custo se encontram. Neon Postgres serverless com free tier generoso; Cloudflare segura edge e assets no R2. Custo ainda orbita zero a R$ 30/mês na fase inicial.

Aqui **Prisma** volta a fazer sentido: enums, UUID, JSONB, migrations sem gambiarra. RBAC, multi-tenant leve, relatórios com joins complexos ficam no território natural do Postgres sem você administrar máquina. Worker faz auth, validação, proxy para o banco via driver HTTP ou connection pooling do Neon. Pouca dor de cabeça operacional.

| Cenário | Stack | Custo típico | Quando fechar |
| --- | --- | --- | --- |
| MVP barato | Pages, Workers, D1, R2 | R$ 0–30 | CRUD simples, time aceita Drizzle |
| Negócio real | Pages, Workers, Neon, R2 | R$ 0–30 | Prisma, permissões, joins |
| CPU pesada | Workers + VPS + Neon ou Postgres local | R$ 30–150 | PDF/vídeo em lote, filas longas |
| CPU pesada + budget | Workers + API especializada + R2 | variável | Cliente paga SaaS de processamento |

Se o cliente tem orçamento mínimo mas o produto não é brinquedo, esse é o default.

### VPS quando o Worker não aguenta o trabalho

Geração de PDF com dezenas de páginas, conversão de vídeo, scraping com browser headless, WebSocket de longa duração: **Worker** não foi feito para isso. CPU limitada, memória curta, timeout de subrequest em torno de 100 segundos no fetch externo. A arquitetura híbrida coloca o Worker como gateway de I/O na borda e empurra o trabalho sujo para **VPS** (Hetzner, OVH) rodando microserviço em Node/Bun com Docker, fila Redis ou RabbitMQ, worker consumindo jobs.

Custo sobe para R$ 30–150/mês conforme RAM e CPU. Em troca, processamento previsível e sem depender de limite de wall clock do edge. Você vira DevOps parcial: patch de SO, firewall, restart de container, monitorar fila travada. O cliente paga pela previsibilidade; você não promete render de vídeo dentro de V8 na Irlanda.

### Quarta variante: terceirizar o pesado

Se dinheiro não é gargalo, VPS some da conversa. Worker recebe upload, manda para **iLovePDF**, **Cloudinary** ou API equivalente, salva resultado no R2. Manutenção de biblioteca de PDF quebra com arquivo esquisito vira problema deles. Mil usuários simultâneos não derrubam sua máquina de 4 GB.

O único detalhe técnico que não pode ignorar: fetch síncrono no Worker morre se o processamento passar do timeout. Job de PDF grande precisa de fluxo **assíncrono com webhook**. Worker POSTa o arquivo, registra `job_id` no D1 ou Neon, responde 202 pro cliente. API externa processa e bate no endpoint de callback do Worker com URL do arquivo pronto; Worker grava no R2 e atualiza status. Conexão com o usuário fecha em segundos; o trabalho pesado acontece fora do limite de 100 s.

```typescript
// Worker: dispara job e sai
const res = await fetch("https://api.ilovepdf.com/v1/process", {
  method: "POST",
  body: formData,
  headers: { "X-Callback-Url": "https://api.seudominio.com/webhooks/pdf" },
});
const { jobId } = await res.json();
await db.insert(jobs).values({ id: jobId, status: "pending" });
return Response.json({ jobId }, { status: 202 });
```

Na call de escopo, eu desenho esses quatro quadrantes no chat e pergunto: CRUD ou CPU? Barato ou conforto com Prisma? Quem opera servidor? Resposta em uma frase cada; orçamento de infra sai na hora. O resto é implementação.
