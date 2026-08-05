# Plano-base — E12.5 Diagnóstico e navegação operacional do Admin Dashboard

## 1. Estado e decisões fixas

### 1.1. Identificação

- Recorte: E12.5.
- Objetivo: reorganizar as áreas existentes do Admin Dashboard para tornar visíveis o estado do taxon, os bloqueios e a próxima ação, sem criar uma nova área de prontidão.
- Processo: fluxo direto controlado entre Estrategista, humano e Executor.
- Automação: não.
- Analista: dispensado neste recorte por decisão humana.
- Plano conceitual: wireframe aprovado no debate humano; não versionado neste PR.

### 1.2. Resultado esperado

- Taxonomia funciona como ponto central de diagnóstico por taxon.
- Resoluções de nicho permanece focada na conta e na classificação realizada.
- `/admin/templates` permanece como rota existente, mas a área passa a ser apresentada como `Páginas comerciais`.
- Perfis de orientação diferencia perfil próprio, herdado, rascunho e ausência.
- As páginas de lista e as páginas de detalhe ou gerenciamento recebem ajustes de contexto, diagnóstico, mensagens e navegação.
- As actions, RPCs, contratos de mutação, lifecycle e eventos de negócio existentes permanecem preservados.

### 1.3. Decisões fixas

- Não criar status persistido de prontidão.
- Não criar nova rota, tabela, migration, RPC, policy, job, agente, automação ou chamada de IA.
- Não criar autorização paralela ao entitlement.
- Não reabrir a E12.4.4.
- Não alterar a E19 ou o LP Builder.
- Não implementar barra global de contexto, switcher, favoritos, recentes ou nova área de prontidão.
- O wireframe é referência de hierarquia e clareza, não especificação pixel-perfect.

### 1.4. Updates aplicáveis

- `prod#14` — aplicar reconhecimento imediato do estado, do bloqueio e da próxima ação nas listas, detalhes e testes humanos.
- `prod#16` — aplicar QA visual proporcional em Preview, incluindo desktop, mobile e superfícies de gerenciamento afetadas.
- `prod#17` — usar WCAG 2.2 como baseline de acessibilidade aplicável, com teclado, foco, labels, feedback e estados que não dependam somente de cor, sem declarar conformidade integral.
- `prod#12` — reutilizar somente o princípio de navegação contextual entre taxon, página comercial e perfil; não implementar switcher global, favoritos, recentes ou navegação multi-contas.
- `vercel#15` — usar Vercel Toolbar apenas como apoio opcional ao QA de Preview, sem torná-la dependência ou substituir validação manual.
- `supa#40` — usar ou ajustar snippet SQL read-only somente se a implementação exigir prova das consultas administrativas; o snippet não cria regra de produto nem autoriza banco novo.
- Esses updates funcionam como referências e critérios aplicados. Não autorizam nova dependência, rota, tabela, serviço, integração, automação ou infraestrutura.

## 2. Contrato do caso

### 2.1. Usuário e objetivo operacional

- Usuário principal: `platform_admin`.
- Objetivo: reconhecer rapidamente estado, origem, bloqueio e próxima ação sem interpretar contratos técnicos.

### 2.2. Responsabilidade por área

#### 2.2.1. Taxonomia

- Manter cadastro, hierarquia, aliases e status do taxon.
- Exibir diagnóstico consolidado de pesquisa, página comercial, perfil e assistência por IA.
- Direcionar para as superfícies responsáveis pela próxima ação.
- Não executar geração de página ou gestão do perfil dentro da própria tela de Taxonomia.

#### 2.2.2. Páginas comerciais

- Exibir a elegibilidade específica da página comercial.
- Exibir o lifecycle vigente do artefato comercial.
- Preservar geração, regeneração, preview, publicação e histórico pelos fluxos atuais.
- Não representar prontidão da E19.

#### 2.2.3. Perfis de orientação

- Exibir perfil próprio, herdado, rascunho ou ausência.
- Exibir separadamente a disponibilidade da assistência por IA.
- Preservar o fluxo manual completo e o lifecycle vigente.
- Não representar disponibilidade comercial ou LP materializada.

#### 2.2.4. Resoluções de nicho

- Permanecer focada na conta, entrada, classificação, confiança e revisão.
- Não incorporar colunas de prontidão, página ou perfil.
- Oferecer links contextuais quando houver taxon efetivamente resolvido.

### 2.3. Vocabulário administrativo

#### 2.3.1. Pesquisa `business_buyer`

- Completa — própria.
- Completa — pai direto.
- Incompleta.
- Inválida ou ambígua.
- Indisponível.

#### 2.3.2. Pesquisa `end_customer`

- Completa — própria.
- Incompleta.
- Inválida ou ambígua.
- Indisponível.

#### 2.3.3. Página comercial

- Não elegível.
- Elegível para gerar.
- Em revisão.
- Publicada.
- Indisponível.

#### 2.3.4. Perfil de orientação

- Ativo — próprio.
- Ativo — herdado.
- Rascunho — próprio.
- Ausente.
- Indisponível.

#### 2.3.5. Assistência por IA

- Disponível.
- Indisponível.

## 3. Fluxo operacional

### 3.1. Gatilho

- O administrador abre uma lista ou uma página de detalhe ou gerenciamento do Admin Dashboard.

### 3.2. Entrada

- Taxons e cadeia hierárquica vigentes.
- Pesquisas estruturadas vigentes.
- Artefatos e composição da página comercial.
- Perfis próprios e herdáveis.
- Configuração vigente da assistência por IA.
- Resolução de nicho da conta, quando aplicável.

### 3.3. Processamento

- Reutilizar adapters, contratos, validadores e resolvers existentes.
- Não reimplementar regras da E10.8, da página comercial ou da E20.3 em componentes React.
- Não executar resolver ou consulta sequencialmente para cada linha da lista.
- Leituras de lista devem ser batched ou compostas sem N+1.
- Diagnósticos devem ser calculados server-side.
- Falha ou ambiguidade deve permanecer fail-closed.

### 3.4. Persistência

- Nenhuma persistência nova.
- Nenhum novo status.
- Nenhum snapshot.
- Nenhum recálculo persistido.
- As mutações existentes permanecem nos fluxos atuais.

### 3.5. Consumo

- Badges acompanhados por texto.
- Origem explícita quando própria ou herdada.
- Motivo resumido do bloqueio.
- Próxima ação clara.
- Link para a superfície responsável.

### 3.6. Fallback

- Falha em um domínio não deve inventar estado.
- Exibir `Indisponível` com mensagem segura.
- Preservar as demais informações que puderem ser lidas com segurança.
- Assistência por IA indisponível não bloqueia gestão manual do perfil.
- Falha na leitura administrativa não altera dados.

## 4. Superfícies do recorte

### 4.1. Navegação administrativa

- Alterar o título visual `Templates` para `Páginas comerciais`.
- Preservar a rota `/admin/templates`.
- Corrigir a descrição de Taxonomia, que não é exclusivamente read-only.
- Manter a ordem atual das áreas.
- Não criar item novo de prontidão.

### 4.2. Taxonomia — lista

- Preservar busca, filtros, criação de taxon e acesso ao detalhe.
- Substituir a tabela resumida por:
  - Taxon.
  - Pesquisa BB.
  - Pesquisa EC.
  - Página comercial.
  - Perfil.
  - IA.
  - Ação.
- Na célula do taxon, mostrar nome, nível, pai e status.
- Aliases e demais detalhes cadastrais permanecem no detalhe.
- Usar uma ação principal: `Abrir diagnóstico`.

### 4.3. Taxonomia — detalhe e gerenciamento

- Adicionar seção `Diagnóstico operacional`.
- Exibir pesquisa BB, pesquisa EC, página comercial, perfil e assistência por IA com estado, origem, motivo seguro, próxima ação e link contextual.
- Preservar integralmente:
  - criação e edição do taxon;
  - hierarquia;
  - aliases;
  - exclusão e demais actions atuais;
  - contagens e vínculos existentes.

### 4.4. Páginas comerciais — lista

- Título visual: `Páginas comerciais`.
- Listar taxons ativos elegíveis e não elegíveis.
- Não ocultar taxon incompleto.
- Distinguir elegibilidade comercial do estado da página.
- Usar colunas:
  - Taxon.
  - Elegibilidade.
  - Requisitos.
  - Estado da página.
  - Ação.
- Taxon não elegível usa `Ver pendências` e direciona ao diagnóstico do taxon.
- Taxon elegível abre o fluxo comercial vigente.

### 4.5. Páginas comerciais — detalhe e gerenciamento

- Preservar integralmente:
  - gerar draft;
  - regenerar draft;
  - preview;
  - publicar;
  - histórico;
  - validações de bundle e publicação;
  - actions e RPCs vigentes.
- Permitir apenas ajustes contextuais de título, mensagem, requisito e retorno ao diagnóstico do taxon.
- Não afrouxar a autorização operacional para incluir taxons não elegíveis.

### 4.6. Perfis de orientação — lista

- Diferenciar ativo próprio, ativo herdado, rascunho próprio e ausência.
- Mostrar origem e assistência por IA separadamente.
- Não mostrar `ausente` quando houver perfil herdado válido.
- Ações:
  - Rascunho próprio: `Continuar`.
  - Ativo próprio: `Gerenciar`.
  - Ativo herdado: `Ver perfil`.
  - Ausente: `Criar perfil`.

### 4.7. Perfis de orientação — detalhe e gerenciamento

- Explicitar origem própria ou herdada.
- Explicar indisponibilidade da IA com mensagem segura.
- Indicar que o fluxo manual continua disponível.
- Preservar integralmente:
  - salvar rascunho;
  - aplicar proposta;
  - ativar;
  - arquivar;
  - lifecycle;
  - auditoria;
  - decisão de gaps;
  - contratos da proposta por IA.

### 4.8. Resoluções de nicho

- Preservar lista, filtros, dados e objetivo atuais.
- Transformar o taxon em link quando houver ID válido.
- No detalhe, adicionar bloco compacto:
  - Ver taxon.
  - Ir para página comercial.
  - Ir para perfil.
- Mostrar somente ações cujo taxon esteja efetivamente resolvido e disponível.

## 5. Baseline funcional e prevenção de regressão

### 5.1. Antes do código

O Executor deve registrar no PR uma baseline factual das páginas de gerenciamento:

- Taxonomia:
  - página abre;
  - criar taxon disponível;
  - editar taxon disponível;
  - aliases podem ser adicionados e removidos.
- Páginas comerciais:
  - detalhe elegível abre;
  - gerar ou regenerar draft disponível conforme estado;
  - preview disponível;
  - publicar disponível conforme validação;
  - histórico visível.
- Perfis de orientação:
  - editor abre;
  - salvar rascunho disponível;
  - ativar disponível conforme estado;
  - arquivar disponível conforme estado;
  - fluxo manual funciona sem IA.
- Resoluções de nicho:
  - lista e detalhe abrem;
  - sinais e justificativas atuais permanecem visíveis.

### 5.2. Restrições de implementação

- Não alterar actions, RPCs, migrations, policies ou contratos de mutação.
- Não mudar assinaturas públicas de mutations sem decisão humana explícita.
- Não acoplar o diagnóstico read-only ao sucesso de uma fonte secundária.
- Falha em perfil, pesquisa ou página comercial não deve impedir a página de Taxonomia de abrir quando o taxon principal foi lido com segurança.

### 5.3. Smoke obrigatório após o ajuste

- Criar e editar taxon.
- Adicionar e remover alias.
- Abrir página comercial elegível.
- Gerar ou regenerar draft conforme estado disponível.
- Visualizar preview.
- Publicar quando houver fixture ou estado seguro para teste.
- Abrir editor de perfil.
- Salvar rascunho.
- Ativar e arquivar apenas em ambiente e estado de teste apropriados.
- Confirmar que o editor manual funciona com IA indisponível.
- Confirmar que Resoluções mantém dados e filtros atuais.

Se uma ação destrutiva ou persistente não puder ser executada com segurança no ambiente, registrar a limitação e validar o caminho por evidência existente e inspeção, sem afirmar aprovação integral.

## 6. Controle de complexidade e inflação de código

### 6.1. Regra central

- Substituir comportamento antigo; não sobrepor uma segunda camada.
- Toda adição material deve reutilizar algo existente, substituir código existente ou justificar comportamento novo comprovável.

### 6.2. Arquivos novos

- Expectativa de novos arquivos produtivos: zero.
- Antes de criar qualquer arquivo produtivo, o Executor deve parar e justificar ao Estrategista:
  - responsabilidade;
  - consumidores reais;
  - duplicação eliminada;
  - motivo de não caber em arquivo existente.

### 6.3. Proibições

- Não criar domínio, resolver ou adapter denominado `readiness`, `prontidao` ou equivalente.
- Não criar enum paralelo para estados já existentes.
- Não duplicar regras em Taxonomia, Páginas comerciais e Perfis.
- Não criar helper genérico com um único consumidor.
- Não criar componente que apenas envolva outro sem comportamento próprio.
- Não executar resolver por linha em sequência.
- Não fazer refatoração ampla.
- Não rodar formatação global.
- Não reformatar arquivos sem alteração funcional.
- Não adicionar comentários que apenas repitam o código.

### 6.4. Remoções obrigatórias

Quando substituídos, remover no mesmo PR:

- filtro que elimina taxons não elegíveis da lista comercial;
- labels e descrições superadas;
- estados ou mapeamentos duplicados;
- branches condicionais sem consumidor;
- imports, exports e tipos mortos;
- helpers substituídos;
- código de apresentação que deixou de ter efeito.

### 6.5. Relatório de delta

Antes da implementação, registrar:

- arquivos candidatos;
- responsabilidades reutilizadas;
- caminhos a substituir;
- remoções esperadas;
- risco de N+1;
- novos arquivos esperados.

Na entrega, registrar:

- `git diff --stat`;
- `git diff --numstat`;
- adições e remoções por arquivo;
- crescimento líquido do código produtivo;
- linhas de testes separadas;
- linhas documentais separadas;
- arquivos novos e removidos;
- funções, tipos e caminhos antigos eliminados;
- justificativa de todo crescimento material;
- confirmação de ausência de N+1 e de regra duplicada.

## 7. Fase executável

### 7.1. E12.5.3 — Diagnóstico e navegação operacional do Admin Dashboard

- Automação: não.
- Executar como uma única fase técnica.
- Usar uma única branch e um único PR draft.
- Implementar em unidades pequenas e validar cada superfície antes de avançar:
  - Navegação.
  - Taxonomia.
  - Páginas comerciais.
  - Perfis de orientação.
  - Resoluções de nicho.
- Integrar validação e fechamento documental à mesma fase.

### 7.2. Ordem de execução

- Atualizar a base e confirmar branch.
- Ler este plano-base e as fontes obrigatórias.
- Registrar baseline funcional e baseline de complexidade.
- Ajustar projeções server-side.
- Ajustar navegação.
- Ajustar Taxonomia e validar suas ações existentes.
- Ajustar Páginas comerciais e validar seu gerenciamento.
- Ajustar Perfis e validar seu gerenciamento.
- Ajustar links mínimos de Resoluções e validar leitura atual.
- Executar checks e QA visual.
- Remover código obsoleto causado pelo ajuste.
- Executar fechamento documental pelo Prompt ABC.
- Revisar delta final e publicar evidências.

## 8. Arquivos candidatos

### 8.1. Principais

- `components/admin/adminNavigation.ts`.
- `app/admin/(protected)/taxonomia/page.tsx`.
- `app/admin/(protected)/taxonomia/[taxonId]/page.tsx`.
- `lib/admin/adapters/adminTaxonomyAdapter.ts`.
- `lib/admin/adapters/adminReadOnlyTypes.ts`.
- `app/admin/(protected)/templates/page.tsx`.
- `lib/admin/adapters/adminCommercialActivationTemplatesAdapter.ts`.
- `app/admin/(protected)/perfis-de-orientacao/page.tsx`.
- `app/admin/(protected)/perfis-de-orientacao/[taxonId]/page.tsx`.
- `lib/conversion-content/adapters/landingPageGenerationProfileAdminAdapter.ts`.
- `app/admin/(protected)/resolucoes-de-nicho/page.tsx`.
- `app/admin/(protected)/resolucoes-de-nicho/[accountId]/page.tsx`.
- `lib/admin/adapters/adminNicheResolutionsAdapter.ts`.

### 8.2. Condicionais

- Contratos ou helpers internos da E10.8, somente se necessário para expor resumo exato sem duplicar regras.
- Componentes administrativos existentes, somente quando a reutilização reduzir repetição real.
- Testes ou casos executáveis vigentes relacionados às superfícies alteradas.

### 8.3. Não autorizados

- `app/lp-builder/`.
- `lib/lp-builder/`.
- `supabase/migrations/`.
- `supabase/rollbacks/`.
- RLS, policies, RPCs, triggers ou schema.
- Novo diretório de domínio.
- Nova rota administrativa.

## 9. Critérios de aceite

### 9.1. Funcionais

- Taxonomia mostra estados de pesquisa, página, perfil e IA.
- BB própria e BB herdada aparecem distintas.
- EC nunca aparece herdada.
- Páginas comerciais mostra taxons elegíveis e não elegíveis.
- Perfil herdado não aparece como ausente.
- Assistência por IA não é confundida com gestão manual.
- Resoluções permanece focada na conta.
- Links contextuais preservam o taxon correto.
- Nenhuma action existente de Taxonomia, Página comercial ou Perfil sofre regressão.

### 9.2. Falhas

- Erro de um domínio aparece como `Indisponível`.
- Motivos internos não são expostos integralmente.
- Estado aproximado não é apresentado como fato.
- Fluxos de mutação permanecem fail-closed.

### 9.3. Acessibilidade e UX

- Estado não depende somente de cor.
- Foco visível.
- Operação por teclado.
- Labels e links descritivos.
- Tabelas com cabeçalhos corretos.
- Feedback compreensível.
- Desktop e mobile utilizáveis.
- Não declarar conformidade WCAG integral.

## 10. Validação

### 10.1. Técnica

- `npm ci`.
- `npm run check`.
- `git diff --check`.
- Validadores específicos existentes e aplicáveis ao perfil, pesquisa ou página comercial.
- Não inventar comando ausente do `package.json`.
- Não executar `npm run build` no sandbox.

### 10.2. QA em Preview

Validar pelo menos:

- segmento com BB e EC próprias completas;
- nicho com BB própria;
- nicho com BB herdada do pai direto;
- EC incompleta;
- pesquisa inválida ou ambígua;
- página não elegível;
- página elegível sem artefato;
- página em revisão;
- página publicada;
- perfil ativo próprio;
- perfil ativo herdado;
- perfil ausente;
- rascunho próprio;
- IA disponível;
- IA indisponível com fluxo manual disponível;
- Resolução com taxon selecionado;
- desktop;
- mobile;
- teclado e foco.

### 10.3. Evidência

- Screenshots das quatro áreas.
- Passos executados.
- Resultado observado.
- Limitações do ambiente.
- Erros de console relevantes.
- HEAD exato do Preview validado.

## 11. Documentação e evolução do plano

### 11.1. Documento vivo

- Este plano permanece no mesmo PR da implementação.
- O Executor pode ajustar o plano somente quando a investigação ou a implementação revelar informação factual nova dentro do escopo aprovado.
- Ajustes conceituais, de objetivo, arquitetura, banco, rota, segurança ou comportamento de produto devem voltar ao Estrategista antes da edição.
- Atualizações documentais durante a implementação devem seguir o Prompt ABC.

### 11.2. Fechamento pelo Prompt ABC

Avaliar e atualizar somente quando materialmente necessário:

- `docs/roadmap.md`.
- `docs/design-system.md`, apenas se surgir padrão visual reutilizável novo.
- outro documento canônico materialmente afetado, somente dentro do escopo aprovado.

Não alterar:

- documentos da E19;
- `docs/lp-planejamento.md`, salvo mudança conceitual real;
- lousa da E12.4 para registrar este novo recorte.

## 12. Escopo negativo e critérios de parada

### 12.1. Fora do escopo

- Prontidão persistida.
- E12.4.4.
- E19.
- LP Builder.
- Geração de LP.
- Disponibilidade comercial por taxon e plano.
- Entitlements.
- Banco.
- Nova chamada de IA.
- Novo modelo.
- Tracking ou analytics.
- Paginação nova.
- Switcher global.
- Breadcrumb global.
- Favoritos ou recentes.
- Redesign geral do Admin.

### 12.2. Parar e devolver ao Estrategista se

- a solução exigir nova rota;
- a solução exigir banco ou migration;
- a resolução exata de pesquisa exigir duplicação das regras da E10.8;
- a listagem exigir chamadas sequenciais por taxon;
- a solução exigir novo domínio compartilhado;
- surgir mudança de entitlement ou segurança;
- o wireframe conflitar com o contrato real;
- o escopo ultrapassar as quatro áreas aprovadas;
- for necessário alterar E19 ou reabrir E12.4.4;
- for necessário alterar actions, RPCs ou contratos de mutação para entregar o diagnóstico.

## 13. Próxima ação

- Humano revisa e aprova este plano no PR draft.
- Depois da aprovação, o Codex usa a mesma branch e o mesmo PR para investigação, implementação, validação, relatório de delta e fechamento documental.
- O PR permanece draft até revisão final do Estrategista e gate humano.
- Merge permanece exclusivamente humano.