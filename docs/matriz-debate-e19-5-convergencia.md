# Matriz de debate — E19.5 — Convergência, simplicidade e recorte

## 0. Introdução

### 0.1. Identificação

- Documento: Matriz de debate — E19.5 — Convergência, simplicidade e recorte.
- Data: 22/08/2026.
- Estado: **concluída quanto à decisão de convergência; alternativa B confirmada por decisão humana em 22/08/2026; aguarda consolidação no plano-base canônico E19.5 antes de qualquer implementação**.
- PR técnico congelado durante o debate: #797.
- Fonte principal de visão do MVP: `README.md`.
- Fontes internas obrigatórias:
  - `docs/lousa-plano-base-e19-5.md`;
  - `docs/matriz-consolidacao-e19-5.md`;
  - `docs/roadmap.md`;
  - `docs/base-tecnica.md`;
  - `docs/schema.md`;
  - PR #797 e todos os seus review threads;
  - contratos adjacentes E19.2, E19.3, E19.4, E20.2, E20.6.5 e E21.2.

### 0.2. Natureza do documento

- Esta matriz não é novo plano-base.
- Esta matriz não autoriza implementação.
- Esta matriz não substitui documentos canônicos.
- A matriz cumpriu seu objetivo de decidir entre continuar, reduzir, desmembrar ou redesenhar a primeira E19.5.
- Decisão final: **alternativa B — reduzir a primeira E19.5**.
- A forma recomendada de execução de B é reconstruir a implementação reduzida a partir da `main`, reaproveitando seletivamente conhecimento, contratos, trechos e casos de regressão do #797; isso não transforma automaticamente a decisão em alternativa C.
- A alternativa C somente volta à decisão humana se o plano-base reduzido demonstrar que a entrega precisa ser formalmente desmembrada em recortes independentes para permanecer segura e compreensível.
- O documento permanece temporário e deve ser encerrado ou removido conforme o processo vigente depois que a decisão estiver consolidada no plano-base canônico e o recorte seguir para execução.

## 1. Objetivo

### 1.1. Pergunta central

- A implementação atual da E19.5 representa a menor complexidade suficiente para entregar o workspace desejado pelo humano com segurança, boa UX e compatibilidade com os contratos vigentes?
- Resposta final: **não**. O produto desejado permanece válido, mas o #797 concentra complexidade acidental suficiente para justificar redução do primeiro recorte e reconstrução seletiva a partir da `main`.

### 1.2. Resultados esperados

- Confirmar o resultado de produto desejado pelo humano.
- Separar complexidade indispensável de complexidade acidental.
- Identificar fontes duplicadas de verdade e validação.
- Mapear fragilidades por classe, não comentário por comentário.
- Avaliar aderência a práticas atuais de mercado e plataforma.
- Reavaliar o tamanho correto da primeira entrega.
- Produzir uma única decisão de convergência e transferir ao plano-base somente as decisões e invariantes necessários à nova implementação.

## 2. Papéis e autoridades

### 2.1. Humano

- Define o produto desejado.
- Decide quais capacidades são indispensáveis na primeira entrega.
- Aceita ou rejeita compromissos entre simplicidade, robustez e prazo.
- Escolhe a opção final após os pareceres.
- Decisão final registrada nesta matriz: **B — reduzir a primeira E19.5**.

### 2.2. Estrategista

- Avalia proposta de valor, UX, clareza do lifecycle e tamanho do MVP.
- Traduz evidência de mercado em recomendação de produto.
- Recomenda manter, simplificar, adiar, dividir ou retirar capacidades.
- Não decide sozinho banco, migration ou boundary técnico.
- Parecer final: **B é a alternativa correta; reconstrução limpa a partir da `main` é a estratégia preferida de execução**.

### 2.3. Analista Macro

- Mantém a matriz e o mapa transversal do repositório.
- Verifica PR #797, `main`, planos e recortes adjacentes.
- Classifica fragilidades, dependências, conflitos e fontes de verdade.
- Compara alternativas técnicas sem executar código.
- Consolida a recomendação final para decisão humana.
- As verificações técnicas remanescentes deixam de ser patches do #797 e passam a ser requisitos de desenho/validação do plano-base reduzido.

### 2.4. Pesquisa externa

- Chat separado e temporário.
- Pesquisa somente práticas de mercado, UX e documentação técnica oficial.
- Usa fontes citadas e distingue prática consolidada de opinião.
- Não altera o repositório.
- Não escolhe arquitetura do projeto.
- Entrega evidência para o Estrategista e o Analista Macro.

### 2.5. Executor

- Permanece parado até existir plano-base reduzido consolidado e decisão humana de seguir para implementação.
- Não recebe instrução baseada diretamente nesta matriz.
- Não corrige threads isolados do #797.

## 3. Congelamento operacional

### 3.1. PR #797

- Manter em draft e sem novos patches enquanto a nova versão do plano-base E19.5 é consolidada.
- Não executar merge ou apply.
- Não criar revisão 4.
- Não gravar E20.6 v5.
- Não executar contract definitivo.
- Preservar branch, commits, testes e review threads como evidência, protótipo técnico, catálogo de armadilhas e fonte seletiva de partes reaproveitáveis.
- Não fazer cherry-pick de commits completos por padrão; reaproveitamento significa revalidar o contrato e portar somente o trecho ou caso de regressão ainda aderente ao plano reduzido.
- Depois da consolidação do plano-base reduzido, o destino recomendado do #797 é fechamento como **superseded by reduced E19.5 implementation**, sem apagar branch ou histórico.

### 3.2. PR da matriz

- Branch: `docs/e19-5-matriz-debate-convergencia`.
- PR: #801 — `docs(E19.5): abrir matriz de convergência do PR #797`.
- Escopo: somente este arquivo.
- Não alterar `README.md`, roadmap, schema, base técnica ou plano-base dentro deste PR.
- A matriz fica concluída como artefato decisório e permanece acessível para a consolidação canônica subsequente.

## 4. Critérios de avaliação

### 4.1. Produto e UX

- O comportamento corresponde ao que o humano deseja?
- O usuário entende:
  - o que é uma LP;
  - o que é configuração;
  - o que é versão mais recente;
  - o que é versão aprovada;
  - o que significa arquivar e restaurar quando essa capacidade vier a existir;
  - quando uma ação chama IA?
- Existe capacidade implementada que pode ser adiada sem reduzir a validação comercial?
- Conclusão: o ciclo central pode ser entregue sem archive/restore, publicação, editor, A/B, mensuração ou nova automação.

### 4.2. Simplicidade

- Quantas entidades, estados, RPCs, adapters e contratos são indispensáveis?
- Algum mecanismo existe apenas para compatibilizar outro mecanismo recém-criado?
- Há duplicação de regras entre TypeScript e SQL?
- Há estado implícito inferido por contadores ou efeitos colaterais?
- O runtime depende de leitura completa sem garantia de completude?
- Conclusão: precriação/backfill operacional, placeholders, `is_initialized`, validator semântico duplicado em SQL e leitura account-wide do histórico são os principais alvos de simplificação.

### 4.3. Robustez

- Fail-closed é aplicado onde protege dado, tenant ou autoridade?
- A migration é atômica e possui estratégia clara de falha?
- Handoff e save são idempotentes onde necessário?
- Snapshots preservam proveniência suficiente?
- Leitura histórica é completa e determinística na superfície que realmente a consome?
- Conclusão: robustez deve ser preservada reduzindo mecanismos, não duplicando parsers ou materializando dados antes de haver consumidor.

### 4.4. Manutenção

- Uma nova versão do catálogo exigirá duplicação manual de validators?
- Novos fields exigirão alterar múltiplas autoridades?
- A solução é compreensível por outro Executor sem reconstruir todo o histórico?
- Testes cobrem invariantes por classe?
- Conclusão: a nova implementação deve privilegiar autoridade semântica server-side única e portar invariantes úteis do #797, não sua mecânica por inércia.

### 4.5. Aderência aos recortes adjacentes

- E19.2 permanece bootstrap da primeira jornada e histórico, sem fallback operacional concorrente após o handoff.
- E19.3 continua pacote autorizado.
- E19.4 continua geração e revisões append-only.
- E20.2 continua autoridade do catálogo factual.
- E20.6.5 continua autoridade do processo humano de suficiência.
- E21.2 continua autoridade da configuração operacional dos workloads.
- Nenhum recorte passa a depender de fonte concorrente criada pela E19.5.

### 4.6. Identidade da LP e versionamento — decisão humana confirmada

- Decisão humana confirmada em 22/08/2026: adotar **núcleo híbrido** para a identidade da LP.
- Princípio de produto: **a LP identifica um trabalho comercial; a revisão identifica uma evolução desse mesmo trabalho**.
- Cada conta pode possuir várias identidades de LP.
- Cada identidade de LP pode possuir várias revisões imutáveis e append-only.
- A identidade comercial deve permanecer estável depois da primeira revisão válida.
- Elementos do núcleo de identidade após a primeira revisão válida:
  - conta proprietária;
  - `funnel_stage`;
  - oferta ou caso de uso principal, em seu significado;
  - `transaction_intent`, quando aplicável ao taxon;
  - finalidade comercial da LP, em seu significado, sem transformar a redação literal de `landing_page_objective` em identificador.
- O código humano sequencial permanece direção de UX desejada, mas sua implementação física não é necessária para caracterizar o núcleo comercial nem para validar a primeira E19.5 reduzida.
- Antes da primeira revisão válida, os elementos do núcleo ainda podem ser corrigidos.
- Depois da primeira revisão válida:
  - mudar `funnel_stage` cria nova LP;
  - mudar `transaction_intent`, quando aplicável, cria nova LP;
  - mudar o significado da oferta ou do caso de uso principal cria nova LP;
  - mudar materialmente a finalidade comercial cria nova LP;
  - mero refinamento textual de `landing_page_objective` não cria nova LP;
  - atualizar detalhes factuais da mesma oferta, sem alterar seu significado, não cria nova LP.
- Não integram o núcleo imutável, por princípio:
  - nome amigável exibido no workspace;
  - copy, títulos, imagens e estrutura visual;
  - origem de tráfego e campanha;
  - canal principal de conversão;
  - WhatsApp, telefone, e-mail ou URL de destino;
  - configuração de mensuração de conversões, incluindo plataformas, mecanismos de coleta, eventos e parâmetros de mensuração;
  - detalhes atualizados da oferta que não alterem seu significado;
  - versão mais recente, versão aprovada e futura versão publicada;
  - lifecycle futuro `active | archived`.
- Revisões nunca consomem uma nova identidade de LP.
- A UX futura pode usar `LP-001 · V1`, `LP-001 · V2`, `LP-002 · V1`; evitar `1.1`, por misturar identidade da LP com revisão e sugerir versionamento decimal/semântico.
- O contrato canônico deve ser reconciliado na próxima versão do mesmo `docs/lousa-plano-base-e19-5.md`.

### 4.7. Mensuração de conversões — decisão humana confirmada

- Decisão humana confirmada em 22/08/2026: adotar **mensuração de conversões** como termo universal do LP Factory para o conceito completo e **configuração de mensuração** como termo curto para a configuração aplicável.
- O conceito cobre, sem se limitar a:
  - coleta pelo navegador, como Tag do Google, Meta Pixel e TikTok Pixel;
  - coleta servidor-a-servidor, como Conversions API da Meta e Events API do TikTok;
  - definição dos eventos e das conversões relevantes;
  - parâmetros, deduplicação, atribuição e outras regras de mensuração quando aplicáveis.
- Vocabulário de produto:
  - conceito geral: `mensuração de conversões`;
  - área ou configuração: `configuração de mensuração`;
  - ação observável do usuário: `evento`;
  - evento definido como resultado comercial relevante: `conversão` ou `evento de conversão`;
  - Google Ads: `Tag do Google + ações de conversão`;
  - Meta Ads / Instagram Ads: `Meta Pixel / Conversions API + eventos`;
  - TikTok Ads: `TikTok Pixel / Events API + eventos`.
- `Evento` e `conversão` não são sinônimos: uma ação pode ser observada como evento sem ser escolhida como conversão.
- A configuração de mensuração é operacional e não integra a identidade comercial imutável da LP.
- Trocar Pixel, tag, API, plataforma, evento, conversão ou parâmetro de mensuração não cria nova LP; eventual mudança simultânea da finalidade comercial continua regida pelo MD-14.
- A configuração aplicável a uma LP deve ser distinguida de configurações próprias da plataforma ou da conta publicitária.
- Mensuração permanece fora da primeira E19.5 reduzida.

### 4.8. Simplificação do primeiro recorte — decisão consolidada

- **Decisão humana formal em 22/08/2026: alternativa B — reduzir a primeira E19.5.**
- A decisão preserva o modelo de produto e reduz mecanismos de implementação.
- Diretrizes consolidadas para o próximo plano-base:
  - substituir precriação/backfill operacional por **handoff lazy**, salvo prova técnica de necessidade contrária no plano-base;
  - LP legada sem configuração operacional continua sendo identidade válida; a configuração E19.5 nasce quando a LP entra no fluxo operacional que precisa dela;
  - eliminar `placeholder` e `is_initialized` se o desenho lazy confirmar que não representam estado de produto necessário;
  - usar TypeScript server-side como autoridade de parsing, normalização e validação semântica; SQL protege forma persistida e invariantes de banco, sem reproduzir outro parser semântico completo;
  - o workspace principal consome identidade e resumo suficiente da LP, sem carregar o histórico completo de todas as LPs da conta;
  - histórico é carregado no contexto da LP, com paginação/completude apropriada ao consumidor;
  - manter aprovação explícita na primeira E19.5 reduzida;
  - preservar a separação conceitual entre configuração compartilhada `account/business` e configuração contextual `offer/campaign/landing_page`, sem obrigar a copiar o shape físico do #797;
  - adiar `archive/restore` para subrecorte posterior;
  - preservar código humano sequencial como direção de UX futura, sem torná-lo requisito da primeira implementação reduzida.
- Recorte de produto confirmado para consolidação:
  - conta com várias LPs;
  - identidade comercial estável;
  - configuração operacional criada somente quando necessária;
  - geração de revisões append-only;
  - preview e histórico sob demanda;
  - aprovação explícita.
- Fora da primeira entrega confirmada:
  - `archive/restore`;
  - publicação;
  - editor manual;
  - testes A/B;
  - mensuração de conversões;
  - automação nova;
  - implementação física obrigatória de código humano sequencial.

### 4.9. Invariantes preservados pela simplificação — regra transversal

- Qualquer simplificação da primeira E19.5 deve reduzir mecanismos sem fundir conceitos de produto que sustentam a evolução futura.
- Três separações são invariantes obrigatórios:
  - **identidade da LP ≠ revisão**: a LP representa o trabalho comercial estável; cada revisão representa uma evolução de conteúdo dessa mesma identidade;
  - **versão mais recente ≠ versão aprovada ≠ futura versão publicada**: gerar, aprovar e publicar são escolhas distintas e nenhuma delas deve ser inferida automaticamente da outra;
  - **configuração operacional ≠ conteúdo da revisão**: configurações vivas podem evoluir sem reescrever revisões materializadas, e cada revisão preserva o snapshot/contexto efetivamente usado na geração.
- Adiar `archive/restore`, código humano, publicação, editor, A/B ou mensuração não autoriza colapsar essas fronteiras para simplificar a primeira entrega.
- Futuros recortes de UX devem poder acrescentar essas capacidades sobre os mesmos conceitos, sem reconstruir identidade, versionamento ou histórico.
- Qualquer implementação futura que viole um desses invariantes é inválida, mesmo que reduza código ou número de estruturas.
- Esta regra define fronteira de produto; não determina por si só tabela, coluna, FK, RPC, rota, migration ou outro shape físico.

### 4.10. Decisão final de convergência — humana

- Alternativa escolhida: **B — reduzir a primeira E19.5**.
- Alternativas rejeitadas neste encerramento:
  - A — não continuar o #797 como base de implementação a ser simplificada por patches sucessivos;
  - C — não é a decisão atual; somente volta à mesa se o novo plano-base demonstrar necessidade real de desmembramento formal;
  - D — não há contradição estrutural de produto que justifique redesenho integral.
- Estratégia de execução escolhida para B:
  - concluir primeiro a consolidação documental;
  - atualizar o mesmo `docs/lousa-plano-base-e19-5.md` em nova versão, explicitamente substituindo o desenho técnico do #797;
  - criar a futura implementação a partir da `main` vigente;
  - reaproveitar seletivamente contratos, código, UI e casos de regressão do #797 somente quando continuarem aderentes;
  - não copiar estrutura física nem cherry-pickar commits completos por padrão;
  - tratar P1 de URL e P2 de completude das LPs como evidências/invariantes do novo contrato, não como patches obrigatórios do #797;
  - manter o #797 congelado até a nova versão do plano-base estar consolidada e então fechá-lo como substituído, preservando seu histórico.
- O fechamento desta matriz **não autoriza o Executor**. A próxima autoridade é a nova versão do plano-base E19.5, a ser aprovada antes da implementação.

## 5. Matriz principal

| ID | Tema | Desejo humano | Contrato atual | Implementação #797 | Complexidade indispensável | Complexidade acidental | Fragilidade conhecida | Evidência de mercado/pesquisa | Opções | Recomendação do Analista | Recomendação do Estrategista | Decisão humana | Destino |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| MD-01 | Escopo mínimo da primeira E19.5 | Provar o ciclo operacional central com menor complexidade | Workspace, configuração, histórico, geração, aprovação, archive/restore | Implementação integrada em um único PR | Identidade, configuração, geração/revisões, preview/histórico e aprovação | Archive/restore e inicialização antecipada ampliam o primeiro recorte | Recorte amplo e revisão incremental | Evidência do #797 e README favorecem menor complexidade suficiente | A / B / C / D | Convergir para redução do recorte | **B — reduzir** | **B confirmada em 22/08/2026** | consolidar no plano-base E19.5 |
| MD-02 | Configuração compartilhada × LP | Reutilizar dados sem confundir ofertas | `account/business` compartilhados; `offer/campaign/landing_page` contextuais | Duas residências e handoff | Separação conceitual entre valores compartilhados e contextuais | Precriação, placeholder e inicialização antecipada das residências | Handoff, inicialização, authority e revisão dupla | Inspeção do #797 | manter separação conceitual / rejustificar shape físico | Pendente de shape físico no plano | **Manter separação conceitual; não copiar shape físico por padrão** | **Confirmado como diretriz de B** | definir menor residência no plano-base |
| MD-03 | Bootstrap E19.2 | Não repetir onboarding | E19.2 como bootstrap write-once | Backfill + handoff + `is_initialized` | Reutilizar E19.2 uma única vez como bootstrap da primeira LP | Precriar configurações vazias, `placeholder`, `is_initialized` e backfill massivo | Placeholder, vínculo tardio e idempotência | O próprio #797 já possui handoff capaz de inserir configurações ausentes | eager / lazy | Validar compatibilidade com recortes adjacentes | **Handoff lazy** | **Confirmado como diretriz de B; shape final no plano-base** | eliminar eager se não houver dependência real |
| MD-04 | Autoridade de validação | Dados válidos sem complexidade invisível | E20.2 e runtime TypeScript são autoridade atual | Validators parcialmente reproduzidos em SQL | Validação server-side e invariantes persistentes | Dois parsers/validators semânticos independentes | Divergência URL, paleta e futuras regras | P1 atual e migration do #797 | TS canônico + SQL de invariantes / duplicação completa | Validar fronteira mínima de banco | **TypeScript server-side como autoridade semântica** | **Confirmado como diretriz de B** | detalhar invariantes SQL no plano-base |
| MD-05 | Forma canônica dos valores | UX amigável e persistência previsível | Pendente de consolidação canônica | Formas aceitas pelo parser podem divergir do SQL | Uma única forma persistida após normalização | SQL reproduzir normalização de bibliotecas | URL normalizável pode ser rejeitada pelo banco | P1 atual | normalizar antes / duplicar parser | Confirmar formas canônicas necessárias | **Normalizar server-side antes da persistência** | **Confirmado como diretriz de B** | definir forma canônica por tipo no plano-base |
| MD-06 | Lifecycle | Organizar LPs sem bloquear o ciclo central | Plano-base anterior inclui `active | archived` | RPCs e UI de archive/restore | Nenhuma capacidade de arquivamento é necessária para provar criação → geração → histórico → aprovação | `archived`, restore, lista separada e regras cruzadas na primeira entrega | Handoff em archived e estados transitórios | Inspeção do #797 | manter agora / adiar | Adiar se não bloquear evolução | **Adiar archive/restore** | **Confirmado em B** | subrecorte posterior |
| MD-07 | Aprovação | Escolher versão entregue sem publicar | Versão aprovada separada | FK e ação pelo preview | Saber qual revisão o humano escolheu como válida | Baixa complexidade relativa ao valor | Proveniência e preview válido | Contrato E19.4 + #797 | manter / adiar | Manter | **Manter aprovação** | **Confirmado em B** | primeira E19.5 reduzida |
| MD-08 | Histórico e paginação | Ver histórico correto sem carregar dados desnecessários | Revisões append-only | Lista lê materializações account-wide | Workspace precisa de resumo correto; histórico completo só na LP aberta | Carregar todo histórico de todas as LPs na lista | Truncamento PostgREST e completude | P2 e adapter atual | resumo específico / histórico sob demanda | Preservar completude por superfície | **Workspace = identidade + resumo; histórico por LP** | **Confirmado em B** | projetar leitores separados |
| MD-09 | Geração e snapshot | Nova revisão sem alterar histórico | E19.3 → E19.4 | Contexto e snapshot versionados | Preservar append-only e snapshot suficiente | Pendente de simplificação física | Compatibilidade histórica | E19.4 validada | manter | Manter | **Manter geração e revisões append-only** | **Confirmado em B** | preservar contrato central |
| MD-10 | Migração e rollout | Evoluir sem risco desproporcional | Forward-only, apply canônico, readiness | Migration ampla + preflight + gates | Somente mudanças indispensáveis ao recorte reduzido | Precriação/backfill e validação semântica duplicada | Grande superfície sem ambiente isolado | Migration #797 não aplicada | reaproveitar / reconstruir mínima | Rejustificar cada estrutura | **Nova migration mínima derivada do plano reduzido** | **Confirmado em B; shape físico no plano-base** | não copiar migration #797 por padrão |
| MD-11 | Integração E20.6.5 | Gerar somente com catálogo autorizado | Versão executável explícita e decisão humana | v5 preparada, gravação posterior | Compatibilidade com versão autorizada do catálogo | Antecipar rollout desnecessário | Ordem de rollout e fonte de versão | Contratos vigentes | manter / desacoplar | Resolver no plano-base | **Não altera a decisão B** | **Transferido à consolidação do plano-base** | definir ordem canônica antes da implementação |
| MD-12 | Compatibilidade futura | Não bloquear publicação e A/B | Apenas compatibilidade, sem implementação | Revisões imutáveis preservadas | Preservar fronteiras conceituais | Preparação técnica antecipada sem consumidor | Risco de antecipação | Invariantes 4.9 | princípio / preparação extra | Manter só princípio | **Não antecipar engine futura** | **Confirmado em B** | futuras E19.x próprias |
| MD-13 | Estratégia de implementação | Entrega compreensível e segura | Não definida na `main` | PR #797 amplo e multi-boundary | Implementação limpa e verificável | Desmontar a arquitetura atual por patches | Resíduos de mecanismos descartados | #797 tem grande superfície e migration não aplicada | continuar #797 / reconstruir da main | Preservar evidências do #797 | **Reconstruir a partir da `main` e portar seletivamente** | **Confirmado como estratégia de B** | #797 fecha como superseded após plano-base |
| MD-14 | Identidade comercial da LP | Mesma LP representa o mesmo trabalho comercial; nova finalidade, funil, intenção ou significado da oferta cria nova LP | Plano vigente define LP estável | #797 trata objetivo/funil/intenção como configuração editável | Preservar identidade estável sem confundir revisão com iniciativa | Trava literal de texto livre ou mudança irrestrita de propósito | Histórico e analytics podem misturar trabalhos distintos | Debate de produto concluído | núcleo híbrido | Pendente de shape físico | **Núcleo híbrido** | **Confirmado em 22/08/2026** | consolidar no plano-base |
| MD-15 | Código visível da LP | Identificação humana simples | UUID técnico, `name` e `slug` | #797 não implementa código humano | Valor de UX futuro | Sequência por conta, concorrência e não reutilização agora | Pode ampliar primeira entrega | Debate de simplificação | agora / adiar implementação | Preservar direção de UX | **Preservar direção; não exigir implementação física agora** | **Confirmado no recorte B** | melhoria futura de UX |
| MD-16 | Numeração das revisões | Ajustar LP existente mantém identidade e cria nova versão | `revision_number` append-only | #797 preserva revisão numérica | Separar identidade da evolução | Notação `1.1` mistura conceitos | UX confusa | Invariantes 4.9 | LP + Vn / decimal | Manter separação | **Versão permanece separada da identidade** | **Confirmado como invariante de B** | rótulo final pode evoluir com código humano |
| MD-17 | Natureza de `landing_page_objective` | Dar orientação específica sem duplicar funil/intenção/oferta/canal | Na `main`, E20.2 v4 não possui o field; plano anterior o descreve textual | #797 propõe string universal na v5 | Preservar orientação semântica | Criar taxonomia redundante | Texto livre não deve virar identificador literal | Avaliação do Estrategista | manter string / estruturar com evidência / retirar | Pendente de consolidação canônica | **Recomendação permanece string; não bloqueia B** | **Transferido ao plano-base para consolidação explícita** | decidir catálogo antes da implementação |
| MD-18 | Mensuração de conversões | Vocabulário neutro e mensuração sem alterar identidade | Fora do versionamento de conteúdo | Fora do recorte #797 | Separar identidade e mensuração | Acoplamento a fornecedor | Confusão evento/conversão | Documentação oficial Google/Meta/TikTok | padronizar / adiar implementação | Manter fora da E19.5 | **Vocabulário aprovado; implementação futura** | **Confirmado em 22/08/2026** | recorte próprio futuro |
| MD-19 | Recorte reduzido da primeira E19.5 | Provar ciclo operacional central com menor complexidade | Plano anterior mais amplo | #797 integrado | Conta com várias LPs, identidade estável, configuração quando necessária, append-only, preview/histórico e aprovação | Archive/restore, eager initialization, histórico account-wide e mecanismos não indispensáveis | Preservar trabalho útil sem carregar complexidade acidental | Inspeção focal do #797 | A / B / C / D | Reduzir | **B — reduzir** | **Confirmado formalmente em 22/08/2026** | atualizar o mesmo plano-base E19.5 e depois implementar da `main` |

## 6. Verificações técnicas por classe

### 6.1. Validação e normalização

- A decisão B encerra a necessidade de corrigir isoladamente o P1 dentro do #797.
- O novo plano-base deve:
  - inventariar os tipos efetivamente persistidos pela E19.5 reduzida;
  - definir autoridade server-side de parsing/normalização/semântica;
  - definir a forma canônica persistida;
  - limitar SQL aos invariantes de integridade realmente necessários;
  - impedir divergência material entre valor aceito pelo runtime e valor aceito pelo banco.
- P1 passa a ser caso de regressão e evidência de boundary, não patch obrigatório do #797.

### 6.2. Leituras completas

- A decisão B encerra a necessidade de fazer a lista principal carregar o histórico integral account-wide.
- O novo plano-base deve separar:
  - coleção de identidades/resumos da conta, sem truncamento silencioso;
  - detalhe/configuração da LP;
  - histórico da LP, paginado ou comprovadamente completo conforme o consumidor.
- P2 continua invariável: qualquer coleção tratada como completa precisa de paginação, limite formal ou prova equivalente de completude.
- P2 deixa de ser patch obrigatório do #797 e passa a ser requisito da nova implementação.

### 6.3. Estados e transições

- `placeholder` e `is_initialized` não são preservados por legado; somente entram no novo plano se uma necessidade real e não substituível for demonstrada.
- `archive/restore` sai da primeira entrega funcional, embora futura evolução permaneça compatível.
- A primeira E19.5 reduzida deve preservar estados derivados de UX sem multiplicar status persistidos.
- O núcleo comercial da identidade congela após a primeira revisão válida conforme 4.6.

### 6.4. Autoridades e fontes de verdade

- E19.2 permanece bootstrap/histórico e não vira fallback operacional concorrente após handoff.
- A separação conceitual entre configuração compartilhada e contextual permanece; o shape físico deve ser novamente justificado pelo plano reduzido.
- Revisão materializada continua sendo histórico imutável; configuração operacional viva não reescreve revisão.
- Não existe autorização para copiar tabelas, RPCs, revision counters, readiness ou outra estrutura do #797 sem justificativa no novo plano-base.

### 6.5. Recortes adjacentes

- O novo plano-base deve verificar impactos e dependências em:
  - E19.2;
  - E19.3;
  - E19.4;
  - E20.2 e eventual v5;
  - E20.6.5 expand/contract quando materialmente aplicável;
  - E21.2;
  - contract posterior da E19.5 somente se ainda houver consumidor real.
- Essas verificações não reabrem A/B/C/D; apenas tornam B executável com segurança.

## 7. Pesquisa externa

### 7.1. Perguntas de produto

- A pesquisa realizada foi suficiente para apoiar as decisões de identidade, versionamento e mensuração usadas nesta matriz.
- Futura pesquisa de UX pode aprofundar:
  - identificadores humanos;
  - archive/restore;
  - publicação;
  - editor;
  - experimentação;
  - mensuração.
- Nenhum desses aprofundamentos é necessário para reabrir a decisão B.

### 7.2. Perguntas técnicas

- O plano-base reduzido deve responder tecnicamente, sem copiar respostas do #797 por padrão:
  - como normalizar antes da persistência;
  - quais invariantes pertencem ao banco;
  - como garantir completude das identidades e do histórico por consumidor;
  - como realizar handoff lazy sem segunda autoridade operacional.

### 7.3. Fontes

- Priorizar documentação oficial das plataformas quando houver decisão dependente de comportamento externo.
- Para UX de mercado, usar documentação pública dos produtos analisados.
- Registrar prática, limite e aplicabilidade ao LP Factory.
- Não usar popularidade como autoridade.

## 8. Alternativas a comparar

### 8.1. Alternativa A — continuar o PR #797

- **Não escolhida.**
- Motivo: simplificações aprovadas atingem a espinha dorsal da implementação atual; desmontá-la por patches aumenta risco de resíduos e revisão sucessiva.

### 8.2. Alternativa B — reduzir a primeira E19.5

- **Escolhida por decisão humana em 22/08/2026.**
- Preservar apenas capacidades indispensáveis à validação do MVP.
- Adiar capacidades que ampliam banco, estado ou UX sem necessidade imediata.
- Preservar invariantes que mantêm abertas as evoluções futuras.
- Executar preferencialmente a partir da `main`, portando seletivamente somente partes ainda aderentes do #797.

### 8.3. Alternativa C — desmembrar sem descartar

- **Não escolhida neste encerramento.**
- Somente volta à decisão humana se o novo plano-base provar que a implementação reduzida ainda precisa ser formalmente dividida em recortes independentes para permanecer segura.
- Múltiplos commits ou PRs técnicos dentro de uma execução controlada de B não transformam automaticamente a decisão de produto em C.

### 8.4. Alternativa D — redesenhar

- **Não escolhida.**
- O modelo de produto converge; a complexidade excessiva identificada está principalmente no desenho de implementação do #797.

## 9. Critérios de decisão

### 9.1. Continuar

- Não atendido: simplificar o #797 exige remover mecanismos centrais e aumenta o risco de resíduos contratuais.

### 9.2. Reduzir

- **Atendido e escolhido.**
- A retirada de archive/restore e de mecanismos eager reduz superfície sem retirar criação/configuração, geração, histórico/preview e aprovação.
- Handoff lazy, autoridade semântica única e leitores proporcionais reduzem classes de fragilidade já observadas.
- Evoluções futuras permanecem compatíveis pelos invariantes 4.9.

### 9.3. Desmembrar

- Não demonstrado como necessário no momento.
- Se o plano-base reduzido mostrar boundaries ainda grandes demais, o desmembramento pode ser reapresentado ao humano sem reabrir o produto central.

### 9.4. Redesenhar

- Não atendido: não há evidência de que o modelo de identidade, revisão, aprovação ou configuração precise ser abandonado.

## 10. Gate de encerramento

### 10.1. Evidências obrigatórias

- **Atendido para a decisão de convergência B.**
- O #797 e seus threads provaram classes concretas de complexidade acidental: inicialização eager, duplicação semântica de validação e leitura account-wide desproporcional.
- As decisões humanas de identidade e mensuração estão registradas.
- Os invariantes necessários à evolução futura estão explicitados.
- A decisão B não exige completar todos os patches, testes ou verificações do desenho que será substituído; os detalhes físicos remanescentes passam a pertencer ao plano-base reduzido.
- MD-11 e MD-17 permanecem itens de consolidação canônica, mas não são alternativas de convergência e não reabrem A/B/C/D.

### 10.2. Saída única

- Alternativa final: **B — reduzir a primeira E19.5**.
- Próximo passo documental: atualizar o mesmo `docs/lousa-plano-base-e19-5.md` em nova versão, substituindo explicitamente o desenho técnico do #797 e preservando as decisões/invariantes desta matriz.
- Próximo passo técnico somente depois da aprovação desse plano:
  - partir da `main` vigente;
  - implementar o recorte reduzido;
  - portar seletivamente partes e regressões úteis do #797;
  - não fazer cherry-pick nem copiar estruturas físicas por padrão.
- Não produzir instrução ao Executor antes da consolidação e aprovação do novo plano-base.

### 10.3. Encerramento do artefato

- A matriz está **concluída como artefato decisório**.
- O PR #801 pode permanecer acessível como rastreabilidade até a consolidação do novo plano-base.
- Depois que o plano-base canônico incorporar materialmente as decisões desta matriz, o artefato temporário deve ser encerrado conforme o processo vigente, preservando o histórico do PR.
- O #797 permanece congelado até essa consolidação e, em seguida, deve ser fechado como substituído pela implementação reduzida.