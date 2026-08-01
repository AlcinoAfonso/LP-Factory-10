# Gestor de Automações — LP Factory 10

## 1. Objetivo

Este documento orienta decisões sobre automações, uso de IA e comportamento agentic no LP Factory 10.
O Gestor deve decidir se o caso deve ser automatizado, escolher a natureza e o ambiente adequados e recomendar a solução mínima suficiente.
A decisão deve considerar benefício, custo, complexidade, risco, segurança, observabilidade, manutenção, aprovação humana e adequação ao MVP.
Deve começar pela alternativa mais simples, preservar a stack e os contratos aprovados, evitar overengineering e não transformar recurso novo em autorização automática de implementação.

## 2. Mapa de categorias

### 2.1 Natureza da solução

Todo parecer deve classificar o caso em uma das seguintes naturezas:

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

A natureza da solução e o ambiente de execução são dimensões diferentes. Codex é ambiente, não natureza de automação.

#### 2.2.1 Runtime do LP Factory

* Execução dentro da aplicação ou dos serviços que suportam diretamente o produto.
* Deve seguir os contratos de `docs/base-tecnica.md`, `docs/platform-config.md`, código real e demais fontes canônicas do recorte.

#### 2.2.2 Infraestrutura operacional

* Execução em workflows, jobs, pipelines, webhooks, filas, runners ou serviços operacionais do projeto.
* Automação aprovada ou implementada deve ser registrada em `docs/automations.md`.

#### 2.2.3 Ambiente interno do Codex

* Execução usada para desenvolvimento, investigação, validação, edição de arquivos, testes ou produção de artefatos internos.
* Recursos e limites desse ambiente devem ser registrados em `docs/gestor-codex.md`.

#### 2.2.4 Serviço ou plataforma externa

* Execução realizada por fornecedor, API, plataforma ou integração externa.
* A recomendação deve considerar dependência, custo, segurança, disponibilidade, portabilidade e operação.

## 3. Regra obrigatória de avaliação

* Confirmar o problema real, o recorte, as fontes do projeto e a evidência disponível.
* Comparar as quatro naturezas da seção 2 e escolher uma única classificação.
* Identificar separadamente o ambiente de execução.
* Começar por não automatizar ou por solução determinística sem OpenAI.
* Usar IA somente onde interpretação, geração, classificação, extração, revisão ou estruturação trouxer benefício comprovável.
* Considerar comportamento agentic somente quando decisão adaptativa, coordenação de ferramentas ou revisão dinâmica forem realmente necessárias.
* Separar o que pertence à IA do que deve permanecer determinístico no LP Factory.
* Avaliar benefício, custo, complexidade, risco, segurança, observabilidade, manutenção e adequação ao MVP.
* Preferir a solução mais simples, segura, mensurável, reversível e compatível com a stack aprovada.
* Exigir aprovação humana para publicação, envio externo, custo relevante, mutação ou exclusão de dados, configuração sensível e conteúdo comercial público.
* Definir fallback e distinguir falha técnica de ausência de informação.
* A existência de recurso novo não autoriza implementação.

### 3.1 Consulta obrigatória à OpenAI

Quando o caso envolver ou puder envolver OpenAI, o Gestor deve consultar a documentação oficial atual antes de concluir o parecer.

* No Codex, usar preferencialmente a OpenAI Docs skill, quando disponível.
* Se a skill não estiver disponível ou não resolver a consulta, usar diretamente a documentação oficial da OpenAI.
* Iniciar pela página oficial `Model guidance`, para descobrir modelos, recursos, formas de orquestração e capacidades atuais potencialmente aplicáveis: `https://developers.openai.com/api/docs/guides/latest-model`.
* Consultar também o catálogo oficial `Models`, para confirmar disponibilidade, ferramentas suportadas, limites e preços: `https://developers.openai.com/api/docs/models`.
* Abrir a documentação oficial específica de cada recurso materialmente relevante identificado.
* Não limitar a avaliação aos recursos já conhecidos, ao modelo já configurado ou aos recursos citados no briefing.
* Confirmar status, superfície aplicável, limitações, requisitos, custo e impacto operacional.
* Para cada recurso materialmente relevante, decidir: adotar agora, rejeitar para o caso, não aplicável ou requer decisão adicional.
* Quando o caso estiver sendo encerrado e não existir fase posterior real e registrada, não deixar recurso relevante para avaliação futura.
* “Futuro” somente é válido quando houver fase posterior identificada e registrada para reabrir a decisão.
* Registrar no parecer as fontes oficiais efetivamente consultadas.

Este documento não mantém catálogo permanente de modelos, preços, parâmetros ou recursos OpenAI. Esses detalhes devem ser verificados no caso concreto.

## 4. Entrega e destino da decisão

Cada parecer deve ser curto, decisório e declarar:

* Automação: sim ou não.
* Classificação: uma das quatro naturezas da seção 2.
* Ambiente: um dos quatro ambientes da seção 2.
* OpenAI: sim, não ou condicional.
* Solução mínima recomendada e divisão entre processamento determinístico, IA e decisão humana.
* Benefício esperado, custo, complexidade, riscos, segurança, observabilidade, manutenção e fallback.
* Recursos OpenAI materialmente relevantes avaliados, com decisão de adotar agora, rejeitar para o caso, não aplicável ou requer decisão adicional.
* Recomendação final: aprovar, rejeitar ou indicar decisão adicional necessária.
* Fontes do projeto e fontes oficiais efetivamente consultadas.

O parecer não autoriza implementação por si só.

### 4.1 Destino documental

* Decisão, categorias, critérios, segurança e governança → `docs/gestor-automations.md`.
* Automação, agente, workflow, job ou componente operacional aprovado ou implementado → `docs/automations.md`.
* MCP, API, endpoint, worker, service ou infraestrutura reutilizável → `docs/services.md`.
* Variáveis, modelos configurados, secrets por nome, ambientes e configuração operacional → `docs/platform-config.md`.
* Contratos técnicos, implementação, validação e guardrails estáveis → `docs/base-tecnica.md`.
* OpenAI Docs skill, OpenAI Developers plugin e outros recursos do ambiente Codex → `docs/gestor-codex.md`.
* Funcionalidade visível ao cliente → gestor de produto ou `docs/roadmap.md`.
* Caso híbrido → registrar cada parte no documento correspondente, com referências cruzadas curtas e sem duplicação.