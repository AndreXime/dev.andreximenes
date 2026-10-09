---
slug: "token-assimetrico-no-ssr-sem-round-trip-na-api"
type: note
title: "Token assimétrico no SSR: role no HTML sem bater na API"
date: 2026-06-16
cover: "../../../assets/covers/notes/token-assimetrico-no-ssr-sem-round-trip-na-api.webp"
---

O padrão que mais vejo em app com SSR autenticado: o servidor recebe o cookie, chama `GET /me` na API, espera 120 ms (ou 800 ms num dia ruim), lê `role` e `permissions`, e só então monta o layout. Cada navegação, cada refresh, cada prefetch do framework repete a viagem. A API vira gargalo de TTFB para algo que o HTML já deveria saber responder: "esse usuário é admin ou visitante?".

Com **token assimétrico** (JWT assinado com par RSA ou ECDSA, validado com chave pública), o processo de render troca de "perguntar pra API" para "verificar assinatura localmente". O access token carrega `sub`, `role`, escopos, `exp`. O servidor SSR importa a chave pública (JWKS estático, fetch no boot, rotação via kid no header) e roda `jwt.verify` antes de renderizar. Zero round-trip de rede para decidir se a sidebar mostra painel de billing.

### O que muda no pipeline de render

Fluxo típico hoje:

```text
request → cookie de sessão → fetch /api/session → JSON com user → render
```

Com validação assimétrica no edge ou no Node do SSR:

```text
request → cookie com access token → verify(local, publicKey) → claims → render
```

A API continua emitindo o token no login e no refresh. O SSR não precisa de segredo compartilhado: só a chave pública, que pode ficar em cache por horas. Em deploy com múltiplas instâncias do frontend, cada uma valida sozinha. Latência de autenticação vira custo de CPU (microssegundos) em vez de fila na API de auth.

O ganho aparece forte em rotas que misturam shell público e trecho privado. Você sabe no servidor se redireciona pra `/login`, se renderiza menu de admin ou se esconde botão de export sem esperar outro serviço acordar. Frameworks com middleware (Next, Astro com adapter Node, Hono na BFF) encaixam a verificação num único ponto antes do handler da rota.

| Abordagem | Latência no SSR | Fonte da role |
|-----------|-----------------|---------------|
| `fetch /me` a cada request | RTT + fila da API | Banco, sempre atual |
| JWT assimétrico local | Só crypto local | Claims no token |
| JWT + introspection sob demanda | RTT só quando suspeito | API como árbitro |

### TTL curto e refresh fora do caminho crítico

Token com `exp` de 5 a 15 minutos reduz a janela em que claims desatualizadas mentem pro usuário. O refresh roda em rota dedicada (`/api/auth/refresh`) ou no client após hidratação, não no meio do render da página de listagem. SSR lê o access token do cookie `httpOnly`; se expirou, redireciona pro login ou manda HTML mínimo de "sessão expirada" sem tentar refresh síncrono que segura o response inteiro.

Claims devem ser mínimas: identificador, role principal, talvez tenant. Não coloque perfil completo, avatar URL nem lista de permissões fina que muda a cada clique. O que muda rápido continua no client com `fetch` depois do shell, como já faz sentido em dashboard.

### Blocklist: onde o token local mente

A API que você deixou de consultar no SSR ainda pode manter **blocklist** de tokens revogados: logout forçado, troca de senha, desligamento de funcionário, comprometimento de sessão. O JWT continua criptograficamente válido até o `exp`; a assinatura não sabe que o emissor já o invalidou.

Três saídas, cada uma com custo diferente:

**TTL agressivo.** Access token de 5 minutos. Revogação efetiva no pior caso em cinco minutos. Funciona para muitos produtos internos; não serve se compliance exige corte imediato.

**Blocklist consultada no SSR.** Redis ou cache compartilhado com `jti` ou hash do token. O render faz um `GET` rápido (sub-ms na mesma VPC) antes de confiar nas claims. Você recupera revogação imediata mas reintroduz dependência externa. Ainda costuma ser mais barato que `/me` completo porque a lookup é O(1) por id, sem join de usuário.

**Introspection só em rotas sensíveis.** Dashboard com JWT local; endpoint de transferência bancária ou exclusão de conta chama a API pra confirmar sessão. Híbrido honesto: performance no caminho quente, autoridade da API no caminho que dói.

Ignorar blocklist porque "JWT é stateless" é como cachear HTML público com dados de usuário: funciona no happy path até alguém é demitido e ainda acessa painel admin por onze minutos.

### Chave pública e rotação

Publique JWKS num endpoint estável (`/.well-known/jwks.json`) ou embuta no deploy do SSR com versionamento. Quando a API rotaciona par de chaves, tokens antigos trazem `kid` no header; o verificador tenta a chave correspondente. SSR sem atualizar JWKS rejeita login legítimo após rotação. Trate JWKS como dependência de deploy ou cache com TTL baixo (5-10 min), não como arquivo esquecido no repositório.

Se a API e o SSR são times diferentes, documente contrato de claims (`role` string vs array `roles`, nome do claim de tenant). Divergência quebra render silencioso: usuário vê UI de membro com token que a API considera admin.

Na próxima rota autenticada com SSR, desenhe o que precisa ser verdadeiro no primeiro byte do HTML. Se for só role e id, token assimétrico local elimina a API do caminho crítico. Se revogação imediata for requisito, planeje blocklist ou introspection antes de celebrar o ganho de latência; assinatura válida não substitui emissor que já disse não.
