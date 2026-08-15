# Plano-base E20.5 — Seleção da pesquisa integral `end_customer` por taxon

- Data: 14/08/2026.
- Versão: v2 aprovada.
- Status: checkpoints E20.5.3, E20.5.4 e E20.5.5 concluídos, validados e aprovados pelo mesmo Analista; correção SQL posterior validada localmente, dry-run Vercel e inspeção autenticada gate-off aprovados. A inspeção final do Estrategista e o merge humano permanecem pendentes; apply, prova SQL, ativação e testes gate-on continuam obrigatoriamente pós-merge.
- Recorte previsto para roadmap: `20.5 — Seleção da pesquisa integral end_customer por taxon`.
- Path canônico: `docs/lousa-plano-base-e20-5.md`.
- Fonte imutável v1: blob `8a53a73f29448a537e0036291e59582cd62c5c91`, integrado à `main` pelo PR #744.
- Roadmap congelado para a consolidação: blob `503efdbe2cc03050e72af307c0a611e1336a8f18`.
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

### 1.4. Persistência mínima e segurança de dados

- `business_taxons` permanece a identidade canônica do taxon.
- A extensão mínima é `selected_end_customer_research_version integer null`.
- A coluna possui check positivo quando preenchida: `selected_end_customer_research_version IS NULL OR selected_end_customer_research_version > 0`.
- `NULL` significa ausência de versão integral `end_customer` selecionada.
- O path não é persistido; deriva exclusivamente de `taxon.slug + audience_scope fixo end_customer + version`.
- A migration preserva RLS e as policies administrativas vigentes, não concede acesso a `anon` ou `authenticated`, revoga o `UPDATE` de tabela inteira de `service_role` e mantém somente os grants de coluna usados pelo editor administrativo vigente (`name`, `slug`, `is_active`) e pela nova seleção (`selected_end_customer_research_version`), além do `SELECT` vigente.
- `docs/schema.md` só pode ser reconciliado após o apply comprovado; a prova SQL read-only permanece versionada nesta subseção para uso pós-merge.
- Não criar status de aprovação, lifecycle, data, aprovador, histórico, tabela ou entidade adicional.

### 1.5. Solução física preservada

- O runtime não consulta GitHub API para obter a pesquisa.
- A leitura usa o padrão repo-only já comprovado no projeto com `node:fs/promises`, `process.cwd()` e confinamento de path.
- O arquivo deve estar incluído no bundle necessário do deploy pelo mecanismo vigente de `outputFileTracingIncludes`, no menor escopo de runtime que consumir o boundary; não criar tracing global por conveniência.
- A leitura reconhece a seção inicial `## 1. Identificação e uso` por contrato estrito e valida antes de devolver conteúdo:
  - taxon existente e ativo;
  - versão selecionada positiva;
  - arquivo existente;
  - `taxon_slug` exatamente igual ao slug canônico do taxon;
  - `audience_scope = end_customer`;
  - `research_version` exatamente igual à versão selecionada;
  - exatamente um item Markdown `- \`<chave>\`: \`<valor>\`` para cada chave obrigatória antes da próxima seção `##`, rejeitando ausência, duplicidade, item malformado ou valor incidental encontrado no restante do corpo;
  - conteúdo integral não vazio após a seção de identificação.
- Falha de leitura ou metadata incompatível produz falha fechada e nunca conteúdo parcial.
- Não criar RAG, chunking, embeddings, cache remoto, serviço de arquivos ou infraestrutura nova.

### 1.6. Ativação segura no PR único

- A migration e o runtime permanecem no mesmo PR da E20.5, mas nenhum caminho dependente da nova coluna pode ser alcançado antes de a migration estar aplicada e validada no ambiente correspondente.
- O gate server-only `E20_5_SELECTED_RESEARCH_ENABLED` é fail-closed: ausente ou diferente de `true`, desabilita a leitura da coluna, a ação de seleção, sua interface administrativa e o contrato de consumo da E20.5.5.
- O gate não é fallback de banco e não pode capturar erro de coluna ausente; ele impede que a consulta dependente da coluna seja construída ou executada.
- Após o merge humano, o workflow canônico aplica a migration. Em seguida, uma prova SQL read-only valida coluna, check, grants e policies. Somente com essa evidência o gate pode ser habilitado no ambiente e o deploy correspondente promovido ou refeito.
- A E20.5.3 permanece independente do banco e recebe validação determinística pré-merge; tracing e smoke hospedado pertencem à E20.5.4, primeira subseção com superfície deployada consumidora.
- Falha no apply ou na prova mantém o gate desligado, sem ativação parcial e sem PR precursor ou PR empilhado.

### 1.7. Fontes obrigatórias usadas na consolidação

- `README.md`.
- `docs/roadmap.md`.
- `docs/template-roadmap.md`.
- `docs/prompt-estrategista.md`.
- `docs/lp-planejamento.md`.
- `docs/base-tecnica.md`.
- `docs/schema.md`.
- `docs/platform-config.md`.
- `docs/lousa-plano-base-e10-8.md`.
- `docs/lousa-plano-base-e20-2.md`.
- `docs/prompt-nicho-arquivamento-pesquisa.md`.
- `docs/supa-up.md`: `supa#2`, `supa#40`, `supa#52` e `supa#63`.
- `docs/vercel-up.md`: `vercel#22`.
- `docs/prod-up.md`: `prod#14`, `prod#16` e `prod#17`.
- `docs/github-up.md`, cujo catálogo não possui update material para o recorte.
- `docs/pesquisas-brutas/corretor-imoveis/end_customer/v1.md`, somente como prova do formato físico atual, sem editar ou promover seu conteúdo automaticamente.
- `lib/admin/readRepoDoc.ts`, como precedente de leitura repo-only confinada.
- `next.config.js`, como precedente de tracing explícito de documentos repo-only.
- `lib/admin/adapters/adminTaxonomyAdapter.ts`, `app/admin/(protected)/taxonomia/actions.ts` e a tela de detalhe do taxon, como superfície e boundary administrativos existentes para mutações protegidas por `platform_admin`.

## 2. Contrato do caso

### 2.1. Fluxo operacional

- Gatilho:
  - decisão humana explícita de selecionar uma versão integral `end_customer` já arquivada para um taxon.
- Entrada:
  - `taxon_id` existente;
  - `research_version` inteira positiva escolhida pelo humano autorizado.
- Processamento:
  - exigir o gate de ativação e reutilizar `requirePlatformAdmin`;
  - carregar a identidade canônica do taxon e exigir `is_active = true`;
  - derivar o path seguro pelo slug e pela versão informada;
  - ler o arquivo repo-only;
  - validar metadata e conteúdo disponível sem reinterpretar a pesquisa;
  - persistir somente `selected_end_customer_research_version` após a validação integral da referência.
- Validação:
  - rejeitar taxon inexistente ou inativo, versão não positiva, arquivo ausente, conteúdo vazio, metadata incompatível ou falha de leitura;
  - comprovar que nova `vN` não altera a seleção vigente sem nova ação humana.
- Persistência:
  - somente a coluna em `business_taxons`;
  - os arquivos continuam versionados e imutáveis no repositório.
- Consumo:
  - a E20.6 consome a pesquisa integral selecionada para a avaliação de suficiência factual;
  - a futura integração com a E19.3 pertence ao responsável pela E19.3 e não é implementada aqui.
- Fallback:
  - nenhum fallback de versão, ancestral, público, arquivo ou erro operacional.

### 2.2. Contrato do arquivo integral

- O boundary trata `end_customer` como audience fixa neste recorte.
- A metadata ocupa a seção inicial `## 1. Identificação e uso` e contém exatamente um item Markdown `- \`<chave>\`: \`<valor>\`` para `taxon_slug`, `audience_scope` e `research_version` antes da próxima seção `##`; chave ausente, repetida, fora dessa seção, sintaticamente malformada ou com valor inválido rejeita o arquivo inteiro.
- O nome `vN.md` e `research_version` interno devem apontar para o mesmo inteiro positivo.
- `taxon_slug` interno deve corresponder ao taxon servido, sem alias, herança ou aproximação.
- O conteúdo é entregue integralmente como conhecimento autorizado; o boundary não resume, chunka, reordena, classifica ou extrai fatos automaticamente.
- A existência de conteúdo contraditório, limitação ou inferência dentro da pesquisa não é corrigida pelo loader; esse julgamento pertence à avaliação humana/IA anterior à seleção ou ao consumidor semântico autorizado.
- Textos operacionais eventualmente presentes dentro de uma pesquisa arquivada são tratados como dados da própria pesquisa e não podem sobrescrever contratos, regras de runtime ou instruções canônicas do sistema.
- Arquivos já arquivados não são reescritos para adaptar a nova semântica de seleção.

### 2.3. Boundaries técnicos e administrativos mínimos

- Criar um boundary próprio da preparação do taxon em `lib/conversion-content/landing-page/taxon-preparation/`.
- A E20.5 limita esse boundary ao contrato da pesquisa integral selecionada, com no máximo:
  - `contracts.ts` para entradas e resultados tipados;
  - `research.ts` para derivação segura do path, leitura e validação de metadata;
  - `validation-cases.ts` para casos determinísticos;
  - `index.ts` para API pública mínima.
- Um script dedicado executa `validation-cases.ts` e integra `npm run check`.
- O acesso a `business_taxons` para consumo server-side segue o padrão vigente de adapters em `lib/conversion-content/adapters/`, sem expor `service_role` a client code.
- A seleção humana é materializada na rota existente `/admin/taxonomia/[taxonId]`, em formulário separado das demais edições do taxon e com Server Action dedicada; não ampliar `updateTaxonAction` nem criar nova rota, dashboard ou domínio de aprovação.
- A ação dedicada exige `requirePlatformAdmin`, usa `adminTaxonomyAdapter`, valida a candidata pelo boundary da E20.5.3 e atualiza somente `selected_end_customer_research_version`, com atualização condicional pela mesma identidade `id + slug + is_active` e `.maxAffected(1)`.
- A interface distingue explicitamente ausência de seleção, seleção vigente e versão candidata, e só apresenta confirmação de sucesso após persistência válida.
- O detalhamento final de nomes de funções e DTOs pertence ao diff material; não criar engine, registry ou abstraction layer adicional.

### 2.4. Resultado tipado e fronteira com a E20.6

- A API pública não reduz o estado a um booleano. O resultado tipado distingue, no mínimo:
  - sucesso com taxon, slug, versão selecionada e conteúdo integral;
  - ausência de seleção;
  - taxon inexistente ou inativo;
  - versão selecionada inválida;
  - arquivo ausente, vazio ou com metadata divergente;
  - falha operacional de banco ou filesystem;
  - funcionalidade desabilitada pelo gate de ativação.
- Somente o sucesso contém payload da pesquisa.
- `selected_research_valid` pode existir apenas como projeção derivada do sucesso; não é persistido e não substitui o resultado tipado.
- A E20.6 não pode converter erro operacional, inconsistência ou funcionalidade desabilitada em ausência legítima de seleção.
- Mesmo o sucesso isolado não significa `taxon preparado`; a E20.6 adicionará o segundo marcador necessário e o predicado final de preparação.
- A reconciliação de planejamento no roadmap deverá registrar a E20.6 somente como recorte futuro para suficiência factual e predicado final de preparação, sem autorizar sua implementação neste PR.

## 3. Fases e gates executáveis

- Gate documental pré-execução: após a aprovação da v2 e antes de iniciar E20.5.3, executar o Prompt ABC sobre `docs/roadmap.md`; além de reconciliar objetivo/status planejado da E20.5, o menor delta deve registrar somente objetivo e status futuro da E20.6, sem registros, artefatos ou estado de implementação.

### 3.1. E20.5.3 — Leitura e validação repo-only da pesquisa integral

- Status: implementação candidata concluída, validada e aprovada pelo Analista no PR draft #746.
- Objetivo: criar o boundary capaz de validar uma versão candidata antes que qualquer seleção seja persistida.
- Automação: não.
- Escopo executável:
  - implementar o boundary mínimo da seção 2.3 para receber taxon canônico e versão candidata explícita;
  - derivar path sem persistência adicional;
  - usar `node:fs/promises` e confinamento ao diretório autorizado;
  - reconhecer estritamente `## 1. Identificação e uso`, validar item Markdown único de `taxon_slug`, `audience_scope`, `research_version` inteiro positivo e conteúdo não vazio após essa seção antes do sucesso;
  - adicionar script dedicado e integrá-lo a `npm run check`;
  - cobrir sucesso, versão inválida, escape de path, arquivo ausente, metadata ausente, duplicada, malformada ou divergente e conteúdo vazio, sempre sem payload parcial.
- Validação aplicável:
  - `npm ci`, `npm run check` e `git diff --check`;
  - inspeção do diff e dos casos determinísticos; esta subseção não cria rota temporária, tracing nem smoke hospedado sem superfície consumidora.
- Critérios de aceite:
  - conteúdo integral retornado sem transformação;
  - nenhuma chamada runtime à API do GitHub e nenhuma heurística de versão;
  - leitura inválida falha sem payload parcial;
  - nenhuma alteração na E10.8, E19.3 ou E19.4.
- Gate de saída:
  - diff restrito à subseção, validações verdes e aprovação do Analista antes de iniciar E20.5.4.

### 3.2. E20.5.4 — Persistência e seleção humana mínima

- Status: checkpoint aprovado pelo Analista no PR draft #746; correção SQL posterior validada localmente, dry-run Vercel e inspeção autenticada gate-off aprovados; inspeção final do Estrategista e merge humano permanecem pendentes.
- Objetivo: adicionar a referência mínima de versão selecionada e permitir sua alteração somente por ação humana administrativa explícita, reutilizando a validação da E20.5.3.
- Automação: não.
- Escopo executável:
  - criar migration mínima para `selected_end_customer_research_version integer null` com check positivo quando presente;
  - preservar RLS e policies atuais, negar grants novos a `anon`/`authenticated`, remover o `UPDATE` amplo de `service_role` e manter somente os grants de coluna usados pelo editor vigente e pela nova seleção;
  - criar `supabase/snippets/e20_5_selected_end_customer_research_version_verify.sql`, estritamente read-only, para provar tipo/nullability, check, grants e policies após o apply;
  - manter `docs/schema.md` sem delta antes do apply e reconciliá-lo pelo Prompt ABC somente após a evidência hospedada;
  - implementar o gate fail-closed da seção 1.6;
  - materializar formulário separado e Server Action dedicada na tela existente de detalhe do taxon;
  - exigir `requirePlatformAdmin`, usar `adminTaxonomyAdapter`, validar a candidata pela E20.5.3 e persistir somente por atualização condicional com `.maxAffected(1)`;
  - ajustar `outputFileTracingIncludes` somente para a rota administrativa consumidora, sem tracing global;
  - reconciliar `docs/platform-config.md` pelo Prompt ABC com nome, finalidade server-only, escopos Preview/Production, default fail-closed, ordem de habilitação após apply/prova e necessidade de redeploy, sem registrar valor sensível;
  - manter `NULL` como estado legítimo e bloqueante para preparação.
- Validação pré-merge aplicável:
  - `npm ci`, `npm run check`, `git diff --check` e checks do PR, sempre com o gate desligado e prova de que nenhuma consulta à nova coluna é construída ou executada;
  - dry-run da Vercel CLI como evidência auxiliar de que `docs/pesquisas-brutas/**/end_customer/v*.md` não foi excluído do artefato e de que o tracing não foi ampliado globalmente;
  - smoke no Preview com gate desligado para a superfície e o empacotamento seguros; o dry-run não substitui o Preview.
- Validação pós-merge e de ativação:
  - aguardar o apply canônico, executar o snippet read-only e somente então configurar o gate como `true`, refazer ou promover o deploy e executar os testes autenticados gate-on;
  - reconhecer na interface os estados sem seleção, seleção vigente e candidata, com ação explícita;
  - Preview autenticado em desktop e mobile para `NULL`, seleção válida, candidata inválida, taxon inativo, erro de leitura e sucesso após reload, incluindo acesso negado para papel não autorizado;
  - validar rótulos, associação de feedback, teclado, foco e ausência de comunicação somente por cor; automação é evidência auxiliar e não autoriza alegação de conformidade WCAG plena;
  - qualquer divergência mantém o gate desligado e a ativação pendente, sem invalidar as evidências pré-merge independentes do schema aplicado.
- Critérios de aceite:
  - valor `0` ou negativo rejeitado;
  - taxon inativo ou arquivo inválido não recebe nova seleção;
  - nova versão arquivada não modifica a coluna automaticamente;
  - nenhuma tabela, lifecycle ou histórico novo;
  - migration não aplicada ou prova SQL falha mantém toda dependência da nova coluna desabilitada.
- Gate de saída:
  - diff restrito à subseção, validações locais e de Preview gate-off registradas e aprovação do Analista antes de iniciar E20.5.5; apply, prova SQL e testes gate-on permanecem pendências explícitas pós-merge de ativação.

### 3.3. E20.5.5 — Contrato de consumo da seleção válida

- Status: implementação candidata concluída, validada e aprovada pelo mesmo Analista no PR draft #746; merge e ativação permanecem decisões humanas separadas.
- Objetivo: disponibilizar ao recorte seguinte uma leitura única que prove taxon ativo e pesquisa integral selecionada válida, sem antecipar o gate final de preparação.
- Automação: não.
- Escopo executável:
  - exigir o gate de ativação antes de qualquer acesso à nova coluna;
  - ler `selected_end_customer_research_version` pelo adapter server-side aplicável;
  - reutilizar o boundary da E20.5.3 para validar e carregar exatamente a versão persistida;
  - expor os estados tipados da seção 2.4, sem colapsar erro em ausência;
  - manter o resultado derivado e não persistir `selected_research_valid`;
  - preservar falha fechada diante de qualquer inconsistência da E20.5.
- Validação aplicável:
  - `npm ci`, `npm run check`, `git diff --check`, checks do PR e casos determinísticos para todos os estados públicos;
  - Preview com gate desligado deve provar que nenhuma consulta à nova coluna é executada;
  - Preview habilitado somente em ambiente cuja migration e prova SQL estejam disponíveis.
- Critérios de aceite:
  - E20.6 consegue avaliar somente uma pesquisa explicitamente selecionada;
  - somente sucesso fornece conteúdo integral;
  - nenhuma marca de `prepared` existe;
  - nenhum consumidor da E19 é alterado neste recorte.
- Gate de saída:
  - diff final consolidado, validações verdes e aprovação final do Analista; merge e ativação permanecem decisões humanas separadas.

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
- Não criar RPC administrativa nem alterar RLS/policies; se o diff vier a exigir uma dessas mudanças, `supa#63` torna-se avaliação obrigatória antes de prosseguir.
- Não definir disponibilidade comercial, entitlement, publicação ou completude de conta/LP.
- Não ativar dependência da nova coluna antes do apply e da prova SQL read-only.

### 4.2. Critérios de parada

- Parar se a seleção mínima exigir uma nova entidade, lifecycle ou serviço para funcionar com segurança.
- Parar se o deploy não conseguir incluir os arquivos necessários pelo tracing vigente sem ampliar globalmente o bundle; devolver o gap ao Estrategista antes de criar infraestrutura alternativa.
- Parar se a pesquisa selecionada exigir herança de outro taxon ou audience diferente; esse comportamento não está autorizado.
- Parar se for necessário modificar um arquivo integral já arquivado para torná-lo selecionável; preservar a versão e criar nova pesquisa somente por decisão humana própria.
- Parar se o gate não impedir objetivamente todo acesso à nova coluna antes do apply, ou se o apply/prova SQL divergir do contrato planejado.
- Encerrar o recorte quando um taxon ativo puder manter uma versão integral `end_customer` explicitamente selecionada, validada e legível integralmente pelo boundary server-side, ficando a preparação final dependente exclusivamente da E20.6.
