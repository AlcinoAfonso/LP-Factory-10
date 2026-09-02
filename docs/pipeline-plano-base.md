# Pipeline de Plano Base

## 1. Objetivo

Definir a arquitetura única que conduz um caso ou recorte desde o Debate até sua conclusão, com processo proporcional ao risco e uma única residência para cada regra.

- O Pipeline atende aos modos Manual, Semiautomático e Autônomo.
- Cada plano usa o formato Light ou Completo.
- O Pipeline preserva escopo, segurança, qualidade, QA, evidências e rastreabilidade sem criar contratos concorrentes.
- Detalhes operacionais pertencem às fontes competentes referenciadas neste documento.

## 2. Fontes e precedência

- `README.md`: visão, escopo, stack e princípios do MVP.
- Este documento: papéis, modos, formatos, handoffs, gates e autoridades do Pipeline.
- `docs/prompt-estrategista.md`: Debate, V1 funcional e supervisão do Estrategista original.
- `docs/prompt-executor.md`: contrato universal de implementação do Executor.
- `AGENTS.md`: Git, branch, PR, publicação, validações e autoridade operacional.
- `.agents/skills/lp-factory-*/SKILL.md`: gatilhos, entradas, handoffs e integração dos subfluxos.
- `.codex/agents/*.toml`: competência, responsabilidade e critérios de julgamento dos especialistas e do Analista.
- `docs/prompt-abc.md`: funcionamento do ABC e atualização de documentos canônicos.
- Documentos canônicos do caso: requisitos e estado factual da matéria correspondente.

Conflito entre fontes deve ser devolvido ao supervisor competente. Este Pipeline não substitui regra operacional do `AGENTS.md` nem fonte canônica especializada.

## 3. Arquitetura-base

O Pipeline separa três decisões:

- Debate: define o contrato funcional e os planos necessários.
- Modo de condução: define quem supervisiona e como ocorrem os handoffs.
- Formato de implementação: define quanto processo técnico cada plano exige.

Modo e formato são eixos independentes. Um plano pode ser Manual, Semiautomático ou Autônomo e, separadamente, Light ou Completo.

## 4. Papéis

### 4.1. Estrategista original

- Conduz obrigatoriamente o Debate inicial.
- Consolida uma ou várias V1 funcionais.
- No Manual e no Semiautomático, supervisiona os planos até a conclusão.
- No Autônomo, transfere a supervisão pós-Debate ao Estrategista Autônomo.
- Não substitui especialistas, Analista ou Executor.

### 4.2. Estrategista Autônomo

- Recebe o conjunto de V1 aprovadas depois do Debate.
- Interpreta dependências, libera planos e cria uma task técnica para cada plano.
- Avalia entregas, determina correções e QA adicional e conclui cada plano dentro da autoridade concedida.
- Não conduz novo Debate funcional, não implementa e não produz diretamente a V2.

### 4.3. Task técnica do plano

- Mantém a continuidade técnica de um único plano, branch e PR.
- No Light, assume o contrato do Executor desde a V1 aprovada.
- No Completo, conduz o workflow técnico até a V2 aprovada e somente então assume o contrato universal do Executor.

### 4.4. Executor

- Implementa o contrato aprovado, executa validações e QA aplicáveis e produz evidências.
- Light recebe a V1 funcional aprovada.
- Completo recebe a V2 técnica aprovada.
- Não escolhe unilateralmente formato, amplia escopo, redefine produto ou substitui o supervisor.

### 4.5. Especialistas e Analista

- Gestor Estrutural: julga estrutura, boundaries, responsabilidades e coerência arquitetural.
- Gestor de Updates: avalia capacidades atuais que possam alterar materialmente a solução ou sua qualidade.
- Gestor de Automações: julga automação, autoridade, lifecycle e integração operacional.
- Analista: avalia coerência, cobertura, risco e aderência; não refaz especialidades nem implementa.

### 4.6. Supervisor competente

- Manual: Estrategista original.
- Semiautomático: Estrategista original, com handoff transportado pelo humano.
- Autônomo: Estrategista Autônomo.

Supervisor competente é uma responsabilidade funcional, não um papel adicional.

## 5. Debate e V1 funcional

Todo caso ou recorte começa por Debate conduzido pelo Estrategista original no chat comum e registrado no Google Drive.

O Debate define, conforme aplicável:

- problema e objetivo;
- resultado funcional e comportamento esperado;
- usuários ou atores;
- um ou vários planos e seus paths;
- escopo, limites e escopo negativo;
- dependências entre planos;
- decisão de automação e recortes aplicáveis;
- formato Light ou Completo de cada plano;
- modo Manual, Semiautomático ou Autônomo;
- critérios funcionais de aceite e evidências esperadas.

A V1 é funcional. Não antecipa arquivos, helpers, adapters, migrations ou outras decisões técnicas ordinárias sem necessidade funcional.

Um Debate usa por padrão um Google Doc e pode gerar `1..N` V1. O histórico do Debate preserva hipóteses, alternativas e decisões; o pipeline técnico recebe somente cada V1 aprovada e não depende desse histórico para executar.

## 6. Modos de condução

### 6.1. Manual

- Estrategista original e humano conduzem os handoffs.
- Especialistas e Executor podem atuar em chats ou tasks diferentes.
- O Estrategista original também pode exercer o papel de Executor.

### 6.2. Semiautomático

- O Estrategista original supervisiona.
- Cada plano aprovado é entregue a uma task técnica própria no Codex.
- O humano transporta entregas e decisões entre Estrategista e task técnica.

### 6.3. Autônomo

- O Estrategista original entrega o conjunto aprovado ao Estrategista Autônomo.
- O Estrategista Autônomo controla dependências, paralelismo, correções, QA, avanço e conclusão.
- Cada plano liberado recebe uma task técnica própria.

## 7. Formatos de implementação

### 7.1. Light

Light é usado quando o resultado cabe em boundaries, autoridades e contratos existentes. A presença isolada de banco, migration, escrita, IA ou código mutável não obriga o formato Completo.

- Gestor de Updates participa quando a atualidade tecnológica puder alterar materialmente a solução, a qualidade ou a validação.
- Gestor Estrutural pode confirmar que boundaries, autoridades e arquitetura existentes são suficientes; necessidade de decisão estrutural material nova exige Completo.
- Gestor de Automações pode atuar dentro de automação, autoridade e lifecycle existentes; novidade material nesses pontos exige Completo.
- Analista participa somente diante de dúvida, risco ou materialidade.
- O Executor pode chamar diretamente o especialista pertinente e retorna ao supervisor quando o parecer exigir reclassificação, mudança funcional ou decisão fora de sua autoridade.
- Não existe gate final obrigatório adicional do Analista.

O fechamento segue implementação, validações, QA e evidências pelo Executor, entrega ao supervisor e decisão de correção, merge e conclusão.

### 7.2. Completo

Completo é usado quando o plano exige derivação técnica formal ou apresenta novidade ou risco material.

- novo domínio, boundary ou arquitetura relevante;
- mudança material de autenticação, autorização, tenant, segurança ou lifecycle;
- nova infraestrutura, serviço ou automação operacional material;
- mudança significativa de persistência ou compatibilidade;
- cutover, rollout ou coordenação técnica de alto risco;
- solução técnica não previsível a partir dos padrões e autoridades existentes.

O fluxo é V1 funcional, especialistas, V2 técnica aprovada e Executor.

## 8. V1, branch e PR

Depois do Debate, cada plano segue a relação `1 plano = 1 V1 = 1 task técnica responsável = 1 branch = 1 PR`.

- A task técnica ou o responsável técnico materializa a V1 aprovada no GitHub.
- A V1 é congelada por path, PR e commit SHA antes da derivação ou implementação.
- Blob SHA é evidência opcional quando necessário à ferramenta ou validação.
- A V1 não exige merge intermediário na `main`.
- No Light, a V1 permanece como contrato de execução.
- No Completo, o mesmo arquivo evolui de V1 para V2 em commit posterior no mesmo branch e PR.
- Dependências controlam a liberação dos planos sem exigir PR compartilhado.

Depois do congelamento, mudança funcional retorna ao Estrategista competente. Descoberta exclusivamente técnica não reabre a V1.

## 9. Workflow Completo e V2 técnica

### 9.1. Participação

- Gestor Estrutural participa obrigatoriamente.
- Gestor de Updates participa obrigatoriamente.
- Gestor de Automações participa quando houver automação aplicável.
- Um especialista pode concluir `N/A` quando não houver contribuição material aplicável.
- Analista atua como gate independente da V2.

### 9.2. Derivação e consolidação

- Gestor Estrutural estabelece a derivação técnica-base.
- Gestor de Updates confronta a solução com capacidades atuais.
- Gestor Estrutural retorna apenas quando update material exigir confronto estrutural.
- Gestor de Automações pode atuar em paralelo quando sua entrada for independente.
- A task técnica consolida a V2 a partir dos pareceres sem iniciar ainda o contrato do Executor.

A V2 define estado técnico desejado, decisões, boundaries, responsabilidades, contratos, integrações, persistência quando aplicável, riscos, invariantes, validações e evidências. Ela não é novo plano funcional nem roteiro prescritivo de movimentos ordinários.

### 9.3. Rastreabilidade e gate

- O Registro de Consolidação preserva origem, classe, tratamento, localização e evidência de cada achado material.
- O gate da V2 mantém duas passagens do Analista: avaliação independente V1 → V2 e auditoria da consolidação com pareceres e registro.
- Correções objetivas retornam apenas para revisão do delta.
- Questão material nova pode exigir nova avaliação especializada.
- Os gates do Analista por subseção permanecem no formato Completo.

A V2 aprovada é congelada por checkpoint no mesmo PR, sem merge intermediário, e torna-se o único contrato de implementação do Executor. V1, pareceres e rastreabilidade permanecem como fontes de origem e auditoria, não como instruções paralelas.

## 10. Execução, QA e conclusão

- O Executor executa o menor delta suficiente, valida, realiza o QA aplicável e entrega evidências, documentação, riscos, pendências e bloqueios.
- Falta de evidência deve indicar o que falta, por que falta e o que comprovaria; não implica teste humano automaticamente.
- O supervisor busca primeiro solução por ferramenta, agente, ambiente, QA ou validação posterior adequada.
- O humano é acionado somente quando houver dependência real de autoridade, acesso ou julgamento indispensável.
- O Executor declara entrega técnica completa, mas não declara o plano concluído.
- O supervisor determina correções, QA adicional, prontidão para merge e conclusão.
- O Prompt ABC trata documentos canônicos materialmente afetados; este Pipeline define apenas quando ele é necessário.

### 10.1. Merge

- Manual e Semiautomático exigem autorização humana explícita para o merge final.
- Autônomo permite merge pelo Estrategista Autônomo quando gates, checks, QA e evidências obrigatórios estiverem satisfeitos e não houver decisão material pendente.
- Qualquer exceção material bloqueia o merge e exige escalada.
- A autoridade operacional é materializada no `AGENTS.md`.

### 10.2. Conclusão

- Manual e Semiautomático: Estrategista original conclui o plano.
- Autônomo: Estrategista Autônomo conclui cada plano e libera dependências.
- O conjunto de vários planos só é concluído quando todos os planos e dependências aplicáveis estiverem encerrados.
- V1 ou V2 final permanece no GitHub; a V1 do Completo é recuperável pelo commit congelado.
- Pareceres e Registro de Consolidação permanecem como evidência operacional no workflow e no PR.

## 11. Arquitetura documental

- `docs/pipeline-plano-base.md`: arquitetura única do Pipeline.
- `docs/prompt-estrategista.md`: Debate, V1 e supervisão do Estrategista original.
- `docs/prompt-executor.md`: contrato universal do Executor.
- `lp-factory-conduzir-plano-completo`: workflow técnico do formato Completo.
- `lp-factory-executar-plano`: subfluxo específico da implementação Completa.
- `lp-factory-estrategista-autonomo`: supervisão pós-Debate no modo Autônomo.
- TOMLs: competência e julgamento especializado.
- Skills especializadas: chamada, entrada, saída, handoff e integração.
- `AGENTS.md` e Prompt ABC permanecem fontes transversais e não são reproduzidos nos contratos do Pipeline.
