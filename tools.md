# Como criar uma ferramenta

Guia obrigatório para adicionar uma tool no projeto. Siga na ordem. Ferramenta incompleta (sem post ou sem `case` na rota) não entra na listagem ou aparece como “Ferramenta não encontrada.”

## Visão geral

Cada ferramenta é:

1. Um app React em `src/tools/<NomePascal>/`
2. Um post Markdown em `src/content/posts/tools/`
3. Um `case` em `src/pages/app/[slug].astro`

A URL pública fica `/app/<slug>/`. O `slug` vem do frontmatter do post; o `target` aponta para o componente React.

---

## Passo 1: Definir nomes

| Campo | Regra | Exemplo |
|-------|--------|---------|
| Pasta / componente | PascalCase | `MeuPlanner` |
| `target` (frontmatter) | Igual ao nome do componente | `MeuPlanner` |
| `slug` | kebab-case, português | `meu-planner` |
| `title` | Nome público | `Meu planner` |
| `description` | Uma frase para a listagem | `Planeja X no navegador.` |
| `toolId` (se houver storage) | snake_case | `meu_planner` |
| Storage key | `<toolId>:<recurso>_v1` | `meu_planner:state_v1` |

Não use `target` diferente do export default do entry.

---

## Passo 2: Criar a pasta e o entry

Crie `src/tools/<NomePascal>/` com pelo menos o entry:

```tsx
// src/tools/MeuPlanner/MeuPlanner.tsx
import { Calendar } from "lucide-react";
import { ToolShell } from "../ToolShell";
import { MeuPlannerView } from "./MeuPlannerView";

export default function MeuPlanner() {
	return (
		<ToolShell
			title="Meu planner"
			description="Uma frase curta sobre o que a ferramenta faz no navegador."
			icon={<Calendar className="size-6" strokeWidth={2} />}
		>
			<MeuPlannerView />
		</ToolShell>
	);
}
```

Regras do entry:

- **Default export** obrigatório (o Astro importa assim).
- Sempre envolver com `ToolShell` (`src/tools/ToolShell.tsx`).
- Ícone: `lucide-react`, `className="size-6"`, `strokeWidth={2}`.
- Coloque a UI real em outro arquivo (`*View.tsx` ou pastas internas). O entry só monta o shell.

CSS específico da tool: importe no entry (`import "./styles.css"`). Não reinventar o design system do site sem necessidade; prefira `src/lib/toolUi.ts`.

---

## Passo 3: Implementar a UI

Use tokens e classes do andre_OS:

- Tokens: `src/styles/tokens.css` (`paper`, `ink`, `accent`, `rule`, …)
- Classes compartilhadas: `src/lib/toolUi.ts` (`toolInputClass`, `toolBtnPrimaryClass`, …)

Layout responsivo (obrigatório neste projeto):

- Mobile-first; até `md` continue em coluna.
- Só use `flex-row` / grids multi-coluna a partir de `lg` (ex.: `flex flex-col lg:flex-row`).
- Nav mobile/hamburger, se houver, até `lg`.

Estado: use `nanostores` / `@nanostores/react`.

---

## Passo 4: Persistência (quando a tool guarda estado)

Se o usuário deve recuperar dados ao recarregar ou compartilhar link:

1. Crie um atom com `createJsonPersistentAtom` de `@/lib/toolStorage/persistentAtom`.
2. Exporte um `ToolStorageEntry`.
3. Passe `storage={...}` no `ToolShell` (ativa “Copiar link” e import via URL).

```ts
// src/tools/MeuPlanner/store.ts
import { createJsonPersistentAtom } from "@/lib/toolStorage/persistentAtom";
import type { ToolStorageEntry } from "@/lib/toolStorage/types";

const STORAGE_KEY = "meu_planner:state_v1";

export interface MeuPlannerState {
	readonly items: readonly string[];
}

const defaultState: MeuPlannerState = { items: [] };

function normalizeState(raw: unknown): MeuPlannerState {
	// valide e sanitize; nunca confie no localStorage
	if (!raw || typeof raw !== "object") return defaultState;
	// ...
	return defaultState;
}

export const meuPlanner$ = createJsonPersistentAtom<MeuPlannerState>({
	storageKey: STORAGE_KEY,
	defaultValue: defaultState,
	normalize: normalizeState,
});

export const meuPlannerStorage: ToolStorageEntry = {
	toolId: "meu_planner",
	keys: [STORAGE_KEY],
	atoms: { [STORAGE_KEY]: meuPlanner$ },
};
```

No entry:

```tsx
<ToolShell
	title="Meu planner"
	description="..."
	icon={...}
	storage={meuPlannerStorage}
>
```

Tools sem estado (ex.: conversor pontual) podem omitir `storage`.

---

## Passo 5: Criar o post da listagem

Arquivo: `src/content/posts/tools/<slug>.md`

```md
---
slug: "meu-planner"
type: tool
title: "Meu planner"
description: "Uma frase curta sobre o que a ferramenta faz no navegador."
date: 2026-07-13
target: "MeuPlanner"
---
```

O campo `description` aparece na listagem (`/`, `/app`, busca). Mantenha alinhado com a `description` do `ToolShell`.

---

## Passo 6: Registrar na rota

Edite `src/pages/app/[slug].astro`:

1. Importe o entry.
2. Adicione o `case` no `switch (target)`.

```astro
import MeuPlanner from "../../tools/MeuPlanner/MeuPlanner";
```

```astro
case "MeuPlanner":
	return <MeuPlanner client:load />;
```

---

## Passo 7: Verificar

```bash
npm run lint
npm run build
npm run dev
```

---

## Estrutura mínima sugerida

```
src/tools/MeuPlanner/
  MeuPlanner.tsx          # entry + ToolShell
  MeuPlannerView.tsx      # UI
  store.ts                # opcional: atom + ToolStorageEntry
  styles.css              # opcional

src/content/posts/tools/meu-planner.md

src/pages/app/[slug].astro   # import + case
```