---
slug: "go-vs-typescript-otimizando-a-runtime-da-api"
type: note
title: "Go vs TypeScript: otimizando a runtime da API"
date: 2026-02-04
cover: "../../../assets/covers/notes/go-vs-typescript-otimizando-a-runtime-da-api.webp"
---

Migrei serviço de thumbnail de Node para Go no mesmo hardware. CPU caiu de 80% para 25% sob carga igual. Não era código ruim em TypeScript: decode PNG, resize, encode WebP bloqueia event loop. Uma requisição pesada atrasa todas as outras no processo single-threaded. Go distribuiu trabalho em goroutines e usou núcleos que Node deixava ociosos.

Escolher linguagem da API é escolher modelo de execução. V8 com event loop e JIT versus binário estático com scheduler nativo. Métrica manda mais que preferência de sintaxe.

### Modelo de execução

Node brilha quando thread espera rede ou disco. Go brilha quando thread calcula. TypeScript compila para JS interpretado/JIT; Go compila para binário sem VM no caminho quente. Memória por conexão WebSocket aberta costuma ser menor em Go; milhares de sockets no mesmo pod viram problema de custo em Node antes de virar problema de código.

Isso não torna Go "melhor". Torna Go adequado quando CPU ou concorrência densa é o gargalo medido, não chute.

### TypeScript: I/O bound e entrega rápida

API que consulta Postgres, chama Stripe e monta JSON raramente morre na runtime. Latência P99 segue query lenta ou API externa. Tipos compartilhados com front (`zod` ou `tRPC` no monorepo) aceleram feature que muda toda semana. CRUD, webhook handler, orquestrador de fila leve: Node entrega rápido, contrata dev com stack conhecida, debug com ferramentas maduras.

Microsserviço que só encadeia HTTP e publica evento não precisa de Go por reputação. Precisa de observabilidade e query indexada.

### Go: CPU bound e muitas conexões

Proxy WebSocket com 20k clientes, worker de compressão, parser de log em stream, serviço de auth com bcrypt por requisição: event loop sofre. Goroutine barata permite um processo servir conexão longa sem thread OS por client. Cold start de binário pequeno ajuda em Lambda e Cloud Run quando função acorda frequente.

Criptografia, serialização pesada, transformação de mídia: perfil clássico de extração para serviço Go enquanto resto do produto fica em TypeScript.

### Sinais para migrar (ou não)

Olhe métricas antes de reescrever. CPU alta com I/O idle aponta compute no Node. Latência P99 subindo com throughput de conexões simultâneas aponta pressão no event loop. Memória linear com contagem de socket idem.

| Sintoma | Provável gargalo | Caminho |
|---------|------------------|---------|
| CPU 70%+ com DB wait baixo | Compute JS | Extrair hot path para Go |
| P99 domina query externa | I/O | Otimizar SQL/contrato, ficar em TS |
| RAM sobe com WebSockets | Conexões | Go ou separar hub de conexão |
| Time só TS, CRUD estável | Organizacional | Migrar só se métrica exigir |

Reescrever tudo em Go por moda troca velocidade de produto por eficiência que talvez nunca use. Extrair um serviço quando flamegraph ou APM mostrar função quente: abordagem que já pagou em produção.

TypeScript para entregar e iterar. Go para trecho que medidor apontou como limite de runtime.
