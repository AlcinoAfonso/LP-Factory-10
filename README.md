0. Introdução
0.1. Cabeçalho
• Documento: README — LP Factory 10 (MVP)
• Versão: 3 — 10/06/2026
• Data: 10/06/2026
• Escopo: visão geral do produto + documentos de referência + pendências estratégicas

1. Visão geral do produto
1.1. Classificação do negócio
• Segmento: Marketing digital.
• Nicho: plataforma SaaS de comunicação comercial por nicho.
• Ultranicho: não usar agora.

1.2. Descrição
• LP Factory 10 é um hub de comunicação comercial por nicho, com IA, automações e agentes controlados para aquisição, venda e nutrição de leads.
• O produto ajuda empresas a transformar pesquisa, dados e canais comerciais em comunicação pronta para venda.
• O produto entrega canais de comunicação como landing pages, Instagram, WhatsApp e e-mail.
• O dashboard prioriza automações internas, recursos de IA e agentes controlados para reduzir operação, validar processos e acelerar melhorias com revisão humana quando necessário.

1.3. Proposta de valor
• Oferecer comunicação comercial por nicho, com canais prontos para uso e acompanhamento contínuo de performance.
• Reduzir esforço, tempo e dependência para criar, medir, ajustar e otimizar comunicação comercial.
• Transformar pesquisa, dados de uso e conversão em ações práticas para venda e nutrição de leads.
• Ajudar o cliente a evoluir sua comunicação comercial com mais clareza, automação e direção.

1.4. Produto
1.4.1. Prático
• Templates por nicho e criação fácil.

1.4.2. Inteligente
• Recursos orientados por dados, tracking, recomendações e automações internas com IA, em fluxos simples, seguros e mensuráveis.
• Responses API para fluxos lineares de geração, revisão ou adaptação de conteúdo.
• Agents SDK TypeScript quando houver orquestração real e controlada com tools, decisões intermediárias, estado, aprovações ou handoffs.
• Sandbox Agent como camada de laboratório técnico para tarefas com arquivos, repositório, worktree, branch experimental, testes isolados ou geração de artefatos.

1.4.3. Dashboard
• Suporte para ajustes e testes guiados por dados.

1.4.4. Princípios de implementação
• O MVP prioriza simplicidade, não fragilidade.
• Runtime não pode depender de objetos ou comportamentos de banco ainda não aplicados e validados no ambiente alvo.
• A stack base do MVP permanece Next.js, Supabase e TypeScript.
• Automações e agentes devem ser introduzidos de forma incremental, começando por fluxos simples, seguros e mensuráveis.

1.5. Modelo de oferta
• Planos em camadas (Starter → Lite → Pro → Ultra), com capacidades escalando ao longo do tempo.

2. Documentos de referência
• docs/base-tecnica.md — regras técnicas de runtime, implementação segura, arquitetura, adapters, imports, SSR, observability e anti-regressão.
• docs/platform-config.md — configurações operacionais de plataformas, variáveis, secrets por nome, endpoints, URLs, redirects, SMTP, DNS e regras de redeploy.
• docs/schema.md — contrato de banco: tabelas, colunas, constraints, views, RPCs/functions, triggers, RLS, policies e grants.
• docs/roadmap.md — estado final dos casos E*, status, escopo, dependências, artefatos e pendências do produto.
• docs/design-system.md — padrões visuais, componentes UI, tokens, superfícies visuais e regras de uso do design system.
• docs/services.md — catálogo humano dos services implantáveis, MCPs, endpoints e infraestrutura reutilizável com identidade própria.
• docs/automations.md — camada de automações operacionais, integrações, componentes consumidores, credenciais por nome e aprendizados operacionais sem expor segredos.

3. Pendências estratégicas (em aberto)
3.1. Definições do MVP
• Starter mínimo • Tracking mínimo • Atendimento no MVP

3.2. Padrões de entrega
• Definir regra de “o que é uma LP entregue”, com checklist.
