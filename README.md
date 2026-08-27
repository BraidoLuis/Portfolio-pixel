# Portfólio Pixel — Luís Braido

Portfólio interativo em formato de jogo 2D de exploração. O visitante escolhe
um personagem, começa dentro de uma casa e explora um mundo com projetos,
habilidades e experiências.

## Stack

- Next.js 16, React 19 e TypeScript
- Phaser
- Tailwind CSS 4 — toda a interface usa classes utilitárias
- Motion
- Zustand
- Supabase Auth, PostgreSQL e Storage
- Vercel

## Organização do código

```text
app/
├── admin/                         # Rotas do painel administrativo
├── globals.css                   # Tailwind, fontes, tema e keyframes globais
├── layout.tsx                    # Metadados e layout raiz
└── page.tsx                      # Entrada do portfólio

components/
├── admin/                        # Login e administração de projetos
├── portfolio/
│   ├── game/                     # Phaser, controles e configurações do mapa
│   │   ├── game-screen.tsx
│   │   ├── phaser-game.tsx
│   │   ├── soundtrack-controller.tsx
│   │   └── world-config.ts       # Colisões, máscara e áreas caminháveis
│   ├── menu/                     # Tela inicial e seleção de personagem
│   ├── panels/                   # Painéis, TV, mapa e projetos
│   ├── store/                    # Estado global persistido com Zustand
│   └── portfolio-app.tsx         # Orquestra menu e jogo
└── ui/                           # Primitivos reutilizáveis de interface

content/
└── portfolio.ts                  # Perfil, habilidades e experiências locais

lib/
├── projects.ts                  # Leitura dos projetos publicados
├── supabase/                    # Cliente do Supabase
├── ui-styles.ts                 # Classes Tailwind reutilizadas
└── utils.ts                     # Utilitários genéricos

public/
├── fonts/                       # Fontes Thin e Bold
└── game/                        # Mapas, personagens, objetos e áudio

supabase/
└── schema.sql                   # Tabelas, Storage e políticas RLS
```

Consulte também [`docs/CUSTOMIZACAO.md`](docs/CUSTOMIZACAO.md) antes de alterar
mapas, colisões, personagens ou painéis.

## Funcionalidades

- Tela inicial com apresentação, GitHub, LinkedIn e seleção de personagem
- Movimentação por WASD, setas e controles mobile
- Interior da casa com objetos interativos
- Transição bidirecional entre casa e exterior
- Placas, baús e balões de interação
- Carrossel responsivo de projetos
- Painéis de habilidades e experiências
- Progresso e preferências locais
- Espaço preparado para trilha sonora
- Admin exclusivo para projetos
- Rascunho, publicação, arquivamento e upload de capa
- Fallback com projetos locais enquanto o Supabase não estiver configurado

## Desenvolvimento

```bash
npm install
cp .env.example .env.local
npm run dev
```

Validação antes de enviar alterações:

```bash
npm run lint
npm run build:vercel
```

## Configuração do Supabase

1. Crie um projeto no Supabase.
2. Execute `supabase/schema.sql` no SQL Editor.
3. Em Authentication, crie manualmente seu usuário administrador.
4. Copie o UUID do usuário e execute:

```sql
insert into public.admin_users (user_id)
values ('UUID-DO-USUARIO');
```

5. Desative o cadastro público nas configurações de Authentication.
6. Preencha em `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sua-chave-publicavel
NEXT_PUBLIC_LINKEDIN_URL=https://www.linkedin.com/in/seu-perfil
NEXT_PUBLIC_SOUNDTRACK_URL=/game/audio/main-theme.mp3
```

O painel fica em `/admin`. As políticas RLS garantem que visitantes vejam
somente projetos publicados e que apenas o usuário cadastrado em `admin_users`
possa alterar conteúdo.

## Trilha sonora

Coloque uma música licenciada em `public/game/audio/main-theme.mp3` ou use uma
URL externa em `NEXT_PUBLIC_SOUNDTRACK_URL`. O áudio começa somente depois da
interação do visitante e pode ser silenciado.

## Deploy na Vercel

1. Envie o repositório para o GitHub.
2. Importe o repositório na Vercel.
3. Cadastre as mesmas variáveis de ambiente.
4. Faça o deploy.

O arquivo `vercel.json` direciona a Vercel para `npm run build:vercel`, que usa
o build oficial do Next.js. Nenhuma alteração de código é necessária para a
migração.

## Conteúdo editável

- Projetos: administrados pelo Supabase em `/admin`.
- Habilidades, experiências e perfil: arquivos em `content/portfolio.ts`.
- Colisões, contorno da casa e áreas caminháveis: `components/portfolio/game/world-config.ts`.
- Regras e interações do jogo: `components/portfolio/game/phaser-game.tsx`.
- Estilos compartilhados: classes Tailwind em `lib/ui-styles.ts`.

O `app/globals.css` contém apenas a inicialização do Tailwind, as fontes, as
variáveis do tema e animações globais. Novos componentes devem ser estilizados
com Tailwind, evitando CSS tradicional e estilos espalhados pelo projeto.
