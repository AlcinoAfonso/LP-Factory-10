# Plano-base E20.8 — Substituição greenfield e simplificação terminal da E20

## V1 funcional aprovada

- Estado: V1 funcional concluída; execução Complexa e supervisão Autônoma definidas; pronta para handoff técnico.

### 4.1.1 Problema e resultado funcional

- Problema: a E20 acumulou versionamento, política comercial residual, preparação por versão revisada, duas autoridades de publicação, gates e capacidades sem consumidor, tornando uma necessidade factual simples excessivamente cara para o MVP.
- Resultado: uma E20 mínima, corrente e administrável no Supabase, independente de planos e consumidores, sem versionamento de catálogo e com herança taxonômica simples.
- Usuário principal: `platform_admin` responsável por administrar taxons e fields factuais.

### 4.1.2 Comportamento esperado

- Administrador usa uma única página principal no Admin para consultar a cobertura factual corrente de qualquer taxon na ordem Universal → Segmento → Nicho → Ultranicho quando aplicável, com distinção clara entre fields herdados e próprios e detalhes técnicos em segundo nível.
- Novo taxon inicia inativo; humano pode liberá-lo sem IA quando a cobertura for suficiente.
- Field novo é criado diretamente na camada competente e passa a integrar novos usos imediatamente após validação e confirmação.
- Field pode ser editado enquanto continuar representando o mesmo fato; mudança material exige novo fieldKey.
- Field pode ser inativado e reativado sem versionamento global.
- IA pode sugerir possível gap, mas qualquer mutação continua humana.
- Consumidores leem apenas a cobertura factual corrente quando precisarem; não existe coordenação retroativa.

### 4.1.3 Limites e escopo negativo

- Não preservar mecanismo de versionamento antigo.
- Não preservar planos comerciais dentro da E20.
- Não criar bridge de compatibilidade com registry, versões ou review markers anteriores.
- Não reconstruir E20.7 ou outra capacidade sem consumidor aprovado.
- Não criar infraestrutura nova além da menor persistência necessária na stack vigente.
- Não alterar estruturas compartilhadas de outros casos sem demonstrar o impacto e preservar sua responsabilidade vigente.
- Escopo negativo vinculante: a V2 não pode reintroduzir com outro nome mecanismo equivalente aos contratos abaixo.
- Não criar versão, revision, draft, snapshot, rollback, histórico funcional ou trilha própria da E20.
- Não criar registry paralelo, dual-write, sincronização, replicação ou segunda autoridade factual.
- Não criar `CURRENT_VERSION`, `catalog_version`, reviewed version, marker de suficiência ou equivalente operacional.
- Não criar plano comercial, entitlement, capability comercial, `allowedPlans` ou projeção por plano dentro da E20.
- Não coordenar, invalidar, reabrir, migrar ou atualizar consumidores quando field ou taxon mudar.
- Não criar override, specialization, shadowing ou herança condicional de field por plano, conta ou consumidor.
- Não criar publisher por Git, PR ou deploy para administrar fields correntes.
- Não criar fingerprint de publicação, handoff ou reconciliação entre autoridades.
- Não criar sessão, cache, fila, job, worker, event sourcing, engine ou serviço novo para a E20.
- Não persistir resultado, decisão, estado ou histórico da avaliação por IA como lifecycle da E20.
- Não tornar pesquisa E20.5, Web Search ou qualquer fonte externa requisito para liberação humana ou gestão de fields.
- Não reconstruir E20.7 nem capacidade dormente sem consumidor real aprovado.
- Não migrar versões antigas nem manter código legado apenas para conservar histórico ou compatibilidade de dados de desenvolvimento.
- Não manter contrato E20-only em consumidor antigo quando não houver responsabilidade independente a preservar.
- Não alterar responsabilidade pertencente a outro caso sem identificar previamente o impacto e obter a autorização exigida pelo contrato do projeto.

### 4.1.4 Posição planejada no roadmap

- Criar `E20.8 — Substituição greenfield e simplificação terminal da E20` como plano executável deste Debate.
- Ao concluir o plano, reconsolidar o caso macro E20 para que a documentação canônica descreva somente a arquitetura vigente; contratos superseded permanecem recuperáveis pelo histórico Git, não como obrigação atual.
- A E20.8 é o recorte de transição e fechamento da reconstrução; não autoriza multiplicar novos subcasos para preservar mecanismos antigos.

### 4.1.5 Fases

- `20.8.3 — Demolição controlada da E20 vigente`: retirar do runtime e dos contratos correntes registry/versionamento, planos e `allowedPlans`, reviewed version, review gates, publisher repo-only, fingerprints/handoffs/reconciliação, capacidades dormentes e testes/documentação que existam somente para a arquitetura abandonada; manter a branch íntegra e não fazer merge de estado intermediário quebrado.
- `20.8.4 — Autoridade factual única`: estabelecer no Supabase a residência mínima dos fields factuais correntes e a administração autorizada, sem versionamento do catálogo ou segunda autoridade.
- `20.8.5 — Herança e resolução factual`: resolver deterministicamente Universal → Segmento → Nicho → Ultranicho e devolver a cobertura corrente sem plano comercial, conta ou consumidor.
- `20.8.6 — Gestão administrativa simples`: concentrar a gestão em uma única página principal no Admin, organizada por Universal → Segmento → Nicho → Ultranicho quando aplicável, distinguindo fields herdados e próprios e permitindo adicionar, editar, inativar ou reativar fields, sem páginas/abas separadas por camada, editor JSON técnico ou publicação por repositório.
- `20.8.7 — Liberação humana e apoio opcional por IA`: preservar taxon novo inativo, liberação humana sem IA, revisão voluntária de taxon ativo e IA consultiva com decisão humana final.
- `20.8.8 — Cutover e limpeza terminal`: retirar dependências remanescentes da arquitetura antiga, reinicializar dados de desenvolvimento quando necessário e reconciliar roadmap, base técnica, schema e demais fontes canônicas com a nova E20.

### 4.1.6 Classificação

- Execução: Complexa.
- Motivo: substituição destrutiva de um contrato transversal já materializado, mudança de autoridade factual, limpeza de dependências e necessidade de provar que responsabilidades de outros casos não foram removidas por acidente.

### 4.1.7 Automação

- Não há nova automação a decidir neste Debate.
- A avaliação por IA já aprovada anteriormente permanece apenas se continuar necessária no contrato greenfield; qualquer detalhe técnico é derivado na V2.
- A liberação humana e a administração dos fields não dependem de IA.

### 4.1.8 Critérios funcionais de aceite

- Zero referência operacional a Starter/Lite/Pro/Ultra, `allowedPlans`, entitlement ou plano comercial dentro da E20.
- Zero versionamento operacional da E20: sem `CURRENT_VERSION`, versões publicadas, reviewed version, carry-forward ou gate por versão.
- Zero dependência operacional do registry repo-only da E20 antiga.
- Zero publisher administrativo dependente de PR/deploy/reconciliação entre duas autoridades.
- Supabase é a única autoridade factual corrente da E20.
- Resolver atual recebe dados factuais e cadeia taxonômica e aplica apenas herança aprovada.
- Novo taxon pode ser liberado por humano sem IA.
- A gestão de fields ocorre em uma única página principal no Admin, com visão Universal → Segmento → Nicho → Ultranicho quando aplicável, distinção entre herdados e próprios e ações simples de criar, editar, inativar e reativar; detalhes técnicos ficam em segundo nível.
- IA não muta estado por decisão própria.
- Taxon ativo não é reaberto automaticamente por mudança de field.
- Nenhum consumidor ou estrutura compartilhada de outro caso perde responsabilidade funcional sem prova e autorização correspondente.
- Documentação canônica final não apresenta contratos E20 antigos como vigentes.
- O delta final deve representar redução arquitetural material; código novo só é aceito quando substituir responsabilidade necessária com menos complexidade total.
- A nova E20 não mantém histórico funcional, revisão, draft, snapshot ou rollback próprio além de metadados operacionais genéricos sem função de lifecycle.
- `fieldKey` é globalmente único e não existe override, shadowing ou specialization por camada.
- Pesquisa E20.5, Web Search ou outra fonte externa é opcional para a IA e nunca bloqueia a operação humana.
- Contrato antigo existente somente por causa da E20 não permanece no runtime ou consumidor corrente sem responsabilidade independente comprovada.
- O lifecycle funcional de field é somente ativo/inativo, com reativação; operações destrutivas não fazem parte do uso normal do produto.

### 4.1.9 Evidências esperadas

- Prova do fluxo administrativo real de criação de field por taxon/camada até sua leitura corrente.
- Prova de herança Universal → Segmento → Nicho → Ultranicho.
- Prova de liberação humana sem IA.
- Prova de que termos e contratos de plano/versionamento antigos não atravessam o runtime novo.
- Prova de que dados legados não são necessários para operar a nova E20.
- QA hospedado em desktop e mobile da página administrativa única, comprovando leitura clara das camadas Universal → Segmento → Nicho → Ultranicho quando aplicável, distinção entre fields herdados e próprios e ausência de navegação separada por camada.
- Auditoria de dependências externas removidas/preservadas antes do merge.

### 4.1.10 Supervisão

- Supervisão: Autônomo.

## Referência da fonte aprovada

- Documento: “Debate 12B — Substituição greenfield e simplificação terminal da E20 — LP Factory 10”.
- Seção: 4.1 — PB 1 — E20.8 Substituição greenfield e simplificação terminal da E20.
- URL: https://docs.google.com/document/d/1ClohATV14m-jABtL8YGu0s-2L8mgN4WemK9gOyiHti4/edit
- Documento consultado em: 14/09/2026.
