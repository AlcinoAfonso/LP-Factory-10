# Matriz de debate — E19.5 — Convergência, simplicidade e recorte

## 0. Introdução

### 0.1. Identificação

- Documento: Matriz de debate — E19.5 — Convergência, simplicidade e recorte.
- Data: 22/08/2026.
- Estado: rascunho vivo para decisão humana.
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
- Esta matriz existe para decidir se a E19.5:
  - continua no PR #797 com correção consolidada;
  - reduz escopo;
  - é desmembrada em recortes menores;
  - ou exige redesenho estrutural.
- O documento é temporário e deve ser encerrado ou removido após a decisão e a conclusão do recorte.

## 1. Objetivo

### 1.1. Pergunta central

- A implementação atual da E19.5 representa a menor complexidade suficiente para entregar o workspace desejado pelo humano com segurança, boa UX e compatibilidade com os contratos vigentes?

### 1.2. Resultados esperados

- Confirmar o resultado de produto desejado pelo humano.
- Separar complexidade indispensável de complexidade acidental.
- Identificar fontes duplicadas de verdade e validação.
- Mapear fragilidades por classe, não comentário por comentário.
- Avaliar aderência a práticas atuais de mercado e plataforma.
- Reavaliar o tamanho correto da primeira entrega.
- Produzir uma única decisão executável e uma única instrução consolidada ao Executor.

## 2. Papéis e autoridades

### 2.1. Humano

- Define o produto desejado.
- Decide quais capacidades são indispensáveis na primeira entrega.
- Aceita ou rejeita compromissos entre simplicidade, robustez e prazo.
- Escolhe a opção final após os pareceres.

### 2.2. Estrategista

- Avalia proposta de valor, UX, clareza do lifecycle e tamanho do MVP.
- Traduz evidência de mercado em recomendação de produto.
- Recomenda manter, simplificar, adiar, dividir ou retirar capacidades.
- Não decide sozinho banco, migration ou boundary técnico.

### 2.3. Analista Macro

- Mantém a matriz e o mapa transversal do repositório.
- Verifica PR #797, `main`, planos e recortes adjacentes.
- Classifica fragilidades, dependências, conflitos e fontes de verdade.
- Compara alternativas técnicas sem executar código.
- Consolida a recomendação final para decisão humana.

### 2.4. Pesquisa externa

- Chat separado e temporário.
- Pesquisa somente práticas de mercado, UX e documentação técnica oficial.
- Usa fontes citadas e distingue prática consolidada de opinião.
- Não altera o repositório.
- Não escolhe arquitetura do projeto.
- Entrega evidência para o Estrategista e o Analista Macro.

### 2.5. Executor

- Permanece parado durante o debate.
- Só recebe uma nova instrução após a decisão humana consolidada.
- Não corrige threads isolados enquanto esta matriz estiver aberta.

## 3. Congelamento operacional

### 3.1. PR #797

- Manter em draft.
- Não executar novos patches.
- Não executar merge ou apply.
- Não criar revisão 4.
- Não gravar E20.6 v5.
- Não executar contract definitivo.
- Preservar branch, commits, testes e review threads como evidência.

### 3.2. Novo PR da matriz

- Branch sugerida: `docs/e19-5-matriz-debate-convergencia`.
- Título sugerido: `docs(E19.5): abrir matriz de convergência do PR #797`.
- Escopo inicial: somente este arquivo.
- Não alterar `README.md`, roadmap, schema, base técnica ou plano-base durante a abertura.
- Estado inicial: draft.

## 4. Critérios de avaliação

### 4.1. Produto e UX

- O comportamento corresponde ao que o humano deseja?
- O usuário entende:
  - o que é uma LP;
  - o que é configuração;
  - o que é versão mais recente;
  - o que é versão aprovada;
  - o que significa arquivar e restaurar;
  - quando uma ação chama IA?
- Existe capacidade implementada que pode ser adiada sem reduzir a validação comercial?

### 4.2. Simplicidade

- Quantas entidades, estados, RPCs, adapters e contratos são indispensáveis?
- Algum mecanismo existe apenas para compatibilizar outro mecanismo recém-criado?
- Há duplicação de regras entre TypeScript e SQL?
- Há estado implícito inferido por contadores ou efeitos colaterais?
- O runtime depende de leitura completa sem garantia de completude?

### 4.3. Robustez

- Fail-closed é aplicado onde protege dado, tenant ou autoridade?
- A migration é atômica e possui estratégia clara de falha?
- Handoff, save, archive e restore são idempotentes onde necessário?
- Snapshots preservam proveniência suficiente?
- Leitura histórica é completa e determinística?

### 4.4. Manutenção

- Uma nova versão do catálogo exigirá duplicação manual de validators?
- Novos fields exigirão alterar múltiplas autoridades?
- A solução é compreensível por outro Executor sem reconstruir todo o histórico?
- Testes cobrem invariantes por classe?

### 4.5. Aderência aos recortes adjacentes

- E19.2 permanece bootstrap da primeira jornada.
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
  - código sequencial visível ao cliente;
  - `funnel_stage`;
  - oferta ou caso de uso principal, em seu significado;
  - `transaction_intent`, quando aplicável ao taxon;
  - finalidade comercial da LP, em seu significado, sem transformar a redação literal de `landing_page_objective` em identificador.
- Antes da primeira revisão válida, esses elementos ainda podem ser corrigidos.
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
  - lifecycle `active | archived`.
- O código visível ao cliente deve ser sequencial por conta, monotônico, imutável e não reutilizável, por exemplo `LP-001`, `LP-002`, `LP-003`; o UUID técnico continua sendo a identidade interna.
- Revisões não consomem novos códigos de LP.
- A nomenclatura de UX recomendada é `LP-001 · V1`, `LP-001 · V2`, `LP-002 · V1`; evitar `1.1`, por misturar identidade da LP com revisão e sugerir versionamento decimal/semântico.
- O contrato atual precisa ser reconciliado após o encerramento da matriz porque o plano vigente e o #797 tratam objetivo, funil e intenção como configuração editável.
- A natureza de `landing_page_objective` — string livre ou campo estruturado — passa a ser decisão separada no MD-17; a decisão de identidade não autoriza usar a igualdade literal desse texto como trava.

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
- A configuração aplicável a uma LP deve ser distinguida de configurações próprias da plataforma ou da conta publicitária; a matriz não presume que toda propriedade de Google, Meta ou TikTok deva residir dentro de cada LP.
- Esta decisão estabelece vocabulário e fronteira de produto; não autoriza implementação, tracking engine, nova persistência, rota, job, automação ou infraestrutura dentro da E19.5.

### 4.8. Simplificação do primeiro recorte — recomendação do Estrategista

- A inspeção do #797 confirma que as maiores oportunidades de simplificação estão em mecanismos estruturais, não em pequenos cortes de UX.
- Recomendação provisória de alternativa:
  - **B — reduzir a primeira E19.5** passa a ser a alternativa líder do Estrategista;
  - **C — desmembrar sem descartar** permanece válida se a melhor forma de reaproveitar o trabalho do #797 exigir extração em recortes menores;
  - **A — continuar o #797 praticamente como está** perde força porque preserva mecanismos cuja necessidade não está demonstrada;
  - **D — redesenhar** não está justificada neste momento, pois o modelo de produto permanece coerente e o excesso identificado está principalmente na implementação.
- Recomendações de simplificação a decidir na matriz:
  - substituir precriação/backfill operacional por **handoff lazy**, se a verificação técnica confirmar que nenhum contrato vigente exige materialização antecipada;
  - nesse desenho, LP legada sem configuração operacional continua sendo identidade válida e a configuração E19.5 só nasce quando a LP realmente entra no fluxo do workspace; LP nova cria sua configuração quando criada no fluxo operacional;
  - eliminar `placeholder` e `is_initialized` como estados técnicos se o handoff lazy tornar ambos desnecessários;
  - manter TypeScript server-side como autoridade de parsing, normalização e validação semântica; o banco recebe forma canônica e protege integridade persistente, tenant, FK, atomicidade e demais invariantes indispensáveis, sem reproduzir outro parser semântico completo;
  - fazer o workspace principal consumir identidade e resumo suficiente da LP, sem depender do histórico completo de todas as LPs da conta;
  - carregar histórico completo somente no contexto da LP, com paginação/completude apropriada à superfície consumidora;
  - manter aprovação na primeira E19.5, porque responde qual revisão o humano escolheu como válida;
  - manter separadas configuração compartilhada `account/business` e configuração contextual `offer/campaign/landing_page`, simplificando sua inicialização em vez de fundir responsabilidades;
  - adiar `archive/restore` para subrecorte posterior, porque amplia lifecycle, transições, RPCs e casos de erro sem ser necessário para provar o ciclo central da primeira E19.5;
  - preservar `LP-001` como direção de UX, mas considerar adiar sua implementação física se a decisão final priorizar a máxima redução técnica da primeira entrega.
- Recorte de produto recomendado para teste de convergência:
  - conta com várias LPs;
  - identidade comercial estável;
  - configuração operacional criada somente quando necessária;
  - geração de revisões append-only;
  - preview e histórico sob demanda;
  - aprovação explícita.
- Fora da primeira entrega recomendada:
  - `archive/restore`;
  - publicação;
  - editor manual;
  - testes A/B;
  - mensuração de conversões;
  - automação nova;
  - código humano sequencial, somente se a decisão humana optar pela redução técnica máxima.
- Esta seção registra recomendação de produto e simplificação; não autoriza alteração de banco, migration, rota, boundary ou implementação enquanto a matriz estiver aberta.

## 5. Matriz principal

| ID | Tema | Desejo humano | Contrato atual | Implementação #797 | Complexidade indispensável | Complexidade acidental | Fragilidade conhecida | Evidência de mercado/pesquisa | Opções | Recomendação do Analista | Recomendação do Estrategista | Decisão humana | Destino |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| MD-01 | Escopo mínimo da primeira E19.5 | Pendente de reconfirmação | Workspace, configuração, histórico, geração, aprovação, archive/restore | Implementação integrada em um único PR | Preservar identidade, configuração, geração/revisões, preview/histórico e aprovação | Archive/restore e mecanismos de inicialização antecipada podem ampliar o primeiro recorte sem provar valor central | Recorte amplo e revisão incremental | Pendente | manter / reduzir / dividir | Pendente | **B — reduzir é a alternativa líder; C permanece fallback se o reaproveitamento exigir extração** | Pendente | manter / simplificar / dividir / adiar / retirar |
| MD-02 | Configuração compartilhada × LP | Reutilizar dados sem confundir ofertas | `account/business` compartilhados; `offer/campaign/landing_page` contextuais | Duas residências e handoff | Separação conceitual entre valores compartilhados e contextuais | Precriação, placeholder e inicialização antecipada das duas residências | Handoff, inicialização, authority e revisão dupla | Pendente | manter / simplificar | Pendente | **Manter duas responsabilidades; simplificar inicialização e evitar fundi-las apenas para reduzir número de estruturas** | Pendente | manter separação; simplificar mecanismo |
| MD-03 | Bootstrap E19.2 | Não repetir onboarding | E19.2 como bootstrap write-once | Backfill + handoff + `is_initialized` | Reutilizar E19.2 uma única vez como bootstrap da primeira LP | Precriar configurações vazias, `placeholder`, `is_initialized` e backfill massivo antes de uso real | Placeholder, vínculo tardio e idempotência | O próprio #797 já possui handoff capaz de inserir configurações ausentes e o fluxo chama handoff antes do workspace | eager / lazy / outro contrato | Pendente | **Preferir handoff lazy se tecnicamente compatível; eliminar precriação/backfill operacional, placeholder e `is_initialized` quando deixarem de ser necessários** | Pendente | confirmar viabilidade técnica antes da decisão final |
| MD-04 | Autoridade de validação | Dados válidos sem complexidade invisível | E20.2 e runtime TypeScript são autoridade atual | Validators parcialmente reproduzidos em SQL | Validação server-side e invariantes persistentes | Dois parsers/validators semânticos independentes | Divergência URL, paleta e futuras regras | A migration do #797 reproduz em SQL catálogo, scopes, enums, URL, e-mail, listas, faixa, asset e contraste | TS canônico + forma normalizada / duplicação completa / validação por camadas | Pendente | **TypeScript server-side como autoridade de parsing/normalização/semântica; SQL protege forma canônica e invariantes de banco** | Pendente | reconciliar fronteira antes de qualquer correção do P1 |
| MD-05 | Forma canônica dos valores | UX amigável e persistência previsível | Pendente | Valores podem chegar em formas aceitas pelo parser | Uma única forma persistida após normalização server-side | Persistir formas múltiplas ou exigir que SQL reproduza normalização de bibliotecas TypeScript | SQL pode rejeitar valor normalizável | Caso atual de URL mostra divergência entre `new URL()` e regex SQL | normalizar antes / restringir input / ampliar SQL | Pendente | **Normalizar e validar server-side antes da persistência; banco recebe forma canônica e não tenta reproduzir parser semântico completo** | Pendente | definir forma canônica por tipo na reconciliação técnica |
| MD-06 | Lifecycle | Arquivar sem perder e restaurar facilmente | `active | archived`; `draft` transitório | RPCs e UI de archive/restore | Nenhuma capacidade de arquivamento é necessária para provar criação → geração → histórico → aprovação | `archived`, restore, lista separada e regras cruzadas de mutação na primeira entrega | Handoff em archived e estados transitórios | Pendente | manter / reduzir | Pendente | **Adiar archive/restore para subrecorte posterior** | Pendente | candidato forte a adiar |
| MD-07 | Aprovação | Escolher versão entregue sem publicar | Versão aprovada separada | FK e ação pelo preview | Saber qual revisão o humano escolheu como válida | Pendente | Proveniência e preview válido | Pendente | manter agora / adiar | Pendente | **Manter aprovação na primeira E19.5** | Pendente | manter agora |
| MD-08 | Histórico e paginação | Ver todo histórico corretamente | Revisões append-only | Lista do workspace lê todas as materializações da conta para derivar latest/aprovada; LPs ainda sob análise | Workspace precisa de resumo correto; histórico completo é necessário apenas na LP aberta | Carregar todo o histórico de todas as LPs para montar a lista principal | Truncamento PostgREST e completude | O adapter atual lê todas as materializações account-wide para derivar apenas latest e approved | resumo específico / histórico sob demanda / limitar formalmente | Pendente | **Workspace lê identidade + resumo; histórico é carregado por LP sob demanda; identidades da conta continuam sem truncamento silencioso** | Pendente | simplificar leitor principal e preservar completude por superfície |
| MD-09 | Geração e snapshot | Nova revisão sem alterar histórico | E19.3 → E19.4 | Contexto v4 e snapshot v2 | Preservar append-only e snapshot suficiente | Pendente | Duas revisões de configuração e compatibilidade histórica | Pendente | manter / extrair | Pendente | **Manter geração e revisões append-only no recorte central** | Pendente | manter |
| MD-10 | Migração e rollout | Evoluir sem risco desproporcional | Forward-only, apply canônico, readiness | Migration ampla + preflight + gates | Somente mudanças indispensáveis ao recorte final escolhido | Precriação/backfill e validação semântica duplicada podem ampliar superfície da migration | Ausência de ambiente isolado e grande superfície | A migration atual concentra configuração, backfill, validators, lifecycle, aprovação e readiness | manter / dividir migration / lazy migration | Pendente | **Reavaliar migration após fechar handoff lazy e fronteira TS×SQL; evitar preservar operações que existam apenas para o desenho eager** | Pendente | decidir após MD-03/04/05/06 |
| MD-11 | Integração E20.6.5 | Gerar somente com catálogo autorizado | Versão executável explícita e decisão humana | v5 preparada, gravação posterior | Pendente | Pendente | Ordem de rollout e fonte de versão | Pendente | manter / desacoplar | Pendente | Pendente | Pendente | Pendente |
| MD-12 | Compatibilidade futura | Não bloquear publicação e A/B | Apenas compatibilidade, sem implementação | Revisões imutáveis preservadas | Preservar revisões identificáveis sem implementar engine futura | Preparação técnica antecipada sem consumidor atual | Risco de antecipação | Pendente | manter princípio / remover qualquer preparação extra | Pendente | **Manter somente o princípio de compatibilidade; não antecipar publicação, A/B ou mensuração** | Pendente | manter princípio |
| MD-13 | Tamanho do PR | Entrega compreensível e segura | Não definido | PR amplo e multi-boundary | Uma entrega com fronteiras finitas e verificáveis | PR de 40 arquivos concentra inicialização, validação, lifecycle, histórico, aprovação e rollout | Descoberta sucessiva de invariantes | Inspeção confirma complexidade estrutural concentrada em migration e adapter account-wide | continuar / extrair / substituir | Pendente | **B lidera; usar C se a forma mais segura de reaproveitar o #797 for extrair recortes menores** | Pendente | reduzir ou dividir, não continuar por inércia |
| MD-14 | Identidade comercial da LP | Mesma LP representa o mesmo trabalho comercial; nova finalidade, funil, intenção ou significado da oferta cria nova LP, enquanto refinamentos preservam a identidade | Plano vigente define LP estável, mas permite alterar `landing_page_objective` e incorporar a mudança em nova revisão | #797 trata objetivo/funil/intenção como configuração operacional editável | Preservar identidade estável sem confundir revisão com nova iniciativa comercial | Trava literal de texto livre ou, no extremo oposto, permitir mudança de propósito sob a mesma LP | Histórico e analytics podem misturar trabalhos comerciais distintos; trava excessiva pode multiplicar LPs por simples redação | Pendente | travar após V1 / manter mutável / núcleo híbrido | Pendente | **Núcleo híbrido: travar dimensões estruturais e significado comercial; não travar literalmente a redação de `landing_page_objective`** | **Confirmado em 22/08/2026** | reconciliar plano e implementação após encerramento da matriz |
| MD-15 | Código visível da LP | Cada LP deve ter código sequencial por conta, imutável e não reutilizável (`LP-001`, `LP-002`...) | Hoje existe UUID técnico, `name` e `slug`; não existe código sequencial visível | #797 não implementa código humano estável | Identificação simples para cliente e suporte | Implementação física agora exige sequência por conta, concorrência segura e não reutilização | Ambiguidade entre identidade e revisão | Pendente | código sequencial agora / preservar UX e adiar implementação / UUID+nome | Recomendação preliminar: código sequencial por conta | **Preservar `LP-001` como direção de UX; adiar implementação física se a decisão final priorizar redução técnica máxima** | **Preliminar: adotar código sequencial por conta** | decisão humana pendente sobre momento da implementação |
| MD-16 | Numeração das revisões | Ajustar LP existente mantém o mesmo código e cria nova versão | Revisões já são append-only por `revision_number` | #797 preserva revisão numérica por LP | Separar identidade da LP de sua evolução | Notação `1.1` mistura os conceitos | UX confusa e futura ambiguidade | Pendente | `LP-001 · V2` / `1.1` / outro | Recomendação preliminar: `LP-001 · Vn` | **Preservar versão separada da identidade, independentemente de o código humano entrar agora ou depois** | **Preliminar: não usar `1.1`; usar LP + versão separadas** | refletir em UX e documentação se confirmado |
| MD-17 | Natureza de `landing_page_objective` | Dar à geração uma orientação específica da página sem duplicar funil, intenção comercial, oferta ou canal | Na `main`, E20.2 vai até v4 e não possui esse field; o plano E19.5 o descreve como objetivo humano textual | #797 propõe E20.2 v5 com `landing_page_objective` universal, `string`, scope `landing_page`, origem humana, obrigatório e validação `type_only` | Preservar orientação semântica útil para a geração | Criar uma segunda taxonomia estruturada que sobreponha `funnel_stage`, `transaction_intent`, oferta ou canal apenas para tornar o objetivo comparável | Texto livre não deve virar identificador literal; enum redundante pode criar contradições e manutenção sem valor comprovado | Pendente | manter string / estruturar somente com taxonomia ortogonal comprovada / retirar | Pendente | **Manter string na primeira E19.5 e fora da trava literal de identidade; estruturar apenas se surgir taxonomia recorrente, estável e ortogonal aos campos existentes** | Pendente | decidir antes de reconciliar E20.2 v5 e o contrato do #797 |
| MD-18 | Mensuração de conversões | Usar vocabulário neutro de plataforma e permitir que a mesma LP evolua sua mensuração sem perder identidade | O plano E19.5 já afirma que tracking, analytics, Google Ads tag, Meta Pixel e equivalentes não pertencem ao versionamento de conteúdo | #797 não implementa mensuração de conversões; tracking e analytics permanecem fora do recorte | Separar identidade comercial, conteúdo e configuração operacional de mensuração | Tratar `Pixel` como conceito geral, chamar todo evento de conversão ou presumir que toda configuração da plataforma pertença individualmente à LP | Acoplamento a fornecedor, confusão entre evento e conversão e criação indevida de nova LP por alteração operacional | Documentação oficial atual converge para medição/ações de conversão no Google e mecanismos de eventos browser/server em Meta e TikTok | vocabulário neutro / termos por fornecedor / adiar padronização | Pendente | **Adotar `mensuração de conversões` e `configuração de mensuração`; distinguir evento de conversão; manter mensuração fora da identidade; separar configuração aplicável à LP de configuração própria da plataforma** | **Confirmado em 22/08/2026** | preservar princípio e vocabulário; qualquer implementação futura exige escopo próprio e consumidor real |
| MD-19 | Recorte reduzido da primeira E19.5 | Provar o ciclo operacional central com a menor complexidade suficiente | Plano vigente inclui workspace, configuração, histórico, geração, aprovação e archive/restore | #797 implementa tudo de forma integrada | Conta com várias LPs, identidade estável, configuração quando necessária, geração append-only, preview/histórico sob demanda e aprovação | Archive/restore, eager initialization, histórico account-wide e outras capacidades não indispensáveis podem ser removidos do primeiro corte | Preservar trabalho útil do #797 sem carregar complexidade acidental | Inspeção focal do #797 confirma que handoff já sabe criar configurações ausentes e que a lista principal lê mais histórico do que precisa | A / B / C / D | Pendente | **B — reduzir é a recomendação líder; C somente se necessário para extrair com segurança o trabalho reaproveitável** | Pendente | decisão humana final após fechamento das classes técnicas |

## 6. Verificações técnicas por classe

### 6.1. Validação e normalização

- Inventariar todos os fields da E20.2 v5.
- Para cada field, registrar:
  - validator TypeScript;
  - validação adicional do resolver;
  - predicado SQL;
  - normalização aceita;
  - forma persistida;
  - divergência material ou equivalência.
- Decidir uma única autoridade de parsing e uma única forma canônica.
- Testar a recomendação de TypeScript server-side como autoridade semântica e SQL restrito à forma canônica e aos invariantes persistentes indispensáveis; não assumir que isso autoriza reduzir constraints antes da análise técnica.

### 6.2. Leituras completas

- Inventariar todas as coleções usadas pela E19.5:
  - LPs da conta;
  - configurações por LP;
  - materializações da conta;
  - histórico de uma LP;
  - outras listas tratadas como completas.
- Para cada leitura, registrar:
  - paginação;
  - limite formal;
  - ordenação total;
  - prova de completude;
  - comportamento em erro.
- Confirmar que o workspace principal não dependa do histórico completo de todas as LPs quando precisa apenas de identidade e resumo.
- Preservar ausência de truncamento silencioso para a coleção de identidades da conta, mesmo que a UX use paginação, cursor ou carregamento progressivo.
- Carregar histórico integral somente na superfície que realmente o consome, com completude e paginação próprias.

### 6.3. Estados e transições

- Mapear:
  - placeholder;
  - inicializada;
  - draft transitório;
  - active;
  - archived;
  - mais recente;
  - aprovada.
- Distinguir estados exigidos pelo produto de estados criados apenas pelo desenho atual do #797.
- Verificar se `placeholder` e `is_initialized` podem desaparecer integralmente com handoff lazy; não preservá-los apenas porque já foram implementados.
- Confirmar que nenhum estado é inferido por contador ou efeito colateral.
- Separar explicitamente identidade da LP de revisão de conteúdo.
- Confirmar o momento de congelamento do núcleo da identidade: antes da primeira revisão válida pode haver correção; depois dela, mudança de `funnel_stage`, `transaction_intent`, significado da oferta/caso de uso ou finalidade comercial cria nova LP, sem usar a redação literal de `landing_page_objective` como comparação de identidade.
- Verificar que código sequencial visível ao cliente não substitui UUID técnico nem é reutilizado após arquivamento.
- Se `archive/restore` for adiado, separar os estados necessários ao rollout técnico dos estados que realmente precisam ser expostos como capacidade de produto na primeira entrega.

### 6.4. Autoridades e fontes de verdade

- Mapear:
  - conta e membership;
  - taxon;
  - catálogo;
  - dados autoritativos;
  - configuração compartilhada;
  - configuração da LP;
  - revisão de conteúdo;
  - versão aprovada;
  - versão E20.2 revisada;
  - workload OpenAI.
- Confirmar que não existe leitor ou escritor concorrente.
- Preservar a distinção conceitual entre futura configuração de mensuração aplicável à LP e configurações próprias das plataformas/contas publicitárias; nenhuma delas integra a identidade comercial da LP por efeito desta matriz.
- Confirmar que E19.2 possa permanecer bootstrap/histórico sem se tornar fallback operacional concorrente após a criação lazy da configuração E19.5.

### 6.5. Recortes adjacentes

- Verificar impactos e dependências em:
  - E19.2;
  - E19.3;
  - E19.4;
  - E20.2 v5;
  - E20.6.5 expand/contract;
  - E21.2;
  - contract posterior da E19.5.

## 7. Pesquisa externa

### 7.1. Perguntas de produto

- Como produtos maduros distinguem identidade da página, versão, publicação, aprovação e arquivamento?
- Como produtos maduros tratam atributos que definem o propósito de uma página: objetivo, estágio do funil, oferta/caso de uso e intenção comercial?
- Como produtos SaaS expõem identificadores humanos estáveis para páginas/ativos e separam esses identificadores da numeração de versões?
- Qual é a UX mínima compreensível para um workspace de páginas em um SaaS inicial?
- Quais capacidades costumam ser adiadas para evitar transformar workspace em editor/publicação/experimentos?

### 7.2. Perguntas técnicas

- Como separar parsing/normalização da validação de invariantes no banco?
- Como validar migrations e backfills sem duplicar toda a lógica da aplicação?
- Como garantir completude de coleções em PostgREST/Supabase?
- Como preservar evolução futura para publicação e testes A/B sem antecipar uma engine?

### 7.3. Fontes

- Priorizar documentação oficial das plataformas.
- Para UX de mercado, usar documentação pública dos produtos analisados.
- Registrar data, link, prática observada, limite e aplicabilidade ao LP Factory.
- Não usar popularidade como autoridade.

## 8. Alternativas a comparar

### 8.1. Alternativa A — continuar o PR #797

- Preservar implementação atual.
- Corrigir somente classes de fragilidade integralmente inventariadas.
- Exigir uma única revisão consolidada antes do merge.

### 8.2. Alternativa B — reduzir a primeira E19.5

- Preservar apenas capacidades indispensáveis à validação do MVP.
- Adiar capacidades que ampliam banco, estado, UX ou integração sem necessidade imediata.
- A evolução posterior permanece compatível.
- Recomendação provisória do Estrategista: alternativa líder após a inspeção de handoff, validação duplicada, leitura account-wide de materializações e archive/restore.

### 8.3. Alternativa C — desmembrar sem descartar

- Preservar branch, testes e decisões do #797.
- Fechar #797 como substituído.
- Extrair recortes menores:
  - persistência, inicialização e handoff;
  - workspace, histórico e lifecycle;
  - geração, snapshot e aprovação;
  - integração e QA.
- Recomendação provisória do Estrategista: usar se a redução desejada não puder ser obtida com uma reconciliação segura e compreensível do trabalho existente.

### 8.4. Alternativa D — redesenhar

- Aplicável somente se o modelo atual contrariar o produto desejado ou criar fontes de verdade irreconciliáveis.
- Não significa apagar evidências, testes ou histórico.
- Recomendação provisória do Estrategista: não justificada no estado atual; o produto converge e a complexidade excessiva está principalmente no desenho de implementação.

## 9. Critérios de decisão

### 9.1. Continuar

- O modelo central corresponde ao desejo humano.
- Não existem fontes de verdade concorrentes.
- As fragilidades restantes são finitas e classificadas.
- A correção não exige nova residência ou reescrita ampla.
- Os testes podem provar os invariantes por classe.

### 9.2. Reduzir

- Parte do escopo não é indispensável para validar ou vender.
- A retirada reduz significativamente banco, estados ou UX.
- A evolução posterior permanece compatível.
- O handoff lazy, a autoridade única de parsing/normalização, o resumo do workspace e o adiamento de archive/restore reduzem complexidade sem retirar o ciclo central de criação, geração, histórico e aprovação.

### 9.3. Desmembrar

- O mesmo PR continua exigindo mudanças em múltiplas autoridades.
- Validação ou rollout dependem de duplicações frágeis.
- Novos bugs continuam surgindo por classes não inventariadas.
- A revisão não consegue provar o conjunto de invariantes de forma finita.

### 9.4. Redesenhar

- O modelo não representa o produto desejado.
- A migração não pode ser executada com segurança proporcional.
- A implementação exige fontes paralelas de verdade.
- A manutenção futura exigirá sincronização manual permanente de contratos extensos.

## 10. Gate de encerramento

### 10.1. Evidências obrigatórias

- Matriz principal preenchida.
- Verificação técnica por classe concluída.
- Pesquisa externa concluída e citada.
- Parecer do Analista Macro.
- Parecer do Estrategista.
- Decisões humanas registradas.

### 10.2. Saída única

- Escolher uma alternativa.
- Atualizar somente os documentos canônicos materialmente afetados.
- Produzir uma única instrução completa ao Executor contendo:
  - o que implementar;
  - o que preservar;
  - o que testar;
  - quando parar;
  - gate final.

### 10.3. Encerramento do artefato

- A matriz é temporária.
- Após a conclusão definitiva do recorte:
  - remover ou encerrar o artefato conforme o processo vigente;
  - preservar a rastreabilidade no histórico do PR.