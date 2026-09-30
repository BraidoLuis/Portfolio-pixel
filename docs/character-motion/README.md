# Personagens: diagonais e pesca

Recursos novos; as duas folhas de caminhada originais e as poses do quarto foram preservadas. Gerados com a ferramenta integrada `image_gen`, sem CLI ou API externa. Cada direção diagonal usa um desenho em três quartos; as direções à esquerda são espelhamentos horizontais dos desenhos à direita, sem girar sprites cardinais.

- `masculine-source.png` e `feminine-source.png`: fontes transparentes, 4 colunas por 3 linhas. A resposta feminina trouxe xadrez opaco; `feminine-generated-opaque.png` preserva a resposta original. `scripts/extract-character-motion-alpha.mjs` remove somente as áreas neutras conectadas às bordas e produz a fonte transparente usada pelo atlas.
- Linha 1: nordeste, quatro quadros. Linha 2: sudeste, quatro quadros.
- Linha 3: preparar lançamento, lançar, recolher, esperar.
- `public/game/character-motion/atlas.png` / `atlas.json`: 40 quadros independentes de 256 × 256; corpo em grade nativa de 64 px, pés na linha 235, consistente com as folhas antigas.
- `motion-preview.png`: contato visual dos 32 quadros diagonais e oito poses de pesca, na escala interna de 96 px.

Compilação e verificação:

```sh
node scripts/build-character-motion.mjs
node scripts/check-character-motion.mjs
node scripts/render-character-motion-preview.mjs
```

Se a fonte feminina precisar ser recompilada a partir da resposta original, execute `node scripts/extract-character-motion-alpha.mjs` antes do compilador. A remoção de fundo foi tentada três vezes com `image_gen`, mas as respostas mantiveram o xadrez pintado; o filtro determinístico é verificado pelo teste de alfa e pela prévia.

O compilador recorta cada célula por alpha, normaliza o corpo à mesma altura e linha dos pés, usa nearest-neighbor e alpha binário. Não cria quadros por rotação. O teste confere as quatro direções dos dois personagens, quadros distintos, transparência, dimensão e alinhamento dos pés. A velocidade, colisões e acionamento das animações são testados na cena separadamente.

## Prompts usados

Foi executado um pedido por personagem, com a respectiva folha original como referência de identidade. Prompt masculino:

> Use case: identity-preserve. Asset: additional pixel-art game sprite sheet for the EXACT male character in attached reference: curly dark brown hair, short beard, black short sleeve polo with necklace, dark gray trousers and black shoes. KEEP identity, palette, proportions, pixel outlines, 3x-to-4x enlarged native pixel clusters. Produce a NEW sheet with EXACTLY 4 evenly spaced columns and 3 evenly spaced rows, twelve full-body character poses, centered in each cell, aligned foot baseline, ample transparent margin. Genuine TRANSPARENT alpha background, no colored/checker background, no labels, no grid, no props, no shadows. Camera is topdown RPG three-quarter as original; sprites remain upright, NEVER rotated or tilted bodily. Row1: four walking frames facing diagonally UP-RIGHT (northeast), genuine three-quarter BACK view, mostly back of head and torso but a small right cheek visible, legs alternating stance / left step / passing / right step. Row2: four walking frames facing diagonally DOWN-RIGHT (southeast), genuine three-quarter FRONT view, face and shirt visible, feet taking steps toward viewer's lower right, alternating stance / left step / passing / right step. Row3: four fishing action frames with character facing UP (back view): first winding up a cast with right hand lifted near right shoulder and left hand forward, second casting release with right arm reaching forward/up, third REELING hands together forward and knees slightly bent, fourth WAITING hands forward relaxed. Do NOT draw fishing rod/line/fish (separate scene sprites). Match male reference silhouette and detailed pixel-art styling closely. All cells same character size, roughly 80% cell height. High-quality crisp pixels suitable for nearest-neighbor downsample.

Prompt feminino: o mesmo texto, trocando a descrição por `the EXACT female character in attached reference: long straight jet black hair, warm tan skin, black sleeveless long slit dress and black shoes`, `face and shirt` por `face and dress`, e `Match male reference` por `Match female reference`.

As primeiras respostas desenharam um checkerboard opaco. Foram corrigidas pela própria ferramenta, mantendo os desenhos. Prompt aplicado separadamente a cada folha (male/female):

> Use case: background-extraction. Edit target: the supplied twelve male pixel sprites sheet. Remove ONLY the gray checkerboard background completely, replace with actual transparent alpha (RGBA PNG). The checkerboard currently consists of opaque painted gray squares; do not leave any of those pixels and do NOT replace with a different colored backdrop. Keep the exact twelve sprite pixels, identities, poses, size, 4 columns x 3 rows and spacing unchanged. No new art. Return real transparency, not an illustration of transparency.

A prévia comprova composição e poses estáticas. A continuidade visual da passada e o encaixe da mão na vara durante o lançamento ainda devem ser conferidos no navegador nos diferentes níveis de zoom.
