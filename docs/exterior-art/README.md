# Recursos do exterior

Arte original gerada com a ferramenta integrada `imagegen`, sem extrair partes de
`public/game/exterior-world.png`. Esse arquivo antigo fica apenas como referência.
As duas imagens-fonte nesta pasta não são carregadas pelo jogo.

Execute `npm run assets:exterior` para compilar as fontes em:

- `public/game/exterior/terrain.png`: tiles de 16 × 16 pixels, exibidos a 2×;
- `public/game/exterior/objects.png` e `objects.json`: 16 sprites com transparência,
  recortes independentes, paleta reduzida e pixels sem suavização.

O compilador usa `sharp`, já presente no ambiente pelo Next.js. Não requer serviço
de geração de imagens para recompilar. Os recortes medidos estão no script, pois a
fonte gerada tem linhas de alturas diferentes. O atlas é apenas um armazenamento
compacto de peças: cada árvore, casa, baú, placa e detalhe é um objeto independente.

## Prompts usados (ferramenta integrada, sem fallback CLI)

### Objetos — `objects-source.png`

Use case: stylized-concept. Create an ORIGINAL production pixel-art game OBJECT
ATLAS, not a game map. Square 1024x1024 image containing exactly 16 isolated sprites
in a strict 4 columns x 4 rows grid, each invisible cell 256x256. True transparent
background everywhere between objects; no ground panels, no checkerboard painted
in, no grid lines, no labels, no text. All objects centered within their cell, full
silhouettes with padding of 16 pixels, never crossing into adjacent cells.
Consistent 16-bit top-down RPG oblique view (see front and roof), hard square pixel
clusters, no antialiasing, no blurred painting. Simulate a 256x256 native-resolution
sheet enlarged 4x with nearest neighbor. Rich crafted texture and small details,
sun from upper left, limited cohesive palette: golden ochre timber, deep brown
outlines, teal roof, rich forest/jade/leaf greens, warm limestone, golden accents.
Read rows left to right: ROW 1: (1) a complete welcoming wooden cabin with steep
teal gable roof, stone chimney, blue window either side of centered wooden door,
flower boxes, wide low wooden porch with center steps; (2) tall tiered evergreen
fir tree; (3) full round leafy oak tree with visible trunk and roots; (4) pink
flowering tree with visible trunk. ROW 2: (1) wooden treasure chest closed, front
view with curved lid, golden metal bands and latch; (2) wooden direction sign with
two arrow boards on single post, no writing; (3) cluster of 3 angular mossy
warm-grey rocks; (4) detailed cut tree stump with roots and growth rings. ROW 3:
(1) dense round dark jade shrub; (2) small wildflower cluster white daisies, gold
flowers and tiny red flowers with green leaves; (3) two sections of rustic
horizontal wooden fence with 3 posts; (4) tall timber lamppost with hanging amber
lantern. ROW 4: (1) patch of tall green grass blades and delicate blue flowers;
(2) water reeds with cattails, transparent base; (3) cluster of three lily pads,
one tiny white blossom; (4) small top-down wooden dock of four horizontal planks
and four posts. Objects must look like polished adventure-game sprites, with
sculpted pixel shading, fine grain on timber, layered leaves, crisp highlights.
No scenery, no complete map, no large scene background, no characters. This sheet
will be sliced into independent reusable transparent sprites for a Phaser game.

### Materiais — `materials-source.png`

Use case: stylized-concept. Asset type: original seamless pixel-art terrain
MATERIAL ATLAS for a top-down 16-bit forest adventure. Produce a square 1024x1024
image divided into exactly FOUR equal seamless texture swatches (2x2 grid, 512px
per quadrant), touching edge to edge, no borders, no text, no objects. Render at
actual native 128x128 pixel resolution enlarged exactly 8x, hard square pixel
edges, no blur or antialias. Upper-left: rich bright meadow grass, palette
olive/lime/leaves greens, tiny scattered blades and sparse subtle darker
clusters, even lighting, no flowers. Upper-right: warm honey ochre dirt path
ground, densely subtle granular pixel texture, occasional small pebbles, no rocks
or grass. Lower-left: calm saturated teal-blue pond water, small gentle pixel
ripple streaks in cyan and lighter turquoise, even seamless texture. Lower-right:
a vertical earthen cliff face with warm brown and ochre vertical stone/soil
striations, a few moss details, repeats horizontally, no grass cap. Cohesive
forest palette matching a teal-roof wooden cabin and lush leafy trees,
hand-placed pixel clusters, polished game tileset quality. Each quadrant is a
flat uninterrupted material sample, no perspective, no landscape, no scene, no
grid drawn, no gradients.

A ferramenta entregou fontes de 1254 × 1254; o compilador converte as peças para
resolução nativa consistente. Bordas conectadas e degraus são montados na grade
durante a compilação, com as mesmas cores dos materiais.

## Prévia e refinamento

`node scripts/render-exterior-preview.mjs` recompõe `exterior-preview.png` a partir
dos mesmos dados, atlas, máscaras de vizinhança e profundidades usados pelo jogo e
pelo minimapa. É uma prévia estática, não uma captura do Phaser, e nunca é carregada
como fundo do jogo.

O terreno possui quatro variações determinísticas de textura, bordas arredondadas
em pixels e escadas com corrimãos apenas nas extremidades. Para recompilar somente
esses tiles e preservar os sprites byte a byte:

```sh
node scripts/build-exterior-assets.mjs --terrain-only
```
