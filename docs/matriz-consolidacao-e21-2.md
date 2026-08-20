# Matriz de consolidação — E21.2

## Referências imutáveis

- Plano-base v1: PR #790, head `6edd3e74df26f0557e24e4606482339219b96f8b`, merge `d260a82bf3e121e8be3f17a24229ecbd54f829ff`, blob `5cba65232b22b06a7e49bbbe592b0e74d080d274` de `docs/lousa-plano-base-e21-2.md`.
- Roadmap congelado: `docs/roadmap.md`, blob `e896c907fc0ff5a566d08aeb46b881ae011f01e1` na `main` `d260a82bf3e121e8be3f17a24229ecbd54f829ff`.
- Plano conceitual: N/A.
- Plano-base v2 inicial: commit `42db45ef44d2661f995db2da1628cabfb01fac98`, blob `42a1b9643d91be0130d73cabaed074b8f4c89c81` de `docs/lousa-plano-base-e21-2-v2.md`.
- Plano-base v2 corrigido e aprovado na Passagem 1: commit `adb27f95174a6f13243a1a2e935383d41c35c332`, blob `eba0c6e5d7a6ac5adbbe8f5890ed3687eefbc7e5`.
- Passagem 1 independente: veredito inicial `CORREÇÕES OBRIGATÓRIAS`; `revisao_delta` da mesma instância: `APROVADO` e `aprovado para merge do plano-base v2`.
- Gestor de Automações: N/A — a v1 e as duas fases canônicas registram `Automação: não`.
- Relações usadas: `preservação do escopo`, `extensão adjacente necessária e proporcional` ou `expansão de escopo`.

## Parecer do Gestor Estrutural

Conclusão original integral: `requer patch estrutural`. Os sete achados foram preservados abaixo; a proposta de dois PRs do achado 005 não foi incorporada porque conflita com o invariante de branch/PR único do orquestrador e foi substituída pelo corte expand/contract depois aprovado pelo Analista.

| ID | Achado e patch original | Relação | Tratamento | Destino/localização | Evidência/estado |
|---|---|---|---|---|---|
| `GE-E21.2-001` | Identidade da fonte, merge, worktree, branch, base e ausência de estágio anterior precisavam ser confirmadas. | preservação do escopo | já coberto | v2 §1.1 e referências imutáveis desta matriz | PR #790, blobs, merge, branch e checkpoints estão fixos; nenhuma inferência por nome de worktree foi usada. |
| `GE-E21.2-002` / `PSE-E21.2-001` | Resolvers atuais eram síncronos e literais em `repo_catalog`; a origem dinâmica exige I/O assíncrono, ambiente e proveniência compatível. | extensão adjacente necessária e proporcional | incorporado e depois delimitado pelo `E21.2-P1-05` | v2 §§2.1, 2.7 e 3.1 | Nomes, boundary e shapes funcionais são preservados; somente `Promise + ambiente + origem/revisão` e ajustes mecânicos dos quatro callsites são autorizados. |
| `GE-E21.2-003` / `PSE-E21.2-002` | Paths e ownership de contratos, adapter, ações, UI, guard e ator não estavam fechados. | preservação do escopo | incorporado | v2 §§2.2, 2.8, 2.9 e 3.2 | `lib/openai-workloads/` mantém o domínio; adapter operacional e Server Actions têm paths únicos; cada ação reautoriza e o ator vem do servidor. |
| `GE-E21.2-004` / `PSE-E21.2-003` | Contrato físico/transacional, imutabilidade, locks, grants e revogação de `ai_readonly` estavam abertos. | extensão adjacente necessária e proporcional | incorporado; integridade reforçada pelo `E21.2-P1-03` | v2 §§2.3–2.5 e 2.8 | Três tabelas, RPCs transacionais, token otimista, RLS, grants mínimos, `SECURITY INVOKER`, FKs unit-safe e histórico append-only estão fechados. |
| `GE-E21.2-005` / `PSE-E21.2-004` | Migration e cutover no mesmo rollout poderiam implantar runtime antes do apply; o patch original propôs dois checkpoints públicos/PRs. | extensão adjacente necessária e proporcional | não incorporado literalmente — substituído por solução compatível | v2 §§1.5, 1.5.1, 3.1 e 3.2 | Um único PR nasce gate-off; E21.2.3 e E21.2.4 são implementadas pré-merge; apply, inspeção, Preview e Production gate-on ocorrem pós-merge. A Passagem 1 aprovou expressamente a substituição. |
| `GE-E21.2-006` / `PSE-E21.2-005` | Bootstrap, cutover, residência do registry e hidratação administrativa precisavam de detalhe executável. | preservação do escopo | incorporado | v2 §§1.5.1, 2.4, 2.7, 2.9 e 3.1 | Oito unidades/revisões/eventos exatos, registry como identidade/baseline local, leitura dinâmica sem cache e sequência Preview → Production estão explícitos. |
| `GE-E21.2-007` / `PSE-E21.2-006` e `PSE-E21.2-007` | Allowlist, prova pelos transportes reais e validações técnicas/hospedadas precisavam de fechamento. | preservação do escopo | incorporado; allowlist fechada pelo `E21.2-P1-04` | v2 §§1.6, 2.6, 2.10, 3.1 e 3.2 | Combinações exatas por workload, fixture segura sem persistência funcional, quatro transportes, testes focais/SQL, Preview e rollback estão definidos. |

## Parecer do Gestor de Updates

Veredito original integral: `updates aplicáveis com patches autossuficientes`.

| Update | Achado original | Relação | Tratamento | Destino/localização | Evidência/estado |
|---|---|---|---|---|---|
| `supa#2` | Após a migration e antes do cutover, Security Controls Dashboard deve confirmar roles, RLS, policies, grants e exposição; alerta incompatível bloqueia o corte. | extensão adjacente necessária e proporcional | incorporado como trava | v2 §§1.5.1, 2.8, 3.1 e 3.2 | A inspeção é pós-apply e anterior a cada gate-on; falha mantém/restaura o ambiente gate-off. |
| `supa#40` | Criar snippet SQL read-only versionado em `supabase/snippets/` para provar oito baselines, uma ativa, no máximo uma pendente, referências e lifecycle válidos. | extensão adjacente necessária e proporcional | incorporado | v2 §§2.4, 2.8, 3.1 e 3.2 | O snippet é prova e gate; constraints físicas continuam obrigatórias. |
| `prod#14` | A pessoa autorizada deve reconhecer ativa, candidata, validada pendente, ativação e rollback sem inferência técnica. | preservação do escopo | incorporado | v2 §§2.9, 2.10 e 3.2 | Teste de reconhecimento é critério explícito e não cria telemetria ou programa próprio. |
| `prod#16` | Executar QA em Preview, desktop/mobile, lifecycle completo, papéis positivo/negativo e sucesso/erro. | preservação do escopo | incorporado | v2 §§2.10 e 3.2 | Validação hospedada proporcional e manual permanece gate operacional pós-merge. |
| `prod#17` | Aplicar baseline proporcional da WCAG 2.2 em teclado, foco, nomes/labels, erros/feedback, contraste, toque e hover, sem alegação integral. | extensão adjacente necessária e proporcional | incorporado | v2 §§2.10 e 3.2 | Ferramenta automática é apoio; revisão manual continua obrigatória. |
| `supa#5` | Unified Logs pode apoiar diagnóstico quando logs atuais forem insuficientes e a disponibilidade estiver comprovada. | expansão de escopo se implementado agora | não incorporado — oportunidade condicional | futuro condicionado | A v2 usa observabilidade segura existente e proíbe nova infraestrutura de logs. |
| `supa#46` | Logs Drains/Audit Log Drains podem centralizar retenção ou auditoria em plano e caso próprios. | expansão de escopo se implementado agora | não incorporado — oportunidade condicional | futuro condicionado | Sem necessidade, plano ou destino externo comprovado; Log Drains está no escopo negativo. |
| `supa#56` | Push Protection para `supabase_secret_key` é controle operacional útil, cujo estado não pode ser inferido pelo repositório. | preservação do escopo como segurança condicional | não incorporado — oportunidade condicional | configuração de plataforma futura | O recorte não cria ou move secret; revisão de diff e proibição de `.env` permanecem gates. |
| `supa#63` | `rlsautotest` pode gerar testes pgTAP quando houver adoção aprovada e extensão disponível. | expansão de escopo se implementado agora | não incorporado — oportunidade condicional | futuro condicionado | A v2 exige testes SQL focais e snippet sem instalar ferramenta beta comunitária ou `pgtap`. |
| `supa#68` | Filtros compostos de Postgres Changes podem reduzir eventos em caso real de atualização em tempo real. | expansão de escopo se implementado agora | não incorporado — oportunidade condicional | futuro condicionado | E21.2 requer leitura na execução seguinte, não Realtime; assinaturas/publicações estão proibidas. |
| `supa#69` | W3C Trace Context pode correlacionar traces da aplicação e logs Supabase quando houver tracer aprovado. | expansão de escopo se implementado agora | não incorporado — oportunidade condicional | futuro condicionado | Não há tracer/OpenTelemetry aprovado; tracing está no escopo negativo. |
| `vercel#1` | AI Gateway pode centralizar orçamento/observabilidade/fallback quando integração direta deixar de atender. | expansão de escopo se implementado agora | não incorporado — oportunidade condicional | futuro condicionado | A integração direta permanece suficiente; a v2 proíbe provider/router/fallback adicional. |
| `vercel#15` | Vercel Toolbar pode apoiar inspeção visual se já disponível no Preview. | preservação do escopo como ferramenta opcional | não incorporado — oportunidade condicional | QA opcional | Não configurar, contratar nem tornar Toolbar dependência ou substituta da revisão manual. |
| `vercel#20` | Flags/Flags Explorer poderiam apoiar rollout e overrides futuros. | expansão de escopo se implementado agora | não incorporado — justificado | futuro condicionado | O gate server-side temporário resolve somente o cutover; não adota SDK, segmentação, split ou Vercel Flags. |
| `vercel#26` | Cache Reasons pode diagnosticar rotas cacheáveis quando houver política de cache aplicável. | expansão de escopo se implementado agora | não incorporado — oportunidade condicional | futuro condicionado | A fonte operacional é lida sem cache; Cache Components/ISR não integram o recorte. |
| `github#10` | Workflow execution protections podem restringir atores/eventos em Actions sensíveis. | expansão de escopo operacional se implementado agora | não incorporado — oportunidade condicional | governança global futura | E21.2 não cria ou altera workflow; migration usa o pipeline canônico e revisão de YAML permanece fora do diff. |

## Parecer do Gestor de Automações

| ID | Achado | Relação | Tratamento | Destino/localização | Evidência/estado |
|---|---|---|---|---|---|
| `AUTO-N/A` | A v1 e E21.2.3/E21.2.4 registram `Automação: não`; não há agente, job, rotina recorrente, workflow novo ou seleção autônoma. | preservação do escopo | N/A pelo contrato de acionamento | v2 §§1.4, 3.1, 3.2 e 4.1 | Nenhum Gestor de Automações foi iniciado; prova OpenAI sob gatilho humano não muda a categoria. |

## Passagem 1 e revisão delta

Veredito inicial integral: `CORREÇÕES OBRIGATÓRIAS`. Veredito da mesma instância após o delta `42db45e..adb27f9`: `APROVADO`, com conclusão formal `aprovado para merge do plano-base v2`.

| ID | Achado original | Relação | Tratamento | Destino/localização | Estado |
|---|---|---|---|---|---|
| `E21.2-P1-01` | Um único PR era incompatível com tratar apply/inspeção hospedada pós-merge como dependência para iniciar E21.2.4. | extensão adjacente necessária e proporcional | incorporado após correção objetiva | v2 §§1.5.1, 3.1 e 3.2 | Checkpoint técnico pré-merge separado do cutover operacional pós-merge; revisão delta aprovou integralmente. |
| `E21.2-P1-02` | A flag nova não tinha contrato e residência documental obrigatória. | extensão adjacente necessária e proporcional | incorporado após correção objetiva | v2 §§1.5 e 3.1 | Variável server-side, literal habilitador, defaults, ambientes, redeploy e atualização de `docs/platform-config.md` fechados; aprovado. |
| `E21.2-P1-03` | FK simples permitiria ponteiro/evento referenciar revisão de outra unidade. | extensão adjacente necessária e proporcional | incorporado após correção objetiva | v2 §2.3 | Chaves/FKs compostas unit-safe, ações restritivas e snippet como prova; aprovado. |
| `E21.2-P1-04` | A v2 não enumerava o subconjunto aceito por cada workload. | preservação do escopo | incorporado após correção objetiva | v2 §1.6 | Três workloads textuais e workload de imagem têm combinações exatas; aprovado. |
| `E21.2-P1-05` | Preservação literal da API/consumers contradizia `Promise + ambiente` e ajuste dos callsites. | preservação do escopo | incorporado após correção objetiva | v2 §2.1 | Preservação semântica e ownership fechados; delta técnico limitado e aprovado. |

## Travas preservadas para a execução

- Um único branch/PR; nenhum apply remoto pré-merge, PR precursor, branch de migration ou merge local.
- Gate ausente/não `true` durante a implementação pré-merge; após habilitação, nenhuma falha pode consultar `repo_catalog`.
- Supabase é a única residência operacional; não adotar AI Gateway, Vercel Flags, Global Config, Realtime, cache, tracing ou drains.
- Security Controls, snippet, grants/RLS, bootstrap e constraints bloqueiam o gate-on em caso de incompatibilidade.
- Allowlist é fechada em código; não aceitar modelo/effort/quality livre do client ou ampliar combinações automaticamente.
- Prova candidata usa os transportes existentes, fixture segura e nenhuma persistência funcional; não produz benchmark E21.3.
- Validação automática não substitui revisão manual; WCAG 2.2 é baseline proporcional, não declaração de conformidade integral.
- A `OPENAI_API_KEY` aprovada é reutilizada somente no ambiente hospedado autorizado; não é copiada, exibida, commitada ou usada em teste local.
- ABC intermediário distingue código entregue de gates pós-merge pendentes; conclusão operacional somente depois de Preview e Production aprovados.

## Transporte para a Passagem 2

| Classe | Conteúdo transportado |
|---|---|
| Preservação do escopo | Unidade ambiente/workload, lifecycle humano, Supabase único, Development local, boundary comum, allowlist, prova por workload, segurança, UX e separação E21.2/E21.3. |
| Extensão adjacente necessária e proporcional | Aggregate de três tabelas/RPCs, FKs unit-safe, resolver assíncrono, gate expand/contract, snippet/Security Controls e validações hospedadas proporcionais. |
| Expansão de escopo | Segundo PR, AI Gateway, Vercel Flags, Global Config, Realtime, cache, tracing, drains, rlsautotest, workflow protections e infraestrutura adicional; todos rejeitados ou apenas condicionais. |
| Gates operacionais pós-merge | Apply canônico, snippet, Security Controls, Preview gate-on/smoke/rollback e Production gate-on/smoke mínimo. |
