Título: docs/lousa-estrategista-E12.md

## 1) Objetivo

Esta lousa se baseia no repositório, mas não o espelha.
Ela registra o caso de uso atual, suas decisões, ambiguidades, propostas, fluxo e esboço de execução.

### 1.1 Estrutura da lousa

* usar bullets no último nível de cada seção
* evitar excesso de numeração para reduzir poluição visual
* cada esboço deve ter no título o subitem correspondente que já está ou estará no roadmap, iniciado por `E`
* cada esboço deve ser refinado até virar um plano base pronto para envio ao Executor

## 2) Fontes

### 2.1 Docs alvos

* docs/roadmap.md
* docs/base-tecnica.md
* docs/schema.md
* docs/design-system.md

### 2.2 Docs de apoio e watchlist

* docs/prompt-executor.md
* docs/prompt-abc.md
* docs/template-briefing-codex.md
* docs/supa-up.md
* docs/vercel-up.md
* docs/auto-agentes-up.md

### 2.3 Fontes operacionais validadas

#### 2.3.1 Repositório GitHub

* acesso confirmado ao repositório AlcinoAfonso/LP-Factory-10
* nível validado no repositório: leitura e inspeção do repositório real
* inclui: buscar arquivos, abrir arquivos, ler conteúdo, confirmar paths e artefatos versionados
* não assumir capacidade mutável no repositório sem teste explícito no caso

#### 2.3.2 Vercel

* acesso confirmado ao workspace e aos projetos da Vercel do LP Factory 10
* projetos já validados: lp-factory-10 e lpf-10-services
* nível validado na Vercel até aqui: inspeção operacional
* inclui: listar team, listar projetos, ler metadados de projeto, listar deploys, ler deployment por ID e ler build logs
* não assumir aqui capacidade de alterar settings, variáveis, domínios ou disparar deploy sem teste explícito no caso

## 3) Regras

### 3.1 Regra dos planos base dos casos

#### 3.1.1 Como gerar o plano base do caso

* o plano base do caso deve ser gerado em cima do esboço já definido na lousa
* deve recortar apenas a etapa correspondente
* deve apontar os documentos canônicos da etapa
* deve trazer um objetivo bem traçado, deixando claro o que a etapa entrega e o que fica fora dela
* pode incluir insights do que pode precisar ser investigado no repositório, quando isso ajudar a preparar melhor a execução
* não deve reescrever o fluxo operacional do docs/prompt-executor.md

#### 3.1.2 Instruções ao Executor

* você é o executor deste caso
* você tem acesso direto, via conectores já configurados, ao GitHub AlcinoAfonso/LP-Factory-10, branch main, onde estão os docs deste caso
* acessar docs/prompt-executor.md
* usar como plano base: o item 6.x correspondente em: docs/lousa-estrategista-E12.md
* usar docs/lousa-estrategista-2.md também como visão geral do caso, se necessário

#### 3.1.3 Após receber o relatório do executor

* etapa 1: ajustar a lousa com base no relatório recebido do executor
* após concluir a etapa 1, a IA deve parar e aguardar comando do proprietário do produto para seguir
* etapa 2: debater com o proprietário do produto os casos de uso propostos pelo executor
* após concluir a etapa 2, a IA deve parar e aguardar comando do proprietário do produto para seguir
* etapa 3: antes de entregar qualquer ABC, a IA deve avaliar os docs alvos do caso e informar quais precisam de atualização e quais não precisam de atualização
* na etapa 3, a IA deve avaliar também se docs/design-system.md deve receber atualização documental própria, com base no impacto real do caso sobre UI, componentes, padrões visuais e superfícies do produto
* após concluir essa triagem documental da etapa 3, a IA deve parar e aguardar comando do proprietário do produto para seguir
* depois da triagem documental, a IA deve gerar o ABC de cada doc que exigir ajuste, com base no relatório do executor, na lousa já ajustada, na definição sobre novo caso de uso e em docs/prompt-abc.md
* para os docs cobertos por docs/prompt-abc.md, a IA deve seguir esse documento e entregar um ABC por vez
* após concluir cada ABC, a IA deve parar e aguardar comando do proprietário do produto para seguir

## 4) Caso de uso atual — E12 Admin Dashboard

### 4.1 Objetivo do caso de uso

Criar a base do Admin Dashboard do LP Factory 10 como a área interna de operação e controle da plataforma, preparada para concentrar acesso administrativo, gestão interna, acompanhamento operacional e entrada para módulos futuros do sistema, começando por uma primeira página com acesso protegido e UI inicial.

#### 4.1.1 O que esse dashboard deve gerenciar

* listar contas e seus status
* visualizar dados essenciais das contas
* centralizar acessos e permissões administrativas
* servir de entrada para gestão interna da plataforma
* dar visibilidade operacional do sistema
* concentrar atalhos para módulos administrativos futuros

### 4.2 Definido, mas ainda não registrado/implementado

* o Admin Dashboard deve reutilizar a mesma base de autenticação do projeto
* o Admin Dashboard não deve nascer com um sistema novo de auth, login, sessão ou usuário
* o Admin deve usar a mesma estrutura base de acesso já usada pelo produto hoje, com Supabase Auth e sessão compartilhada
* o Admin deve ter uma camada própria de autorização para `/admin`, separada do contexto de conta
* o Access Context do Account Dashboard não deve ser reutilizado como fonte principal do Admin Dashboard
* o Admin deve ter guard/contexto administrativo próprio, construído sobre a mesma base de auth atual
* a direção atual é aproveitar a infraestrutura já existente de privilégio administrativo shared do projeto
* o Admin Dashboard pode usar Unified Logs + AI Debugging como apoio operacional de diagnóstico e observabilidade
* o tema de grants/billing pode servir como frente de evolução futura do Admin, mas não deve entrar no primeiro recorte funcional

### 4.3 Ambiguidades / aperfeiçoamento

### 4.4 Propostas abertas

* avaliar uso do Security Controls Dashboard como apoio de governança e revisão operacional de permissões
* avaliar uso do Index Advisor como apoio futuro para performance de listas, tabelas e consultas do Admin
* avaliar uso do Supabase Assistant para apoio futuro em diagnóstico de queries e performance do Admin

### 4.5 Adjacências

## 5) Fluxo do caso

## 6) Esboço / plano base do caso

### 6.1 E12.5.1 — Primeira página do Admin Dashboard: acesso administrativo + header inicial

#### 6.1.1 Objetivo da etapa

* entregar a primeira página real e protegida do `/admin`
* validar a camada própria de autorização do Admin sobre a mesma base de auth/sessão já existente no projeto
* estabelecer a primeira UI mínima do Admin Dashboard, sem abrir módulos administrativos ainda

#### 6.1.2 Documentos canônicos da etapa

* docs/roadmap.md
* docs/base-tecnica.md
* docs/design-system.md
* docs/schema.md

#### 6.1.3 Estado atual que orienta esta etapa

* o roadmap do E12 registra o Admin Dashboard como reinício, ainda sem superfície funcional ativa
* a Base Técnica registra que a infraestrutura shared de privilégio admin permanece ativa via `requirePlatformAdmin()` e `requireSuperAdmin()`
* o Schema registra os helpers admin `is_platform_admin()` e `is_super_admin()` como base já existente no projeto
* na checagem direta do repositório atual, `app/admin/page.tsx` e `app/admin/layout.tsx` não foram encontrados no `main`, então esta etapa deve tratar a primeira página do Admin como superfície a nascer agora

#### 6.1.4 Entrega esperada

* criar a rota inicial do Admin
* proteger o acesso administrativo com redirect do não autenticado e do não autorizado, seguindo a convenção técnica vigente do projeto
* entregar uma primeira UI enxuta, inspirada visualmente na página inicial do Account Dashboard
* exibir no header o nome `LP Factory Administrativo`
* quando autenticado e autorizado, exibir avatar/menu/logout
* manter a área principal vazia ou neutra, sem texto promocional, sem `Criar conta` e sem blocos de módulos neste primeiro recorte

#### 6.1.5 Fora de escopo desta etapa

* operação consultiva ampla
* painel completo de contas e prospects
* relatórios amplos
* jobs
* billing operacional
* módulos administrativos reais
* alterações de BD, migrations, RLS ou novas estruturas SQL

#### 6.1.6 Investigações de repositório que podem ser necessárias

* confirmar o path canônico da nova superfície do Admin no Core
* confirmar se o header deve reutilizar componentes já existentes de layout/menu do projeto ou se deve nascer uma composição mínima própria do Admin
* confirmar o ponto exato de aplicação do guard administrativo no runtime atual
* confirmar os arquivos mínimos a criar ou ajustar para a rota `/admin`, o header e o estado autenticado com avatar/logout

#### 6.1.7 Critérios mínimos de aceite da etapa

* usuário não autenticado não acessa `/admin`
* usuário autenticado sem privilégio admin não acessa `/admin`
* usuário com privilégio admin acessa `/admin`
* a página renderiza o header `LP Factory Administrativo`
* a página renderiza avatar/menu/logout quando aplicável
* a primeira página do Admin fica utilizável como base visual e estrutural para os próximos subcasos

#### 6.1.8 Observação operacional

* esta etapa deve nascer enxuta e servir apenas para validar acesso administrativo e primeira UI, sem antecipar módulos futuros do Admin
