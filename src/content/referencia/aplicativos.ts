export interface Aplicativo {
	nome: string;
	id: string;
	descricao: string;
}

export interface Rom {
	nome: string;
	sistema: string;
	sistemaNome: string;
	arquivo: string;
	descricao: string;
	genero: string;
	ano: string;
	capa: string;
	emulador: string;
}

export const ASSET_BASE = "/referencia/aplicativos";

export const APLICATIVOS: readonly Aplicativo[] = [
	{
		nome: "Discord",
		id: "com.discordapp.Discord",
		descricao: "Chat de voz e texto para comunidades, grupos e chamadas.",
	},
	{
		nome: "OBS Studio",
		id: "com.obsproject.Studio",
		descricao: "Grava a tela e transmite ao vivo, com cenas e fontes.",
	},
	{
		nome: "Celluloid",
		id: "io.github.celluloid_player.Celluloid",
		descricao: "Reprodutor de vídeo simples, baseado no mpv.",
	},
	{
		nome: "PCSX2",
		id: "net.pcsx2.PCSX2",
		descricao: "Emulador de PlayStation 2.",
	},
	{
		nome: "Dolphin Emulator",
		id: "org.DolphinEmu.dolphin-emu",
		descricao: "Emulador de GameCube e Wii.",
	},
	{
		nome: "Chromium Web Browser",
		id: "org.chromium.Chromium",
		descricao: "Navegador de código aberto, base do Chrome.",
	},
	{
		nome: "Calculadora",
		id: "org.gnome.Calculator",
		descricao: "Calculadora do GNOME, com modo básico e avançado.",
	},
	{
		nome: "Aparador de Vídeo",
		id: "org.gnome.gitlab.YaLTeR.VideoTrimmer",
		descricao: "Corta o início e o fim de um vídeo sem reencodar.",
	},
	{
		nome: "KWrite",
		id: "org.kde.kwrite",
		descricao: "Editor de texto leve do KDE.",
	},
	{
		nome: "Gwenview",
		id: "org.kde.gwenview",
		descricao: "Visualizador de imagens simples do KDE.",
	},
	{
		nome: "Filelight",
		id: "org.kde.filelight",
		descricao: "Mostra o uso do disco e ajuda a apagar o que não é usado.",
	},
	{
		nome: "MAME",
		id: "org.mamedev.MAME",
		descricao: "Emula fliperamas e outros sistemas antigos.",
	},
	{
		nome: "Firefox",
		id: "org.mozilla.firefox",
		descricao: "Navegador da Mozilla, focado em privacidade.",
	},
	{
		nome: "ONLYOFFICE Desktop Editors",
		id: "org.onlyoffice.desktopeditors",
		descricao: "Edita documentos, planilhas e apresentações no formato do Office.",
	},
	{
		nome: "PdfCraft",
		id: "ai.storyteller.pdfcraft",
		descricao: "Lê, organiza e protege arquivos PDF.",
	},
];

export const ICONES_PNG: ReadonlySet<string> = new Set([
	"net.pcsx2.PCSX2",
	"org.chromium.Chromium",
	"org.mamedev.MAME",
	"org.mozilla.firefox",
	"org.onlyoffice.desktopeditors",
	"ai.storyteller.pdfcraft",
]);

export const ROMS: readonly Rom[] = [
	{
		nome: "DOOM",
		sistema: "doom",
		sistemaNome: "Doom",
		arquivo: "Doom.sh · Doom1.wad",
		descricao:
			'O jogador recebe o papel de um fuzileiro espacial (o nome do fuzileiro nunca é revelado pois ele supostamente representa o próprio jogador), "um dos fuzileiros mais durões da Terra, endurecido em combate e treinado para a ação" (one of Earth\'s toughest, hardened in combat and trained for action), que foi deportado para Marte por atirar num oficial superior quando este ordenou que ele matasse inocentes civis e desarmados. Ele é deste modo forçado a trabalhar para a Union Aerospace Corporation (UAC), um complexo militar industrial que está realizando experiências secretas em teletransportação entre as luas de Marte conhecidas como Phobos e Deimos. subitamente, algo dá errado e criaturas aparentemente vindas do inferno começam a surgir das áreas de teletransporte. Uma resposta defensiva da segurança da base falha em deter a invasão e é rapidamente dominada por demônios, com toda a guarnição morta ou transformada em zumbis ao mesmo tempo, Deimos desaparece inteiramente sem nenhuma explicação. Um time da UAC em Marte é enviado a Phobos para investigar o incidente, mas o contato pelo rádio cessa e apenas um deles permanece vivo : o jogador, cuja tarefa é escapar vivo.',
		genero: "Tiro em 1ª pessoa",
		ano: "1993",
		capa: "capas/doom/Doom.png",
		emulador: "GZDoom",
	},
	{
		nome: "DOOM II",
		sistema: "doom",
		sistemaNome: "Doom",
		arquivo: "Doom II.sh · Doom2.wad",
		descricao:
			'O jogo Doom original é dividido em episódios, com isso a nomenclatura dos mapas era ExMy (Episódio x, Mapa y), mas a partir de Doom II (e todos os títulos da série baseados neste novo formato) o jogo segue uma ordem linear de 32 mapas (sendo 30 "convencionais" e 2 secretos) sem divisão em episódios e classificados sob a nomenclatura MAPxy (onde o "xy" é simplesmente o número do mapa desejado).',
		genero: "Tiro em 1ª pessoa",
		ano: "1994",
		capa: "capas/doom/Doom II.png",
		emulador: "GZDoom",
	},
	{
		nome: "Brutal Doom v21",
		sistema: "doom",
		sistemaNome: "Doom",
		arquivo: "brutalv21.pk3",
		descricao:
			"Mod de Sergeant Mark IV que deixa o combate do Doom mais rápido e violento, com armas novas, inimigos mais agressivos e mortes gráficas. Entra por cima do Doom e do Doom II.",
		genero: "Tiro em 1ª pessoa",
		ano: "2017",
		capa: "capas/doom/Brutal Doom v21.png",
		emulador: "GZDoom",
	},
	{
		nome: "Galaga",
		sistema: "mame",
		sistemaNome: "MAME",
		arquivo: "galagao.zip",
		descricao:
			"Galaga is a single-screen shoot-em-up in which the player controls a 'Fighter' spaceship and must defend the home planet against the on-coming hordes of alien invaders called \"Galagans\". The Fighter can only move left and right along the bottom of the screen. Galagans fly onto the screen in a variety of formations before forming troop lines at the top of the screen. Once all troop lines are formed the Galagans separate and start attacking the player's Fighter in ones, twos and threes. The top-line Boss Galaga need to be shot twice before they are destroyed.",
		genero: "Shoot'em Up / Vertical",
		ano: "1981",
		capa: "capas/mame/galagao.png",
		emulador: "MAME",
	},
	{
		nome: "The King of Fighters 2002",
		sistema: "mame",
		sistemaNome: "MAME",
		arquivo: "kof2002.zip",
		descricao:
			'O segundo "dream match" sem trama da série King of Fighters, este jogo apresenta 39 personagens normais e 5 personagens secretos, alguns dos quais não aparecem desde o KOF98. O sistema de jogabilidade também mudou. O sistema de atacantes e as equipes de quatro personagens encontradas nos últimos três lançamentos de KOF foram totalmente removidos. Em seu lugar estão as equipes de três personagens da velha guarda e o sistema "Advance" do The King of Fighters \'97 e The King of Fighters \'98.',
		genero: "Luta / Versus",
		ano: "2002",
		capa: "capas/mame/kof2002.png",
		emulador: "MAME",
	},
	{
		nome: "Mega Man X",
		sistema: "mame",
		sistemaNome: "MAME",
		arquivo: "Mega Man X.sh · Mega Man X (USA) (Rev 1).zip",
		descricao:
			"Em 21XX, o caçador X enfrenta a rebelião dos Reploids liderada por Sigma. Plataforma de ação do SNES, com as armas dos chefes e as cápsulas do Dr. Light.",
		genero: "Plataforma",
		ano: "1993",
		capa: "capas/mame/Mega Man X.png",
		emulador: "MAME",
	},
	{
		nome: "Metal Slug 3",
		sistema: "mame",
		sistemaNome: "MAME",
		arquivo: "mslug3.zip",
		descricao:
			"Na terceira parte da série Metal Slug, o General Morden está de volta e ele planeja estabelecer uma nova ordem mundial. Você guia um dos heróis: Marco, Tarma, Eri ou Fio enquanto eles abrem caminho através de níveis laterais com um tema único, repleto de incontáveis inimigos e chefes difíceis. Você tem que libertar os reféns e você pode montar veículos bizarros, como camelos, elefantes, tanques e robôs.",
		genero: "Tiro / Run and Gun",
		ano: "2001",
		capa: "capas/mame/mslug3.png",
		emulador: "MAME",
	},
	{
		nome: "Ms. Pac-Man",
		sistema: "mame",
		sistemaNome: "MAME",
		arquivo: "mspacman.zip",
		descricao:
			"In this, the first proper sequel to Namco's legendary pill eating maze game, players must once again run around a number of mazes, eating all of the pills that are scattered throughout. The ever-present ghosts (Blinky, Pinky, Inky and Sue) return to hamper the player's progress. The infamous 'Power Pills' are also present and correct, with four appearing in each maze. Namco introduced a number of changes and enhancements over the original game. The first difference is in the main character. For the first time in video-game history, the game's lead character was female. Ms. Pac-Man is almost identical to the original character with two main differences; she wears a bow in her 'hair', and is also wearing lipstick. Another change from the original is that the bonus fruit items are no longer static but now move randomly around the mazes. Ms Pac-Man features four different maze layouts, which alternate every two to four rounds:",
		genero: "Ação",
		ano: "1981",
		capa: "capas/mame/mspacman.png",
		emulador: "MAME",
	},
	{
		nome: "Street Fighter II' : Champion Edition",
		sistema: "mame",
		sistemaNome: "MAME",
		arquivo: "sf2ce.zip",
		descricao:
			"Dos cantos do globo vêm doze dos lutadores mais durões, vindo das ruas. Escolha o seu campeão e entre na arena como um dos oito desafiadores originais ou como um dos quatro Grandes Mestres! Soque seu oponente e nocautei-os até a abertura da contagem, como Balrog. Proteja-se de sua presa como Sagat e em seguida os atordoe com seu impressionante tiro Tiger. Fatie seu oponente com garra de Vega e enviá-los correndo para casa. Ou golpeie o medo em seus inimigos como o M. Bison, o grande mestre de tudo!",
		genero: "Luta",
		ano: "1992",
		capa: "capas/mame/sf2ce.png",
		emulador: "MAME",
	},
	{
		nome: "Street Fighter III 3rd Strike : Fight for the Future",
		sistema: "mame",
		sistemaNome: "MAME",
		arquivo: "sfiii3.zip · sfiii3/cap-33s-1.chd, sfiii3/cap-33s-2.chd",
		descricao:
			"As the world recovers from the events of the Second World Warrior Tournament, Gill, the leader of the secret Illuminati organization, launches a new tournament to attract the planet's best fighters. His goal: to recruit elite warriors for his army and expand his influence. Among the participants, Chun-Li returns after a long absence, determined to protect her adopted daughter Li-Fen and pass on her martial art to the new generation. Around her, familiar faces like Ryu, Ken, and Akuma, as well as new fighters such as Makoto, Remy, or the mysterious Q, battle for reasons as varied as revenge, the quest for power, or simply honor.",
		genero: "Luta / 2D",
		ano: "1999",
		capa: "capas/mame/sfiii3.png",
		emulador: "MAME",
	},
	{
		nome: "Ultimate Mortal Kombat 3",
		sistema: "mame",
		sistemaNome: "MAME",
		arquivo: "umk3.zip",
		descricao:
			"Ultimate Mortal Kombat 3 (UMK3) é um jogo de luta da série Mortal Kombat, desenvolvido e lançado pela Midway para arcades em 1995. É uma atualização do Mortal Kombat 3 de 1995, com um sistema de jogo alterado, personagens adicionais como o retorno dos favoritos Kitana e Scorpion que estavam faltando no Mortal Kombat 3, e alguns novos recursos. É essencialmente a versão completa do Mortal Kombat 3.",
		genero: "Luta",
		ano: "1995",
		capa: "capas/mame/umk3.png",
		emulador: "MAME",
	},
	{
		nome: "X-Men vs. Street Fighter",
		sistema: "mame",
		sistemaNome: "MAME",
		arquivo: "xmvsfu.zip",
		descricao:
			"X-Men vs. Street Fighter coloca os poderosos mutantes da Marvel contra os lutadores lendários da Capcom em uma batalha de proporções épicas. Agora você pode realizar movimentos ultrajantes e conectar incríveis Combos em Cadeia. X-Men vs. Street Fighter... a colisão de dois universos explosivos no lutador de fantasia mais incrível do mundo!",
		genero: "Luta",
		ano: "1996",
		capa: "capas/mame/xmvsfu.png",
		emulador: "MAME",
	},
	{
		nome: "Burnout 3 : Takedown",
		sistema: "ps2",
		sistemaNome: "PlayStation 2",
		arquivo: "Burnout 3 - Takedown (USA).chd",
		descricao:
			"Burnout 3: Takedown é um jogo de corridas que incentiva a condução agressiva e permite-te usar o teu veículo para lutares até à meta, eliminando rivais e causando grandes colisões. Quantos mais carros destruíres, quantos mais danos infligires, mais eventos e carros poderás desbloquear. O Burnout 3 também inclui um modo de colisão que coloca o teu carro em vários cruzamentos cheios de veículos em movimento para veres os danos que consegues causar.",
		genero: "Corrida, Pilotagem",
		ano: "2004",
		capa: "capas/ps2/Burnout 3 - Takedown (USA).png",
		emulador: "PCSX2",
	},
	{
		nome: "Crash Bandicoot : The Wrath of Cortex",
		sistema: "ps2",
		sistemaNome: "PlayStation 2",
		arquivo:
			"Crash Bandicoot - The Wrath of Cortex (USA) (v1.01).bin · Crash Bandicoot - The Wrath of Cortex (USA) (v1.01).cue",
		descricao:
			"Crash Bandicoot: The Wrath of Cortex é o primeiro jogo da série Crash Bandicoot para um sistema que não seja o PlayStation original. A história se passa algum tempo após Warped: Dr. Cortex quer vingança depois de ser derrotado por Crash (novamente). Para isso, ele cria Crunch, um super-bandicoot que pode destruir tudo que cruza seu caminho. Assim, Crash precisa derrotar Crunch (e, no final, Dr. Cortex). O jogo é um típico jogo de plataforma, com algumas passagens de ação adicionais, como combates aéreos e uma sequência em que Crash fica preso dentro de uma esfera gigante rolando em algum tipo de montanha-russa. Todos os gráficos são em 3D, e o som é típico de jogos de desenhos animados como este. O jogo como um todo é bastante direto em seu design, não sendo realmente possível ficar preso em um quebra-cabeça.",
		genero: "Plataforma",
		ano: "2001",
		capa: "capas/ps2/Crash Bandicoot - The Wrath of Cortex (USA) (v1.01).png",
		emulador: "PCSX2",
	},
	{
		nome: "Downhill Domination",
		sistema: "ps2",
		sistemaNome: "PlayStation 2",
		arquivo: "Downhill Domination (USA).chd",
		descricao:
			"Downhill Domination is a video game based on a fictional racing event with fictional racers mixed with a few unlockable professional racers. The game was released exclusively for the PlayStation 2. Downhill Domination includes a very different style of gameplay that differs from standard bike racing games by having the character riding downhill almost exclusively (hence the name), due to the incline of the tracks.",
		genero: "Esporte / Ciclismo",
		ano: "2003",
		capa: "capas/ps2/Downhill Domination (USA).png",
		emulador: "PCSX2",
	},
	{
		nome: "Dragon Ball Z : Budokai Tenkaichi 3",
		sistema: "ps2",
		sistemaNome: "PlayStation 2",
		arquivo: "Dragon Ball Z - Budokai Tenkaichi 3 (USA) (En,Ja).chd",
		descricao:
			"Em Dragon Ball Z: Budokai Tenkaichi 3, prepare-se para batalhas de tirar o fôlego no universo Dragon Ball mais expansivo de todos os tempos. Escolha entre um elenco colossal de mais de 150 personagens jogáveis, incluindo heróis, vilões e transformações lendárias, cada um com seus próprios poderes e habilidades únicos. Domine combos devastadores, explore vastos cenários destrutíveis e utilize técnicas especiais espetaculares para superar seus oponentes. Budokai Tenkaichi 3 oferece diversos modos de jogo, incluindo Arcade, Versus, Online e História, além de gráficos aprimorados, jogabilidade frenética e a chance de reviver as batalhas épicas de Dragon Ball Z em uma escala épica.",
		genero: "Luta",
		ano: "2007",
		capa: "capas/ps2/Dragon Ball Z - Budokai Tenkaichi 3 (USA) (En,Ja).png",
		emulador: "PCSX2",
	},
	{
		nome: "God of War II",
		sistema: "ps2",
		sistemaNome: "PlayStation 2",
		arquivo: "God of War II (USA).chd",
		descricao:
			"God of War II é um jogo eletrônico de ação-aventura hack and slash desenvolvido pela Santa Monica Studio e publicado pela Sony Computer Entertainment (SCE). Lançado pela primeira vez para o PlayStation 2 em 13 de março de 2007, é o segundo jogo da franquia God of War e o sexto em ordem cronológica, sendo a continuação de God of War (2005). O jogo é vagamente baseado na mitologia grega e situado na Grécia Antiga, com a vingança sendo o motivo central. O personagem do jogador é o protagonista Kratos, o novo deus da guerra que tomou o lugar de Ares depois de ter o matado. Kratos é traído por Zeus, o rei dos deuses do Olimpo, que tira dele sua divindade e o mata. Lentamente arrastado para o submundo, ele é salvo pela Titã Gaia, que o instrui a encontrar as Irmãs do Destino, pois elas podem permitir que ele viaje de volta no tempo, evite sua traição e se vingue de Zeus.",
		genero: "Briga de rua",
		ano: "2007",
		capa: "capas/ps2/God of War II (USA).png",
		emulador: "PCSX2",
	},
	{
		nome: "Need for Speed : Underground 2",
		sistema: "ps2",
		sistemaNome: "PlayStation 2",
		arquivo: "Need for Speed - Underground 2 (USA).chd",
		descricao:
			"O popular jogo Need For Speed Underground foi adaptado para diferentes sistemas com distintas capacidades. Nele, você dirige em uma cidade dividida em 5 áreas distintas. Como nas outras versões, o objetivo é dirigir bem o suficiente para aumentar a sua reputação. Nesta versão, o trajeto é pré-definido, sem a exploração livre de outras versões. Os carros disponíveis incluem máquinas da Volkswagen, Mitsubishi e Toyota. Há menos opções de upgrades nesta versão, embora a aparência e a dirigibilidade do seu carro ainda possam ser alteradas. A história nesta versão segue um caminho predeterminado.",
		genero: "Corrida, Pilotagem",
		ano: "2004",
		capa: "capas/ps2/Need for Speed - Underground 2 (USA).png",
		emulador: "PCSX2",
	},
	{
		nome: "Grand Theft Auto : San Andreas",
		sistema: "ps2",
		sistemaNome: "PlayStation 2",
		arquivo: "SADE_209.46.GTA SA Definitive Edition.iso",
		descricao:
			'Ambientado no fim de 1992, a trama de San Andreas gira em torno de um membro de gangue, Carl "CJ" Johnson, que retorna para seu lar em Los Santos (equivalente à Los Angeles real), depois de uma longa temporada em Liberty City (a versão de Nova York do jogo), após descobrir a morte de sua mãe.',
		genero: "Aventura / 3D em Tempo Real",
		ano: "2004",
		capa: "capas/ps2/SADE_209.46.GTA SA Definitive Edition.jpg",
		emulador: "PCSX2",
	},
	{
		nome: "Tekken 5",
		sistema: "ps2",
		sistemaNome: "PlayStation 2",
		arquivo: "Tekken 5 (USA).chd",
		descricao:
			"Em Tekken 5, Jin Kazama lidera um torneio para determinar o futuro da Mishima Zaibatsu. Domine um sistema de combate refinado com seis botões, execute combos devastadores e lute contra mais de 30 personagens icônicos como Xiaoyu, Steve Fox e novos lutadores como Lili e Feng Wei. Explore diversos modos de jogo, personalize seu personagem e viva batalhas épicas em alta definição. Tekken 5 oferece jogabilidade viciante, gráficos impressionantes e uma experiência de luta inesquecível!",
		genero: "Luta / Versus",
		ano: "2005",
		capa: "capas/ps2/Tekken 5 (USA).png",
		emulador: "PCSX2",
	},
	{
		nome: "The Legend of Zelda: A Link to the Past",
		sistema: "wii",
		sistemaNome: "Wii",
		arquivo: "Legend of Zelda, The - A Link to the Past (USA) (SNES) (Virtual Console).wad",
		descricao:
			"Venture back to Hyrule and an age of magic and heroes. The predecessors of Link and Zelda face monsters on the march when a menacing magician takes over the kingdom. Only you can prevent his evil plot from shattering the land of Hyrule. In your quest, you'll venture into twisting mazes, dungeons, palaces and shadowy forests. Test your mettle with mighty swords and magical weapons. Or heft a boulder and hurl it at your enemies. If the going gets tough, dive into a river - you can swim to escape! Learn the powerful spells, locate magical artifacts and solve the mysteries of the evil magician and the hidden realm of Hyrule.",
		genero: "Jogos de RPG",
		ano: "2007",
		capa: "capas/wii/Legend of Zelda, The - A Link to the Past (USA) (SNES) (Virtual Console).png",
		emulador: "Dolphin",
	},
	{
		nome: "The Legend of Zelda: Ocarina of Time",
		sistema: "wii",
		sistemaNome: "Wii",
		arquivo: "Legend of Zelda, The - Ocarina of Time (USA) (N64) (Virtual Console).wad",
		descricao:
			"Lançado para um público ansioso em 1998, The Legend of Zelda ?: Ocarina of Time se tornou um sucesso instantâneo e rapidamente se estabeleceu como um dos maiores jogos de todos os tempos. Como o lendário herói Link, você deve viajar por Hyrule e até mesmo pelo próprio tempo. , para frustrar os planos de Ganondorf. Você usará armas e gadgets, enfrentará chefes enormes e resolverá quebra-cabeças, que estão entre os melhores já vistos na série Zelda.",
		genero: "Jogos de RPG",
		ano: "2007",
		capa: "capas/wii/Legend of Zelda, The - Ocarina of Time (USA) (N64) (Virtual Console).png",
		emulador: "Dolphin",
	},
	{
		nome: "Mario Kart Wii",
		sistema: "wii",
		sistemaNome: "Wii",
		arquivo: "Mario Kart Wii (USA) (En,Fr,Es).rvz",
		descricao:
			"Mario e amigos mais uma vez saltar para o assento de suas máquinas de kart para a primeira parcela Wii desta franquia popular. As novas funcionalidades deste ano são um modo de corrida online, novos tipos de veículos de motos, um sistema de equilíbrio especial para jogadores novos e veteranos e (no seu lançamento inicial) uma roda especial Mario Kart embalada com o jogo.",
		genero: "Corrida, Pilotagem",
		ano: "2008",
		capa: "capas/wii/Mario Kart Wii (USA) (En,Fr,Es).png",
		emulador: "Dolphin",
	},
	{
		nome: "New Super Mario Bros. Wii",
		sistema: "wii",
		sistemaNome: "Wii",
		arquivo: "New Super Mario Bros. Wii (USA) (En,Fr,Es) (Rev 2).rvz",
		descricao:
			"Princesa Peach foi sequestrada, novamente! Todo mundo estava comemorando o aniversário da princesa quando um bolo de aniversário gigante chegou... mas então Bowser Jr. e os sete Koopalings apareceram e a sequestraram! Mario, Luigi e dois Toads a perseguem para resgatá-la mais uma vez. Eles terão sucesso? New Super Mario Bros. Wii é uma continuação dos jogos Super Mario Bros. Assim como no original, os jogadores pulam, correm e agarram power-ups, como o Super Mushroom e a Fire Flower, que permite que eles joguem bolas de fogo em seus inimigos. Novos power-ups também foram adicionados - o Propeller Hat permite aos jogadores dar zoom verticalmente no ar e depois deslizar de volta para baixo, a Ice Flower permite que os jogadores congelem os inimigos em blocos de gelo e o Penguin Suit lhes dá tração no gelo, além de permitir para deslizar a barriga. Yoshi, de Super Mario World, também está de volta - os jogadores podem montá-lo e ele come inimigos e frutas nos níveis.",
		genero: "Plataforma",
		ano: "2009",
		capa: "capas/wii/New Super Mario Bros. Wii (USA) (En,Fr,Es) (Rev 2).png",
		emulador: "Dolphin",
	},
	{
		nome: "Rayman Origins",
		sistema: "wii",
		sistemaNome: "Wii",
		arquivo: "Rayman Origins (USA) (En,Fr,Es).rvz",
		descricao:
			"Já se perguntou o que está na raiz da loucura de Rayman? Descubra em Rayman Origins! Divirta-se em um novo universo Rayman gigantesco que cobre 12 mundos e 60 níveis e mostra as raízes de Rayman. Ele vem recheado com mais de 100 caracteres, então você nunca sabe quem - ou o quê - pode encontrar! Pegue algumas novas habilidades bizarras, incluindo mergulhos, tapas e o espetacular HairlyCopter. Use seus poderes para lutar contra chefes que ficam mais estranhos (pense mal, uma flor carnívora) e mais épicos conforme o jogo avança. Aventure-se no modo de um jogador ou faça com que seus amigos se juntem como Globox ou um dos dois Teensies jogáveis no modo cooperativo drop-in / drop-out.",
		genero: "Plataforma",
		ano: "2011",
		capa: "capas/wii/Rayman Origins (USA) (En,Fr,Es).png",
		emulador: "Dolphin",
	},
	{
		nome: "Sonic The Hedgehog 3 (SMD)",
		sistema: "wii",
		sistemaNome: "Wii",
		arquivo: "Sonic The Hedgehog 3 (USA) (SMD) (Virtual Console).wad",
		descricao:
			"Existe uma misteriosa ilha chamada Angel Island (Ilha dos Anjos), que guarda uma misteriosa pedra preciosa: é a Master Emerald (Esmeralda Mestre). Não se sabe ao certo quais são os seus poderes, mas sabe-se que dela se pode obter muita energia. Ela é diferente das Chaos Emeralds. Dr. Robotnik não ficou nem um pouco satisfeito com a derrota do seu Death Egg (Ovo da Morte) em Sonic 2, e por isso o maléfico cientista ao tomar conhecimento da existência dessa esmeralda especial, resolve pegá-la: é tudo o que ele precisa para reativar o Death Egg e definitivamente derrotar o Sonic e dominar o mundo.",
		genero: "Plataforma",
		ano: "2007",
		capa: "capas/wii/Sonic The Hedgehog 3 (USA) (SMD) (Virtual Console).png",
		emulador: "Dolphin",
	},
	{
		nome: "Super Mario 64",
		sistema: "wii",
		sistemaNome: "Wii",
		arquivo: "Super Mario 64 (USA) (N64) (Virtual Console).wad",
		descricao:
			"Mario steps into a whole new dimension in this unforgettable launch title of the Nintendo 64. Unravel the secrets of Peach's castle, find all 120 stars and defeat Bowser in this cult classic that set the rules for all 3D action games.Although it managed to stay faithful to the spirit of the series, Super Mario 64? tried a new approach as it brought the concept of exploration into platform games. Mario gained many new moves in the process, yet remained as easy to control as ever thanks to the inclusion of an Analog stick on the Nintendo 64 controller. This innovation quickly became a standard in the industry. Super Mario 64? is often cited as one of the greatest games ever made.",
		genero: "Plataforma",
		ano: "2006",
		capa: "capas/wii/Super Mario 64 (USA) (N64) (Virtual Console).png",
		emulador: "Dolphin",
	},
	{
		nome: "Super Mario World",
		sistema: "wii",
		sistemaNome: "Wii",
		arquivo: "Super Mario World (USA) (SNES) (Virtual Console).wad",
		descricao:
			"Mario and Luigi must once again save their favourite princess as Bowser and his minions try to take their revenge on the plumber brothers in Dinosaur Land. The Super Mario series took the Super Nintendo by storm with this instant classic.This episode introduced new power ups and enemies, as well as the lovable little Yoshi and his tribe. The adventure has Mario and Luigi travel on a giant map and some levels include secret exits that will lead to hidden stages. In fact, the adventure is so rich that Super Mario World was the first Super Mario game for which Nintendo allowed players to save their progress.",
		genero: "Plataforma",
		ano: "2007",
		capa: "capas/wii/Super Mario World (USA) (SNES) (Virtual Console).png",
		emulador: "Dolphin",
	},
	{
		nome: "Super Smash Bros. Brawl",
		sistema: "wii",
		sistemaNome: "Wii",
		arquivo: "Super Smash Bros. Brawl (USA) (Rev 2).rvz",
		descricao:
			"Em um mundo onde troféus ganham vidas, lutas ocorrem. As lutas são a razão da existência destes. Quando alguém quebra as regras, o mundo pagará caro por isso.[60] Em uma arena de batalha, Mario e Kirby lutam entre si, sendo assistidos pelas princesas Zelda e Peach Toadstool. Dependendo do vencedor, o outro fará com que o derrotado volte a viver. Porém, uma nave aparece ao longe, trazendo o The Subspace Army junto de seu líder, o Antigo Ministro.Com ele trazem Shadow Bugs,pequenas esferas que Tabuu conseguiu extraindo uma essência do corpo de Mr. Game And Watch.Após isso aparece Petey Piranha que instantaneamente nocauteia Mario o mandando para muito longe, Kirby enfrenta o gigante Petey Piranha para libertar Zelda ou Peach. Quando salva uma, a outra é transformada em troféu por Wario e é capturada. O Antigo Ministro, usando a Bomba do Submundo, explode a arena, fazendo-a ser engolida pela escuridão. Kirby e a princesa fogem, enquanto o enviado da Deusa Palutena, Pit, sai de seu palácio para combater o The Subspace Army. Durante sua jornada nas nuvens, Pit alia-se a Mario.",
		genero: "Luta",
		ano: "2008",
		capa: "capas/wii/Super Smash Bros. Brawl (USA) (Rev 2).png",
		emulador: "Dolphin",
	},
];

export const FILTROS_ROM = [
	{ id: "todas", nome: "Todas" },
	{ id: "doom", nome: "Doom" },
	{ id: "mame", nome: "MAME" },
	{ id: "ps2", nome: "PlayStation 2" },
	{ id: "wii", nome: "Wii" },
] as const;

export const EMULADOR_ICONE: Readonly<Record<string, string>> = {
	GZDoom: "icones/gzdoom.png",
	MAME: "icones/org.mamedev.MAME.png",
	PCSX2: "icones/net.pcsx2.PCSX2.png",
	Dolphin: "icones/org.DolphinEmu.dolphin-emu.svg",
};

export function assetUrl(relativePath: string): string {
	return `${ASSET_BASE}/${encodeURI(relativePath)}`;
}

export function iconeAplicativo(id: string): string {
	const ext = ICONES_PNG.has(id) ? "png" : "svg";
	return assetUrl(`icones/${id}.${ext}`);
}

export function metaRom(rom: Rom): string {
	const partes = [rom.sistemaNome];
	if (rom.emulador.toLowerCase() !== rom.sistemaNome.toLowerCase()) partes.push(rom.emulador);
	if (rom.ano.length > 0) partes.push(rom.ano);
	if (rom.genero.length > 0) partes.push(rom.genero);
	return partes.join(" · ");
}
