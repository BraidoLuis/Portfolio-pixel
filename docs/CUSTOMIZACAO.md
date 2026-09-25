# Guia de customização

Este arquivo indica onde alterar cada parte do portfólio sem precisar procurar
valores espalhados pelo projeto.

## Mapa, máscara e colisões

Arquivo principal:

```text
components/portfolio/game/world-config.ts
```

- `HOUSE_COLLISIONS`: móveis e objetos bloqueados dentro da casa.
- `WORLD_COLLISIONS`: baús, placas, árvores e outros objetos bloqueados no exterior.
- `HOUSE_FLOOR_AREAS`: regiões onde o personagem pode andar no quarto.
- `WORLD_MARKED_WALKABLE_POLYGONS`: trilhas, escadas e gramado caminhável conforme as marcações do mapa.
- `WORLD_SOLID_POLYGONS`: casa, ilhota de flores e árvore bloqueadas.
- `world-walkability.ts`: verifica toda a área dos pés contra os polígonos e os obstáculos.
- `WORLD_FOREGROUND_REGIONS`: máscara poligonal usada para cobrir o personagem.
- `SPAWN_POINTS`: posição inicial em cada ambiente.

Cada colisão usa centro, largura e altura:

```ts
{ x: 625, y: 862, width: 350, height: 160 }
```

A máscara da casa é composta por polígonos. Cada ponto é `[x, y]` relativo ao
recorte definido por `x`, `y`, `width` e `height` da região.

Os pontos de `WORLD_MARKED_WALKABLE_POLYGONS` usam coordenadas absolutas da
imagem exterior de 1254 × 1254 pixels. Ao trocar a arte, revise os limites
desses polígonos e a posição das placas, baús e demais colisões.

## Comportamento do jogo

```text
components/portfolio/game/phaser-game.tsx
```

Esse arquivo concentra a cena Phaser: carregamento de assets, movimentação,
animações, interações, troca de ambientes e fogo da lareira.

## Tela inicial

```text
components/portfolio/menu/start-screen.tsx
```

Altere apresentação, links, nuvens, título e seleção dos personagens nesse
arquivo. O estado do menu fica em `components/portfolio/store/portfolio-store.ts`.

## Painéis e TV

```text
components/portfolio/panels/
├── content-dialog.tsx
├── panel-frame.tsx
├── project-carousel.tsx
└── static-panels.tsx
```

- `content-dialog.tsx`: decide qual painel abrir.
- `static-panels.tsx`: tutorial, TV, formação, contatos, habilidades, experiências, certificações e mapa.
- `project-carousel.tsx`: cards e navegação dos projetos.
- `panel-frame.tsx`: molduras reutilizáveis.

## Conteúdo

Todo o conteúdo é editado no código:

- `content/projects.ts`: projetos, links, capas, status e ordem.
- `content/portfolio.ts`: habilidades, experiências e certificações.
- `content/site.ts`: GitHub, LinkedIn e caminho da música.
- `public/projects/`: capas, usando caminhos como `/projects/capa.webp`.

Os projetos publicados são selecionados em `app/page.tsx` por `lib/projects.ts`
e entregues ao jogo junto com a página. Não há consulta a banco nem autenticação.
O passo a passo para novos cadastros está em [PROJETOS.md](PROJETOS.md).

## Tailwind

A interface utiliza Tailwind CSS 4. Para criar ou ajustar componentes, edite as
classes no `className`. Classes que se repetem ficam em:

```text
lib/ui-styles.ts
```

O `app/globals.css` deve permanecer restrito a:

- imports do Tailwind;
- fontes globais;
- tokens do tema;
- scrollbar global;
- keyframes reutilizados globalmente.

Evite criar novos seletores CSS para componentes.

## Assets

```text
public/game/
```

- `exterior-world.png`: mapa exterior.
- `house-interior.png`: quarto.
- `character-*-walksheet.png`: animações de caminhada.
- `character-*-portrait.png`: seleção de personagem.
- `audio/`: trilha sonora e efeitos.

Ao substituir uma imagem, preserve o nome e as dimensões quando não quiser
alterar coordenadas, máscaras e colisões.

## Verificação

Antes de enviar para a Vercel:

```bash
npm install
npm run lint
npm run typecheck
npm run build:vercel
```

O projeto já contém `vercel.json` e utiliza o build oficial do Next.js para a
integração com a Vercel.
