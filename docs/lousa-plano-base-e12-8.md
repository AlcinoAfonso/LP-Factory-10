# Plano Base E12.8 — Piloto do padrão transversal no fluxo Taxonomia e cobertura factual

Fonte imutável de materialização: Debate 13, seção 4.2, Google Docs revision `ANLCKQlho9X_hkaDsiM8uJSiIE_BL1HncepGGSDjnT44GOG-AidAkvrQ4wr_ImIKKbD23Po8hx9HJxzSJZ4FUxEOhd_1WABSXuMxi9SvgeI`, lida em 26/09/2026.
URL: https://docs.google.com/document/d/1mdrcgzzZs5PKblaq5CiF873AT8anf0AoPRoMRPiIs00/edit

## V1 funcional aprovada — transcrição da seção 4.2

4.2 PB 2 — E12.8 Piloto do padrão transversal no fluxo Taxonomia e cobertura factual
4.2.1 Estado
- V1 funcional consolidada a partir das decisões já aprovadas do Debate 13.
- Execução: Light.
- Automação: não.
- Supervisão: pendente de escolha humana entre Semiautomático e Autônomo.
- O PB 2 é um piloto controlado; não autoriza adoção transversal automática nas demais áreas do Admin.
4.2.2 Problema e resultado funcional
- Problema: o contrato mínimo já está canônico para novas páginas, mas as superfícies existentes que originaram o Debate ainda mantêm fricções de linguagem, hierarquia, controles e continuidade entre tarefas.
- Resultado: aplicar e validar o padrão transversal em um fluxo real e já funcional do Admin, cobrindo Taxonomia → detalhe do taxon → cobertura factual → adicionar ou editar field → retorno ao contexto → liberação quando aplicável.
- O piloto deve demonstrar redução de carga técnica para o humano sem alterar regras, estados, autoridade, persistência ou capacidades existentes.
4.2.3 Usuários e atores
- Usuário principal: platform_admin.
- A IA permanece assistência consultiva nos pontos em que o fluxo atual já a oferece.
- Regras de taxonomia, cobertura factual, liberação, CRUD de fields e autorização permanecem sob seus contratos atuais; a E12.8 reorganiza somente apresentação e interação.
4.2.4 Comportamento esperado
- A lista de Taxonomia aplica o contrato canônico de coleção: cabeçalho enxuto, lista com aparência tabular como primeira opção, identidade humana do taxon, atributos essenciais, filtros úteis existentes e acesso explícito ao detalhe.
- A lista não precisa ganhar ordenação nova se ela não agregar valor proporcional; filtros e busca só permanecem ou evoluem quando úteis à tarefa.
- O detalhe do taxon apresenta primeiro identidade e estado, depois decisão pendente ou próxima ação, cobertura factual e ações humanas; IA opcional e detalhes técnicos permanecem semanticamente separados.
- Termos internos como IDs, slug, fieldKey, valueScope, obligation, validationKind e equivalentes não são a linguagem principal quando houver rótulo humano suficiente; detalhes técnicos continuam acessíveis quando necessários.
- O fluxo de adicionar ou editar field apresenta primeiro nome/finalidade, residência, tipo de resposta, obrigatoriedade e validação em linguagem humana.
- Controles de opções, limites, condições e aplicabilidade aparecem somente quando forem pertinentes à combinação atual; nenhuma mudança de controle pai apaga silenciosamente dado material que possa voltar a ser aplicável.
- Identificador técnico pode ser derivado ou ocultado da camada principal somente quando isso preservar integralmente as regras vigentes; conflito ou ambiguidade continua explícito.
- Sugestões de IA exibem nome humano, descrição, motivo/camada e ação humana; usar sugestão apenas prepara o mesmo fluxo humano e não executa mutação automática.
- Após criação, edição ou outra subtarefa, o usuário recebe feedback do que mudou e caminho natural de retorno ao contexto relevante da cobertura/taxon.
- Mobile preserva identidade, estado, informação essencial, ações e retorno; adaptação não pode gerar overflow indevido nem retirar capacidade.
- Estados vazio, loading, erro e sucesso seguem o Design System e preservam conteúdo válido sempre que o contrato permitir.
- Na lista de Taxonomia, a densidade visual deve ser compacta: registros em linhas consecutivas, sem cards por registro ou espaçamento vertical excessivo.
- Filtros e ordenação específicos de atributos, quando aplicáveis no piloto, ficam associados aos respectivos cabeçalhos das colunas; controles acima da lista ficam reservados à busca ou filtros realmente globais.
4.2.5 Limites e escopo negativo
- Não alterar regra de negócio, taxonomia, herança factual, liberação, autoridade Supabase, persistência, autorização ou contratos da E20.
- Não criar nem alterar banco, migration, RPC, job, agente, automação, engine ou infraestrutura.
- Não adicionar AG Grid, MUI Data Grid ou segunda biblioteca visual neste piloto.
- Não criar nova rota ou nova autoridade para substituir as superfícies vigentes; a V2 pode reorganizar componentes existentes somente dentro dos boundaries atuais.
- Não alterar workloads, prompts, modelo, Web Search ou lógica da IA.
- Não remover ação existente de criar, editar, inativar, reativar, liberar, gerenciar taxon, aliases, pesquisa ou avaliação que esteja funcionalmente disponível no recorte.
- Não estender o piloto para Workloads OpenAI, Custos OpenAI, Contas, Resoluções de nicho, Páginas comerciais, Documentação ou Auditoria.
- Alteração em componente compartilhado só pode ser aditiva ou comprovar preservação das superfícies fora do piloto; impacto funcional fora do escopo exige escalada antes da mudança.
- A escolha futura de biblioteca especializada para listas permanece fora deste PB.
4.2.6 Posição planejada no roadmap
- Posição: E12.8 — Piloto do padrão transversal no fluxo Taxonomia e cobertura factual.
- E12.7 permanece como contrato mínimo canônico para novas páginas.
- E12.8 materializa a primeira aplicação controlada do padrão em superfícies existentes; regras de domínio permanecem referenciadas nos casos responsáveis.
4.2.7 Fases
- 12.8.3 — Taxonomia como piloto de coleção e detalhe: aplicar o padrão à lista e ao detalhe do taxon, preservando busca, filtros, estados, criação, abertura, gestão e diagnósticos existentes.
- 12.8.4 — Cobertura factual e subtarefas como piloto de interação: aplicar linguagem humana, controles condicionais, separação IA/humano, feedback e retorno contextual ao fluxo factual já existente, preservando CRUD, liberação e contratos da E20.
4.2.8 Classificação
- Execução: Light.
- Motivo: o piloto usa rotas, componentes, adapters, Server Actions, contratos de domínio e Design System já existentes; não exige nova arquitetura, banco ou infraestrutura. A investigação técnica e a V2 mínima podem definir o menor delta de frontend necessário.
- Se a investigação provar necessidade de alterar contrato de domínio, persistência, autoridade, nova biblioteca estrutural ou comportamento fora do recorte, o Executor deve escalar em vez de ampliar o PB.
4.2.9 Automação
- Não há automação nova.
- A assistência por IA já existente é apenas preservada e reapresentada conforme o contrato vigente.
4.2.10 Supervisão
- Pendente de escolha humana entre Semiautomático e Autônomo.
- Após a escolha, o PB 2 pode seguir para handoff canônico sem depender da definição dos planos posteriores.
4.2.11 Critérios funcionais de aceite
- A lista de Taxonomia fica reconhecível como coleção operacional sem exigir interpretação de nomes internos e preserva todas as ações/filtros funcionais do recorte.
- O detalhe do taxon deixa evidente identidade, estado, decisão ou próxima ação antes de detalhes técnicos.
- O fluxo factual permite adicionar e editar fields em linguagem humana, mostrando somente controles aplicáveis e mantendo detalhes técnicos disponíveis em segundo nível.
- Nenhum dado material é descartado silenciosamente por alternância de tipo, validação ou condição.
- Sugestão de IA continua consultiva e não muta estado por renderização ou aceite da sugestão.
- Após subtarefa factual, o usuário entende o que mudou e consegue retornar ao contexto relevante sem redescobrir manualmente a jornada.
- Liberação humana e ações independentes continuam utilizáveis mesmo quando a assistência por IA falhar ou estiver indisponível.
- Desktop e mobile preservam hierarquia, legibilidade, ausência de overflow indevido, teclado, foco, labels, alvos de interação e feedback conforme o Design System/WCAG 2.2 proporcional.
- Nenhuma regra de negócio, persistência, autorização, segurança, auditabilidade ou capacidade existente é reduzida.
- Nenhuma área administrativa fora do piloto sofre alteração funcional.- A coleção de Taxonomia usa linhas compactas e consecutivas, sem altura ou espaçamento vertical desnecessário, preservando legibilidade e alvos de interação acessíveis.
- Quando houver filtro ou ordenação de atributo no piloto, o controle aparece associado ao cabeçalho da respectiva coluna; filtros globais permanecem separados apenas quando atuarem sobre a coleção inteira.
4.2.12 Evidências esperadas
- Inventário antes/depois das superfícies tocadas, registrando ações, estados, filtros, validações e capacidades preservadas.
- QA autenticado em Preview cobrindo Taxonomia → detalhe → cobertura factual → adicionar/editar field → retorno ao contexto → liberação quando aplicável.
- QA cobre cenário com IA disponível e indisponível, comprovando independência das ações humanas.
- Evidência desktop e mobile, teclado, foco, labels, feedback, controles condicionais e ausência de overflow indevido.
- Diff e testes de regressão demonstram preservação dos contratos existentes e ausência de banco, migration, RPC, job, agente, automação, infraestrutura ou biblioteca de grid nova.
- O roadmap registra somente E12.8 e as fases efetivamente executadas; a adoção das demais áreas continua fora do PB 2.

