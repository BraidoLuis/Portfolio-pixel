/**
 * GUIA DO MAPA — versão comentada e funcional de world-config.ts.
 *
 * Mapa exterior: public/game/exterior-world.png, 1254 × 1254 pixels.
 * Interior: uma cena SEPARADA, exibida no espaço lógico de 960 × 960.
 * A origem (0, 0) é o canto superior esquerdo; x cresce para a direita;
 * y cresce para baixo. Todas as coordenadas abaixo estão em pixels de cena.
 *
 * LEGENDA nas imagens entregues: C01–C26 = caixas bloqueadas;
 * S01–S06 = polígonos sólidos; A01–A16 = áreas transitáveis.
 * H01–H06 = colisões do INTERIOR; F01–F04 = recortes VISUAIS da casa.
 * Os identificadores são só comentários para ajudar a achar os números.
 *
 * COMO A COLISÃO DO EXTERIOR FUNCIONA (world-walkability.ts):
 * 1. Verifica se a área dos pés está dentro dos 1254 × 1254 pixels;
 * 2. bloqueia qualquer caixa de WORLD_COLLISIONS que toque os pés;
 * 3. bloqueia qualquer WORLD_SOLID_POLYGONS que toque os pés;
 * 4. exige que seis pontos dos pés estejam dentro da UNIÃO das áreas A.
 * Portanto, adicionar uma área A nunca libera o interior de uma caixa C
 * ou de um sólido S; para liberar um objeto, ajuste o respectivo bloqueio.
 *
 * A área dos pés é menor que o sprite: no exterior, cerca de 22,4 px de
 * largura e 10 px de altura, posicionada perto da parte inferior do sprite.
 * Uma passagem precisa acomodar essa área inteira, não só seu centro.
 *
 * Estes comentários não alteram nenhum valor nem o comportamento do jogo.
 * Caso queira substituir o arquivo do projeto, salve-o como
 * components/portfolio/game/world-config.ts após fazer uma cópia do seu.
 */

// Um vértice em coordenadas [x, y] da cena. Cada par delimita uma curva
// do caminho ou o contorno de um objeto. A ordem dos pontos importa.

export type Point = [number, number];

// Caixa retangular que BLOQUEIA o personagem.
// Aqui x/y são o CENTRO; width/height são o tamanho TOTAL da caixa.
// Exemplo: x=768, width=12 ocupa de x=762 até x=774.
export type CollisionBox = {
  x: number;
  y: number;
  width: number;
  height: number;
};

// Retângulo de ÁREA/RECORTE: aqui x/y são o CANTO SUPERIOR ESQUERDO.
// Essa diferença em relação a CollisionBox é fundamental.
export type RectangleArea = {
  x: number;
  y: number;
  width: number;
  height: number;
};

// Recorte visual mostrado à FRENTE do personagem quando ele fica atrás
// da casa. Não controla por onde se anda: isso é definido pelas caixas C,
// pelos sólidos S e pelas áreas A.
export type ForegroundRegion = RectangleArea & {
  key: string;
  baseline: number;
  polygons: Point[][];
};


// Tamanho lógico de cada cena. O PNG exterior já mede 1254 × 1254.
// A arte interna é exibida em 960 × 960: use coordenadas desse espaço
// para HOUSE_COLLISIONS, HOUSE_FLOOR_AREAS e SPAWN_POINTS.house.
export const SCENE_SIZE = {
  // O interior original é quadrado. Usar a mesma proporção evita esticar o PNG.
  house: { width: 960, height: 960 },
  world: { width: 1254, height: 1254 },
} as const;

// Altura/largura visual do sprite no exterior, em pixels.
// Alterar esse número também muda as dimensões da pegada nos pés;
// reavalie os caminhos antes de aumentar o personagem.
export const WORLD_PLAYER_SIZE = 80;

// Centro do SPRITE ao entrar em cada cena. Não é o contato dos pés.
// world (625, 990) = saída da varanda, diante da casa.
// house (480, 808) = posição inicial dentro do quarto.
export const SPAWN_POINTS = {
  house: { x: 480, y: 808 },
  world: { x: 625, y: 990 },
} as const;

// H01–H06: móveis e objetos bloqueados no INTERIOR (960 × 960).
// Aqui cada x/y é centro da caixa. Para ver a arte correspondente,
// use public/game/house-interior.png renderizada em 960 × 960.
export const HOUSE_COLLISIONS: CollisionBox[] = [
  // H01 · TV e móvel no canto superior esquerdo.
  { x: 170, y: 256, width: 170, height: 205 },
  // H02 · Mesa com duas cadeiras ao centro superior.
  { x: 475, y: 264, width: 162, height: 131 },
  // H03 · Lareira à direita da mesa.
  { x: 740, y: 248, width: 195, height: 211 },
  // H04 · Cama no canto inferior direito.
  { x: 774, y: 674, width: 180, height: 315 },
  // H05 · Baú de introdução, ao lado da cama.
  { x: 615, y: 728, width: 54, height: 77 },
  // H06 · Vaso de planta no canto inferior esquerdo.
  { x: 122, y: 712, width: 78, height: 147 },
];

// C01–C26: caixas de obstáculos do mapa EXTERIOR.
// Para deslocar uma hitbox: mude x (horizontal) e/ou y (vertical).
// Para encolher sem deslocar seu centro: diminua width/height.
// A placa C12 é desenhada SEPARADAMENTE; para movê-la visualmente também,
// atualize addExitSign() e a interação em phaser-game.tsx.
export const WORLD_COLLISIONS: CollisionBox[] = [
  // Baús: Projetos, Habilidades (três), Experiências (três) e Certificações.
  // C01 · Baú Projetos, no platô do extremo norte.
  { x: 626, y: 114, width: 66, height: 65 },
  // C02 · Primeiro baú Habilidades, à esquerda.
  { x: 265, y: 380, width: 55, height: 59 },
  // C03 · Segundo baú Habilidades, à esquerda.
  { x: 333, y: 380, width: 55, height: 59 },
  // C04 · Terceiro baú Habilidades, abaixo dos outros dois.
  { x: 301, y: 440, width: 55, height: 59 },
  // C05 · Primeiro baú Experiências, à direita.
  { x: 916, y: 391, width: 55, height: 59 },
  // C06 · Segundo baú Experiências, à direita.
  { x: 983, y: 391, width: 55, height: 59 },
  // C07 · Terceiro baú Experiências, abaixo dos outros dois.
  { x: 949, y: 450, width: 55, height: 59 },
  // C08 · Baú Certificações, na clareira sudoeste.
  { x: 201, y: 881, width: 57, height: 62 },
  // Somente a base dos postes das placas interrompe o passo do personagem.
  // A caixa em (483, 480) correspondia a uma placa que não existe nesta imagem.
  // C09 · Base da placa de madeira próxima ao platô esquerdo.
  { x: 531, y: 340, width: 18, height: 24 },
  // C10 · Base da placa “Mapa geral”, à direita das flores centrais.
  { x: 768, y: 434, width: 12, height: 18 },
  // C11 · Base da placa “Mapa dos baús”, no caminho central inferior.
  { x: 692, y: 604, width: 18, height: 24 },
  // Placa interativa ao lado da saída da casa, fora do centro do caminho.
  // C12 · Base da placa desenhada por Phaser ao lado da varanda; sua imagem fica em public/game/exit-direction-sign.png e sua interação está em phaser-game.tsx.
  { x: 708, y: 988, width: 16, height: 25 },
  // Pedras, árvores e postes que ficam dentro das clareiras marcadas.
  // C13 · Toco na parte direita do platô do baú Projetos.
  { x: 736, y: 151, width: 41, height: 52 },
  // C14 · Pedras acima do entroncamento central, à direita da escada norte.
  { x: 699, y: 331, width: 57, height: 42 },
  // C15 · Árvore da parte inferior do platô à direita.
  { x: 808, y: 549, width: 91, height: 108 },
  // C16 · Moita no terreno elevado antes da escada oeste.
  { x: 430, y: 537, width: 86, height: 94 },
  // C17 · Moita abaixo da escada oeste, junto ao caminho atrás da casa.
  { x: 521, y: 599, width: 85, height: 79 },
  // C18 · Pequeno obstáculo a oeste da casa, acima da área de Certificações.
  { x: 344, y: 811, width: 44, height: 46 },
  // C19 · Vegetação a oeste da casa, perto da clareira de Certificações.
  { x: 351, y: 863, width: 73, height: 70 },
  // C20 · Cerca à esquerda da casa.
  { x: 478, y: 856, width: 18, height: 130 },
  // C21 · Cerca à direita da casa.
  { x: 781, y: 861, width: 20, height: 145 },
  // C22 · Toco à direita da varanda.
  { x: 773, y: 958, width: 45, height: 64 },
  // C23 · Pedra abaixo e à direita do lago.
  { x: 1034, y: 987, width: 58, height: 57 },
  // C24 · Toco abaixo e à esquerda da casa.
  { x: 371, y: 1034, width: 43, height: 50 },
  // C25 · Poste com lanterna à esquerda do caminho sul.
  { x: 541, y: 1104, width: 34, height: 73 },
  // C26 · Poste com lanterna à direita do caminho sul.
  { x: 743, y: 1104, width: 36, height: 73 },
];


// Silhueta da casa nova. O caminho de terra continua livre dos dois lados e
// atrás do telhado; apenas os degraus centrais da varanda são transitáveis.
// S01–S06: obstáculos com contorno não retangular.
// Os vértices estão em coordenadas ABSOLUTAS do PNG exterior.
// footHitsPolygon() usa SAT: mantenha cada sólido CONVEXO.
// Para reduzir uma borda, aproxime seus vértices do centro do objeto.
export const WORLD_SOLID_POLYGONS: Point[][] = [
  // S01 · Telhado triangular; bloqueia entrar na casa pelo alto.
  [[625, 675], [735, 741], [735, 819], [512, 819], [512, 741]],
  // S02 · Corpo/fachada da casa, atrás da varanda.
  [[520, 809], [731, 809], [731, 898], [520, 898]],
  // S03 · Cerca e lado esquerdo da varanda; escada central fica livre.
  [[513, 888], [589, 888], [589, 941], [513, 941]],
  // S04 · Cerca e lado direito da varanda; escada central fica livre.
  [[663, 888], [741, 888], [741, 941], [663, 941]],
  // A ilha de flores do cruzamento e a árvore na curva nordeste.
  // S05 · Flores centrais e pedra da ilha; este é o polígono a editar se a ilha bloquear demais.
  [[612, 416], [640, 416], [659, 435], [659, 466], [641, 492], [619, 492], [598, 466], [598, 441]],
  // S06 · Árvore da curva nordeste, perto do acesso a Experiências.
  [[850, 262], [883, 263], [904, 285], [910, 322], [882, 345], [843, 322]],
];


// Os polígonos seguem os limites vermelhos do mapa de referência. A união
// inclui as bordas gramadas assinaladas, além da terra e das escadas; os
// objetos e a casa continuam bloqueados por WORLD_COLLISIONS e pelos sólidos.
// A01–A16: regiões onde os PÉS do personagem podem ficar.
// Seguem terra + partes de grama marcadas. Essas áreas se unem, inclusive
// quando se sobrepõem. A borda do caminho usa coordenadas ABSOLUTAS do PNG.
// Aumente um caminho afastando os vértices de sua borda; aproxime-os para
// estreitá-lo. Mantenha os vértices em sequência, sem cruzar as arestas.
// Verifique a união entre áreas vizinhas: um vão pequeno pode travar os pés.
export const WORLD_MARKED_WALKABLE_POLYGONS: Point[][] = [
  // Baú ao norte e a escada que leva à clareira central.
  // A01 · Clareira do baú Projetos e início da escada norte.
  [[573, 147], [678, 143], [756, 157], [754, 191], [700, 215], [660, 224], [661, 282], [595, 282], [596, 211], [571, 197]],
  // A02 · Escada norte e abertura para o cruzamento central.
  [[594, 263], [662, 263], [671, 286], [682, 344], [722, 381], [748, 401], [731, 436], [691, 405], [650, 390], [593, 405], [545, 430], [539, 389], [558, 352], [576, 302]],
  // Clareira dos três baús da esquerda.
  // A03 · Clareira Habilidades e sua ligação com o centro.
  [[193, 351], [215, 315], [251, 277], [329, 275], [390, 309], [419, 359], [436, 404], [484, 421], [527, 408], [558, 365], [565, 404], [538, 443], [487, 466], [424, 484], [393, 514], [331, 530], [250, 518], [204, 483], [188, 456]],
  // Trilha nordeste, contornando a árvore, e clareira da direita.
  // A04 · Caminho alto da direita que contorna a árvore.
  [[767, 289], [782, 250], [829, 219], [869, 204], [921, 218], [967, 252], [975, 299], [949, 318], [909, 319], [893, 263], [858, 261], [837, 301], [833, 344], [859, 363], [820, 384], [780, 364]],
  // A05 · Clareira Experiências, ligada ao cruzamento.
  [[717, 380], [769, 383], [823, 371], [881, 341], [1003, 336], [1038, 362], [1055, 409], [1054, 463], [1027, 503], [970, 524], [885, 527], [824, 505], [769, 489], [743, 444], [716, 428]],
  // Os dois lados da ilhota central e a saída para as trilhas inferiores.
  // A06 · Trilha acima e à esquerda da ilha de flores.
  [[536, 385], [599, 378], [659, 379], [707, 386], [733, 410], [704, 443], [674, 417], [642, 404], [603, 410], [581, 441], [546, 470], [488, 469], [479, 428]],
  // A07 · Trilha abaixo da ilha, saindo para os dois lados.
  [[397, 469], [484, 462], [546, 466], [581, 480], [611, 496], [660, 500], [687, 477], [714, 447], [743, 459], [772, 489], [814, 484], [850, 518], [821, 560], [764, 564], [696, 545], [629, 546], [571, 542], [517, 516], [445, 518], [391, 507]],
  // Fecha a lacuna entre o cruzamento dos baús e a trilha atrás da casa.
  // O recorte segue a terra ao lado da placa, sem cobrir a ilha de flores.
  // A08 · Ligação vertical do cruzamento até o caminho atrás da casa.
  [[554, 502], [591, 516], [631, 527], [673, 509], [731, 533], [740, 564], [724, 593], [712, 623], [681, 643], [659, 668], [620, 678], [573, 661], [553, 628], [550, 574]],
  // Escada oeste, curva ao lado da casa e acesso ao baú sudoeste.
  // A09 · Aproximação da escada oeste e curva elevada até a casa.
  [[284, 531], [386, 518], [464, 510], [551, 522], [579, 546], [594, 604], [536, 618], [467, 647], [426, 677], [386, 714], [352, 691], [328, 652], [286, 625]],
  // A10 · Própria escada oeste e descida à região sudoeste.
  [[291, 609], [358, 609], [357, 656], [385, 700], [388, 786], [375, 851], [312, 877], [309, 816], [368, 793], [363, 742], [317, 702]],
  // A11 · Clareira do baú Certificações.
  [[126, 801], [211, 795], [268, 811], [311, 823], [312, 878], [377, 883], [390, 847], [396, 889], [367, 924], [304, 950], [225, 958], [165, 937], [111, 891], [109, 841]],
  // Caminhos de ambos os lados e por trás da casa.
  // A12 · Caminho atrás da casa, da esquerda até a direita.
  [[359, 721], [400, 680], [456, 643], [530, 620], [628, 628], [727, 653], [824, 681], [879, 748], [829, 768], [771, 719], [701, 683], [625, 663], [566, 682], [509, 713], [471, 753], [435, 794], [391, 816], [364, 773]],
  // A13 · Passagem pela lateral esquerda da casa.
  [[365, 732], [424, 700], [480, 716], [482, 779], [447, 807], [432, 870], [432, 926], [483, 973], [504, 1016], [468, 1035], [406, 1010], [357, 978], [314, 931], [306, 865], [337, 813]],
  // A14 · Passagem pela lateral direita da casa.
  [[759, 679], [822, 706], [873, 752], [885, 819], [888, 894], [918, 946], [996, 964], [976, 998], [909, 1024], [843, 1036], [783, 1018], [782, 976], [814, 949], [814, 842], [788, 773], [743, 739]],
  // Passagem diante da varanda, trilha do lago e saída sul.
  // A15 · Frente da varanda e caminho até a beira do lago.
  [[310, 936], [381, 929], [431, 952], [482, 985], [556, 1006], [589, 968], [596, 932], [659, 932], [668, 974], [725, 988], [783, 988], [836, 999], [906, 981], [1064, 958], [1059, 978], [1011, 1007], [927, 1025], [842, 1044], [749, 1065], [671, 1044], [627, 1046], [569, 1064], [493, 1041], [411, 1016], [338, 978]],
  // A16 · Continuação do caminho pela saída inferior do mapa.
  [[542, 1027], [599, 1041], [664, 1039], [740, 1027], [751, 1060], [695, 1074], [680, 1128], [675, 1172], [702, 1253], [566, 1253], [584, 1172], [579, 1128], [538, 1085]],
];

// Zonas permitidas no INTERIOR. Ao contrário das caixas H, estes
// retângulos indicam onde PODE andar. x/y = canto superior esquerdo.
export const HOUSE_FLOOR_AREAS: RectangleArea[] = [
  // Zona principal do piso interno: do canto [75, 205] até [885, 867].
  { x: 75, y: 205, width: 810, height: 662 },
  // Trecho inferior junto à porta, para sair da casa.
  { x: 405, y: 867, width: 150, height: 71 },
];

// Sobreposição VISUAL da casa, para o telhado/fachada encobrirem quem
// caminha por trás. x/y definem a origem do recorte no PNG (canto superior
// esquerdo); width/height medem o recorte. baseline é a profundidade usada
// na renderização. F01–F04 usam coordenadas LOCAIS ao recorte:
// [localX, localY] aparece em [490 + localX, 672 + localY] no mapa.
// Exemplo: [135, 2] corresponde ao pixel absoluto [625, 674].
// Alterar esses pontos não altera a colisão do personagem.
export const WORLD_FOREGROUND_REGIONS: ForegroundRegion[] = [
  {
    key: "house",
    x: 490,
    y: 672,
    width: 270,
    height: 274,
    baseline: 980,
    polygons: [
      // F01 · Parte inclinada do telhado (recorte visual).
      [[135, 2], [246, 70], [246, 144], [21, 144], [21, 70]],
      // F02 · Fachada/parede da casa (recorte visual).
      [[29, 138], [244, 138], [244, 220], [29, 220]],
      // F03 · Varanda, corrimãos e borda dos degraus (recorte visual).
      [[23, 215], [252, 215], [252, 263], [174, 263], [174, 274], [97, 274], [97, 263], [23, 263]],
      // F04 · Chaminé projetada sobre o telhado (recorte visual).
      [[57, 12], [81, 12], [81, 78], [57, 78]],
    ],
  },
];