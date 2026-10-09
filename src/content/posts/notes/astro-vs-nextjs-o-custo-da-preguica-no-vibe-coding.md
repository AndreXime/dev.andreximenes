---
slug: "astro-vs-nextjs-o-custo-da-preguica-no-vibe-coding"
type: note
title: "Astro vs Next.js: o custo da preguiça no vibe coding"
date: 2026-03-01
cover: "../../../assets/covers/notes/astro-vs-nextjs-o-custo-da-preguica-no-vibe-coding.webp"
---

Pedi para a IA gerar landing page de produto SaaS. Veio Next.js com App Router, cinco dependências de UI e hidratação em página que só tinha hero, três cards e formulário de waitlist. Funcionava no preview. No 4G, First Contentful Paint passava de três segundos porque o bundle React precisava baixar antes de mostrar texto estático. O modelo aprendeu com milhões de repos React; `npx create-next-app` virou default para qualquer coisa com HTML.

Blog, docs, portfolio e marketing site raramente precisam de SPA. São HTML com ilhas de interatividade: menu mobile, accordion de FAQ, toggle de tema. Next.js manda JavaScript para hidratar componente que poderia ser markup puro. Astro inverte: zero JS por default, componente interativo só onde você marcar com `client:*`.

### O que muda no bundle

Página Astro típica envia HTML renderizado no build. Componente React/Preact/Svelte entra só com diretiva explícita (`client:load`, `client:visible`, `client:idle`). Footer, header estático, copy de marketing ficam fora do bundle client-side. Next.js 13+ melhorou com Server Components, mas projeto pequeno ainda carrega runtime React, router client-side e chunk de hidratação para árvore que poderia ser string no build.

Teste simples: abra DevTools, desabilite cache, recarregue landing estática em Next e em Astro equivalente. Compare transferred JS. Diferença de centenas de KB em página sem dashboard é comum.

### Astro, Preact e script inline

Preact (~3 kB gzip) cobre formulário com validação, carrinho mini, widget com estado. Reservar React 40 kB+ para isso é desperdício quando a página inteira não é app.

Interação trivial não precisa de framework. Menu hamburger:

```html
<button id="menu-btn" aria-expanded="false">Menu</button>
<nav id="menu" hidden>...</nav>
<script>
  const btn = document.getElementById("menu-btn");
  const nav = document.getElementById("menu");
  btn.addEventListener("click", () => {
    const open = nav.hidden;
    nav.hidden = !open;
    btn.setAttribute("aria-expanded", String(open));
  });
</script>
```

Sem build step extra, sem hidratação, sem mismatch server/client. Astro aceita `<script>` inline no `.astro` ou componente; escopo e bundling ficam sob controle.

### Onde Next.js ainda ganha

Dashboard autenticado com tabelas filtráveis, drag-and-drop, estado global entre rotas: aí SPA ou Next com client components pesados faz sentido. Time já padronizado em React, design system pronto, deploy na Vercel com preview por PR. Forçar Astro nesse cenário só para "performance" vira gambiarra de islands em app que é app de verdade.

O erro é usar Next por default no projeto que é 90% conteúdo estático porque o snippet da IA ou o tutorial de 2023 mandou. Astro + Preact + script inline força pergunta antes de cada `client:load`: isso precisa de JS no browser ou só no build?

Rodapé, nav, seção de pricing estática não precisam de RSC com suspense boundary. Colocar React ali transfere complexidade para infra ou celular do visitante. Stack enxuta devolve performance que se perdeu quando gerar código ficou mais fácil que pensar arquitetura.
