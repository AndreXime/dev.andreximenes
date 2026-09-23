# Goal Quest — Design

Ferramenta web gamificada de missões no hub `dev.andreximenes`, em `/app/goal-quest/`.

## Objetivo

Permitir criar e concluir missões com cadência diária, semanal, mensal ou data única, com XP, nível, streak de obrigatórias e badges. Persistência só no browser (localStorage + link de compartilhamento).

## Fora de escopo (MVP)

- Backend, contas ou sync multi-dispositivo além do link de export
- Notificações push / lembretes nativos
- Missões compartilhadas entre pessoas
- Streak baseado em semanal/mensal
- Customização de badges ou curva de XP pelo usuário

## Nome e integração

| Campo | Valor |
|-------|--------|
| Pasta / componente | `GoalQuest` |
| slug | `goal-quest` |
| title | Goal Quest |
| description | Missões diárias, semanais, mensais e de data única com XP, nível, streak e badges. |
| toolId | `goal_quest` |
| Storage key | `goal_quest:state_v1` |

Arquivos de integração (padrão `tools.md`):

1. `src/tools/GoalQuest/` (app React)
2. `src/content/posts/tools/goal-quest.md`
3. `case` em `src/pages/app/[slug].astro`

## Modelo de dados

### Mission

```ts
interface Mission {
  id: string;
  title: string;
  notes: string;
  cadence: "daily" | "weekly" | "monthly" | "once";
  difficulty: "easy" | "medium" | "hard";
  required: boolean;
  active: boolean;
  dueDate: string | null; // YYYY-MM-DD; obrigatório se cadence === "once"
  createdAt: string; // ISO
  updatedAt: string; // ISO
}
```

### Completion

```ts
interface Completion {
  id: string;
  missionId: string;
  completedAt: string; // ISO
  xpAwarded: number;
  cycleKey: string;
}
```

### Player / state

```ts
interface GoalQuestState {
  missions: Mission[];
  completions: Completion[];
  xp: number;
  streakCurrent: number;
  streakBest: number;
  streakCheckedOn: string | null; // YYYY-MM-DD último reconcile
  unlockedBadges: string[];
}
```

`level` é derivado de `xp` (não persistido).

### cycleKey

| Cadência | Formato | Exemplo |
|----------|---------|---------|
| daily | `YYYY-MM-DD` | `2026-09-23` |
| weekly | `YYYY-Www` (ISO week) | `2026-W39` |
| monthly | `YYYY-MM` | `2026-09` |
| once | a própria `dueDate` | `2026-12-31` |

Uma missão recorrente está **pendente** no ciclo atual se não existir completion com o mesmo `missionId` + `cycleKey` atual. Ao concluir, some da lista do ciclo e volta pendente no próximo ciclo automaticamente (sem recriar o registro da missão).

Missão `once` concluída não renasce; permanece no histórico.

## Gamificação

### XP

Base por cadência:

| Cadência | Base |
|----------|------|
| daily | 10 |
| weekly | 40 |
| monthly | 120 |
| once | 80 |

Multiplicador por dificuldade: easy `1`, medium `1.5`, hard `2`.

`xpAwarded = floor(base * multiplier)`.

### Nível

Curva cumulativa: para alcançar o nível `N` (N ≥ 1), XP total necessário = `50 * N * (N - 1)`.

- Nível 1: 0 XP
- Nível 2: 100 XP
- Nível 3: 300 XP
- Nível 4: 600 XP
- etc.

Fórmula: `xpToReachLevel(N) = 50 * N * (N - 1)`.

### Streak

- Avaliado no timezone local do browser.
- Só missões `cadence === "daily"`, `required === true`, `active === true` contam.
- Se não houver nenhuma diária obrigatória ativa: streak não sobe nem zera (pausa); `streakCheckedOn` ainda atualiza para não reprocessar.
- Se houver ≥1: ao reconciliar o dia `D`, se o dia anterior `D-1` tinha diárias obrigatórias ativas e alguma ficou sem completion no `cycleKey` de `D-1`, streak zera. Se todas foram concluídas em `D-1`, e ainda não contamos esse dia, `streakCurrent += 1` e atualiza `streakBest`.
- Reconcile roda ao montar a tool e ao concluir uma missão (idempotente via `streakCheckedOn`).
- Semanal, mensal e once nunca quebram streak.

Regra operacional no MVP (simples e auditável):

1. No primeiro open do dia `D`, se `streakCheckedOn < D`:
2. Considere o dia de referência `R = D - 1 dia`.
3. Se em `R` não havia diárias obrigatórias ativas → não altera streak.
4. Se havia e todas têm completion com `cycleKey === R` → `streakCurrent += 1`.
5. Se havia e alguma falta → `streakCurrent = 0`.
6. `streakBest = max(streakBest, streakCurrent)`; `streakCheckedOn = D`.

Conclusões no próprio dia `D` alimentam o streak na virada para `D+1`, não no mesmo instante (exceto se quisermos feedback imediato: opcionalmente, na UI de Hoje, mostrar “streak seguro hoje” se todas as obrigatórias de `D` já foram feitas, sem incrementar ainda). MVP: incrementar só no reconcile do dia seguinte.

### Badges (ids fixos)

| id | Critério |
|----|----------|
| `streak_3` | streakBest ≥ 3 |
| `streak_7` | streakBest ≥ 7 |
| `streak_30` | streakBest ≥ 30 |
| `level_5` | level ≥ 5 |
| `level_10` | level ≥ 10 |
| `completions_10` | total completions ≥ 10 |
| `completions_50` | ≥ 50 |
| `completions_100` | ≥ 100 |
| `first_daily` | ≥1 completion de missão daily |
| `first_weekly` | ≥1 weekly |
| `first_monthly` | ≥1 monthly |
| `first_once` | ≥1 once |

Avaliação após cada completion e após reconcile de streak. Badges só desbloqueiam; não removem.

## UI

Workbench com abas (coluna até `md`; layouts horizontais só a partir de `lg`):

1. **Hoje** — diárias pendentes do ciclo atual + once ativas pendentes com `dueDate <= hoje` (atrasadas entram aqui); botão concluir; indicador de obrigatória; resumo nível / XP / streak.
2. **Missões** — CRUD; filtros por cadência; toggle `required`, `difficulty`, `active` (arquivar = `active: false`).
3. **Progresso** — barra de XP, nível, streak atual/recorde, grid de badges.
4. **Histórico** — completions dos últimos 60 dias, agrupadas por data local.

Usar `ToolShell`, tokens do site e classes de `src/lib/toolUi.ts`. Sem cards decorativos; lista + formulário.

## Arquitetura de código

```
src/tools/GoalQuest/
  GoalQuest.tsx
  GoalQuestView.tsx
  domain.ts          # puro: XP, level, cycleKey, pending, streak, badges
  store.ts           # atom + normalize + ToolStorageEntry
  ui/
    TodayTab.tsx
    MissionsTab.tsx
    ProgressTab.tsx
    HistoryTab.tsx
    MissionForm.tsx
```

Estado: `createJsonPersistentAtom` + `normalize` defensivo. Ações no store chamam funções de `domain.ts` e gravam o novo estado.

Testes: unitários em `domain.ts` (Vitest), cobrindo XP, level, cycleKey, pending no ciclo, streak e badges.

## Critérios de aceite

- Criar missão em cada cadência e concluir na aba certa
- Recorrentes somem do ciclo atual e voltam no próximo sem recriar
- XP e nível atualizam ao concluir
- Streak sobe/zerá conforme regras de diárias obrigatórias
- Badges desbloqueiam nos limiares
- Estado sobrevive a reload; “Copiar link” / import via `ToolShell` funciona
- `npm run lint` e `npm run build` passam

## Decisões travadas

- Abordagem: workbench em abas
- Gamificação: XP + nível + streaks
- Recorrência: renasce sozinha no próximo ciclo
- Streak: só diárias obrigatórias
- XP: base por cadência × dificuldade
- MVP: histórico + filtros + badges
