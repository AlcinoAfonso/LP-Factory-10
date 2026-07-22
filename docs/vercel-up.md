# LP Factory 10 — Vercel + Next.js Update

---

## Convenção de leitura do catálogo ativo

- O heading/badge de cada item representa o estado do recurso no mercado/plataforma Vercel, Next.js ou React, quando aplicável.
- Este documento não é histórico completo de updates da Vercel, Next.js ou React.
- O catálogo deve manter apenas recursos ainda aproveitáveis pelo LP Factory 10.
- Itens removidos por estarem globais, absorvidos, duplicados, deprecados, superados ou redundantes não têm seus IDs reutilizados.

---

## Convenção de referência

O identificador canônico dos itens deste catálogo é `vercel#n`.

Esse identificador deve ser usado no roadmap, Base Técnica, briefings, relatórios e referências cruzadas. A numeração não deve ser reutilizada após remoção, depreciação ou substituição de um item.

## Critério do catálogo ativo

Este documento deve manter apenas recursos Vercel, Next.js ou React que ainda possam ser aproveitados pelo Gestor de Updates em algum caso atual, futuro ou condicional.

Itens já implementados globalmente, absorvidos pela Base Técnica, superados, duplicados, deprecados ou redundantes não permanecem no catálogo ativo.

Recursos pagos, enterprise ou futuros podem permanecer quando ainda tiverem aproveitamento possível em algum caso específico.

A rejeição ou adoção de cada recurso deve ser decidida caso a caso pelo Gestor de Updates, conforme o plano-base avaliado.

## 1 — Vercel AI Cloud *(🟨 Disponibilidade por recurso/plano)*
2025-06-30
Atualizado em 2026-07-20

### Status no Projeto
- Status: Não implementado
- Evidência: `docs/roadmap.md` cita AI Gateway como referência futura (fase IA-ready), sem adoção operacional registrada no stack atual.
- Observação: monitoramento de mercado; disponibilidade varia por recurso/plano.

### Descrição
Conjunto de capacidades de plataforma com disponibilidade e cobrança próprias por recurso/plano:
- **AI Gateway:** endpoint unificado para acessar múltiplos modelos, acompanhar uso e orçamento, aplicar balanceamento e fallbacks.
- **Fluid Compute:** execução de Functions otimizada para concorrência e workloads com espera de I/O, com cobrança que distingue CPU ativa do tempo de espera/memória.
- **Sandbox:** ambientes Linux efêmeros e isolados para executar código não confiável, scripts gerados por agentes, testes e servidores temporários.
- **BotID:** proteção invisível contra bots para rotas sensíveis, com validação client-side e verificação server-side.

Observação de varredura oficial: AI Gateway routing rules permitem controlar rewrite/deny de modelos no gateway; Sandbox possui suporte a FUSE-based filesystems e Custom Images em public beta. Esses subrecursos permanecem como avaliação por caso, sem adoção automática no LP Factory 10.

Atualização de custo do Sandbox: desde 17/07/2026, dados baixados da internet para instalar pacotes, clonar repositórios ou obter artefatos não consomem Data Transfer. Tráfego recebido em portas expostas, tráfego enviado pelo Sandbox, CPU ativa, memória provisionada, snapshots e criações continuam sujeitos à cobrança aplicável.

### Valor para o Projeto
- Pode apoiar workloads de IA, execução isolada e proteção de endpoints quando existir um caso de uso aprovado.
- Permite avaliar custo, segurança e operação por capacidade, sem tratar “AI Cloud” como adoção única ou automática.

### Valor para o Usuário
- Benefícios potenciais de resiliência, segurança e desempenho dependem de uma aplicação concreta e validada.

### Ações Recomendadas
1. Manter AI Gateway, Fluid Compute, Sandbox e BotID sem adoção no LP Factory 10 enquanto não houver caso aprovado.
2. Avaliar separadamente requisitos de plano, custos, dados e segurança antes de qualquer implementação.
3. Não transformar essas capacidades em requisito da primeira entrega da E10.6.

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

## 4 — Turbopack *(🟩 Estável)*
2025-10-22

### Status no Projeto
- Status: Não implementado
- Evidência: `docs/base-tecnica.md` registra priorização do Next 16 para Turbopack, sem migração mandatória do projeto como ação concluída.

### Descrição
Bundler oficial do ecossistema Next.js 16 para desenvolvimento/build, com foco em performance.

### Valor para o Projeto
- Potencial de reduzir tempo de build e iteração quando aplicável.

### Valor para o Usuário
- Entregas e ciclos de preview potencialmente mais rápidos.

### Ações Recomendadas
1. Validar comportamento e compatibilidade do bundler atual no contexto real do projeto.
2. Ajustar configuração/fallback apenas se surgir necessidade específica.

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

### Status no Projeto

- Status: Não implementado
- Evidência: sem adoção registrada no stack atual; recurso identificado em varredura web oficial da Vercel.

### Descrição

Storage privado da Vercel para arquivos sensíveis, com controle de acesso, Signed URLs e autenticação OIDC.

### Valor para o Projeto

- Pode ser aproveitado em casos futuros de arquivos privados, exportações, relatórios, anexos, documentos internos, invoices ou memória de agentes.
- Pode reduzir necessidade de expor arquivos sensíveis por URLs públicas.
- OIDC reduz dependência de tokens estáticos em alguns fluxos.

### Valor para o Usuário

- Acesso mais seguro a arquivos privados quando houver necessidade real no produto.

### Ações Recomendadas

1. Manter como recurso aproveitável por caso.
2. Não adotar no MVP sem caso concreto de arquivo privado.
3. Antes de adotar, comparar com Supabase Storage e com a estratégia de dados já aprovada.

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

## 23 — Service Bindings *(🟩 Disponível na plataforma)*

2026-07-01

### Status no Projeto

- Status: Não implementado
- Evidência: o LP Factory 10 não possui arquitetura multi-service aprovada no escopo atual.

### Descrição

Recurso para comunicação segura entre serviços dentro do mesmo deployment Vercel, com variável de ambiente injetada e roteamento interno gerenciado pela plataforma.

### Valor para o Projeto

- Pode ser útil apenas se o projeto evoluir para arquitetura com mais de um serviço Vercel, por exemplo frontend Next.js e backend separado.
- Mantém isolamento entre serviços e reduz configuração manual de roteamento interno.
- Não justifica criar novo serviço no MVP.

### Valor para o Usuário

- Pode melhorar segurança e previsibilidade em arquitetura multi-service futura.

### Ações Recomendadas

1. Manter como recurso condicional futuro.
2. Não propor backend separado, serviço novo ou arquitetura multi-service apenas por causa deste recurso.
3. Considerar somente se uma fase aprovada já exigir múltiplos serviços.

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
