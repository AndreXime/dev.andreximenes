---
slug: "pipeline-hibrido-biome-e-eslint-para-seguranca-e-performance"
type: note
title: "Pipeline híbrido: Biome e ESLint para segurança e performance"
date: 2026-05-29
cover: "../../../assets/covers/notes/pipeline-hibrido-biome-e-eslint-para-seguranca-e-performance.webp"
---

Time rodava ESLint completo no pre-commit. Commit de três linhas esperava 25 segundos. Dev desligava hook com `--no-verify`; regra de segurança virou sugestão. Rodar só Biome local e ESLint pesado no CI quebra o outro extremo: PR verde com `any` escapando porque subset do CI não espelhava o que importava.

Divisão que funcionou: ferramenta rápida no caminho quente (save, commit), análise type-aware e SAST no PR. Não por branch, por gatilho do pipeline.

```text
[Dev] -> Biome (IDE + pre-commit)
          |
     (push PR)
          v
[CI] -> Biome ci -> ESLint (types + security)
```

### Local: Biome no hook

Biome formata e lint em milissegundos. Husky ou Lefthook chamam `biome check --write` ou `biome ci` antes do commit. Regra de estilo, import order, `noUnusedVariables` básico: feedback instantâneo. Dev não aprende a ignorar hook.

ESLint completo com `parserOptions.project` no pre-commit punir quem commita often. Guarda ESLint para CI; local fica utilizável.

### CI: Biome + subset ESLint

PR roda `biome ci` primeiro. Se alguém desabilitou hook, estilo inconsistente quebra cedo. Depois ESLint com config separada (`eslint.ci.config.js` ou `--config`) carregando só plugins que Biome não substitui: type-aware TypeScript e segurança.

40 segundos no CI não travam fluxo: quem pushou já seguiu em frente. Falha de `no-floating-promises` ou `detect-object-injection` bloqueia merge antes de `main`, que é onde barreira deve estar.

Cache é obrigatório em repo grande:

```yaml
- name: Cache ESLint
  uses: actions/cache@v4
  with:
    path: .eslintcache
    key: ${{ runner.os }}-eslint-${{ hashFiles('**/package-lock.json') }}

- name: Run Fast Lint (Biome)
  run: npx @biomejs/biome ci .

- name: Run Deep Lint (ESLint)
  run: npx eslint . --cache --cache-location .eslintcache -c eslint.ci.config.js
```

Segundo job sem cache em monorepo TypeScript vira gargalo de fila no GitHub Actions.

### Plugins que valem no subset do CI

Biome cobre formatação e parte do lint estilo. ESLint no CI foca o que precisa de grafo de tipos ou heurística de segurança.

`@typescript-eslint` com `project: true` pega Promise flutuando (`no-floating-promises`), `await` em valor não thenable e propagação de `any` silenciosa. Bug que só estoura em produção sob carga.

`eslint-plugin-security` flagra `require(variable)`, regex catastrophic backtracking e `eval`. `eslint-plugin-no-unsanitized` exige sanitização antes de `innerHTML` em código isomórfico que roda no server e no client.

`eslint-plugin-import-x` com `import/no-cycle` evita ciclo A→B→A que vira `undefined` em runtime no Node. `no-unused-modules` acha export morto antes de virar dívida. `eslint-plugin-sonarjs` aponta função com complexidade cognitiva 40+ que ninguém revisa mais.

`eslint-plugin-unicorn` é opcional no CI se Biome já cobre modern syntax; útil para `replaceAll`, preferência por `Array#at` e padrões que Biome ainda não espelha.

### Manutenção

Duas configs exigem disciplina: mudança de regra documentada em qual camada vive. Reunião de onboarding explica "Biome no commit, ESLint no PR". Sem isso, dev roda ESLint local achando que CI repete e perde tempo debugando diferença.

Híbrido não é duplicar tudo duas vezes. É Biome como padrão de estilo no caminho quente e ESLint como auditor lento no portão de merge. Hook rápido vira hábito; hook lento vira `--no-verify`.
