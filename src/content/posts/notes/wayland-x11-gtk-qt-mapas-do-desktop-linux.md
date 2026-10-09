---
slug: "wayland-x11-gtk-qt-mapas-do-desktop-linux"
type: note
title: "Wayland, X11, GTK e Qt: mapa das camadas do desktop Linux"
date: 2026-06-12
cover: "../../../assets/covers/notes/wayland-x11-gtk-qt-mapas-do-desktop-linux.webp"
---

Escolher GNOME, KDE Plasma ou XFCE parece decisão de tema e atalhos. Você está empilhando três camadas: **display server** (quem fala com GPU e input), toolkit (como apps desenham widgets) e desktop environment (shell, settings, apps padrão). Confundir isso gera expectativa errada sobre compatibilidade, RAM e por que um app Qt "estranho" no GNOME não é bug isolado.

### Display server: X11 e Wayland

X11 (X.Org) nasceu nos anos 80 com servidor centralizado e clientes remotos. Janelas pedem ao X server; qualquer processo com acesso ao socket X pode ler teclas de outro app. Segurança e composição viraram remendos (`compositing manager`, extensões). Ainda domina legado: screen sharing caprichoso, drivers antigos, apps que assumem `xrandr` e `_NET_WM_*`.

Wayland inverte o modelo: o compositor é dono do framebuffer e do input. Apps recebem buffers prontos; não há "janela X" global para terceiros espionarem. Ganha-se tearing menor, gestos nativos e caminho limpo para HiDPI. Programas antigos rodam via XWayland dentro da sessão Wayland. Abrir o app costuma funcionar; gravar tela, compartilhar janela em videoconferência ou controlar outras janelas pedem permissão explícita, e cada desktop implementa de um jeito. No X11 essas funções eram mais soltas por padrão.

`echo $XDG_SESSION_TYPE` retorna `wayland` ou `x11`. Isso define capacidades reais do sistema, não só o nome do menu de login.

### Toolkit: GTK e Qt

GTK e Qt são frameworks de UI: widgets, tema, acessibilidade, file picker, notificações.

GTK (C, bindings em Python/Rust/etc.) é a stack do GNOME. Apps GTK seguem Libadwaita no GNOME 40+: uma lib visual, menos "bring your own theme". Fora do GNOME, GTK ainda roda, mas header bars, client-side decorations e tema podem divergir.

Qt (C++, QML) sustenta KDE Plasma e apps cross-platform (VLC, OBS, Telegram desktop). Traz estilo próprio (Breeze), engine de ícones e abstração multiplataforma. KDE Plasma no Wayland é referência madura; Qt 6 consolidou suporte nativo.

Toolkits não são DEs. Firefox e Chromium usam toolkits próprios; Electron empilha Chromium. Rodar app Qt no GNOME e GTK no Plasma funciona; o incômodo é visual.

### Desktop environment: o pacote completo

DE = compositor + painel + settings + apps default + convenções (tipos MIME, atalhos, energia).

| DE | Compositor típico | Toolkit base | Perfil |
|----|-------------------|--------------|--------|
| GNOME | Mutter (Wayland default) | GTK / Libadwaita | Fluxo simples, pouca customização |
| KDE Plasma | KWin | Qt | Altamente configurável |
| XFCE | Xfwm (X11; Wayland em progresso) | GTK | Leve, desktop clássico |
| LXQt | Openbox ou compositor leve | Qt | Mínimo de RAM |
| MATE | Marco (fork Metacity) | GTK | GNOME 2 preservado, X11-first |
| Cinnamon | Muffin (fork Mutter) | GTK | Bandeja e menu tradicional |

Cinnamon e MATE nasceram da reação ao GNOME 3: menu, bandeja e janelas clássicas. XFCE e LXQt competem no nicho de máquina velha ou servidor com monitor.

Nenhuma DE impede apps de outra stack. O atrito é integração: tema escuro inconsistente, title bar diferente, portal de arquivo errado no Wayland.

### WM sozinho vs DE

i3, Hyprland e Sway são window managers ou compositors tiling, não DEs completos. Entregam layout e atalhos; painel, polkit, rede e brilho você monta (`polybar`, `waybar`, scripts). Controle total e boot rápido, em troca de horas de config e gaps em laptop (suspend, Wi-Fi, Bluetooth).

Sway é i3-like no Wayland; Hyprland adiciona animações e regras dinâmicas sobre wlroots. Escolha de quem trata desktop como código versionado.

### O que usar como usuário comum

Se você só quer instalar e usar, fique no desktop padrão da distro. Fedora e Ubuntu recentes entregam GNOME no Wayland. Quer menu tradicional, bandeja cheia e sliders em todo lugar? KDE Plasma (Kubuntu, openSUSE ou `plasma-desktop` na mesma base) resolve direto.

XFCE e LXQt fazem sentido em PC com pouca RAM ou CPU antiga. Cinnamon e MATE agradam quem sentiu falta do GNOME 2.

Evite i3, Hyprland e Sway como primeiro Linux. Painel, rede, brilho e permissões ficam na sua mão; só vale se você gosta de configurar o ambiente.

Na tela de login, tente Wayland primeiro. Se algum app falhar (screen share antigo, software corporativo legado), volte para X11 naquela sessão. Apps mistos funcionam; diferença visual entre app GNOME e app Qt no mesmo desktop é normal.

Trocar de DE no meio da instalação gera pacote duplicado e tema inconsistente. Melhor escolher spin certo na instalação (Kubuntu, Xubuntu, Linux Mint Cinnamon) do que empilhar ambientes depois.
