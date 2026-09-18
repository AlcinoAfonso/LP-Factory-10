# Plano-base E10.9 — Pending Setup pré-comercial conversacional

- Fonte aprovada: Debate 15, PB1, seção 4.1 — https://docs.google.com/document/d/1m9F0VigPWpGzDHwThkgVWGsRQCpvQ0NMgPK1SENbxy0/edit?usp=drivesdk
- Revisão da fonte: `ANLCKQnpD68OzFv5chYFO0RpAnspyFmDn5s_y9eXDUDNIvn0F7IArGLT_cOjsKNDiMZ3sNzrb4tDtq4MFuQh8hTUSXc7NIVEutLmYGKYkK8`
- Estado: V1 funcional aprovada; aguardando derivação técnica.

## 4.1 PB1 — Pending Setup pré-comercial conversacional — V1

### 4.1.1 Problema e resultado funcional

- Problema: o Pending Setup vigente é um formulário mínimo que ativa a conta antes de concluir a resolução de nicho, separa a conversa da decisão comercial e não preserva continuidade relacional.

- Resultado: após confirmar o acesso por e-mail, o lead é recebido de forma humana, identificado pelo nome preferido, tem o negócio compreendido com o menor diálogo necessário, chega a uma resolução segura do nicho/taxon ou a um fallback explícito e segue para a experiência comercial sem receber entitlement por essa transição.

- O histórico da conversa permanece associado à mesma relação usuário/conta para retomada futura dentro da LP Factory.

### 4.1.2 Atores e comportamento esperado

- Ator principal: usuário autenticado que recebe a primeira conta pending_setup pelo fluxo autorizado e atua como owner dessa conta.

- A experiência começa antes de trial/compra e deve demonstrar valor pela compreensão do negócio, sem exigir que o lead conheça a taxonomia interna.

- O produto pergunta como deve chamar a pessoa somente quando essa preferência ainda não estiver disponível.

- A conversa começa com pergunta humana e aberta sobre o que a pessoa vende ou qual serviço presta; perguntas adicionais aparecem uma por vez e somente quando reduzem ambiguidade relevante.

- Resolução automática é permitida quando houver um único taxon oficial suficientemente claro; inferência material exige confirmação; ambiguidade relevante exige continuar a conversa.

- Se nenhum taxon oficial representar corretamente o negócio, o entendimento operacional é preservado em texto, a resolução oficial fica pendente e o lead pode seguir para a experiência comercial genérica.

- Se houver conversão sem taxon oficial competente, o onboarding factual permanece bloqueado até a resolução oficial.

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

### 4.1.4 Automação e IA

- Automação: sim. Natureza: automação com IA em fluxo controlado. Ambiente principal: runtime da LP Factory.

- Matching e regras determinísticas vêm primeiro; IA é usada somente para interpretação semântica, redução de ambiguidade, formulação da próxima pergunta quando necessária e saída estruturada compatível com os contratos de resolução.

- Responses API direta e Structured Outputs são a referência funcional de menor complexidade. Agents SDK, agente autônomo, job, fila, novo service e dependência obrigatória de Conversations da OpenAI ficam fora.

- O histórico canônico da conversa pertence à LP Factory; preservar histórico não significa enviá-lo integralmente a cada chamada de IA.

- A V1 não altera modelo nem reasoning effort do workload vigente. Mudança futura deve seguir a governança E21 e comparação representativa por workload.

- Falha ou indisponibilidade da IA não autoriza inventar taxon e deve preservar os caminhos determinístico, humano e de fallback aprovados.

### 4.1.5 Posição planejada no roadmap e fases

- Posição planejada: E10.9 — Pending Setup pré-comercial e continuidade conversacional.

- 10.9.1 — Objetivo e status: registrar o recorte como evolução planejada da jornada da conta, sem declarar implementação antes da execução.

- 10.9.3 — Entrada e identidade sem fricção: recepção pós-confirmação de e-mail, nome preferido, ausência dos campos Site/LP, canal preferido e “Nome do projeto” como perguntas obrigatórias.

- 10.9.4 — Conversa adaptativa e resolução do nicho: entendimento do negócio, três caminhos de resolução, fallback sem taxon inventado e preservação dos contratos oficiais.

- 10.9.5 — Histórico conversacional e retomada: preservar a conversa dentro da LP Factory e permitir continuidade entre lead, conta active sem entitlement e futuro cliente.

- 10.9.6 — Conclusão e passagem ao comercial: promover pending_setup para active sem entitlement, preservar gates vigentes e encaminhar ao comercial genérico ou personalizado conforme o contexto disponível.

- 10.9.2 Registros do recorte somente será materializado pelo fluxo técnico com artefatos realmente criados, ajustados ou excluídos.

### 4.1.6 Classificação e riscos materiais

- Classificação: Complexa.

- Motivo: o plano altera materialmente a ordem da jornada, cria uma nova experiência/orquestração greenfield sobre contratos preservados, combina conversa com resolução de nicho, introduz continuidade histórica funcional e exige substituir o caminho antigo sem regressão dos gates e autoridades existentes.

- Riscos principais: adaptar excessivamente o legado e recriar complexidade; manter caminhos paralelos ou compatibilizadores sem consumidor; remover contrato ainda necessário; aumentar fricção; resolver taxon incorreto; perder contexto; confundir active com entitlement; transformar histórico em autoridade factual; ampliar inadvertidamente para CRM/omnichannel.

- A complexidade não decorre de necessidade de arquitetura agentic; essa alternativa foi explicitamente excluída.

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

### 4.1.8 Supervisão

- Supervisão: Autônomo. O fluxo técnico pode conduzir o PB1 sem supervisão rotineira do Estrategista Original, preservando integralmente a V1; decisões que ultrapassem a autoridade concedida devem ser escaladas conforme o Prompt Estrategista.

