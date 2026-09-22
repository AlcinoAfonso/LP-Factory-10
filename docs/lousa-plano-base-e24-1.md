# E24.1 — Governança e cobertura do workflow de updates

Status: V1 funcional aprovada no Debate 18; execução Light; supervisão Autônoma.

Fonte aprovada: [Debate 18 — Compatibilidade operacional, pendências transversais e governança do workflow de updates — LP Factory 10](https://docs.google.com/document/d/1-LS7MvQBZ7fyKOd3SQFSecBsynAAsEElrh1fcSrHZuY/edit), seção 4.1, revisão `7`, de 22/09/2026 17:22:29Z.

## 1. Problema e resultado funcional

- Problema: o workflow não aplica de forma uniforme o gate de custo zero, os campos de ciclo de vida, a identificação das rodadas nem a cobertura técnica OpenAI.
- Resultado: o workflow semanal passa a cobrir Supabase, Vercel, GitHub, Produto e OpenAI com rastreabilidade comum, sem duplicar responsabilidades nem autorizar adoção.
- Posição planejada no roadmap: E24.1 — Governança e cobertura do workflow de updates.
- Classificação: Light, porque o resultado cabe nos documentos, contratos e automação existentes, sem nova arquitetura, agente ou infraestrutura.
- Automação: ajustar a automação existente; não criar nova automação, agente, job ou infraestrutura.
- Supervisão: Autônomo.

## 2. Fases planejadas

- E24.1.3 — consolidar ciclo de vida, gate econômico, campos obrigatórios e identificador de rodada.
- E24.1.4 — incorporar OpenAI à periodicidade semanal e delimitar workflow, snapshot e Gestor de Automações.
- E24.1.5 — reorganizar o snapshot por capacidades e retirar o conteúdo financeiro aprovado.
- E24.1.6 — validar o workflow atualizado sem criar mudanças artificiais ou duplicar PRs.

## 3. Critérios de aceite

- Toda rodada identifica inequivocamente seus PRs e detecta drafts da rodada anterior.
- Todo transversal ativo possui gatilho e critério de encerramento; implementados integrais permanecem apenas como histórico.
- Nenhuma recomendação de implementação ultrapassa zero custo incremental; recursos pagos continuam atualizados no radar.
- OpenAI é pesquisada semanalmente em fontes oficiais e suas capacidades técnicas têm destino rastreável no snapshot.
- O snapshot não contém preços, fórmulas, gráfico ou laboratório financeiro e continua preservando capacidades técnicas.
- O Gestor de Automações não repete a varredura ampla do workflow.

## 4. Escopo negativo

- Não criar novo agente, catálogo, workload, job, automação, serviço, infraestrutura ou controle paralelo.
- Não alterar código da aplicação, runtime, banco, schema, migration, rota, dependência ou comportamento funcional da LP Factory.
- Não contratar, ativar ou recomendar implementação com custo incremental; recursos pagos permanecem apenas registrados para avaliação futura.
- A cobertura OpenAI limita-se ao workflow, ao Gestor de Updates, ao Gestor de Automações e ao snapshot existentes.
- Não alterar modelos, prompts, reasoning effort, tools ou configuração dos workloads OpenAI.
- A retirada de custos do snapshot não autoriza criar outro documento, workload, mecanismo ou infraestrutura para armazená-los.
- Não remover, reduzir ou redistribuir capacidades, responsabilidades ou controles vigentes além das mudanças expressamente aprovadas na V1.
- Cada PR deve conter somente alterações do PB-A; qualquer arquivo, contrato ou comportamento adicional exige parada e decisão humana.

## 5. Estado da V1

- V1 funcional aprovada.
- Execução: Light.
- Supervisão: Autônomo.
- Dependências declaradas: nenhuma.

## 6. Plano-base V2 técnico mínimo

Status: derivado da V1 congelada no commit `83fedea72edecb7894e7691e554de4f50066a005`, blob `4f50a87cc25e4341f1bfaf77ce745d7128b50943`, a partir da `main` `17771f87c748463b370eab66531b98f863db1567`; consolidado para implementação Light sem gate adicional do Analista.

### 6.1. Boundary técnico e invariantes

- Ajustar somente o contrato documental do workflow semanal, os contratos runtime existentes do Gestor de Updates e do Gestor de Automações e o snapshot técnico OpenAI.
- Não criar catálogo, agente, skill, job, workflow GitHub Actions, automação, service, infraestrutura, código de aplicação ou consumidor de feed.
- Preservar os quatro catálogos atuais e sua ordem. A cobertura OpenAI é uma quinta etapa do mesmo workflow, com destino em `docs/openai-model-snapshot.md`, sem transformar o snapshot em catálogo novo.
- Cada execução define uma única rodada `updates-AAAA-MM-DD-rNN`; o identificador aparece em todas as branches e títulos dos draft PRs daquela rodada, acrescido apenas do alvo necessário para distingui-los.
- Antes de abrir PR, detectar drafts abertos de rodadas anteriores e do mesmo identificador; registrar e reutilizar o draft do mesmo alvo quando aplicável, sem criar duplicata.
- Aplicar zero custo incremental como gate anterior a qualquer recomendação de implementação, dependente de recorte ou transversal. Gratuidade não comprovada, upgrade ou cobrança adicional mantêm o recurso no radar, sem recomendação de implementação.
- Todo item transversal ativo registra estado, ação pendente, prioridade, motivo da permanência, gatilho e critério de encerramento. Item integralmente implementado e validado deixa a parte ativa e permanece somente no histórico compacto; item parcial permanece ativo apenas pelo saldo.
- O workflow faz a descoberta oficial ampla de OpenAI. O Gestor de Updates usa o snapshot junto dos catálogos para avaliar planos, sem manter catálogo paralelo. O Gestor de Automações consome capacidades já identificadas e executa somente a validação oficial focal exigida pelo caso; não repete a varredura ampla.
- `supa#60` é somente referência e trava: manter a consulta oficial manual já existente, sem RSS, feed Markdown ou novo consumidor.
- Não alterar modelos, prompts, reasoning effort, tools, workloads ou configuração operacional OpenAI.

### 6.2. E24.1.3 — Ciclo de vida, gate econômico, campos e rodada

- Em `docs/workflow-atualizacao-updates.md`, atualizar o resultado esperado, a preparação, a execução, o relatório e os limites para tornar normativos o identificador comum, a detecção de drafts anteriores e duplicados, o gate econômico e o ciclo de vida completo dos transversais.
- Preservar o fluxo sequencial e a regra de uma branch e um draft PR por alvo com alteração real, todos partindo do mesmo SHA inicial de `main`.
- Não criar alteração artificial quando o alvo não mudar e não criar segundo draft PR para o mesmo alvo e rodada.

### 6.3. E24.1.4 — Cobertura semanal OpenAI e divisão de responsabilidades

- Em `docs/workflow-atualizacao-updates.md`, incluir OpenAI após os quatro catálogos como etapa semanal sobre fontes oficiais e `docs/openai-model-snapshot.md`; pesquisar modelos, reasoning efforts, limites técnicos, APIs, tools, recursos agentic, aplicabilidade e maturidade, sem registrar preços ou produzir adoção automática.
- Em `.codex/agents/gestor-updates.toml`, manter a varredura dos quatro catálogos e incluir o snapshot técnico como fonte obrigatória para capacidades OpenAI relacionadas ao recorte, sem pesquisar update novo nem manter o snapshot.
- Em `.codex/agents/gestor-automacoes.toml`, exigir consumo prioritário das capacidades identificadas pelo workflow/snapshot e limitar a consulta oficial a validação focal de disponibilidade, status, superfície, limites e guardrails necessários ao caso, sem repetir descoberta ampla.
- Não alterar os modelos ou efforts configurados dos dois custom agents.

### 6.4. E24.1.5 — Snapshot técnico OpenAI sem conteúdo financeiro

- Reorganizar `docs/openai-model-snapshot.md` como fotografia técnica datada e itemizada, preservando baseline de workloads e registros rastreáveis de modelos, reasoning efforts, limites técnicos, APIs, tools, recursos agentic, aplicabilidade, maturidade e fontes oficiais.
- Remover preços, fórmulas, gráfico de preço-desempenho, protocolo financeiro e laboratório de custo, sem criar destino substituto.
- Remover `docs/artificial-analysis-intelligence-index-v4-1.png`, asset financeiro exclusivo do gráfico retirado e sem outro consumidor no repositório.
- Preservar `docs/platform-config.md` como autoridade da configuração efetiva e a governança por workload vigente; o snapshot não autoriza adoção nem mudança operacional.

### 6.5. E24.1.6 — Validação sem alterações artificiais ou PRs duplicados

- Executar `git diff --check` e inspeções estáticas que comprovem os campos de ciclo de vida, o identificador, a detecção de drafts, o gate econômico, a cobertura OpenAI e a divisão de responsabilidades.
- Confirmar que o snapshot não contém preços, fórmulas, gráfico ou laboratório financeiro e ainda contém capacidades técnicas, limites, maturidade, aplicabilidade, fontes e data.
- Validar a sintaxe dos dois TOMLs e confirmar que modelo, reasoning effort e sandbox permanecem inalterados.
- Consultar os draft PRs abertos e comprovar que a entrega não criou alteração artificial nem PR duplicado; a execução desta E24.1 não simula uma rodada nem abre PRs de catálogo.
- Como o recorte é exclusivamente documental e de contratos internos, `npm ci` e `npm run check` são não aplicáveis; nenhuma observabilidade de runtime ou QA visual é aplicável.

### 6.6. Updates e decisão de derivação

- Skill acionada: `$lp-factory-avaliar-plano-updates`, com parecer read-only sobre a V1 imutável.
- Veredito: `nenhum update aplicável`.
- Referência/trava: `supa#60`, somente para preservar a consulta manual do changelog oficial Supabase e proibir consumidor RSS/Markdown neste recorte.
- Não há patch tecnológico, candidato a confronto estrutural, arbitragem funcional, investigação adicional ou decisão humana.
- O Gestor de Automações não foi acionado: o contrato Light de `$lp-factory-executar-plano` proíbe especialista de automações, e a V1 já define a automação existente, o ambiente, a ausência de nova infraestrutura e a divisão funcional exigida.
- O Analista não é necessário: o delta é documental, determinístico, sem impacto funcional ou estrutural material e sem conflito ou dúvida residual de escopo.

### 6.7. Triagem ABC final

- Após implementar e validar todas as fases, executar a triagem final de `docs/prompt-abc.md` sobre todos os documentos canônicos potencialmente afetados.
- Avaliar ao menos `docs/roadmap.md`, `docs/gestor-updates.md`, `docs/gestor-automations.md`, `docs/automations.md`, `docs/platform-config.md` e `docs/base-tecnica.md`, além de outro canônico que a evidência final tornar material.
- Aplicar somente operações literais emitidas pelo ABC no documento competente e registrar `SEM ALTERAÇÕES NECESSÁRIAS` para cada documento sem delta.
- Alterar `docs/base-tecnica.md` somente se o ABC identificar regra técnica durável e reutilizável; não usá-la para repetir governança específica do workflow.
