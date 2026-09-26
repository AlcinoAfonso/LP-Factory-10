# Plano-base E21.2.6 — V1 funcional aprovada

Fonte: Debate 18A — Correção e proteção do catálogo de modelos OpenAI — LP Factory 10
URL: https://docs.google.com/document/d/1F87B83Xvy8GEWjoD81bk4Es7UNEJ7B5cqavwpnPP7fE/edit
Revisão da fonte: ANLCKQnmH-OWaMd5xFiQcnu2x5ZlRiBvNILiXfNUC7Jj2aoJPkyNvzJy0AR-qJREtxypEVenkneqgFDlQcrKl6p6F7xydO6GEVlD0oIcRXc
Seção: 4.1, PB 1. Transcrição fiel do texto; marcadores de lista convertidos para Markdown.

## 4.1. PB 1 — E21.2.6 Correção e proteção do catálogo de modelos OpenAI — V1 aprovada
- Estado: V1 funcional consolidada e aprovada.
- Problema: o catálogo aceita múltiplos efforts no cadastro inicial, mas não permite acrescentar posteriormente um effort ao mesmo modelo e admite identidades distintas que diferem apenas por grafia/caixa, favorecendo duplicatas e cadastros tecnicamente ambíguos.
- Resultado funcional: cada modelo passa a ter uma única identidade técnica canônica, concentra seus reasoning efforts autorizados e pode receber novos efforts posteriormente sem novo cadastro; novos modelos só são persistidos após confirmação ao vivo da identidade pela OpenAI.
- Comportamento esperado: o platform_admin informa o identificador técnico; antes da persistência, o sistema valida esse identificador na API oficial da OpenAI usando a credencial do projeto; somente uma resposta acessível cujo id corresponda exatamente ao valor informado permite gravar o modelo. Falha, ausência ou divergência impede a gravação e produz feedback claro.
- Parâmetros: no cadastro inicial podem ser associados vários efforts; depois da criação, o administrador pode acrescentar outro effort já conhecido pelo boundary à mesma identidade. Efforts podem permanecer disponíveis ou indisponíveis independentemente da disponibilidade do modelo.
- Reconciliação atual: gpt-6-sol e gpt-6-luna permanecem as identidades canônicas para novas seleções; variantes divergentes existentes deixam de competir por novas escolhas sem serem apagadas, preservando histórico e reprodutibilidade.
- Separação de responsabilidades: validar o modelo na OpenAI comprova apenas que o identificador existe e está acessível à credencial usada naquele momento. Não comprova suporte de todos os efforts, qualidade, custo-benefício ou adequação ao workload. A prova operacional existente continua sendo o gate da configuração antes da ativação.
- Atores: platform_admin administra o catálogo; a OpenAI é consultada somente como autoridade externa de identidade no ato explícito de cadastro.
- Escopo negativo — princípio: a correção é aditiva e preventiva; não constitui limpeza retroativa do catálogo.
- Não renomear, apagar, fundir, reescrever ou substituir identidades históricas de modelo. Variantes divergentes já existentes podem apenas deixar de competir por novas seleções, preservando histórico e reprodutibilidade.
- Não converter silenciosamente identificadores para minúsculas, corrigir grafia automaticamente ou persistir valor diferente do informado. O identificador exato deve ser validado pela OpenAI; falha ou divergência bloqueia o cadastro.
- Não alterar revisões ativas, revisões pendentes já validadas, ativações, ponteiros, rollback, snapshots ou histórico para corrigir identidade do catálogo.
- Não tratar confirmação da OpenAI como disponibilização. Novo modelo continua nascendo indisponível para seleção e exige ação humana explícita para ser disponibilizado, conforme o contrato vigente da E21.2.5.
- Não inferir, descobrir ou preencher reasoning efforts a partir da resposta do endpoint de modelos da OpenAI.
- Não executar inferência pela Responses API para testar cada effort como requisito do cadastro.
- Não aceitar novo nome de reasoning effort ou quality fora do vocabulário tipado vigente do boundary. Novo valor de parâmetro exige recorte técnico próprio.
- Não migrar, promover, ativar, provar novamente ou trocar automaticamente a configuração de qualquer workload como consequência da correção do catálogo.
- Não criar sincronização, descoberta periódica, importação automática, lista automática ou ativação automática de modelos a partir da OpenAI.
- Não criar segunda tabela, segundo catálogo, nova rota, cache, Realtime, job, cron, agente, serviço, engine ou nova infraestrutura para este recorte.
- Não enfraquecer RLS, grants, autorização platform_admin, versionamento otimista, comportamento fail-closed, separação server-side ou demais proteções vigentes da E21.2/E21.2.5.
- Não transformar a validação de identidade do cadastro em prova operacional do workload. A primeira responde apenas se o modelo existe e está acessível; a prova vigente continua sendo a autoridade para a combinação modelo + parâmetro antes de promoção/ativação.
- Critério de parada: se a solução exigir remover, substituir, redistribuir ou reduzir comportamento, responsabilidade, segurança, histórico ou contrato funcional já existente da E21.2/E21.2.5, interromper a execução antes da alteração e devolver o impacto ao Estrategista.
- Automação: não. A validação da OpenAI é síncrona, determinística e intrínseca à ação administrativa de cadastro, sem execução recorrente ou autônoma.
- Classificação: Light. O resultado permanece dentro da superfície administrativa, residência, lifecycle, segurança e boundary existentes da E21.2/E21.2.5; eventual detalhe técnico necessário será fechado pelo Executor e Gestor de Updates na V2 mínima.
- Posição planejada no roadmap: E21.2.6 — Correção e proteção do catálogo de modelos OpenAI.
- Fase planejada: E21.2.6 — reconciliar identidades divergentes para novas seleções, permitir acréscimo posterior de efforts e validar a identidade de todo novo modelo na OpenAI antes da persistência.
- Supervisão: Autônomo.
- Critérios de aceite: um modelo novo não é persistido sem confirmação ao vivo e correspondência exata do id retornado pela OpenAI; erro, ausência ou divergência não cria registro local.
- Critérios de aceite: diferença apenas de maiúsculas/minúsculas não cria segunda identidade selecionável; as variantes divergentes atuais são retiradas de novas escolhas sem perda de histórico.
- Critérios de aceite: um modelo pode possuir vários efforts no cadastro inicial e receber posteriormente outro effort suportado pelo boundary sem novo cadastro do modelo.
- Critérios de aceite: disponibilizar/indisponibilizar modelo ou effort preserva revisões ativas, histórico e rollback conforme o contrato vigente.
- Critérios de aceite: nenhuma correção do catálogo altera automaticamente configuração ativa de workload; a prova operacional continua obrigatória antes de promoção/ativação de nova configuração.
- Critérios de aceite: não existe sincronização automática com OpenAI, varredura periódica, inferência automática de efforts nem nova infraestrutura.
- Evidências esperadas: QA administrativa comprova cadastro válido, rejeição de identificador inválido ou divergente, bloqueio de duplicata por caixa, múltiplos efforts no mesmo modelo, acréscimo posterior de effort e preservação de revisão ativa/histórico.

