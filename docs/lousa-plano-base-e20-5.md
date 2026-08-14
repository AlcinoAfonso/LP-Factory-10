# Plano-base E20.5 — Seleção da pesquisa integral `end_customer` por taxon

- Data: 14/08/2026.
- Versão: v1.
- Status: plano-base v1 consolidado para avaliação única dos especialistas; execução ainda não autorizada.
- Recorte previsto para roadmap: `20.5 — Seleção da pesquisa integral end_customer por taxon`.
- Path canônico: `docs/lousa-plano-base-e20-5.md`.
- Processo: `docs/prompt-estrategista.md` v29.
- Plano conceitual: `docs/lp-planejamento.md`, preservado como contexto; a decisão humana de 14/08/2026 redefine somente os critérios anteriores à E19.3 tratados neste recorte.

## 1. Estado e decisões fixas

### 1.1. Problema e resultado esperado

- O repositório já possui pesquisas integrais arquivadas em `docs/pesquisas-brutas/<taxon_slug>/<audience_scope>/vN.md`, mas arquivamento não representa aprovação nem existe hoje um contrato mínimo que identifique qual versão integral `end_customer` está autorizada para um taxon.
- A pesquisa integral deve permanecer imutável no GitHub e separada da E10.8, que continua responsável pelas pesquisas estruturadas já existentes.
- O resultado deste recorte é permitir que um taxon ativo possua exatamente uma versão integral `end_customer` explicitamente selecionada por decisão humana autorizada e que essa versão possa ser lida integralmente por um boundary server-side, com validação de identidade e falha fechada.
- Este recorte resolve somente a seleção e a disponibilidade autorizada da pesquisa integral. O taxon ainda não está preparado para geração até a avaliação da E20.2 prevista na E20.6.

### 1.2. Identificação formal do recorte

- A E20 é o caso macro vigente para preparação e liberação de taxons.
- `E20.4` permanece reservada no planejamento conceitual para disponibilidade comercial por `taxon + plano` e não pertence a este trabalho.
- `E20.1` não integra o desenho histórico materializado da E20 e não será retropreenchida.
- O primeiro identificador livre que preserva as decisões já registradas é `E20.5`.
- A E19.3 permanece consumidora posterior; este plano não altera seu contrato, código, documento ou roadmap próprio.

### 1.3. Decisões fixas de versionamento e aprovação

- O path canônico da pesquisa integral é `docs/pesquisas-brutas/<taxon_slug>/end_customer/vN.md`.
- Cada versão preserva no mínimo `taxon_slug`, `audience_scope`, `research_version`, conteúdo integral, fontes, evidências, inferências, condições, exceções e limitações.
- Arquivar `vN` não aprova `vN`.
- Nova versão nunca substitui automaticamente a selecionada.
- Não existe fallback para a maior versão, para a mais recente, para a única versão encontrada ou para qualquer heurística equivalente.
- A seleção final é uma decisão humana autorizada; a IA pode apoiar a avaliação, mas não selecionar, trocar ou aprovar autonomamente uma versão.
- `business_buyer` não participa deste gate e não deve ser produzido ou exigido por este recorte.
- Uma pesquisa rejeitada permanece arquivada sem alterar a seleção vigente.

### 1.4. Persistência mínima

- `business_taxons` permanece a identidade canônica do taxon.
- A extensão mínima prevista é `selected_end_customer_research_version integer null`.
- A coluna deve possuir check positivo quando preenchida: `selected_end_customer_research_version IS NULL OR selected_end_customer_research_version > 0`.
- `NULL` significa ausência de versão integral `end_customer` selecionada.
- O path não é persistido; deriva exclusivamente de `taxon.slug + audience_scope fixo end_customer + version`.
- Não criar status de aprovação, lifecycle, data, aprovador, histórico, tabela ou entidade adicional.

### 1.5. Solução física preservada

- O runtime não consulta GitHub API para obter a pesquisa.
- A leitura usa o padrão repo-only já comprovado no projeto com `node:fs/promises`, `process.cwd()` e confinamento de path.
- O arquivo deve estar incluído no bundle necessário do deploy pelo mecanismo vigente de `outputFileTracingIncludes`, no menor escopo de runtime que consumir o boundary; não criar tracing global por conveniência.
- A leitura valida antes de devolver conteúdo:
  - taxon existente e ativo;
  - versão selecionada positiva;
  - arquivo existente;
  - `taxon_slug` exatamente igual ao slug canônico do taxon;
  - `audience_scope = end_customer`;
  - `research_version` exatamente igual à versão selecionada.
- Falha de leitura ou metadata incompatível produz falha fechada e nunca conteúdo parcial.
- Não criar RAG, chunking, embeddings, cache remoto, serviço de arquivos ou infraestrutura nova.

### 1.6. Fontes obrigatórias usadas na v1

- `README.md`.
- `docs/roadmap.md`.
- `docs/template-roadmap.md`.
- `docs/prompt-estrategista.md`.
- `docs/lp-planejamento.md`.
- `docs/schema.md`.
- `docs/lousa-plano-base-e10-8.md`.
- `docs/lousa-plano-base-e20-2.md`.
- `docs/prompt-nicho-arquivamento-pesquisa.md`.
- `docs/pesquisas-brutas/corretor-imoveis/end_customer/v1.md`, somente como prova do formato físico atual, sem editar ou promover seu conteúdo automaticamente.
- `lib/admin/readRepoDoc.ts`, como precedente de leitura repo-only confinada.
- `next.config.js`, como precedente de tracing explícito de documentos repo-only.
- `lib/admin/adapters/adminTaxonomyAdapter.ts` e `app/admin/(protected)/taxonomia/actions.ts`, como superfície e boundary administrativos existentes para mutações de taxon protegidas por `platform_admin`.

## 2. Contrato do caso

### 2.1. Fluxo operacional

- Gatilho:
  - decisão humana explícita de selecionar uma versão integral `end_customer` já arquivada para um taxon.
- Entrada:
  - `taxon_id` existente;
  - `research_version` inteira positiva escolhida pelo humano autorizado.
- Processamento:
  - reutilizar o gate `platform_admin` da Taxonomia;
  - carregar a identidade canônica do taxon e exigir `is_active = true`;
  - derivar o path seguro pelo slug e pela versão informada;
  - ler o arquivo repo-only;
  - validar metadata e conteúdo disponível sem reinterpretar a pesquisa;
  - persistir somente `selected_end_customer_research_version` após a validação integral da referência.
- Validação:
  - rejeitar taxon inexistente ou inativo, versão não positiva, arquivo ausente, metadata incompatível ou falha de leitura;
  - comprovar que nova `vN` não altera a seleção vigente sem nova ação humana.
- Persistência:
  - somente a coluna em `business_taxons`;
  - os arquivos continuam versionados e imutáveis no repositório.
- Consumo:
  - a E20.6 consome a pesquisa integral selecionada para a avaliação de suficiência factual;
  - a futura integração com a E19.3 pertence ao responsável pela E19.3 e não é implementada aqui.
- Fallback:
  - nenhum fallback de versão, ancestral, público ou arquivo.

### 2.2. Contrato do arquivo integral

- O boundary trata `end_customer` como audience fixa neste recorte.
- O nome `vN.md` e `research_version` interno devem apontar para o mesmo inteiro positivo.
- `taxon_slug` interno deve corresponder ao taxon servido, sem alias, herança ou aproximação.
- O conteúdo é entregue integralmente como conhecimento autorizado; o boundary não resume, chunka, reordena, classifica ou extrai fatos automaticamente.
- A existência de conteúdo contraditório, limitação ou inferência dentro da pesquisa não é corrigida pelo loader; esse julgamento pertence à avaliação humana/IA anterior à seleção ou ao consumidor semântico autorizado.
- Arquivos já arquivados não são reescritos para adaptar a nova semântica de seleção.

### 2.3. Boundary técnico mínimo

- Criar um boundary próprio da preparação do taxon em `lib/conversion-content/landing-page/taxon-preparation/`.
- A E20.5 deve limitar esse boundary ao contrato da pesquisa integral selecionada, com no máximo:
  - `contracts.ts` para entrada, sucesso e falhas tipadas;
  - `research.ts` para derivação segura do path, leitura e validação de metadata;
  - `validation-cases.ts` para casos determinísticos;
  - `index.ts` para API pública mínima.
- O acesso a `business_taxons` para consumo server-side deve seguir o padrão vigente de adapters em `lib/conversion-content/adapters/`, sem expor `service_role` a client code.
- A mutação humana deve reutilizar a rota administrativa existente de Taxonomia e seu `requirePlatformAdmin`; não criar nova rota, novo dashboard ou novo domínio de aprovação.
- O detalhamento final de nomes de funções e DTOs pertence à v2 e ao diff material; não criar engine, registry ou abstraction layer adicional.

### 2.4. Estado resultante e fronteira com a E20.6

- O recorte pode derivar somente `selected_research_valid = true | false` a partir dos fatos existentes; não persistir esse resultado.
- `selected_research_valid = true` exige simultaneamente taxon ativo, versão selecionada positiva, arquivo existente e metadata compatível.
- Esse resultado isolado não significa `taxon preparado`.
- A E20.6 adicionará o segundo marcador necessário e o predicado final de preparação.

## 3. Fases e próxima ação

### 3.1. E20.5.3 — Persistência e seleção humana mínima

- Status: planejada.
- Objetivo: adicionar a referência mínima de versão selecionada e permitir sua alteração somente por ação humana administrativa explícita.
- Automação: não.
- Escopo executável:
  - criar migration mínima para `selected_end_customer_research_version integer null` com check positivo quando presente;
  - preservar `business_taxons` como única entidade de identidade e seleção;
  - estender o boundary administrativo vigente de Taxonomia somente no necessário para a seleção;
  - reutilizar `requirePlatformAdmin` e a rota administrativa existente;
  - validar a referência de arquivo antes de persistir;
  - manter `NULL` como estado legítimo e bloqueante para preparação.
- Critérios de aceite:
  - schema local e documentação canônica reconciliáveis pelo Prompt ABC;
  - valor `0` ou negativo rejeitado;
  - taxon inativo ou arquivo inválido não recebe nova seleção;
  - nova versão arquivada não modifica a coluna automaticamente;
  - nenhuma tabela, lifecycle ou histórico novo.

### 3.2. E20.5.4 — Leitura repo-only da pesquisa integral selecionada

- Status: planejada.
- Objetivo: fornecer a pesquisa integral autorizada por um boundary server-side tipado e fail-closed.
- Automação: não.
- Escopo executável:
  - implementar o boundary mínimo da seção 2.3;
  - derivar path sem persistência adicional;
  - usar `node:fs/promises` e confinamento ao diretório autorizado;
  - validar `taxon_slug`, `audience_scope` e `research_version` antes do sucesso;
  - ajustar `outputFileTracingIncludes` somente no escopo necessário à superfície que realmente executar a leitura no deploy;
  - adicionar casos negativos para arquivo ausente, escape de path, metadata divergente e versão não selecionada.
- Critérios de aceite:
  - conteúdo integral retornado sem transformação;
  - nenhuma chamada runtime à API do GitHub;
  - nenhuma heurística de versão;
  - leitura inválida falha sem payload parcial;
  - nenhuma alteração na E10.8, E19.3 ou E19.4.

### 3.3. E20.5.5 — Contrato de consumo da seleção válida

- Status: planejada.
- Objetivo: disponibilizar ao recorte seguinte uma leitura única que prove taxon ativo e pesquisa integral selecionada válida, sem antecipar o gate final de preparação.
- Automação: não.
- Escopo executável:
  - fornecer resultado tipado suficiente para a E20.6 consumir taxon, slug, versão selecionada e conteúdo integral autorizado;
  - manter o resultado derivado e não persistir `selected_research_valid`;
  - preservar falha fechada diante de qualquer inconsistência da E20.5.
- Critérios de aceite:
  - E20.6 consegue avaliar somente uma pesquisa explicitamente selecionada;
  - nenhuma marca de `prepared` existe;
  - nenhum consumidor da E19 é alterado neste recorte.

## 4. Escopo negativo e critérios de parada

### 4.1. Escopo negativo

- Não replanejar ou alterar E19.3 ou E19.4.
- Não alterar o contrato da E10.8.
- Não criar ou exigir pesquisa `business_buyer`.
- Não transformar pesquisa integral em fields da E20.2.
- Não criar workflow, status, histórico, data ou aprovador de pesquisa.
- Não persistir path de arquivo.
- Não selecionar automaticamente a maior ou a última versão.
- Não criar tabela de prontidão, coluna `prepared` ou status equivalente.
- Não criar RAG, chunking, embeddings, GitHub API runtime, serviço ou infraestrutura nova.
- Não criar rota administrativa nova quando a Taxonomia vigente puder suportar a ação mínima.
- Não definir disponibilidade comercial, entitlement, publicação ou completude de conta/LP.

### 4.2. Critérios de parada

- Parar se a seleção mínima exigir uma nova entidade, lifecycle ou serviço para funcionar com segurança.
- Parar se o deploy não conseguir incluir os arquivos necessários pelo tracing vigente sem ampliar globalmente o bundle; devolver o gap ao Estrategista antes de criar infraestrutura alternativa.
- Parar se a pesquisa selecionada exigir herança de outro taxon ou audience diferente; esse comportamento não está autorizado.
- Parar se for necessário modificar um arquivo integral já arquivado para torná-lo selecionável; preservar a versão e criar nova pesquisa somente por decisão humana própria.
- Encerrar o recorte quando um taxon ativo puder manter uma versão integral `end_customer` explicitamente selecionada, validada e legível integralmente pelo boundary server-side, ficando a preparação final dependente exclusivamente da E20.6.