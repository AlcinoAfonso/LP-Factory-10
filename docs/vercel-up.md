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

## 23 — Vercel Services e Service Bindings *(🧪 Beta; adoção condicional)*

2026-06-30  
Atualizado em 2026-09-05

### Status no Projeto

- Status: não implementado; não existe service/MCP implantável nem arquitetura multi-service no estado atual.
- Evidência: a E22.3 retirou o Supabase Inspect MCP e o projeto Vercel `lpf-10-services`; `docs/roadmap.md`, `docs/services.md` e `docs/platform-config.md` registram somente o Core, e a inspeção read-only da conta Vercel em 05/09/2026 confirmou apenas o projeto `lp-factory-10` no plano Hobby.
- Natureza de uso: infraestrutura transversal condicionada.
- Relação com a stack: complementar à Vercel somente se um novo service real for aprovado; sem segundo workload, não há topologia a consolidar nem binding a criar.
- Horizonte: indefinido.

### Descrição

Vercel Services permite construir e implantar múltiplos serviços no mesmo projeto, com deployment, preview, rollback e domínio compartilhados. Service Bindings injetam uma URL interna para comunicação privada entre serviços do mesmo deployment, com roteamento, autenticação e TLS gerenciados pela Vercel.

### Valor para o Projeto

- Pode reduzir exposição pública e coordenar deploy, Preview e rollback quando dois ou mais services realmente precisarem operar no mesmo deployment.
- Preserva uma alternativa oficial antes de criar projetos separados ou comunicação pública entre workloads futuros.
- Não oferece ganho ao Core atual isolado.

### Hipótese de superioridade e gatilho objetivo

Avaliar somente quando existir:

1. novo service ou framework aprovado com workload e consumidor reais;
2. necessidade comprovada de comunicação privada, deploy atômico ou rollback coordenado;
3. comparação com projeto separado, demonstrando ganho de segurança, operação, custo ou latência;
4. compatibilidade confirmada com plano, framework, variáveis, domínio e limites vigentes;
5. plano de reversão que preserve o Core.

### Dependências, riscos e limite

- Recurso em beta e dependente de plano e disponibilidade.
- A consolidação amplia o blast radius e acopla deploy, variáveis, roteamento e rollback.
- O item não autoriza recriar o service removido, adicionar backend ou alterar a topologia atual.
- Não criar service, binding, projeto, rota, variável, domínio ou infraestrutura nesta rodada.

### Ações Recomendadas

1. Manter como alternativa condicional, sem ação no Core atual.
2. Reavaliar somente diante do primeiro novo service aprovado.
3. Comparar explicitamente com manter o workload no Core ou em projeto separado.

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

## 28 — `mcp-handler` 2.0 e MCP 2026-07-28 *(⚪ Registro histórico — alvo removido)*

2026-07-30  
Reavaliado em 2026-09-05

### Estado e rastreabilidade

- Estado final: não implementado; retirado do catálogo ativo após a remoção do único service ao qual a comparação se aplicava.
- Evidência: a E22.3 removeu `services/mcp-supabase-inspect/**`, o workflow Agent Builder e o projeto Vercel `lpf-10-services`; `package.json`, `package-lock.json` e o restante do repositório não usam `mcp-handler` nem mantêm MCP implantável.
- Motivo: o gatilho original dependia de cliente necessário ou custo de manutenção do handler manual; ambos desapareceram com a retirada controlada do service sem consumidor.
- Referências preservadas: `docs/roadmap.md` 22.3, `docs/services.md`, `docs/automations.md` e PR #868.
- Recortes aplicados: nenhum.
- Substituto: nenhum; eventual novo MCP deve ser avaliado contra o caso e a versão vigentes, sem reativar infraestrutura por este registro.
- O ID permanece histórico e não pode ser reutilizado.

### Fonte Oficial

- [Latest MCP spec now supported in mcp-handler](https://vercel.com/changelog/latest-mcp-spec-now-supported-in-mcp-handler)

---

Zod 4 e novas APIs de registro; o transporte HTTP+SSE legado foi removido.

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

## 29 — Next.js 16.3: performance de desenvolvimento e navegação instantânea *(🟨 Upgrade agora condicionado à correção de segurança)*

2026-08-03  
Catalogado em 2026-08-10  
Atualizado em 2026-09-05

### Status no Projeto

- Status: não implementado; o projeto permanece em `next` e `eslint-config-next` `16.2.11`.
- Evidência: `package.json` e `package-lock.json`; não há `instant()`, `next-cache-components-optimizer` nem Cache Components habilitado.
- Mudança material: `16.2.11` está abaixo da versão corrigida `16.3.3` indicada pela August 2026 Security Release; a necessidade de patch é registrada em `vercel#31`.
- Natureza de uso: evolução direta da stack Next.js atual.
- Relação com a stack: o upgrade mínimo seguro deixou de ser decisão apenas de performance; recursos opt-in de navegação continuam dependentes de caso e medição.
- Horizonte: Starter para o patch de segurança; Lite, Pro ou indefinido para Instant Navigations e otimizações adicionais.

### Descrição

Next.js 16.3 foi lançado de forma estável com redução de uso de memória em sessões longas de desenvolvimento, cache persistente para builds repetidos e melhorias de renderização e tooling. O release também consolida as ferramentas de Instant Navigations, incluindo prefetch parcial, teste `instant()` e o skill `next-cache-components-optimizer` para diagnosticar rotas lentas.

O upgrade técnico necessário para `16.3.3` ou superior não autoriza habilitar Cache Components, mudar fetch/cache, introduzir prefetch customizado ou reescrever rotas. Esses recursos continuam exigindo uma navegação-alvo e medição próprias.

### Valor para o Projeto

- Pode reduzir pressão de memória e tempo de desenvolvimento em uma máquina com recursos limitados.
- Pode acelerar builds repetidos e reduzir atrito operacional após validação do upgrade.
- Oferece método oficial para provar se uma navegação é instantânea antes de alterar cache, streaming ou prefetch.
- Permite aplicar o patch crítico sem acoplar adoção funcional das novidades de 16.3.

### Gatilho de aplicação

- Upgrade mínimo: executar em recorte técnico prioritário para `16.3.3` ou versão corrigida superior compatível, conforme `vercel#31`.
- Instant Navigations: avaliar somente quando uma rota real apresentar atraso perceptível ou métrica insuficiente, começando pelos defaults do framework e por teste reproduzível.

### Dependências, riscos e limite

- Upgrade exige revisão de release notes, lockfile, tipos, lint, rotas, Auth, SSR, cookies e Preview hospedado.
- Cache Components e prefetch podem alterar consumo, frescor e comportamento de navegação.
- O release não substitui Web Vitals, Speed Insights ou teste humano da jornada.
- Não alterar dependências, `next.config`, rotas, cache, scripts ou skills nesta rodada.

### Ações Recomendadas

1. Não preservar `16.2.11` como baseline segura; encaminhar o patch mínimo de `vercel#31` ao fluxo técnico competente.
2. Separar a correção de segurança da adoção de Cache Components ou Instant Navigations.
3. Medir memória, check, build autorizado e Preview antes e depois do upgrade.
4. Usar `instant()` ou o skill oficial apenas diante de rota-alvo e sem escrita irrestrita por agente.

### Fontes Oficiais

- [Next.js — Next.js 16.3](https://nextjs.org/blog/next-16-3)
- [Next.js — Instant navigation](https://nextjs.org/docs/app/guides/instant-navigation)
- [Next.js — AI Coding Agents](https://nextjs.org/docs/app/guides/ai-agents)
- [Next.js — Turbopack: What's New in Next.js 16.3](https://nextjs.org/blog/next-16-3-turbopack)
- [Next.js — August 2026 Security Release](https://nextjs.org/blog/august-2026-security-release)

---

## 30 — Vercel Chat SDK: adapter para Instagram *(🟨 Disponível; adoção dependente de recorte)*

2026-08-19  
Catalogado em 2026-08-20

### Status no Projeto

- Status: não implementado; capacidade futura condicionada a um recorte aprovado de mensageria no Instagram.
- Evidência: não há dependência `chat`, `@chat-adapter/instagram`, bot, webhook ou integração com Instagram Messaging API no repositório; o Instagram permanece canal estratégico no `README.md`.
- Natureza de uso: dependente de recorte de produto e canal.
- Relação com a stack: complementar ao Next.js/Vercel, mas sobreposto a uma integração direta com a Instagram Messaging API; não substitui autoridade, políticas e permissões da Meta.
- Horizonte: Pro, Ultra ou indefinido, conforme demanda e desenho aprovados pelo Estrategista.

### Descrição

O Vercel Chat SDK passou a oferecer um adapter para a Instagram Messaging API. A capacidade permite receber e enviar DMs e mídia, representar cards como respostas rápidas e botões de link, exibir indicador de digitação, receber reações e tratar respostas a Stories.

O adapter exige conta profissional Business ou Creator. Respostas em stream são bufferizadas e enviadas como uma única mensagem, e a janela oficial informada é de 24 horas após a última mensagem do usuário.

### Valor para o Projeto

- Pode reduzir código específico de transporte em um futuro atendimento ou qualificação por DM.
- Pode unificar handlers e padrões de mensagens se o produto vier a operar mais de um canal suportado pelo Chat SDK.
- Preserva uma alternativa TypeScript alinhada à stack atual para comparar com integração direta na Meta.

### Gatilho futuro de avaliação

Avaliar somente quando houver:

1. caso de produto aprovado para atendimento, qualificação, venda ou nutrição por Instagram DM;
2. conta profissional, Meta app, permissões, webhooks e responsabilidade operacional definidos;
3. hipótese de superioridade do adapter sobre integração direta, com comparação de complexidade, cobertura, custo, manutenção e lock-in;
4. desenho de janela de atendimento, opt-in, handoff humano, exclusão, observabilidade e limites de automação;
5. volume ou repetição operacional que justifique uma camada de SDK.

### Dependências, riscos e limite

- Depende das políticas, permissões, revisão de app, disponibilidade e limites da Meta.
- A janela de 24 horas restringe mensagens iniciadas pelo negócio e precisa ser respeitada no produto.
- O SDK não elimina webhooks, autenticação, armazenamento mínimo, moderação, privacidade, LGPD nem tratamento de falhas.
- Streaming é consolidado antes do envio e não equivale a streaming visível no Instagram.
- Não instalar dependência, criar bot, webhook, rota, job, agente, automação, credencial ou infraestrutura nesta rodada.
- O registro não autoriza implementação nem promessa comercial.

### Ações Recomendadas

1. Manter como alternativa futura para o canal Instagram.
2. Reavaliar junto do primeiro recorte aprovado de mensageria social.
3. Comparar por protótipo controlado com a integração direta da Meta antes de adotar.

### Fonte Oficial

- [Vercel Changelog — Chat SDK adds Instagram adapter](https://vercel.com/changelog/chat-sdk-adds-instagram-adapter)

---

## 31 — Next.js August 2026 Security Release *(🔴 Crítico; correção pendente)*

2026-08-25  
Catalogado em 2026-09-05

### Status no Projeto

- Status: correção não implementada; `next` e `eslint-config-next` permanecem em `16.2.11`.
- Evidência: `package.json`, `package-lock.json` e ausência de PR ou commit com `16.3.3`.
- Natureza de uso: segurança transversal da stack.
- Relação com a stack: atualização direta e necessária do framework vigente; não é nova infraestrutura nem mudança de arquitetura.
- Horizonte: Starter, prioridade imediata no fluxo técnico competente.

### Descrição

A versão `16.3.3` corrige duas vulnerabilidades críticas divulgadas em 25/08/2026:

- execução remota não autenticada na Image Optimization API ao processar AVIF malicioso; o advisory classifica versões Next.js anteriores a `16.3.3` como afetadas;
- execução remota não autenticada em servidores Windows quando a aplicação combina Pages Router e App Router sem Cache Components.

O repositório não contém diretório `pages/`, import de `next/image` nem arquivo AVIF, e a hospedagem Vercel não usa filesystem Windows. Essas evidências reduzem a exposição conhecida ao segundo cenário e ao uso normal do primeiro, mas não tornam `16.2.11` uma dependência corrigida.

### Valor para o Projeto

- Remove uma dependência classificada oficialmente como afetada por vulnerabilidade crítica de RCE.
- Evita manter como baseline uma versão que já não recebe a correção da linha Active LTS publicada.
- Permite tratar segurança sem habilitar recursos opcionais de Next.js 16.3.

### Ações Recomendadas

1. Abrir recorte técnico prioritário e mínimo para atualizar `next` e `eslint-config-next` para `16.3.3` ou versão corrigida superior compatível.
2. Não acoplar Cache Components, Instant Navigations, `vercel.ts` ou outra modernização ao patch.
3. Validar `npm ci`, `npm run check`, build no CI/Vercel e Preview das jornadas críticas.
4. Confirmar o lockfile e o deployment corrigidos antes de encerrar o item.

### Dependências, riscos e limite

- O upgrade cruza a linha `16.2` → `16.3` e pode revelar incompatibilidades; exige teste completo e rollback simples.
- A ausência atual de AVIF e Pages Router não substitui o patch.
- Não alterar dependências, código, configuração, rota ou deployment nesta rodada.
- A catalogação não autoriza implementação nem merge.

### Critério de encerramento

- `package.json` e lockfile em versão corrigida, checks aprovados e Preview hospedado validado; depois, preservar o ID como registro histórico com evidência.

### Fontes Oficiais

- [Next.js — August 2026 Security Release](https://nextjs.org/blog/august-2026-security-release)
- [GitHub Advisory — GHSA-2xp9-vwfh-vxw4](https://github.com/vercel/next.js/security/advisories/GHSA-2xp9-vwfh-vxw4)
- [GitHub Advisory — GHSA-p293-qw3h-jr36](https://github.com/vercel/next.js/security/advisories/GHSA-p293-qw3h-jr36)

---

## 32 — Variáveis Vercel com tipos Config e Secret *(🟩 Disponível; avaliação transversal de segurança)*

2026-08-24  
Catalogado em 2026-09-05

### Status no Projeto

- Status: mudança da plataforma disponível; classificação efetiva das variáveis existentes não validada nesta rodada.
- Evidência: `docs/platform-config.md` separa variáveis públicas e server-side por finalidade, mas não registra o tipo Vercel `Config` ou `Secret`; a conta Vercel possui somente o Core `lp-factory-10` no plano Hobby.
- Natureza de uso: segurança e configuração transversal.
- Relação com a stack: complementar à governança de secrets existente; não altera nomes, valores, consumidores ou ambientes.
- Horizonte: Starter, no próximo recorte de revisão de variáveis ou segurança.

### Descrição

A Vercel substituiu o toggle Sensitive pelos tipos:

- `Config`: valor permanece legível para membros autorizados e serve para configuração não sensível;
- `Secret`: valor continua disponível ao deployment, mas não pode ser lido ou recuperado por membros após ser salvo.

Variáveis antes marcadas como Sensitive são tratadas automaticamente como Secret, sem migração. A plataforma também introduziu uma policy para exigir valor de produção distinto dos demais ambientes; disponibilidade e adequação dessa policy ainda não foram validadas para a conta atual.

### Valor para o Projeto

- Torna explícita a diferença entre configuração pública/inspecionável e credencial write-only.
- Pode reduzir exposição operacional de API keys, tokens e senhas.
- Oferece um critério simples para revisar novas variáveis sem registrar seus valores.

### Gatilho e aplicação

Avaliar no próximo cadastro, alteração ou revisão de variáveis:

1. classificar URLs e valores públicos necessários como `Config`;
2. classificar passwords, API keys, tokens e credenciais como `Secret`;
3. conferir escopo de Production, Preview, Development e branches sem copiar valores entre ambientes;
4. avaliar a policy de separação de Secrets de Production somente se estiver disponível e sem quebrar consumidores aprovados.

### Dependências, riscos e limite

- Alterar tipo ou valor no Dashboard pode exigir redeploy e afetar runtime; executar somente em recorte operacional aprovado.
- O tipo `Secret` não substitui menor privilégio, rotação, escopo por ambiente ou proteção contra exposição no client.
- Variável com prefixo público de framework não pode receber segredo.
- Não ler, copiar, imprimir, reclassificar ou substituir valores nesta rodada.
- Não alterar Vercel, `docs/platform-config.md`, runtime ou deployment por causa deste registro.

### Critério de encerramento

- Regra absorvida no documento competente e classificação dos nomes existentes confirmada sem expor valores; depois, preservar o ID como histórico compacto.

### Fonte Oficial

- [Vercel — Environment variables now use Config and Secret types](https://vercel.com/changelog/environment-variables-now-use-config-and-secret-types)

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


## Registro da rodada — Vercel + Next.js Update — 20/08/2026

### Updates ajustados ou incorporados

- `vercel#30` foi adicionado como alternativa dependente de recorte para futura mensageria no Instagram.
- `vercel#29` foi revalidado diante da publicação “Building App-like Experiences with Next.js 16.3”; a fonte reforça a capacidade já catalogada e não altera seu estado, horizonte ou gatilho.

### Updates avaliados e não adicionados

- Vercel KMS: beta capaz de assinar JWTs sem chave privada no runtime, mas o projeto não possui requisito aprovado de emissão própria de tokens nem insuficiência demonstrada do Supabase Auth; reavaliar diante de boundary real de assinatura.
- Vercel Connect para Microsoft: não há integração Microsoft aprovada no produto; o recurso adicionaria fornecedor, permissões e superfície operacional sem caso atual.
- Configuração de coding agents em um comando pelo AI Gateway: absorvida por `vercel#1`; não altera a ausência de hipótese de superioridade sobre o uso direto atual.
- Novos modelos e descontos temporários no AI Gateway: disponibilidade ou promoção isolada não substitui a escolha governada por workload nem justifica nova camada.
- Algolia no Marketplace: sobrepõe a alternativa já preservada em `supa#12` e não existe busca aprovada com deficiência mensurável no Postgres.
- Deploy de Vercel for Platforms a partir de repositórios dos usuários, adapter Cline no harness, Compliance Documents, Vercel for Slack e demais integrações do período: não possuem caso de produto ou operação aprovado que altere os gatilhos atuais.
- Nenhum recurso foi excluído somente por estar fora do Starter ou do MVP.

### Cobertura estratégica desta atualização

- Instagram: o adapter do Chat SDK foi a novidade específica e relevante do período.
- Landing pages e dashboard: Next.js 16.3 e a nova publicação sobre experiências app-like foram reavaliados sem mudança de decisão.
- IA, agentes e automações controladas: AI Gateway, harness, Vercel Agent, Slack, Connect e KMS foram pesquisados.
- WhatsApp e e-mail: não foi encontrada novidade Vercel, Next.js ou React no período com caso novo e específico para os fluxos atuais; fontes oficiais da WhatsApp Business Platform/Meta Business Messaging foram consultadas para a cobertura obrigatória.

### IDs preservados por rastreabilidade

- Todos os IDs publicados de `vercel#1` a `vercel#29`, inclusive registros históricos e intervalos não utilizados, permanecem sem renumeração, reutilização ou desaparecimento.
- `vercel#30` é o único novo ID e está acima do maior ID histórico anterior.

### Pontos não validados e lacunas documentais

- `vercel#30`: custo, maturidade operacional, cobertura real das permissões da Meta e comparação com integração direta dependem de futuro recorte e conta profissional autorizada.
- Permanecem dependentes de recorte a compatibilidade do Next.js 16.3, a medição de navegação, os gatilhos do AI Gateway e as capacidades beta já catalogadas.

### Validação de IDs e limite

- Nenhum ID publicado desapareceu, foi renumerado ou reutilizado.
- Não houve arquivamento; a busca explícita e semântica confirmou a ausência de Chat SDK e de integração Instagram no estado inicial.
- A catalogação adere ao `README.md` e não adotou novidade, modernidade ou distância do MVP como decisão isolada.
- Nenhuma dependência, configuração, rota, webhook, job, bot, agente, automação, credencial ou infraestrutura foi criada.
- O catálogo recomenda avaliação futura; não autoriza implementação, contratação ou mudança de stack.

## Registro da rodada — Vercel + Next.js Update — 05/09/2026

### Updates ajustados ou incorporados

- `vercel#23` foi reconciliado com a retirada E22.3 e com o estado externo atual de um único projeto Core, mantendo Vercel Services apenas como alternativa condicionada a novo service real.
- `vercel#28` foi retirado do catálogo ativo e preservado como registro histórico, pois o único handler e service aos quais se aplicava foram removidos.
- `vercel#29` foi ajustado para separar o patch obrigatório de segurança da adoção opcional de recursos de performance e navegação.
- `vercel#31` foi adicionado para registrar a correção crítica pendente do Next.js `16.2.11` para `16.3.3` ou superior corrigida.
- `vercel#32` foi adicionado para registrar os novos tipos `Config` e `Secret` e a revisão transversal futura das variáveis, sem ler nem alterar valores.

### Updates avaliados e não adicionados

- Custom Metrics: exige Pro ou Enterprise com Observability Plus; a conta atual é Hobby e não há métrica própria com insuficiência comprovada dos logs e validadores existentes.
- Cursor Cloud Agents no Vercel Sandbox: reforça `vercel#1`, mas exige Cursor Enterprise, Sandbox, Functions e Workflow sem workload aprovado.
- GPT 6 Astra, Claude Fable 5.1, Gemini 3.8 Flash, Muse Spark 1.3, Ling e promoções no AI Gateway: disponibilidade de modelo ou desconto não altera o gate de `vercel#1`; escolha e custo pertencem ao fluxo de workload/modelo.
- AI Gateway para vídeo assíncrono: não há workload de vídeo aprovado e o recurso adicionaria webhook, polling ou Workflow.
- AWS PrivateLink: não há serviço AWS privado a alcançar e a conta Hobby não atende os planos anunciados.
- Basic build machines: a conta Hobby já utiliza a classe equivalente de 2 vCPU; não há decisão ou economia nova a registrar.
- Domínio grátis Pro, Bun 1.4 e Vercel Container Registry: não se aplicam ao plano, runtime Node/Next e topologia atuais.
- Nenhum recurso foi rejeitado apenas por estar fora do Starter ou do MVP.

### Cobertura estratégica desta atualização

- Landing pages, dashboard e performance: Next.js 16.3.3 e a segurança da Image Optimization API foram confrontados com o código e as dependências.
- IA, agentes e automações: AI Gateway, Astra, Sandbox, Cursor Cloud Agents, Workflow e geração assíncrona foram avaliados.
- Segurança e operação: tipos Config/Secret, policy de separação por ambiente, plano Hobby, projeto Core e retirada do service antigo foram verificados.
- Instagram, WhatsApp e e-mail: não houve novidade Vercel, Next.js ou React específica para esses canais desde a rodada anterior; fontes oficiais da WhatsApp Business Platform e Meta Business Messaging foram pesquisadas.
- O adapter Instagram de `vercel#30` permanece sem mudança.

### IDs preservados por rastreabilidade

- Todos os IDs publicados de `vercel#1` a `vercel#30`, inclusive históricos e intervalos não utilizados, permanecem localizáveis.
- `vercel#31` e `vercel#32` foram atribuídos acima do maior ID histórico anterior.
- `vercel#28` permanece físico e não pode ser reutilizado.

### Pontos não validados e lacunas documentais

- `vercel#31`: compatibilidade real de `16.3.3` com o projeto depende de instalação, check, CI/Vercel e Preview em recorte técnico próprio.
- `vercel#32`: tipos efetivos das variáveis existentes e disponibilidade da policy de separação de Production não foram inspecionados.
- A exposição externa real da Image Optimization API não foi testada; ausência de import, arquivo AVIF e Pages Router foi confirmada apenas no repositório.
- Permanecem dependentes de recorte os gatilhos do AI Gateway, Sandbox, Services, Chat SDK e recursos beta já catalogados.

### Validação de IDs e rastreabilidade

- Antes de reclassificar, foram buscados IDs, títulos, services, bindings, `mcp-handler`, protocolo MCP, E22.3, dependências, `next/image`, AVIF, Pages Router, Cache Components, variáveis Sensitive/Secret, código, configurações e histórico de PRs.
- A inspeção externa confirmou somente `lp-factory-10` no plano Hobby; `lpf-10-services` não existe.
- Nenhum ID desapareceu, foi renumerado ou reutilizado.
- A catalogação adere ao `README.md` e não usou novidade, modernidade ou distância do MVP como decisão isolada.

### Limite da rodada

- Nenhuma dependência, variável, secret, configuração, rota, service, binding, MCP, agente, workflow ou infraestrutura foi criada ou alterada.
- Nenhum deployment ou redeploy foi executado.
- O catálogo recomenda prioridades e avaliações; não autoriza implementação, upgrade, alteração de plataforma ou merge.

