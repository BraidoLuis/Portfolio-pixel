# Fontes e compilação do quarto

Arte produzida com a ferramenta integrada `imagegen`, sem fallback CLI/API.
Foram preservadas as fontes em `furniture-source.png` e `poses-source.png`.
`npm run assets:interior` recorta as peças medidas, converte para pixels nativos
com nearest-neighbor e empacota os atlas em `public/game/interior/`.

O processo não modifica sprites do exterior nem as spritesheets de caminhada.
O cobertor é uma camada derivada do próprio sprite da cama. Duas peças de abajur
geradas antes da correção do escopo permanecem arquivadas, sem instanciação no jogo.

`npm run preview:house` produz as prévias estáticas nesta pasta. Os sprites de
repouso e os móveis são compostos com a mesma origem, escala, orientação e
profundidade da cena. A prévia mostra a lareira sem o fogo dinâmico; os efeitos
de luz/fogo e a fonte do marcador precisam da avaliação final no navegador.

## Prompt de móveis e materiais

Use case stylized-concept. Create ORIGINAL high-quality pixel-art assets for a
cozy wooden cabin interior, a SPRITE / MATERIAL ATLAS, NOT a room scene.
Transparent background, no labels no text no ground beneath furniture. Strict
4 columns by 4 rows of separate objects in a square image. Keep each complete
object isolated with generous 20px transparent gutters; do not overlap cells.
Consistent 16-bit adventure RPG top-down oblique view, see top surface and front,
warm honey wood with dark brown outlines, green bedspread, cream linen, grey
stone, amber light. Crisp pixel clusters at simulated native 384x384 resolution,
no blur, no antialiased outlines. Exact order left to right: ROW1: (1) vintage
grey CRT television turned off, standing on a two-drawer wooden low console,
one complete object; (2) square timber-framed four-pane window showing blue sky
and green hills; (3) square wooden dining table, empty tabletop, thick legs,
no chairs; (4) ONE wooden dining chair in side view facing RIGHT, visible seat,
back on left, suitable for a character seated facing right. ROW2: (1) tall grey
stone fireplace with tall chimney above a wooden mantel, black EMPTY fire
opening, no fire; (2) complete vertical single bed with headboard at TOP,
footboard at BOTTOM, cream pillow near top, cream folded sheet and forest green
blanket, top-down perspective showing mattress; (3) leafy green plant in
terracotta pot; (4) warm rust-red rectangular woven rug viewed flat from above,
ornate gold geometric border and small central diamond. ROW3: (1) wooden bedside
table with cream shade table lamp, lamp turned OFF; (2) same bedside table and
lamp turned ON glowing warm gold, SAME shape, dimensions and silhouette as
previous; (3) small wooden tutorial treasure chest with iron bands and gold
lock; (4) short set of two wooden entrance steps viewed from above, no walls no
door. ROW4 each cell is a FLAT SQUARE opaque seamless material swatch, not a
sprite: (1) honey oak horizontal floorboard wood grain, subtle detail with a few
nails, no furniture; (2) honey wood vertical wall paneling; (3) a thick dark oak
horizontal structural beam grain; (4) brown wood endgrain trim with carved bevel.
Every item must stay within its own grid cell. Background outside first 12
object silhouettes is truly transparent, including window/rug having their own
silhouettes. Finely crafted grain and stone blocks, coherent lighting upper
left. NO assembled room, NO whole interior, NO characters, NO perspective room
mockup. Will be cut into independent reusable game sprites and small terrain tiles.

## Prompt de poses

Referências: as duas spritesheets existentes dos personagens masculino e feminino.

Use case identity-preserve, game character pose sprite atlas. Inputs are
character identity and style references ONLY: first sheet male (curly brown
hair, short beard, black shirt, charcoal trousers, dark shoes), second sheet
female (long black hair, black dress, dark shoes). Generate four NEW original
animation poses of these exact SAME two adult characters, preserve faces,
hair, outfits and relative body proportions. Do not include the reference
walking sheets in output. Transparent background throughout, no furniture,
no bed, no chair, no shadows on ground, no labels, no text. Exactly 2 columns
by 2 rows, four isolated full-body sprites, each centered in its equal square
cell with very generous empty gutters. Crisp 16-bit pixel art matching
references. ROW1 LEFT male SITTING in side profile facing RIGHT: upright torso,
thighs horizontal to the RIGHT, knees bent at 90 degrees, lower legs vertically
downward, feet forward, hands on lap; his seat is invisible. ROW1 RIGHT female
SITTING in side profile facing RIGHT, same bent-knee seated anatomy, draped
black dress follows lap; seat invisible. ROW2 LEFT male LYING on his BACK seen
from directly above, head at TOP of cell, feet at BOTTOM, eyes CLOSED, face
visible, body relaxed and flattened in top-down perspective, arms resting along
sides, legs together. ROW2 RIGHT female LYING on her BACK seen directly above,
head TOP and feet BOTTOM, eyes CLOSED, long black hair slightly spread, relaxed
arms and legs, black dress. Lying sprites must truly appear supine/relaxed from
above, NOT standing upright facing camera, NO side rotation, NO vertical
standing pose. No bed or bedding because these sprites will be placed on a
separate game mattress and partially covered with a blanket. Keep each
silhouette whole and entirely isolated. No decorative borders, no background
color, no gradients. This is a sparse 4-frame production sprite atlas with
genuine transparent alpha.

## Correção de transparência das poses

Use case: background-extraction. Change ONLY the background of this four-pose
game sprite atlas. Remove the painted grey/white checkerboard COMPLETELY and
output genuine transparent alpha background, including all holes around arms
and between legs. Preserve all four characters exactly: faces, hair, outfits,
poses, colors, proportions, positions and crisp pixel edges. NO replacement
background, NO checkerboard, NO shadows, NO text. Actual transparent PNG with
zero-alpha background, isolated four sprites in same 2x2 layout.
