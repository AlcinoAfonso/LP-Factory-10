28/06/2026 — Plano-base E9
Fontes: chat, docs/roadmap.md, docs/prompt-estrategista.md

1. Estado e decisões fixas

* E9 define elegibilidade comercial para criar LPs.
* E9 libera apenas o gate/elegibilidade comercial; não implementa LP Builder nem fluxo visual de criação de LPs.
* Conta active não fica elegível apenas por estar ativa.
* Entitlement comercial não substitui bloqueios de conta, membership ou status operacional.
* Elegibilidade nasce de origem comercial válida: plano pago confirmado ou, futuramente, trial concedido.
* Recorte inicial: cards pagos Start, Lite, Pro e Ultra + checkout confirmado.
* Usar a nomenclatura canônica dos planos vigente no projeto; se houver diferença entre Start e Starter, resolver antes da implementação do checkout.
* Provedor de checkout entra como subseção futura E9.xx.
* Trial automático/manual entra como subseção futura E9.xx.
* Ajuste de valores pertence a E12.xx, por ser operação administrativa no Admin Dashboard.

2. Contrato do caso

* Usuário clica em Start, Lite, Pro ou Ultra.
* Sistema inicia checkout no provedor escolhido.
* Provedor confirma pagamento/assinatura por webhook.
* Sistema valida evento, conta, plano, status e idempotência.
* Sistema persiste entitlement comercial.
* Account Dashboard libera criação de LPs somente após confirmação válida.
* Sem confirmação válida, conta permanece sem elegibilidade produtiva.

3. Fases e próxima ação

* Fase 1 — Contrato interno de elegibilidade: definir origem comercial, status, consumo pelo Account Dashboard e necessidade estrutural mínima de persistência.

3.1 Detalhamento da Fase 1 — Contrato interno de elegibilidade

* Objetivo: definir o contrato mínimo que decide quando uma conta pode acessar o gate comercial de criação de LPs.
* Resultado esperado: contrato conceitual aprovado, sem checkout, sem webhook, sem migration e sem alteração de runtime.
* Investigar: lógica atual de conta ativa, membership, Account Dashboard, plans, trial, permissões e bloqueios existentes.
* Definir: origens comerciais válidas, status conceituais, bloqueios independentes, consumo pelo Account Dashboard e dados mínimos necessários para fases futuras.
* Regra central: conta precisa estar em estado operacional permitido, membership precisa permitir acesso e entitlement comercial precisa estar válido.
* Origem inicial: plano pago confirmado.
* Origens futuras: trial, liberação manual, provedor de checkout e webhook.
* Status conceituais esperados: sem_entitlement, pendente_confirmacao, ativo, expirado, cancelado e bloqueado_operacionalmente.
* Os nomes são conceituais; antes da implementação, verificar se já existe nomenclatura canônica no projeto.
* Não implementar checkout, provedor, webhook, migration, tabela, RPC, policy, grant, constraint, Account Dashboard, cards, LP Builder ou tela admin.
* Parar se a investigação exigir mudança de banco, runtime, arquitetura, cards da E10.7 ou mutação administrativa da E12 antes de nova decisão estratégica.
* Entrega esperada da Fase 1: investigação resumida, arquivos consultados, contrato interno proposto, riscos, lacunas e validação documental.
* E9.xx futuro — Provedor de checkout: escolher e integrar primeiro provedor para cards pagos.
* E9.xx futuro — Webhook e persistência: validar confirmação, idempotência e registro de entitlement comercial.
* E9.xx futuro — Consumo da elegibilidade: liberar gate comercial para criação de LPs após persistência validada.
* E9.xx futuro — Trial: trial automático/manual como outra origem de entitlement.
* E9.xx futuro — Liberação manual: contratação manual ou concessão administrativa como origem comercial válida, sem comprovante informal por WhatsApp.
* E12.xx futuro — Valores: ajuste administrativo de valores, planos ativos e vínculo com provedor.
* Próxima ação: seguir para consolidação do Estrategista e só depois abrir recorte de execução aprovado.
* Estrutura de persistência será definida em fase própria antes da implementação.
* Webhook de confirmação, quando implementado, deve ser catalogado em docs/automations.md como automação operacional, com recurso utilizado, categoria e classificação.
* Updates aplicáveis: supa#5 para logs seguros, supa#36 para leituras server-side, supa#40 para validação SQL read-only, supa#58 como trava de schema/grants/policies e prod#13 apenas como referência futura, sem bundles/grants no recorte inicial.

4. Escopo negativo e critérios de parada

* Não criar fluxo manual de pagamento, comprovante por WhatsApp ou liberação sem confirmação comercial.
* Não implementar trial no recorte inicial.
* Não criar múltiplos provedores ao mesmo tempo.
* Não alterar layout, copy, ordem ou design dos cards da E10.7.
* Não criar tela administrativa de valores dentro do E9.
* Não transformar E9 em Billing Engine completo.
* Não usar agente de IA.
* Não implementar LP Builder nem fluxo visual de criação de LPs no E9; E9 libera apenas o gate/elegibilidade comercial.
* Parar se a fase exigir tabela, RPC, policy, grant ou migration antes de definir contrato de entitlement, idempotência e consumo no Account Dashboard.
* Não assumir public.plans como fonte suficiente para checkout, descontos, garantias, regras promocionais ou URLs oficiais sem decisão específica.
* Parar se o recorte exigir mudança visual da E10.7, mutação administrativa ampla da E12, ou definição de trial antes do checkout pago mínimo.
