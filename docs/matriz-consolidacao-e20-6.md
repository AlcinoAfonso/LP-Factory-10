# Matriz de consolidação — E20.6

## 1. Referências e legenda

- Caso: `E20.6 — Auditoria, liberação e revisão factual de taxons`.
- V1 imutável: `ffe9585f60f3b41272a1c4a14a9e8ddc756078cd`, blob `9dc5c2a613bae9a6e94f6446c8f23c60ced790e6`.
- V2 apresentada à Passagem 1: `ba1f6fc02cdd1a345fa7d35c35ac9fdbd84ac7b7`, blob `29ba59630705814c245c4a9e1c0e0bf58e649a28`.
- Correções objetivas da Passagem 1: commit `1322e563`, no mesmo path da V2.
- Base/roadmap congelados: `origin/main@bd32c5759ec1c7c8d5d3f5bbdd35e2f524a8d2f1`, blob do roadmap `5f919c8d1b11c07089d00b13f1675d786400596f`.
- Classes: `funcional`, `derivação técnica`, `validação/UX derivada`, `trava`, `oportunidade fora do recorte`, `correção obrigatória`.
- Tratamentos: `preservado`, `incorporado`, `bloqueado por escopo`, `referência de validação`, `corrigido após Passagem 1`.

## 2. Requisitos funcionais da V1

| ID | Origem | Classe | Tratamento | Localização na V2 | Evidência esperada |
|---|---|---|---|---|---|
| V1-01 | Debate 12 §4.1–4.2 | funcional | preservado | §§1–3 | Um plano E20.6 Complexo e autônomo, sem E20.8/E20.9. |
| V1-02 | Debate 12 §4.3 | funcional | preservado | §2.1 | Pesquisa, revisão factual e preparação deixam de ser obrigatoriamente acopladas. |
| V1-03 | Debate 12 §4.4 | funcional | preservado | §§2.1–2.2, 6.1 | Todo taxon novo nasce indisponível e é comparado à cobertura herdada. |
| V1-04 | Debate 12 §4.4 | funcional | preservado | §§2.2, 6.1 | Liberação humana sem IA, Web Search, E20.5 ou justificativa textual. |
| V1-05 | Debate 12 §4.4 | funcional | preservado | §§2.2, 6.3 | Avaliação completa usa E20.5 válida sem Web Search. |
| V1-06 | Debate 12 §4.4 | funcional | preservado | §6.3 | Ausência legítima de E20.5 usa fallback Web Search controlado. |
| V1-07 | Debate 12 §4.4 | funcional | preservado | §6.3 | Pesquisa focal exige pedido humano e usa E20.5 apenas como complemento. |
| V1-08 | Debate 12 §4.4 | funcional | preservado | §§6.2, 6.4 | Humano rejeita todos, aceita alguns/todos ou inclui candidato próprio com camada explícita. |
| V1-09 | Debate 12 §4.4 | funcional | preservado | §§4.2, 6.2 | Recomendação não é decisão, autorização, publicação ou ativação. |
| V1-10 | Debate 12 §4.4 | funcional | preservado | §§5.4, 6.2 | Mudança publica versão E20.2 antes de ativar/reconciliar. |
| V1-11 | Debate 12 §4.4 | funcional | preservado | §§2.2, 6.1 | Revisão de taxon ativo preserva atividade e última versão válida. |
| V1-12 | Debate 12 §4.4 | funcional | preservado | §6.4 | Field pode ser incluído, alterado ou inativado em qualquer camada com histórico. |
| V1-13 | Debate 12 §4.5 | funcional | preservado | §3 | Sem automação de field, Base, Oferta, tarefa real, greenfield/E20.7 ou apagamento histórico. |
| V1-14 | Debate 12 §4.6 | funcional | preservado | §11 | Roadmap será reconciliado in-place em E20, E20.2, E20.5, E20.6, E20.7, E12.5 e E12.6. |
| V1-15 | Debate 12 §4.7 | funcional | preservado | §§6.1–6.5 | Cinco subseções canônicas 20.6.3–20.6.7, sem recorte extra. |
| V1-16 | Debate 12 §4.8 | funcional | preservado | §§6.3, 7 | Mesmo workload, Responses API, E21, `store:false`, 45 s, zero retry e output estrito. |
| V1-17 | Debate 12 §4.8 | funcional | preservado | §6.3 | Fallback até duas chamadas; focal até uma; sem chamadas no caminho humano. |
| V1-18 | Debate 12 §4.9–4.10 | funcional | preservado | §§7–9 | Segurança, observabilidade sem payload/PII e QA hospedado responsivo/acessível. |

## 3. Parecer estrutural

### 3.1 Achados

| ID | Origem | Classe | Tratamento | Localização na V2 | Evidência esperada |
|---|---|---|---|---|---|
| EST-01 | Gestor Estrutural | derivação técnica | incorporado | §§5.1, 6.1 | Criação sempre inativa. |
| EST-02 | Gestor Estrutural | derivação técnica | incorporado | §§5.1, 6.1, 6.5 | Editor genérico não executa `false → true`. |
| EST-03 | Gestor Estrutural | derivação técnica | incorporado | §§4.1, 6.3, 6.5 | Leitura administrativa aceita taxon inativo e seleção dormente; operação continua fail-closed. |
| EST-04 | Gestor Estrutural | derivação técnica | incorporado | §§4.2, 6.1 | Reabrir revisão não zera marcador válido. |
| EST-05 | Gestor Estrutural | derivação técnica | incorporado | §6.3 | Workload ganha política Web Search/output v2 sem contaminar transporte neutro. |
| EST-06 | Gestor Estrutural | derivação técnica | incorporado | §§5.2–5.4 | Sessões/eventos substituem token e handoff transitórios como autoridade factual. |
| EST-07 | Gestor Estrutural | derivação técnica | incorporado | §§5.4, 6.2, 6.4 | Decisão autenticada entra no draft sem transformar candidato diretamente em field. |
| EST-08 | Gestor Estrutural | derivação técnica | incorporado | §6.5 | Provider/lifecycle factual substituem record/reopen/handoff legados. |
| EST-09 | Gestor Estrutural | derivação técnica | incorporado | §§5.2–5.4 | Residência transacional, locks, revisão otimista e RPCs. |
| EST-10 | Gestor Estrutural | derivação técnica | incorporado | §6.4 | Operações puras `add | change | retire` reutilizam registry/draft existentes. |
| EST-11 | Gestor Estrutural | derivação técnica | incorporado | §5.5 | RLS, ACLs mínimas, append-only, teste SQL e snippet. |
| EST-12 | Gestor Estrutural | derivação técnica | bloqueado por escopo | §§3–4, 6.5 | Nenhum novo domínio, rota, service, workflow ou consumidor E20.7. |

### 3.2 Condicionantes

| ID | Origem | Classe | Tratamento | Localização na V2 | Evidência esperada |
|---|---|---|---|---|---|
| C-01 | Gestor Estrutural | trava | incorporado | §6.5 | `rg` sem símbolos legados nem fallback gate→Codex. |
| C-02 | Gestor Estrutural | trava | incorporado | §§5.2–5.5 | SQL prova locks, token stale, rollback e ausência de ativação antecipada. |
| C-03 | Gestor Estrutural | trava | incorporado | §5.5 | RLS, zero policy pública, grants mínimos, RPC invoker e eventos imutáveis. |
| C-04 | Gestor Estrutural | trava | incorporado | §6.3 | Somente ausência legítima aciona fallback web. |
| C-05 | Gestor Estrutural | trava | incorporado | §§5.4, 6.1 | Revisão ativa conserva atividade e marcador. |
| C-06 | Gestor Estrutural | trava | incorporado | §§4.2, 6.2, 6.4 | IA/candidato não escreve field, marcador ou atividade. |
| C-07 | Gestor Estrutural | trava | incorporado | §5.4 | Autorização traz versão, revisão e fingerprints; drift falha fechado. |
| C-08 | Gestor Estrutural | trava | incorporado | §8 | `npm ci`, `npm run check`, focais, SQL/snippet e QA hospedado. |

### 3.3 Patches

| ID | Origem | Classe | Tratamento | Localização na V2 | Evidência esperada |
|---|---|---|---|---|---|
| PATCH-EST-01 | Gestor Estrutural | derivação técnica | incorporado | §§5.1, 6.1 | Default/criação inativos e ativação só pelo lifecycle. |
| PATCH-EST-02 | Gestor Estrutural | derivação técnica | incorporado | §§5.2–5.4 | Sessões, eventos e transições persistidas. |
| PATCH-EST-03 | Gestor Estrutural | derivação técnica | incorporado | §§4.1, 6.3 | Fonte administrativa própria e falhas tipadas. |
| PATCH-EST-04 | Gestor Estrutural | derivação técnica | incorporado | §6.3 | Matriz de fonte e provider controlado. |
| PATCH-EST-05 | Gestor Estrutural | derivação técnica | incorporado | §§5.4, 6.2 | Decisão humana e atomicidade com E20.2. |
| PATCH-EST-06 | Gestor Estrutural | derivação técnica | incorporado | §6.4 | Operações tipadas e versionadas de field. |
| PATCH-EST-07 | Gestor Estrutural | derivação técnica | incorporado | §6.5 | UX nas rotas existentes e remoção do legado. |
| PATCH-EST-08 | Gestor Estrutural | trava | incorporado | §§5.5, 8, 10–11 | Ordem, validações e documentação executáveis. |

## 4. Parecer de Automações

| ID | Origem | Classe | Tratamento | Localização na V2 | Evidência esperada |
|---|---|---|---|---|---|
| PATCH-AUT-01 | Gestor de Automações | derivação técnica | incorporado | §6.1 | Estado inicial/revisão determinísticos; caminho sem IA. |
| PATCH-AUT-02 | Gestor de Automações | derivação técnica | incorporado | §§6.2, 6.4 | Autoridade humana, camada e publicação antes de ativação. |
| PATCH-AUT-03 | Gestor de Automações | derivação técnica | incorporado | §6.3 Seleção | Cinco modos de fonte, com erro técnico sem fallback. |
| PATCH-AUT-04 | Gestor de Automações | derivação técnica | incorporado | §6.3 Provider | E21, deadline, store false, foreground, Web Search limitada e schema estrito. |
| PATCH-AUT-05 | Gestor de Automações | derivação técnica | incorporado | §6.3 Guardrails | Output v2, fontes só do provider, injection/refusal/incomplete tipados. |
| PATCH-AUT-06 | Gestor de Automações | derivação técnica | incorporado | §7 | Server-only, payload mínimo, telemetria/custo E21 e falha segura. |
| PATCH-AUT-07 | Gestor de Automações | derivação técnica | incorporado | §§8, 10–11 | Destinos documentais, baseline vigente e rollout provado. |

## 5. Parecer de Updates

| ID | Origem | Classe | Tratamento | Localização na V2 | Evidência esperada |
|---|---|---|---|---|---|
| supa#2 | Gestor de Updates | validação/UX derivada | incorporado | §§5.5, 8, 12 | Security Controls read-only pós-apply sem alerta incompatível. |
| prod#14 | Gestor de Updates | validação/UX derivada | incorporado | §§6.5, 9, 12 | Estado, próximo passo, consequência e bloqueio reconhecíveis. |
| prod#17 | Gestor de Updates | validação/UX derivada | incorporado | §§6.5, 8, 12 | Critérios WCAG 2.2 focais, sem alegar conformidade integral. |
| supa#40 | Gestor de Updates | trava | referência de validação | §§5.5, 8 | Migration forward-only, teste SQL e snippet. |
| prod#16 | Gestor de Updates | trava | referência de validação | §8 | Preview hospedado desktop/mobile, teclado e leitor de tela. |
| vercel#31 | Gestor de Updates | trava | referência de validação | §§7, 12 | Não regredir Next/eslint-config-next 16.3.3. |
| vercel#32 | Gestor de Updates | trava | referência de validação | §§7, 12 | Reutilizar `OPENAI_API_KEY`; Config/Secret preservados. |
| github#14 | Gestor de Updates | trava | referência de validação | §§7, 12 | Evidência durável em commit, PR e documentos. |
| supa#5 | Gestor de Updates | oportunidade fora do recorte | bloqueado por escopo | §§3, 12 | Sem Unified Logs até incidente/gatilho próprio. |
| supa#46 | Gestor de Updates | oportunidade fora do recorte | bloqueado por escopo | §§3, 12 | Sem Audit Log Drain até requisito regulatório. |
| supa#53 | Gestor de Updates | oportunidade fora do recorte | bloqueado por escopo | §§3, 12 | Sem fila/worker até volume assíncrono medido. |
| supa#63 | Gestor de Updates | não aplicável | bloqueado por escopo | §5.5 | Asserts SQL cobrem residências service-only sem policies. |
| supa#69 | Gestor de Updates | oportunidade fora do recorte | bloqueado por escopo | §§3, 12 | Sem OpenTelemetry/update de client até incidente e plano próprios. |
| vercel#1 | Gestor de Updates | oportunidade fora do recorte | bloqueado por escopo | §§3, 12 | Sem AI Gateway até segundo provider ou lacuna medida. |

## 6. Passagem 1 do Analista

Conclusão preservada: `aprovado com correções obrigatórias` sobre a V2 `ba1f6fc02cdd1a345fa7d35c35ac9fdbd84ac7b7`. A correção está no commit `1322e563`; a decisão final permanece reservada à Passagem 2 e, se necessário, à revisão delta no mesmo Analista.

| ID | Origem | Classe | Tratamento | Localização na V2 | Evidência esperada |
|---|---|---|---|---|---|
| ANA-P1-01 | Analista, Passagem 1 | correção obrigatória | corrigido após Passagem 1 | §6.3 Provider | `return_token_budget` removido; teste da request serializada rejeita propriedade desconhecida. |
| ANA-P1-02 | Analista, Passagem 1 | correção obrigatória | corrigido após Passagem 1 | §§4.2, 5.2–5.4 | Sessões/eventos são autoridade; `taxon_review_evidence` é projeção atômica por taxon e draft exato. |
| ANA-P1-03 | Analista, Passagem 1 | correção obrigatória | corrigido após Passagem 1 | §§4.1, 6.3 | Leitura administrativa própria não relaxa `TAXON_INACTIVE` operacional. |
| ANA-P1-04 | Analista, Passagem 1 | correção obrigatória | corrigido após Passagem 1 | §§5.2–5.5 | Vocabulários, nulabilidade, FKs, idempotência, Trigger Hub e múltiplos taxons fechados. |
| ANA-P1-05 | Analista, Passagem 1 | correção obrigatória | corrigido após Passagem 1 | §12 | `supa#2`, `prod#14` e `prod#17` reclassificados como derivações de validação/UX da V1. |

## 7. Cobertura e pendências

- Todos os requisitos, achados, condicionantes, patches, updates e correções acima têm destino explícito na V2.
- Não houve confronto estrutural de update porque nenhum update aprovado possui impacto estrutural material.
- Não há arbitragem funcional ou decisão humana pendente nesta consolidação.
- A matriz não autoriza implementação: o gate permanece a conclusão do mesmo Analista após a Passagem 2 e eventuais revisões delta.
