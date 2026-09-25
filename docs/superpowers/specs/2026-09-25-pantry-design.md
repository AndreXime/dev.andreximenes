# Despensa (Pantry) — Design

Ferramenta web de organização da despensa no hub `dev.andreximenes`, em `/app/despensa/`.

## Objetivo

CRUD de produtos com quantidade, estoque mínimo, flag essencial e validade. Lista única de pendências (compras e tarefas). Essenciais abaixo do mínimo entram sozinhos como compra. Ao concluir compra, pergunta quanto comprou e reabastece o produto. Persistência só no browser (localStorage + link de compartilhamento).

## Fora de escopo (MVP)

- Categorias de produto
- Código de barras / scanner
- Integração com livro de receitas
- Contas, sync multi-dispositivo além do link de export
- Notificações push

## Nome e integração

| Campo | Valor |
|-------|--------|
| Pasta / componente | `Pantry` |
| slug | `despensa` |
| title | Despensa |
| description | Estoque da casa com validade, tarefas e lista de compras que se atualiza sozinha. |
| toolId | `pantry` |
| Storage key | `pantry:state_v1` |

Arquivos de integração (padrão `tools.md`):

1. `src/tools/Pantry/` (app React)
2. `src/content/posts/tools/despensa.md`
3. `case` em `src/pages/app/[slug].astro`

## Modelo de dados

### Product

```ts
interface Product {
  id: string;
  name: string;
  quantity: number;
  minQuantity: number;
  unit: string;
  essential: boolean;
  expiresOn: string | null; // YYYY-MM-DD
  notes: string;
  createdAt: string; // ISO
  updatedAt: string; // ISO
}
```

### Pending

```ts
interface Pending {
  id: string;
  kind: "purchase" | "task";
  title: string;
  done: boolean;
  productId: string | null;
  auto: boolean; // true se criada pelo sync de essenciais
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
}
```

### State

```ts
interface PantryState {
  products: Product[];
  pendings: Pending[];
}
```

## Regras de domínio

### Estoque baixo

`needsRestock(product)` é verdadeiro quando `product.essential && product.quantity < product.minQuantity`.

### Sync de compras automáticas

`syncPurchasePendings(state)`:

1. Para cada produto com `needsRestock`, se não existir pending aberta (`!done`) com `kind === "purchase"` e `productId` igual ao produto, cria uma pending `auto: true` com `title` = nome do produto.
2. Remove pendings abertas com `auto: true` e `kind === "purchase"` cujo produto não precisa mais de restock (ou produto sumiu).
3. Não altera compras manuais (`auto: false`), tarefas, nem pendings já concluídas.

Chamar após qualquer mutação de produto (salvar, apagar, ajustar quantidade).

### Concluir compra

`completePurchase(state, pendingId, boughtQty)`:

1. Pending deve existir, `kind === "purchase"`, `!done`, `boughtQty > 0`.
2. Se houver `productId` e o produto existir: `quantity += boughtQty`.
3. Marca pending `done: true`, `completedAt` agora.
4. Roda `syncPurchasePendings` no estado resultante.

### Concluir tarefa

Marca `done` / `completedAt`. Sem efeito no estoque.

### Validade

Dado `today` (`YYYY-MM-DD`) e `expiresOn`:

- `expired` se `expiresOn < today`
- `expiringSoon` se `expiresOn` está entre `today` e `today + 7` dias (inclusive)
- `ok` caso contrário ou sem validade

## UI

Duas abas no `ToolShell`: Dispensa | Pendências.

### Dispensa

- Busca por nome
- Filtros: todos / essenciais / estoque baixo / validade (vencido ou ≤7 dias)
- Lista: nome, quantidade/mínimo/unidade, badge Essencial, alerta de validade
- Atalhos `+` / `−` na quantidade
- Form criar/editar: nome, qtd, mínimo, unidade, essencial, validade, notas
- Excluir produto (remove também pendings auto abertas ligadas, via sync)

### Pendências

- Filtros: abertas / feitas / compras / tarefas
- Botões: Nova tarefa, Adicionar compra (manual, sem produto)
- Compras auto com rótulo “da dispensa”
- Concluir compra → modal “Quanto comprou?” → `completePurchase`
- Concluir tarefa → marca feita
- Reabrir / excluir pending opcional no MVP: excluir sim, reabrir não obrigatório

## Arquitetura de arquivos

| Arquivo | Responsabilidade |
|---------|------------------|
| `domain.ts` | Tipos + regras puras |
| `domain.test.ts` | Testes Vitest |
| `store.ts` | Atom, normalize, ações |
| `Pantry.tsx` | Entry + ToolShell |
| `PantryView.tsx` | Abas |
| `ui/PantryTab.tsx` | Lista e filtros da dispensa |
| `ui/PendingTab.tsx` | Lista de pendências |
| `ui/ProductForm.tsx` | Form criar/editar |
| `ui/RestockDialog.tsx` | Modal quantidade comprada |

## Erros e edge cases

- Nome vazio: não salva produto
- `minQuantity` e `quantity` ≥ 0
- Compra manual sem `productId`: ao concluir, só marca done (não altera estoque)
- Produto deletado com pending auto aberta: sync remove a pending
- Unidade: string livre (default `un`)

## Testes

Cobrir no domínio: `needsRestock`, `expiryStatus`, `syncPurchasePendings` (criar/remover, ignorar manuais), `completePurchase` (soma + done + re-sync).
