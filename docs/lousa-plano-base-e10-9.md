# Plano-base E10.9 — Pending Setup pré-comercial conversacional

- Fonte aprovada: Debate 15, PB1, seção 4.1 — https://docs.google.com/document/d/1m9F0VigPWpGzDHwThkgVWGsRQCpvQ0NMgPK1SENbxy0/edit?usp=drivesdk
- Revisão da fonte: `ANLCKQnpD68OzFv5chYFO0RpAnspyFmDn5s_y9eXDUDNIvn0F7IArGLT_cOjsKNDiMZ3sNzrb4tDtq4MFuQh8hTUSXc7NIVEutLmYGKYkK8`
- Estado: V2 técnica candidata à avaliação do Analista; V1 funcional preservada no commit `f40248a69002483f8fb378f470ca73afd34475dd`.

## 4.1 PB1 — Pending Setup pré-comercial conversacional — V2 técnica

### 4.1.1 Problema e resultado funcional

- Problema: o Pending Setup vigente é um formulário mínimo que ativa a conta antes de concluir a resolução de nicho, separa a conversa da decisão comercial e não preserva continuidade relacional.

- Resultado: após confirmar o acesso por e-mail, o lead é recebido de forma humana, identificado pelo nome preferido, tem o negócio compreendido com o menor diálogo necessário, chega a uma resolução segura do nicho/taxon ou a um fallback explícito e segue para a experiência comercial sem receber entitlement por essa transição.

- O histórico da conversa permanece associado à mesma relação usuário/conta para retomada futura dentro da LP Factory.

**Derivação técnica da V1:** o caso usa a rota `/a/[account]` e a primeira conta criada pelo fluxo autorizado. A conta só passa ao comercial depois de uma conclusão persistida: identidade mínima, entendimento operacional do negócio e taxon oficial seguro ou fallback explícito. A conclusão não escreve entitlement. A conversa é dado funcional do produto e não substitui `audit_logs`, `audit_context_event` ou `account_niche_resolutions`.

### 4.1.2 Atores e comportamento esperado

- Ator principal: usuário autenticado que recebe a primeira conta pending_setup pelo fluxo autorizado e atua como owner dessa conta.

- A experiência começa antes de trial/compra e deve demonstrar valor pela compreensão do negócio, sem exigir que o lead conheça a taxonomia interna.

- O produto pergunta como deve chamar a pessoa somente quando essa preferência ainda não estiver disponível.

- A conversa começa com pergunta humana e aberta sobre o que a pessoa vende ou qual serviço presta; perguntas adicionais aparecem uma por vez e somente quando reduzem ambiguidade relevante.

- Resolução automática é permitida quando houver um único taxon oficial suficientemente claro; inferência material exige confirmação; ambiguidade relevante exige continuar a conversa.

- Se nenhum taxon oficial representar corretamente o negócio, o entendimento operacional é preservado em texto, a resolução oficial fica pendente e o lead pode seguir para a experiência comercial genérica.

- Se houver conversão sem taxon oficial competente, o onboarding factual permanece bloqueado até a resolução oficial.

**Derivação técnica da V1:** `account-journey-loader.ts` entrega o novo componente conversacional somente para conta `pending_setup` com membership ativo e papel `owner`. Cada Server Action repete a checagem de usuário, conta, membership, papel e status antes de ler ou gravar. A entrada recupera um nome preferido válido já associado ao `user_id`; se ausente, faz a pergunta humana e o salva por usuário. Em seguida faz a pergunta aberta de negócio. O servidor aceita no máximo uma resposta nova por turno, decide o próximo estado e apresenta no máximo uma pergunta de esclarecimento. Estados explícitos: `awaiting_name`, `awaiting_business`, `awaiting_clarification`, `awaiting_confirmation`, `ready_official`, `ready_fallback` e `completed`; são estado de UI/domínio, não nova autoridade taxonômica. A retomada deriva o estado persistido e mantém a ação seguinte compreensível.

### 4.1.3 Decisões de produto, preservação e escopo negativo

- Estratégia aprovada: a E10.9 será greenfield na experiência e na orquestração do Pending Setup. A UI/formulário vigente e a sequência atual de save → ativação → resolução posterior não constituem base arquitetural obrigatória da nova jornada.

- Preservação obrigatória: business_taxons, business_taxon_aliases, matching determinístico, avaliação de confiança, account_niche_resolutions como resolução operacional, account_taxonomy como vínculo oficial, regra de um primário ativo, proibição de a IA criar taxon/alias/vínculo oficial, workload niche_resolution e governança E21, Auth, membership, accounts.status, entitlement, gates de checkout, fallback comercial e dados históricos existentes.

- Antes de remover ou substituir qualquer contrato ou comportamento preservado, o fluxo técnico deve provar equivalência ou superioridade funcional item a item. Na ausência dessa prova, o contrato existente permanece.

- A experiência antiga pode ser removida depois que o novo caminho comprovar os comportamentos ainda necessários e não houver consumidor real dependente. Preservação funcional não obriga preservar componente, validação ou ação que tenha se tornado código morto.

- Não adaptar PendingSetupFirstSteps, validateE10_4SetupForm ou saveSetupAndContinueAction como base obrigatória da nova UX apenas para aproveitar o legado; a V2 pode reutilizar partes estritamente competentes, mas deve justificar cada reaproveitamento pelo contrato atual.

- Não manter dois fluxos de Pending Setup, modo legado, fallback para o formulário antigo ou camada de compatibilidade entre jornada antiga e nova sem consumidor real comprovado.

- Não transportar para a nova conversa name, preferred_channel ou site_url como requisitos artificiais apenas porque pertencem ao formulário antigo. accounts.name permanece funcional, preferred_channel/site_url e dados históricos permanecem preservados fisicamente até decisão técnica competente.

- WhatsApp é dado comercial reutilizável e independente da preferência de canal; quando informado, não pode ser apagado automaticamente. Sua coleta deve ocorrer sem recriar o antigo formulário.

- Não mover NicheResolutionCard para dentro do novo Pending Setup como segunda etapa redundante. A função de confirmação/resolução necessária deve existir uma única vez na nova jornada; componentes antigos só permanecem se houver consumidor independente comprovado.

- Não criar novo engine de onboarding, framework genérico de conversas, camada genérica para futuros onboardings, CRM, plataforma de mensagens, orquestrador agentic, Agents SDK, job, fila ou novo service para cumprir este PB.

- Não redesenhar preços, planos, trial, checkout, entitlement, página comercial, onboarding factual E20.8, Pesquisa Profunda, Base de Comunicação ou geração de produtos.

- Não remodelar a taxonomia, não substituir account_taxonomy como autoridade oficial e não converter histórico conversacional ou texto livre em fato/taxon oficial.

- Não ingerir automaticamente WhatsApp, e-mail ou outros canais externos e não ampliar a persistência conversacional para omnichannel neste PB.

- Não apagar tabela, coluna, migration ou dado histórico para simplificar a implementação. Limpeza destrutiva de schema/dados fica fora do PB salvo decisão humana posterior específica.

- A conclusão válida da nova experiência promove pending_setup para active sem conceder entitlement; active não pode ser reinterpretado como compra, trial concedido ou acesso produtivo.

**Derivação técnica da V1 — boundaries e substituição:** criar `lib/onboarding/pending-setup/` restrito a contratos, provider da jornada e adapters da conversa; criar componente e Server Actions focais em `app/a/[account]/`. O provider consome os adapters atuais de taxonomia e de conta, sem transferir para eles o transcript. `accounts.name` mantém o valor provisório não vazio criado pelo fluxo da primeira conta; nome de negócio mencionado espontaneamente pode ser candidato a atualização competente, sem pergunta obrigatória. `account_profiles.whatsapp` recebe apenas gravação parcial, quando houver número válido informado; ausência de novo valor não apaga o anterior e não altera `preferred_channel` ou `site_url`. A pergunta opcional de WhatsApp aparece somente depois de demonstração inicial de valor e não impede a conclusão.

**Derivação técnica da V1 — prova anterior à remoção:** mapear, por busca de consumidores e testes, cada contrato preservado: Auth, membership, account status, perfil e WhatsApp, matching, confiança, resolução operacional, vínculo oficial e primário único, workload E21, comercial genérico/personalizado, checkout, entitlement e dados históricos. Substituir o caminho de `PendingSetupFirstSteps`, `validateE10_4SetupForm` e `saveSetupAndContinueAction` depois da prova; remover código exclusivo da jornada antiga que ficar órfão. `NicheResolutionCard` não integra o novo Pending Setup; preservá-lo somente se houver consumidor independente real de contas `active` históricas, condicionado para não reaparecer após a nova conversa. Não apagar coluna, migration ou dado histórico.

### 4.1.4 Automação e IA

- Automação: sim. Natureza: automação com IA em fluxo controlado. Ambiente principal: runtime da LP Factory.

- Matching e regras determinísticas vêm primeiro; IA é usada somente para interpretação semântica, redução de ambiguidade, formulação da próxima pergunta quando necessária e saída estruturada compatível com os contratos de resolução.

- Responses API direta e Structured Outputs são a referência funcional de menor complexidade. Agents SDK, agente autônomo, job, fila, novo service e dependência obrigatória de Conversations da OpenAI ficam fora.

- O histórico canônico da conversa pertence à LP Factory; preservar histórico não significa enviá-lo integralmente a cada chamada de IA.

- A V1 não altera modelo nem reasoning effort do workload vigente. Mudança futura deve seguir a governança E21 e comparação representativa por workload.

- Falha ou indisponibilidade da IA não autoriza inventar taxon e deve preservar os caminhos determinístico, humano e de fallback aprovados.

**Derivação técnica da V1 — decisão controlada:** usar `matchBusinessTaxonsDeterministic`, `evaluateDeterministicTaxonMatch`, `account_niche_resolutions` e o adapter de `account_taxonomy` atuais como autoridades distintas. Match oficial único com alta confiança pode gravar primário pelo adapter existente; inferência material exige confirmação na própria conversa; ambiguidade produz uma pergunta necessária por turno; ausência de taxon oficial adequado mantém texto operacional e pendência oficial, liberando apenas comercial genérico. Texto livre e saída da IA não criam taxon, alias ou vínculo oficial. Preservar a cardinalidade de no máximo um primário ativo e falhar fechado em conflito.

**Derivação técnica da V1 — confirmação durante o Pending Setup:** extrair do contrato vigente de confirmação somente a validação da resolução, a verificação de taxon/candidato e as escritas autorizadas. O provider novo chama essa operação focal enquanto a conta ainda está `pending_setup`, depois de a Server Action revalidar usuário, conta, membership ativo, papel `owner` e status. A action antiga continua aceitando apenas `active` para o consumidor histórico e não é exposta pela conversa nova. Ambas as entradas usam o mesmo adapter de `account_taxonomy`, a mesma trava de primário ativo e a mesma persistência operacional; não há bypass por simples remoção do check atual.

**Derivação técnica da V1 — IA:** a semântica usa Responses API direta, Structured Outputs de schema estrito e apenas a configuração pública vigente do workload `niche_resolution`, sem troca de modelo ou `reasoning.effort`. Enviar candidatos oficiais e contexto validado mínimo do turno; usar `store:false`, sem tools, Agents SDK, Conversations obrigatórias ou retry em loop. Versionar o prompt junto ao consumidor, separando instruções estáveis de dados delimitados. Validar IDs e saída no servidor. Recusa, resposta incompleta, schema inválido, timeout ou indisponibilidade geram falha tipada e continuação humana ou fallback explícito, sem taxon inventado. Registrar resultado, categoria de falha, latência, configuração e usage disponíveis com telemetria sanitizada, sem prompt, transcript ou PII; preservar captura financeira E21 aplicável.

### 4.1.5 Posição planejada no roadmap e fases

- Posição planejada: E10.9 — Pending Setup pré-comercial e continuidade conversacional.

- 10.9.1 — Objetivo e status: registrar o recorte como evolução planejada da jornada da conta, sem declarar implementação antes da execução.

- 10.9.3 — Entrada e identidade sem fricção: recepção pós-confirmação de e-mail, nome preferido, ausência dos campos Site/LP, canal preferido e “Nome do projeto” como perguntas obrigatórias.

- 10.9.4 — Conversa adaptativa e resolução do nicho: entendimento do negócio, três caminhos de resolução, fallback sem taxon inventado e preservação dos contratos oficiais.

- 10.9.5 — Histórico conversacional e retomada: preservar a conversa dentro da LP Factory e permitir continuidade entre lead, conta active sem entitlement e futuro cliente.

- 10.9.6 — Conclusão e passagem ao comercial: promover pending_setup para active sem entitlement, preservar gates vigentes e encaminhar ao comercial genérico ou personalizado conforme o contexto disponível.

- 10.9.2 Registros do recorte somente será materializado pelo fluxo técnico com artefatos realmente criados, ajustados ou excluídos.

**Derivação técnica da V1 — ordem executável:** implementar `10.9.3` (entrada, autorização e identidade por usuário), `10.9.4` (conversa, matching e resolução), `10.9.5` (histórico persistido e retomada) e `10.9.6` (conclusão e passagem comercial), cada qual com gate e evidência próprios. A migration necessária ao histórico pode ser preparada antes do runtime, mas o roadmap mantém os identificadores e a ordem acima. Na reconciliação de planejamento, `10.9.1` fica planejada; `10.9.2` é omitida até haver artefatos reais. Na execução, o ABC registra apenas artefatos efetivamente criados, ajustados ou excluídos.

### 4.1.6 Classificação e riscos materiais

- Classificação: Complexa.

- Motivo: o plano altera materialmente a ordem da jornada, cria uma nova experiência/orquestração greenfield sobre contratos preservados, combina conversa com resolução de nicho, introduz continuidade histórica funcional e exige substituir o caminho antigo sem regressão dos gates e autoridades existentes.

- Riscos principais: adaptar excessivamente o legado e recriar complexidade; manter caminhos paralelos ou compatibilizadores sem consumidor; remover contrato ainda necessário; aumentar fricção; resolver taxon incorreto; perder contexto; confundir active com entitlement; transformar histórico em autoridade factual; ampliar inadvertidamente para CRM/omnichannel.

- A complexidade não decorre de necessidade de arquitetura agentic; essa alternativa foi explicitamente excluída.

**Derivação técnica da V1 — persistência e acesso:** criar migration focal para (1) preferência de nome com chave `user_id` referenciando `auth.users`, para não transformar identidade da pessoa em atributo da conta; (2) cabeçalho de conversa 1:1 por `account_id`, com `owner_user_id` e timestamps; (3) turnos associados à conversa, com ID estável do turno, fala da pessoa, resposta/estado do produto e timestamps. Unicidade por conta e turno protege a identidade idempotente da fala, mas não constitui posse da tentativa corrente. A abertura de turno novo deve comparar, sob o mesmo lock da conta e da conversa, a revisão server-side da resolução lida pela action; revisão divergente retorna estado obsoleto sem inserir ou falhar turno. A revisão não atravessa o boundary do cliente. O índice `(account_id, created_at, id)` atende à retomada ordenada. Persistir a fala antes da chamada de IA; completar o mesmo turno com resposta ou falha recuperável. Erro de persistência impede resposta que aparente conclusão salva. A conversa permanece vinculada à mesma conta após `active` e conversão, sem entidade paralela de lead.

Cada criação ou retomada autorizada recebe uma versão monotônica da tentativa, persistida no próprio turno. Todo write de resolução, IA, confirmação, conclusão ou falha exige turn_id e a versão corrente sob o lock da conversa; retry incrementa a versão e invalida writers anteriores. Perda do lease ou contexto obsoleto apenas recarrega o estado autoritativo e não cria falha nova. Todas as RPCs afetadas devem adquirir locks na mesma ordem canônica já definida; é proibido introduzir ordem divergente entre conta, conversa, turno e resolução. Reutilizar a ordem vigente sem criar locks adicionais sem necessidade comprovada. Não são criados estados funcionais, tabela, fila, job ou compensação para essa mecânica.

**Derivação técnica da V1 — segurança da migration:** definir PK, FK com ações `ON UPDATE`/`ON DELETE`, checks de tamanho/conteúdo, timestamps, índices, RLS e decisão explícita de auditoria/Trigger Hub; `service_role` recebe apenas os grants necessários via adapter server-only após guard. Não conceder acesso direto a `anon`, `authenticated` ou `public`; revogar `SELECT` herdado por `ai_readonly` nas tabelas pessoais. Provar separadamente RLS, grants e negação pela Data API. Não criar view, service ou infraestrutura genérica. Atualizar `docs/schema.md` pelo ABC da implementação. Aplicar e verificar a migration no ambiente alvo antes de habilitar runtime que dependa das tabelas.

**Derivação técnica da V1 — discriminador e falhas:** o cabeçalho persiste `completed_at` e `completion_mode` (`official` ou `fallback`) somente depois de turno, resolução operacional e conclusão gravados. Para conta `active`, o loader exibe `NicheResolutionCard` histórico apenas quando não existe cabeçalho E10.9 concluído e a resolução antiga continua acionável; qualquer conclusão E10.9 suprime o card, inclusive `fallback`. Falha ao persistir fala, resposta, confirmação ou conclusão não pode apresentar o dado como salvo nem ativar a conta. Falha de matching ou IA, depois da fala persistida, mantém o turno retomável e oferece continuação humana ou fallback explícito persistido, sem vínculo oficial falso. O ABC factual da implementação substitui em `docs/base-tecnica.md` a regra antiga somente no boundary E10.9, preservando o sentido histórico de E10.4/E10.5.

**Derivação técnica da V1 — rollout:** usar migration aditiva e o Config server-side `E10_9_PENDING_SETUP_CONVERSATIONAL_ENABLED`, inicialmente `false`. Com a flag desligada, o código não consulta objetos E10.9 e retorna estado temporário controlado para `pending_setup`, sem executar o formulário antigo como fallback. O commit final remove o caminho antigo. Depois do merge autorizado, aguardar Production do mesmo SHA, aplicar a migration pelo workflow canônico, validar schema, RLS, grants e negações, definir a flag como `true` e redeployar o mesmo SHA; só então o loader consulta as tabelas e libera a conversa. Falha em qualquer prova mantém a flag desligada e não ativa conta. Registrar a flag e o cutover em `docs/platform-config.md`.

### 4.1.7 Critérios de aceite e evidências esperadas

- Um novo usuário autenticado com primeira conta pending_setup entra na experiência pré-comercial antes de trial/compra e não recebe capacidade produtiva apenas por concluir o Pending Setup.

- A UX não exige Site/LP, canal preferido nem “Nome do projeto” para avançar; accounts.name continua funcional para consumidores existentes.

- O nome preferido da pessoa é reutilizado quando já conhecido e solicitado de forma humana quando ausente.

- A conversa inicia por pergunta aberta de negócio e acrescenta no máximo uma pergunta por turno, somente quando necessária para reduzir ambiguidade.

- Casos representativos comprovam os três caminhos: resolução automática, confirmação humana e continuação do diálogo.

- Caso sem taxon oficial adequado não cria vínculo falso, preserva entendimento operacional e alcança o comercial genérico; se houver conversão, o onboarding factual não começa sem taxon oficial competente.

- WhatsApp informado permanece preservado independentemente da preferência de canal e não é apagado automaticamente.

- O histórico de conversa pode ser retomado após saída e retorno do usuário e continua associado à mesma relação após a mudança para active e eventual conversão.

- A conclusão válida promove a conta de pending_setup para active de forma controlada, sem criar entitlement; checkout e demais ações financeiras continuam submetidos aos gates vigentes.

- Falha da IA não cria taxon, não concede entitlement e não elimina a possibilidade de correção/continuação humana.

- QA visual comprova experiência progressiva e legível em viewport móvel e desktop, sem aparência de formulário longo, sem overflow e com estados de carregamento, erro, retomada e confirmação compreensíveis.

- Evidência técnica deve demonstrar: novo caminho único do Pending Setup; ausência de dependência indevida do formulário/orquestração antigos; equivalência funcional item a item antes de remover contratos existentes; remoção de código antigo exclusivamente órfão quando a substituição estiver comprovada; preservação de dados históricos; testes focais dos fluxos novos; e ausência de regressão nos gates de acesso, membership, account status, entitlement, taxonomia e comercial.

**Derivação técnica da V1 — validação por fase:** em `10.9.3`, testar nome conhecido/ausente, identidade por usuário, owner/membership e ausência de campos herdados; em `10.9.4`, testar match único, confirmação ainda em `pending_setup`, consumidor histórico `active`, ambiguidade, taxon inexistente, recusa/timeout/schema inválido e nenhum vínculo falso; em `10.9.5`, testar saída/retorno, retry, concorrência, isolamento entre contas, discriminador de conclusão e preservação de fala quando a IA falha; em `10.9.6`, testar transição condicional idempotente, supressão do card após conclusão oficial ou fallback, comercial genérico/personalizado, ausência de entitlement e checkout. Em `10.9.5`, comprovar também: duas confirmações concorrentes sobre a mesma revisão; clarificação concorrente com revisão vencida; retry do mesmo turno com invalidação da tentativa anterior; supersession de turno diferente expirado; write tardio após perda do lease; e conclusão válida sem turno falho criado por contexto obsoleto. A busca atual não encontrou entrada executável de onboarding factual por conta: antes do gate final, repetir a busca; se continuar inexistente, registrar a ausência como evidência, preservar `account_taxonomy` como autoridade futura e não exigir teste contra runtime inexistente. Se surgir consumidor real no intervalo, comprovar que ele exige taxon oficial. Cada fase executa `npm ci`, `npm run check` e testes focais aplicáveis; executar prova SQL de isolamento/ACL, cutover com flag desligada/ligada e QA visual móvel/desktop quando o runtime estiver disponível. O histórico e WhatsApp existentes não sofrem limpeza destrutiva. `docs/automations.md` deve refletir o novo gatilho conversacional; `docs/base-tecnica.md`, `docs/schema.md` e `docs/roadmap.md` recebem somente o delta factual competente via ABC após implementação; `docs/platform-config.md` registra a flag e o cutover.

**Critério técnico de acessibilidade:** a experiência permite entrada, resposta, confirmação, erro, retomada e conclusão por teclado, com ordem e indicação de foco coerentes; controles e mensagens têm identificação acessível, contraste e alvos de toque adequados. Validar os critérios WCAG 2.2 pertinentes manualmente em Preview móvel e desktop, com ferramenta automática quando útil, sem declarar conformidade integral.

### 4.1.8 Supervisão

- Supervisão: Autônomo. O fluxo técnico pode conduzir o PB1 sem supervisão rotineira do Estrategista Original, preservando integralmente a V1; decisões que ultrapassem a autoridade concedida devem ser escaladas conforme o Prompt Estrategista.
