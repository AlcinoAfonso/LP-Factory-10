# 29/06/2026 — Plano-base E19-01

Fontes: chat, `docs/prompt-estrategista.md`, `docs/roadmap.md`, `docs/base-tecnica.md`, `docs/schema.md`.

Path: `docs/lousa-plano-base-E19-01.md`

E19-01 — LP Builder MVP: criação produtiva mínima de LP por conta

## 1. Estado e decisões fixas

* Seção afetada do roadmap: E19 — LP Builder.
* Problema: a E9 Fase 5 precisa de um ponto produtivo real de criação de LP onde aplicar o gate comercial.
* Resultado esperado: definir o primeiro recorte funcional mínimo da E19.
* Usuário: owner/admin autenticado de uma conta.
* E9 fornece o sinal comercial server-side.
* E19 consome o sinal da E9 no ponto real de criação produtiva.
* E18 é referência para templates, módulos, composições e artefatos, mas não cria LP produtiva por conta.
* E10.7 não cria LP produtiva por conta e não libera E9 Fase 5.
* Não envolve automação, agente, job, rotina, monitoramento ou execução recorrente.

## 2. Contrato do caso

* Gatilho: usuário autenticado solicita criar uma LP produtiva mínima para uma conta.
* Entrada: conta alvo, usuário autenticado, dados mínimos da LP e contexto comercial da E9.
* Processamento: resolver conta, validar vínculo, validar conta active, validar membership active, consultar entitlement E9 e executar mutação se permitido.
* Validação obrigatória: conta active + membership active + entitlement comercial válido.
* Persistência: ainda a definir; avaliar persistência mínima própria para LP por conta.
* Consumo: LP criada passa a existir como recurso produtivo da conta.
* Fallback: sem entitlement válido, bloquear server-side, não criar LP e retornar estado controlado de bloqueio comercial.
* Frontend: não definido nesta fase; não assumir editor visual nem superfície final antes da avaliação estrutural.
* Path real da mutação: ainda não definido; deve ser proposto e validado antes de implementação.

## 3. Fases e próxima ação

* Fase 1 — Plano-base e avaliação

  * Status: em definição.
  * Objetivo: validar recorte, persistência mínima, boundary, relação com E9, E18 e E10.7.
  * Próxima ação: solicitar avaliação do Analista, Gestor Estrutural e Gestor de Updates.

* Fase 2 — Desenho técnico mínimo

  * Status: futura.
  * Objetivo: definir estrutura de persistência, contrato de criação, path canônico e ponto exato de aplicação do gate E9.
  * Condição de entrada: Fase 1 aprovada e consolidada.

* Fase 3 — Implementação do primeiro recorte

  * Status: futura.
  * Objetivo: implementar criação produtiva mínima de LP por conta.
  * Condição de entrada: Fase 2 aprovada e instrução ao Executor emitida.

* Avaliações necessárias após criar o plano:

  * Analista: avaliar lacunas, contradições, riscos, escopo e clareza.
  * Gestor Estrutural: avaliar path, boundary, reaproveitamento, acoplamento e regressão.
  * Gestor de Updates: avaliar plataformas, recursos novos, riscos operacionais e aderência ao MVP.
  * Gestor de Automação: N/A.

## 4. Escopo negativo e critérios de parada

* Não implementar LP Builder agora.
* Não implementar E9 Fase 5 agora.
* Não criar editor visual.
* Não criar drag and drop.
* Não criar biblioteca extensa de seções.
* Não criar múltiplos templates.
* Não criar publicação avançada.
* Não criar versionamento completo.
* Não criar domínio customizado.
* Não criar analytics.
* Não criar A/B test.
* Não usar IA em runtime.
* Não criar automações.
* Não duplicar regra comercial da E9.
* Não usar Stripe diretamente como fonte de liberação.
* Não aplicar gate apenas na UI.
* Parar se a execução exigir endpoint artificial sem caso real de produto.
* Parar se a persistência exigir schema novo sem avaliação estrutural prévia.
