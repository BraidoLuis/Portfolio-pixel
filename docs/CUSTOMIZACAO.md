# Guia de customização

Este arquivo indica onde alterar cada parte do portfólio sem precisar procurar
valores espalhados pelo projeto.

## Mapa, máscara e colisões

Arquivo principal:

```text
components/portfolio/game/world-config.ts
```

- `HOUSE_COLLISIONS`: móveis e objetos bloqueados dentro da casa.
- `WORLD_COLLISIONS`: baús, placas, casa e objetos bloqueados no exterior.
- `HOUSE_FLOOR_AREAS`: regiões onde o personagem pode andar no quarto.
- `WORLD_SPECIAL_WALKABLE_AREAS`: áreas caminháveis que não possuem a cor do caminho.
- `HIDDEN_HOUSE_PATHS`: caminhos ocultos atrás da casa.
- `WORLD_FOREGROUND_REGIONS`: máscara poligonal usada para cobrir o personagem.
- `SPAWN_POINTS`: posição inicial em cada ambiente.

Cada colisão usa centro, largura e altura:

```ts
{ x: 625, y: 862, width: 350, height: 160 }
```

A máscara da casa é composta por polígonos. Cada ponto é `[x, y]` relativo ao
recorte definido por `x`, `y`, `width` e `height` da região.

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
- `static-panels.tsx`: tutorial, TV, formação, contatos, habilidades e experiências.
- `project-carousel.tsx`: cards e navegação dos projetos.
- `panel-frame.tsx`: molduras reutilizáveis.

## Conteúdo

Habilidades e experiências continuam no código:

```text
content/portfolio.ts
```

Projetos publicados são carregados do Supabase. Quando ele não estiver
configurado, `fallbackProjects` será usado.

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
npm run build:vercel
```

O projeto já contém `vercel.json` e utiliza o build oficial do Next.js para a
integração com a Vercel.
