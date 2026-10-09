---
slug: "nestjs-a-melhor-framework-para-apis-convencionais-em-typescript"
type: note
title: "NestJS: o melhor framework para APIs convencionais em TypeScript"
date: 2026-05-29
cover: "../../../assets/covers/notes/nestjs-a-melhor-framework-para-apis-convencionais-em-typescript.webp"
---

Rota que retorna JSON não basta. API convencional carrega transporte, regras de negócio, auth, validação, observabilidade e contrato estável entre times. Express e Fastify resolvem HTTP; o resto vira biblioteca solta e convenção oral. NestJS impõe estrutura desde o primeiro módulo, e isso aparece quando o side project vira produto.

REST sobre HTTP, versionamento, DTOs validados, auth por token ou sessão, filas, cron e banco relacional. Times distintos consomem os mesmos endpoints. Deploy em container ou VM, não edge com cold start de milissegundos. ERP, marketplace, SaaS B2B, backend mobile. Não é BFF de 50 linhas.

NestJS herda Node (Express ou Fastify como adapter) e organiza código em módulos, controllers, providers e pipes.

### DI nativa, não workaround

Injeção no Express costuma ser manual: `new UserService(new UserRepository())` espalhado ou container ad hoc com `tsyringe`. Funciona em projeto pequeno; em monólito com dezenas de serviços, testes viram pesadelo de mock.

No NestJS, o container é first-class:

```typescript
@Injectable()
export class OrderService {
  constructor(
    private readonly orderRepo: OrderRepository,
    private readonly paymentClient: PaymentClient,
  ) {}
}
```

Trocar implementação (mock em teste, adapter em prod) exige `@Module({ providers: [...] })`, não refactor em cascata.

### Validação e contrato na borda

class-validator + class-transformer via `ValidationPipe` transformam body, query e params antes do handler:

```typescript
@Post()
create(@Body() dto: CreateOrderDto) {
  return this.orderService.create(dto);
}
```

```typescript
export class CreateOrderDto {
  @IsUUID()
  customerId: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items: OrderItemDto[];
}
```

Sem pipe global, cada rota reimplementa sanitização. Com pipe global, 400 padronizado e tipagem alinhada ao runtime.

### Guards, interceptors e cross-cutting

Auth, role, rate limit, serialização de resposta e logging de latência espalham fácil. Guards decidem se a request entra; interceptors envolvem execução; filters mapeiam exceção para HTTP status.

`@UseGuards(JwtAuthGuard, RolesGuard)` no controller substitui middlewares encadeados sem ordem clara. Em API com dezenas de rotas, declaratividade evita rota sem auth passando silenciosa.

### Além do HTTP

NestJS não prende você a REST. @nestjs/microservices abstrai RabbitMQ, Kafka, NATS e gRPC. @nestjs/schedule cobre cron. TypeORM, Prisma e MikroORM têm integração documentada. Evoluir para event-driven no mesmo codebase evita rewrite.

Hono brilha em Workers e BFFs de baixa latência; NestJS troca overhead por previsibilidade. tRPC acopla contrato ao client TypeScript; NestJS mantém HTTP/OpenAPI consumível por qualquer consumer. API pública ou multi-client ainda converge em REST + `@nestjs/swagger`.

### Limites

Edge, função de 20 linhas ou boot em <10 ms: NestJS não compete. Bootstrap carrega reflexão, decorators e grafo de módulos. Microsserviço enxuto na borda? Hono ou Fastify puro. Monólito modular, API corporativa ou backend com múltiplos squads? Custo de startup some frente a reestruturar Express sem convenções.

Mais de um time, validação rigorosa, auth granular, testes com DI e possível fila ou gRPC: NestJS concentra o que você montaria manualmente. Não é a framework mais rápida para hello world. É a que menos exige reinventar arquitetura quando CRUD vira produto.
