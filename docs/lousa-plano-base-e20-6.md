# Plano-base E20.6 — V2 mínima executável do Debate 12

- Data: 12/09/2026.
- Status: V2 mínima derivada da V1 funcional aprovada; pronta para execução autônoma.
- Supervisão: Autônomo.
- Complexidade: Complexo.
- Debate autorizado: Debate 12.
- V1 imutável: commit `ffe9585f60f3b41272a1c4a14a9e8ddc756078cd`, blob `9dc5c2a613bae9a6e94f6446c8f23c60ced790e6`.
- Base técnica: `main` em `275b3c80f423ea73d85f8f82fc4a5f8babba4415`.
- Continuidade: esta V2 substitui a derivação técnica anterior, mas não altera, amplia nem reconstrói a V1 aprovada.

## 1. Resultado funcional preservado

Todo taxon novo nasce inativo. Antes de poder ser usado, um `platform_admin` compara a cobertura factual herdada da E20.2 e escolhe uma destas saídas:

1. liberar o taxon sem IA quando a herança já for suficiente;
2. pedir sugestões à IA e aceitar nenhuma, algumas ou todas;
3. acrescentar uma sugestão própria e encaminhar as mudanças aceitas ao lifecycle/versionamento já existente da E20.2.

A recomendação da IA nunca é decisão. Se houver mudança de fields, o taxon só poderá ser liberado depois da publicação canônica da nova versão E20.2 e de nova confirmação humana. Um taxon já ativo continua ativo durante reavaliações e mantém a data/versão da última revisão válida até uma decisão explícita que altere o marcador.

## 2. Mapeamento da V1 para contratos existentes

### E20.6.3 — Entrada inativa, cobertura herdada e liberação humana

- `business_taxons.is_active` é o estado existente usado para impedir o uso prematuro do taxon.
- `business_taxons.reviewed_input_catalog_version` é o marcador existente da última versão E20.2 liberada por humano.
- O catálogo aplicável é resolvido pelo registry E20.2 e pela cadeia taxonômica existente (`general -> parent -> child`) para `starter`, `lite`, `pro` e `ultra`.
- A criação administrativa ignora ativação solicitada pelo cliente e persiste o taxon como inativo.
- A liberação sem IA é uma única mutação condicional da linha de `business_taxons`: grava a versão revisada e ativa apenas taxon ainda inativo; para taxon já ativo, atualiza somente o marcador de revisão.
- A revalidação imediatamente anterior à escrita falha fechado diante de mudança de taxon, cadeia, versão executável ou marcador.
- Não há sessão, recibo, ledger, snapshot persistido, lock próprio ou RPC nova.

### E20.6.4 — Decisão humana e mudanças pela E20.2

- A interface administrativa apresenta a cobertura herdada, a fonte usada e a recomendação transitória.
- O humano pode liberar sem IA, rejeitar todas as sugestões, aceitar um subconjunto ou incluir uma sugestão própria.
- Sugestões aceitas não alteram o catálogo diretamente. Elas são encaminhadas ao fluxo existente de `landing_page_input_catalog_drafts` em `/admin/estrutura-lp?view=entradas`.
- Validação, preparação, publicação, reconciliação e versionamento permanecem integralmente sob o lifecycle E20.2 existente.
- Após a publicação, o humano retorna ao taxon e libera a nova versão corrente. Não existe segundo lifecycle E20.6.

### E20.6.5 — Avaliação opcional pela IA

- Reutiliza o workload `taxon_input_catalog_sufficiency_evaluation`, o runtime OpenAI e o contrato de Structured Output existentes.
- A reconstrução administrativa pode ler taxon inativo e pesquisa E20.5 opcional sem relaxar os consumidores operacionais, que continuam exigindo taxon ativo.
- Avaliação completa: se houver pesquisa E20.5 selecionada e válida, ela é a fonte primária e não há web search.
- Ausência legítima de E20.5: a avaliação usa web search controlada, limitada a duas chamadas.
- Pesquisa focal solicitada pelo humano: uma web search, complementada pela E20.5 quando ela existir.
- Configuração preservada: Responses API, `store: false`, timeout de 45 segundos e zero retry automático.
- O resultado e o token de decisão são transitórios; nenhuma resposta de IA é persistida como estado de negócio.

### E20.6.6 — Candidatos e sugestão própria

- Cada candidato informa field, camada E20.2 pretendida, justificativa factual e fonte.
- A interface distingue fonte E20.5, web e sugestão humana.
- O humano escolhe o subconjunto e pode editar/adicionar candidato próprio antes do encaminhamento.
- O encaminhamento é apenas insumo transitório para inicializar ou orientar o draft E20.2 existente; duplicidade, tipo, enum, requiredness e consumidores são validados pelo contrato canônico da E20.2.

### E20.6.7 — UX administrativa e encerramento

- O fluxo permanece em `/admin/taxonomia/[id]`, com continuidade explícita para `/admin/estrutura-lp?view=entradas` quando houver mudanças.
- Somente `platform_admin` lê ou executa ações E20.6.
- A tela deve funcionar em desktop e mobile, possuir labels, foco, estados de loading/erro e não depender apenas de cor.
- A conclusão exige QA Admin autenticado, Security Controls, apply canônico de migration quando aplicável, verificações SQL e reconciliação documental.

## 3. Delta técnico autorizado

O delta pode alterar somente os contratos necessários para:

- forçar criação inativa;
- permitir leitura administrativa da herança e da pesquisa opcional para taxon inativo;
- permitir liberação humana sem exigir IA nem E20.5;
- preservar a avaliação opcional com as estratégias de fonte aprovadas;
- encaminhar candidatos aceitos e sugestão própria ao lifecycle E20.2 existente;
- ajustar a UX e os validadores focais.

É proibido criar tabela, coluna, migration, RPC, fila, workflow, cron, novo workload, status de sessão, estado aberto/fechado, receipt, ledger, snapshot, lock ou lifecycle E20.6. Também permanecem fora de escopo Base Completa, Oferta, tarefas, valores concretos por conta/LP, E19.2, E19.3, E20.7 e E21.

## 4. Gates de execução

1. Confirmar que a migration existente do marcador e o lifecycle E20.2 canônico estão presentes na base.
2. Implementar primeiro o caminho determinístico de cobertura/liberação sem IA.
3. Adaptar a avaliação IA sem alterar o boundary operacional dos consumidores ativos.
4. Cobrir concorrência e falha fechada com testes determinísticos.
5. Executar `npm ci`, `npm run check`, validadores focais e `git diff --check`.
6. Publicar um único PR não-draft da nova branch após reviews materiais resolvidos e parecer final do Analista.
7. Somente após o gate autônomo competente, executar merge remoto conforme `AGENTS.md` e concluir os gates pós-merge.

## 5. Critérios de aceite

- taxon novo nunca nasce ativo;
- taxon inativo pode ser avaliado e liberado por `platform_admin` sem IA e sem E20.5;
- herança suficiente não cria camada E20.2 adicional;
- recomendação IA não altera banco nem ativa taxon;
- sugestões aceitas passam pelo draft/versionamento E20.2 existente;
- publicação de nova versão não ativa taxon automaticamente;
- taxon ativo não é desativado por reavaliação;
- fontes E20.5, web e humana ficam visualmente distintas;
- nenhuma infraestrutura ou persistência nova é introduzida;
- Security Controls, QA Admin desktop/mobile, SQL e documentação encerram a fase.
