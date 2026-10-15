export type ProjectStatus = "draft" | "published" | "archived";
export type ProjectCategory = "Aplicações web" | "Sites institucionais" | "Visão computacional" | "Acadêmicos e estudos" | "Jogos";
export type ProjectTesting = {
  suites: { label: string; count: number; kind: "tests" | "scripts" }[];
  description: string;
  verified_on: string;
};
export type Project = {
  id: string;
  slug: string;
  title: string;
  category: ProjectCategory;
  summary: string;
  problem: string;
  solution: string;
  role: string;
  technologies: string[];
  features: string[];
  backend: string[];
  integrations: string[];
  deployment: string | null;
  development_stage: string;
  limitations: string[];
  testing: ProjectTesting;
  live_url: string | null;
  repository_url: string | null;
  thumbnail_url: string | null;
  status: ProjectStatus;
  featured: boolean;
  display_order: number;
};

const verifiedOn = "2026-10-14";
const noSuite: ProjectTesting = {
  suites: [],
  description: "Não foi identificada uma suíte de testes automatizados no código consultado.",
  verified_on: verifiedOn,
};

function project(repo: string, data: Pick<Project, "id" | "title" | "summary" | "problem" | "solution" | "role" | "technologies" | "features" | "category" | "development_stage" | "display_order"> & Partial<Project>): Project {
  return {
    slug: data.id, status: "published", featured: false,
    backend: ["Execução local, sem API, banco de dados ou autenticação de aplicação."],
    integrations: [], deployment: null, limitations: [], testing: noSuite,
    live_url: null, thumbnail_url: null,
    repository_url: `https://github.com/BraidoLuis/${repo}`,
    ...data,
  };
}

// Fontes, revisões e método de contagem: docs/AUDITORIA-CONTEUDO.md.
// status controla a exibição; development_stage descreve a maturidade real.
export const projects: Project[] = [
  project("SPA-express-cambucas", {
    id: "spa-express", title: "SPA Express Cambucás", category: "Aplicações web",
    summary: "Agendamento e gestão de SPA com portais de clientes, profissionais e administração.",
    problem: "Organizar serviços, disponibilidade e pagamentos sem conflitos de horários, com acesso adequado a cada pessoa.",
    solution: "Catálogo pesquisável, reservas, cancelamentos, agendas profissionais e painel administrativo, integrados ao Supabase por serviços e operações SQL.",
    role: "Desenvolvimento Full Stack: interfaces, regras de agenda, acesso, integrações e verificações automatizadas.",
    technologies: ["Next.js", "React", "TypeScript", "Tailwind CSS", "Supabase", "PostgreSQL", "Resend"],
    features: ["Catálogo com busca e filtros", "Disponibilidade semanal, exceções e bloqueios", "Reservas e cancelamentos com regras configuráveis", "Agenda e atendimentos externos das profissionais", "Confirmação manual de pagamentos e histórico de auditoria", "Notificações internas e preferências por usuário", "Tema claro/escuro, páginas legais e SEO"],
    backend: ["Supabase Auth com perfis client, professional e admin; proteção de sessão e políticas RLS.", "PostgreSQL com prevenção de sobreposição e RPCs para mutações de agendamento e pagamento.", "Storage para mídias; rotas Next.js para administração, notificações e cron."],
    integrations: ["Resend para confirmações, cancelamentos e lembretes por e-mail, com fila e tratamento de falhas.", "Links WhatsApp para contato e encaixes. WhatsApp Business Cloud API é citada no README, sem remetente identificado no código atual.", "Vercel Cron para lembretes e limpeza de mídias vencidas."],
    deployment: "Aplicação publicada na Vercel; cron configurado no repositório.",
    development_stage: "Aplicação integrada",
    limitations: ["O envio de notificações em produção depende da configuração dos provedores e não foi exercitado nesta revisão.", "Pagamentos são confirmados manualmente; não há gateway de cobrança identificado."],
    testing: { suites: [{ label: "Vitest · regras e utilitários", count: 158, kind: "tests" }, { label: "Vitest · serviços com dependências simuladas", count: 203, kind: "tests" }, { label: "Vitest · rotas com dependências simuladas", count: 125, kind: "tests" }, { label: "Playwright · interface e navegação", count: 30, kind: "tests" }], description: "516 casos definidos: 486 Vitest e 30 Playwright, incluindo parametrizações. Há ainda um roteiro separado de regressão SQL/concorrência PostgreSQL, fora desta contagem. Os mocks não comprovam integração real com provedores. Contagem de definições, sem afirmar aprovação ou cobertura.", verified_on: verifiedOn },
    live_url: "https://spaexpresscambucas.com.br/", thumbnail_url: "/projects/spa-express.webp", featured: true, display_order: 1,
  }),
  project("FriBolos", {
    id: "fribolos", title: "FriBolos", category: "Aplicações web",
    summary: "Plataforma acadêmica de confeitaria com catálogo, encomendas, orçamentos e gestão administrativa.",
    problem: "Centralizar pedidos personalizados, etapas de produção e relacionamento com clientes de uma confeitaria.",
    solution: "Página pública, portal do cliente e painel administrativo com catálogo, carrinho, personalização, entrega ou retirada, orçamentos e acompanhamento dos pedidos.",
    role: "Desenvolvimento Full Stack no projeto acadêmico: interfaces, autenticação, pedidos, integrações e testes.",
    technologies: ["React", "TypeScript", "Vinext", "Vite", "Tailwind CSS", "Supabase", "PostgreSQL", "Vitest"],
    features: ["Catálogo pesquisável, carrinho e opções de produto", "Entrega/retirada, data e horário", "Orçamentos com aprovação ou recusa de propostas", "Cancelamentos, reagendamentos e etapas de produção", "Gestão de produtos, estoque, clientes e indicadores", "Avaliações de compras e notificações em tempo real", "Recuperação de senha, perfil, endereço e páginas legais"],
    backend: ["Supabase Auth, PostgreSQL, RPCs e acesso por papel de cliente ou administrador.", "Supabase Storage, URLs temporárias e Realtime para notificações.", "Chamadas a Edge Functions para checkout, pedidos administrativos, reembolso e cotação de entrega."],
    integrations: ["Stripe por Edge Functions: chamadas de checkout e reembolso identificadas no frontend.", "Confirmação por webhook descrita na documentação; o código das Edge Functions/webhook não está versionado neste repositório."],
    deployment: "Vercel com build Vite/Vinext e servidor Nitro. Há configuração Cloudflare, sem comprovação de deploy nesse provedor.",
    development_stage: "Projeto acadêmico em evolução",
    limitations: ["A configuração e execução das Edge Functions externas não foram verificadas.", "Testes E2E com Playwright aparecem como evolução planejada, fora da suíte atual."],
    testing: { suites: [{ label: "Vitest · unitários de utilitários e validações", count: 106, kind: "tests" }, { label: "Vitest · componentes com integrações simuladas", count: 182, kind: "tests" }, { label: "Vitest · hooks com integrações simuladas", count: 146, kind: "tests" }, { label: "node:test · fumaça do HTML do build de produção", count: 1, kind: "tests" }], description: "435 casos definidos: 434 Vitest e 1 de fumaça do build, para autenticação, catálogo, carrinho, pagamentos, pedidos, orçamentos, notificações, estoque e configurações. Inclui parametrizações e registros por loops. Mocks não comprovam integração real. Sem afirmar aprovação ou cobertura.", verified_on: verifiedOn },
    live_url: "https://fri-bolos.vercel.app/", thumbnail_url: "/projects/fribolos.webp", featured: true, display_order: 2,
  }),
  project("whatsapp-dashboard", {
    id: "meus-gastos", title: "Meus Gastos via WhatsApp", category: "Aplicações web",
    summary: "Bot financeiro para duas pessoas, com registros por WhatsApp e dashboard responsivo em SQLite.",
    problem: "Registrar gastos, aportes, salários e faturas de forma prática, separados por pessoa e mês.",
    solution: "Comandos no grupo autorizado viram registros em centavos. O dashboard oferece visão individual ou conjunta, metas, gráficos, histórico, edição e exportação CSV.",
    role: "Desenvolvimento do bot, parser de comandos, persistência, API HTTP, interface e testes.",
    technologies: ["Node.js 24", "JavaScript", "Baileys", "SQLite", "HTML", "CSS", "Motion", "esbuild", "Playwright"],
    features: ["Gastos, aportes e reservas por comandos", "Salário e fatura por pessoa/mês sem acumular duplicatas", "Visões individuais e do casal, metas e gráficos SVG", "Histórico com busca, filtros e correção de lançamentos", "CSV, temas claro/escuro e movimento reduzido", "Deduplicação e processamento restrito a participantes autorizados", "Backup SQLite com conferência de integridade"],
    backend: ["Servidor HTTP nativo Node.js e SQLite via node:sqlite, com WAL e migrações.", "Grupo e participantes permitidos no bot; proteção de Host, Origin e CSRF na API.", "Dashboard local com origem HTTPS Tailscale opcional e token de acesso, conforme configuração."],
    integrations: ["WhatsApp Web via Baileys e pareamento por QR Code.", "Acesso remoto opcional por Tailscale; endereços privados não são divulgados."],
    deployment: "Execução local documentada; instruções Oracle Cloud/Tailscale disponíveis, sem confirmação de instância publicada.",
    development_stage: "Aplicação de uso local",
    limitations: ["Não consulta bancos nem cartões. Saldo estimado usa apenas registros cadastrados; a fatura é informativa.", "Baileys usa WhatsApp Web, sem integração com a API oficial WhatsApp Business."],
    testing: { suites: [{ label: "node:test · bot, SQLite, API e backup", count: 27, kind: "tests" }, { label: "Playwright · dashboard e responsividade", count: 15, kind: "tests" }], description: "42 casos definidos: 14 do bot, 12 de dashboard/API, 1 de backup e 15 de interface. Os quatro casos de largura gerados por loop contam individualmente; loops de asserções dentro de um caso não criam novos testes. Sem afirmar aprovação ou cobertura.", verified_on: verifiedOn },
    featured: true, display_order: 3,
  }),
  project("NB-Arquitetura", {
    id: "nb-arquitetura", title: "NB Arquitetura e Interiores", category: "Sites institucionais",
    summary: "Portfólio de arquitetura com galerias, lightbox e administração de projetos e imagens.",
    problem: "Valorizar projetos de arquitetura e permitir que a profissional atualize seu próprio portfólio.",
    solution: "Site editorial com categorias, páginas por slug, destaques, galerias e contato, conectado a um painel de projetos e imagens.",
    role: "Desenvolvimento Full Stack: apresentação pública, painel de conteúdo, integração Supabase, SEO e testes.",
    technologies: ["Next.js", "React", "TypeScript", "CSS", "Tailwind CSS", "Supabase", "PostgreSQL", "Yet Another React Lightbox"],
    features: ["Categorias Interiores, Comercial, Externos e Design", "Páginas de projetos e galerias com zoom/lightbox", "Sobre, currículo, contato, SEO e sitemap", "Cadastro, edição, publicação e ocultação de projetos", "Upload, reordenação, capa e enquadramento de imagens", "Destaques, projetos em andamento e limpeza do Storage"],
    backend: ["Supabase PostgreSQL e Storage para projetos e imagens.", "Supabase Auth/SSR para sessão administrativa; proteção de rotas e políticas RLS."],
    integrations: ["Contato por WhatsApp, e-mail e redes sociais.", "Supabase para autenticação e gerenciamento de conteúdo."],
    deployment: "Aplicação publicada na Vercel.", development_stage: "Aplicação integrada",
    testing: { suites: [{ label: "Vitest · utilitários e validação de imagens", count: 10, kind: "tests" }, { label: "Playwright · navegação e proteção administrativa", count: 10, kind: "tests" }], description: "20 casos definidos para slugs, Storage, limites de imagens, categorias, contato, galerias, lightbox e acesso administrativo. O loop de categorias dentro de um caso conta como um teste. Sem afirmar aprovação ou cobertura.", verified_on: verifiedOn },
    live_url: "https://nb-arquitetura.vercel.app/", thumbnail_url: "/projects/nb-arquitetura.webp", featured: true, display_order: 4,
  }),
  project("ProjetoTransformacaoBJJ", {
    id: "transformacao", title: "Projeto Transformação BJJ", category: "Sites institucionais",
    summary: "Site de projeto social de jiu-jitsu com apresentação institucional e doação via Stripe.",
    problem: "Divulgar a iniciativa e parceiros e criar um caminho digital para apoiar suas atividades.",
    solution: "Páginas institucionais e formulário de doação com Stripe Elements e rota de criação de PaymentIntent em reais.",
    role: "Gestor e desenvolvedor em equipe de seis pessoas, conforme registro anterior do portfólio; organização de entregas e implementação web.",
    technologies: ["Next.js", "React", "TypeScript", "Tailwind CSS", "Stripe", "Swiper"],
    features: ["Apresentação do instituto e atividades", "Divulgação de parceiros", "Seleção de valor e tipo de contribuição", "Stripe Elements e confirmação de pagamento", "Páginas de resultado, sucesso e cancelamento"],
    backend: ["Rota Next.js POST /api/create-payment-intent com SDK Stripe.", "Sem banco, autenticação de usuários ou painel administrativo identificados."],
    integrations: ["Stripe PaymentIntent e PaymentElement para doações avulsas."],
    deployment: "URL Vercel informada nos metadados do repositório.", development_stage: "Integração parcial",
    limitations: ["A interface oferece contribuição mensal, mas /api/create-subscription não está presente no código consultado.", "Não há webhook versionado para confirmação persistente; o funcionamento financeiro em produção não foi verificado."],
    live_url: "https://projeto-transformacao-bjj-rust.vercel.app/", thumbnail_url: "/projects/transformacao-bjj.webp", featured: true, display_order: 5,
  }),
  project("Site_SPE", {
    id: "site-spe", title: "Site SPE / SAPE UERJ", category: "Sites institucionais",
    summary: "Site de evento acadêmico sobre energia, com programação interativa e patrocinadores.",
    problem: "Reunir informações do evento, programação e parceiros em uma apresentação web.",
    solution: "Interface React com rotas para início e patrocinadores, contagem regressiva e cartões interativos da programação.",
    role: "Desenvolvimento da interface e organização das seções de conteúdo do evento.",
    technologies: ["React", "TypeScript", "Vite", "Tailwind CSS", "React Router"],
    features: ["Informações do evento", "Contagem regressiva", "Programação com cartões que viram", "Página de patrocinadores", "Navegação por rotas e seções"],
    backend: ["Conteúdo estático; arquivos de serviços de eventos e patrocinadores estão vazios."],
    development_stage: "Site estático em desenvolvimento",
    limitations: ["O botão de inscrição não possui ação implementada no código consultado.", "Não foi confirmada uma aplicação publicada."],
    thumbnail_url: "/projects/site-spe.webp", display_order: 6,
  }),
  project("orcamento", {
    id: "orcamento", title: "Site Orçamento da Serra Jr", category: "Sites institucionais",
    summary: "Protótipo de navegação para serviços de Computação e Mecânica da Serra Jr.",
    problem: "Orientar visitantes às áreas de serviço da empresa júnior.",
    solution: "Página inicial com identidade da Serra Jr e rotas por hash para Computação e Mecânica.",
    role: "Contribuição de frontend em repositório derivado (fork), com navegação e estrutura inicial.",
    technologies: ["React", "TypeScript", "Vite", "Tailwind CSS", "React Router"],
    features: ["Página de entrada com marca e fundo", "Escolha da área de serviço", "Rotas /computacao e /mecanica via HashRouter"],
    backend: ["Frontend estático, sem API, banco ou autenticação identificados."],
    development_stage: "Protótipo inicial",
    limitations: ["Computação exibe apenas o título e Mecânica está vazia. Não há formulário, cálculo ou envio de orçamento implementado."],
    thumbnail_url: "/projects/orcamento.webp", display_order: 7,
  }),
  project("Portfolio-pixel", {
    id: "portfolio-pixel", title: "Portfólio Pixel", category: "Jogos",
    summary: "Portfólio em forma de jogo: explore mapas, interaja com baús e descubra projetos e trajetória.",
    problem: "Apresentar projetos e experiência em uma exploração interativa com identidade própria.",
    solution: "Next.js com mundo Phaser, colisões, personagens, casa, baús e áudio, com conteúdo local e descobertas persistidas no navegador.",
    role: "Desenvolvimento da aplicação, integração do jogo, conteúdo, interações, persistência e verificações.",
    technologies: ["Next.js", "React", "TypeScript", "Phaser", "Tailwind CSS", "Motion", "Zustand"],
    features: ["Mapas interior/exterior, movimentação e colisões", "Baús de projetos, habilidades, experiências e certificações", "TV com apresentação, formação e contatos", "Áudio, personagens e atividades no mundo", "Controles de teclado e celular", "Preferências e progresso em localStorage", "Filtros e detalhes de projetos com navegação responsiva"],
    backend: ["Conteúdo local selecionado durante o build, sem API de conteúdo, banco ou autenticação.", "Zustand e localStorage para preferências e progresso."],
    integrations: ["Links de GitHub, LinkedIn e aplicações dos projetos."],
    deployment: "Aplicação publicada na Vercel; build Next.js configurado em vercel.json.",
    development_stage: "Portfólio interativo",
    testing: { suites: [{ label: "Scripts Node.js de verificação", count: 12, kind: "scripts" }], description: "12 scripts check-*.mjs distintos nos grupos de mundo (6), casa (3), personagem (2) e links (1). Verificam mapas, colisões, encontros, atividades, conquistas, animações, transparência e links. Scripts não equivalem a casos unitários. Lint, tipos e build são comandos adicionais.", verified_on: verifiedOn },
    live_url: "https://portfolio-pixel-theta.vercel.app/", thumbnail_url: "/game/exterior-world.png", featured: true, display_order: 8,
  }),
  project("teste-front-vmb", {
    id: "teste-front-vmb", title: "Vambora Store — desafio Front-end", category: "Aplicações web",
    summary: "Vitrine de e-commerce com catálogo externo e carrinho persistido no navegador.",
    problem: "Construir uma loja responsiva consumindo produtos de uma API e mantendo o carrinho entre visitas.",
    solution: "Landing page React com coleções, carrosséis, produtos e carrinho lateral gerenciado por Context e hooks.",
    role: "Implementação do desafio Front-end: componentes, consumo de API e estado do carrinho.",
    technologies: ["React", "JavaScript", "Vite", "Tailwind CSS", "Swiper", "Sonner"],
    features: ["Catálogo por API", "Coleções e carrosséis", "Carrinho lateral com gestão de itens", "Persistência em localStorage", "Estados de carregamento e erro"],
    backend: ["Sem backend próprio ou autenticação; carrinho no navegador."],
    integrations: ["Fake Store API via fetch para carregar produtos."],
    development_stage: "Desafio de interface", limitations: ["Não há checkout ou pagamento real identificado."], display_order: 9,
  }),
  project("principios-engenharia-software", {
    id: "principios-es", title: "Sistema de consultas — Princípios de Engenharia de Software", category: "Acadêmicos e estudos",
    summary: "Protótipo de consultas médicas com papéis de paciente, médico, secretário e administração.",
    problem: "Modelar casos de uso de uma clínica separando interface, controle, serviços e repositórios.",
    solution: "Telas e controladores para horários, marcação e visualização de consultas, pagamentos demonstrativos e avaliação de atendimentos.",
    role: "Desenvolvimento acadêmico de interfaces, controladores e documentação de casos de uso.",
    technologies: ["Next.js", "React", "TypeScript", "Tailwind CSS", "Radix UI"],
    features: ["Painéis por papel", "Disponibilidade e marcação de consultas", "Histórico e avaliações", "Pagamentos/notificações demonstrativos", "Documentação de casos de uso"],
    backend: ["Serviços e repositórios em memória; parte dos dados usa localStorage.", "Autenticação com usuário simulado; papéis de interface não são autorização de servidor."],
    development_stage: "Protótipo acadêmico", limitations: ["Login e pagamentos são simulados; não há backend clínico de produção ou gateway identificado."], display_order: 10,
  }),
  project("TCC-YOLO", {
    id: "tcc-yolo", title: "TCC — detecção e leitura de placas com YOLO", category: "Visão computacional",
    summary: "Protótipo Python para detectar, rastrear e ler placas em vídeo com YOLO e OCR.",
    problem: "Identificar objetos em uma região do vídeo, evitar contagens repetidas e extrair texto de placas.",
    solution: "Pipeline OpenCV/Ultralytics com tracking, região poligonal, recortes, leitura PaddleOCR e visualização de contagem.",
    role: "Desenvolvimento do protótipo de visão computacional e rotina de persistência MySQL.",
    technologies: ["Python", "Ultralytics YOLO", "OpenCV", "PaddleOCR", "NumPy", "cvzone", "MySQL"],
    features: ["Processamento de vídeo", "Tracking com IDs", "Região de interesse e contagem", "Recorte e OCR", "Rotina MySQL para placa, data e hora"],
    backend: ["Script de persistência via mysql.connector; não é um servidor HTTP."],
    integrations: ["Modelo e vídeo locais; leitura PaddleOCR."], deployment: "Execução local em Python.",
    development_stage: "Protótipo de pesquisa", limitations: ["A chamada de gravação no MySQL está comentada em main.py.", "Modelo e vídeo referenciados não constam da árvore consultada; não foram verificadas métricas de precisão."], display_order: 11,
  }),
  project("estudos-yolo", {
    id: "estudos-yolo", title: "Estudos YOLO — detecção, blur e mapas de calor", category: "Visão computacional",
    summary: "Notebooks de detecção em webcam, anonimização visual, tracking e distâncias.",
    problem: "Explorar modelos de detecção em imagens e vídeos em ambiente de aprendizado.",
    solution: "Experimentos Jupyter/Colab com YOLO, webcam, blur, mapas de calor e distâncias, incluindo exemplo de DeepSORT/Ikomia.",
    role: "Estudos e experimentação com notebooks próprios e exemplos de terceiros, cuja autoria está indicada nos arquivos.",
    technologies: ["Python", "Ultralytics YOLO", "OpenCV", "NumPy", "Jupyter", "Google Colab", "Pillow"],
    features: ["Detecção em imagens/webcam", "Blur de objetos", "Mapas de calor", "Distâncias e tracking", "Exemplo DeepSORT/Ikomia"],
    integrations: ["Modelos pré-treinados Ultralytics; captura da câmera no Colab; exemplo Ikomia."],
    development_stage: "Estudos e experimentos", limitations: ["Depende de câmera, arquivos e ambiente de notebook; sem métricas de produção verificadas."], display_order: 12,
  }),
  project("visao_computacional", {
    id: "visao-computacional", title: "Laboratórios de Visão Computacional", category: "Visão computacional",
    summary: "Quatro notebooks de imagens, cores, contornos, filtros e morfologia.",
    problem: "Compreender a representação e transformação de imagens em visão computacional.",
    solution: "Exercícios de matrizes, canais de cor, contornos, limiarização, blur, erosão e dilatação com comparação visual.",
    role: "Implementação de exercícios e análise visual nos laboratórios da disciplina.",
    technologies: ["Python", "Jupyter", "OpenCV", "NumPy", "Matplotlib", "Pillow"],
    features: ["Matrizes e canais RGB", "Contornos e limiarização", "Filtros de média, mediana e Gaussiano", "Erosão e dilatação", "Comparação visual"],
    development_stage: "Laboratórios acadêmicos", limitations: ["Exercícios dependem das imagens das aulas."], display_order: 13,
  }),
  project("RPG-Using-Python", {
    id: "rpg-python", title: "RPG em Python", category: "Jogos",
    summary: "Jogo de terminal com cinco atos, batalhas, inventário e progressão de vida.",
    problem: "Aplicar lógica, funções e módulos a uma experiência de jogo com escolhas.",
    solution: "Programa principal coordena menus e cinco módulos de batalha, acompanha vitórias, inventário e vida e permite reiniciar após derrotas.",
    role: "Implementação da narrativa, menus, regras de batalha e organização modular.",
    technologies: ["Python"], features: ["Cinco atos/batalhas", "Escolhas no terminal", "Inventário", "Progressão de vida", "Reinício após derrota"],
    deployment: "Execução local em Python.", development_stage: "Jogo de terminal", display_order: 14,
  }),
  project("Trab-PAA", {
    id: "paa", title: "Análise de algoritmos — Quick Sort e Insertion Sort", category: "Acadêmicos e estudos",
    summary: "Comparação de tempos de ordenação para diferentes tamanhos e tipos de vetor.",
    problem: "Observar como ordem inicial e tamanho da entrada afetam algoritmos de ordenação.",
    solution: "Notebook implementa Quick Sort e Insertion Sort, gera entradas crescentes, decrescentes e aleatórias e mede tempos com gráficos comparativos.",
    role: "Implementação dos algoritmos, preparação do experimento e documentação.",
    technologies: ["Python", "Jupyter", "Matplotlib", "random", "time"],
    features: ["Quick Sort", "Insertion Sort", "Três tipos de entrada", "Medição de tempo", "Gráficos comparativos"],
    development_stage: "Experimento acadêmico", limitations: ["Medições experimentais não são testes unitários nem garantias de desempenho em outros ambientes."], display_order: 15,
  }),
  project("Trab_Calculo_Numerico", {
    id: "calculo-numerico", title: "Cálculo Numérico — interpolação e integração", category: "Acadêmicos e estudos",
    summary: "Menu de interpolação polinomial e integração numérica pela regra do trapézio.",
    problem: "Aproximar funções a partir de pontos e estimar integrais por métodos numéricos.",
    solution: "Entrada de pontos, interpolação por sistema linear, Lagrange e Newton e regras simples/composta do trapézio.",
    role: "Desenvolvimento acadêmico em dupla dos métodos numéricos.",
    technologies: ["Python", "NumPy", "Jupyter"], features: ["Entrada de pontos", "Sistema linear", "Lagrange", "Newton", "Trapézio simples/composto"],
    development_stage: "Trabalho acadêmico", display_order: 16,
  }),
  project("Trab-topicos-especiais-em-linguagens-de-programacao", {
    id: "topicos-lp", title: "Tópicos de Linguagens — heurísticas VND e VNS", category: "Acadêmicos e estudos",
    summary: "Três notebooks de otimização com soluções iniciais, vizinhanças e experimentos repetidos.",
    problem: "Explorar soluções de menor custo em instâncias de alocação e redes.",
    solution: "Função de custo, movimentos de vizinhança, Variable Neighborhood Descent e Variable Neighborhood Search.",
    role: "Implementação de heurísticas e organização dos experimentos acadêmicos.",
    technologies: ["Python", "Jupyter", "random", "copy"], features: ["Solução inicial", "Avaliação de custo", "Duas vizinhanças", "VND e VNS", "Execuções repetidas"],
    development_stage: "Experimentos acadêmicos", limitations: ["Instâncias e parâmetros experimentais não demonstram garantia de ótimo global."], display_order: 17,
  }),
  project("Listas-Prog", {
    id: "listas-prog", title: "Listas de Programação em C", category: "Acadêmicos e estudos",
    summary: "57 arquivos de exercícios distribuídos em três listas de programação.",
    problem: "Praticar fundamentos de programação em problemas pequenos e independentes.",
    solution: "Programas C por questão, com entrada/saída e estruturas de controle.",
    role: "Resolução e implementação dos exercícios de programação.",
    technologies: ["C"], features: ["Três listas", "Entrada/saída no terminal", "Operações e condições", "Estruturas de repetição"],
    development_stage: "Exercícios acadêmicos", display_order: 18,
  }),
  project("Lista-Prolog", {
    id: "lista-prolog", title: "Lista de Programação Lógica em Prolog", category: "Acadêmicos e estudos",
    summary: "Seis exercícios de fatos, regras, relações e consultas lógicas.",
    problem: "Representar conhecimento e responder perguntas por inferência lógica.",
    solution: "Bases de fatos e regras em Prolog com perguntas e respostas comentadas.",
    role: "Resolução em dupla dos exercícios, conforme identificação dos arquivos.",
    technologies: ["Prolog"], features: ["Seis questões", "Fatos e regras", "Relações e inferência", "Exemplos de consulta"],
    development_stage: "Exercícios acadêmicos", limitations: ["Respostas comentadas são exemplos, não uma suíte automatizada."], display_order: 19,
  }),
  project("Treinamento-Serra-JR", {
    id: "treinamento-serra", title: "Treinamento Front-end — Serra Jr", category: "Acadêmicos e estudos",
    summary: "Exercícios de HTML/CSS/JavaScript e versões de telas em React.",
    problem: "Evoluir de páginas estáticas para interfaces com componentes reutilizáveis.",
    solution: "Coleção de telas de treinamento, com versões estáticas e projetos React de cabeçalho, rodapé e cards.",
    role: "Implementação das telas e exercícios de desenvolvimento web.",
    technologies: ["HTML", "CSS", "JavaScript", "React", "Create React App"], features: ["Telas estáticas", "Scripts de interação", "Interfaces React", "Header, Footer e Card"],
    development_stage: "Treinamento e estudos", limitations: ["O comando de teste do template React não comprova uma suíte autoral; não há casos identificados."], display_order: 20,
  }),
  project("Trab-Robotica", {
    id: "robotica", title: "Robótica na indústria", category: "Acadêmicos e estudos",
    summary: "Apresentação acadêmica em HTML sobre aplicações de robótica industrial.",
    problem: "Organizar e comunicar conceitos e aplicações de robótica na indústria.",
    solution: "Material de apresentação em slides HTML versionado para a disciplina.",
    role: "Preparação do material acadêmico de apresentação.",
    technologies: ["HTML", "CSS", "JavaScript"], features: ["Slides em HTML", "Conteúdo de robótica industrial"],
    development_stage: "Material acadêmico", limitations: ["Material didático; não implementa controle de robôs."], display_order: 21,
  }),
  project("ByLearnJornadaPhytonFaixaPreta", {
    id: "bylearn", title: "Jornada Python — ByLearn", category: "Acadêmicos e estudos",
    summary: "Exemplos introdutórios de condições, funções e cálculo de média em Python.",
    problem: "Aprender lógica de programação por exercícios introdutórios.",
    solution: "Trechos no README demonstram comparação de nomes, condições, funções e cálculo de média.",
    role: "Resolução dos exercícios introdutórios nos estudos de Python.",
    technologies: ["Python"], features: ["Condições if/else", "Comparação de valores", "Funções e laços", "Exemplo de média"],
    backend: ["Exemplos documentados no README, sem aplicação independente versionada."],
    development_stage: "Estudo introdutório", limitations: ["O exemplo de média retorna dentro do laço, limitando o processamento ao primeiro elemento."], display_order: 22,
  }),
  project("lp-namoro", {
    id: "lp-namoro", title: "Landing page pessoal", category: "Sites institucionais",
    summary: "Página temática com galeria, mídia e interações em HTML, CSS e JavaScript.",
    problem: "Criar uma apresentação pessoal com conteúdo visual e interações leves.",
    solution: "Página estática com layout próprio, imagens, vídeo e scripts de interação.",
    role: "Desenvolvimento da página e dos efeitos visuais.",
    technologies: ["HTML", "CSS", "JavaScript"], features: ["Galeria", "Vídeo", "Interações e efeitos"],
    backend: ["Página estática, sem API, banco ou autenticação."],
    deployment: "URL Vercel informada nos metadados do repositório.", development_stage: "Página estática",
    live_url: "https://lp-namoro.vercel.app/", display_order: 23,
  }),
  project("teste-webhook", {
    id: "shopify-back-in-stock", title: "Integração Shopify — avisos de reposição", category: "Aplicações web",
    summary: "Protótipo Node.js e Express que conecta interesse em produtos, reposição de estoque e e-mail marketing na Shopify.",
    problem: "Organizar o interesse por produtos indisponíveis e relacionar alterações de estoque a fluxos de aviso de reposição.",
    solution: "API REST para registrar interessados, consultar clientes e variantes pela Shopify Admin GraphQL API, receber eventos de estoque e disponibilizar os registros de reposição para um fluxo externo.",
    role: "Desenvolvimento da integração backend, endpoints REST, consultas e mutação GraphQL e processamento de webhooks de estoque.",
    technologies: ["Node.js", "JavaScript", "Express", "GraphQL", "Shopify Admin API", "CORS", "dotenv"],
    features: ["Registro de interesse por SKU e variante", "Consulta de clientes pela Shopify Admin GraphQL API", "Atualização do consentimento de e-mail marketing na Shopify", "Recebimento de webhooks de estoque", "Associação do item de estoque à variante do produto", "Organização dos interessados quando há estoque disponível", "Consulta e limpeza da lista de registros de reposição"],
    backend: ["Servidor Express com endpoints REST em JavaScript e chamadas HTTP à Shopify Admin GraphQL API.", "Listas de interessados e registros de reposição mantidas em memória; não há banco de dados versionado.", "Configuração da loja e credencial de acesso por variáveis de ambiente; valores e dados internos não são divulgados."],
    integrations: ["Shopify Admin GraphQL API para clientes, variantes e consentimento de e-mail marketing.", "Webhooks de estoque Shopify para preparar registros destinados ao fluxo de aviso de reposição."],
    development_stage: "Protótipo de integração",
    limitations: ["As listas não persistem após reiniciar o servidor.", "O código prepara registros e atualiza consentimento; o envio efetivo de e-mails não está implementado na revisão consultada.", "Não foram confirmados deploy público nem operação em produção."],
    repository_url: null, live_url: null, thumbnail_url: null, display_order: 24,
  }),
];
