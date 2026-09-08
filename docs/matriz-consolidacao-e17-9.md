# Matriz de consolidação — E17.9

Status: matriz reconciliada após a Passagem 1 independente e antes da Passagem 2 do Analista.

## 1. Objetos auditáveis

- Caso: E17.9 — QA transacional/determinístico, subseções E17.9.3 a E17.9.6.
- Fonte funcional: Debate 08, somente seção 4.1; seção 4.2/E17.10 não liberada.
- V1 funcional reconsolidada: commit `abe38ce3de0fc645e0813375590447bea4d76ef0`, blob `29281ecacb9ba3811ddfd03f0d0c91670eb628ec`.
- V2 inicial da Passagem 1: commit `469da488f1d50a990544ff253e61f1fca435d480`, blob `a8591922741a3ca9475e8765333c1a38d23761f0`.
- Delta obrigatório da Passagem 1: commit `ea9f59fc` sobre o mesmo path.
- Plano conceitual: N/A.
- Pareceres: Gestor Estrutural, Gestor de Updates e Gestor de Automações, todos sobre a V1 reconsolidada.
- Confrontos estruturais de modernização: N/A; Updates confirmou impacto estrutural baixo para todos os updates incorporados.
- Readiness I-01: zero consumidores institucionais autorizados de mailbox; secrets GitHub existem sem consumidor e o Gmail conectado não é a identidade institucional.
- Estado anterior reconciliado: a V1/V2 antigas e a matriz anterior foram superadas pela nova fonte; somente guardrails compatíveis do Executor permanecem aproveitáveis.

## 2. Achados e tratamentos

| ID | Origem | Classe | Achado ou decisão | Tratamento na V2 | Localização e evidência | Update, destino e confronto |
| --- | --- | --- | --- | --- | --- | --- |
| V1R2-01 | v1 | derivação técnica da v1 | O Executor seleciona autonomamente o QA transacional a partir do critério. | Manter o Executor como único decisor adaptativo e delegar operações objetivas ao boundary determinístico. | V1 2, 3 e 7; V2 10.2. | N/A |
| V1R2-02 | v1 | derivação técnica da v1 | Fixture compatível deve ser reutilizada; estado ausente permite criação ou reconfiguração institucional. | Catálogo tipado, seleção exata, lifecycle, estado anterior, pós-condição e restauração/estado estável. | V1 3, 5.2 e 8; V2 10.3. | N/A |
| V1R2-03 | v1 | derivação técnica da v1 | O catálogo cobre owner/admin/editor/viewer, autoridade de plataforma, cliente/não cliente e estados recorrentes. | Modelar as dimensões funcionais sem segredo e validar menor privilégio. | V1 5.2 e 8; V2 10.3 e 10.7.1. | N/A |
| V1R2-04 | v1 | derivação técnica da v1 | Credenciais devem ser operáveis sem solicitação rotineira a Alcino e sem exposição. | Referências opacas, `credential_resolution`, `session_isolation` e readiness fail-closed. | V1 5.3 e 8; V2 10.3 e 10.4. | N/A |
| V1R2-05 | v1 | derivação técnica da v1 | Fluxos centrais incluem signup/criação de usuário, conta, confirmação, convite, recuperação e verificação de papel/estado. | Mapear cada operação a adapter, mecanismo, privilégio, idempotência, pós-condição e estado final. | V1 6.3 e 8; V2 10.5 e 10.7.3. | N/A |
| V1R2-06 | v1 | derivação técnica da v1 | Falhas e correções devem ser repetíveis com evidência por tentativa. | Limite de tentativas, entradas controladas e duas rodadas representativas. | V1 7 e 8; V2 10.3 e 10.7.4. | N/A |
| V1R2-07 | v1 | derivação técnica da v1 | Evidência é sanitizada por critério, ator, ambiente, fixture, esperado, observado, resultado e bloqueio. | Projeção allowlisted, separação produto/operador e residência durável mínima. | V1 9; V2 10.3 e 10.8. | N/A |
| V1R2-08 | v1 | derivação técnica da v1 | Não criar agente, Validador Final, Niche Runtime Tests, workflow, job, service, rota, banco ou infraestrutura por inferência. | Boundary local on-demand, sem scheduler/endpoint/runtime e com condições de parada explícitas. | V1 5.1; V2 10.2 e 10.9. | N/A |
| V1R2-09 | v1 | derivação técnica da v1 | Navegação visual, UI/acessibilidade e criação/edição de Landing Pages não pertencem à E17.9. | Remover do plano técnico, roadmap e matriz; não detalhar/liberar E17.10. | V1 5.1 e 6; V2 10.2, 10.6 e 10.7.1. | N/A |
| EST-01 | invariante técnico | derivação técnica da v1 | Roadmap vigente ainda descreve o recorte anterior. | Reconciliar por ABC somente E17.9.3–E17.9.6 transacionais. | Parecer Estrutural GE-E17.9-01; V2 10.7.1. | N/A |
| EST-02 | invariante técnico | derivação técnica da v1 | A skill do Executor contém guardrails úteis, mas não catálogo, seleção ou repetibilidade. | Preservar guardrails e acrescentar apenas roteamento ao boundary focal. | GE-E17.9-02; V2 10.1, 10.2 e 10.7.1. | N/A |
| EST-03 | invariante técnico | derivação técnica da v1 | Falta boundary operacional determinístico vigente. | Criar `automations/qa-transacional/` sem importar pela UI ou restaurar legados. | GE-E17.9-03; PS-E17.9-01; V2 10.2 e 10.3. | N/A |
| EST-04 | invariante técnico | derivação técnica da v1 | Banco e código de produto existentes são suficientes como sistema sob teste. | Não alterar schema/produto; usar autoridades existentes e verificar objetos, RLS/policies e GRANTs. | GE-E17.9-04 e 06; V2 10.2 e 10.5. | N/A |
| EST-05 | invariante técnico | derivação técnica da v1 | Não há consumidor seguro e inequívoco da mailbox. | Readiness exige exatamente um consumidor; zero/ambiguidade bloqueiam sem criar substituto. | GE-E17.9-05; I-01; V2 10.4 e 10.7.2. | N/A |
| EST-06 | invariante técnico | derivação técnica da v1 | Catálogo/runner não devem invadir adapters do produto. | Adapters de QA ficam no subprojeto e apenas acionam mecanismos vigentes. | GE-E17.9-06; V2 10.2, 10.3 e 10.5. | N/A |
| AUT-01 | invariante técnico | derivação técnica da v1 | Decisão é agentic no Executor; autenticação, provisionamento, mailbox e verificações são determinísticos. | Fixar separação de responsabilidades sem IA adicional nas operações. | Parecer de Automações AUT-E17.9.3–6; PATCH-AUT-01; V2 10.2. | N/A |
| AUT-02 | invariante técnico | derivação técnica da v1 | Mutações exigem allowlist fechada e evidência sem segredo. | Fixar ambiente, conta, atores, ações e estado final antes de efeitos. | PATCH-AUT-02; V2 10.3, 10.4 e 10.8. | N/A |
| AUT-03 | invariante técnico | derivação técnica da v1 | Catálogo precisa falhar fechado diante de drift ou privilégio inadequado. | Correspondência exata, menor privilégio, idempotência e pós-condições. | AUT-E17.9.3/4; V2 10.3 e 10.5. | N/A |
| AUT-04 | invariante técnico | derivação técnica da v1 | Mailbox e credenciais não possuem boundary operacional aprovado. | Registrar `mailbox_consumer_missing`; não materializar adapter até readiness positivo. | Parecer de Automações, validação material; V2 10.1, 10.4 e 10.7.2. | N/A |
| AUT-05 | invariante técnico | derivação técnica da v1 | Resultado independente não deve ser perdido, mas critério obrigatório ausente impede checkpoint. | Preservar evidência parcial sem concluir E17.9.4/E17.9.5. | AUT-E17.9.5/6; V2 10.7.2 e 10.7.3. | N/A |
| UPD-supa-30 | update | modernização técnica justificada | Supabase Auth nativo reduz código próprio e transporte paralelo. | Reutilizar redirects, `/auth/confirm`, `inviteUserByEmail` e template vigente; bloquear capacidade não pronta. | Parecer Updates `supa#30`; V2 10.5 e 10.6. | Destino: aplicar agora; relação complementar; horizonte atual; impacto estrutural baixo, funcional nenhum; confronto N/A. |
| UPD-supa-59 | update | modernização técnica justificada | Supabase Plugin read-only permite confrontar estado hospedado sem script ad hoc. | Usar somente na investigação/readiness, nunca como runtime ou writer. | Parecer Updates `supa#59`; V2 10.6 e 10.7.2. | Destino: aplicar agora; relação complementar; horizonte atual; impacto estrutural baixo, funcional nenhum; confronto N/A. |
| UPD-github-14 | update | modernização técnica justificada | Evidência operacional expira e não pode ser única residência. | Persistir síntese sanitizada no PR, commit e documento competente. | Parecer Updates `github#14`; V2 10.3, 10.6 e 10.8. | Destino: aplicar agora; relação complementar; horizonte atual; impacto estrutural baixo, funcional nenhum; confronto N/A. |
| UPD-supa-5 | update | modernização técnica justificada | Unified Logs pode ajudar somente diante de falha real de Auth/Data API. | Manter diagnóstico condicional, sem Log Drain ou dependência obrigatória. | Parecer Updates `supa#5`; V2 10.6 e 10.8. | Destino: referência diagnóstica; relação complementar; horizonte condicional; impacto estrutural baixo, funcional nenhum; confronto N/A. |
| UPD-supa-63 | update | ampliação de escopo | `rlsautotest` exige banco descartável/pgtap sem mudança RLS no recorte. | Não implementar; preservar oportunidade condicionada a migration RLS ou defeitos repetidos. | Parecer Updates `supa#63`; V2 10.6. | Destino: oportunidade futura; relação complementar; horizonte futuro; confronto N/A. |
| UPD-supa-56 | update | ampliação de escopo | Push protection específica não cobre mailbox/credenciais institucionais genéricas. | Rejeitar para não alegar cobertura falsa. | Parecer Updates `supa#56`. | Destino: não aplicável; relação complementar; horizonte atual; confronto N/A. |
| UPD-supa-65 | update | ampliação de escopo | Passkeys alterariam Auth e UI do produto. | Rejeitar. | Parecer Updates `supa#65`. | Destino: não aplicável; relação substituta; horizonte futuro; confronto N/A. |
| UPD-supa-70 | update | ampliação de escopo | Monitor recorrente por agente é sobreposto ao runner transacional. | Rejeitar agente, harness e agendamento. | Parecer Updates `supa#70`. | Destino: não aplicável; relação sobreposta; horizonte futuro; confronto N/A. |
| UPD-vercel-1 | update | ampliação de escopo | Sandbox adicionaria infraestrutura sem resolver o consumidor de secrets. | Rejeitar. | Parecer Updates `vercel#1`. | Destino: não aplicável; relação sobreposta; horizonte condicional; confronto N/A. |
| UPD-vercel-15 | update | ampliação de escopo | Toolbar serve à navegação/inspeção visual excluída. | Rejeitar do recorte E17.9. | Parecer Updates `vercel#15`. | Destino: não aplicável; relação incompatível; horizonte condicional; confronto N/A. |
| UPD-vercel-23 | update | ampliação de escopo | Services criariam segundo workload proibido. | Rejeitar. | Parecer Updates `vercel#23`. | Destino: não aplicável; relação incompatível; horizonte futuro; confronto N/A. |
| UPD-vercel-25 | update | ampliação de escopo | Vercel Agent duplicaria o Executor. | Rejeitar. | Parecer Updates `vercel#25`. | Destino: não aplicável; relação substituta; horizonte futuro; confronto N/A. |
| UPD-vercel-32 | update | ampliação de escopo | Não existe consumidor Vercel aprovado de credenciais. | Rejeitar. | Parecer Updates `vercel#32`. | Destino: não aplicável; relação complementar; horizonte condicional; confronto N/A. |
| UPD-github-5 | update | ampliação de escopo | Copilot em Actions criaria raciocínio agente e workflow. | Rejeitar. | Parecer Updates `github#5`. | Destino: não aplicável; relação substituta; horizonte futuro; confronto N/A. |
| UPD-github-10 | update | ampliação de escopo | Proteções de execução pressupõem workflow inexistente no desenho. | Rejeitar. | Parecer Updates `github#10`. | Destino: não aplicável; relação complementar; horizonte condicional; confronto N/A. |
| UPD-github-11 | update | ampliação de escopo | Aprovação de run não autoriza nem cria consumidor de mailbox. | Rejeitar. | Parecer Updates `github#11`. | Destino: não aplicável; relação complementar; horizonte atual; confronto N/A. |
| UPD-github-13 | update | ampliação de escopo | Detector Resend não cobre app password Gmail. | Rejeitar. | Parecer Updates `github#13`. | Destino: não aplicável; relação complementar; horizonte atual; confronto N/A. |
| UPD-prod-16 | update | ampliação de escopo | QA visual pertence ao recorte futuro, não à E17.9. | Remover do V2/matriz vigentes. | Parecer Updates `prod#16`; V1 5.1. | Destino: não aplicável; relação incompatível; horizonte atual; confronto N/A. |
| UPD-prod-17 | update | ampliação de escopo | WCAG/UI pertence ao recorte futuro, não à E17.9. | Remover do V2/matriz vigentes. | Parecer Updates `prod#17`; V1 5.1. | Destino: não aplicável; relação incompatível; horizonte atual; confronto N/A. |
| UPD-prod-18 | update | ampliação de escopo | Plugin/MCP distribuível adicionaria experiência e infraestrutura sem ganho. | Rejeitar. | Parecer Updates `prod#18`. | Destino: não aplicável; relação substituta; horizonte futuro; confronto N/A. |
| ANA1R2-01 | invariante técnico | derivação técnica da v1 | Referência opaca não define como credencial e sessão permanecem invisíveis. | Adicionar `credential_resolution` e `session_isolation` ao readiness com exatamente um consumidor autorizado. | Passagem 1, correção 1; V2 10.4; commit `ea9f59fc`. | N/A |
| ANA1R2-02 | invariante técnico | derivação técnica da v1 | Adapters estavam genéricos e operações sem mecanismo/pós-condição. | Localizar registry/adapters e mapear signup, usuário, conta, convite, confirmação, recuperação e leitura de estado. | Passagem 1, correção 2; V2 10.3 e 10.5; commit `ea9f59fc`. | N/A |
| ANA1R2-03 | invariante técnico | derivação técnica da v1 | Regra de bloqueio por capacidade e conclusão de subseção estava ambígua. | Preservar evidência independente, mas impedir checkpoint com critério obrigatório pendente. | Passagem 1, correção 3; V2 10.7.2; commit `ea9f59fc`. | N/A |
| ANA1R2-04 | invariante técnico | derivação técnica da v1 | Automação funcional exige residência em `docs/automations.md`. | Tornar ABC de `docs/automations.md` obrigatório e platform-config condicional a mudança factual. | Passagem 1, correção 4; V2 10.7.1; commit `ea9f59fc`. | N/A |
| ANA1R2-05 | invariante técnico | derivação técnica da v1 | Ausência de consumidor não pode ser convertida em infraestrutura inferida. | Manter `mailbox_consumer_missing` e as proibições explícitas. | Passagem 1, correção 5; V2 10.4 e 10.9. | N/A |
| LEG-01 | invariante técnico | derivação técnica da v1 | O V2 antigo continha navegação, UI/acessibilidade e Landing Pages redistribuídos. | Considerar o contrato antigo superado pela nova V1 e remover esses itens do recorte atual. | Commits históricos `f748cb06`/`91c22d8a`; nova V1/V2. | N/A |
| LEG-02 | invariante técnico | derivação técnica da v1 | O delta do Executor em `28236bb0` contém guardrails de autenticação úteis. | Preservar guardrails compatíveis e substituir concentração de protocolo por roteamento ao novo boundary. | Skill do Executor §6.1; V2 10.1, 10.2 e 10.7.1. | N/A |
| LEG-03 | invariante técnico | derivação técnica da v1 | Roadmap e matriz antigos registram E17.9.7 e updates visuais agora fora. | Reconciliar os mesmos arquivos; não criar arquivo paralelo nem detalhar E17.10. | `docs/roadmap.md`, matriz anterior e V2 10.7.1. | N/A |

## 3. Resultado da consolidação

- Ampliações de escopo incorporadas: nenhuma.
- Modernizações técnicas incorporadas: `supa#30`, `supa#59`, `github#14` e `supa#5` condicional; todas com impacto estrutural baixo e impacto funcional nulo.
- Modernizações com impacto estrutural material: nenhuma; confrontos estruturais exigidos: nenhum.
- Boundary: `automations/qa-transacional/`, local e on-demand, sem workflow, serviço, agente, rota ou banco.
- Estado factual preservado: `mailbox_consumer_missing`; E17.9.4 e E17.9.5 não podem ser concluídas enquanto a capacidade obrigatória permanecer ausente.
- Escopo redistribuído removido: navegação visual, UI/acessibilidade e Landing Pages; E17.10 permanece não detalhada e não liberada.
- Próximo gate: Passagem 2 do mesmo Analista sobre pareceres integrais, esta matriz e o delta `ea9f59fc`.
