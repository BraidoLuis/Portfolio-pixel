# Baú de Projetos, pesca, diagonais e ciclo do exterior

Este relatório registra a etapa anterior. Os valores atuais de postes, conquistas e testes no navegador estão em [Polimento do mapa e da interface](POLIMENTO-MAPA-E-INTERFACE.md).

Implementado sobre a branch `feat/exterior-tile-rebuild`, sem commit nem push.
O quarto, as posições de tiles caminháveis, os atlas anteriores e
`estado-atual-mapa.patch` foram preservados. Dezesseis arquivos monitorados
mantiveram o SHA-256 original.

## Cena e recursos

- O baú de Projetos continua acima da escada norte. Usa o mesmo sprite original
  a 96 × 96 px (os outros baús têm 48 × 48), profundidade pela base em `y=160`,
  colisão só da base (80 × 40 px) e interação centralizada em `x=640,y=132`
  com alcance de 132 px. Montes, moedas e brilhos usam peças de pixels, sem
  bloquear o acesso ao painel de Projetos.
- Foram adicionados cinco postes nas bordas úteis das trilhas. Apenas bases de
  16 × 16 px colidem. Brilhos quentes aparecem gradualmente no entardecer,
  ficam acesos à noite e desaparecem durante o amanhecer. Nuvens passam
  ocasionalmente em coordenadas do mundo, abaixo dos prompts e dos botões.
- O ciclo completo dura **240.000 ms (4 minutos)**, configurado em
  `components/portfolio/game/world-time.ts` por `WORLD_DAY_DURATION_MS`.
  Dia ocupa 42%, entardecer 20%, noite 18% e amanhecer 20%. O relógio usa
  `performance.now()` na instância da cena e não é reiniciado pela entrada ou
  saída da casa. O quarto e o minimapa não recebem a camada noturna.
- Os dois personagens receberam 40 quadros adicionais em um atlas: quatro
  passos para cada direção diagonal e quatro poses de pesca por personagem.
  As direções esquerdas espelham desenhos originais em três quartos das
  direitas; não há rotação artificial. O movimento continua normalizado para
  190 px/s, com a mesma pegada de colisão e os sons de passos.
- A pesca anima lançamento (900 ms), espera, fisgada a 4.000 ms, retirada a
  partir de 4.350 ms, peixe capturado aos 5.200 ms e uma breve apresentação
  até 6.500 ms. Só então `E` inicia a próxima tentativa. `Esc` cancela uma
  tentativa em curso sem contar o peixe. Repetição da tecla não cria novas
  capturas. Peixe, vara, linha e boia usam pixels em coordenadas do mundo e
  acompanham a câmera e o zoom.
- O contador e a conquista após três peixes usam o `persist` já existente do
  Zustand em `localStorage`, na chave `luis-pixel-portfolio`. A conquista é
  registrada uma vez; o HUD mostra a mensagem e mantém uma estrela com nome
  acessível, clicável para reler a conquista. Não há backend ou inventário.

## Arquivos desta etapa

- `components/portfolio/game/exterior-map.ts`, `exterior-renderer.ts`,
  `exterior-atmosphere.ts`, `exterior-decor.ts` e `world-time.ts`:
  tamanho/colisão/interação do baú, postes, ouro, nuvens e ciclo visual.
- `components/portfolio/game/character-motion.ts`,
  `public/game/character-motion/atlas.png` e `atlas.json`:
  direções e poses adicionais, sem alterar as folhas originais.
- `components/portfolio/game/world-activities.ts`, `fishing-renderer.ts` e
  `phaser-game.tsx`: estados da pesca, quadros do personagem e integração da
  cena. `components/portfolio/store/portfolio-store.ts`, `game-screen.tsx` e
  `fishing-hud.tsx`: contagem e conquista persistentes.
- `scripts/build-character-motion.mjs`, `extract-character-motion-alpha.mjs`,
  `check-character-motion.mjs`, `check-fishing-achievement.mjs`,
  `check-world-life.mjs`, `check-world-activities.mjs`,
  `check-house-scene.mjs`, `render-character-motion-preview.mjs`,
  `render-activities-preview.mjs`, `render-world-life-preview.mjs` e
  `package.json`: preparação, verificações e prévias.
- `docs/character-motion/`, `docs/exterior-art/` e este relatório:
  fontes, prompts e imagens de revisão.

## Verificação

| Checagem | Resultado |
| --- | --- |
| `npm run lint`, `npm run typecheck`, `npm run build` | Aprovados |
| `npm run check:world` | 20.058 posições com pegada completa; 16 interações acessíveis, 8 baús, 118 objetos sólidos, 25 barreiras |
| `npm run check:house` | 6.028 posições, 7 interações e 6 poses existentes; métodos reais da cena: 16 combinações de diagonal, 8 capturas, cancelamentos, zoom, portas, relógio contínuo |
| `npm run check:character-motion` | 32 quadros de caminhada distintos, 8 poses de pesca, alfa binário e pés alinhados |
| Persistência | Terceiro peixe libera uma vez; contador e estrela sobrevivem à saída/menu e à recriação da loja local; preferências antigas mantidas |
| Integridade | 16 hashes dos recursos preservados iguais; `git diff --check` aprovado |

As prévias usam os mesmos tiles, sprites e comandos de pixels da cena:

- [Baú de Projetos](exterior-art/projects-preview.png)
- [Exterior de dia](exterior-art/day-preview.png)
- [Exterior à noite](exterior-art/night-preview.png)
- [Lançamento, retirada e peixe para os dois personagens](exterior-art/fishing-preview.png)
- [Quadros diagonais e poses](character-motion/motion-preview.png)

A ferramenta de navegador retornou `apps: []` e `browsers: []`. Os testes
executam métodos de produção com adaptadores de física, câmera e gráficos;
as imagens são composições estáticas. Ainda requerem conferência manual no
jogo: cadência dos passos, mão/vara e peixe em movimento, áudio, efeitos
noturnos e nuvens em diferentes zooms, interação do baú e estrela em desktop
e celular. Os avisos de cache de fonte durante a criação das prévias não
impediram sua geração nem a inspeção dos arquivos.

Para repetir:

```sh
npm run check:world
npm run check:house
npm run check:character-motion
npm run preview:world
npm run preview:character-motion
```
