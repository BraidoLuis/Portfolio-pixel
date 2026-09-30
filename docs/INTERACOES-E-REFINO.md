# Despertar, zoom, trilhas e atividades do exterior

Continuação na branch `feat/exterior-tile-rebuild`, sem commit ou push. Nenhuma
alteração local anterior foi descartada. O interior, a grade exterior, as
colisões, os atlas de objetos existentes e `estado-atual-mapa.patch` foram
preservados; a comparação SHA-256 dos 14 arquivos monitorados passou.

## Comportamento implementado

- **Nova partida:** a cena começa na pose existente da cama, com o personagem
  escolhido e a mensagem “Um novo dia começa neste mundo. Pressione E para
  levantar.” A ação existente de levantar restaura uma posição livre e remove
  a mensagem. O mesmo acionamento retorna imediatamente, sem disparar outra
  interação. Retornar pela porta inicia o quarto acordado.
- **Zoom:** cada entrada no exterior redefine apenas seu passo para `-1`, o
  mínimo existente (80% do enquadramento padrão). O quarto guarda seu próprio
  passo. A cena publica o estado para o indicador e para desabilitar os botões
  nos extremos; o HUD também solicita um estado inicial. Proporção, fundo preto
  e lógica de enquadramento foram mantidos.
- **Trilhas:** tiles de 16 px ampliados a 2× usam máscaras de oito vizinhos e
  oito variações de textura. Cantos externos e internos arredondam em degraus
  de pixels; bordas têm pequenas irregularidades contínuas entre peças. Os
  encontros das escadas recebem desgaste de terra. Cena, minimapa e prévia
  usam os mesmos índices do atlas. A grade caminhável não mudou.
- **Pesca:** no píer existente, “Pressione E para pescar” inicia uma posição
  voltada ao lago. Vara com empunhadura, nós e carretilha, linha, boia, lançamento
  de 900 ms, respingos e ondulações são desenhados em pixels de 2 px. O corpo
  físico fica desativado enquanto pesca. `E` ou `Esc` encerra e restaura uma
  posição livre. Os efeitos usam coordenadas do mundo e são destruídos na
  saída ou no encerramento da cena. Não há inventário, moedas ou itens.
- **Flores e pedra:** as flores da ilha central e a pedra ao sul do lago
  receberam prompts de `E` e respostas textuais curtas. As mensagens expiram
  em 3,6 segundos ou ao se afastar; a caminhada permanece livre. Nenhum objeto
  ou obstáculo foi acrescentado para essas duas interações.

## Arquivos desta etapa

- `components/portfolio/game/phaser-game.tsx`: despertar, pesca, respostas do
  cenário, eventos de zoom e integração com física/entrada existentes.
- `components/portfolio/game/game-screen.tsx` e `game-zoom.ts`: indicador,
  estado e limites compartilhados dos controles de zoom.
- `components/portfolio/game/world-activities.ts` e `fishing-renderer.ts`:
  atividades, posição segura no píer, saída e animação em coordenadas do mundo.
- `components/portfolio/game/exterior-art.ts`: seleção de tiles por vizinhança.
- `scripts/build-exterior-assets.mjs`, `exterior-terrain-shapes.mjs` e
  `public/game/exterior/terrain.png`: compilação das novas bordas e texturas
  usando as fontes ilustradas existentes. Os sprites não foram recriados.
- `scripts/check-exterior.mjs`, `check-exterior-terrain.mjs`,
  `check-world-activities.mjs` e `check-house-scene.mjs`: verificação da cena,
  terreno, caminhos e atividades.
- `scripts/render-activities-preview.mjs` e `render-wake-preview.mjs`:
  composição das prévias com os recursos e coordenadas reais.
- `package.json`: `check:world` inclui terreno e atividades; `preview:world`
  gera o mapa e as etapas da pesca.
- Prévias em `docs/exterior-art/` e `docs/interior-art/`, e este relatório.

## Verificações concluídas

| Verificação | Resultado |
| --- | --- |
| `npm run lint` | Aprovado |
| `npm run typecheck` | Aprovado |
| `npm run build` | Aprovado; páginas estáticas geradas |
| `npm run check:house` | 6.028 posições alcançáveis, 7 interações, 8 móveis sólidos e 22 barreiras |
| Métodos reais da cena com adaptadores | 2 despertares, 6 ciclos de zoom, 6 poses, 4 ciclos de pesca e 4 observações |
| `npm run check:world` | 20.178 posições, 16 interações incluindo os 8 baús; 106 tiles sólidos, 113 objetos e 24 barreiras |
| Continuidade visual do terreno | 409.600 pixels opacos, 44.224 amostras de junções e 512 máscaras complementares |
| Pesca | Pegada inteira no píer; boia na água; lançamento, oscilação, alinhamento de pixels e limpeza dos efeitos |
| Preservação | 14 arquivos monitorados sem mudança de SHA-256; `git diff --check` aprovado |

Os testes de cena executam os métodos de produção extraídos de `PortfolioScene`
com adaptadores de câmera, física e imagem. Exercitam ambos os personagens,
proteção contra repetição de `E`, `E`/`Esc` na pesca, retorno ao quarto acordado,
limites e comunicação do zoom em três tamanhos de tela. Não equivalem a uma
sessão real de Phaser no navegador.

## Prévias inspecionadas e limites

- [Exterior e trilhas](exterior-art/exterior-preview.png)
- [Pesca: preparar, lançar e aguardar com ambos os personagens](exterior-art/fishing-preview.png)
- [Despertar dos dois personagens](interior-art/wake-up-preview.png)

As imagens servem apenas para revisão; nenhuma é usada como fundo do jogo. A
prévia da pesca grava os retângulos de pixels do próprio renderer. A prévia do
despertar usa as poses existentes, a camada do cobertor e a mensagem de produção,
com fonte de fallback. A composição da vara foi ajustada após inspeção.

A ferramenta de navegador retornou `apps: []` e `browsers: []`. Ainda precisam
de conferência manual: suavidade e leitura das animações em movimento, áudio,
zoom/câmera e enquadramento em desktop/celular, botões reais, prompts na fonte
do jogo e transições visuais. Verificar especialmente nova partida → `E` →
porta → exterior a 80%, retorno acordado, pesca com `E`/`Esc`, flores e pedra.

Para reproduzir as prévias:

```sh
npm run preview:world
node scripts/render-wake-preview.mjs
```

O gerador de prévias emitiu aviso de cache de fontes sem permissão de escrita,
mas terminou com código 0 e produziu todas as imagens; os arquivos foram abertos
e inspecionados.
