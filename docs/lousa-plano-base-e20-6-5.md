# Plano-base v1 — E20.6.5 — Avaliação factual com IA no runtime do Admin

- Data de consolidação: 17/08/2026.
- Estado: plano-base v1 consolidado.
- Recorte previsto para roadmap: `20.6.5 — Avaliação factual com IA no runtime do Admin`.
- Path canônico: `docs/lousa-plano-base-e20-6-5.md`.
- Plano conceitual: `docs/lp-planejamento.md`.
- Processo: `docs/prompt-estrategista.md` v31.
- Fontes principais: `README.md`, `AGENTS.md`, `docs/roadmap.md`, `docs/template-roadmap.md`, `docs/lousa-plano-base-e20-2.md`, `docs/lousa-plano-base-e20-6.md`, `docs/gestor-automations.md`, `docs/base-tecnica.md`, `docs/platform-config.md`, `docs/openai-model-snapshot.md`, `docs/template-prompts.md`, `lib/openai-workloads/registry.ts`, fluxo runtime vigente de proposta de perfil de geração e parecer do Gestor de Automação aprovado no debate de 17/08/2026.

## 1. Estado e decisões fixas

### 1.1. Problema e resultado esperado

- A E20.6 vigente executa a avaliação semântica fora do runtime, por handoff `Admin → Codex App → Admin`.
- A E20.6.5 internaliza essa avaliação no Admin Dashboard como workload OpenAI de produto, transformando a preparação de taxons em capacidade operacional do próprio LP Factory.
- O objetivo é reduzir operação manual externa e produzir aprendizado real sobre qualidade, custo, latência, estabilidade e utilidade da IA sem enfraquecer autoridade humana ou gates determinísticos.
- A E20.6.4 permanece inalterada e determinística: IA avalia significado; humano decide; backend revalida o estado e deriva `prepared`.

### 1.2. Automação aprovada

- Automação: sim.
- Categoria: `2.1.3 — Automação com IA em fluxo controlado`.
- Ambiente principal: `2.2.1 — Runtime do LP Factory`.
- Plataforma dependente: OpenAI Platform via Responses API.
- Objetivo da automação: avaliar semanticamente a suficiência factual da E20.2 contra a pesquisa E20.5 selecionada e permitir diálogo controlado sobre hipóteses humanas de gap.
- Limites essenciais:
  - IA não cria field, camada, versão ou alteração de registry;
  - IA não grava suficiência e não decide `prepared`;
  - não usar tools autônomas, Agents SDK, agent loop, PTC, multi-agent, job, fila ou automação recorrente sem novo gap demonstrado;
  - não persistir conversa, prompt, pesquisa integral ou resposta bruta na v1;
  - não usar `latest`, maior versão ou fallback implícito da E20.2.
- Avaliação formal de Automação na v2: necessária.
- Modelo, `reasoning.effort`, ID canônico do novo workload e configuração executável pertencem à v2 sob governança E21.1 e não são antecipados nesta v1.

### 1.3. Dois modos de avaliação

- Modo sistemático:
  - o humano inicia uma avaliação da pesquisa E20.5 selecionada contra uma versão executável explícita da E20.2;
  - a IA procura gaps factuais materiais sustentados pelas fontes autorizadas;
  - pode retornar múltiplos candidatos.
- Modo hipótese humana:
  - o humano apresenta uma hipótese focal em linguagem natural, por exemplo: `Para o ultranicho XXX, identifiquei que precisamos do campo YYY. Avalie se você concorda.`;
  - uma hipótese humana focal é priorizada por chamada;
  - a IA pode sinalizar outro achado incidental material, mas não transforma silenciosamente o turno focal em auditoria sistemática completa.
- Os dois modos usam o mesmo boundary, as mesmas fontes autoritativas e a mesma barreira de admissão de gap factual.

### 1.4. Papel da IA e profundidade permitida

- A IA atua como avaliador semântico não autoritativo.
- Para avaliação sistemática ou hipótese humana, pode:
  - reconhecer cobertura já existente;
  - recomendar refinamento de field existente;
  - reconhecer possível novo field;
  - recomendar camada conceitual `universal`, `segment`, `niche` ou `ultra_niche`;
  - indicar necessidade factual, evidência, cobertura atual, finalidade semântica e origem esperada do valor;
  - declarar incerteza ou pedir informação adicional;
  - rever sua recomendação diante de novo feedback humano.
- A IA não define o contrato executável definitivo da E20.2.
- `field_key`, `value_type`, obrigação, validações completas, regras de plano, versão do catálogo e alteração de registry permanecem responsabilidade do recorte próprio da E20.2.
- Menção exploratória a propriedades técnicas pode aparecer no diálogo quando útil, mas não integra a decisão obrigatória nem o Structured Output mínimo da E20.6.5.

### 1.5. Autoridade humana e consequência da decisão

- A recomendação da IA nunca constitui decisão administrativa.
- Texto conversacional como `concordo` não produz mutação por si só.
- A decisão administrativa é uma ação humana explícita e separada do diálogo.
- Antes de qualquer registro, o backend revalida deterministicamente que taxon, cadeia taxonômica, pesquisa E20.5 e versão/catálogo E20.2 permanecem compatíveis com o contexto avaliado.
- `fingerprint` pode ser usado na v2 como detalhe de implementação, mas não é requisito arquitetural da v1; a garantia obrigatória é a revalidação determinística integral das fontes.
- Se o humano confirmar gap factual real:
  - nenhuma suficiência é registrada;
  - a evolução segue no recorte próprio da E20.2;
  - após nova versão E20.2 aplicável, a E20.6 deve ser executada novamente antes de registrar suficiência.
- Se a IA recomendar `suficiente` e o humano aceitar:
  - o backend revalida as precondições;
  - registra a versão explicitamente avaliada pelo mecanismo administrativo vigente;
  - a E20.6.4 deriva `prepared` sem segunda chamada de IA.

### 1.6. Continuidade, estado transitório e mudança das fontes

- A v1 não cria persistência de conversa, prompt, relatório, hipótese ou candidato.
- Cada intervenção humana produz nova chamada explícita com contexto canônico reconstruído, resultado estruturado anterior relevante quando necessário e feedback humano atual.
- `previous_response_id` e persisted reasoning não são adotados inicialmente; podem ser reavaliados somente após evidência real de ganho material de qualidade, custo ou latência.
- Qualquer mudança material em taxon/cadeia, pesquisa E20.5, versão E20.2 ou catálogo resolvido invalida a avaliação corrente para fins administrativos.
- Resultado anterior pode permanecer visível apenas como informação transitória, mas não pode fundamentar registro após mudança das fontes.
- A próxima avaliação reconstrói integralmente o contexto autoritativo atual.

### 1.7. Compatibilidade com os recortes consumidores

- A internalização da IA na E20.6.5 não altera por si os contratos da E20.2, E19.2, E19.3, E19.4 ou E20.6.4.
- Eventual efeito nesses recortes nasce somente de gap factual posteriormente confirmado e deve ser tratado no domínio proprietário correspondente.
- Evolução real da E20.2 pode exigir nova coleta/correção pela E19.2 quando surgir valor obrigatório ausente.
- E19.3 deve continuar absorvendo genericamente a versão E20.2 revisada e E19.4 continua consumindo somente o pacote autorizado da E19.3.

## 2. Contrato do caso

### 2.1. Fluxo operacional

- Gatilho:
  - ação explícita de `platform_admin` na Taxonomia administrativa existente.
- Entrada:
  - taxon e cadeia taxonômica autoritativa;
  - pesquisa integral E20.5 selecionada e válida;
  - versão executável E20.2 escolhida explicitamente;
  - catálogo E20.2 resolvido e equivalente nos quatro planos quando aplicável;
  - modo `systematic` ou `hypothesis`;
  - hipótese ou feedback humano quando houver.
- Processamento:
  - validar deterministicamente precondições e executabilidade antes do provider;
  - reconstruir o contexto autorizado a cada chamada;
  - chamar o novo workload OpenAI de produto via Responses API;
  - exigir Structured Output;
  - validar deterministicamente a resposta;
  - apresentar resultado transitório e permitir refinamento controlado;
  - manter decisão administrativa separada da conversa.
- Validação:
  - aplicar a barreira de admissão de gap factual da E20.6;
  - impedir promoção automática de pesquisa para field;
  - rejeitar resposta stale ou incompatível com as fontes atuais;
  - não registrar suficiência com resposta inválida, `inconclusive`, refusal ou falha técnica;
  - revalidar integralmente as fontes antes da ação administrativa final.
- Persistência:
  - preservar somente `reviewed_input_catalog_version` já existente para a decisão final de suficiência;
  - não criar nova tabela, coluna, histórico ou memória conversacional nesta v1.
- Consumo:
  - humano revisa e decide no Admin;
  - gap confirmado retorna ao recorte E20.2;
  - suficiência aceita segue ao registro existente e ao gate E20.6.4.
- Fallback:
  - fail-closed;
  - OpenAI indisponível, refusal, resposta inválida, `inconclusive`, mudança de fonte ou erro de validação não registram suficiência;
  - nenhuma troca silenciosa de modelo ou versão E20.2;
  - nenhum fallback automático para Codex App;
  - tentativa posterior depende de nova ação humana explícita.

### 2.2. Structured Output mínimo

- O contrato mínimo deve suportar:
  - `status`: `sufficient | candidate_gaps | inconclusive`;
  - `mode`: `systematic | hypothesis`;
  - resumo curto;
  - `candidates[]` quando aplicável;
  - origem do candidato: sistemático, hipótese humana ou incidental;
  - conclusão: coberto, refinamento, possível novo field ou inconclusivo;
  - necessidade factual;
  - fields relacionados existentes quando houver;
  - justificativa e evidência curta;
  - camada taxonômica sugerida quando aplicável;
  - incertezas;
  - pergunta de follow-up somente quando necessária.
- O backend anexa e controla identidade das fontes e metadados autoritativos; o modelo não é autoridade para taxon, versão ou identidade do contexto.
- O contrato não inclui cadeia de raciocínio privada.
- O shape executável exato pertence à v2.

### 2.3. Observabilidade e aprendizado operacional

- Reutilizar a governança E21.1 e a observabilidade segura já existente para workloads de produto.
- Quando compatível com o boundary vigente, registrar somente metadados sanitizados, como:
  - workload e revisão/configuração;
  - modelo e effort;
  - ambiente;
  - response ID;
  - latência;
  - tokens de input, cache, output e reasoning quando disponíveis;
  - sucesso/falha e categoria segura de falha;
  - modo `systematic/hypothesis`;
  - decisão humana sanitizada `accepted/rejected/modified`, quando puder ser registrada sem conteúdo sensível.
- Não registrar prompt, pesquisa integral, conversa ou resposta bruta.
- Histórico analítico permanente de gaps, discordâncias ou decisões fica fora da v1 e somente pode ser reaberto diante de uso real que demonstre valor.

### 2.4. Frontend e evidência esperada

- Reutilizar a rota existente `/admin/taxonomia/[taxonId]`; não criar nova rota apenas para a E20.6.5.
- A superfície deve distinguir claramente:
  - avaliação sistemática;
  - hipótese focal humana;
  - resultado da IA;
  - estado inconclusivo/falha;
  - decisão administrativa explícita separada da conversa;
  - invalidação por mudança das fontes.
- A UI não deve sugerir que a IA aprovou ou alterou a E20.2.
- Critérios visuais de aceite:
  - leitura clara em desktop e largura móvel;
  - sem overflow horizontal indevido;
  - foco visível e navegação por teclado nos controles interativos;
  - estados de carregamento, falha, resultado e invalidação compreensíveis;
  - nenhuma exposição de prompt, pesquisa integral, resposta bruta ou metadado sensível.
- Evidência esperada:
  - modo sistemático executável;
  - hipótese focal executável e refinável;
  - resultado estruturado válido;
  - controle negativo para resposta stale após mudança de fonte;
  - confirmação administrativa separada;
  - falha fechada sem registro de suficiência;
  - QA autenticado da superfície em desktop e mobile.

### 2.5. Riscos principais

- Resposta semanticamente convincente, mas não sustentada pelas fontes.
  - Mitigação: Structured Output, evidência explícita, validação determinística e decisão humana.
- Resultado stale após mudança de pesquisa, taxon ou catálogo.
  - Mitigação: reconstrução do contexto e revalidação integral antes da ação administrativa.
- Escopo crescer para assistente agentic ou memória sem necessidade real.
  - Mitigação: Responses API direta, sem tools, memória persistente ou infraestrutura adicional na v1.
- Pesquisa ou catálogo conterem texto instrucional indevido.
  - Mitigação: tratar fontes como dados não executáveis e manter instruções de sistema/runtime separadas do conteúdo dinâmico.
- Conversa exploratória ser confundida com aprovação.
  - Mitigação: decisão humana por ação administrativa separada.

## 3. Fases e próxima ação

### 3.1. E20.6.5 — Avaliação factual com IA no runtime do Admin

- Status: plano-base v1 consolidado; implementação não iniciada.
- Automação: sim.
- Categoria: `2.1.3 — Automação com IA em fluxo controlado`.
- Objetivo: internalizar no Admin a avaliação semântica da E20.6, incluindo descoberta sistemática e diálogo sobre hipóteses humanas, mantendo autoridade humana e gate determinístico.
- Limites:
  - sem alteração automática da E20.2;
  - sem nova persistência conversacional;
  - sem comportamento agentic;
  - sem mudança dos contratos consumidores por consequência da internalização da IA;
  - sem modelo/effort antecipados antes da governança E21.1 na v2.
- Critérios de aceite:
  - workload de produto integrado à governança E21.1;
  - precondições e contexto reconstruídos deterministicamente;
  - Responses API + Structured Output validados;
  - modo sistemático e modo hipótese funcionais;
  - refinamento por feedback humano sem memória persistente obrigatória;
  - mudança material das fontes invalida a avaliação corrente;
  - decisão administrativa separada e protegida por revalidação das fontes;
  - observabilidade sanitizada sem conteúdo sensível;
  - falhas permanecem fail-closed;
  - E20.6.4 continua determinística e sem nova chamada de IA;
  - frontend autenticado validado em desktop, mobile, teclado e estados de erro/invalidação.
- Avaliação formal de Automação na v2: necessária.
- Próxima ação: concluir o checklist da v1 e escolher o processo conforme o item 4 de `docs/prompt-estrategista.md`.

## 4. Escopo negativo e critérios de parada

### 4.1. Escopo negativo

- Não reimplementar E20.5, E20.2 ou E20.6.4.
- Não alterar automaticamente registry, field, versão ou camada da E20.2.
- Não transformar recomendação ou texto conversacional em mutação administrativa.
- Não persistir conversa, prompt, pesquisa integral, relatório ou resposta bruta.
- Não criar histórico analítico permanente na v1.
- Não exigir `fingerprint` como nova abstração arquitetural; a obrigação é revalidar integralmente as fontes.
- Não adotar `previous_response_id`, persisted reasoning, explicit prompt caching, tools, PTC, Agents SDK, multi-agent, job, fila ou automação recorrente sem evidência posterior.
- Não escolher automaticamente versão E20.2, modelo ou `reasoning.effort`.
- Não redesenhar E19.2, E19.3 ou E19.4 apenas porque a E20.6 passou a usar IA em runtime.
- Não definir na E20.6.5 o contrato executável final de um field E20.2.

### 4.2. Critérios de parada

- Parar se a v2 demonstrar necessidade material de nova persistência, nova entidade, histórico permanente ou workflow automático de evolução da E20.2 sem nova decisão humana.
- Parar se o Gestor de Automação na v2 concluir que a categoria `2.1.3` não atende ao comportamento executável necessário.
- Parar se a solução exigir comportamento agentic, tools autônomas ou nova infraestrutura para cumprir requisito não previsto nesta v1.
- Parar se não for possível preservar a autoridade determinística de E20.5/E20.2/E20.6.4 e a decisão humana separada.
- Parar se a implementação exigir alterar contratos consumidores E19 sem gap factual específico e recorte próprio.