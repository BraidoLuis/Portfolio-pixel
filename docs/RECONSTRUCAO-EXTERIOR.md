# Reconstrução do exterior

Implementação na branch `feat/exterior-tile-rebuild`, sem commit ou push.
`estado-atual-mapa.patch` foi preservado. O PNG antigo permanece no repositório
como referência, sem uso na cena ou no minimapa.

## Organização

- `components/portfolio/game/exterior-map.ts`: grade 40 × 40 de tiles de 32 px,
  304 objetos independentes, colisões, plataformas, spawn e 13 interações.
- `exterior-art.ts`: seleção compartilhada dos frames de terreno por vizinhança.
- `exterior-renderer.ts`: tilemap Phaser com fonte de 16 px em escala 2× e sprites
  separados, ordenados pela base dos objetos.
- `world-walkability.ts`: consulta todos os tiles tocados pelos pés e as caixas
  dos objetos; água e barrancos bloqueiam, escadas e a plataforma da doca permitem
  passagem. Não usa os grandes polígonos do mapa anterior.
- `world-config.ts`: dimensões/spawn do exterior; valores do interior preservados.
- `phaser-game.tsx`: carrega e monta o exterior novo, usando as interações do
  modelo. A casa continua uma área separada com a implementação original.
- `world-minimap.tsx` e `panels/static-panels.tsx`: mapa auxiliar recomposto dos
  mesmos tiles/sprites, com os quatro marcadores vindos do modelo.
- `public/game/exterior/`: terrain.png, objects.png e objects.json.
- `scripts/`: compilação dos recursos, teste de percursos e renderização da prévia.
- `docs/exterior-art/`: fontes originais, prompts, instruções e prévia revisada.

Os oito baús físicos abrem os mesmos quatro painéis: Projetos, Habilidades,
Experiências e Certificações. As quatro placas abrem o mapa. A porta conserva a
transição e o som. Controles, personagens, animações, passos, trilha, demais sons,
TV/lareira, painéis e conteúdo de Introdução à Cibersegurança não foram reescritos.

## Verificações executadas

| Verificação | Resultado |
| --- | --- |
| `npm run check:world` | Passou: 20.178 posições alcançáveis e todas as 13 interações |
| Oito baús / quatro grupos | Todos acessíveis com seleção da interação mais próxima |
| Escadas norte e oeste | Três faixas transitáveis em cada uma |
| Caminho atrás, lados e frente da casa | Percursos contínuos, incluindo três faixas paralelas |
| Placas, porta e doca | Acessíveis a partir do spawn |
| Água/barrancos e objetos | 106 tiles sólidos e 113 caixas de objetos verificados |
| Movimento longo | 24 barreiras verificadas sem atravessamento de obstáculos |
| `npm run lint` | Passou |
| `npm run typecheck` | Passou |
| `npm run build` | Passou: build de produção e páginas estáticas geradas |
| HTTP local | Página, terrain.png, objects.png e objects.json responderam 200 |

O teste usa a pegada real de 22,4 × 10 px do personagem de 80 px, busca em passos
de 8 px com amostras intermediárias e a função real de movimento em subpassos de
até 4 px. Também verifica a seleção da interação mais próxima, evitando contar
um baú como acessível quando uma placa capturaria a ação. Os percursos completos
são escritos em `work/exterior-routes.json` (saída temporária ignorada pelo Git).

A prévia foi inspecionada contra a referência: casa central inferior, circuito
ao redor e atrás, baú norte, grupos laterais, certificações a sudoeste e lago a
leste. Foram refinadas a distribuição de texturas, bordas de trilhas, continuidade
dos degraus e escala dos baús/placas. Os sprites já gerados foram preservados.

## Limites da verificação

Não houve navegador disponível pela ferramenta de automação; a prévia é uma
composição estática dos dados, não uma captura de execução. Testes geométricos e
build não substituem testar o jogo aberto. Conferir manualmente:

1. Entrar e sair da casa, voltar ao exterior e abrir/fechar os quatro painéis e o mapa.
2. Percorrer as rotas com ambos os personagens; observar oclusão atrás da casa,
   copas e placas, acompanhamento da câmera e todos os níveis de zoom.
3. Ouvir passos, baús, placas e porta; experimentar setas/WASD, E/Espaço e controles
   móveis, especialmente em tela pequena.

Prévia: [exterior-preview.png](exterior-art/exterior-preview.png).
