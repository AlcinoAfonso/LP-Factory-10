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
    description: 'Consulta read-only da estrutura de taxons.',
    status: 'Disponível',
    scope: [
      'Consulta read-only da taxonomia',
      'Navegação por hierarquia',
      'Associações e aliases em leitura',
    ],
  },
  {
    title: 'Templates',
    href: '/admin/templates',
    description: 'Área prevista para consultar templates internos.',
    status: 'Em preparação',
    scope: [
      'Catálogo read-only de templates',
      'Relação com nichos e taxons',
      'Estado de preparação por template',
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
