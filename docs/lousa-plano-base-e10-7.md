23/06/2026 — Lousa base E10.7
docs/lousa-plano-base-e10-7.md
Fontes: chat, PR #435, PR #440, docs/roadmap.md, docs/base-tecnica.md, docs/schema.md, docs/platform-config.md, docs/supa-up.md, docs/prod-up.md, docs/vercel-up.md

1. Estado e decisões fixas
* Fases 1 a 6 implementadas.
* Fase 6 validada em Preview e mergeada.
* Fluxo mínimo validado: elegível → draft → published → consumo público.
* /admin/templates é lista limpa.
* Página operacional por taxon criada.
* Próxima ação: auditar contrato commercial_activation antes da edição manual.
* commercial_activation é template universal por canal.
* Template não é duplicado por taxon.
* Taxon define artifact e consumo final.
* Operador decide gerar draft.
* Draft não é gerado automaticamente.
* Operador não prepara composição.
* Composição técnica não é composição estratégica.
* IA gera copy apenas dentro do contrato aprovado.
* IA não escolhe seções, ordem, layout ou cores.
* /a/[account] consome apenas published válido.
* Draft e archived ficam fora do runtime público.
* IA fica fora do runtime público.
* Fallback generic-v1 preservado.

2. Contrato commercial_activation
* Página comercial tem estrutura fixa no MVP.
* Estrutura atual: Hero, Benefícios, Serviços, Planos, Diferenciais, Como funciona, FAQ e CTA final.
* Contrato deve ser auditado antes da edição manual.
* Auditoria deve verificar template, composição, prompt, content_json, renderer, preview/admin e /a/[account].
* Objetivo da auditoria: garantir que todos obedecem à mesma estrutura fixa.
* Redução das 8 seções da página comercial exige decisão estratégica própria.
* Não decidir redução de seções na Fase 7 sem decisão explícita.
* Não alterar template, prompt, renderer, schema ou runtime público na Fase 7 sem decisão explícita.

3. Fases e próxima ação
3.1 Fase 1 — Base técnica
* Status: implementada.
* Resultado: base inicial de templates, composições, artifacts e contratos mínimos.
3.2 Fase 2 — Geração administrativa de draft
* Status: implementada.
* Resultado: draft commercial_activation gerado no admin/server-side.
3.3 Fase 3 — Operação administrativa mínima
* Status: implementada.
* Resultado: gerar, regenerar, visualizar e publicar.
3.4 Fase 4 — Consumo em /a/[account]
* Status: implementada.
* Resultado: published válido consumido no runtime público com fallback generic-v1.
3.5 Fase 5 — Lista flexível de taxons elegíveis
* Status: implementada e validada em Production.
* Resultado: taxons elegíveis aparecem sem hardcode do piloto e draft só é gerado por ação do operador.
3.6 Fase 6 — Admin comercial enxuto
* Status: implementada, validada em Preview e mergeada.
* Resultado: /admin/templates virou lista limpa e operação foi movida para página por taxon.
3.7 Fase 7 — Consolidação determinística do template comercial
* Status: planejada.
* Objetivo: garantir que o commercial_activation use sempre a mesma estrutura comercial fixa, com seções, ordem, obrigatoriedade e limites de geração definidos, para qualquer nicho elegível.
* Estrutura fixa do MVP: Hero, Benefícios, Serviços, Planos, Diferenciais, Como funciona, FAQ e CTA final.
* Ordem fixa e seções obrigatórias no template comercial do MVP.
* IA não decide seções, ordem, layout ou cores; apenas preenche copy dentro da estrutura definida.
* Prompt, content_json, renderer, preview/admin e /a/[account] devem obedecer ao mesmo contrato comercial.
* Divergência entre essas partes é critério de parada.
* Contratos internos transversais de módulos/seções pertencem à E18, se houver caso próprio futuro.
* Regra: deve vir antes da edição manual.
3.8 Fase 8 — Edição manual de copy e gestão simples de versões
* Status: planejada.
* Objetivo: permitir ajuste humano de copy e gestão simples de versões depois do contrato fixo auditado.

4. Escopo negativo e critérios de parada
* Não fazer: LP Builder, editor visual, IA assistida, IA em runtime público, draft/archived no runtime público, geração automática de draft, hardcode por taxon, duplicação de template por taxon ou composição manual pelo operador.
* Não fazer sem decisão explícita: nova tabela, nova RPC, migration, grant, policy, flags, A/B test, cache novo, server-side tracking novo, navegação global multi-contas, reestruturação ampla de taxonomia ou versões independentes por bloco.
* Parar se a próxima fase exigir schema, RPC, mudança no runtime público ou alteração de contrato fora da auditoria.
* Parar se template, composição, prompt, content_json, renderer, preview/admin ou /a/[account] divergirem entre si.
* Parar se a redução de seções da página comercial exigir decisão estratégica.
* Review deve confirmar: lousa compacta com 4 seções principais, sem histórico longo, Fase 7 como consolidação determinística do template comercial e Fase 8 como edição manual.
