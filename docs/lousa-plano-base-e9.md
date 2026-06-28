28/06/2026 — Plano-base E9
Fontes: chat, docs/roadmap.md, docs/prompt-estrategista.md

1. Estado e decisões fixas

* E9 define elegibilidade comercial para criar LPs.
* Conta active não fica elegível apenas por estar ativa.
* Elegibilidade nasce de origem comercial válida: plano pago confirmado ou, futuramente, trial concedido.
* Recorte inicial: cards pagos Start, Lite, Pro e Ultra + checkout confirmado.
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

* Fase 1 — Contrato interno de elegibilidade: definir origem comercial, status e consumo pelo Account Dashboard.
* Fase 2 — Provedor de checkout: escolher e integrar primeiro provedor para cards pagos.
* Fase 3 — Webhook e persistência: validar confirmação e registrar entitlement.
* Fase 4 — Consumo da elegibilidade: liberar criação de LPs para conta elegível.
* Fase futura — Trial E9.xx: trial automático/manual como outra origem de entitlement.
* Fase futura — Valores E12.xx: ajuste administrativo de valores, planos ativos e vínculo com provedor.
* Próxima ação: solicitar avaliação do plano-base por Analista, Gestor Estrutural, Gestor de Updates e Gestor de Automação.

4. Escopo negativo e critérios de parada

* Não criar fluxo manual de pagamento, comprovante por WhatsApp ou liberação sem confirmação comercial.
* Não implementar trial no recorte inicial.
* Não criar múltiplos provedores ao mesmo tempo.
* Não alterar layout, copy, ordem ou design dos cards da E10.7.
* Não criar tela administrativa de valores dentro do E9.
* Não transformar E9 em Billing Engine completo.
* Não usar agente de IA.
* Parar se o recorte exigir mudança visual da E10.7, mutação administrativa ampla da E12, ou definição de trial antes do checkout pago mínimo.
