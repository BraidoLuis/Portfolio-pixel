# Como editar os projetos

O arquivo `content/projects.ts` é a fonte dos projetos. Não é necessário um painel
administrativo ou uma conta externa para editá-los.

## Adicionar

Acrescente um objeto à lista `projects`, usando identificadores únicos:

```ts
{
  id: "meu-novo-projeto",
  slug: "meu-novo-projeto",
  title: "Meu novo projeto",
  summary: "Uma descrição curta do que o projeto faz.",
  problem: "Qual problema o projeto resolve.",
  solution: "Como desenvolvi a solução e qual foi minha participação.",
  role: "Desenvolvedor Full Stack",
  technologies: ["Next.js", "TypeScript", "Tailwind CSS"],
  features: ["Funcionalidade 1", "Funcionalidade 2"],
  live_url: "https://meu-projeto.example",
  repository_url: "https://github.com/BraidoLuis/meu-novo-projeto",
  thumbnail_url: null,
  status: "published",
  featured: true,
  display_order: 5,
},
```

Substitua os endereços de exemplo por links reais ou use `null` para não exibir
o botão correspondente.

## Capas locais

1. Coloque a imagem em `public/projects/meu-novo-projeto.webp`.
2. Defina `thumbnail_url: "/projects/meu-novo-projeto.webp"`.
3. Salve e confira o baú de projetos.

Não inclua `public` no endereço. Prefira nomes sem espaços e respeite letras
maiúsculas e minúsculas. Use `null` caso não queira capa. Copie imagens de serviços
antigos para essa pasta para que também fiquem independentes desses serviços.

## Exibição e ordem

| Campo | Efeito |
| --- | --- |
| `status: "published"` | Exibe o projeto no carrossel |
| `status: "draft"` | Mantém o item no código, fora do carrossel |
| `status: "archived"` | Mantém o item no código, fora do carrossel |
| `display_order` | Ordenação crescente; 1 aparece antes de 2 |
| `live_url` | Exibe o botão Ambiente publicado quando preenchido |
| `repository_url` | Exibe o botão Repositório quando preenchido |
| `thumbnail_url` | Exibe a capa quando preenchido |

Use valores diferentes em `display_order` quando precisar de uma sequência exata.
Para excluir, remova o objeto da lista. Uma lista vazia exibe uma mensagem de
ausência de projetos, sem carregamento infinito ou uso de dados de exemplo.

O layout atual mostra título, resumo, solução, função, tecnologias, capa e links.
`problem`, `features` e `featured` foram mantidos para preservar a estrutura dos
seus registros; ainda não alteram a apresentação do card.

## Validar e publicar

```bash
npm run lint
npm run typecheck
npm run build
```

Depois faça commit e push no GitHub. Um novo deploy é necessário para as mudanças
aparecerem no site público.
