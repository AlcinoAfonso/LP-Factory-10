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
    title: 'Visao geral',
    href: '/admin',
    description: 'Entrada operacional do Admin Dashboard.',
    status: 'Disponível',
    scope: [
      'Organizar as áreas administrativas previstas',
      'Manter a separação do dashboard de contas',
      'Preparar a leitura operacional da plataforma',
    ],
  },
  {
    title: 'Contas',
    href: '/admin/contas',
    description: 'Area prevista para leitura e acompanhamento de contas.',
    status: 'Em preparação',
    scope: [
      'Lista read-only de contas reais',
      'Filtros operacionais',
      'Detalhes básicos por conta',
    ],
  },
  {
    title: 'Resoluções de nicho',
    href: '/admin/resolucoes-de-nicho',
    description: 'Área prevista para acompanhar resoluções de nicho.',
    status: 'Em preparação',
    scope: [
      'Histórico read-only de resoluções',
      'Sinais de confiança',
      'Vínculos com contas e taxonomia',
    ],
  },
  {
    title: 'Taxonomia',
    href: '/admin/taxonomia',
    description: 'Área prevista para consultar a estrutura de taxons.',
    status: 'Em preparação',
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
];

export function getAdminArea(href: string) {
  return adminAreas.find((area) => area.href === href);
}
