# dev.andreximenes

Hub de André Ximenes: notas longas, ferramentas web e links curados. Visual índice utilitário (papel quente, acento laranja, tipografia Hanken Grotesk). O site roda em Astro e TypeScript, com React nas ferramentas em `/app/*`, Tailwind CSS v4 com tokens OKLCH, Content Collections em Markdown.

**Site:** [https://dev.andreximenes.xyz](https://dev.andreximenes.xyz)

## Conteúdo

Três tipos de publicação, acessíveis pela home e pelas seções do nav:

- **Notas** (`/post`): artigos técnicos em Markdown
- **Ferramentas** (`/app`): apps React no navegador (planejador, RSS, CV, etc.)
- **Links** (`/link`): curadoria com favicon e link externo

## Ferramentas

Apps React em `/app`. Em geral os dados ficam no navegador; exceções: o leitor RSS usa um proxy no servidor, a calculadora de renda consulta a BrasilAPI, e a remoção de fundo baixa o modelo de IA sob demanda.

- **Bloco de notas**: notas locais com busca, pin e preview em Markdown
- **Canvas**: editor gráfico 2D com formas, texto, imagem, camadas e exportação PNG
- **Criador de currículos**: monta CVs em Markdown, prompts para IA e exporta PDF
- **Ferramentas de imagem**: converte, comprime e remove fundo sem enviar arquivos a servidor
- **Ferramentas para o dia a dia**: combustível, renda passiva, porcentagem e senhas
- **Leitor de feeds RSS**: lê vários feeds RSS num só lugar
- **Livro de receitas**: caderno pessoal de receitas, compartilhável por link
- **Planejador semanal**: blocos de horário alinhados entre os dias da semana
- **Planejador financeiro**: controle de assinaturas e gasto médio diário
- **Planejador de Independência Financeira**: projeção FIRE com gap do INSS e IR
- **Temas CSS**: presets, tokens e preview de seções de landing
- **Transmissão óptica QR**: envia texto ou arquivos entre dispositivos via stream de QR Codes

Para criar uma ferramenta nova, siga o passo a passo em [`tools.md`](./tools.md).

## Design

Ver [`design.md`](./design.md) e `src/styles/tokens.css` para o sistema visual.

## Como rodar

```bash
npm install
npm run dev       # http://localhost:4321
npm run build
npm run preview
npm run lint      # biome + astro check
npm test          # vitest
```
