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
  category: "Aplicações web",
  problem: "Qual problema o projeto resolve.",
  solution: "Como desenvolvi a solução e qual foi minha participação.",
  role: "Desenvolvedor Full Stack",
  technologies: ["Next.js", "TypeScript", "Tailwind CSS"],
  features: ["Funcionalidade 1", "Funcionalidade 2"],
  backend: ["Dados, API, autenticação e controle de acesso confirmados."],
  integrations: [],
  deployment: null,
  development_stage: "Protótipo",
  limitations: ["Liste recursos planejados ou parcialmente implementados."],
  testing: {
    suites: [],
    description: "Não foi identificada uma suíte automatizada.",
    verified_on: "2026-10-14",
  },
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

Os cards mostram título, categoria, resumo, maturidade, tecnologias, capa, links
e indicadores de testes/scripts. **Ver detalhes** abre problema, solução,
participação, funcionalidades, backend, integrações, deploy, testes e limitações
no mesmo baú. Ao voltar, filtros, página, rolagem e foco são preservados.

A busca considera nome, resumo, categoria e tecnologias, sem diferenciar acentos
ou maiúsculas. Os filtros de categoria e destaques podem ser combinados. Itens
em destaque aparecem primeiro; `display_order` ordena dentro de cada grupo.

Em `testing.suites`, use `kind: "tests"` para casos e `kind: "scripts"` para
scripts de verificação. A quantidade conta definições, expandindo parametrizações
e loops que registram casos; não some asserções nem execuções por navegador.
Informe aprovação e cobertura somente com evidência. Veja
[a auditoria do catálogo](AUDITORIA-CONTEUDO.md) para fontes e revisões atuais.

## Validar e publicar

```bash
npm run lint
npm run typecheck
npm run build
```

Depois faça commit e push no GitHub. Um novo deploy é necessário para as mudanças
aparecerem no site público.
