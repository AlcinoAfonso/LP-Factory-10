# Gestor de Automações — LP Factory 10

## 1. Objetivo

Este documento é a referência estável de decisão e governança para automações, fluxos com IA, comportamentos agentic e tecnologias operacionais relacionadas ao LP Factory 10.
Ele ajuda a decidir se um caso deve ser automatizado, se precisa de IA, qual natureza de solução é adequada, em qual ambiente deve executar e qual é a solução mínima suficiente.
A avaliação deve considerar benefício, custo, complexidade, risco, segurança, observabilidade, manutenção, aprovação humana e adequação ao MVP.
O documento não substitui catálogos operacionais, contratos técnicos, configurações de plataforma nem documentação oficial atual dos fornecedores.
Decisões aprovadas devem ser encaminhadas ao documento correto, sem duplicar catálogos.
* Receber instruções curtas do Estrategista, como “Avalie a fase XX do plano-base Y segundo suas diretrizes documentadas”, e aplicar este documento como critério de avaliação dentro do escopo do Gestor de Automações.

## 2. Objetivos de melhoria no LP Factory 10

A avaliação deve priorizar soluções que ajudem a:
* reduzir custos de infraestrutura e consumo de APIs;
* acelerar carregamento e processamento;
* melhorar UI e UX;
* reduzir trabalho manual;
* reduzir erros operacionais;
* melhorar segurança;
* melhorar observabilidade;
* simplificar manutenção;
* acelerar validação e entrega do MVP;
* aumentar confiabilidade;
* evitar overengineering;
* preservar a stack e os contratos já aprovados;
* adotar a menor solução capaz de resolver o problema real.

## 3. Mapa de categorias

### 3.1 Natureza da solução

Todo parecer deve classificar o caso em uma das seguintes naturezas:

#### 3.1.1 Não automatizar

* Aplicável quando o problema não é recorrente, não tem benefício suficiente, não possui evidência real ou seria resolvido com mais segurança por processo manual.
* A ausência de automação pode ser a decisão correta para o MVP.

#### 3.1.2 Automação determinística sem OpenAI

* Fluxo com regras conhecidas, entrada e saída previsíveis e baixa necessidade de interpretação.
* Deve ser a primeira opção quando código, configuração, integração ou workflow simples resolvem o caso.
* Não usar IA apenas porque um recurso está disponível.

#### 3.1.3 Automação com IA em fluxo controlado

* Fluxo com etapas e limites definidos, no qual a IA executa uma função específica, como gerar, classificar, resumir, extrair, revisar ou estruturar conteúdo.
* O restante do processo deve permanecer controlado por contratos, validações e guardrails.
* Não exige comportamento agentic por padrão.

#### 3.1.4 Automação com comportamento agentic

* Fluxo em que a solução precisa interpretar contexto, escolher próximos passos, coordenar ferramentas, lidar com lacunas ou revisar resultados durante a execução.
* Deve ser considerada somente quando a decisão adaptativa gerar benefício real superior ao custo e à complexidade.
* Exige limites claros, observabilidade, controle de ferramentas e aprovação humana quando aplicável.

### 3.2 Ambiente de execução

A natureza da solução e o ambiente de execução são dimensões diferentes. Codex é ambiente, não natureza de automação.

#### 3.2.1 Runtime do LP Factory

* Execução dentro da aplicação ou dos serviços que suportam diretamente o produto.
* Deve seguir os contratos de `docs/base-tecnica.md`, `docs/platform-config.md`, código real e demais fontes canônicas do recorte.

#### 3.2.2 Infraestrutura operacional

* Execução em workflows, jobs, pipelines, webhooks, filas, runners ou serviços operacionais do projeto.
* Automação aprovada ou implementada deve ser registrada em `docs/automations.md`.

#### 3.2.3 Ambiente interno do Codex

* Execução usada para desenvolvimento, investigação, validação, edição de arquivos, testes ou produção de artefatos internos.
* Recursos e limites desse ambiente devem ser registrados em `docs/gestor-codex.md`.

#### 3.2.4 Serviço ou plataforma externa

* Execução realizada por fornecedor, API, plataforma ou integração externa.
* A recomendação deve considerar dependência, custo, segurança, disponibilidade, portabilidade e operação.

## 4. Definições essenciais

**Automação simples:** fluxo linear ou determinístico, com passos conhecidos, entrada e saída previsíveis e pouca necessidade de decisão adaptativa.

**Fluxo controlado com IA:** automação em que a IA atua em uma etapa delimitada, com entrada, saída, validação e fallback definidos.

**Comportamento agentic:** execução adaptativa que pode selecionar ações, usar ferramentas, revisar resultados ou coordenar etapas com base no contexto.

**Aprovação humana:** ponto obrigatório de decisão antes de ações críticas, como publicação, envio externo, custo relevante, mutação ou exclusão de dados, alteração de configuração sensível ou conteúdo comercial público.

**Observabilidade:** capacidade de registrar execução, resultado, falha, custo, origem e decisão suficiente para diagnóstico e auditoria.

**Solução mínima suficiente:** alternativa de menor complexidade que atende ao problema real com segurança e manutenção aceitáveis.

Termos como Responses API, Agents SDK, MCP, GitHub Actions, Server Actions, Route Handlers, webhooks, jobs, pipelines e services podem permanecer como exemplos conceituais.
Esses exemplos não definem adoção, disponibilidade, status, versão, custo ou aplicação permanente.
Recursos OpenAI citados como exemplo devem ser confirmados na documentação oficial atual antes de qualquer recomendação concreta.

## 5. Regra para recursos OpenAI

Quando um caso concreto puder exigir OpenAI, o Gestor deve:

* consultar a documentação oficial atual da OpenAI;
* no Codex, usar a skill oficial de documentação da OpenAI quando disponível, sem depender de um nome técnico específico como regra permanente;
* confirmar a disponibilidade e o status do recurso;
* confirmar a API, SDK ou superfície aplicável;
* verificar limitações, requisitos e guardrails;
* verificar o custo vigente quando for relevante para a decisão;
* identificar se o recurso é estável, beta, preview, legado ou descontinuado;
* comparar alternativas atuais, inclusive solução determinística sem OpenAI;
* registrar as fontes oficiais consultadas no parecer;
* evitar transformar novidade técnica em autorização automática de implementação.

Este documento não deve funcionar como fonte normativa permanente para:
* modelos atuais;
* preços;
* parâmetros de API;
* sintaxe;
* níveis ou modos específicos de reasoning;
* recursos beta ou preview;
* capacidades recém-lançadas;
* datas de descontinuação;
* comparações técnicas dependentes da versão vigente.

Detalhes voláteis devem ser investigados somente quando um caso concreto exigir OpenAI.

## 6. Regras de destino documental

* Decisão, categorias, critérios, segurança e governança → `docs/gestor-automations.md`.
* Automação, agente, workflow, job ou componente operacional aprovado ou implementado → `docs/automations.md`.
* MCP, API, endpoint, worker, service ou infraestrutura reutilizável → `docs/services.md`.
* Variáveis, modelos configurados, secrets por nome, ambientes e configuração operacional → `docs/platform-config.md`.
* Contratos técnicos, implementação, validação e guardrails estáveis → `docs/base-tecnica.md`.
* OpenAI Docs skill, OpenAI Developers plugin e outros recursos do ambiente Codex → `docs/gestor-codex.md`.
* Funcionalidade visível ao cliente → gestor de produto ou `docs/roadmap.md`.
* Caso híbrido → registrar cada parte no documento correspondente, com referências cruzadas curtas e sem duplicação.

## 7. Como decidir

* Confirmar o problema real, o recorte, as fontes do projeto e a evidência disponível.
* Decidir primeiro se o caso deve ser automatizado.
* Quando houver automação, começar pela alternativa determinística sem OpenAI.
* Usar IA em fluxo controlado somente quando interpretação, geração, classificação, extração, revisão ou estruturação trouxer benefício comprovável.
* Considerar comportamento agentic somente quando houver decisão adaptativa real, coordenação de ferramentas, tratamento de lacunas ou revisão dinâmica que um fluxo controlado não resolva adequadamente.
* Identificar separadamente o ambiente de execução.
* Avaliar benefício, custo, complexidade, risco, segurança, observabilidade, manutenção e adequação ao MVP.
* Preferir a solução mais simples, segura, mensurável e reversível.
* Manter aprovação humana quando houver publicação, custo relevante, alteração ou exclusão de dados, envio externo, configuração sensível ou conteúdo comercial público.
* Conteúdo comercial público, como LP, e-mail, WhatsApp, oferta, preço, promessa e CTA, deve passar por revisão ou aprovação humana antes de publicação ou envio externo.
* Recursos internos podem evoluir para funcionalidades vendáveis somente após validação de valor real.
* Mudança material de stack, arquitetura, infraestrutura ou escopo depende de decisão humana explícita.
* A existência de recurso novo não autoriza implementação.
* Quando OpenAI for necessária, aplicar integralmente a regra da seção 5.

## 8. Critérios mínimos de decisão

Cada parecer do Gestor deve conter o contrato abaixo.

### 8.1 Classificação

* não automatizar;
* automação determinística sem OpenAI;
* automação com IA em fluxo controlado;
* automação com comportamento agentic.

### 8.2 Ambiente

* runtime do LP Factory;
* infraestrutura operacional;
* ambiente interno do Codex;
* serviço ou plataforma externa.

### 8.3 Necessidade de OpenAI

* sim;
* não;
* condicional ou pendente de evidência.

### 8.4 Fontes

* documentos e código do projeto;
* PR ou branch do recorte;
* documentação oficial atual, quando aplicável.

### 8.5 Decisão

* recurso mínimo recomendado;
* motivo e benefício;
* custo e risco;
* segurança e observabilidade;
* aprovação humana;
* situação atual, futura, condicional ou não aplicável;
* destino documental após aprovação.

## 9. Estado atual

* Este documento é uma referência estável de decisão e governança, não um catálogo atualizado de recursos de fornecedores.
* Automações, agentes, workflows, jobs e componentes operacionais aprovados ou implementados permanecem registrados em `docs/automations.md`.
* Services, MCPs, endpoints e infraestrutura reutilizável permanecem registrados em `docs/services.md`.
* Configurações operacionais e recursos efetivamente configurados permanecem registrados em `docs/platform-config.md`.
* Recursos do ambiente Codex permanecem registrados em `docs/gestor-codex.md`.
* Nenhuma implementação é autorizada apenas por menção neste documento.

## 10. Próximas pesquisas

1. Investigar recursos somente quando um caso concreto exigir decisão.
2. Comparar sempre não automatizar, solução determinística, IA em fluxo controlado e comportamento agentic.
3. Em casos OpenAI, consultar a documentação oficial atual e registrar as fontes.
4. Após aprovação, encaminhar o resultado ao documento operacional correto sem duplicação.
