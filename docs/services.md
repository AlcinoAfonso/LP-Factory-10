0. Introdução

0.1 Cabeçalho
• Data: 15/04/2026
• Versão: v1.1
• Status: Atualizado com boundary operacional de deploy do service MCP

0.2 Função do documento
Registrar a camada `services` do LP Factory 10 como referência oficial e amigável para humano para services implantáveis, MCPs, endpoints e infraestrutura reutilizável com identidade própria, sem expor segredos.

0.3 Relação com outros documentos
• docs/automacoes.md: automações operacionais, componentes consumidores, uso humano essencial e referências para services base quando houver dependência
• docs/base-tecnica.md: guardrails, regras estruturais, checks de CI, segurança, workflows técnicos e topologia canônica do repositório
• docs/roadmap.md: evolução planejada, próximos casos, fases futuras e itens ainda não materializados como caso operacional

1. Catálogo de services

1.1 LPF Supabase Inspect MCP

1.1.1 Objetivo
• fornecer camada universal de acesso read-only ao Supabase via MCP
• permitir reutilização por múltiplos agentes, workflows e componentes consumidores

1.1.2 Como acessar
• pela documentação técnica local em `services/mcp-supabase-inspect/README.md`
• pelo endpoint canônico quando a integração exigir consumo da MCP remota autenticada

1.1.3 Onde acessar
• Projeto Vercel: `lpf-10-services`
• Endpoint canônico: `https://lpf-10-services.vercel.app/api/mcp`

1.1.3.1 Boundary operacional de deploy
• Projeto Vercel: `lpf-10-services`
• `Root Directory`: `services/mcp-supabase-inspect`
• `Include files outside the root directory in the Build Step`: OFF
• `Ignored Build Step`: customizado para reduzir builds desnecessários quando não houver mudança no service

1.1.4 Status
• implementado em serviço dedicado
• validação fim a fim depende de operação/cutover externo por ambiente

1.1.5 Referências / dependências
• implementação canônica: `services/mcp-supabase-inspect/api/mcp.js`
• README técnico local: `services/mcp-supabase-inspect/README.md`
• docs/base-tecnica.md
• consumidor atual: `docs/automacoes.md` — `3.3 Supabase Inspect Agente`

1.2 Pendência operacional vinculada

1.2.1 sample_rows
• Objetivo: permitir amostragem real de linhas em modo read-only
• Contexto: falha por permissão com RLS (`auth.uid()`)
• Escopo: ajustar permissões mínimas no banco, validar retorno real e manter segurança read-only
• Status: pendente em caso separado
• Observação: a pendência não invalida a MCP como service base reutilizável; bloqueia apenas a completude funcional da tool

2. Regras de fronteira desta camada
• `docs/services.md` registra services implantáveis, MCPs, endpoints, infraestrutura reutilizável com identidade própria e suas referências técnicas locais
• `docs/automacoes.md` permanece responsável por automações operacionais e componentes consumidores
• `docs/base-tecnica.md` permanece responsável por guardrails, checks, segurança e regras estruturais
• `docs/roadmap.md` permanece responsável por evolução futura

3. Observação de manutenção
• `docs/services.md` passa a ser a referência oficial e amigável para humano da camada `services`
• detalhes técnicos expandidos devem permanecer no README local de cada service
• novos services devem seguir o mesmo padrão documental: catálogo curto em `docs/services.md` + README técnico local no diretório do service
• quando um service compartilhado com o Core tiver deploy independente no mesmo repositório, registrar explicitamente a boundary operacional (projeto Vercel, Root Directory e regras de build) para evitar drift documental e builds desnecessários

99. Changelog
v1.1 (15/04/2026)
• registrada a boundary operacional de deploy do `LPF Supabase Inspect MCP` no projeto Vercel `lpf-10-services`
• adicionadas as regras operacionais `Root Directory`, `Include files outside the root directory in the Build Step = OFF` e `Ignored Build Step` customizado
• atualizada a observação de manutenção para exigir boundary operacional explícita em novos services com deploy independente e repositório compartilhado
v1.0 (29/03/2026)
• criado `docs/services.md` como documento oficial da camada `services`
