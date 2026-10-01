# Polimento do mapa e da interface

Nesta etapa, a janela de Projetos passou a usar o mesmo pergaminho interno da janela de Experiências. Os botões dos cartões são criados apenas para URLs presentes: dois links ficam em duas colunas, um link ocupa a largura inteira e nenhum link não reserva rodapé. A grade passa a um cartão por página em telas estreitas.

As folhas cardinais originais foram guardadas em `docs/character-motion/*-walksheet-source.png`. `npm run assets:character-motion` remove a franja clara externa dessas folhas e da fonte diagonal feminina antes de compilar o atlas de 40 quadros. O processo mantém cores internas e alpha binário. `npm run check:character-motion` verifica as quatro diagonais de cada personagem e detecta pixels claros expostos nos contornos.

O mapa conserva a mesma grade de caminhada. Há oito postes novos: dois flanqueiam a escada de Projetos e os outros iluminam as áreas dos baús. Ao todo, o exterior tem 15 postes; os 13 de margem testados colidem apenas com bases de 16 × 16 px sobre grama. O brilho quente alcança 160 px. Arbustos, flores e grama de tamanhos variados completam clareiras sem colisão. Barrancos usam 16 peças de borda conectada, e escadas receberam degraus, trilhos e desgaste em pixel art. `public/game/exterior/objects.png` foi preservado; apenas o atlas de terreno foi recompilado.

As conquistas de pesca são liberadas aos 3, 10, 20 e 50 peixes, uma vez por marco. O número de peixes já persistido continua sendo a fonte do progresso; salvamentos antigos mantêm as conquistas correspondentes depois de recarregar. O HUD mostra uma estrela identificada por número para cada marco.

O botão Tela cheia usa o mesmo estilo dos controles. A seção inteira entra em tela cheia, inclusive canvas, HUD, minimapa, botões e janelas. `fullscreenchange` atualiza o botão após saída pelo `Esc`; uma recusa da API mostra uma indicação breve sem interromper o jogo. A câmera Phaser já usa o tamanho disponível e mantém a proporção da arte, com bordas pretas quando cabem.

## Verificação

- `npm run lint`, `npm run typecheck` e `npm run build`.
- `npm run check:world`: acessibilidade das 16 interações com a pegada completa, bases dos postes, atlas de terreno e continuidade dos caminhos.
- `npm run check:house`: transições, poses, entrada/saída e pesca dos dois personagens; persistência e quatro marcos.
- `npm run check:character-motion` e `npm run check:project-links`.
- Chrome headless em 1280 × 800 e 390 × 844: Projetos, porta para exterior, zoom externo de 80%, tela cheia, saída pelo botão e por `Esc`, janelas dentro da tela cheia, mapa, HUD com quatro estrelas e mensagem discreta quando a API recusa a tela cheia.

Capturas do navegador: [Projetos desktop](ui-qa/qa-projects-desktop.png), [Projetos celular](ui-qa/qa-projects-mobile.png), [tela cheia celular](ui-qa/qa-fullscreen-mobile.png), [exterior em tela cheia](ui-qa/qa-world-fullscreen-desktop.png), [mapa em tela cheia](ui-qa/qa-map-fullscreen-desktop.png) e [HUD com 50 peixes no celular](ui-qa/qa-hud-mobile-active.png). As prévias montadas com os comandos reais da cena estão em [dia](exterior-art/day-preview.png) e [noite](exterior-art/night-preview.png).

O Chrome headless não substitui a conferência em dispositivo físico de toque, áudio, fluidez do ciclo noturno e animação em tempo real dos personagens. As capturas do navegador foram feitas no servidor de desenvolvimento e incluem seu indicador no canto inferior esquerdo.
