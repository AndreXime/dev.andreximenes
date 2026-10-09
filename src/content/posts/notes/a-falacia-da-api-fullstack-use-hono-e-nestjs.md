---
slug: "a-falacia-da-api-fullstack-use-hono-e-nestjs"
type: note
title: "A falácia da API fullstack: use Hono e NestJS"
date: 2026-03-01
cover: "../../../assets/covers/notes/a-falacia-da-api-fullstack-use-hono-e-nestjs.webp"
---

Route Handler no Next.js parece backend de verdade até você precisar da mesma regra de negócio no app Flutter. Aí descobre que validação de pedido vive ao lado de layout JSX, teste de integração mocka `next/headers` e deploy de API amarra na mesma pipeline de preview do front. Extrair depois custa sprint inteiro: mover DTO, desfazer import circular com componente de UI, recriar auth que dependia de cookie do domínio do site.

Server Actions pioram o acoplamento. Função callable do client vira superfície de API implícita, difícil de versionar e documentar para consumidor externo. Mobile, parceiro B2B ou worker em fila não chamam Server Action; precisam de HTTP estável com contrato explícito.

### Por que fullstack falha como API

Framework de SSR nasceu para HTML. DI nativa, pipe de validação global, guard por role, módulo de fila: tudo existe como lib solta ou não existe. Time reinventa estrutura a cada projeto. Cold start em serverless pesa quando rota de API compartilha bundle com render de página. Hospedar na plataforma de front traz lock-in que backend puro evitaria.

Separar API do repo de UI não é purismo. É permitir deploy, escala e contrato independentes.

### Hono: borda e microsserviços enxutos

Hono usa Web Standard APIs (`Request`, `Response`, `fetch`). Roda em Cloudflare Workers, Bun, Deno e Node sem reescrever handler. RegExp Router evita árvore de middleware pesada; latência importa em BFF na borda e gateway na frente de serviço lento.

```typescript
import { Hono } from "hono";

const app = new Hono();

app.get("/health", (c) => c.json({ ok: true }));

app.get("/users/:id", async (c) => {
  const id = c.req.param("id");
  const user = await fetchUser(id);
  return c.json(user);
});

export default app;
```

Caso típico: front Next consome BFF Hono no Worker que agrega três APIs internas, cacheia resposta 30 s e esconde token de serviço. Binário pequeno, boot rápido, sem grafo de módulo Nest. Quando domínio cabe em dezenas de rotas e regra cabe na cabeça de uma pessoa, Hono segura.

### NestJS: domínios complexos

Regra de pedido com desconto por segmento, estoque reservado, antifraude e fila de email não vive bem em arquivo `route.ts` de 400 linhas. NestJS impõe módulo, service, controller, guard, pipe. DI resolve grafo no bootstrap; teste troca repository por mock via `@Module`, não refactor em cascata.

Monólito com cinco squads, fila RabbitMQ, cron de reconciliação e gRPC para serviço legado: convenção Nest evita cada time inventar pasta `utils/` com lógica de negócio. `@nestjs/microservices` e `@nestjs/schedule` entram no mesmo padrão de handler HTTP.

Hono e NestJS não competem no mesmo slot. Borda enxuta e BFF: Hono. Core de negócio que cresce por anos: NestJS. Repositório dedicado, OpenAPI publicado, CI só de backend. Front consome HTTP como qualquer outro client, sem importar tipo de `app/actions/`.

Manter API dentro do Next só fecha enquanto único consumidor é o site na mesma base de código. Segundo consumidor aparece; dívida cobra juros.
