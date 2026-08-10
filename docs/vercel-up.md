# LP Factory 10 — Vercel + Next.js Update

---

## Convenção de leitura do catálogo ativo

- O heading/badge de cada item representa o estado do recurso no mercado/plataforma Vercel, Next.js ou React, quando aplicável.
- Este documento não é histórico completo de updates da Vercel, Next.js ou React.
- O documento mantém o catálogo ativo e registros históricos compactos necessários à rastreabilidade do projeto.
- Todo ID publicado permanece localizável; IDs absorvidos, implementados, duplicados, deprecados, superados ou redundantes não são apagados nem reutilizados.

---

## Convenção de referência

O identificador canônico dos itens deste catálogo é `vercel#n`.

Esse identificador deve ser usado no roadmap, Base Técnica, briefings, relatórios e referências cruzadas. A numeração não deve ser reutilizada após remoção, depreciação ou substituição de um item.

## Critério do catálogo ativo

Este documento deve manter apenas recursos Vercel, Next.js ou React que ainda possam ser aproveitados pelo Gestor de Updates em algum caso atual, futuro ou condicional.

Itens já implementados globalmente, absorvidos pela Base Técnica, superados, duplicados, deprecados ou redundantes podem sair do catálogo ativo, mas permanecem como registro histórico com estado final, evidências, recortes e eventual substituto.

Recursos pagos, enterprise ou futuros podem permanecer quando ainda tiverem aproveitamento possível em algum caso específico.

A rejeição ou adoção de cada recurso deve ser decidida caso a caso pelo Gestor de Updates, conforme o plano-base avaliado.

## 1 — Vercel AI Cloud *(🟨 Disponibilidade por recurso/plano)*
2025-06-30
Atualizado em 2026-07-31

### Status no Projeto
- Status: Não implementado
- Evidência: `docs/roadmap.md` cita AI Gateway como referência futura, enquanto `docs/platform-config.md` registra uso direto da OpenAI Responses API; não há AI Gateway, Sandbox ou BotID no runtime atual.
- Observação: monitoramento de mercado; disponibilidade e cobrança variam por recurso/plano.

### Descrição
Conjunto de capacidades de plataforma avaliadas separadamente:
- **AI Gateway:** endpoint unificado para acessar múltiplos modelos, acompanhar uso e orçamento, aplicar regras de roteamento e fallbacks.
- **Fluid Compute:** execução de Functions otimizada para concorrência e workloads com espera de I/O, com cobrança que distingue CPU ativa do tempo de espera/memória.
- **Sandbox:** ambientes Linux efêmeros e isolados para executar código não confiável, scripts gerados por agentes, testes e servidores temporários.
- **BotID:** proteção contra bots para rotas sensíveis, com validação client-side e verificação server-side.

Na varredura oficial, o AI Gateway ganhou uma página própria de logs com custo, tokens, duração, região, rota e tentativas de fallback por requisição. Também passou a oferecer limites de gasto por equipe, projeto e chave, com alertas e bloqueio ao atingir o orçamento. O suporte a WebSocket para a OpenAI Responses API promete ganho em fluxos longos com muitas tool calls, mas isso não demonstra superioridade para os fluxos lineares atuais do LP Factory 10.

O Sandbox deixou de cobrar Data Transfer por downloads usados para instalar pacotes, clonar repositórios ou obter artefatos em 17/07/2026. Tráfego em portas expostas ou enviado pelo Sandbox, CPU ativa, memória, snapshots e criações continuam sujeitos à cobrança aplicável.

Em 05/08/2026, as cotas padrão de times Pro e Enterprise passaram a suportar até 10.000 sandboxes concorrentes e uma taxa dinâmica de alocação que começa em 150 vCPUs por minuto e pode crescer até 5.000 vCPUs por minuto. A escala disponível não altera o gatilho do projeto: sem workload aprovado, custo medido e necessidade de isolamento, não há razão para adotar Sandbox.

### Valor para o Projeto
- AI Gateway pode concentrar observabilidade e fallback quando houver uso real de múltiplos provedores ou volume de requisições que justifique nova camada.
- Sandbox e BotID podem apoiar execução isolada e proteção de endpoints quando existir caso aprovado.
- Fluid Compute é capacidade da plataforma; não exige criar arquitetura Edge paralela.

### Valor para o Usuário
- Benefícios potenciais de resiliência, segurança e desempenho dependem de aplicação concreta e validada.

### Limites no MVP
- Não substituir a OpenAI Responses API direta apenas para obter dashboard ou WebSocket.
- Não introduzir múltiplos provedores, execução de código não confiável ou proteção anti-bot sem caso real.
- Tratar custos, retenção de dados, região e credenciais como critérios de decisão.

### Gatilho de aplicação
Avaliar AI Gateway quando houver pelo menos um destes sinais: necessidade comprovada de fallback entre provedores, orçamento/observabilidade centralizados que a integração direta não atende, ou workflow agente com muitas tool calls cujo ganho de latência seja medido. Avaliar Sandbox e BotID somente em casos próprios de execução não confiável ou abuso automatizado.

### Ações Recomendadas
1. Manter AI Gateway, Sandbox e BotID sem adoção enquanto não houver caso e métrica aprovados.
2. Confirmar plano, custos, dados, segurança e benefício mensurável antes de qualquer implementação.
3. Não transformar essas capacidades em requisito da primeira entrega da E10.6.

### Fontes Oficiais
- [AI Gateway logs now have a dedicated page](https://vercel.com/changelog/ai-gateway-logs)
- [AI Gateway now supports team and project spend budgets](https://vercel.com/changelog/ai-gateway-spend-budgets-and-alerts)
- [AI Gateway WebSocket support for OpenAI Responses API](https://vercel.com/changelog/ai-gateway-websocket-support-for-openai-responses-api)
- [Vercel Sandbox removes charges for package installation traffic](https://vercel.com/changelog/vercel-sandbox-removes-charges-for-package-installation-traffic)
- [Vercel Sandbox now supports 10,000 concurrent sandboxes and 5,000 vCPUs per minute](https://vercel.com/changelog/vercel-sandbox-now-supports-10-000-concurrent-sandboxes-and-5-000-vcpus-per-minute)

---

## 3 — Cache Components *(🟩 Estável — opt-in no Next.js 16)*
2025-10-22

### Status no Projeto
- Status: Não implementado
- Evidência: ausência de adoção explícita no roadmap e na configuração corrente do projeto; item mantido como monitoramento técnico.

### Descrição
Recurso oficial do Next.js 16 para controle de cache por componentes, com adoção opt-in.

### Valor para o Projeto
- Permite granularidade maior entre blocos estáticos e dinâmicos quando houver necessidade.

### Valor para o Usuário
- Pode melhorar latência e consistência de renderização em páginas com partes reutilizáveis.

### Ações Recomendadas
1. Avaliar somente em casos com benefício claro de performance.
2. Medir impacto em Web Vitals antes de qualquer adoção ampliada.

---


## 4 — Turbopack *(✅ Incorporado pelo Next.js 16)*

2025-10-22  
Atualizado em 2026-08-04

### Estado e rastreabilidade

- Estado: implementado globalmente pelo framework e absorvido pela Base Técnica.
- Evidência: `docs/base-tecnica.md` orienta preferir os defaults do Next.js, incluindo Turbopack quando aplicável; o projeto está em Next.js 16 e não registra configuração Webpack substituta como caminho canônico.
- Recortes: stack global do Core e builds/previews atuais.
- Escopo remanescente: somente investigar configuração ou fallback se surgir incompatibilidade mensurável.
- O ID permanece histórico e não pode ser reutilizado.

### Fonte Oficial

- [Next.js 16](https://nextjs.org/blog/next-16)

---

## 6 — DevTools MCP *(🟩 Disponível no ecossistema Next.js 16+)*
2025-10-22

### Status no Projeto
- Status: Não implementado
- Evidência: inexistência de configuração/adoção explícita no repositório atual (sem registro de uso operacional no roadmap/base técnica).

### Descrição
Integração MCP do Next.js para conectar agentes ao servidor de desenvolvimento e permitir acesso a erros de build, runtime e tipos, logs do navegador/servidor, metadados de projeto e páginas, rotas, componentes, Server Actions e informações de runtime em tempo real.

### Valor para o Projeto
- Pode acelerar diagnóstico técnico e dar mais contexto aos agentes durante o desenvolvimento.
- É uma avaliação futura de produtividade técnica, não uma feature de produto.

### Valor para o Usuário
- Indiretamente reduz tempo de resolução de incidentes.

### Ações Recomendadas
1. Avaliar adoção somente quando houver demanda clara de produtividade de engenharia.
2. Formalizar padrão de uso no projeto antes de habilitar em rotina.

---

## 8 — APIs de Cache refinadas *(🟩 Estável no framework)*
2025-10-22

### Status no Projeto
- Status: Não implementado
- Evidência: não há integração explícita no projeto para fluxo com `updateTag()`/`revalidateTag()` como padrão operacional.

### Descrição
APIs do framework para invalidação de cache por tag. `revalidateTag()` deve receber um profile como `"max"` ou `"stale"`, conforme a política desejada; a chamada sem segundo argumento usa o comportamento legado de expiração imediata e está deprecada. `updateTag()` invalida imediatamente para cenários de read-your-own-writes e só pode ser usado em Server Actions.

### Valor para o Projeto
- Possibilita atualização pontual de dados sem estratégia global de rebuild, desde que exista cache real e uma política de consistência definida.

### Valor para o Usuário
- Pode melhorar frescor de dados em áreas com atualização frequente.

### Ações Recomendadas
1. Manter sem adoção no projeto até existir cache real que justifique invalidação por tag.
2. Ao adotar, escolher explicitamente o profile de `revalidateTag()` e reservar `updateTag()` a Server Actions que exijam atualização imediata.
3. Não introduzir cache dinâmico na primeira entrega da E10.6.

---

## 9 — Modelo oficial de Proxy (`proxy.ts`) *(🟩 Estável — convenção de migração)*
2025-10-22

### Status no Projeto
- Status: Não implementado
- Evidência: o repositório mantém `middleware.ts` ativo; não há migração para `proxy.ts` registrada.

### Descrição
No ciclo atual do Next.js, `middleware.ts` foi substituído/deprecado em favor de `proxy.ts` como convenção oficial, com runtime Node.js como padrão para o Proxy.

### Valor para o Projeto
- Direção de migração mais clara e alinhada à documentação oficial do framework.

### Valor para o Usuário
- Pode trazer previsibilidade operacional ao fluxo de interceptação de rotas.

### Ações Recomendadas
1. Registrar migração como item técnico futuro, sem adoção imediata.
2. Preservar estabilidade do fluxo atual enquanto não houver justificativa de mudança.

---

## 11 — Server-side Tracking API (`@vercel/analytics/server`) *(🟩 Estável no ecossistema Vercel)*
2025-10-30

### Status no Projeto
- Status: Não implementado
- Evidência: roadmap/base técnica registram tracking interno em planejamento, sem adoção explícita de `@vercel/analytics/server` no projeto.
- Observação: custom events server-side estão disponíveis em planos Pro/Enterprise.

### Descrição
Capacidade de envio de eventos customizados server-side via `@vercel/analytics/server`, sem depender apenas de eventos client-side. Requer `@vercel/analytics >= 1.1.0`; em deploy protegido, a requisição de tracking pode exigir `VERCEL_AUTOMATION_BYPASS_SECRET` ou configuração equivalente de bypass para alcançar o endpoint de coleta.

### Valor para o Projeto
- Pode melhorar confiabilidade de telemetria em fluxos sensíveis.

### Valor para o Usuário
- Melhora indireta na qualidade de produto por decisões guiadas por eventos mais consistentes.

### Ações Recomendadas
1. Não adotar na primeira entrega da E10.6.
2. Antes de implementar, confirmar plano Pro/Enterprise, versão do pacote, proteção do deploy e estratégia única de tracking.
3. Evitar pressupor integração nativa pronta com APIs de Ads sem fonte oficial específica.

---

## 15 — Vercel Toolbar *(🟩 Disponível na plataforma)*
2026-06-12

### Status no Projeto
- Status: Não implementado
- Evidência: não há configuração ou registro local que comprove adoção operacional no LP Factory 10.
- Observação: avaliar como hub técnico/operacional de Preview, sem tratá-lo como feature do produto.

### Descrição
Hub de inspeção e colaboração em deployments que centraliza Comments, Accessibility Audit Tool, Interaction Timing Tool, Layout Shift Tool, Flags Explorer e outras ferramentas de navegação e revisão.

### Valor para o Projeto
- Reúne validações de Preview no contexto da página e reduz a dispersão entre feedback, inspeção e dashboard.

### Valor para o Usuário
- Contribui indiretamente para páginas mais claras, acessíveis, estáveis e responsivas antes da publicação.

### Ações Recomendadas
1. Avaliar após existir o primeiro Preview funcional da E10.6.
2. Usar como prática operacional, sem criar nova infraestrutura.

---

## 20 — Vercel Flags / Flags SDK / Flags Explorer *(🟨 Avaliação futura)*
2026-06-12

### Status no Projeto
- Status: Não implementado
- Evidência: não há flags, SDK, provider ou configuração do Flags Explorer registrados como adoção no LP Factory 10.
- Observação: recurso futuro; não recomenda A/B ativo na primeira entrega da E10.6.

### Descrição
Conjunto para definir e avaliar flags em código, aplicar targeting, segmentos e splits, controlar rollouts e testar overrides no navegador pelo Flags Explorer. O Explorer está disponível nos planos da plataforma, mas o uso sem assinatura adicional é limitado a 150 aplicações de overrides por mês; overrides ilimitados custam US$ 250/mês em Pro/Enterprise. O Vercel Flags e o Flags Explorer possuem limites e custos que devem ser confirmados na documentação oficial e no plano vigente antes de adoção.

Observação de varredura oficial: Vercel Flags segments podem ser gerenciados pela Vercel CLI via `vercel flags segments`, o que pode apoiar pipelines, CI, workflows locais ou agent-driven pipelines quando houver governança real de flags.

### Valor para o Projeto
- Pode apoiar rollouts controlados, inspeção de estados e experimentos futuros quando houver hipótese, governança e medição aprovadas.

### Valor para o Usuário
- Pode reduzir risco de lançamentos futuros ao permitir exposição gradual e segmentada.

### Ações Recomendadas
1. Manter como avaliação futura e separar decisão de provider, SDK, Flags Explorer e experimentação.
2. Antes de adotar, validar limites, custos, targeting, privacidade, estratégia de medição e processo de remoção de flags.
3. Não implementar A/B, splits ou infraestrutura de flags na primeira entrega da E10.6.

---

## 21 — Vercel Private Blob *(🟩 GA)*

2026-06-30
Atualizado em 2026-07-14

### Status no Projeto

- Status: Não implementado
- Evidência: não há `@vercel/blob` no `package.json`; o stack já usa Supabase e não registra Vercel Blob como storage.

### Descrição

Storage privado da Vercel para arquivos sensíveis, com controle de acesso, Signed URLs e autenticação OIDC.

Desde julho de 2026, leituras de objetos privados podem solicitar consistência explícita com `useCache: false` em `get()` ou `presignUrl()`. O bypass é útil após sobrescrever um pathname existente, quando a leitura padrão pode retornar a versão em cache por até 60 segundos.

### Valor para o Projeto

- Pode ser aproveitado em casos futuros de arquivos privados, exportações, relatórios, anexos, documentos internos, invoices ou memória de agentes.
- Pode reduzir necessidade de expor arquivos sensíveis por URLs públicas.
- OIDC reduz dependência de tokens estáticos em alguns fluxos.
- A leitura consistente pode evitar conteúdo antigo em relatórios, memória de agentes ou arquivos substituídos no mesmo pathname.

### Valor para o Usuário

- Acesso mais seguro a arquivos privados quando houver necessidade real no produto.

### Limites no MVP

- `useCache: false` ignora o CDN, pode aumentar a latência e gera Fast Origin Transfer.
- O recurso exige `@vercel/blob` compatível; a publicação oficial indica a versão `2.6.1`.
- Não adotar Vercel Blob ou criar storage novo apenas para obter leitura consistente.

### Ações Recomendadas

1. Manter como recurso aproveitável por caso.
2. Não adotar no MVP sem caso concreto de arquivo privado.
3. Antes de adotar, comparar com Supabase Storage em segurança, signed URLs, OIDC, custo, egress, consistência e manutenção.
4. Adotar somente se houver requisito que o storage vigente não atenda ou superioridade mensurável no caso concreto; registrar plano de reversão.
5. Se houver sobrescrita no mesmo pathname e exigência real de leitura imediata, avaliar `useCache: false` com custo e latência medidos.

### Fonte Oficial

- [Vercel Blob now supports consistent reads on private storage](https://vercel.com/changelog/vercel-blob-now-supports-consistent-reads-on-private-storage)

---

## 22 — Vercel CLI Dry-run Deployments *(🟩 Disponível via CLI)*

2026-07-01

### Status no Projeto

- Status: Não implementado
- Evidência: sem adoção registrada em workflow ou Base Técnica; recurso identificado em varredura web oficial da Vercel.

### Descrição

Comando de dry-run no Vercel CLI para pré-visualizar preset de framework, arquivos incluídos/ignorados, tamanhos e manifesto JSON antes de criar um deployment.

### Valor para o Projeto

- Pode apoiar QA técnico antes de deploy.
- Pode ajudar Codex/agentes a identificar arquivos inesperados, assets grandes, problemas de `.vercelignore` ou configuração incorreta.
- Pode reduzir risco de deploy com pacote errado sem criar nova infraestrutura.

### Valor para o Usuário

- Reduz risco indireto de falhas em preview ou produção causadas por deploy mal empacotado.

### Ações Recomendadas

1. Avaliar como check manual ou auxiliar em casos de deploy suspeito.
2. Não transformar em job obrigatório sem decisão humana.
3. Se adotado futuramente, registrar na Base Técnica ou workflow correspondente.

---

## 23 — Vercel Services e Service Bindings *(🧪 Beta)*

2026-06-30
Atualizado em 2026-07-01

### Status no Projeto

- Status: Não implementado como Vercel Services
- Evidência: `docs/platform-config.md`, `docs/services.md` e `services/mcp-supabase-inspect/README.md` registram dois projetos Vercel independentes: o Core `lp-factory-10` e o service `lpf-10-services`, com Root Directory e endpoint público próprios. Não há configuração `services`/bindings no mesmo projeto ou deployment.
- Observação: a existência do service dedicado invalida a evidência antiga de “ausência de arquitetura multi-service”, mas não equivale à adoção do recurso Vercel Services.

### Descrição

Vercel Services permite construir e implantar múltiplos serviços no mesmo projeto, com deployment, preview, rollback e domínio compartilhados. Service Bindings injetam uma URL interna para comunicação privada entre serviços do mesmo deployment, com roteamento, autenticação e TLS gerenciados pela Vercel.

### Valor para o Projeto

- Poderia substituir a separação atual entre projetos apenas se a operação conjunta trouxer vantagem concreta em deploy, rollback, preview ou comunicação privada.
- O binding pode evitar tráfego público quando Core e MCP precisarem conversar no mesmo deployment.
- Não justifica consolidar projetos nem alterar a boundary operacional já documentada.

### Valor para o Usuário

- Pode melhorar segurança e previsibilidade operacional se uma consolidação futura for comprovadamente superior.

### Limites no MVP

- Recurso em beta.
- A configuração atual preserva isolamento, deploy e endpoint próprios para o MCP read-only.
- Uma consolidação afetaria boundary de deploy, variáveis, autenticação, roteamento, blast radius e rollback; exige recorte técnico próprio.

### Gatilho de aplicação

Comparar com os dois projetos atuais somente quando existir consumo Core → service que precise de rede privada, ou quando deploy/preview/rollback separados causarem problema mensurável. Adotar apenas se o ganho superar o isolamento e a simplicidade operacional vigentes, com plano de reversão validado.

### Ações Recomendadas

1. Manter como alternativa condicional, sem alterar a topologia atual.
2. Se o gatilho ocorrer, comparar latência, segurança, custo, blast radius e rollback entre projetos separados e Vercel Services.
3. Não propor backend novo ou consolidação apenas pela disponibilidade do recurso.

### Fontes Oficiais

- [Run multiple frameworks in one project with Vercel Services](https://vercel.com/changelog/run-multiple-frameworks-in-one-project-with-vercel-services)
- [Secure internal communication between services](https://vercel.com/changelog/secure-internal-communication-between-services)

---

## 24 — Vercel Security Dashboard *(🧪 Private beta)*

2026-07-01

### Status no Projeto

- Status: Não implementado
- Evidência: recurso em private beta; sem adoção registrada no projeto.

### Descrição

Dashboard de segurança da Vercel para agregar postura de segurança por conta e projeto, incluindo achados como ausência de 2FA, previews públicos e credenciais long-lived.

### Valor para o Projeto

- Pode apoiar governança futura de segurança da plataforma.
- Útil para auditoria operacional quando estiver disponível ao projeto.
- Não é feature de produto.

### Valor para o Usuário

- Benefício indireto por redução de risco operacional e segurança de plataforma.

### Ações Recomendadas

1. Manter como monitoramento.
2. Não bloquear entregas por este recurso enquanto estiver em private beta.
3. Avaliar adoção quando houver disponibilidade real na conta/projeto.

---

## 25 — Vercel Agent *(🧪 Public beta)*

2026-06-30

### Status no Projeto

- Status: Não implementado
- Evidência: sem adoção operacional registrada no LP Factory 10.

### Descrição

Agente da Vercel no dashboard para responder perguntas sobre projetos, investigar falhas de produção, analisar deploys/logs/métricas/configurações e executar ações aprovadas, como abrir PR, rollback ou ajuste de configuração.

### Valor para o Projeto

- Pode apoiar diagnóstico operacional futuro em Vercel.
- Pode reduzir tempo de investigação em falhas de deploy, runtime ou custo.
- Não substitui Codex, GitHub, Gestor Estrutural nem regras do repositório.

### Valor para o Usuário

- Benefício indireto por menor tempo de diagnóstico e correção de incidentes.

### Ações Recomendadas

1. Manter como avaliação futura.
2. Não habilitar ações aprovadas ou automações sem decisão humana explícita.
3. Não transformar em agente operacional do LP Factory 10 sem plano próprio e fonte real do projeto.

---

## 26 — Runtime Logs com Cache Reasons *(🟩 Disponível na plataforma)*

2026-07-17

### Status no Projeto

- Status: Não implementado — diagnóstico condicional a rotas cacheáveis
- Evidência: o repositório não adota Cache Components, ISR ou política explícita de cache por tag; `docs/base-tecnica.md` exige rotas com sessão/cookies dinâmicas.

### Descrição

Os Runtime Logs da Vercel exibem o motivo associado ao estado de cache de respostas cacheáveis, como revalidação por tempo ou tag, erro de revalidação, Draft Mode, crawler, cold miss ou request collapsed. O motivo também pode ser consultado pela Vercel CLI e agregado em métricas.

### Valor para o Projeto

- Permite distinguir configuração esperada, invalidação e falha de revalidação quando uma rota futura não obtiver cache hit.
- Complementa `vercel#3` e `vercel#8` sem exigir nova estratégia de cache.
- Pode reduzir investigação baseada apenas em hipótese quando houver problema real de CDN, ISR ou revalidação.

### Valor para o Usuário

- Benefício indireto por diagnósticos mais rápidos de performance e conteúdo desatualizado.

### Limites no MVP

- Não introduzir Cache Components, ISR, `Cache-Control`, `revalidateTag()` ou `updateTag()` apenas para usar o diagnóstico.
- Não aplicar cache compartilhado a rotas dependentes de sessão ou cookies.
- Usar somente quando existir resposta cacheável e incidente, custo ou hipótese de performance concretos.

### Ações Recomendadas

1. Manter como ferramenta diagnóstica condicional.
2. Quando houver cache explícito, consultar o Cache Reason antes de alterar intervalos ou invalidação.
3. Preservar as regras de cache e sessão de `docs/base-tecnica.md`.

### Fonte Oficial

- [Runtime logs now show cache reasons](https://vercel.com/changelog/runtime-logs-now-show-cache-reasons)

---

## 27 — Next.js July 2026 Security Release *(✅ Correção aplicada)*

2026-07-20  
Atualizado em 2026-08-04

### Estado e rastreabilidade

- Estado: concluído; versão corrigida incorporada.
- Evidência: `package.json` e `package-lock.json` fixam `next` e `eslint-config-next` em `16.2.11`, versão corrigida indicada pela fonte oficial.
- Recortes: atualização técnica do Core; matrizes E11, E11.2 e E12.4 preservam a decisão de não reabrir dependências quando o requisito já está satisfeito.
- Limite: o registro comprova a correção desta rodada de segurança, não dispensa futuras atualizações ou validações.
- O ID permanece histórico e não pode ser reutilizado.

### Fonte Oficial

- [Next.js — July 2026 Security Release](https://nextjs.org/blog/july-2026-security-release)

---

## 28 — `mcp-handler` 2.0 e MCP 2026-07-28 *(🟨 Avaliação condicional)*

2026-07-30

### Status no Projeto

- Status: Não implementado
- Evidência: `services/mcp-supabase-inspect/api/mcp.js` implementa manualmente o protocolo `2025-06-18`; `services/mcp-supabase-inspect/package.json` depende apenas de `pg` e não usa `mcp-handler` nem o MCP TypeScript SDK.
- Observação: o service atual possui autenticação Bearer, limites de payload, conexão read-only e contrato operacional próprios que precisam ser preservados em qualquer avaliação.

### Descrição

O `mcp-handler@2` passou a suportar o protocolo MCP `2026-07-28`, o SDK TypeScript v2 e clientes Streamable HTTP de 2025 no mesmo endpoint, sem Redis ou armazenamento de sessão. A major exige Node.js 20+, Zod 4 e novas APIs de registro; o transporte HTTP+SSE legado foi removido.

### Valor para o Projeto

- Pode reduzir código de protocolo mantido manualmente no LPF Supabase Inspect MCP.
- Pode ampliar compatibilidade com clientes novos sem quebrar clientes Streamable HTTP anteriores.
- O projeto já atende aos pré-requisitos de Node 22 no service; Zod 4 existe no Core, mas não no pacote isolado do service.

### Valor para o Usuário

- Benefício indireto por maior compatibilidade e menor risco de manutenção do endpoint MCP.

### Limites no MVP

- Não migrar apenas por existir uma versão nova do protocolo.
- Não presumir equivalência da autenticação, dos limites de payload ou do comportamento read-only.
- A mudança seria de runtime e dependências do service; exige testes de contrato e compatibilidade em recorte próprio.

### Gatilho de aplicação

Avaliar quando um cliente necessário exigir o protocolo `2026-07-28`, ou quando a manutenção do handler manual gerar falha ou custo recorrente. Adotar somente se um protótipo preservar autenticação, tools, limites, respostas, `Cache-Control: no-store` e compatibilidade dos consumidores atuais.

### Ações Recomendadas

1. Manter como opção condicional do service existente.
2. Em avaliação futura, comparar handler manual e `mcp-handler@2` com testes de contrato no mesmo conjunto de requests MCP.
3. Não alterar o endpoint ou o protocolo de produção sem validação de clientes e plano de reversão.

### Fonte Oficial

- [Latest MCP spec now supported in mcp-handler](https://vercel.com/changelog/latest-mcp-spec-now-supported-in-mcp-handler)

---

## 29 — Next.js 16.3: performance de desenvolvimento e navegação instantânea *(🟩 Estável; upgrade não adotado)*

2026-08-03
Catalogado em 2026-08-10

### Status no Projeto

- Status: não implementado; o projeto permanece em `next` e `eslint-config-next` `16.2.11`.
- Evidência: `package.json` e `package-lock.json`; nenhuma referência a Next.js 16.3, `instant()` ou `next-cache-components-optimizer` foi encontrada no repositório.
- Natureza de uso: atualização de framework com ganhos de tooling e capacidades opt-in de navegação.
- Relação com a stack: evolução direta da stack Next.js atual; não é nova infraestrutura nem substituto de arquitetura.
- Horizonte: Starter como manutenção candidata para os ganhos gerais, e Lite/Pro ou indefinido para otimizações de navegação dependentes de caso e medição.

### Descrição

Next.js 16.3 foi lançado de forma estável com redução de uso de memória em sessões longas de desenvolvimento, cache persistente para builds repetidos e melhorias de renderização e tooling. O release também consolida as ferramentas de Instant Navigations, incluindo prefetch parcial, teste `instant()` e o skill `next-cache-components-optimizer` para diagnosticar rotas lentas.

Os ganhos gerais dependem de upgrade e validação do projeto. As otimizações de navegação não autorizam habilitar Cache Components, mudar fetch/cache, introduzir prefetch customizado ou reescrever rotas sem uma navegação-alvo e medição próprias.

### Valor para o Projeto

- Pode reduzir pressão de memória e tempo de desenvolvimento em uma máquina com recursos limitados.
- Pode acelerar builds repetidos e reduzir atrito operacional após validação do upgrade.
- Oferece um método oficial para provar se uma navegação é instantânea antes de alterar cache, streaming ou prefetch.
- Pode beneficiar o dashboard e futuras landing pages quando houver atraso de navegação mensurável.

### Gatilho de aplicação

Avaliar o upgrade em recorte técnico próprio quando a versão estiver compatível com as dependências atuais e houver janela para executar a validação completa. Avaliar Instant Navigations somente quando uma rota real apresentar atraso perceptível ou métrica insuficiente, começando pelos defaults do framework e por um teste reproduzível.

### Dependências, riscos e limite

- Upgrade de framework exige revisão de release notes, lockfile, tipos, lint, rotas, Auth, SSR, cookies e Preview hospedado.
- Cache Components e otimizações de prefetch podem alterar consumo, frescor e comportamento de navegação; não devem ser introduzidos por modernidade.
- O release não substitui Web Vitals, Speed Insights ou teste humano da jornada.
- Não alterar dependências, `next.config`, rotas, cache, scripts ou skills nesta rodada.

### Ações Recomendadas

1. Preservar `16.2.11`, já corrigido para a rodada de segurança de julho, até existir recorte de upgrade aprovado.
2. No recorte competente, comparar memória, check, build autorizado e Preview antes e depois.
3. Usar `instant()` ou o skill oficial apenas diante de rota-alvo e sem conceder escrita irrestrita a agente.

### Fontes Oficiais

- [Next.js — Next.js 16.3](https://nextjs.org/blog/next-16-3)
- [Next.js — Instant navigation](https://nextjs.org/docs/app/guides/instant-navigation)
- [Next.js — AI Coding Agents](https://nextjs.org/docs/app/guides/ai-agents)
- [Next.js — Turbopack: What's New in Next.js 16.3](https://nextjs.org/blog/next-16-3-turbopack)

---

## Registro da rodada — Vercel + Next.js Update — 10/08/2026

### Updates ajustados ou incorporados

- `vercel#1` foi atualizado com as novas cotas de escala do Vercel Sandbox, sem alterar seu uso condicional.
- `vercel#29` foi adicionado para preservar a avaliação do Next.js 16.3 sem autorizar upgrade ou otimização de navegação.

### Updates avaliados e não adicionados

- Medição entre etapas no Vercel Workflows: não há Vercel Workflow ou Workflow SDK no projeto; a melhoria isolada de trace não cria caso de adoção.
- Repositórios públicos no Vercel Container Registry: não há imagem, container registry ou distribuição pública de runtime no projeto; a capacidade não oferece valor concreto ao Core ou ao service atual.
- Marketplace integrations com instalação automática de provider skills: não há provisionamento de integração pelo Vercel CLI; instalação automática exige governança e não demonstra vantagem sobre os plugins já controlados em `docs/gestor-codex.md`.
- Agent Plugins 1.0.0: o padrão portátil é relevante ao ecossistema, mas plugin distribuível e MCP Apps já permanecem no radar em `prod#18`; não há skill formalmente adotada nem caso que justifique duplicar o item neste catálogo.
- Novos modelos no AI Gateway, Project Avatars, domínios pelo Dashboard, Herdr/Devin Outposts e imagens públicas para Sandbox: não alteram os gatilhos dos itens existentes nem apresentam valor concreto para o escopo atual.
- Nenhum recurso foi excluído somente por estar fora do Starter ou do MVP.

### Cobertura estratégica desta atualização

- Landing pages e dashboard: Next.js 16.3 foi avaliado por performance, navegação, cache e tooling.
- IA, agentes e automações controladas: Sandbox, Agent Plugins, Marketplace Skills, AI Gateway e Workflows foram pesquisados nas fontes oficiais.
- Instagram, WhatsApp e e-mail: nenhuma novidade Vercel, Next.js ou React publicada entre 05/08/2026 e 10/08/2026 apresentou caso de uso novo e específico para esses canais.

### Pontos não validados e lacunas documentais

- Compatibilidade real do Next.js 16.3 com o projeto depende de recorte de upgrade, instalação, check e Preview próprios.
- Ganhos de memória e build precisam ser medidos no ambiente do projeto; números oficiais não garantem o mesmo resultado local.
- Instant Navigations não possui rota-alvo, baseline nem necessidade aprovada no LP Factory 10.

### Validação de IDs e limite

- Nenhum ID publicado desapareceu, foi renumerado ou reutilizado; somente `vercel#29` foi acrescentado.
- A busca por referências explícitas e implementação semântica precedeu os ajustes.
- Nenhuma dependência, configuração, rota, cache, workflow, agente, skill, imagem ou infraestrutura foi criada.
- O catálogo recomenda avaliação futura; não autoriza implementação, contratação ou mudança de stack.
