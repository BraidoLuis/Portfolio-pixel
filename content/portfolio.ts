export type ProjectStatus = "draft" | "published" | "archived";

export type Project = {
  id: string;
  slug: string;
  title: string;
  summary: string;
  problem: string;
  solution: string;
  role: string;
  technologies: string[];
  features: string[];
  live_url: string | null;
  repository_url: string | null;
  thumbnail_url: string | null;
  status: ProjectStatus;
  featured: boolean;
  display_order: number;
};

export type Skill = {
  id: string;
  title: string;
  summary: string;
  technologies: string[];
  relatedProjects: string[];
};

export type Experience = {
  id: string;
  title: string;
  period: string;
  summary: string;
  highlights: string[];
};

export const fallbackProjects: Project[] = [
  {
    id: "spa-express",
    slug: "spa-express-cambucas",
    title: "SPA Express Cambucás",
    summary: "Plataforma completa de agendamento e gestão para um SPA familiar.",
    problem:
      "Organizar serviços, profissionais e horários sem permitir conflitos na agenda.",
    solution:
      "Desenvolvi autenticação, agendas individuais, disponibilidade, histórico, diferentes níveis de acesso e gerenciamento de serviços.",
    role: "Desenvolvedor Full Stack",
    technologies: ["Next.js", "TypeScript", "Supabase"],
    features: ["Agendamentos", "Controle de acesso", "Histórico", "Dark mode"],
    live_url: "https://spaexpresscambucas.com.br/",
    repository_url: null,
    thumbnail_url: null,
    status: "published",
    featured: true,
    display_order: 1,
  },
  {
    id: "nb-arquitetura",
    slug: "nb-arquitetura",
    title: "NB Arquitetura",
    summary: "Portfólio responsivo para apresentação de projetos arquitetônicos.",
    problem:
      "Criar uma presença digital elegante que valorizasse imagens, trajetória e contato profissional.",
    solution:
      "Construí uma experiência responsiva com galerias, lightbox, SEO, sitemap e integração direta com WhatsApp.",
    role: "Desenvolvedor Full Stack",
    technologies: ["Next.js", "React", "TypeScript"],
    features: ["Galerias", "Lightbox", "SEO", "Responsividade"],
    live_url: null,
    repository_url: "https://github.com/BraidoLuis",
    thumbnail_url: null,
    status: "published",
    featured: true,
    display_order: 2,
  },
  {
    id: "transformacao",
    slug: "projeto-transformacao",
    title: "Projeto Transformação",
    summary: "Plataforma para um projeto de jiu-jitsu do IPRJ.",
    problem:
      "Coordenar uma entrega real com pagamentos e trabalho colaborativo de uma equipe de seis pessoas.",
    solution:
      "Atuei como gestor e desenvolvedor, organizando o time e a construção da aplicação com integração de pagamentos.",
    role: "Gestor de projeto e desenvolvedor",
    technologies: ["Next.js", "Stripe", "TypeScript"],
    features: ["Gestão de equipe", "Pagamentos", "Aplicação web"],
    live_url: null,
    repository_url: "https://github.com/BraidoLuis",
    thumbnail_url: null,
    status: "published",
    featured: true,
    display_order: 3,
  },
  {
    id: "fribolos",
    slug: "fribolos",
    title: "FriBolos",
    summary: "Sistema web para gerenciamento completo de uma confeitaria.",
    problem:
      "Centralizar catálogo, pedidos, orçamentos, pagamentos e administração da confeitaria.",
    solution:
      "Desenvolvi áreas separadas para clientes e administradores com autenticação e integrações externas.",
    role: "Desenvolvedor Full Stack",
    technologies: ["React", "TypeScript", "Supabase", "Stripe"],
    features: ["Catálogo", "Pedidos", "Orçamentos", "Pagamentos"],
    live_url: null,
    repository_url: "https://github.com/BraidoLuis/FriBolos",
    thumbnail_url: null,
    status: "published",
    featured: true,
    display_order: 4,
  },
];

export const skills: Skill[] = [
  {
    id: "frontend",
    title: "Desenvolvimento Front-end",
    summary:
      "Criação de interfaces responsivas, acessíveis e integradas a aplicações completas.",
    technologies: ["React", "Next.js", "TypeScript", "Tailwind CSS", "Motion"],
    relatedProjects: ["SPA Express", "NB Arquitetura", "FriBolos"],
  },
  {
    id: "backend",
    title: "Back-end e APIs",
    summary:
      "Modelagem de regras de negócio, autenticação, validações e integrações com serviços externos.",
    technologies: ["Node.js", "Supabase", "REST", "Stripe"],
    relatedProjects: ["SPA Express", "Projeto Transformação", "FriBolos"],
  },
  {
    id: "database",
    title: "Bancos de dados",
    summary:
      "Estruturação de dados relacionais, consultas, políticas de acesso e persistência.",
    technologies: ["PostgreSQL", "SQL", "Supabase", "RLS"],
    relatedProjects: ["SPA Express", "FriBolos"],
  },
  {
    id: "security",
    title: "Segurança da Informação",
    summary:
      "Estudos voltados a redes, proteção de aplicações, análise de vulnerabilidades e segurança ofensiva.",
    technologies: ["Linux", "Redes", "OWASP", "Pentest"],
    relatedProjects: ["Estudos e laboratórios pessoais"],
  },
];

export const experiences: Experience[] = [
  {
    id: "uerj",
    title: "Engenharia da Computação — UERJ",
    period: "Em andamento",
    summary:
      "Formação que une desenvolvimento de software, sistemas, eletrônica e resolução estruturada de problemas.",
    highlights: ["Engenharia de Software", "Sistemas embarcados", "Computação aplicada"],
  },
  {
    id: "ic",
    title: "Iniciação Científica",
    period: "Experiência acadêmica",
    summary:
      "Trabalho com Python, análise, automação e avaliação criteriosa de resultados.",
    highlights: ["Python", "Documentação técnica", "Análise de evidências"],
  },
  {
    id: "serra-junior",
    title: "Serra Júnior",
    period: "Experiência profissional",
    summary:
      "Participação em projetos reais, relacionamento com equipe e desenvolvimento de soluções para clientes.",
    highlights: ["Trabalho em equipe", "Projetos reais", "Comunicação"],
  },
  {
    id: "transformacao-exp",
    title: "Gestão do Projeto Transformação",
    period: "Equipe de 6 pessoas",
    summary:
      "Gestão e desenvolvimento de uma plataforma em Next.js com Stripe para um projeto de jiu-jitsu do IPRJ.",
    highlights: ["Liderança", "Next.js", "Stripe", "Organização de entregas"],
  },
  {
    id: "vambora",
    title: "Vambora Coders",
    period: "Atual",
    summary:
      "Desenvolvimento contínuo em projetos web e e-commerce, com foco em entregas práticas.",
    highlights: ["Shopify", "JavaScript", "Integrações", "Experiência profissional"],
  },
];
