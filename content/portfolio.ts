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
