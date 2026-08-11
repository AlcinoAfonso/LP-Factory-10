11/08/2026 — Plano-base v2 — E19.4 — Geração e materialização da landing page em `draft`

## 1. Estado e decisões fixas

### 1.1. Estado

- Status: plano-base v2 consolidado em 11/08/2026 a partir da v1 decidida humanamente, dos pareceres especializados obrigatórios e da inspeção factual do repositório e do schema vigentes.
- Recorte: `E19.4 — Geração e materialização da landing page em draft`.
- Plano conceitual: `docs/lp-planejamento.md`.
- Predecessor material: E19.3 concluída e integrada à `main`; sua API pública v1 é a entrada canônica da E19.4.
- Gates A–E do debate conceitual estão encerrados.
- Não permanece questão indispensável aberta para execução: mecanismo OpenAI, residência física, garantia transacional, boundaries e path privado foram definidos na v2 sem reabrir as decisões dos Gates A–E.
- Base congelada da orquestração: merge commit `f3cce5f85295ab5db7d36a64bd50eed632fdb441` do PR #711; a implementação deve permanecer no único PR draft da branch `codex-app/e19-4-orquestracao`, sem stacked PR.

### 1.2. Objetivo e resultado esperado

- Consumir o pacote real e autorizado da E19.3 para gerar conteúdo estruturado candidato da primeira LP real.
- Validar deterministicamente a candidata somente no que os contratos permitem comprovar objetivamente.
- Materializar a primeira candidata integral válida no `draft` já existente, com estado próprio autossuficiente e snapshot imutável do contexto efetivamente disponibilizado à operação geracional válida.
- Disponibilizar visualização privada e read-only da LP materializada para avaliação humana real.
- Encerrar a E19.4 com a primeira LP real em `draft`, privada, reproduzível e efetivamente avaliável; conclusão da E19.4 não significa prontidão para publicação ou disponibilidade comercial.

### 1.3. Usuários e autorização

- A geração parte do estado operacional vigente de `/a/[account]`, atualmente restrito a `owner` ou `admin` ativo da conta elegível; a E19.4 não cria papel ou autorização paralelos.
- Antes de iniciar a operação geracional, a E19.4 deve revalidar server-side conta ativa, membership ativo com papel autorizado e entitlement comercial vigente, reutilizando as autoridades já existentes de E9/E19 em vez de presumir autorização por ter chegado à superfície operacional.
- A E19.4 não inventa capacidade comercial de geração. Quando a E9.7 possuir uma capability de geração de LP formalmente admitida e associada ao plano, a E19.4, como domínio consumidor, deverá aplicá-la no mesmo ponto da ação; enquanto essa capability não existir no catálogo canônico, sua ausência não pode ser suprida por hardcode ou inferência local.
- A visualização privada reutiliza o controle de acesso tenant-aware já vigente da conta/LP e não cria ACL própria.
- Conta piloto e cliente usam o mesmo fluxo oficial; não existe LP teste, geração administrativa paralela ou autorização especial por conta.

### 1.4. Automação aprovada

- Automação: sim na fase geracional.
- Categoria: Automação com IA em fluxo controlado.
- Unidade funcional: LP completa.
- Participação humana: uma ação humana explícita inicia cada operação geracional.
- Função da IA: produzir somente conteúdo para os fields já autorizados pelo pacote da E19.3.
- Função determinística: estrutura, módulos, variantes, ordem, autorização de fontes/fatos, validação pós-IA objetivamente comprovável, bindings, decisão de materialização, persistência e renderer permanecem sob autoridade do LP Factory.
- Não adotar comportamento agentic, geração funcional independente por módulo, decisão estrutural pela IA, conversa persistente ou materialização parcial.
- A geração usa uma chamada síncrona e não streaming ao OpenAI Responses API por ação humana, com Structured Output estrito, workload `landing_page_draft_generation`, modelo `gpt-5.4-mini`, `reasoning.effort: none`, `store: false` e sem retry automático.
- A chamada não usa tools, busca externa, `previous_response_id`, background mode, Agents SDK, memória conversacional, job, fila, cron, webhook ou segundo revisor de IA.
- Uma nova tentativa paga exige nova ação humana explícita; a interface impede reenvio enquanto a tentativa estiver em voo, sem lock distribuído ou infraestrutura nova.

### 1.5. Decisões fixas dos Gates A–E

- Gate A:
  - uma operação humana gera a LP completa como unidade funcional;
  - IA não escolhe módulos, variantes, ordem, capabilities, fontes ou fatos fora do pacote autorizado;
  - uma operação funcional não obriga uma única chamada ao provider.
- Gate B:
  - validação bloqueante cobre somente identidade e ordem, fields admitidos, tipos, cardinalidades, obrigatoriedade, `absoluteMax`, bindings, referências técnicas e existência/autorização das fontes e evidências estruturalmente exigidas;
  - faixas recomendadas, fidelidade factual e treatments semânticos orientam geração e revisão humana, sem falsa garantia determinística;
  - não há provenance cognitiva declarada pela IA, segunda IA revisora, reparo semântico, omissão silenciosa ou materialização parcial.
- Gate C:
  - falha ou candidata inválida não materializa e permite nova tentativa humana enquanto a LP permanecer sem materialização;
  - a primeira candidata integral válida cria uma única materialização inicial dentro da E19.4;
  - depois dessa materialização válida, a E19.4 não sobrescreve a LP;
  - conteúdo atual e snapshot passam a existir juntos;
  - conteúdo materializado é autossuficiente para renderização e snapshot congela apenas identidades, versões, decisões e dados concretos efetivamente disponibilizados à operação geracional válida.
- Gate D:
  - preview é privada, autenticada, read-only e não publicada;
  - renderer consome somente o estado materializado e não recompõe E19.3 nem relê E20.2, pesquisas ou perfil vigente;
  - valores efetivos de aparência e conteúdo vêm do estado congelado; atualização futura de registry não altera silenciosamente LP já materializada;
  - QA das interações cobre somente comportamentos já contratados, sem inventar backend de submissão, tracking ou capacidade nova.
- Gate E:
  - a fronteira é `gerar → validar → materializar → visualizar → avaliar humanamente`;
  - avaliação humana é evidência de teste do recorte, não estado de domínio nem workflow de aprovação/publicação;
  - findings podem ser registrados no PR ou relatório de execução e não exigem tabela, coluna ou lifecycle próprio;
  - defeito comprovável do contrato da E19.4 bloqueia o fechamento; melhoria editorial, persuasiva, visual ou semântica sem violação do contrato vira aprendizado para recorte posterior.

### 1.6. Fontes usadas na consolidação

- `README.md`.
- `docs/lp-planejamento.md`.
- `docs/roadmap.md`.
- `docs/template-roadmap.md`.
- `docs/base-tecnica.md`.
- `docs/schema.md`.
- `docs/design-system.md`.
- `docs/prompt-estrategista.md`.
- `docs/gestor-automations.md`.
- `docs/automations.md`.
- `docs/lousa-plano-base-e19-3.md`.
- API pública vigente de `lib/lp-builder/`, especialmente `generationContextContracts.ts` e adapters da E19.3.
- Contratos vigentes de E18.4 e E18.5 para semantic roles, fields, cardinalidades, policies, bindings, referências técnicas, interactions e critérios visuais.
- Estado vigente de `lib/openai-workloads/`, `lib/commercial-capabilities/`, `account_landing_pages` e `account_landing_page_onboarding_configurations` no repositório e no Supabase `LP-Factory-10`, inspecionado em modo read-only em 11/08/2026.
- Parecer read-only do Gestor Estrutural: aprovado com condicionantes C-01–C-07, integralmente incorporadas nesta v2.
- Parecer read-only do Gestor de Updates: patches `supa#40`, `vercel#15`, `prod#6`, `prod#14`, `prod#16` e `prod#17`, integralmente incorporados nesta v2; oportunidades condicionais não viram implementação.
- Parecer read-only do Gestor de Automações: patches AUTO-E19.4.3-P01–P05, integralmente incorporados nesta v2.

## 2. Contrato do caso

### 2.1. Fluxo lógico

- Gatilho:
  - `owner` ou `admin` no estado operacional da conta aciona explicitamente a geração da LP completa;
  - o servidor revalida conta, membership e entitlement no ponto da ação; capability E9.7 de geração passa a integrar esse mesmo gate somente quando estiver formalmente admitida no catálogo canônico;
  - enquanto não houver materialização válida, tentativa falha ou inválida não impede nova tentativa humana.
- Entrada:
  - LP legítima em `draft`, vinculada à configuração concluída;
  - sucesso completo da API E19.3, com Parte A determinística e Parte B autorizada;
  - configuração OpenAI server-side vigente e autorizada no momento da implementação.
- Processamento:
  - a IA produz somente o conteúdo dos fields autorizados dos módulos já selecionados;
  - estrutura, identidade, variante, ordem, bindings, destinos técnicos e demais decisões determinísticas não são delegados à IA.
  - o adapter server-side constrói um Structured Output estrito a partir da composição E19.3, com raiz `object`, exatamente os módulos selecionados, somente fields geráveis autorizados e `additionalProperties: false` em todos os objetos;
  - fields opcionais usam nullable quando exigido pelo contrato do provider e são normalizados deterministicamente para ausência;
  - identidades, ordem, variantes, imagens, referências técnicas, bindings, fontes e fatos são reconstruídos pelo servidor a partir da Parte A, nunca aceitos como decisão da IA.
- Validação:
  - a candidata integral é validada server-side apenas no que os contratos conseguem comprovar objetivamente;
  - qualquer violação objetivamente verificável invalida a candidata completa.
- Persistência:
  - somente a primeira candidata integral válida pode gerar a materialização inicial da E19.4;
  - conteúdo atual e snapshot imutável devem tornar-se válidos juntos;
  - a residência é `public.account_landing_page_materializations`, agregado interno 1:1 separado de `account_landing_pages`, inserido uma única vez e sem operação de update ou delete na E19.4;
  - um único `INSERT` torna conteúdo e snapshot válidos atomicamente; conflito concorrente é normalizado como LP já materializada, sem overwrite.
- Consumo:
  - a LP materializada é visualizada privadamente em `/a/[account]/landing-pages/[landingPageId]/preview`, sob o gate tenant-aware vigente, por renderer determinístico e read-only;
  - o renderer usa somente o estado próprio congelado da LP.
- Fallback:
  - falha da E19.3 bloqueia geração;
  - falha do provider ou candidata inválida preserva a LP sem nova materialização e permite nova tentativa humana;
  - falha de persistência não pode aparentar sucesso parcial;
  - identidade/versão não suportada pelo renderer falha explicitamente, sem fallback silencioso.

### 2.2. Contrato da candidata e validação pós-IA

- A candidata representa a LP completa, com exatamente a composição selecionada pela E19.3.
- O payload probabilístico contém somente conteúdo gerável; o servidor compõe a candidata canônica completa com os valores determinísticos da Parte A antes da validação integral.
- O validator confirma objetivamente:
  - identidade e ordem dos módulos;
  - variante e fields admitidos;
  - tipos e cardinalidades;
  - obrigatoriedade;
  - limites absolutos de texto;
  - bindings e referências técnicas;
  - existência e autorização de fontes/evidências estruturalmente exigidas.
- Destinos operacionais, assets, URLs e referências técnicas sob autoridade determinística não são inventados pela IA.
- Para `action`, a IA pode produzir somente o conteúdo textual admitido, como label; o binding operacional permanece server-side.
- `operational_evidence` e referências técnicas concretas exigidas são resolvidas/validadas server-side.
- O sistema não afirma provar semanticamente, por inspeção de texto livre, fidelidade factual, ocorrência de claim ou treatment permitido/restrito/proibido.
- Field opcional pode estar ausente; se presente e estruturalmente inválido, invalida a candidata em vez de ser removido silenciosamente.
- O schema dinâmico respeita o subconjunto de JSON Schema aceito por Structured Outputs; os limites de coleção vêm do `effectiveRoot` e o `max_output_tokens` é calculado deterministicamente a partir dos limites de conteúdo e do envelope JSON, sem exceder o limite do modelo.
- Testes negativos cobrem módulo extra ou ausente, ordem divergente, field não admitido, propriedade adicional, tipo/cardinalidade inválidos, excesso sobre `absoluteMax` e tentativa de a IA produzir binding ou referência técnica.

### 2.3. Materialização e snapshot

- A materialização inicial é write-once dentro da E19.4, mas a tentativa geracional não é.
- `public.account_landing_page_materializations` contém `landing_page_id` como PK, `account_id`, `content_json`, `generation_context_snapshot_json`, `created_by` e `created_at`.
- `(landing_page_id, account_id)` referencia tenant-safe `(id, account_id)` de `public.account_landing_pages`; `account_id` e `created_by` preservam as FKs canônicas da conta e do ator.
- `content_json` e `generation_context_snapshot_json` são obrigatórios e restritos a objetos JSON.
- A tabela tem RLS habilitado e nenhuma policy; `public`, `anon`, `authenticated` e `ai_readonly` não recebem grants; `service_role` recebe somente `SELECT` e `INSERT`, sem `UPDATE` ou `DELETE`.
- Não criar view ou RPC para esta materialização.
- O conteúdo materializado constitui estado próprio e autossuficiente da LP para sua visualização.
- O conteúdo deve congelar todo dado concreto necessário ao renderer que, se relido de uma fonte mutável, pudesse alterar a LP existente.
- O snapshot preserva somente:
  - identidades e versões relevantes;
  - decisões estruturais usadas;
  - dados concretos efetivamente disponibilizados à operação geracional que produziu a candidata válida.
- O snapshot não registra prompt integral, resposta bruta, raciocínio, provenance cognitiva ou contexto autorizado que não tenha sido efetivamente exposto ao gerador.
- Após materialização válida, edição, regeneração, histórico, overwrite e rollback pertencem a recorte posterior.
- Antes do provider, o fluxo consulta a ausência de materialização; candidata inválida não insere; candidata válida executa um único insert; segunda inserção falha pela unicidade e é tratada sem sobrescrita.

### 2.4. Visualização privada e avaliação humana

- A superfície parte da jornada operacional já existente da conta; o preview privado fica em `/a/[account]/landing-pages/[landingPageId]/preview`.
- LP sem materialização pode oferecer a ação humana de geração; LP materializada conduz à visualização privada, sem nova geração pela E19.4.
- A visualização representa a página realmente renderizada, não card ou simulação administrativa.
- Moldura externa pode indicar `draft` e não publicação sem integrar o conteúdo materializado da LP.
- O renderer pode conhecer identidades e versões estruturais suportadas, mas usa valores efetivos de conteúdo e aparência do estado congelado.
- Critérios visuais vigentes da E18.4 permanecem aplicáveis:
  - viewport mínimo 320 px;
  - evidências em 360, 768 e 1280 px;
  - sem truncamento ou scroll horizontal provocado por texto;
  - targets mínimos 44×44;
  - foco visível;
  - hierarquia semântica;
  - contraste, legibilidade e estados interativos.
- Conforme `prod#17`, WCAG 2.2 é o baseline de acessibilidade do fluxo: aplicar os critérios pertinentes à LP e combinar inspeção automática com validação manual; ferramenta automática isolada não prova conformidade e a E19.4 não declara conformidade WCAG integral.
- QA de interação cobre somente comportamento contratado, como teclado/estado/foco do accordion e estrutura/labels/consentimento/foco do form; não cria backend inexistente.
- A avaliação humana verifica também copy, fidelidade factual e semântica da primeira LP.
- Na avaliação humana da copy, aplicar `prod#6` como referência editorial: verificar conteúdo original, útil, confiável, orientado a pessoas e sustentado pelas pesquisas autorizadas do taxon; não criar `llms.txt`, schema especial, fragmentação artificial de texto nem alegação de otimização para busca generativa.
- Findings ficam como evidência no PR/relatório de execução e não se tornam estado persistido da LP.

## 3. Fases e próxima ação

### 3.1. E19.4.3 — Geração controlada e validação integral da candidata

- Status: planejada.
- Automação: sim.
- Categoria: Automação com IA em fluxo controlado.
- Objetivo:
  - consumir a saída E19.3 e produzir uma candidata da LP completa, submetendo-a à validação determinística objetiva antes de qualquer persistência.
- Limites:
  - IA somente nos fields autorizados;
  - sem decisão estrutural, agentic, geração funcional por módulo, segunda IA revisora ou reparo semântico;
  - uma ação humana produz no máximo uma chamada síncrona e não streaming para a candidata completa;
  - sem tools, busca externa, encadeamento, background, retry automático ou configuração paralela de modelo.
- Critérios de aceite:
  - ação humana autorizada inicia a operação;
  - o gate server-side revalida conta ativa, membership autorizado e entitlement comercial antes de qualquer chamada ao provider;
  - capability E9.7 de geração, quando formalmente admitida, é aplicada pelo consumidor neste mesmo ponto sem hardcode local;
  - falha da E19.3 impede provider;
  - candidata válida preserva exatamente a composição autorizada;
  - violações objetivamente detectáveis rejeitam a candidata integral;
  - falha ou invalidez não cria materialização e permite nova tentativa humana enquanto a LP estiver sem materialização.
  - o workload canônico `landing_page_draft_generation` integra `lib/openai-workloads/` em nova revisão, com `gpt-5.4-mini`, esforço `none`, `OPENAI_API_KEY`, `/v1/responses`, `store: false` e `safety_identifier` estável e não reversível derivado do ator autenticado;
  - a requisição usa Structured Output estrito e `max_output_tokens` determinístico, sem secret ou configuração de modelo no cliente;
  - falha de autorização ou E19.3 impede provider; timeout, rate limit, quota, erro HTTP, refusal, incomplete, JSON/schema inválido ou reprovação do validator encerram a tentativa inteira;
  - não existe retry automático; nova tentativa depende de nova ação humana;
  - telemetria registra somente request ID, workload, revisão, modelo, response ID, resultado, categoria segura de falha, latência e usage, sem prompt, pesquisa, fatos, guidance, payload, conteúdo, PII, secret ou `safety_identifier`;
  - quando E9.7 admitir e atribuir formalmente uma capability de geração, o consumidor passa a resolvê-la fail-closed antes do provider; nenhuma capability é criada localmente nesta E19.4.

### 3.2. E19.4.4 — Materialização inicial e snapshot imutável

- Status: planejada.
- Automação: não.
- Objetivo:
  - tornar a primeira candidata integral válida em estado próprio da LP, com snapshot suficiente e sem dependência futura de fontes mutáveis para sua reprodução.
- Critérios de aceite:
  - conteúdo e snapshot tornam-se válidos juntos;
  - conteúdo é autossuficiente para o renderer;
  - snapshot congela apenas o contexto efetivamente disponibilizado à operação geracional válida;
  - falha de persistência não deixa estado parcial aparentando sucesso;
  - nova tentativa é possível antes da primeira materialização válida;
  - após materialização válida, a E19.4 não sobrescreve a LP.
  - migration forward-only cria o agregado 1:1 com FKs tenant-safe, checks JSON, RLS sem policies e grants exclusivos de `SELECT, INSERT` para `service_role`;
  - um único insert persiste `content_json` e `generation_context_snapshot_json`; conflito concorrente retorna estado já materializado sem update;
  - casos executáveis cobrem double-submit, conflito, falha do provider, candidata inválida, falha de insert e renderer sem releitura de fonte mutável;
  - conforme `supa#40`, a entrega versiona em `supabase/snippets/` um verificador SQL read-only pós-apply para objetos, constraints, RLS, policies, grants e ausência de estado parcial.

### 3.3. E19.4.5 — Visualização privada e prova humana da primeira LP real

- Status: planejada.
- Automação: não.
- Objetivo:
  - renderizar privadamente a LP materializada a partir de seu estado próprio e produzir a evidência humana necessária para concluir o recorte.
- Critérios de aceite:
  - acesso privado reutiliza o gate vigente da conta/LP, sem ACL paralela;
  - renderer é determinístico, read-only e não relê fontes mutáveis nem chama IA;
  - identidade/versão não suportada falha explicitamente;
  - conforme `prod#16`, evidências hospedadas em Preview cobrem 360, 768 e 1280 px, TAB/foco, overflow/truncamento, contraste, legibilidade e comportamentos de interação contratados, combinando revisão manual e ferramentas disponíveis sem tornar ferramenta paga requisito;
  - avaliação humana confirma que a primeira LP é efetivamente avaliável;
  - conforme `prod#14`, `owner` ou `admin` reconhece inequivocamente que a LP está em `draft`, não está publicada e qual é o próximo passo disponível, sem telemetria ou estado de workflow novo;
  - a Vercel Toolbar pode ser usada, quando já disponível ao revisor, somente como apoio à inspeção de acessibilidade, interações e layout; a conclusão não depende da ferramenta nem exige habilitação nova;
  - findings ficam no PR/relatório de execução, sem estado de domínio novo;
  - defeito comprovável do contrato bloqueia o fechamento e volta para correção no próprio recorte;
  - melhoria editorial/evolutiva sem violação do contrato não amplia automaticamente a E19.4.

### 3.4. Próxima ação

- Submeter esta v2 ao Analista em duas passagens obrigatórias: primeiro sem pareceres nem matriz; depois, no mesmo contexto, com a matriz criada após a Passagem 1 e os pareceres integrais.
- Corrigir apenas achados materialmente aplicáveis até obter aprovação explícita ou apontamento de decisão humana indispensável.
- Após aprovação, executar `lp-factory-abc` sobre `docs/roadmap.md`, registrar o checkpoint `LP-Factory-Stage: plan-v2-approved` no único PR draft e iniciar E19.4.3.
- A implementação segue E19.4.3 → E19.4.4 → E19.4.5; migration e runtime podem compartilhar o mesmo PR, mas a action e o preview só podem ser habilitados após merge, apply e verificação positiva da migration.
- Após implementação comprovada, registrar a automação em `docs/automations.md`, workload/configuração em `docs/platform-config.md`, fronteiras estáveis em `docs/base-tecnica.md`, schema em `docs/schema.md` e estado/evidências em `docs/roadmap.md`; `docs/services.md` permanece N/A.

## 4. Escopo negativo e critérios de parada

### 4.1. Fora da E19.4

- Publicação pública, domínio customizado e disponibilidade comercial.
- Tracking, analytics, dashboard de métricas, CRM, Google Ads e A/B test.
- Editor visual, edição manual estruturada, edição assistida por IA, regeneração, overwrite, histórico e rollback.
- Aprovação/rejeição persistida da LP, tabela de revisão ou workflow de publicação.
- Backend novo de submissão de lead ou capacidade operacional não prevista nos contratos vigentes.
- Nova ACL, papel ou autorização paralela.
- Segunda IA revisora, auditoria semântica própria ou provenance cognitiva declarada pela IA.
- Agents SDK, multi-agent, PTC, persisted reasoning, prompt caching, agente, job, fila, cron, webhook ou automação recorrente sem necessidade material demonstrada e nova decisão aplicável.
- Abstração geral de geração multicanal.
- Reabertura preventiva de E18.4, E18.5, E20.2, E20.3 ou E19.2.

### 4.2. Critérios de parada imediata

- Parar e devolver ao Estrategista se:
  - a implementação exigir decisão estrutural da IA ou comportamento agentic para cumprir o contrato;
  - surgir necessidade de reabrir E18.4, E18.5, E20.2, E20.3 ou E19.2 por bloqueio estrutural real;
  - o renderer só puder reproduzir a LP relendo fontes mutáveis e alterando silenciosamente seu estado visual ou de conteúdo;
  - a persistência não puder garantir ausência de materialização parcial sem ampliar materialmente o escopo aprovado;
  - for necessário criar backend de interação, tracking, publicação ou ACL nova para considerar a LP apenas visualizável;
  - a avaliação humana revelar defeito sistêmico comprovável do contrato, mesmo que inicialmente aparente ser apenas questão editorial;
  - surgir mudança que contradiga qualquer decisão fixa dos Gates A–E.

### 4.3. Critério de conclusão do recorte

- E19.4 está concluída quando uma LP real do fluxo oficial:
  - é gerada por ação humana autorizada;
  - passa pela validação objetiva do contrato;
  - é materializada integralmente em `draft` com snapshot coerente;
  - é reproduzida privadamente a partir de seu estado próprio;
  - é avaliada humanamente com as evidências previstas.
- Concluir a E19.4 prova a primeira LP real avaliável em `draft`; não prova prontidão para publicação nem disponibilidade comercial.
