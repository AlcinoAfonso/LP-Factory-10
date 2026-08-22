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

## 5. Matriz principal

| ID | Tema | Desejo humano | Contrato atual | Implementação #797 | Complexidade indispensável | Complexidade acidental | Fragilidade conhecida | Evidência de mercado/pesquisa | Opções | Recomendação do Analista | Recomendação do Estrategista | Decisão humana | Destino |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| MD-01 | Escopo mínimo da primeira E19.5 | Pendente de reconfirmação | Workspace, configuração, histórico, geração, aprovação, archive/restore | Implementação integrada em um único PR | Pendente | Pendente | Recorte amplo e revisão incremental | Pendente | manter / reduzir / dividir | Pendente | Pendente | Pendente | manter / simplificar / dividir / adiar / retirar |
| MD-02 | Configuração compartilhada × LP | Reutilizar dados sem confundir ofertas | `account/business` compartilhados; `offer/campaign/landing_page` contextuais | Duas residências e handoff | Pendente | Pendente | Handoff, inicialização, authority e revisão dupla | Pendente | manter / simplificar | Pendente | Pendente | Pendente | Pendente |
| MD-03 | Bootstrap E19.2 | Não repetir onboarding | E19.2 como bootstrap write-once | Backfill + handoff + `is_initialized` | Pendente | Pendente | Placeholder, vínculo tardio e idempotência | Pendente | eager / lazy / outro contrato | Pendente | Pendente | Pendente | Pendente |
| MD-04 | Autoridade de validação | Dados válidos sem complexidade invisível | E20.2 e runtime TypeScript são autoridade atual | Validators parcialmente reproduzidos em SQL | Pendente | Pendente | Divergência URL, paleta e futuras regras | Pendente | TS canônico + forma normalizada / duplicação completa / validação por camadas | Pendente | Pendente | Pendente | Pendente |
| MD-05 | Forma canônica dos valores | UX amigável e persistência previsível | Pendente | Valores podem chegar em formas aceitas pelo parser | Pendente | Pendente | SQL pode rejeitar valor normalizável | Pendente | normalizar antes / restringir input / ampliar SQL | Pendente | Pendente | Pendente | Pendente |
| MD-06 | Lifecycle | Arquivar sem perder e restaurar facilmente | `active | archived`; `draft` transitório | RPCs e UI de archive/restore | Pendente | Pendente | Handoff em archived e estados transitórios | Pendente | manter / reduzir | Pendente | Pendente | Pendente | Pendente |
| MD-07 | Aprovação | Escolher versão entregue sem publicar | Versão aprovada separada | FK e ação pelo preview | Pendente | Pendente | Proveniência e preview válido | Pendente | manter agora / adiar | Pendente | Pendente | Pendente | Pendente |
| MD-08 | Histórico e paginação | Ver todo histórico corretamente | Revisões append-only | Paginação de materializações; LPs ainda sob análise | Pendente | Pendente | Truncamento PostgREST e completude | Pendente | paginar / limitar formalmente / consulta específica | Pendente | Pendente | Pendente | Pendente |
| MD-09 | Geração e snapshot | Nova revisão sem alterar histórico | E19.3 → E19.4 | Contexto v4 e snapshot v2 | Pendente | Pendente | Duas revisões de configuração e compatibilidade histórica | Pendente | manter / extrair | Pendente | Pendente | Pendente | Pendente |
| MD-10 | Migração e rollout | Evoluir sem risco desproporcional | Forward-only, apply canônico, readiness | Migration ampla + preflight + gates | Pendente | Pendente | Ausência de ambiente isolado e grande superfície | Pendente | manter / dividir migration / lazy migration | Pendente | Pendente | Pendente | Pendente |
| MD-11 | Integração E20.6.5 | Gerar somente com catálogo autorizado | Versão executável explícita e decisão humana | v5 preparada, gravação posterior | Pendente | Pendente | Ordem de rollout e fonte de versão | Pendente | manter / desacoplar | Pendente | Pendente | Pendente | Pendente |
| MD-12 | Compatibilidade futura | Não bloquear publicação e A/B | Apenas compatibilidade, sem implementação | Revisões imutáveis preservadas | Pendente | Pendente | Risco de antecipação | Pendente | manter princípio / remover qualquer preparação extra | Pendente | Pendente | Pendente | Pendente |
| MD-13 | Tamanho do PR | Entrega compreensível e segura | Não definido | PR amplo e multi-boundary | Pendente | Pendente | Descoberta sucessiva de invariantes | Pendente | continuar / extrair / substituir | Pendente | Pendente | Pendente | Pendente |

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

### 6.3. Estados e transições

- Mapear:
  - placeholder;
  - inicializada;
  - draft transitório;
  - active;
  - archived;
  - mais recente;
  - aprovada.
- Confirmar que nenhum estado é inferido por contador ou efeito colateral.

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

### 8.3. Alternativa C — desmembrar sem descartar

- Preservar branch, testes e decisões do #797.
- Fechar #797 como substituído.
- Extrair recortes menores:
  - persistência, inicialização e handoff;
  - workspace, histórico e lifecycle;
  - geração, snapshot e aprovação;
  - integração e QA.

### 8.4. Alternativa D — redesenhar

- Aplicável somente se o modelo atual contrariar o produto desejado ou criar fontes de verdade irreconciliáveis.
- Não significa apagar evidências, testes ou histórico.

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
