0. Introdução

0.1 Cabeçalho
• Data: 01/09/2026
• Versão: v1.4
• Status: Catálogo final após a conclusão da retirada controlada E22.3; nenhum service/MCP operacional permanece

0.2 Função do documento
Registrar a camada `services` do LP Factory 10 como referência oficial e amigável para humano para services implantáveis, MCPs, endpoints e infraestrutura reutilizável com identidade própria, sem expor segredos.

0.3 Relação com outros documentos
• docs/automations.md: automações operacionais, componentes consumidores, uso humano essencial e referências para services base quando houver dependência
• docs/platform-config.md: snapshot operacional das configurações de plataformas, endpoints, projetos externos, secrets por nome, variáveis e regras de redeploy usadas por services.
• docs/base-tecnica.md: guardrails, regras estruturais, checks de CI, segurança, workflows técnicos e topologia canônica do repositório
• docs/roadmap.md: evolução planejada, próximos casos, fases futuras e itens ainda não materializados como caso operacional

1. Catálogo de services

1.1 Estado atual da camada
• Nenhum service implantável ou MCP operacional está catalogado após a retirada repo-side da E22.3.4.
• O projeto Vercel `lpf-10-services` foi removido em 01/09/2026 após confirmação read-only de ausência de workload; não há configuração externa de service a manter.
• `automations/supabase-inspect` é automação GitHub read-only preservada e não é service/MCP.

2. Regras de fronteira desta camada
• `docs/services.md` registra services implantáveis, MCPs, endpoints, infraestrutura reutilizável com identidade própria e suas referências técnicas locais.
• `docs/automations.md` permanece responsável por automações operacionais e componentes consumidores.
• `docs/platform-config.md` permanece responsável pelo snapshot operacional de plataformas, endpoints, projetos externos, secrets por nome, variáveis e regras de redeploy.
• `docs/base-tecnica.md` permanece responsável por guardrails, checks, segurança e regras estruturais.
• `docs/roadmap.md` permanece responsável por evolução futura.

3. Observação de manutenção
• `docs/services.md` passa a ser a referência oficial e amigável para humano da camada `services`
• detalhes técnicos expandidos devem permanecer no README local de cada service
• novos services devem seguir o mesmo padrão documental: catálogo curto em `docs/services.md` + README técnico local no diretório do service
• quando um service compartilhado com o Core tiver deploy independente no mesmo repositório, registrar explicitamente a boundary operacional (projeto Vercel, Root Directory e regras de build) para evitar drift documental e builds desnecessários

99. Changelog
v1.3 (31/08/2026)
• retirado do catálogo operacional o `LPF Supabase Inspect MCP` e sua pendência `sample_rows`, preservando a configuração externa do projeto `lpf-10-services` somente como estado pendente da E22.3.5

v1.2 (27/05/2026)
• corrigidas referências antigas de `docs/automacoes.md` para `docs/automations.md`
• adicionada relação documental com `docs/platform-config.md`
• reforçada a fronteira entre services, automações, configurações operacionais e regras técnicas
v1.1 (15/04/2026)
• registrada a boundary operacional de deploy do `LPF Supabase Inspect MCP` no projeto Vercel `lpf-10-services`
• adicionadas as regras operacionais `Root Directory`, `Include files outside the root directory in the Build Step = OFF` e `Ignored Build Step` customizado
• atualizada a observação de manutenção para exigir boundary operacional explícita em novos services com deploy independente e repositório compartilhado
v1.0 (29/03/2026)
• criado `docs/services.md` como documento oficial da camada `services`
