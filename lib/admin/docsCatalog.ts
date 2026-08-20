export type AdminDocCatalogItem = {
  id: string;
  title: string;
  path: string;
  description: string;
};

export const adminDocsCatalog: AdminDocCatalogItem[] = [
  {
    id: 'roadmap',
    title: 'Roadmap',
    path: 'docs/roadmap.md',
    description: 'Estado, escopo, dependencias e proximos marcos dos casos E*.',
  },
  {
    id: 'base-tecnica',
    title: 'Base Tecnica',
    path: 'docs/base-tecnica.md',
    description: 'Regras tecnicas de runtime e implementacao segura.',
  },
  {
    id: 'schema',
    title: 'Schema',
    path: 'docs/schema.md',
    description: 'Contrato do banco e inventario de objetos persistidos.',
  },
  {
    id: 'design-system',
    title: 'Design System',
    path: 'docs/design-system.md',
    description: 'Tokens, componentes e regras visuais do produto.',
  },
  {
    id: 'gestor-codex',
    title: 'Gestor Codex',
    path: 'docs/gestor-codex.md',
    description: 'Contrato de decisao e operacao do Gestor Codex.',
  },
  {
    id: 'gestor-automations',
    title: 'Gestor Automations',
    path: 'docs/gestor-automations.md',
    description: 'Contrato de decisao e operacao do Gestor de Automacoes.',
  },
  {
    id: 'gestor-seguranca',
    title: 'Gestor Seguranca',
    path: 'docs/gestor-seguranca.md',
    description: 'Contrato de decisao e operacao do Gestor de Seguranca.',
  },
  {
    id: 'automations',
    title: 'Automations',
    path: 'docs/automations.md',
    description: 'Catalogo e comportamento operacional das automacoes.',
  },
  {
    id: 'prompt-estrategista',
    title: 'Prompt Estrategista',
    path: 'docs/prompt-estrategista.md',
    description: 'Instrucoes do papel Estrategista.',
  },
  {
    id: 'prompt-executor',
    title: 'Prompt Executor',
    path: 'docs/prompt-executor.md',
    description: 'Instrucoes do papel Executor.',
  },
  {
    id: 'template-briefing-codex',
    title: 'Template Briefing Codex',
    path: 'docs/template-briefing-codex.md',
    description: 'Template para briefing de execucao no Codex.',
  },
  {
    id: 'template-prompts',
    title: 'Template Prompts',
    path: 'docs/template-prompts.md',
    description: 'Template padrao para prompts operacionais.',
  },
];

export function getAdminDocById(docId: string | undefined) {
  if (!docId) return adminDocsCatalog[0] ?? null;
  return adminDocsCatalog.find((doc) => doc.id === docId) ?? null;
}
