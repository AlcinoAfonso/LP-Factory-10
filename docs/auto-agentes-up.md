# LP Factory 10 — Agentes e Orquestração (Updates)

Este doc deve conter apenas updates do universo de agentes, tools, padrões de uso e orquestração que possam potencializar automações do projeto.

Isso inclui:
- recursos e padrões da OpenAI ligados a agentes
- handoffs, tool use, guardrails e arquitetura de agentes
- workflows, pipelines e orquestrações quando forem relevantes para automações assistidas por agentes ou para fluxos híbridos humano + agente + automação

Não inclui:
- CI, build, deploy e workflows técnicos gerais sem relação com agentes ou automações assistidas
- detalhes de infra de Supabase ou Vercel
- documentação operacional de automações em si, que deve ficar em `docs/automacoes.md`

Qualquer coisa de Supabase ou Vercel (infra, deploy, logs, MCP via Edge Functions etc.) fica nos respectivos docs e só referencia aqui se for governança de agentes, padrão de uso por agentes ou potencialização direta de automações assistidas.

---

## 1 — AgentKit + Ecossistema *(🍿 Experimental)*
2025-11-12

### Descrição
AgentKit passa a ser tratado aqui como guarda-chuva de capacidades para experiências com agentes, cobrindo Agent Builder, Connector Registry, ChatKit e frentes de avaliação/otimização quando aplicáveis. O foco é usar o conjunto de forma pragmática, respeitando diferentes níveis de maturidade entre os componentes.

### Valor para o Projeto
- Consolida critérios para decidir onde usar AgentKit versus integrações complementares no ecossistema.
- Ajuda a padronizar versionamento, observabilidade e evolução de agentes úteis ao LP Factory 10.

### Valor para o Usuário
- Entregas assistidas por agentes mais consistentes, com melhor previsibilidade de qualidade e rastreabilidade.

### Ações Recomendadas
1. Definir matriz de decisão por caso de uso (builder, conectores, chat embarcado e avaliação).
2. Prototipar fluxos prioritários e medir latência, custo e qualidade antes de escalar.

---

## 2 — Agents Platform: Responses API + Tools + Agents SDK *(🍾 Estável)*
2025-11-13

### Descrição
A base atual de agentes é tratada como plataforma composta por Responses API, built-in tools e Agents SDK, com suporte a tool use, orquestração e observabilidade.

### Valor para o Projeto
- Atualiza o framing técnico para o padrão vigente de construção de agentes no ecossistema.
- Dá base mais clara para integrações de agentes com dados, automações assistidas e supervisão operacional.

### Valor para o Usuário
- Respostas mais úteis em fluxos reais, com melhor continuidade entre contexto, ação e resultado.

### Ações Recomendadas
1. Padronizar novos agentes no stack Responses API + tools + SDK.
2. Definir trilha mínima de observabilidade por agente (execução, tool calls e falhas).

---

## 3 — Passagens Eficazes entre Agentes (Handoff Design) *(🟣 Estável)*
2025-11-12

### Descrição
Modelo de handoff para transferência de contexto entre agentes, garantindo consistência e rastreabilidade em fluxos automatizados.

### Valor para o Projeto
- Adota `goal`, `state`, `evidence` e `next` como convenção recomendada do projeto para handoffs.
- Facilita depuração e coordenação entre múltiplos agentes em pipelines assistidos.

### Valor para o Usuário
- Interações mais coerentes e contínuas.
- Redução de erros em automações interligadas.

### Ações Recomendadas
1. Adotar formato `handoff.json` no pipeline de agentes.
2. Integrar logs de handoff ao Unified Logs.

---

## 4 — Agentes com Ferramentas em Pipelines Reais *(🍿 Experimental)*
2025-11-12

### Descrição
Integração de agentes com tools e dados reais em pipelines de automações assistidas, incluindo uso de MCP quando fizer sentido para conectar fontes e serviços do fluxo.

### Valor para o Projeto
- Conecta agentes do LP Factory 10 a contexto operacional real sem limitar o desenho a um tipo único de sistema.
- Fortalece automações ponta a ponta com execução auditável e reutilização de ferramentas.

### Valor para o Usuário
- Respostas mais acionáveis, com ganhos de tempo em tarefas recorrentes.

### Ações Recomendadas
1. Priorizar um pipeline piloto com tool calls e fonte de dados real.
2. Logar execuções, saídas e falhas para diagnóstico e melhoria contínua.

---

## 5 — Guia prático: Assistentes vs. Agentes *(🍾 Estável)*
2025-11-12

### Descrição
Define assistente como interação reativa e agente como execução orientada a objetivo com ferramentas, contexto e controle operacional. Mantém vocabulário prático para decisões de produto e operação.

### Valor para o Projeto
- Preserva linguagem comum para especificação de fluxos e responsabilidades.
- Evita confusão entre automação assistida, automação autônoma e suporte conversacional.

### Valor para o Usuário
- Experiência mais previsível, com nível de autonomia adequado ao risco da tarefa.

### Ações Recomendadas
1. Manter glossário “assistente vs agente” como referência transversal.
2. Revisar fluxos existentes para confirmar o enquadramento correto em cada caso.

---

## 6 — Padrão Orquestrador‑Trabalhador *(🟣 Estável)*
2025-11-12

### Descrição
Padrão de arquitetura/orquestração em que um orquestrador decompõe metas e delega para trabalhadores especializados (agentes ou tools), com controles de coordenação e retorno estruturado.

### Valor para o Projeto
- Aumenta throughput em tarefas paralelizáveis e melhora coordenação entre etapas.
- Facilita diagnóstico de falhas recorrentes (loop, timeout, deriva de escopo e inconsistência de saída).

### Valor para o Usuário
- Entregas mais rápidas e consistentes em fluxos compostos.

### Ações Recomendadas
1. Documentar contrato de entrada/saída entre orquestrador e trabalhadores.
2. Adicionar testes de timeout, retry e prevenção de loop nos fluxos críticos.

---

## 7 — Segurança de Agentes: riscos e guardrails *(🍾 Estável)*
2025-11-12

### Descrição
Consolida riscos em agentes com tools (prompt injection, escopo excessivo, execução indevida) e práticas de mitigação: menor privilégio, sanitização, telemetria, replays e testes adversariais.

### Valor para o Projeto
- Reduz incidentes e aumenta capacidade de auditoria em automações assistidas.

### Valor para o Usuário
- Mais segurança, menos ações indevidas e maior confiança no uso diário.

### Ações Recomendadas
1. Executar testes adversariais por release em fluxos com tool access.
2. Versionar prompts/config e habilitar replay para investigação de falhas.

---

## 8 — Checklist Operacional Interno de Agentes (LP Factory) *(🍾 Estável)*
2025-11-12

### Descrição
Checklist interno do LP Factory para operação de agentes em cinco frentes: risco/regulação, catálogo de ferramentas, telemetria/avaliação, handoff humano e rollback/modo degradado.

### Valor para o Projeto
- Mantém governança operacional com critérios claros e auditáveis.

### Valor para o Usuário
- Handoffs transparentes e recuperação segura quando houver degradação.

### Ações Recomendadas
1. Anexar checklist ao PR template de novos fluxos com agentes.
2. Aplicar feature flags por agente e por ferramenta crítica.

---

## 9 — Roadmap Interno de Adoção de Agentes (Fase 1→3) *(🍾 Estável)*
2025-11-12

### Descrição
Roadmap interno de adoção progressiva: Fase 1 (assistência reativa), Fase 2 (agente com metas curtas e gate humano) e Fase 3 (operação estável com avaliação e observabilidade contínuas).

### Valor para o Projeto
- Define evolução controlada de risco baixo para uso mais maduro.

### Valor para o Usuário
- Ganhos incrementais sem perda de previsibilidade.

### Ações Recomendadas
1. Manter board de evolução por fase com critérios explícitos de entrada/saída.
2. Definir SLAs e métricas mínimas por fase antes de avançar.

---

## 10 — Princípio Interno de Governança para Agentes com Dados *(🍾 Estável)*
2025-11-12

### Descrição
Princípio interno para agentes com acesso a dados: escopo mínimo, rastreabilidade ponta a ponta, controles de acesso proporcionais ao risco e trilha auditável por execução.

### Valor para o Projeto
- Reforça governança sem transformar este documento em guia de infraestrutura.

### Valor para o Usuário
- Maior confiança no uso de agentes em fluxos com dados sensíveis.

### Ações Recomendadas
1. Exigir definição explícita de escopo e permissões antes da ativação de cada agente.
2. Garantir logs auditáveis por execução, com correlação para investigação posterior.

---

## 11 — Agent Builder *(🟣 Beta)*  
2025-10-06

### Descrição
Canvas visual da OpenAI para desenhar, versionar e iterar workflows com agentes, lógica de controle, tools e guardrails.

### Valor para o Projeto
- Facilita prototipação e validação rápida de fluxos multiagente antes de consolidar arquitetura definitiva.
- Pode reduzir tempo de desenho e ajuste de automações assistidas mais complexas.

### Valor para o Usuário
- Acelera evolução de experiências assistidas mais consistentes e rastreáveis.

### Ações Recomendadas
1. Avaliar em quais automações vale prototipar primeiro no Builder antes de formalizar runtime definitivo.
2. Registrar critérios de uso do Builder versus implementação programática.

---

## 12 — ChatKit *(🍾 Estável)*  
2025-10-06

### Descrição
Toolkit da OpenAI para embutir experiências de chat com agentes em apps e sites, com customização visual e experiência mais nativa.

### Valor para o Projeto
- Pode acelerar interfaces conversacionais úteis no Dashboard sem exigir construção manual de toda a camada de chat.
- Ajuda a testar experiência assistida de forma mais tangível no produto.

### Valor para o Usuário
- Experiência de interação com agentes mais fluida, contextual e integrada ao produto.

### Ações Recomendadas
1. Mapear se há caso real de chat embarcado prioritário no LP Factory 10.
2. Comparar esforço de adoção do ChatKit com a abordagem atual antes de investir.

---

## 13 — Connector Registry *(🍿 Experimental / rollout controlado)*  
2025-10-06

### Descrição
Camada central de governança para conectores e fontes de dados em produtos OpenAI, incluindo conectores pré-construídos e MCPs de terceiros.

### Valor para o Projeto
- Pode simplificar governança futura de fontes e tools em agentes com acesso a dados.
- Ajuda a pensar conectividade de forma mais administrável e menos dispersa.

### Valor para o Usuário
- Potencializa agentes com acesso mais consistente a dados e ferramentas relevantes, com menor fricção operacional.

### Ações Recomendadas
1. Monitorar maturidade e requisitos do Connector Registry antes de planejar adoção.
2. Avaliar impacto futuro sobre governança de conectores e MCPs no projeto.

---

## 14 — Evals para Agentes *(🍾 Estável)*  
2025-10-06

### Descrição
Capacidades mais novas de avaliação para agentes, incluindo datasets, trace grading, automated prompt optimization e suporte a modelos de terceiros.

### Valor para o Projeto
- Reforça a necessidade de avaliar automações assistidas com critérios objetivos, e não só por impressão manual.
- Dá base para medir qualidade, falhas e regressão em fluxos com agentes.

### Valor para o Usuário
- Aumenta previsibilidade e confiabilidade das respostas e ações assistidas.

### Ações Recomendadas
1. Definir conjunto mínimo de critérios de avaliação para agentes e automações assistidas do projeto.
2. Priorizar traces e grading nos fluxos mais críticos antes de escalar uso de agentes.

---

## 15 — Responses API: remote MCP + novas tools *(🍾 Estável)*  
2025-05-21

### Descrição
Evolução recente da Responses API com suporte a remote MCP servers e melhorias em tools como image generation, Code Interpreter e file search.

### Valor para o Projeto
- Amplia o leque de composição de agentes com ferramentas mais úteis e integração mais direta com servidores MCP remotos.
- Pode reduzir atrito na construção de fluxos assistidos que precisem combinar raciocínio, tools e dados externos.

### Valor para o Usuário
- Respostas mais úteis e automações assistidas mais completas, com melhor capacidade de agir sobre diferentes tipos de tarefa.

### Ações Recomendadas
1. Avaliar quais automações do projeto podem se beneficiar de remote MCP de forma realista.
2. Priorizar uso de tools novas apenas quando elas aumentarem valor operacional de forma clara.

---

## 16 — Reusable Workflows (`workflow_call`) *(🍾 Estável)*
2026-04-08

### Descrição
Padrão do GitHub Actions para reutilizar workflows inteiros entre fluxos diferentes, reduzindo duplicação e permitindo manter bibliotecas reutilizáveis de automações.

### Valor para o Projeto
- Ajuda a padronizar automações assistidas mais complexas sem copiar blocos grandes de YAML.
- Facilita manutenção centralizada e evolução de workflows recorrentes.

### Valor para o Usuário
- Fluxos mais consistentes e previsíveis, com menos risco de divergência entre automações parecidas.

### Ações Recomendadas
1. Identificar automações candidatas a extração para reusable workflows.
2. Definir convenção de inputs, outputs e versionamento para workflows reutilizáveis do projeto.

---

## 17 — Workflow Chaining e Disparos de Orquestração *(🍾 Estável)*
2026-04-08

### Descrição
Uso coordenado de gatilhos como `workflow_dispatch`, `workflow_run` e eventos externos para encadear execuções e montar fluxos assistidos em múltiplas etapas.

### Valor para o Projeto
- Permite separar etapas de automação em fluxos mais modulares.
- Ajuda a desenhar pipelines assistidos com melhor isolamento entre preparação, execução e validação.

### Valor para o Usuário
- Entregas mais organizadas e com menor risco de colisão entre etapas do fluxo.

### Ações Recomendadas
1. Mapear onde chaining real pode substituir automações excessivamente monolíticas.
2. Definir critérios para quando usar encadeamento versus workflow único.

---

## 18 — Concurrency + Gates Humanos *(🍾 Estável)*
2026-04-08

### Descrição
Combinação de controle de concorrência e checkpoints humanos para evitar colisões entre runs e aumentar segurança em fluxos mais sensíveis.

### Valor para o Projeto
- Reduz risco de execuções paralelas conflitantes.
- Ajuda a incorporar aprovação humana quando a automação tocar etapas mais críticas.

### Valor para o Usuário
- Mais previsibilidade operacional e menor chance de ações concorrentes indesejadas.

### Ações Recomendadas
1. Revisar automações críticas para aplicar políticas explícitas de concurrency.
2. Definir onde gates humanos são necessários em fluxos assistidos de maior risco.

---

## 19 — Artifacts, Outputs e Job Summaries como Handoff/Evidência *(🍾 Estável)*
2026-04-08

### Descrição
Uso de artifacts, outputs e summaries como mecanismos de passagem de estado, evidência e contexto entre etapas de automações assistidas.

### Valor para o Projeto
- Melhora handoff entre jobs, workflows e etapas humanas.
- Fortalece rastreabilidade e auditoria de execuções compostas.

### Valor para o Usuário
- Evidências mais claras do que aconteceu no fluxo e menor opacidade em falhas ou validações.

### Ações Recomendadas
1. Padronizar quando usar artifact, output e summary em cada tipo de fluxo.
2. Tratar summaries como camada mínima de evidência humana nas automações assistidas.

---

## 20 — GitHub Models em Flows Assistidos *(🍿 Experimental)*
2026-04-08

### Descrição
Capacidades do GitHub Models para comparar prompts, avaliar outputs, versionar experimentos no repositório e integrar modelos ao ecossistema do GitHub.

### Valor para o Projeto
- Pode aproximar prompts, avaliação e workflow em um mesmo ambiente operacional.
- Abre espaço para fluxos assistidos com avaliação mais disciplinada dentro do GitHub.

### Valor para o Usuário
- Respostas assistidas mais consistentes e com maior capacidade de comparação e melhoria contínua.

### Ações Recomendadas
1. Avaliar se GitHub Models traz vantagem real em comparação ao stack atual do projeto.
2. Priorizar uso apenas quando houver ganho concreto em avaliação, versionamento ou integração com workflows.

---

## 21 — Structured Outputs para automações assistidas *(🍾 Estável)*
2026-04-24

### Descrição
Recurso da OpenAI para forçar respostas aderentes a um schema estruturado, reduzindo saídas soltas em automações que precisam retornar JSON previsível.

### Valor para o Projeto
- Ajuda a transformar respostas de IA em dados utilizáveis pelo sistema.
- Reduz risco de drift estrutural em classificações, recomendações e validações assistidas.
- É útil para casos em que a IA deve devolver campos como slug sugerido, confiança, justificativa e necessidade de revisão.

### Valor para o Usuário
- Experiências assistidas mais confiáveis, com menos erro de interpretação e maior previsibilidade no resultado.

### Ações Recomendadas
1. Usar Structured Outputs em automações assistidas que precisem gerar resposta estruturada para o sistema.
2. Priorizar esse recurso em classificações, recomendações e validações que afetem decisões do produto.
3. Evitar geração livre quando o resultado precisar ser persistido ou usado por lógica de negócio.
