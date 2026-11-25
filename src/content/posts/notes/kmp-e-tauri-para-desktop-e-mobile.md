---
slug: "kmp-e-tauri-para-desktop-e-mobile"
type: note
title: "KMP e Tauri para desktop e mobile"
date: 2026-11-25
cover: "../../../assets/covers/notes/kmp-e-tauri-para-desktop-e-mobile.webp"
---

Quando o alvo é **desktop e mobile** no mesmo produto, a conversa útil quase sempre cai em **Kotlin Multiplatform** ou **Tauri**. Os dois cobrem Windows, macOS, Linux, Android e iOS. A vantagem de peso e desempenho entre eles inverte conforme o alvo muda. O erro comum é empurrar React Native ou Flutter nessa conta só porque o time já conhece a stack.

O desafio é um app único no monitor e no celular sem manter duas bases. Tauri v2 e KMP entregam os cinco alvos. No desktop a abordagem web já se tornou familiar. No mobile, Compose nativo e WebView bem polida disputam sensações diferentes. Os dois resolvem o problema de verdade. O resto costuma resolver só metade.

### Peso e partida mudam de lado

No desktop, Tauri leva de lavada no distribuível. O backend roda em Rust nativo e a UI usa a WebView do sistema (WebView2 no Windows, WebKit no macOS, WebKitGTK no Linux). O pacote carrega assets do frontend e o binário Rust. Instalador enxuto, abertura rápida. A RAM em idle ainda reflete o motor web do SO, bem abaixo de um Electron clássico, mas longe de nula.

Compose Desktop paga a JVM e o Skia. Mesmo com `jlink` e ProGuard, runtime Java e libs gráficas nativas entram no pacote. O instalador engorda e o cold start sente a JVM subindo. Aberto, listas enormes e telas densas fluem sem ponte de serialização entre backend e UI.

No Android o jogo vira. Código Kotlin compartilhado vira bytecode DEX e roda na ART com o mesmo perfil de um app 100% Kotlin. Módulo KMP acrescenta pouco ao APK. Com Jetpack Compose a UI já é o caminho oficial do Google. Tauri empacota Rust como `.so` via JNI e desenha HTML no `android.webkit.WebView`. O APK engorda mais fácil, e gestos, teclado e rolagem pedem cuidado extra para não parecer site empacotado. Rust processa dado com velocidade absurda. A interface continua sendo DOM.

### O que o usuário sente

Quem usa o app não sabe qual stack está por baixo. Sente na hora quando a física foge do padrão do sistema.

No desktop, Tauri lembra Linear, Notion ou Slack. Fonte nítida, seleção de texto e inércia do trackpad vêm do motor web do SO. Se o botão deixa selecionar texto por acidente ou a barra de rolagem parece de navegador, a cara de site empacotado aparece na hora. Compose Desktop passa sensação de ferramenta sob medida, próxima de IDEs JetBrains. Listas grandes fluem bem. Usuário atento ainda nota cursor, atalho ou resize um pouco fora do padrão nativo.

No celular, KMP com Compose é indistinguível de app nativo. Toque, overscroll, gesto de voltar, haptic e teclado funcionam sem gambiarra. Tauri denuncia a WebView com facilidade se o frontend for descuidado. Teclado empurra a tela de forma brusca, gesto de voltar não acompanha a transição, rolagem tem resistência diferente. Formulário simples passa. Navegação intensa não.

### As alternativas que costumam falhar

React Native resolve bem o mundo mobile. Quando estica para desktop, ponte nativa e dependência de terceiros quebram a compilação com facilidade a cada atualização de SO ou lib. Manter o mesmo produto no monitor e no celular vira trabalho de plataforma, não de feature.

Flutter entrega motor gráfico maduro e cobre desktop de verdade. O problema é o Dart. A linguagem quase só existe dentro daquele mundo. Você investe tempo num runtime e numa sintaxe que não reaproveita em API, Android tradicional ou backend. Kotlin e TypeScript (no caminho Tauri) saem do app e ainda servem em servidor, script e produto mobile nativo.

Electron continua gigante e pesado demais se o objetivo era instalar leve. Capacitor e wrappers de site no celular herdaram a má fama antiga de WebView travada. Dá para polir. Raramente chega no mesmo nível de um Compose nativo ou de um Tauri bem feito no desktop.

### Escolher entre os dois que funcionam

Compose no Android é padrão oficial do Google. Fora do celular ele se comporta parecido com Flutter. Abre uma janela e desenha pixel a pixel com Skia. Tauri aposta no que o browser do SO já faz bem com tipografia, seleção de texto e layout. Os dois desenham UI própria em cima do sistema. Nenhum é “mais oficial” nos cinco alvos ao mesmo tempo.

Ferramenta interna ganha com qualquer um dos dois. Uma base, cinco plataformas, correção única para escritório e campo. No KMP, Compose Multiplatform no iOS já compila via Kotlin/Native. No Tauri, o mesmo frontend web e o backend Rust seguem para mobile. Em ambos, assinar iOS e macOS ainda exige ambiente Apple.

Se o time domina web e Rust, e o produto vive mais no desktop, Tauri entrega distribuição leve e abertura rápida. Se o time quer Kotlin de ponta a ponta e resposta tátil nativa no celular, KMP evita a sensação de site empacotado no Android. Os dois estão no jogo. Flutter e React Native, para desktop e mobile juntos, costumam sair dele cedo demais.
