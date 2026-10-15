export type Skill = {
  id: string;
  title: string;
  summary: string;
  technologies: string[];
  examples: string[];
  // IDs do catálogo local, nunca títulos ou nomes de repositórios.
  relatedProjects: string[];
  relatedCertifications: string[];
  studying?: boolean;
};

export type Experience = {
  id: string;
  title: string;
  institution: string;
  kind: "professional" | "academic" | "education";
  period: string;
  summary: string;
  highlights: string[];
  relatedProjects: string[];
};

export type Certification = {
  id: string;
  title: string;
  issuer: string;
  summary: string;
  kind: "certification" | "course" | "in-progress";
  // Datas com precisão de mês: YYYY-MM, sem atribuir um dia de emissão.
  issued_on?: string | null;
  expires_on?: string | null;
  credential_id?: string | null;
  credential_url?: string | null;
  competencies: string[];
};

export const certifications: Certification[] = [
  {
    id: "cisco-networking-basics",
    title: "Networking Basics",
    issuer: "Cisco",
    kind: "course",
    summary: "Curso concluído sobre redes de computadores e IPv4.",
    issued_on: "2026-10",
    expires_on: null,
    credential_id: null,
    credential_url: null,
    competencies: ["Redes de computadores", "IPv4"],
  },
  {
    id: "cisco-introducao-ciberseguranca",
    title: "Introduction to Cybersecurity",
    issuer: "Cisco",
    kind: "course",
    summary: "Curso concluído de introdução à cibersegurança.",
    issued_on: "2026-09",
    expires_on: null,
    credential_id: null,
    credential_url: null,
    competencies: ["Cibersegurança"],
  },
];

export const skills: Skill[] = [
  {
    id: "frontend",
    title: "Desenvolvimento Front-end",
    summary: "Construção de interfaces responsivas, componentes reutilizáveis e navegação entre páginas e estados da aplicação.",
    technologies: ["JavaScript", "TypeScript", "React", "Next.js", "HTML", "CSS", "Tailwind CSS", "Vite", "React Router", "Vinext"],
    examples: ["Catálogos, formulários e portais de acesso nos projetos web.", "Rotas de evento no SPE/SAPE, galerias no NB Arquitetura e carrinho no desafio Vambora Store.", "Evolução de telas estáticas para componentes React no treinamento Serra Jr."],
    relatedProjects: ["spa-express", "nb-arquitetura", "site-spe", "orcamento", "teste-front-vmb", "treinamento-serra", "principios-es"],
    relatedCertifications: [],
  },
  {
    id: "backend",
    title: "Backend e integrações",
    summary: "Implementação de regras de negócio, APIs e comunicação com serviços de pagamentos e notificações.",
    technologies: ["Node.js", "JavaScript", "Express", "APIs REST", "GraphQL", "Webhooks", "Supabase", "Stripe", "Resend", "Baileys"],
    examples: ["REST, consultas GraphQL e eventos de estoque no protótipo de integração Shopify.", "PaymentIntent para doações avulsas no BJJ e chamadas de checkout/reembolso no FriBolos.", "Fila e envio de e-mails com Resend no SPA; bot WhatsApp e servidor HTTP no Meus Gastos."],
    relatedProjects: ["shopify-back-in-stock", "spa-express", "fribolos", "meus-gastos", "transformacao"],
    relatedCertifications: [],
  },
  {
    id: "database",
    title: "Dados e persistência",
    summary: "Modelagem relacional, consultas, migrações e políticas de acesso para manter os dados consistentes e separados por usuário.",
    technologies: ["SQL", "PostgreSQL", "SQLite", "Supabase", "Migrações", "RLS"],
    examples: ["Relacionamentos, regras de agenda e operações SQL/RPC no SPA.", "Pedidos, produtos e políticas por papel no FriBolos; projetos e imagens no NB Arquitetura.", "SQLite com WAL, migrações incrementais e backup no Meus Gastos."],
    relatedProjects: ["spa-express", "fribolos", "meus-gastos", "nb-arquitetura"],
    relatedCertifications: [],
  },
  {
    id: "quality",
    title: "Qualidade, testes e depuração",
    summary: "Verificação de regras, componentes e fluxos de interface, com investigação de bugs, validação das entregas e tratamento de falhas.",
    technologies: ["Vitest", "Playwright", "node:test", "React Testing Library", "ESLint", "TypeScript"],
    examples: ["Testes de regras, serviços e rotas no SPA; componentes e hooks com dependências simuladas no FriBolos.", "Navegação e responsividade com Playwright no NB Arquitetura e Meus Gastos.", "Scripts Node.js para mapas, colisões, animações e links no Portfólio Pixel; lint, tipos e build como verificações adicionais."],
    relatedProjects: ["spa-express", "fribolos", "nb-arquitetura", "meus-gastos", "portfolio-pixel"],
    relatedCertifications: [],
  },
  {
    id: "delivery",
    title: "Versionamento e publicação",
    summary: "Versionamento de código e configuração de builds e publicação das aplicações com hospedagem confirmada.",
    technologies: ["Git", "GitHub", "Vercel", "npm", "Next.js", "Vite"],
    examples: ["Histórico de código e organização dos projetos em repositórios Git/GitHub.", "Builds e aplicações publicadas na Vercel, incluindo Portfólio Pixel, NB Arquitetura e FriBolos."],
    relatedProjects: ["portfolio-pixel", "nb-arquitetura", "fribolos", "transformacao", "lp-namoro"],
    relatedCertifications: [],
  },
  {
    id: "ecommerce",
    title: "E-commerce e plataformas de conteúdo",
    summary: "Desenvolvimento e manutenção de lojas Shopify, participação em projetos WordPress e integração com serviços externos.",
    technologies: ["Shopify", "Liquid", "WordPress", "JavaScript", "HTML", "CSS", "APIs REST", "GraphQL"],
    examples: ["Temas e funcionalidades responsivas com Liquid, JavaScript, HTML e CSS na Vambora Coders.", "Participação em projetos React e WordPress na Serra Jr Engenharia.", "Protótipo de reposição Shopify e experiências de catálogo/carrinho no desafio Vambora Store e FriBolos."],
    relatedProjects: ["shopify-back-in-stock", "teste-front-vmb", "fribolos"],
    relatedCertifications: [],
  },
  {
    id: "interactive",
    title: "Jogos e interfaces interativas",
    summary: "Integração de cenários, interação, animação e estado persistente em experiências de exploração e interfaces visuais.",
    technologies: ["Phaser", "React", "TypeScript", "Motion", "Zustand", "Canvas", "localStorage"],
    examples: ["Mapas, colisões, movimento, baús e áudio no mundo Phaser do Portfólio Pixel.", "Painéis com navegação por teclado, transições e persistência de preferências e descobertas.", "Narrativa, inventário e batalhas no RPG Python; galeria e efeitos na landing page pessoal."],
    relatedProjects: ["portfolio-pixel", "rpg-python", "lp-namoro"],
    relatedCertifications: [],
  },
  {
    id: "applied-computing",
    title: "Computação aplicada e projetos acadêmicos",
    summary: "Aplicação de programação, experimentação e visualização a problemas de visão computacional, algoritmos e métodos numéricos.",
    technologies: ["Python", "NumPy", "OpenCV", "Ultralytics YOLO", "PaddleOCR", "Matplotlib", "Jupyter", "C", "Prolog"],
    examples: ["Detecção, tracking e OCR no protótipo TCC-YOLO; filtros, contornos e morfologia nos laboratórios de visão.", "Interpolação, integração numérica, comparação de algoritmos e heurísticas VND/VNS em notebooks.", "Exercícios em C e Prolog, estudos introdutórios Python e material acadêmico de robótica."],
    relatedProjects: ["tcc-yolo", "estudos-yolo", "visao-computacional", "calculo-numerico", "paa", "topicos-lp", "listas-prog", "lista-prolog", "bylearn", "robotica"],
    relatedCertifications: [],
  },
  {
    id: "security",
    title: "Segurança de aplicações",
    summary: "Autenticação, autorização, controle de acesso e validação de dados aplicados aos fluxos das aplicações.",
    technologies: ["Supabase Auth", "Autorização por papéis", "RLS", "Validação de dados", "CSRF"],
    examples: ["Sessões, perfis de cliente/profissional/admin e políticas RLS no SPA.", "Proteção da administração e das operações de conteúdo no NB Arquitetura.", "Isolamento por pessoa/grupo, validação de valores, Host, Origin e CSRF no Meus Gastos."],
    relatedProjects: ["spa-express", "fribolos", "nb-arquitetura", "meus-gastos"],
    relatedCertifications: ["cisco-introducao-ciberseguranca"],
  },
  {
    id: "professional-skills",
    title: "Gestão, liderança e colaboração",
    summary: "Organização de entregas, comunicação e trabalho em equipe, com experiência de gestão de projetos e acompanhamento de processos internos.",
    technologies: ["Gestão de projetos", "Liderança", "Organização de entregas", "Comunicação", "Trabalho em equipe"],
    examples: ["Coordenação de seis pessoas no Projeto Transformação BJJ para o IPRJ.", "Liderança de uma equipe de oito pessoas na Diretoria de Recursos Humanos da Serra Jr.", "Investigação de problemas, testes e validação das entregas no estágio de desenvolvimento."],
    relatedProjects: ["transformacao"],
    relatedCertifications: [],
  },
  {
    id: "network-foundations",
    title: "Fundamentos de redes e cibersegurança",
    summary: "Fundamentos associados aos cursos Cisco Networking Basics e Introduction to Cybersecurity, com as competências confirmadas nas certificações.",
    technologies: ["Redes de computadores", "IPv4", "Cibersegurança"],
    examples: ["Redes de computadores e IPv4 no Networking Basics, emitido em outubro de 2026.", "Cibersegurança no Introduction to Cybersecurity, emitido em setembro de 2026."],
    relatedProjects: [],
    relatedCertifications: ["cisco-networking-basics", "cisco-introducao-ciberseguranca"],
  },
  {
    id: "infrastructure-studies",
    title: "Infraestrutura e computação em nuvem",
    summary: "Estudo e aprofundamento de containers, sistemas operacionais e fundamentos de infraestrutura em nuvem.",
    technologies: ["Docker", "Linux", "Computação em nuvem"],
    examples: ["Estudo de containers com Docker, ambiente Linux e fundamentos de computação em nuvem."],
    relatedProjects: [],
    relatedCertifications: [],
    studying: true,
  },
];

export const experiences: Experience[] = [
  {
    id: "vambora",
    title: "Desenvolvedor de Software Estagiário",
    institution: "Vambora Coders",
    kind: "professional",
    period: "Setembro de 2025 — atual",
    summary: "Desenvolvimento e manutenção de e-commerces Shopify.",
    highlights: ["Implementação de funcionalidades responsivas com Liquid, JavaScript, HTML e CSS.", "Integrações com APIs, investigação e correção de bugs e tratamento de erros.", "Testes e validação das entregas."],
    relatedProjects: [],
  },
  {
    id: "freelance",
    title: "Desenvolvedor de Software",
    institution: "Freelance",
    kind: "professional",
    period: "Atuação atual",
    summary: "Desenvolvimento full stack de aplicações web.",
    highlights: ["Interfaces com React, Next.js e TypeScript e backend com Node.js.", "Regras de negócio, autenticação e integrações com serviços externos.", "PostgreSQL/Supabase e configuração de deploy."],
    relatedProjects: ["fribolos", "spa-express"],
  },
  {
    id: "serra-junior",
    title: "Assessor de Computação e Gestor de Projeto",
    institution: "Serra Jr Engenharia — UERJ",
    kind: "professional",
    period: "Janeiro de 2025 — 2026",
    summary: "Participação em projetos com React e WordPress e gestão do Projeto Transformação BJJ para o IPRJ.",
    highlights: ["Coordenação de uma equipe de seis pessoas no Projeto Transformação BJJ.", "Desenvolvimento da plataforma em Next.js e TypeScript com integração Stripe.", "Organização e acompanhamento das entregas em equipe."],
    relatedProjects: ["transformacao"],
  },
  {
    id: "serra-rh",
    title: "Diretor de Recursos Humanos",
    institution: "Serra Jr Engenharia — UERJ",
    kind: "professional",
    period: "Janeiro a dezembro de 2024",
    summary: "Liderança e acompanhamento dos processos internos da empresa júnior.",
    highlights: ["Liderança de uma equipe de oito pessoas.", "Acompanhamento dos processos internos da Serra Jr Engenharia."],
    relatedProjects: [],
  },
  {
    id: "ic",
    title: "Bolsista de Iniciação Científica",
    institution: "UERJ",
    kind: "academic",
    period: "Janeiro a dezembro de 2023",
    summary: "Pesquisa e implementação de correlação de imagens 2D em Python.",
    highlights: ["Implementação e experimentação com correlação de imagens 2D.", "Análise de dados e documentação técnica da pesquisa."],
    relatedProjects: [],
  },
  {
    id: "uerj",
    title: "Engenharia da Computação",
    institution: "UERJ",
    kind: "education",
    period: "Outubro de 2021 — em andamento",
    summary: "Formação acadêmica em Engenharia da Computação, iniciada em outubro de 2021.",
    highlights: ["Projetos acadêmicos de programação, algoritmos, métodos numéricos e visão computacional."],
    relatedProjects: ["calculo-numerico", "listas-prog", "lista-prolog", "paa"],
  },
];
