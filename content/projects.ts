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

// Edite os projetos aqui. Somente itens com status "published" aparecem no portfólio.
// Capas locais ficam em public/projects; use caminhos como /projects/meu-projeto.webp.
export const projects: Project[] = [
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
