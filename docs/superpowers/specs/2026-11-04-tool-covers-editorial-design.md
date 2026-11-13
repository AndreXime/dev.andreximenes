# Capas editoriais das tools

Trocar screenshots de UI em `src/assets/covers/tools/` por capas editoriais planas, legíveis, no mesmo universo de papel creme/acento teal do hub, sem diluir no lifestyle 3D das notas.

## Decisões

| Tema | Decisão |
|------|---------|
| Conteúdo | Metáfora literal plana (quase sem profundidade), não screenshot |
| Diferenciação das notas | Tools = flat/gráfico; notes = produto/lifestyle com mais profundidade |
| Texto | Só como elemento no objeto, quando a metáfora precisa (ex.: `CV` grande no papel) |
| Formato | WebP 1200×750 (~16:10), path e frontmatter inalterados |
| Docs | README / tools.md / design.md: tools passam a capa editorial |

## Brief por tool

1. **criador-de-curriculos** — Dois papéis flat before → after. `CV` grande no topo de ambos. Esquerda bagunçada com X, direita limpa + selo teal.
2. **bloco-de-notas** — Uma sticky note centralizada com alfinete teal e texto legível curto (título `nota` + linhas de corpo).
3. **calendario-pessoal** — Grade mensal flat, um dia marcado em teal. Sem título externo.
4. **canvas** — Tela flat com 3 formas geométricas + guia pontilhada. Marca pequena `PNG` no canto.
5. **despensa** — Prancheta com checklist + armário com mantimentos flat. Sem título externo.
6. **ferramentas-de-imagem** — Dois frames: foto cheia → silhueta sem fundo. Seta teal. Tag `webp` no frame limpo.
7. **ferramentas-para-o-dia-a-dia** — Calculadora + dados/moeda + régua flat. Número `42` na calculadora.
8. **goal-quest** — Card de missão flat: checkbox, barra XP, badge teal. `XP` ou `Lv 1` no card.
9. **planejador-de-independencia-financeira** — Coluna baixa → coluna alta + linha. Detalhe `0,5%`.
10. **planejador-financeiro** — Lista flat de assinaturas + total `R$/dia` grande.
11. **planejador-semanal** — Grade 7 colunas (D–S), blocos de horário, um bloco teal.
12. **temas-css** — Três swatches flat + snippet `--accent`. Um swatch teal ativo.
13. **transmissao-optica-qr** — Dois devices flat (tela + câmera) com QR no meio e seta óptica teal.

## Fora de escopo

- Mudança de layout das listagens
- Regenerar capas de notes/links
- Automação de geração no build
