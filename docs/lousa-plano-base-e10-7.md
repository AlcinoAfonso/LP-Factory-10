23/06/2026 — Lousa base flexível E10.7
docs/lousa-plano-base-e10-7.md
Fontes: chat, PR #435, PR #440, docs/roadmap.md, docs/base-tecnica.md, docs/schema.md, docs/platform-config.md, docs/automations.md, docs/supa-up.md, docs/prod-up.md, docs/vercel-up.md

1. Estado atual
* Fases 1 a 6 implementadas.
* Fase 6 validada em Preview e mergeada.
* Fluxo mínimo validado: elegível → draft → published → consumo público.
* /admin/templates agora é lista limpa.
* Página operacional por taxon criada.
* /a/[account] consome apenas published válido.
* Draft e archived fora do runtime público.
* IA fora do runtime público.
* Próxima ação: consolidar contrato commercial_activation antes da edição manual.

2. Decisões fixas
* commercial_activation é template universal por canal.
* Template não é duplicado por taxon.
* Taxon define artifact e consumo final.
* Operador decide gerar draft.
* Draft não é gerado automaticamente.
* Operador não prepara composição.
* Composição técnica não é composição estratégica.
* IA gera copy apenas dentro do contrato aprovado.
* IA não escolhe seções, ordem, layout ou cores.
* Published só é consumido se validar o contrato do renderer.
* Fallback generic-v1 preservado.

3. Contrato commercial_activation
* Página comercial tem estrutura fixa no MVP.
* Estrutura atual registrada:
  * Hero.
  * Benefícios.
  * Serviços.
  * Planos.
  * Diferenciais.
  * Como funciona.
  * FAQ.
  * CTA final.
* Contrato precisa ser auditado antes da edição manual.
* Auditoria deve verificar template, composição, prompt, content_json, renderer, preview/admin e /a/[account].
* Objetivo da auditoria: garantir que todos obedecem à mesma estrutura fixa.
* Não decidir nesta PR se as 8 seções serão reduzidas.
* Não alterar template, prompt, renderer ou schema nesta PR.
* Consolidação do contrato vem antes da edição manual.

4. Fases
4.1 Fase 1 — Base técnica
* Status: implementada.
* Resultado: base inicial de templates, composições, artifacts e contratos mínimos.
4.2 Fase 2 — Geração administrativa de draft
* Status: implementada.
* Resultado: draft commercial_activation gerado no admin/server-side.
4.3 Fase 3 — Operação administrativa mínima
* Status: implementada.
* Resultado: gerar, regenerar, visualizar e publicar.
4.4 Fase 4 — Consumo em /a/[account]
* Status: implementada.
* Resultado: published válido consumido no runtime público com fallback generic-v1.
4.5 Fase 5 — Lista flexível de taxons elegíveis
* Status: implementada e validada em Production.
* Resultado: taxons elegíveis aparecem sem hardcode do piloto e draft só é gerado por ação do operador.
4.6 Fase 6 — Admin comercial enxuto
* Status: implementada, validada em Preview e mergeada.
* Resultado: /admin/templates virou lista limpa e operação foi movida para página por taxon.
4.7 Fase 7 — Auditoria e consolidação do contrato commercial_activation
* Status: planejada.
* Objetivo: garantir contrato fixo entre template, composição, prompt, content_json, renderer, preview/admin e /a/[account].
* Observação: deve vir antes da edição manual.
4.8 Fase 8 — Edição manual de copy e gestão simples de versões
* Status: planejada.
* Objetivo: permitir ajuste humano de copy e gestão simples de versões depois do contrato fixo auditado.

5. Escopo negativo
* LP Builder.
* editor visual.
* edição manual antes da auditoria do contrato.
* IA assistida para edição.
* IA em runtime público.
* draft/archived no runtime público.
* geração automática de draft.
* hardcode por taxon, slug ou nome.
* duplicação de template por taxon.
* composição manual pelo operador.
* nova tabela sem decisão explícita.
* nova RPC sem blocker real.
* nova migration sem blocker real.
* novo grant/policy sem blocker real.
* flags.
* A/B test.
* cache novo.
* server-side tracking novo.
* navegação global multi-contas.
* reestruturação ampla de taxonomia.
* versões independentes por bloco.

6. Pendências/critério de próxima ação
* Pendência principal: executar Fase 7 — auditoria e consolidação do contrato commercial_activation.
* Critérios de entrada da próxima fase:
  * lousa simplificada;
  * contrato atual entendido;
  * arquivos reais identificados;
  * sem decisão de edição manual antes da auditoria.
* Critérios de parada:
  * se for necessário alterar schema;
  * se for necessário criar RPC;
  * se for necessário mudar runtime público;
  * se a auditoria mostrar divergência entre template, composição, prompt, content_json ou renderer;
  * se a redução de seções da página comercial exigir decisão estratégica.
* Critérios de review:
  * verificar se a lousa ficou com apenas 6 seções principais;
  * verificar se não virou relatório histórico;
  * verificar se Fase 7 agora é contrato commercial_activation;
  * verificar se edição manual ficou depois, como Fase 8;
  * verificar se nenhuma decisão técnica nova foi implementada indevidamente;
  * verificar se a ordem das próximas ações ficou clara.
