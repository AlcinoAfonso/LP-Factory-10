export type AdminDocCatalogItem = {
  id: string;
  title: string;
  path: `docs/${string}.md`;
  description: string;
};

export const adminDocsCatalog: AdminDocCatalogItem[] = [
  {
    id: 'roadmap',
    title: 'Roadmap',
    path: 'docs/roadmap.md',
    description: 'Estado final dos casos E*, escopos, dependencias e pendencias.',
  },
  {
    id: 'base-tecnica',
    title: 'Base tecnica',
    path: 'docs/base-tecnica.md',
    description: 'Contrato tecnico de runtime e implementacao segura.',
  },
  {
    id: 'schema',
    title: 'Schema',
    path: 'docs/schema.md',
    description: 'Contrato de banco, objetos e permissoes de DB.',
  },
  {
    id: 'design-system',
    title: 'Design system',
    path: 'docs/design-system.md',
    description: 'Contrato visual atual do produto.',
  },
  {
    id: 'lousa-debate-landing-pages',
    title: 'Lousa debate landing pages',
    path: 'docs/lousa-debate-landing-pages.md',
    description: 'Lousa de debate sobre a formacao estrategica das landing pages.',
  },
  {
    id: 'gestor-codex',
    title: 'Gestor Codex',
    path: 'docs/gestor-codex.md',
    description: 'Estado de adocao, decisoes praticas e recursos aprovados.',
  },
  {
    id: 'gestor-automations',
    title: 'Gestor Automations',
    path: 'docs/gestor-automations.md',
    description: 'Painel de avaliação de automações, agentes, services e tecnologias adjacentes.',
  },
  {
    id: 'automations',
    title: 'Automations',
    path: 'docs/automations.md',
    description: 'Catalogo de automacoes operacionais.',
  },
  {
    id: 'prompt-estrategista',
    title: 'Prompt estrategista',
    path: 'docs/prompt-estrategista.md',
    description: 'Fluxo estrategista para briefing e execucao.',
  },
  {
    id: 'prompt-executor',
    title: 'Prompt executor',
    path: 'docs/prompt-executor.md',
    description: 'Contrato operacional do executor Codex.',
  },
  {
    id: 'template-briefing-codex',
    title: 'Template briefing Codex',
    path: 'docs/template-briefing-codex.md',
    description: 'Template de briefing para execucoes no Codex.',
  },
  {
    id: 'template-prompts',
    title: 'Template prompts',
    path: 'docs/template-prompts.md',
    description: 'Template base para prompts do projeto.',
  },
];

export function getAdminDocById(id: string | undefined) {
  if (!id) {
    return adminDocsCatalog[0];
  }

  return adminDocsCatalog.find((doc) => doc.id === id) ?? null;
}
