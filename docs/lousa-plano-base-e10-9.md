# Plano-base E10.9 — Pending Setup pré-comercial conversacional

## PB1 — Pending Setup pré-comercial conversacional — V2 técnica candidata

Fonte funcional: Debate 15 — Pending Setup: recepção, identidade do usuário e resolução conversacional do nicho — LP Factory 10.

V1 congelada: commit `75c2f035bbd60ef6fa197b9449df0c12375c7d6e`, blob `59ddda9c32c76b5bfc027ed57cb1fafffc8bd180`.

Ajuste funcional superveniente da V1: a resolução de nicho admite no máximo três chamadas OpenAI por Pending Setup. Se a terceira chamada não produzir resolução segura, a investigação termina naquele fluxo, sem nova pergunta de nicho, e segue para o fallback operacional com a mensagem exata: “Ainda não consegui identificar seu nicho com segurança. Vou preservar o que você me contou para seguirmos sem associar uma categoria incorreta.”

Base técnica: `main` em `304a2d23448207bd77da7d7f93c2f1324072d072`.

Execução: Complexa.

Supervisão: Autônomo.

### 4.1.1 Problema e resultado funcional

- Problema: o Pending Setup vigente é um formulário mínimo que ativa a conta antes de concluir a resolução de nicho, separa a conversa da decisão comercial e não preserva continuidade relacional.
- Resultado: após confirmar o acesso por e-mail, o lead é recebido de forma humana, identificado pelo nome preferido, tem o negócio compreendido com o menor diálogo necessário, chega a uma resolução segura do nicho/taxon ou a um fallback explícito e segue para a experiência comercial sem receber entitlement por essa transição.
- O histórico da conversa permanece associado à mesma relação usuário/conta para retomada futura dentro da LP Factory.

#### Derivação técnica da V2

- `/a/[account]` permanece a entrada única da conta. `app/a/[account]/account-journey-loader.ts` continua decidindo a jornada a partir do Access Context e entrega a nova experiência somente quando a conta está `pending_setup`, o usuário autenticado possui membership ativo e papel `owner`.
- A nova responsabilidade reside em `lib/onboarding/pending-setup/`, com contratos fechados, política pura de transição, projeção limitada de contexto e adapter único de persistência. Esse boundary não substitui `lib/onboarding/niche-resolution/` e não se torna engine ou framework genérico.
- A UI reside em `app/a/[account]/_components/PendingSetupConversation.tsx`; as server actions focais residem em `app/a/[account]/pending-setup-actions.ts`. Estados de carregamento, erro, confirmação, retomada e conclusão permanecem route-local.
- A conclusão é uma transição server-side, autorizada, idempotente e transacional. Ela somente ocorre após resolução oficial segura, confirmação humana ou fallback operacional explícito e nunca cria entitlement, trial, plano ou pagamento.

### 4.1.2 Atores e comportamento esperado

- Ator principal: usuário autenticado que recebe a primeira conta `pending_setup` pelo fluxo autorizado e atua como owner dessa conta.
- A experiência começa antes de trial/compra e deve demonstrar valor pela compreensão do negócio, sem exigir que o lead conheça a taxonomia interna.
- O produto pergunta como deve chamar a pessoa somente quando essa preferência ainda não estiver disponível.
- A conversa começa com pergunta humana e aberta sobre o que a pessoa vende ou qual serviço presta; perguntas adicionais aparecem uma por vez e somente quando reduzem ambiguidade relevante.
- Resolução automática é permitida quando houver um único taxon oficial suficientemente claro; inferência material exige confirmação; ambiguidade relevante exige continuar a conversa.
- Se nenhum taxon oficial representar corretamente o negócio, o entendimento operacional é preservado em texto, a resolução oficial fica pendente e o lead pode seguir para a experiência comercial genérica.
- A investigação sem resolução segura usa no máximo três chamadas OpenAI por Pending Setup. Após a terceira chamada, termina sem nova pergunta de nicho e apresenta o fallback operacional aprovado.
- Se houver conversão sem taxon oficial competente, o onboarding factual permanece bloqueado até a resolução oficial.

#### Contrato técnico da conversa

- O estado fechado da jornada distingue: recepção/nome, descrição inicial, esclarecimento, confirmação, resultado pronto e conclusão. O servidor decide a transição válida; o client não escolhe status, taxon, vínculo ou ativação.
- Cada turno aceita uma única resposta do usuário e produz no máximo uma pergunta ou ação primária. Resposta duplicada ou concorrente usa versão otimista e idempotência; conflito recarrega o estado canônico sem duplicar mensagem nem avançar duas vezes.
- Alta confiança determinística pode formar a resolução operacional e o vínculo oficial sem etapa redundante. Inferência material persiste somente o estado pendente e exige confirmação. Ambiguidade relevante produz uma pergunta. Ausência de taxon competente exige confirmação explícita do fallback operacional.
- Em cada estado executável há uma única pergunta ou ação primária claramente reconhecível. Resposta, confirmação, erro, retomada e fallback indicam o próximo passo sem CTAs concorrentes e sem exigir conhecimento da taxonomia interna.

### 4.1.3 Decisões de produto, preservação e escopo negativo

- Estratégia aprovada: a E10.9 será uma substituição greenfield da experiência e da orquestração do Pending Setup. O runtime E10.4 vigente — formulário, validação e sequência save → ativação → resolução posterior — não constitui base da nova jornada e não deve coexistir como fluxo paralelo depois do cutover.
- Preservação obrigatória: `business_taxons`, `business_taxon_aliases`, matching determinístico, avaliação de confiança, `account_niche_resolutions` como resolução operacional, `account_taxonomy` como vínculo oficial, regra de um primário ativo, proibição de a IA criar taxon/alias/vínculo oficial, workload `niche_resolution` e governança E21, Auth, membership, `accounts.status`, entitlement, gates de checkout, fallback comercial e dados históricos existentes.
- Antes de remover ou substituir qualquer contrato ou comportamento preservado, o fluxo técnico deve provar equivalência ou superioridade funcional item a item. Na ausência dessa prova, o contrato existente permanece.
- A experiência E10.4 antiga deve ser retirada no mesmo cutover em que o novo caminho comprovar os comportamentos ainda necessários e a ausência de consumidor real dependente. A retirada não pode ser mergeada isoladamente nem deixar contas `pending_setup` sem experiência válida. Preservação funcional não obriga preservar componente, validação ou ação que tenha se tornado código morto.
- Não adaptar `PendingSetupFirstSteps`, `validateE10_4SetupForm` ou `saveSetupAndContinueAction` como base da nova UX ou da nova V2 apenas para aproveitar o legado. Qualquer reaproveitamento deve pertencer a contrato independente e comprovadamente preservado, não à orquestração E10.4 que está sendo substituída.
- Não manter dois fluxos de Pending Setup, modo legado, fallback para o formulário antigo ou camada de compatibilidade entre jornada antiga e nova sem consumidor real comprovado.
- Não transportar para a nova conversa `name`, `preferred_channel` ou `site_url` como requisitos artificiais apenas porque pertencem ao formulário antigo. `accounts.name` permanece funcional, `preferred_channel`/`site_url` e dados históricos permanecem preservados fisicamente até decisão técnica competente.
- WhatsApp é dado comercial reutilizável e independente da preferência de canal; quando informado, não pode ser apagado automaticamente. Sua coleta deve ocorrer sem recriar o antigo formulário.
- Não mover `NicheResolutionCard` para dentro do novo Pending Setup como segunda etapa redundante. A função de confirmação/resolução necessária deve existir uma única vez na nova jornada; componentes antigos só permanecem se houver consumidor independente comprovado.
- Não criar novo engine de onboarding, framework genérico de conversas, camada genérica para futuros onboardings, CRM, plataforma de mensagens, orquestrador agentic, Agents SDK, job, fila ou novo service para cumprir este PB.
- Não redesenhar preços, planos, trial, checkout, entitlement, página comercial, onboarding factual E20.8, Pesquisa Profunda, Base de Comunicação ou geração de produtos.
- Não remodelar a taxonomia, não substituir `account_taxonomy` como autoridade oficial e não converter histórico conversacional ou texto livre em fato/taxon oficial.
- Não ingerir automaticamente WhatsApp, e-mail ou outros canais externos e não ampliar a persistência conversacional para omnichannel neste PB.
- O fallback após a terceira chamada não cria automação, follow-up, canal preferido, job, fila, service ou infraestrutura adicional.
- Não apagar tabela, coluna, migration ou dado histórico para simplificar a implementação. Limpeza destrutiva de schema/dados fica fora do PB salvo decisão humana posterior específica.
- A conclusão válida da nova experiência promove `pending_setup` para `active` sem conceder entitlement; `active` não pode ser reinterpretado como compra, trial concedido ou acesso produtivo.

#### Contratos preservados e cutover do legado

- `account_profiles` e seus dados permanecem fisicamente intactos. O novo fluxo não chama `upsertAccountProfileV1`, não sobrescreve `whatsapp`, `preferred_channel` ou `site_url` e não transforma descrição do negócio em `accounts.name`.
- O matching, a confiança, `account_niche_resolutions`, `accountTaxonomyAdapter`, o transporte OpenAI e a contabilização do workload `niche_resolution` continuam no boundary competente; a nova jornada os orquestra sem duplicar autoridade.
- O consumidor executável do `NicheResolutionCard` permanece no journey loader e na página comercial para contas `active` com resolução acionável; essa dependência repo-side é a justificativa durável para preservar card, actions e leituras exclusivamente nesse caminho, nunca no novo Pending Setup. Como evidência datada de implementação, auditoria read-only do projeto hospedado em 20/09/2026 encontrou uma conta nesse estado. A consulta hospedada deve ser repetida imediatamente antes de qualquer limpeza futura e sua contagem não constitui invariante do plano.
- Após equivalência funcional comprovada, o mesmo cutover substitui a entrada de `PendingSetupFirstSteps` e remove `saveSetupAndContinueAction`, `validateE10_4SetupForm`, helpers E10.4 e adapters exclusivamente órfãos. `renameAccountAction`, `renameAccountNoStatus` e contratos não relacionados ficam fora da limpeza.

### 4.1.4 Automação e IA

- Automação: sim. Natureza: automação com IA em fluxo controlado. Ambiente principal: runtime da LP Factory.
- Matching e regras determinísticas vêm primeiro; IA é usada somente para interpretação semântica, redução de ambiguidade, formulação da próxima pergunta quando necessária e saída estruturada compatível com os contratos de resolução.
- Responses API direta e Structured Outputs são a referência funcional de menor complexidade. Agents SDK, agente autônomo, job, fila, novo service e dependência obrigatória de Conversations da OpenAI ficam fora.
- O histórico canônico da conversa pertence à LP Factory; preservar histórico não significa enviá-lo integralmente a cada chamada de IA.
- A V1 não altera modelo nem reasoning effort do workload vigente. Mudança futura deve seguir a governança E21 e comparação representativa por workload.
- Falha ou indisponibilidade da IA não autoriza inventar taxon e deve preservar os caminhos determinístico, humano e de fallback aprovados.

#### Contrato técnico da automação

- Recepção, identidade, persistência, retomada e conclusão são determinísticas e server-side. Saudação e primeira pergunta são code-owned. Campos estruturados de identidade e contato — nome, e-mail, WhatsApp e equivalentes — não integram payload OpenAI nem logs; texto livre é tratado como potencialmente contendo PII e passa por minimização e redação determinísticas de contatos antes da projeção externa.
- O runtime executa matching e confiança determinísticos antes de qualquer chamada. Alta confiança suficientemente única encerra sem OpenAI. Ambiguidade pode gerar no máximo uma chamada foreground por turno e três chamadas OpenAI por Pending Setup. Se a terceira chamada não produzir resolução segura, o runtime encerra a investigação de nicho naquele fluxo, não formula nova pergunta de nicho e transita para confirmação do fallback operacional com a mensagem exata aprovada.
- A chamada reutiliza o workload `niche_resolution` e sua configuração E21 vigente, sem alterar modelo ou reasoning effort. Usa Responses API direta, Structured Outputs estrito, `store:false`, `background:false`, deadline server-side e nenhuma tool, `previous_response_id`, Conversation, retry automático, loop, Agents SDK, job, fila ou service.
- O prompt separa inequivocamente instruções code-owned, candidatos oficiais permitidos e conteúdo não confiável do usuário. O input contém somente descrição de negócio minimizada, estado operacional, candidatos permitidos e projeção conversacional limitada. O output da IA distingue apenas `confirm_official`, `ask_clarifying_question` e `unresolved_fallback`: resolução oficial automática existe somente no caminho determinístico de alta confiança, sem OpenAI. Toda sugestão oficial após IA exige confirmação explícita, revalidação server-side de que o taxon permanece ativo e pertence ao conjunto permitido e persistência com `source_type = user_confirmed_ai`; `manual` fica reservado a seleção realmente manual.
- Recusa, timeout, configuração ausente, resposta incompleta ou schema inválido preservam correção, continuação humana e fallback, sem criar taxon, alias, vínculo, status ou entitlement.
- Telemetria E21 registra workload, ambiente, configuração/revisão, resultado, categoria segura de falha, latência, response ID e usage, além do ledger de custos vigente. Não registra campos estruturados de identidade/contato, descrição bruta, transcript, prompt ou resposta integral; testes cobrem redação de padrões de e-mail, telefone e URL presentes em texto livre antes de qualquer projeção ou log externo.

### 4.1.5 Posição planejada no roadmap e fases

- Posição planejada: E10.9 — Pending Setup pré-comercial e continuidade conversacional.
- 10.9.1 — Objetivo e status: registrar o recorte como evolução planejada da jornada da conta, sem declarar implementação antes da execução.
- 10.9.3 — Entrada e identidade sem fricção: recepção pós-confirmação de e-mail, nome preferido, ausência dos campos Site/LP, canal preferido e “Nome do projeto” como perguntas obrigatórias.
- 10.9.4 — Conversa adaptativa e resolução do nicho: entendimento do negócio, três caminhos de resolução, fallback sem taxon inventado e preservação dos contratos oficiais.
- 10.9.5 — Histórico conversacional e retomada: permitir retomada executável enquanto a conta permanecer `pending_setup` e, após `active`, preservar transcript e associação para consumidor futuro sem manter o chat executável neste PB.
- 10.9.6 — Conclusão, cutover e passagem ao comercial: promover `pending_setup` para `active` sem entitlement, preservar gates vigentes, retirar no mesmo cutover a entrada executável do runtime E10.4 antigo após comprovar a substituição funcional, sem manter fluxo paralelo nem criar janela de produção sem experiência válida, e encaminhar ao comercial genérico ou personalizado conforme o contexto disponível.
- 10.9.2 Registros do recorte somente será materializado pelo fluxo técnico com artefatos realmente criados, ajustados ou excluídos.

#### Sequência técnica executável

- `10.9.1` é estado documental planejado e não cria runtime. `10.9.2` permanece reservado ao ABC de consolidação final; não é checkpoint antecipado.
- `10.9.3 — Entrada e identidade sem fricção`: criar o boundary focal, a migration canônica, contratos de persistência e o início idempotente da conversa. Ler nome preferido somente da allowlist ordenada `user_metadata.preferred_name`, `user_metadata.full_name`, `user_metadata.name`; normalizar trim e espaços internos, aceitar de 1 a 80 caracteres sem controles nem `@` e rejeitar valor igual ao e-mail ou derivado de sua parte local. Quando ausente ou inválido, perguntar uma vez; quando recusado ou novamente inválido, persistir ausência explícita e seguir com saudação genérica, sem bloquear a jornada. Implementar a recepção e a primeira pergunta code-owned. A migration é fundação indispensável das subseções seguintes e não antecipa seus comportamentos de UI.
- `10.9.4 — Conversa adaptativa e resolução do nicho`: implementar política de turno e server action versionada, reusar matching/confiança/resolução oficiais, adequar o consumidor do resolver OpenAI sob `$lp-factory-criar-prompt`, limitar a três chamadas OpenAI por Pending Setup, encerrar a investigação sem nova pergunta após a terceira tentativa sem resolução segura, cobrir os três caminhos e o fallback e garantir uma única ação principal por estado.
- `10.9.5 — Histórico conversacional e retomada`: carregar transcript e estado canônicos por relação usuário/conta e retomar o ponto exato após saída/retorno somente enquanto `accounts.status = pending_setup`; após `active`, conservar transcript e associação para consumidor futuro, sem superfície executável de chat neste PB. Montar projeção limitada para IA e provar isolamento entre contas, truncamento do contexto e minimização de texto livre.
- `10.9.6 — Conclusão, cutover e passagem ao comercial`: concluir de forma transacional e idempotente, promover a conta sem entitlement, preservar o card apenas para o consumidor histórico `active`, substituir a entrada E10.4, remover somente código órfão comprovado e validar a passagem comercial genérica ou personalizada.
- Cada subseção recebe `LP-Factory-Phase: <identificador exato>` somente após validações próprias e `npm run check`. A última subseção executa validação integrada, QA e ABCs finais antes da entrega técnica.

### 4.1.6 Classificação e riscos materiais

- Classificação: Complexa.
- Motivo: o plano altera materialmente a ordem da jornada, cria uma nova experiência/orquestração greenfield sobre contratos preservados, combina conversa com resolução de nicho, introduz continuidade histórica funcional e exige substituir o caminho antigo sem regressão dos gates e autoridades existentes.
- Riscos principais: adaptar excessivamente o legado e recriar complexidade; manter caminhos paralelos ou compatibilizadores sem consumidor; remover contrato ainda necessário; aumentar fricção; resolver taxon incorreto; perder contexto; confundir `active` com entitlement; transformar histórico em autoridade factual; ampliar inadvertidamente para CRM/omnichannel.
- A complexidade não decorre de necessidade de arquitetura agentic; essa alternativa foi explicitamente excluída.

#### Persistência, segurança e risco operacional

- A migration cria `public.account_pending_setup_conversations` com `id`, `account_id`, `user_id`, `preferred_name`, `business_context_text`, `stage`, `resolution_outcome`, `version`, `created_at`, `updated_at` e `completed_at`; `(account_id,user_id)` é único e referencia a membership por FK composta com `ON UPDATE CASCADE ON DELETE RESTRICT`, preservando o histórico quando a membership mudar. `stage` é fechado em `identity|business_understanding|niche_confirmation|ready_to_complete|completed`; `resolution_outcome` é nulo antes de `completed` e fechado em `official|operational_fallback` na conclusão; `version >= 1`; nome e contexto respeitam os limites code-owned de 80 e 4.000 caracteres; e checks exigem `created_at <= updated_at`, `completed_at` nulo antes de `completed` e não anterior a `updated_at` na conclusão.
- A migration cria `public.account_pending_setup_messages` com `id`, `conversation_id`, ordinal único por conversa, `role` fechado em `user|assistant`, `content` e `created_at`; `ordinal >= 1`, `char_length(btrim(content))` fica entre 1 e 4.000, a FK usa `ON UPDATE CASCADE ON DELETE RESTRICT` e turnos não recebem update/delete operacional.
- RPCs focais e não genéricas garantem o início idempotente e executam append/transição/conclusão com versão otimista. Na conclusão `official`, exigem primário ativo em `account_taxonomy` e, quando o vínculo decorrer de sugestão da IA, taxon ainda ativo/permitido e `source_type = user_confirmed_ai`; na conclusão `operational_fallback`, exigem resolução operacional confirmada sem vínculo oficial. A mesma transação promove `accounts.status` de `pending_setup` para `active` e não toca entitlement. Trigger `BEFORE UPDATE` mantém `updated_at`; mutations fora das RPCs permanecem revogadas.
- As duas tabelas usam RLS, nenhuma policy direta para `anon` ou `authenticated`, `REVOKE` explícito de `PUBLIC`, `anon`, `authenticated` e `ai_readonly` e privilégios mínimos para `service_role`: conversa `SELECT/INSERT/UPDATE`, mensagens `SELECT/INSERT` e execução somente das RPCs necessárias. RPCs usam `search_path` fixo e não são API pública.
- O adapter server-only é a única residência de acesso às novas tabelas/RPCs. Client, adapter de taxonomia, adapter de perfil e boundary de access não acessam a persistência conversacional diretamente.
- As duas tabelas ficam explicitamente fora do Trigger Hub genérico e da cópia row-level para auditoria, porque contêm texto conversacional. Somente eventos app-level sanitizados de início, append, retomada, transição, conclusão e falha podem ser auditados, com IDs técnicos e estados fechados, nunca nome, contexto, conteúdo de mensagem ou transcript.
- O Supabase hospedado usa PostgreSQL 17 e o novo comportamento de exposição exige grants explícitos; RLS e grant são camadas distintas. Testes verificam ambos e impedem exposição acidental pela Data API.
- Risco de cutover: o workflow de migration e o deploy Production são independentes e o projeto Vercel está com auto-assign habilitado. O runtime novo não pode receber tráfego no domínio de Production antes do apply e da verificação da migration.

#### Gate operacional de migration e Production

- Imediatamente antes do merge já liberado pelo Estrategista Autônomo, confirmar ausência de merge concorrente e desabilitar `Auto-Assign Custom Production Domains` no ambiente Production do projeto Vercel `lp-factory-10`; essa mudança não ocorre durante planejamento ou implementação ordinária.
- O merge gera, para o mesmo merge SHA, um deployment Production em estado staged e o workflow `Pipeline Supabase — Apply Migrations`. O domínio vigente continua apontando para o deployment anterior; não há fallback para o formulário antigo dentro do novo runtime.
- Somente após o workflow de migration concluir com sucesso, a lista de migrations e a consulta read-only pós-apply confirmarem objetos, RPCs, RLS, grants e invariantes, o Executor confirma que o staged deployment corresponde ao mesmo merge SHA e o promove ao domínio de Production.
- Após promoção, executar smoke autenticado mínimo e conferir logs de erro; então restaurar o auto-assign para o estado operacional anterior. Falha em apply, verificação, identidade do SHA, deployment ou smoke impede promoção e mantém o deployment anterior servindo.
- O fluxo não cria flag de produto, caminho paralelo, workflow novo, deploy hook ou service. A guarda é operacional, temporária e limitada ao cutover com migration acoplada.

### 4.1.7 Critérios de aceite e evidências esperadas

- Um novo usuário autenticado com primeira conta `pending_setup` entra na experiência pré-comercial antes de trial/compra e não recebe capacidade produtiva apenas por concluir o Pending Setup.
- A UX não exige Site/LP, canal preferido nem “Nome do projeto” para avançar; `accounts.name` continua funcional para consumidores existentes.
- O nome preferido é reutilizado somente pela allowlist Auth e pelas regras de normalização aprovadas; valor ausente, inválido ou recusado resulta em uma única pergunta e depois saudação genérica, sem derivação a partir do e-mail nem bloqueio.
- A conversa inicia por pergunta aberta de negócio e acrescenta no máximo uma pergunta por turno, somente quando necessária para reduzir ambiguidade.
- Casos representativos comprovam os três caminhos: resolução automática, confirmação humana e continuação do diálogo.
- Caso sem taxon oficial adequado não cria vínculo falso, preserva entendimento operacional e alcança o comercial genérico; se houver conversão, o onboarding factual não começa sem taxon oficial competente.
- WhatsApp informado permanece preservado independentemente da preferência de canal e não é apagado automaticamente.
- O histórico pode ser retomado após saída e retorno enquanto a conta estiver `pending_setup`; após `active` e eventual conversão, continua associado à mesma relação e preservado, mas não mantém conversa executável neste PB.
- A conclusão válida promove a conta de `pending_setup` para `active` de forma controlada, sem criar entitlement; checkout e demais ações financeiras continuam submetidos aos gates vigentes.
- Falha da IA não cria taxon, não concede entitlement e não elimina a possibilidade de correção/continuação humana.
- A resolução de nicho faz no máximo três chamadas OpenAI por Pending Setup; se a terceira não produzir resolução segura, o turno persiste e apresenta exatamente “Ainda não consegui identificar seu nicho com segurança. Vou preservar o que você me contou para seguirmos sem associar uma categoria incorreta.”, não apresenta nova pergunta de nicho e transita para o fallback operacional, sem automação, follow-up, canal preferido ou infraestrutura adicional.
- QA visual comprova experiência progressiva e legível em viewport móvel e desktop, sem aparência de formulário longo, sem overflow e com estados de carregamento, erro, retomada e confirmação compreensíveis.
- Evidência técnica deve demonstrar: novo caminho único do Pending Setup; runtime E10.4 antigo sem entrada executável após o cutover; ausência de janela de produção sem experiência válida para contas `pending_setup`; ausência de dependência indevida do formulário/orquestração antigos; equivalência funcional item a item antes de remover contratos existentes; remoção de código antigo exclusivamente órfão quando a substituição estiver comprovada; preservação de dados históricos; testes focais dos fluxos novos; e ausência de regressão nos gates de acesso, membership, account status, entitlement, taxonomia e comercial.

#### Validação técnica e QA da V2

- `npm ci` uma vez no lote contínuo; `npm run check` e validações focais antes de cada checkpoint; `git diff --check` antes de publicar.
- Validator code-owned de `lib/onboarding/pending-setup/` cobre transições válidas/inválidas, allowlist/normalização/recusa do nome, rejeição de nome derivado do e-mail, primeira pergunta, três caminhos, fallback, IA indisponível, idempotência, versão concorrente, retomada somente em `pending_setup`, preservação não executável após `active`, histórico longo, isolamento entre contas e autorização owner.
- Testes do resolver cobrem zero chamada no caminho determinístico, ausência de `resolved_official` no schema da IA, no máximo uma chamada por turno ambíguo e três por Pending Setup, transição terminal para fallback após a terceira chamada sem resolução segura, ausência de nova pergunta de nicho, apresentação e persistência da mensagem aprovada, confirmação explícita com `source_type = user_confirmed_ai`, revalidação de taxon ativo/permitido, `store:false`, `background:false`, deadline, separação entre instruções/candidatos/conteúdo não confiável, minimização/redação determinística de texto livre, recusa/timeout/incompletude/schema inválido e rejeição de ID não permitido. Validadores de workloads, custos, jornada comercial, checkout e onboarding existentes continuam verdes.
- Teste SQL integral em PostgreSQL compatível e transação efêmera com rollback cobre parsing, FKs, domínios fechados de stage/outcome, limites de nome/contexto/conteúdo, ordinal positivo, coerência temporal, trigger de `updated_at`, unicidade, RLS, ausência de policies públicas, grants/ACL, idempotência, concorrência, exclusão do Trigger Hub/auditoria row-level, histórico após `active`, resultado oficial, fallback operacional e ativação sem entitlement. `supabase migration list --linked` e `supabase db push --linked --dry-run` completam a evidência pré-merge; nenhuma mutação remota ocorre antes do merge.
- Busca e diff provam ausência de entrada executável de `PendingSetupFirstSteps`, `saveSetupAndContinueAction` e `validateE10_4SetupForm`, e preservação do `NicheResolutionCard` somente no consumidor repo-side `active` comprovado. A consulta hospedada com os predicados do adapter é repetida imediatamente antes de eventual limpeza e permanece evidência datada, não condição arquitetural.
- QA autenticado no Preview cobre mobile e desktop, loading, erro, confirmação, fallback, saída/retorno e passagem comercial. Em todos os estados, há uma única próxima ação reconhecível.
- Nos controles aplicáveis, validar operação integral por teclado, foco visível e previsível após envio/erro/confirmação/retomada, labels/instruções/erros associados, feedback textual anunciado, contraste, alvo mínimo de 44 px conforme Design System e ausência de interação exclusiva por hover. Combinar inspeção automática e QA manual sem declarar conformidade WCAG 2.2 integral.
- Observabilidade: eventos sanitizados comprovam resultado e falha do fluxo e do workload sem campos estruturados de identidade/contato, descrição bruta, transcript, prompt ou resposta integral; testes comprovam a redação aplicável de contatos contidos em texto livre.
- Gate final: migration aplicada e verificada antes da promoção do mesmo SHA staged; smoke de Production confirma a nova entrada, retomada, ausência de entitlement e passagem comercial sem erro visível.

### 4.1.8 Supervisão

- Supervisão: Autônomo. O fluxo técnico pode conduzir o PB1 sem supervisão rotineira do Estrategista Original, preservando integralmente a V1; decisões que ultrapassem a autoridade concedida devem ser escaladas conforme o Prompt Estrategista.

### 4.1.9 Classificação dos acréscimos técnicos

- `derivação técnica da V1`: entrada/guard, boundary `pending-setup`, persistência relacional, RPCs transacionais, RLS/grants, política de turno, leitura de nome, reuso do boundary de nicho, continuidade, conclusão, limpeza órfã, validações e gate staged de cutover. Todos são necessários para executar resultados e invariantes já aprovados.
- `modernização técnica justificada`: critérios `prod#14` de uma única próxima ação reconhecível e `prod#17` de teclado, foco, semântica, anúncio, contraste e alvo de toque. Ambos possuem impacto estrutural baixo, nenhum impacto funcional e não exigem confronto estrutural.
- `ampliação de escopo`: nenhuma incorporada. Realtime, embeddings, filas, RLS automática ampla, AI Gateway, flags de produto, telemetria nova, programa de pesquisa, WhatsApp/omnichannel e demais oportunidades condicionais permanecem fora deste PB.
