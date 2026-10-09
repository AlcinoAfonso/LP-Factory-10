# Gestor de Automações — LP Factory 10

## 1. Objetivo

Este documento orienta decisões sobre automações, uso de IA e comportamento agentic no LP Factory 10.
O Gestor atua quando o Executor ou pedido humano autorizado apresenta questão concreta de automação/execução ainda não resolvida pelas fontes. Agentes de produto chegam com identidade funcional/comercial definida pela V1; a especialidade decide apenas o ponto técnico/operacional necessário, sem reabrir produto.
A avaliação deve considerar benefício, custo, complexidade, risco, segurança, observabilidade, manutenção, participação humana e adequação ao MVP.
Deve começar pela alternativa mais simples, preservar a stack e os contratos aprovados, evitar overengineering e não transformar recurso novo em autorização automática de implementação.

## 2. Mapa de categorias

### 2.1 Natureza da solução

Quando a questão exigir escolher ou rever a natureza técnica, classifique entre as opções abaixo. Para agentes de produto, preserve a identidade funcional/comercial definida no README.md sem transformar cada prompt, chamada ou workload em agente. Essa identidade não cria quinta natureza nem exige, por si só, autonomia adicional, SDK ou coordenação multiagente.

#### 2.1.1 Não automatizar

* Aplicável quando o problema não é recorrente, não tem benefício suficiente, não possui evidência real ou seria resolvido com mais segurança por processo manual.
* A ausência de automação pode ser a decisão correta para o MVP.

#### 2.1.2 Automação determinística sem OpenAI

* Fluxo com regras conhecidas, entrada e saída previsíveis e baixa necessidade de interpretação.
* Deve ser a primeira opção quando código, configuração, integração ou workflow simples resolvem o caso.
* Não usar IA apenas porque um recurso está disponível.

#### 2.1.3 Automação com IA em fluxo controlado

* Fluxo com etapas e limites definidos, no qual a IA executa uma função específica, como gerar, classificar, resumir, extrair, revisar ou estruturar conteúdo.
* O restante do processo deve permanecer controlado por contratos, validações e guardrails.
* Não exige comportamento agentic por padrão.

#### 2.1.4 Automação com comportamento agentic

* Fluxo em que a solução precisa interpretar contexto, escolher próximos passos, coordenar ferramentas, lidar com lacunas ou revisar resultados durante a execução.
* Deve ser considerada somente quando a decisão adaptativa gerar benefício real superior ao custo e à complexidade.
* Exige limites claros, observabilidade, controle de ferramentas e aprovação humana quando aplicável.

### 2.2 Ambiente de execução

A natureza da solução e o ambiente de execução são dimensões diferentes. Identifique o ambiente principal somente quando material à questão. Codex é ambiente, não natureza de automação.

#### 2.2.1 Runtime do LP Factory

* Execução dentro da aplicação ou dos serviços que suportam diretamente o produto.
* Pode ocorrer no Core ou em service dedicado do projeto; services reutilizáveis com deploy independente devem ser registrados em `docs/services.md`.
* Deve seguir os contratos de `docs/base-tecnica.md`, `docs/platform-config.md`, código real e demais fontes canônicas do recorte.

#### 2.2.2 Infraestrutura operacional

* Execução em workflows, jobs, pipelines, webhooks, filas, runners ou serviços operacionais do projeto.
* Automação aprovada ou implementada deve ser registrada em `docs/automations.md`.

#### 2.2.3 Ambiente interno do Codex

* Execução usada para desenvolvimento, investigação, validação, edição de arquivos, testes ou produção de artefatos internos.
* Recursos e limites desse ambiente devem ser registrados em `docs/gestor-codex.md`.

#### 2.2.4 Plataforma ou serviço externo

* Execução realizada por fornecedor, API, plataforma ou integração externa ao projeto.
* A recomendação deve considerar dependência, custo, segurança, disponibilidade, portabilidade e operação.

## 3. Regra obrigatória de avaliação

* Confirmar o problema real, o recorte, as fontes do projeto e a evidência disponível; para agente de produto, conferir no recorte funcional tarefa, entrega, contexto autorizado, ações e limites de leitura/escrita e critérios de conclusão e qualidade.
* Quando a natureza técnica estiver em decisão, comparar as quatro naturezas da seção 2 e escolher uma classificação.
* Identificar ambiente e plataformas dependentes quando materiais à questão.
* Começar por não automatizar ou por solução determinística sem OpenAI.
* Usar IA somente onde interpretação, geração, classificação, extração, revisão ou estruturação trouxer benefício comprovável.
* Considerar comportamento agentic somente quando decisão adaptativa, coordenação de ferramentas ou revisão dinâmica forem realmente necessárias.
* Separar o que pertence à IA do que deve permanecer determinístico no LP Factory.
* Avaliar somente nas dimensões materiais à questão: benefício, qualidade, latência, custo, complexidade, risco, segurança, observabilidade, manutenção e adequação ao MVP.
* Preferir a solução mais simples, segura, mensurável, reversível e compatível com a stack aprovada.
* Definir a participação humana aplicável: autorização de implementação ou ativação, gatilho humano, revisão do resultado ou aprovação por execução. Não exigir intervenção durante a execução quando o contrato aprovado permitir operação autônoma segura.
* Definir fallback e distinguir falha técnica de ausência de informação; nos agentes de produto, explicitar retomada e preservação do contexto pertinente quando aplicáveis.
* A existência de recurso novo não autoriza implementação.
* Preserve limites econômicos explícitos do contrato recebido. Sem limite mais restritivo, consumo variável necessário de provedores e recursos já autorizados, inclusive testes e validações proporcionais, é custo normal de runtime. Custo desconhecido exige investigação factual. Novo compromisso econômico não autorizado — contratação, upgrade, novo recurso pago ou consumo materialmente fora do uso normal — exige decisão material antes de `adotar agora` ou produzir patch.

### 3.1 Consulta focal à OpenAI

Quando houver hipótese concreta e material de uso da OpenAI, o Gestor deve consumir primeiro as capacidades identificadas em `docs/openai-model-snapshot.md` pelo workflow semanal e consultar a documentação oficial atual somente para validar o necessário à decisão do caso.

* No Codex, usar preferencialmente a OpenAI Docs skill, quando disponível; se ela não resolver a consulta focal, usar diretamente a documentação oficial da OpenAI.
* Selecionar no snapshot somente os itens relacionados ao problema e confirmar nas fontes oficiais específicas sua disponibilidade, status, superfície aplicável, limitações, requisitos e guardrails.
* Não repetir a descoberta ampla do workflow de updates, não pesquisar novidades sem necessidade concreta e não transformar disponibilidade em autorização de adoção.
* Quando faltar no snapshot uma capacidade indispensável ou houver sinal material de defasagem, registrar a lacuna e a investigação necessária; não ampliar silenciosamente a avaliação para uma varredura geral.
* Confirmar impacto operacional quando material ao caso; custo e gate seguem a regra geral desta seção. Conteúdo financeiro não reside no snapshot.
* Para cada recurso materialmente relevante, decidir: adotar agora, rejeitar para o caso, não aplicável ou requer decisão adicional.
* Quando o caso estiver sendo encerrado e não existir fase posterior real e registrada, não deixar recurso relevante para avaliação futura.
* “Futuro” somente é válido quando houver fase posterior identificada e registrada para reabrir a decisão.
* Registrar no parecer as fontes oficiais efetivamente consultadas.
* Quando a recomendação envolver workload OpenAI de produto, identificar explicitamente o workload afetado e respeitar a governança transversal estabelecida em `E21.1 — Fundação, normalização e leitura dos workloads OpenAI` de `docs/roadmap.md`; consultar o contrato técnico vigente em `docs/base-tecnica.md` e a configuração operacional correspondente em `docs/platform-config.md`, sem duplicar neste documento catálogo, modelo, reasoning effort, configuração efetiva ou estado de implementação.
* Quando a decisão envolver seleção, comparação ou revisão de modelo ou `reasoning.effort`, usar o snapshot como fotografia técnica itemizada de capacidades, aplicabilidade e maturidade; a atualização ampla do snapshot pertence ao workflow semanal. O snapshot não substitui `docs/platform-config.md` como fonte da configuração efetiva nem autoriza mudança por si só.
* Quando a solução com OpenAI depender de prompt consumido no runtime, consultar `docs/template-prompts.md` e o complemento específico do modelo quando existir e for aplicável, atualmente `docs/template-prompts-gpt-5-6.md` para GPT-5.6, e verificar aderência ao contrato vigente e validação representativa aplicável antes de concluir o parecer.
* Ao avaliar comportamento de um workload, considerar o prompt efetivamente aplicado junto com `workload + modelo + reasoning effort`, sem alterar a unidade de configuração criada pela E21.1. Prompt não substitui autorização, validação, regras de negócio ou guardrails que devam permanecer determinísticos no LP Factory.

Este documento não mantém catálogo permanente de modelos, preços, parâmetros ou recursos OpenAI. Esses detalhes devem ser verificados no caso concreto.

## 4. Entrega e destino da decisão

Cada parecer deve ser curto, decisório e declarar somente o necessário à questão recebida:

* Plano/recorte, referência, branch e head SHA quando aplicáveis, questão focal e dimensões efetivamente avaliadas.
* Classificação, ambiente e OpenAI somente quando materiais à decisão.
* Solução mínima e, quando aplicável, divisão entre determinístico, IA e participação humana, com benefício, custo/risco, segurança, observabilidade, manutenção e fallback pertinentes.
* Recursos OpenAI e prompt de runtime somente quando aplicáveis, preservando as verificações da seção 3.1.
* Veredito: `nenhuma automação aplicável`, `automação aplicável com patches autossuficientes`, `requer investigação factual` ou `requer decisão material`.
* Patches, investigação factual ou decisão material pendente conforme o veredito, além de destino documental, fontes consultadas e próximo passo mínimo.

O parecer não autoriza implementação por si só.

### 4.1 Destino documental

* Decisão, categorias, critérios, segurança e governança → `docs/gestor-automations.md`.
* Estrutura e validação geral de prompts → `docs/template-prompts.md`; regras específicas de GPT-5.6 → `docs/template-prompts-gpt-5-6.md`.
* Automação, agente, workflow, job ou componente operacional aprovado ou implementado → `docs/automations.md`.
* MCP, API, endpoint, worker, service ou infraestrutura reutilizável → `docs/services.md`.
* Variáveis, modelos configurados, secrets por nome, ambientes e configuração operacional → `docs/platform-config.md`.
* Contratos técnicos, implementação, validação e guardrails estáveis → `docs/base-tecnica.md`.
* OpenAI Docs skill, OpenAI Developers plugin e outros recursos do ambiente Codex → `docs/gestor-codex.md`.
* Funcionalidade visível ao cliente, incluindo o contrato funcional de cada agente de produto → gestor de produto ou `docs/roadmap.md`.
* Caso híbrido → registrar cada parte no documento correspondente, com referências cruzadas curtas e sem duplicação.
