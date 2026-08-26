export type AdminAreaStatus = 'Disponível' | 'Em preparação';

export type AdminArea = {
  title: string;
  href: string;
  description: string;
  status: AdminAreaStatus;
  scope: string[];
};

export const adminAreas: AdminArea[] = [
  {
    title: 'Contas',
    href: '/admin/contas',
    description: 'Leitura e acompanhamento read-only de contas reais.',
    status: 'Disponível',
    scope: [
      'Lista read-only de contas reais',
      'Filtros operacionais',
      'Detalhes básicos por conta',
    ],
  },
  {
    title: 'Resoluções de nicho',
    href: '/admin/resolucoes-de-nicho',
    description: 'Acompanhamento read-only das resoluções de nicho.',
    status: 'Disponível',
    scope: [
      'Histórico read-only de resoluções',
      'Sinais de confiança',
      'Vínculos com contas e taxonomia',
    ],
  },
  {
    title: 'Taxonomia',
    href: '/admin/taxonomia',
    description: 'Cadastro, diagnóstico e navegação da estrutura de taxons.',
    status: 'Disponível',
    scope: [
      'Consulta e cadastro da taxonomia',
      'Navegação por hierarquia',
      'Gestão de aliases e diagnóstico operacional',
    ],
  },
  {
    title: 'Páginas comerciais',
    href: '/admin/templates',
    description: 'Operação administrativa mínima de drafts comerciais.',
    status: 'Disponível',
    scope: [
      'Geração e regeneração de drafts comerciais',
      'Preview administrativo com renderer existente',
      'Publicação transacional via RPC',
    ],
  },
  {
    title: 'Estrutura da LP',
    href: '/admin/estrutura-lp',
    description: 'Consulta read-only dos contratos estruturais de landing pages.',
    status: 'Disponível',
    scope: [
      'Parâmetros raiz e critérios visuais',
      'Entradas resolvidas por taxon e plano',
    ],
  },
  {
    title: 'Configuração OpenAI',
    href: '/admin/workloads-openai',
    description: 'Catálogo e lifecycle operacional dos workloads OpenAI.',
    status: 'Disponível',
    scope: [
      'Catálogo e disponibilidade para novas candidatas',
      'Configuração ativa, candidata e validação técnica',
      'Ativação humana, rollback e histórico',
      'Referência operacional do Supabase Inspect',
    ],
  },
  {
    title: 'Testes OpenAI',
    href: '/admin/testes-openai',
    description: 'Comparações experimentais dos workloads OpenAI.',
    status: 'Disponível',
    scope: [
      'Caso e configurações comparáveis',
      'Avaliação cega e revelação de eficiência',
      'Sem candidata, ativação ou alteração de Production',
    ],
  },
  {
    title: 'Auditoria',
    href: '/admin/auditoria',
    description: 'Área prevista para leitura de eventos administrativos.',
    status: 'Em preparação',
    scope: [
      'Eventos read-only',
      'Filtros por área e período',
      'Rastreamento operacional sem mutações',
    ],
  },
  {
    title: 'Documentação',
    href: '/admin/documentacao',
    description: 'Leitura read-only dos documentos operacionais do projeto.',
    status: 'Disponível',
    scope: [
      'Lista de documentos permitidos por whitelist',
      'Leitura read-only do conteúdo',
      'Sem edição, banco ou integração com GitHub API',
    ],
  },
];

export function getAdminArea(href: string) {
  return adminAreas.find((area) => area.href === href);
}
