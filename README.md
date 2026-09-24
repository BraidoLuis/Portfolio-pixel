# Portfólio Pixel — Luís Braido

Portfólio interativo com casa, mundo explorável, personagens, baús e painéis.
Os projetos e demais conteúdos são editados diretamente no código.
Esta versão não usa banco de dados, autenticação nem painel administrativo.

## Tecnologias

- Next.js, React e TypeScript
- Tailwind CSS 4 para a interface
- Motion para transições e animações da interface
- Phaser para o mundo, movimentação, colisões e efeitos
- Zustand e localStorage para personagem, áudio e descobertas
- Vercel para publicação

Os mapas atuais são imagens PNG com colisões configuradas em TypeScript.

## Rodar no computador

Requisitos: Node.js 20.9 ou superior e npm.

```bash
npm install
npm run dev
```

Acesse <http://localhost:3000>. Não é necessário criar `.env.local`, configurar
chaves ou manter um serviço de banco ativo. As configurações públicas ficam em
`content/site.ts`.

Para validar e testar o build de produção:

```bash
npm run lint
npm run typecheck
npm run build
npm run start
```

## Onde editar

| O que mudar | Arquivo ou pasta |
| --- | --- |
| Adicionar, editar, ocultar ou reordenar projetos | `content/projects.ts` |
| Habilidades e experiências | `content/portfolio.ts` |
| GitHub, LinkedIn e caminho da música | `content/site.ts` |
| Capas dos projetos | `public/projects/` |
| Apresentação, título e seleção de personagem | `components/portfolio/menu/start-screen.tsx` |
| Tutorial, TV, formação e mapa | `components/portfolio/panels/static-panels.tsx` |
| Colisões, máscara da casa e pontos de chegada | `components/portfolio/game/world-config.ts` |
| Movimentação, lareira, sons e interações | `components/portfolio/game/phaser-game.tsx` |
| Classes Tailwind reutilizadas | `lib/ui-styles.ts` |
| Fontes, tema e scrollbar global | `app/globals.css` |

Consulte [docs/PROJETOS.md](docs/PROJETOS.md) para cadastrar um projeto e
[docs/CUSTOMIZACAO.md](docs/CUSTOMIZACAO.md) para alterar o jogo.

## Estrutura

```text
app/
  page.tsx                 # Seleciona os projetos locais e inicia o portfólio
  layout.tsx               # Metadados e layout raiz
  globals.css              # Tailwind, tema, fontes, scrollbar e animações globais
components/
  portfolio/
    game/                  # Phaser, controles, sons e configurações do mapa
    menu/                  # Tela inicial e seleção de personagem
    panels/                # Baús, TV, mapa e carrossel de projetos
    store/                 # Preferências e estado do jogo
    portfolio-app.tsx      # Integração entre menu e jogo
  ui/                      # Componentes reutilizáveis de interface
content/
  projects.ts              # Projetos e seus tipos
  portfolio.ts             # Habilidades e experiências
  site.ts                  # Links e trilha sonora
lib/
  projects.ts              # Seleciona e ordena os projetos publicados
  ui-styles.ts             # Classes Tailwind compartilhadas
  utils.ts                 # Utilitários da interface
public/
  projects/                # Capas adicionadas diretamente ao projeto
  game/                    # Cenários, personagens, objetos e áudios
  fonts/                   # Fontes locais e licenças
```

## Conteúdo e publicação

`app/page.tsx` seleciona os itens com `status: "published"`, ordena por
`display_order` e os entrega ao jogo junto com a página. Abrir o baú não consulta
uma API. `draft` e `archived` deixam o projeto fora da lista exibida.
Esses estados controlam a exibição; arquivos de um repositório público continuam
acessíveis pelo GitHub.

Os botões de cada card são independentes: `live_url` controla o ambiente publicado
e `repository_url` controla o repositório. Use `null` para ocultar um deles.
A ausência de capa também é aceita.

Durante o desenvolvimento, salve os arquivos para ver as mudanças. No site
publicado, é necessário fazer commit, push e um novo deploy.

## Áudio

A música enviada já está configurada em `content/site.ts`:

```ts
soundtrackUrl: "/game/audio/Stardew-Valley-song.mp3",
```

Para trocar, coloque a faixa em `public/game/audio/` e altere o caminho.
Uma string vazia desativa a trilha. Os sons de passos, baús, porta, lareira, TV,
mapa e seleção permanecem em `public/game/audio/effects/`.

## Publicar na Vercel

1. Envie o código para seu repositório GitHub.
2. Importe o repositório usando o framework **Next.js**.
3. Mantenha `npm run build:vercel`, já definido em `vercel.json`.
4. Publique. Esta versão não precisa de variáveis de ambiente.

No projeto Vercel existente, as variáveis antigas de banco e autenticação podem
ser removidas. Links e música são lidos de `content/site.ts`.

## Substituir a versão anterior

Veja [docs/MIGRACAO.md](docs/MIGRACAO.md) para usar a branch de conteúdo local,
atualizar as dependências e publicar a mudança.
