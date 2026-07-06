06/07/2026 — Plano-base E18.4 — Base de composição `landing_page`
Fontes: chat, `README.md`, `AGENTS.md`, `docs/prompt-estrategista.md`, `docs/template-roadmap.md`, `docs/template-briefing-codex.md`, `docs/prompt-executor.md`, `docs/roadmap.md`, `docs/base-tecnica.md`, `docs/schema.md`, `docs/lousa-debate-landing-pages.md`

Status: rascunho em debate.
Path: `docs/lousa-plano-base-e18-4.md`.
Recorte previsto do roadmap: `18.4 — Base de composição landing_page`.

1. Estado e decisões fixas

1.1. Estado do caso

* O projeto decidiu separar três planos-base relacionados para landing pages reais de clientes.
* Este documento assume apenas o Plano-base 1: base de composição `landing_page`.
* A ligação principal é E18 — Base transversal de templates, módulos, composições e artefatos.
* E12 e E19 são consumidores futuros deste recorte, não escopo de implementação deste plano.
* O arquivo foi criado antes da conclusão do plano-base v1 completo para registrar decisões do debate sem perder contexto.

1.2. Decisões já definidas no debate

* A composição de `landing_page` não deve repetir a rigidez de `commercial_activation`.
* Páginas comerciais podem permanecer determinísticas no MVP.
* Landing pages reais de clientes precisam de composição flexível por nicho.
* Template e composition devem permanecer separados.
* Não criar um template por nicho como regra do MVP.
* O template-base define a estrutura técnica permitida da família/canal.
* A composition define a montagem concreta por nicho/contexto.
* Módulos se relacionam operacionalmente com compositions por meio de `content_template_composition_items`.
* No schema atual, módulos/seções são registrados em `content_templates` com `template_scope = 'section'`.
* Variantes descrevem forma estrutural ou funcional do módulo, não nichos.
* A parametrização técnica crítica deve começar no repositório, não em editor livre no Admin.
* Os módulos de `landing_page` devem ser desenhados com visão transversal, para reduzir retrabalho futuro em `commercial_activation` e outros canais.
* Transversalidade não significa liberar uso automático em todos os canais sem contrato; significa projetar módulo, variante, schema, renderer e parametrização para reaproveitamento controlado.
* O Admin de curadoria pertence ao Plano-base 2, não a este recorte.
* LP teste e liberação de nicho pertencem ao Plano-base 3, não a este recorte.

1.3. Decisão em aberto sobre banco de dados

* O debate ainda não fechou se haverá ou não mudança de schema.
* A decisão não deve partir da premissa de evitar migration a qualquer custo.
* Se o debate ou a investigação técnica mostrar necessidade real de melhorar o schema agora, o plano deve prever essa mudança.
* Se a estrutura atual for suficiente, o plano deve registrar a decisão de manter o schema e endurecer as regras por validação executável no repositório.
* Não deixar dívida técnica conhecida para o futuro apenas para acelerar a etapa atual.
* Não criar nova tabela, constraint, RPC, trigger ou policy sem necessidade demonstrada no debate e na investigação técnica.

1.4. Estrutura de roadmap prevista

* `18.4.1 Objetivo e status` deve existir no roadmap por padrão.
* `18.4.2 Registros do recorte` deve existir no roadmap por padrão quando houver implementação material.
* As seções implementáveis ou decisórias devem começar em `18.4.3`.
* Previsão inicial sujeita a debate:
  * `18.4.3 Avaliação de hardening de banco e limite de schema`.
  * `18.4.4 Catálogo mínimo landing_page`.
  * `18.4.5 Contratos técnicos, registry, schemas e renderer`.
  * `18.4.6 Resolver, validação de composição e limites de config_json`.

1.5. Direção de transversalidade dos módulos

* O objetivo de E18.4 não é criar módulos descartáveis ou exclusivos de `landing_page`.
* O catálogo mínimo deve ser desenhado como base reaproveitável para canais futuros e para eventual evolução de `commercial_activation`.
* O primeiro uso formal neste plano continua sendo `landing_page`.
* O reuso por outro canal exige compatibilidade explícita de contrato, schema, registry, renderer e validação.
* Um módulo pode ter núcleo conceitual transversal e ainda assim exigir adaptação por família/canal.
* A implementação deve evitar duplicar futuramente, para `commercial_activation`, o mesmo trabalho estrutural feito neste recorte.
* A decisão sobre criar camada compartilhada, catálogo transversal explícito ou apenas componentes/helpers reutilizáveis permanece aberta para debate técnico.

2. Contrato do caso

2.1. Problema

* A família `landing_page` ainda não deve ser considerada resolvida.
* O risco é repetir, para LPs reais de clientes, a rigidez de página comercial:
  * seções fixas;
  * ordem fixa;
  * variantes fixas;
  * `config_json = {}` sem uso real;
  * IA apenas preenchendo copy dentro de estrutura rígida.
* Esse modelo serve para `commercial_activation`, mas não serve como regra para landing pages reais de clientes.
* Outro risco é criar módulos bons para `landing_page`, mas tão específicos que gerem retrabalho para evoluir `commercial_activation` ou outros canais.

2.2. Resultado esperado

* Preparar a fundação técnica e estrutural da família `landing_page`.
* Definir template-base inicial `landing_page`.
* Definir catálogo inicial pequeno de módulos/seções.
* Definir variantes mínimas por módulo.
* Definir parametrizações técnicas críticas no repositório.
* Definir registry fechado de variantes.
* Definir schemas/Zod mínimos por variante.
* Definir resolver/validador de composição `landing_page`.
* Validar `content_template_composition_items` para `landing_page`.
* Definir se o schema atual será mantido ou se precisa ser endurecido por migration própria.
* Definir uso inicial de `config_json` como vazio ou override controlado, sem editor livre.
* Definir até que ponto os módulos de `landing_page` devem nascer como núcleo transversal reaproveitável.
* Definir se a transversalidade será resolvida por camada compartilhada, por helpers/componentes reutilizáveis ou por contratos por família com adaptação controlada.
* Preparar a base para que o Plano-base 2 consiga sugerir, validar e persistir composição aprovada por nicho.

2.3. Usuários envolvidos

* Usuários diretos:
  * sistema;
  * Admin futuro da curadoria;
  * Executor/Codex;
  * especialistas que avaliarão o plano-base.
* Usuário indireto:
  * cliente final, ainda sem interação neste plano.

2.4. Roadmap afetado

* Seção principal:
  * E18 — Base transversal de templates, módulos, composições e artefatos.
* Recorte previsto:
  * `18.4 — Base de composição landing_page`.
* Relações secundárias:
  * E12 — consumidor futuro para curadoria no Admin;
  * E19 — consumidor futuro para LP teste e liberação de nicho;
  * E10.7 — referência comparativa e possível consumidor futuro de módulos melhorados, sem ser governada automaticamente por `landing_page`.

2.5. Fluxo operacional previsto

* Gatilho:
  * humano aprova iniciar o recorte E18.4 para base de composição `landing_page`.
* Entrada:
  * documentos obrigatórios do projeto;
  * schema atual de templates, compositions, composition items e artifacts;
  * lousa de debate de landing pages;
  * aprendizado técnico de `commercial_activation`.
* Processamento:
  * avaliar necessidade ou não de hardening de banco;
  * definir template-base `landing_page`;
  * definir catálogo mínimo de módulos;
  * avaliar quais módulos devem ser tratados como núcleo potencialmente transversal;
  * definir variantes mínimas;
  * criar ou ajustar contratos técnicos;
  * criar registry fechado;
  * criar schemas/Zod;
  * criar resolver/validador de composição;
  * definir uso seguro de `config_json`.
* Validação:
  * bloquear template incompatível;
  * bloquear módulo incompatível;
  * bloquear variante inexistente;
  * bloquear variante incompatível com módulo;
  * bloquear `config_json` fora do permitido;
  * validar ordem, obrigatoriedade e composição mínima;
  * validar se a modelagem escolhida preserva potencial de reuso transversal sem liberar uso indevido;
  * executar checks aplicáveis do repositório.
* Persistência:
  * registrar apenas a base mínima necessária;
  * persistir registros-base somente se aprovados no plano;
  * não persistir composição aprovada por nicho neste plano, salvo composição técnica mínima exigida pela base e explicitamente aprovada.
* Consumo:
  * Plano-base 2 consumirá a base para curadoria no Admin;
  * Plano-base 3 consumirá composição aprovada para LP teste;
  * `commercial_activation` poderá consumir aprendizados, núcleo visual ou contratos reaproveitáveis apenas após decisão própria.
* Fallback:
  * composição inválida deve ser bloqueada;
  * módulo ausente deve virar lacuna objetiva;
  * variante ausente deve virar lacuna objetiva;
  * ausência de renderer/schema deve impedir validação positiva;
  * nenhuma composição inválida deve ser marcada como pronta.

2.6. Limites atuais do recorte

* Não criar Admin Dashboard de curadoria.
* Não criar tela de aprovação humana.
* Não gerar LP teste.
* Não liberar nicho para clientes.
* Não criar LP Builder visual.
* Não publicar LP pública.
* Não colocar IA em runtime público.
* Não permitir criação automática de módulos pela IA.
* Não permitir geração automática de composição sem revisão humana.
* Não criar marketplace de templates.
* Não criar múltiplos templates ativos por família sem caso real.
* Não criar editor livre de schema, renderer, Zod ou parametrização crítica.
* Não implementar consumo por `commercial_activation` neste plano, salvo decisão explícita posterior.
* Não criar automações, jobs, agentes ou rotinas recorrentes sem necessidade comprovada.

2.7. Riscos principais

* Criar complexidade prematura de engine de módulos.
* Criar catálogo extenso sem evidência real.
* Reaproveitar `commercial_activation` de forma indevida para `landing_page`.
* Criar módulos `landing_page` específicos demais e gerar retrabalho para `commercial_activation`.
* Confundir transversalidade com liberação automática de módulo para qualquer canal.
* Colocar no banco uma parametrização que ainda exige contrato, renderer e validação no código.
* Deixar o banco aceitar composição estruturalmente inválida pelo fluxo oficial.
* Usar `config_json` como editor livre e quebrar renderização.
* Adiar correção de schema necessária e gerar retrabalho futuro.
* Fazer migration sem necessidade real e inflar o MVP.

2.8. Automação/agentes

* Automação: não.
* Justificativa:
  * este plano prepara contrato, base técnica e validação;
  * não há necessidade comprovada de job, agente, automação recorrente ou workflow autônomo.

3. Fases e próxima ação

3.1. Estado desta seção

* Esta seção ainda está em debate.
* As fases finais não estão consolidadas.
* A previsão abaixo serve apenas para orientar o debate e pode ser ajustada antes do plano-base v1 completo.

3.2. Previsão inicial de fases ou seções implementáveis

* `18.4.3 Avaliação de hardening de banco e limite de schema`:
  * decidir se o schema atual é suficiente ou se precisa de migration/RPC/constraint/policy para impedir inconsistência estrutural;
  * Automação: não.
* `18.4.4 Catálogo mínimo landing_page`:
  * definir template-base e módulos/seções iniciais mínimos para o MVP;
  * avaliar potencial transversal dos módulos antes de fechar o catálogo;
  * Automação: não.
* `18.4.5 Contratos técnicos, registry, schemas e renderer`:
  * criar ou ajustar contratos de código, registry fechado, schemas/Zod e renderização mínima;
  * definir se haverá núcleo compartilhável ou contratos separados por família;
  * Automação: não.
* `18.4.6 Resolver, validação de composição e limites de config_json`:
  * validar composição `landing_page`, composition items, variantes e overrides controlados;
  * validar compatibilidade de reuso sem liberar uso automático indevido;
  * Automação: não.

3.3. Próxima ação do debate

* Continuar avaliando se `18.4.3` exige mudança real de banco ou apenas validação executável no repositório.
* Continuar avaliando se a transversalidade deve gerar camada compartilhada, helpers/componentes reutilizáveis ou apenas contratos por família.
* Depois consolidar as fases finais do plano-base v1.
* Só após fechamento do plano-base v1 completo, preparar handoff Codex conforme `docs/template-briefing-codex.md`.

4. Escopo negativo e critérios de parada

4.1. Escopo negativo consolidado

* Admin Dashboard de curadoria.
* Tela de aprovação humana.
* LP teste.
* Liberação de nicho para clientes.
* LP Builder visual.
* Publicação pública de LP.
* IA em runtime público.
* Criação automática de módulos pela IA.
* Geração automática de composição sem revisão humana.
* Nova arquitetura multicanal ampla.
* Editor livre de schema, renderer ou Zod.
* Marketplace de templates.
* Múltiplos templates ativos por família sem caso real.
* Consumo automático por `commercial_activation` sem contrato próprio.
* Testes A/B.
* Analytics.
* Domínio customizado.
* Automações, jobs, agentes ou rotinas recorrentes sem necessidade comprovada.

4.2. Critérios de parada

* Parar se a investigação mostrar necessidade de mudança de schema não prevista no debate.
* Parar se a estrutura atual permitir composição inválida sem ponto seguro de bloqueio.
* Parar se um módulo proposto não tiver schema, registry e renderer compatíveis.
* Parar se `config_json` começar a funcionar como editor livre.
* Parar se a busca por transversalidade virar engine multicanal ampla sem necessidade real.
* Parar se o plano começar a invadir E12 ou E19.
* Parar se faltar fonte real para decidir banco, rota, renderer, schema ou contrato técnico.
