# Migração para conteúdo local

## O que mudou

- Removidos `@supabase/ssr` e `@supabase/supabase-js`, incluindo dependências
  exclusivas no lockfile.
- Removidos o cliente do banco, schema SQL, login, upload remoto e painel admin.
- Removidas `/admin` e `/admin/login`.
- Projetos agora ficam em `content/projects.ts`, sem consultas externas.
- GitHub, LinkedIn e caminho da trilha ficam em `content/site.ts`.
- Nenhuma variável de ambiente é necessária para executar o portfólio.

Os quatro projetos que já existiam no código foram preservados: SPA Express
Cambucás, NB Arquitetura, Projeto Transformação e FriBolos. Eles deixaram de ser
um fallback e agora são a fonte principal do conteúdo.

O banco está vazio, conforme informado pelo proprietário; não há dados a migrar.
Nenhuma alteração foi feita no serviço remoto. As menções a Supabase nas
habilidades e nas tecnologias de outros projetos são conteúdo profissional,
não uma integração deste portfólio.

## Usar a branch localmente

Na pasta do repositório, pare o servidor de desenvolvimento e execute:

```bash
git fetch origin
git switch --track origin/refactor/remove-supabase
npm ci
npm run dev
```

Se a branch já existir no computador, use `git switch refactor/remove-supabase`.
As exclusões das pastas antigas são aplicadas pelo Git junto com a troca de branch.
Não é necessário copiar arquivos manualmente ou criar outro repositório.

O `.env.local` antigo pode ser removido. Confira links e música em
`content/site.ts` se você personalizou esses valores no seu ambiente.

## Editar o conteúdo

- Projetos: `content/projects.ts`; veja o exemplo em [PROJETOS.md](PROJETOS.md).
- Capas: arquivos em `public/projects/`, referenciados por `/projects/nome.webp`.
- Habilidades e experiências: `content/portfolio.ts`.
- Configurações públicas: `content/site.ts`.

Somente projetos com `status: "published"` são enviados ao jogo. A lista é
ordenada por `display_order`. Os links do ambiente publicado e do repositório
continuam independentes; `null` oculta o respectivo botão.

## Publicação

Após revisar a branch, integre as alterações à branch usada na Vercel para gerar
um novo deploy. Não é necessário modificar o framework ou o comando de build.
As variáveis antigas de Supabase, LinkedIn e soundtrack podem ser removidas da
Vercel porque esta versão usa os arquivos de conteúdo.

Criar a branch não altera a `main`. Futuras edições dos projetos também precisam
de commit, push e deploy para aparecer no site publicado.
