# Quarto montado com tiles e sprites

Trabalho continuado na branch `feat/exterior-tile-rebuild`, sem commit ou push.
O exterior e `estado-atual-mapa.patch` foram preservados. O interior mantém o
espaço lógico de 960 × 960, os personagens de 96 px, controles, câmera e zoom.

## Implementação

- `house-map.ts`: grade de tiles, móveis individuais, caixas de colisão,
  posições de interação, poses e candidatos seguros para levantar.
- `house-renderer.ts`: tilemap em escala 2×, sprites com profundidade, camada
  do cobertor e interrogação vinculada ao baú em coordenadas do mundo.
- `house-walkability.ts`: verifica todos os tiles sob a pegada completa e
  as caixas dos móveis; seleciona uma posição livre ao sair do repouso.
- `house-rest.ts`: estado de repouso, trava de tecla/repetição e curva suave
  da interrogação (amplitude 5 px, período 1,8 s).
- `phaser-game.tsx`: integração com física, poses, prompts, iluminação,
  eventos de teclado/mobile e transições. Nenhum painel foi reescrito.
- `world-config.ts`: delega spawn e geometria interna ao modelo do quarto;
  os valores e a configuração do exterior permanecem iguais.
- `public/game/interior/`: atlas de móveis, poses e tiles, com seus metadados.
- `scripts/build-interior-assets.mjs`: recompilação local das fontes existentes.
- `scripts/render-interior-preview.mjs`: composição das prévias dos mesmos dados.
- `scripts/check-house.mjs` e `scripts/check-house-scene.mjs`: testes do modelo e
  dos métodos reais da cena, com adaptadores de física/imagem sem navegador.
- `package.json`: comandos `assets:interior`, `preview:house` e `check:house`.

O antigo `public/game/house-interior.png` é somente referência e não é mais
carregado pelo jogo. Os atlas contêm peças reutilizáveis, não recortes de uma
imagem completa do quarto.

## Interações e camadas

São **sete interações**: TV, lareira, tutorial e saída, mais duas cadeiras e cama.
Não há abajures na cena nem interações de abajur. Os recursos já produzidos foram
preservados no atlas-fonte, inclusive os frames que deixaram de ser utilizados.

As cadeiras recebem uma pose própria orientada para a mesa. A cama recebe uma
pose vista de cima, com cabeça no travesseiro e corpo parcialmente coberto pela
camada independente de cobertor. Existem quatro frames de pose, dois para cada
personagem; a cadeira direita espelha o frame sentado.

Durante o repouso, o corpo Arcade é desativado, a caminhada é bloqueada e o
validador de movimento ignora a pose. O sprite de caminhada fica oculto enquanto
o de repouso é exibido. A câmera continua seguindo o mesmo objeto jogador, cuja
posição é ajustada ao assento/colchão. Ao levantar, a física, o sprite original e
a última posição válida são restaurados. Se não houver saída livre, a pose é
mantida. Um único acionamento retorna após executar uma única ação; eventos
repetidos da mesma tecla são rejeitados até sua liberação.

A interrogação usa a posição do baú, profundidade 1200 e scroll factor normal:
acompanha o mundo durante pan/zoom. O prompt do tutorial foi deslocado para cima
para não encobrir o marcador. O evento de animação é removido no shutdown da cena.

## Verificação

As prévias estáticas foram inspecionadas: a disposição mantém TV à esquerda,
janela e mesa com duas cadeiras ao norte, lareira à direita, tapete central,
planta à esquerda, cama/baú à direita e saída inferior.

- Busca com pegada real de **26,88 × 12 px**: 6.028 posições alcançáveis e acesso
  às sete interações, considerando qual prompt vence por proximidade.
- Oito móveis sólidos; 22 barreiras verificadas contra atravessamento em
  movimentos longos; spawn, porta e saídas de repouso livres.
- Seis ciclos de repouso para os dois personagens, frames, orientação, profundidade,
  cobertor, restauração e proteção de repetição.
- Métodos de produção da cena executados com adaptadores: corpo desativado,
  velocidade zero, preservação da pose em `update`/`POST_UPDATE`, levantamento
  seguro, painéis/som selecionado, lareira e ambas as direções da porta.
- Curva do marcador: suavidade, amplitude, periodicidade e posição relativa ao baú.
- Regressão do exterior: 20.178 posições e 13 interações acessíveis, inalteradas.
- `npm run lint`, `npm run typecheck` e `npm run build`: aprovados.
- Comparação SHA-256 de 16 arquivos preservados: exterior, conteúdos e
  `estado-atual-mapa.patch` sem alteração.

Os testes sem navegador verificam chamadas e estados, não reproduzem a GPU,
o áudio audível ou os eventos reais do dispositivo. Conferir manualmente no jogo:

1. As duas cadeiras e a cama com ambos os personagens; segurar e soltar `E`;
   tentar caminhar em repouso e levantar novamente.
2. Sobreposição com mesa, cobertor e móveis; marcador durante pan e todos os zooms.
3. TV, tutorial, lareira, sons, saída e retorno ao quarto, inclusive pelo celular.

## Prévia

- [Quarto sem personagem](interior-art/room-preview.png)
- [Quarto com personagem no spawn](interior-art/room-player-preview.png)
- [Seis combinações de poses](interior-art/poses-preview.png)

Essas imagens são geradas para revisão e nunca são usadas como fundo da cena.
