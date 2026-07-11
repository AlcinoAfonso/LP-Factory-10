06/07/2026 — Plano-base E18.4 — Base de composição `landing_page`
Fontes: chat, `README.md`, `AGENTS.md`, `docs/prompt-estrategista.md`, `docs/template-roadmap.md`, `docs/template-briefing-codex.md`, `docs/prompt-executor.md`, `docs/roadmap.md`, `docs/base-tecnica.md`, `docs/schema.md`, `docs/lousa-debate-landing-pages.md`, `docs/supa-up.md`, `docs/vercel-up.md`, `docs/github-up.md`, `docs/prod-up.md`, avaliações dos especialistas

Status: plano-base v2 consolidado após avaliação dos especialistas.
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
* A transversalidade dos módulos é decisão conceitual aprovada no debate.
* Módulos devem ser tratados como catálogo transversal controlado.
* Um módulo pode nascer motivado por um canal inicial, mas não deve ficar preso definitivamente a esse canal.
* O uso produtivo de um módulo em cada canal depende de compatibilidade explícita de contrato, schema, registry, renderer e validação.
* `template_family = shared/transversal` é hipótese de solução técnica, não decisão fechada.
* O Admin de curadoria pertence ao Plano-base 2, não a este recorte.
* LP teste e liberação de nicho pertencem ao Plano-base 3, não a este recorte.

1.3. Decisão em aberto sobre banco de dados

* O debate ainda não fechou se haverá ou não mudança de schema.
* A decisão não deve partir da premissa de evitar migration a qualquer custo.
* Se o debate ou a investigação técnica mostrar necessidade real de melhorar o schema agora, o plano deve prever essa mudança.
* Se a estrutura atual for suficiente, o plano deve registrar a decisão de manter o schema e endurecer as regras por validação executável no repositório.
* O `18.4.3` deve avaliar se o catálogo transversal controlado exige hardening do schema, nova família, camada de compatibilidade ou outro ajuste de banco.
* O `18.4.3` também deve avaliar se a transversalidade pode ser garantida inicialmente por contrato, registry e validação executável no repositório.
* `template_family = shared/transversal` deve ser tratado apenas como hipótese entre alternativas, não como decisão obrigatória.
* Não deixar dívida técnica conhecida para o futuro apenas para acelerar a etapa atual.
* Não criar nova tabela, constraint, RPC, trigger ou policy sem necessidade demonstrada no debate e na investigação técnica.

1.4. Estrutura de roadmap prevista

* `18.4.1 Objetivo e status` deve existir no roadmap por padrão.
* `18.4.2 Registros do recorte` deve existir no roadmap por padrão quando houver implementação material.
* As seções implementáveis ou decisórias devem começar em `18.4.3`.
* Previsão inicial sujeita a debate:
  * `18.4.3 Contrato transversal de módulos e avaliação de hardening do schema`.
  * `18.4.4 Catálogo mínimo transversal para primeiro uso em landing_page`.
  * `18.4.5 Contratos técnicos, registry, schemas e renderer por canal`.
  * `18.4.6 Resolver, validação de composição e limites de config_json`.

1.5. Direção de catálogo transversal controlado

* O objetivo de E18.4 não é criar módulos descartáveis ou exclusivos de `landing_page`.
* O recorte E18.4 usa `landing_page` como primeiro caso de desenho dos módulos, mas os módulos devem nascer como catálogo transversal controlado.
* O catálogo mínimo deve ser desenhado como base reaproveitável para canais futuros e para eventual evolução de `commercial_activation`.
* O primeiro uso formal neste plano continua sendo `landing_page`.
* O reuso por outro canal exige compatibilidade explícita de contrato, schema, registry, renderer e validação.
* Um módulo pode ter núcleo conceitual transversal e ainda assim exigir adaptação por família/canal.
* A implementação deve evitar duplicar futuramente, para `commercial_activation`, o mesmo trabalho estrutural feito neste recorte.
* A decisão sobre criar camada compartilhada, catálogo transversal explícito, camada de compatibilidade no banco ou apenas componentes/helpers reutilizáveis permanece aberta para debate técnico.

1.6. Consolidação das avaliações dos especialistas

* Analista:
  * aprovado como plano-base v1 para avaliação dos demais especialistas;
  * a ressalva sobre a expressão “família `landing_page`” em `2.2` foi considerada aceitável, porque o restante do documento deixa claro que o catálogo é transversal.
* Gestor Estrutural:
  * aprovado com condicionantes operacionais;
  * as condicionantes não bloqueiam o plano documental;
  * o ponto sobre atualização do roadmap fica fora deste plano, pois o roadmap será tratado após a implementação;
  * não liberar execução material de `18.4.4`, `18.4.5` ou `18.4.6` antes da decisão técnica de `18.4.3`.
* Gestor de Updates:
  * aprovado com ajuste documental;
  * não há update que obrigue nova infra, banco, job, agente, automação ou runtime neste recorte;
  * as decisões de updates aplicáveis foram incorporadas em `2.9`.
* Decisões aceitas:
  * manter `template_family = shared/transversal` apenas como hipótese técnica;
  * manter decisão de schema aberta até a investigação de `18.4.3`;
  * reforçar que `18.4.3` é fase decisória/investigativa antes das fases seguintes;
  * incorporar uso limitado de updates como apoio, sem ampliar escopo.
* Decisões rejeitadas:
  * não ajustar `2.2` apenas por linguagem, pois não há contradição material;
  * não tratar atualização do roadmap dentro deste plano;
  * não incorporar lista longa de updates preliminares ao plano-base;
  * não liberar implementação de catálogo, registry, renderer, resolver ou schema antes da fase `18.4.3`.
* Decisões pendentes:
  * decidir, em `18.4.3`, se o schema atual sustenta o contrato transversal ou exige hardening;
  * definir paths técnicos canônicos para registry, schemas, renderer, resolver e validações;
  * definir catálogo mínimo apenas após a decisão técnica de `18.4.3`;
  * definir critérios finais de compatibilidade entre módulo, variante, canal, schema, renderer e composition.

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
* Definir catálogo inicial pequeno e transversal controlado de módulos/seções para primeiro uso em `landing_page`.
* Definir variantes mínimas por módulo.
* Definir parametrizações técnicas críticas no repositório.
* Definir registry fechado de variantes.
* Definir schemas/Zod mínimos por variante e por canal quando necessário.
* Definir resolver/validador de composição `landing_page`.
* Validar `content_template_composition_items` para `landing_page`.
* Definir o contrato de catálogo transversal controlado de módulos.
* Avaliar se a representação técnica da transversalidade exige mudança de schema ou se pode ser inicialmente garantida no repositório.
* Definir se o schema atual será mantido ou se precisa ser endurecido por migration própria.
* Definir uso inicial de `config_json` como vazio ou override controlado, sem editor livre.
* Definir se a transversalidade será resolvida por camada compartilhada, por camada de compatibilidade no banco, por helpers/componentes reutilizáveis ou por contratos por família com adaptação controlada.
* Preparar a base para que o Plano-base 2 consiga sugerir, validar e persistir composição aprovada por nicho.

2.3. Usuários envolvidos

* Usuários diretos:
  * sistema;
  * Admin futuro da curadoria;
  * Executor;
  * especialistas que avaliaram o plano-base.
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

2.5. Fluxo operacional consolidado

* Gatilho:
  * humano aprova iniciar o recorte `18.4 — Base de composição landing_page`;
  * o recorte parte da decisão conceitual de catálogo transversal controlado de módulos.
* Entrada:
  * documentos obrigatórios do projeto;
  * schema atual de `content_templates`, `content_template_compositions` e `content_template_composition_items`;
  * lousa de debate de landing pages;
  * aprendizado técnico de `commercial_activation`;
  * decisão conceitual de que módulos são catálogo transversal controlado;
  * definição de que `landing_page` é o primeiro consumidor formal neste recorte;
  * definição de que `template_family = shared/transversal` é hipótese técnica, não decisão fechada.
* Processamento:
  * definir o contrato de catálogo transversal controlado dos módulos;
  * avaliar como cada canal habilita uso produtivo por contrato, schema, registry, renderer e validação;
  * avaliar se o schema atual sustenta esse contrato ou se precisa de hardening;
  * decidir se a transversalidade será garantida por schema, registry, validação no repositório ou combinação dessas opções;
  * definir template-base `landing_page`;
  * definir catálogo mínimo transversal para primeiro uso em `landing_page`;
  * diferenciar módulo transversal, variante específica por canal e renderer específico por canal;
  * definir variantes mínimas;
  * criar ou ajustar contratos técnicos;
  * criar registry fechado;
  * criar schemas/Zod por variante e por canal quando necessário;
  * criar renderer mínimo para uso inicial em `landing_page`;
  * criar resolver/validador de composição;
  * definir uso seguro de `config_json`.
* Validação:
  * bloquear composição inválida;
  * bloquear template incompatível;
  * bloquear módulo sem contrato compatível;
  * bloquear módulo incompatível;
  * bloquear variante inexistente;
  * bloquear variante incompatível com módulo;
  * bloquear canal sem schema, registry, renderer e validação compatíveis;
  * bloquear `config_json` fora do permitido;
  * validar ordem, obrigatoriedade e composição mínima;
  * validar se a modelagem escolhida preserva potencial de reuso transversal sem liberar uso indevido;
  * garantir que `config_json` seja override controlado, não editor livre;
  * executar checks aplicáveis do repositório.
* Persistência:
  * registrar apenas a base mínima necessária;
  * persistir registros-base somente se aprovados no plano;
  * não persistir composição aprovada por nicho neste plano, salvo composição técnica mínima exigida pela base e explicitamente aprovada;
  * não alterar `commercial_activation` neste recorte.
* Consumo:
  * Plano-base 2 consumirá a base para curadoria no Admin;
  * Plano-base 3 consumirá composição aprovada para LP teste;
  * `commercial_activation` poderá consumir aprendizados, núcleo visual ou contratos reaproveitáveis apenas após decisão própria e fora deste recorte.
* Fallback:
  * composição inválida deve ser bloqueada;
  * módulo ausente deve virar lacuna objetiva;
  * variante ausente deve virar lacuna objetiva;
  * ausência de renderer, schema, registry ou validação deve impedir uso produtivo do módulo no canal;
  * se o schema atual não sustentar a regra transversal, parar e decidir hardening antes de avançar;
  * se a transversalidade virar engine ampla multicanal, parar;
  * se o plano invadir E12 ou E19, parar;
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
* Assumir prematuramente que a solução correta é `template_family = shared/transversal`.
* Permitir uso produtivo de módulo em canal sem renderer, schema, registry e validação compatíveis.
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

2.9. Decisões de updates aplicáveis

* Updates aceitos como apoio limitado:
  * `supa#40` pode apoiar validações read-only de schema e composição quando aplicável, sem substituir migration versionada nem criar mutation SQL avulsa;
  * `supa#57` pode apoiar visualmente a decisão de schema em `18.4.3`, sem substituir `docs/schema.md`;
  * `vercel#4` orienta compatibilidade com Next.js 16/Turbopack, sem customização de bundler sem blocker real;
  * `prod#17` orienta baseline leve de acessibilidade em contratos e renderers, sem auditoria completa WCAG neste recorte.
* Updates rejeitados neste recorte:
  * IA, agentes, automações, workflows autônomos e criação automática de módulos;
  * A/B test, analytics, tracking, remarketing e flags de experimento;
  * storage, arquivos privados, Blob, nova infra ou multi-service;
  * filas, CRM, webhooks, cron e PRs de bot;
  * busca semântica, matching sofisticado, `pg_trgm`, `pgvector` e Algolia;
  * SSO, billing, Stripe, entitlements e onboarding enterprise.

3. Fases e próxima ação

3.1. Estado desta seção

* Esta seção está consolidada como base v2 após avaliação dos especialistas.
* As fases abaixo representam a previsão operacional do recorte.
* Ajustes ainda podem ocorrer por decisão humana explícita ou aprendizado real da fase `18.4.3`.

3.2. Previsão inicial de fases ou seções implementáveis

* `18.4.3 Contrato transversal de módulos e avaliação de hardening do schema`:
  * definir módulos como catálogo transversal controlado;
  * registrar que módulos podem nascer motivados por um canal inicial, mas não devem ficar presos definitivamente a esse canal;
  * diferenciar módulo conceitual, variante, schema, renderer, registry, composition e artefato final;
  * definir que o uso produtivo em cada canal depende de compatibilidade explícita;
  * comparar o contrato desejado com o schema real de `content_templates`, `content_template_compositions` e `content_template_composition_items`;
  * avaliar se essa regra exige hardening do schema ou se pode ser garantida inicialmente por validação executável no repositório;
  * se houver alteração de banco, prever migration versionada, RLS, policies, GRANTs quando aplicável e atualização de `docs/schema.md`;
  * se não houver alteração de banco, registrar que a garantia inicial ficará no repositório por contratos, registry, schemas e validação executável;
  * tratar `template_family = shared/transversal` apenas como hipótese de solução, não como decisão fechada;
  * usar `supa#40` e `supa#57` apenas como apoio read-only/manual quando aplicável;
  * Automação: não.
* `18.4.4 Catálogo mínimo transversal para primeiro uso em landing_page`:
  * definir módulos/seções iniciais mínimos para o MVP;
  * usar `landing_page` como primeiro caso de uso formal;
  * não prender os módulos definitivamente à família `landing_page`;
  * classificar cada módulo por função conceitual;
  * indicar variantes mínimas necessárias para o primeiro uso;
  * separar o que é módulo transversal do que é variante específica de canal;
  * não criar catálogo extenso, módulo universal automático ou registro-base antes da decisão de `18.4.3`;
  * não reaproveitar `commercial_activation` como compatível automaticamente com `landing_page`;
  * Automação: não.
* `18.4.5 Contratos técnicos, registry, schemas e renderer por canal`:
  * definir contratos técnicos dos módulos do catálogo transversal;
  * definir registry de compatibilidade entre módulo, variante e canal;
  * definir schemas/Zod por variante e por canal quando necessário;
  * definir renderer mínimo para uso inicial em `landing_page`;
  * não exigir renderer para todos os canais neste recorte;
  * impedir uso produtivo de módulo em canal sem renderer/schema/registry compatível;
  * manter compatibilidade com Next.js 16/Turbopack, sem workaround de bundler sem blocker real;
  * usar baseline leve de acessibilidade para contratos e renderers, sem auditoria completa;
  * não criar editor livre de contratos;
  * Automação: não.
* `18.4.6 Resolver, validação de composição e limites de config_json`:
  * validar composição do primeiro uso `landing_page`;
  * validar `content_template_composition_items`, módulos, variantes, ordem, obrigatoriedade e `config_json`;
  * validar compatibilidade explícita entre canal, módulo, variante, schema e renderer;
  * bloquear uso produtivo de módulo sem contrato completo para o canal;
  * garantir que `config_json` seja override controlado, não editor livre;
  * definir casos de validação para composição válida e inválida;
  * usar validações read-only de banco somente quando aplicável e sem substituir migration versionada;
  * Automação: não.

3.3. Próxima ação

* Fase `18.4.3` concluída como decisão técnica investigativa.
* Fase `18.4.4` concluída como definição documental do catálogo mínimo transversal para primeiro uso em `landing_page`.
* Fase `18.4.5` concluída com contratos técnicos executáveis, registry, schemas/Zod e renderer mínimo de `landing_page` no repositório.
* Fase `18.4.6` concluída com resolver/validador final de composição `landing_page` e limites técnicos de `config_json`.
* Próxima fase liberada:
  * definição estratégica da próxima etapa de consumo, sem criar registros-base, LP teste, Admin ou LP Builder automaticamente.
* Travas mantidas:
  * não criar registros-base de banco ou LP teste antes das fases correspondentes;
  * não criar migration, alterar `docs/schema.md`, RLS, policies ou GRANTs sem necessidade demonstrada;
  * não transformar catálogo transversal controlado em engine multicanal ampla;
  * não abrir editor livre de `config_json`;
  * não reabrir hardening sem necessidade demonstrada.

3.4. Resultado técnico de `18.4.3`

* Status da fase: concluída como decisão técnica investigativa.
* Decisão: schema atual suficiente para o início controlado de `landing_page`; não há hardening de schema necessário nesta fase.
* Migration: não criar migration em `18.4.3`.
* Atualização de `docs/schema.md`: não aplicável nesta fase, pois não há alteração de banco.
* RLS, policies e GRANTs: sem alteração nesta fase.
* Apoio Supabase read-only: inspeção do projeto `lp-factory-10` confirmou que o estado real mantém `content_templates`, `content_template_compositions` e `content_template_composition_items` compatíveis com `docs/schema.md`.
* Estado real observado:
  * `content_templates` aceita `template_family IN ('commercial_activation', 'landing_page')`, `template_scope IN ('page', 'section')` e status `draft | active | archived`;
  * há registros ativos apenas para `commercial_activation`: um template de página e oito módulos de seção;
  * não há registros `landing_page` em `content_templates` no estado consultado;
  * `content_template_compositions` versiona composição por `template_id` e `taxon_id`, com no máximo uma composição ativa por par;
  * `content_template_composition_items` vincula cada composição a módulos em `content_templates`, guarda `variant_key`, `sort_order`, `is_required` e `config_json` objeto;
  * o banco garante forma mínima, FKs, versionamento, unicidade de ordem, padrão de `variant_key` e `config_json` como objeto;
  * o banco não garante, sozinho, que o módulo é conceitualmente transversal, que a variante pertence ao módulo, que há renderer/schema para o canal, nem que `config_json` segue contrato específico.
* Comparação com o contrato desejado:
  * a hipótese `template_family = shared/transversal` não deve ser adotada agora, porque exigiria fechar uma modelagem ainda explicitamente aberta e ampliaria o recorte além do necessário;
  * usar `template_family = landing_page` para o primeiro consumidor formal é suficiente para criar registros futuros de página/seção sem alterar o check atual;
  * a transversalidade deve ser tratada como contrato conceitual e técnico do repositório, não como liberação automática no banco;
  * `commercial_activation` permanece referência comparativa, mas seus módulos, variantes, schemas e renderer não são compatíveis automaticamente com `landing_page`.
* Garantia inicial aprovada para as próximas fases:
  * contratos TypeScript devem diferenciar módulo conceitual, variante, schema, renderer, registry, composition e artefato final;
  * registry fechado deve mapear compatibilidade entre canal, módulo, variante, schema e renderer;
  * schemas/Zod devem validar payload por variante e por canal quando necessário;
  * validação executável deve bloquear módulo sem contrato compatível, variante inexistente, variante incompatível com módulo, item obrigatório ausente, item desconhecido, ordem inválida e `config_json` fora do permitido;
  * `config_json` deve continuar override controlado, não editor livre;
  * registros de banco futuros devem ser criados somente depois de `18.4.4`/`18.4.5` definirem catálogo e contratos, e depois de `18.4.6` definir resolver/validador.
* Critério para reabrir hardening:
  * reavaliar migration apenas se uma fase futura exigir que o próprio banco bloqueie compatibilidade módulo-canal-variante, múltiplas famílias compartilhando o mesmo módulo físico, writer administrativo direto, ou uso produtivo fora do fluxo server-side validado;
  * nesse caso, a decisão deverá prever migration versionada, revisão de RLS/policies/GRANTs e atualização de `docs/schema.md` antes de avançar consumo produtivo.
* Fase liberada por `18.4.3`: `18.4.4 Catálogo mínimo transversal para primeiro uso em landing_page`, respeitando que ainda não havia catálogo, renderer, resolver, registros-base ou LP teste criados por `18.4.3`.

3.5. Resultado técnico de `18.4.4`

* Status da fase: concluída como definição documental do catálogo mínimo transversal para primeiro uso em `landing_page`.
* Decisão: o primeiro uso de `landing_page` terá catálogo mínimo próprio, conceitualmente transversal e tecnicamente controlado no repositório.
* Referência comparativa: `commercial_activation` possui oito módulos ativos (`hero`, `benefits`, `services`, `plans`, `differentials`, `how_it_works`, `faq`, `final_cta`), mas nenhum deles fica automaticamente compatível com `landing_page`.
* Catálogo mínimo proposto para primeiro uso em `landing_page`:
  * `hero`: função conceitual de abertura, promessa principal e ação primária; incluído porque toda LP precisa apresentar rapidamente oferta, público e próximo passo.
  * `benefits`: função conceitual de benefícios/resultados; incluído para traduzir valor em motivos concretos de continuidade.
  * `offer`: função conceitual de oferta, serviço, produto ou pacote principal; incluído para explicitar o que será entregue sem depender de tabela de planos.
  * `social_proof`: função conceitual de evidência, confiança e prova; incluído porque LP real de cliente precisa reduzir risco percebido antes da conversão.
  * `how_it_works`: função conceitual de processo, passos ou funcionamento; incluído como módulo opcional/reordenável para nichos em que clareza operacional aumenta conversão.
  * `faq`: função conceitual de objeções frequentes; incluído como módulo opcional para tratar dúvidas recorrentes sem criar conteúdo livre.
  * `final_cta`: função conceitual de fechamento e chamada final; incluído para garantir saída de conversão ao fim da composição.
* Variantes mínimas conceituais, sem contrato técnico ainda:
  * `hero.lead_capture`: abertura com CTA/formulário conceitual para captura ou contato.
  * `benefits.cards`: lista curta de benefícios em cards.
  * `offer.summary`: resumo da oferta principal, sem pricing obrigatório.
  * `social_proof.simple`: evidência textual curta, sem integração externa.
  * `how_it_works.steps`: passos simples do processo.
  * `faq.accordion`: perguntas e respostas.
  * `final_cta.simple`: chamada final direta.
* Separação de responsabilidades:
  * módulo transversal é a função conceitual reutilizável, como `hero`, `benefits` ou `faq`;
  * variante específica de canal é a forma estrutural escolhida para `landing_page`, como `hero.lead_capture` ou `offer.summary`;
  * adaptação futura por renderer/schema pertence a `18.4.5` e `18.4.6`, quando cada variante deverá ganhar compatibilidade explícita de schema, registry, renderer e validação.
* Módulos deixados fora do primeiro uso:
  * `plans`: fora porque pricing/planos pode confundir LP de captura, serviço ou produto sem oferta tabelada; poderá voltar quando houver contrato específico.
  * `services`: fora como módulo separado porque o primeiro uso concentra a oferta em `offer`; pode voltar se uma composição precisar listar múltiplos serviços.
  * `differentials`: fora porque tende a sobrepor `benefits` e `social_proof` no MVP; pode voltar como módulo próprio após evidência real.
  * módulos de galeria, equipe, mapa/localização, comparativo, depoimentos ricos, mídia avançada, analytics, A/B ou integrações externas: fora por ampliarem o catálogo ou exigirem renderer/schema/infra fora deste recorte.
* Não realizado nesta fase:
  * não foi criado renderer;
  * não foi criado resolver;
  * não foi criado registry técnico;
  * não foram criados schemas/Zod;
  * não foram criados registros-base de banco;
  * não foi criada migration;
  * `docs/schema.md`, RLS, policies e GRANTs não foram alterados;
  * não foi criada LP teste, Admin, LP Builder, automação, job, agente ou workflow.
* Próxima fase liberada: `18.4.5 Contratos técnicos, registry, schemas e renderer por canal`, limitada a transformar este catálogo conceitual em contratos técnicos executáveis sem assumir compatibilidade automática com `commercial_activation`.

3.6. Resultado técnico de `18.4.5`

* Status da fase: concluída com implementação técnica mínima no repositório.
* Decisão: o catálogo conceitual de `landing_page` passou a ter contrato executável próprio, separado de `commercial_activation`.
* Arquivos técnicos criados:
  * `lib/conversion-content/landing-page/contracts.ts`;
  * `lib/conversion-content/landing-page/schemas.ts`;
  * `lib/conversion-content/landing-page/registry.ts`;
  * `lib/conversion-content/landing-page/render-model.ts`;
  * `lib/conversion-content/landing-page/renderer.tsx`;
  * `lib/conversion-content/landing-page/fixture.ts`;
  * `lib/conversion-content/landing-page/validation-cases.ts`;
  * `lib/conversion-content/landing-page/index.ts`.
* Arquivos técnicos ajustados:
  * `lib/conversion-content/index.ts`;
  * `package.json`.
* Contrato técnico criado:
  * canal fechado em `landing_page`;
  * módulos permitidos: `hero`, `benefits`, `offer`, `social_proof`, `how_it_works`, `faq` e `final_cta`;
  * variantes permitidas: `hero.lead_capture`, `benefits.cards`, `offer.summary`, `social_proof.simple`, `how_it_works.steps`, `faq.accordion` e `final_cta.simple`;
  * registry técnico liga canal, módulo, variante, schema Zod e renderer;
  * `buildLandingPageRenderModel` valida envelope, canal, item duplicado, item desconhecido, item obrigatório ausente, variante inexistente, incompatibilidade módulo/variante e conteúdo por schema;
  * renderer mínimo usa somente o registry próprio de `landing_page`, com seções semânticas, headings associados por `aria-labelledby`, CTAs como links e estados inválidos fail-closed com retorno nulo.
* Validação executável criada:
  * script `validate:landing-page`;
  * fixture sintética local, sem leitura de Supabase, sem criação de LP real e sem registros de banco.
* Compatibilidade e limites:
  * não há compatibilidade automática com `commercial_activation`;
  * o renderer comercial existente permanece apenas como referência comparativa;
  * não foi criado resolver final de composição nem integração com banco;
  * `config_json` permanece sem semântica técnica final nesta fase e deverá ser limitado em `18.4.6`.
* Não realizado nesta fase:
  * não foi criada migration;
  * `docs/schema.md` não foi alterado;
  * RLS, policies e GRANTs não foram alterados;
  * não foram criados registros-base no banco;
  * não foi criada LP teste, Admin, LP Builder, automação, job, agente ou workflow.
* Próxima fase liberada: `18.4.6 Resolver, validação de composição e limites de config_json`, limitada a resolver e validar composição sem abrir editor livre nem alterar banco sem necessidade demonstrada.

3.7. Resultado técnico de `18.4.6`

* Status da fase: concluída com implementação técnica no repositório.
* Decisão: o primeiro uso de `landing_page` passa a ter resolver/validador final de composição antes do render model, com falha fechada para composições inválidas.
* Arquivos técnicos criados:
  * `lib/conversion-content/landing-page/composition-validator.ts`.
* Arquivos técnicos ajustados:
  * `lib/conversion-content/landing-page/render-model.ts`;
  * `lib/conversion-content/landing-page/renderer.tsx`;
  * `lib/conversion-content/landing-page/fixture.ts`;
  * `lib/conversion-content/landing-page/validation-cases.ts`;
  * `lib/conversion-content/landing-page/index.ts`.
* Resolver/validador de composição:
  * valida item duplicado na composição antes de montar o mapa de itens;
  * valida `sortOrder` inteiro, não negativo e sem duplicidade;
  * não exige que o array de entrada esteja ordenado e normaliza os itens por `sortOrder` antes do render model;
  * valida variante existente no registry fechado de `landing_page`;
  * valida compatibilidade explícita entre módulo e variante;
  * normaliza itens resolvidos para o render model somente depois de validar registry e `config_json`;
  * mantém `commercial_activation` apenas como referência comparativa, sem compatibilidade automática.
* Limites técnicos de `config_json`:
  * `config_json` é override controlado por seção;
  * chaves permitidas nesta fase: `anchor_id` e `spacing`;
  * `anchor_id` deve seguir padrão seguro de âncora curta: letra minúscula inicial, letras minúsculas, números ou hífen, até 64 caracteres;
  * `anchor_id` permanece opcional, mas deve ser único quando informado em mais de uma seção;
  * `spacing` aceita somente `compact`, `default` ou `spacious`;
  * objetos com chaves livres como renderer, schema, style, HTML, script ou props arbitrárias são rejeitados;
  * o renderer mínimo consome apenas esses overrides permitidos para `id` de seção e espaçamento vertical.
* Casos de validação cobertos por `validate:landing-page`:
  * composição válida;
  * item duplicado na composição;
  * item duplicado no conteúdo;
  * item desconhecido no conteúdo;
  * variante inexistente;
  * incompatibilidade módulo/variante;
  * ordem inválida;
  * `config_json` inválido;
  * item obrigatório ausente;
  * item opcional ausente;
  * schema de conteúdo inválido;
  * canal inválido;
  * rejeição de variante de `commercial_activation` como compatível automaticamente.
* Não realizado nesta fase:
  * não foi criada migration;
  * `docs/schema.md` não foi alterado;
  * RLS, policies e GRANTs não foram alterados;
  * não foram criados registros-base no banco;
  * não foi criada LP teste, rota pública, Admin, LP Builder, automação, job, agente ou workflow.
* Próxima etapa: depende de definição estratégica posterior; esta fase não libera, por si só, criação de registros-base, LP teste, Admin ou LP Builder.

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
