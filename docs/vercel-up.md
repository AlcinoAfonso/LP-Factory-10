# LP Factory 10 — Vercel + Next.js Update

---

## Convenção de leitura (mercado x projeto)

- O heading/badge de cada item representa o estado do recurso no mercado/plataforma (Vercel/Next.js/React).
- Cada item ativo possui um bloco `### Status no Projeto` para separar o estado de implementação no LP Factory 10.
- Valores aceitos em `Status no Projeto`:
  - `Não implementado`
  - `Em implementação por casos de uso`
  - `Implementado globalmente no projeto`
- Quando necessário, incluir observação curta complementar (ex.: `Duplicado`, `Superado por item mais novo`, `Deferido`, `Não apto no plano atual`).

---

## 1 — Vercel AI Cloud *(🟨 Disponibilidade por recurso/plano)*
2025-06-30

### Status no Projeto
- Status: Não implementado
- Evidência: `docs/roadmap.md` cita AI Gateway como referência futura (fase IA-ready), sem adoção operacional registrada no stack atual.
- Observação: monitoramento de mercado; disponibilidade varia por recurso/plano.

### Descrição
Conjunto de capacidades de IA na Vercel com disponibilidade por recurso/plano, incluindo AI Gateway, Fluid Compute com Active CPU pricing, Rolling Releases e BotID.

### Valor para o Projeto
- Pode reduzir custo em workloads intermitentes.
- Pode ampliar segurança/controle de rollout em ciclos de deploy.
- Cria base para iniciativas IA-ready quando houver caso de uso aprovado.

### Valor para o Usuário
- Potencial de desempenho mais previsível em cargas variáveis.
- Maior resiliência em mudanças progressivas de release.

### Ações Recomendadas
1. Acompanhar maturidade e requisitos de plano de AI Gateway, Fluid Compute, Rolling Releases e BotID.
2. Só planejar adoção quando houver caso de uso priorizado no roadmap.

---

## 2 — Next.js 16 *(🟩 Estável)*
2025-10-22

### Status no Projeto
- Status: Implementado globalmente no projeto
- Evidência: `docs/base-tecnica.md` define Next.js 16.1.1 como base; `package.json` mantém `next` em `^16.1.1`.

### Descrição
Linha estável do Next.js adotada no projeto, com App Router e alinhamento ao stack atual.

### Valor para o Projeto
- Base técnica atual padronizada e documentada.
- Compatibilidade com práticas de manutenção contínua do repo.

### Valor para o Usuário
- Navegação e carregamento consistentes com o baseline atual da aplicação.

### Ações Recomendadas
1. Manter rotina contínua de validação de upgrades de patch.
2. Acompanhar breaking changes e notas de segurança/upgrade do ecossistema Next.

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

## 5 — Routing e Navegação Aprimorados *(🟩 Estável)*
2025-10-22

### Status no Projeto
- Status: Não implementado
- Evidência: não há adoção explícita registrada no roadmap para este pacote de capacidades como iniciativa dedicada.

### Descrição
Capacidades de navegação e roteamento do framework evoluídas no ciclo atual do Next.js.

### Valor para o Projeto
- Base para simplificar padrões de navegação quando houver demanda de produto.

### Valor para o Usuário
- Potencial de navegação mais fluida em fluxos críticos.

### Ações Recomendadas
1. Avaliar adoção incremental por necessidade funcional comprovada.

---

## 6 — DevTools MCP *(🟩 Disponível no ecossistema Next.js 16+)*
2025-10-22

### Status no Projeto
- Status: Não implementado
- Evidência: inexistência de configuração/adoção explícita no repositório atual (sem registro de uso operacional no roadmap/base técnica).

### Descrição
Integração MCP do ecossistema Next.js 16+ para suporte a inspeção e depuração assistida em desenvolvimento.

### Valor para o Projeto
- Pode acelerar diagnóstico técnico quando incorporado ao fluxo de desenvolvimento.

### Valor para o Usuário
- Indiretamente reduz tempo de resolução de incidentes.

### Ações Recomendadas
1. Avaliar adoção somente quando houver demanda clara de produtividade de engenharia.
2. Formalizar padrão de uso no projeto antes de habilitar em rotina.

---

## 7 — React 19.2 *(🟩 Estável)*
2025-10-22

### Status no Projeto
- Status: Implementado globalmente no projeto
- Evidência: `docs/base-tecnica.md` define React 19.2.x; `package.json` fixa `react`/`react-dom` em `19.2.1`.

### Descrição
Versão estável do React já usada no stack atual do LP Factory 10.

### Valor para o Projeto
- Base moderna e suportada para evolução do App Router e Server Components.

### Valor para o Usuário
- Comportamento de UI consistente com runtime atualizado.

### Ações Recomendadas
1. Manter acompanhamento de patches e notas de compatibilidade.
2. Tratar recursos opcionais (ex.: View Transitions) como adoção conservadora e orientada a caso de uso.

---

## 8 — APIs de Cache refinadas *(🟩 Estável no framework)*
2025-10-22

### Status no Projeto
- Status: Não implementado
- Evidência: não há integração explícita no projeto para fluxo com `updateTag()`/`revalidateTag()` como padrão operacional.

### Descrição
APIs do framework para invalidação de cache mais precisa, incluindo `revalidateTag()` e `updateTag()` em cenários específicos.

### Valor para o Projeto
- Possibilita atualização pontual de dados sem estratégia global de rebuild.

### Valor para o Usuário
- Pode melhorar frescor de dados em áreas com atualização frequente.

### Ações Recomendadas
1. Mapear casos reais que se beneficiem de invalidação por tag.
2. Adotar apenas com critérios de consistência e observabilidade definidos.

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

## 10 — Observability Redirects *(🟩 Estável)*
2025-11-05

### Status no Projeto
- Status: Implementado globalmente no projeto
- Evidência: registro operacional Tipo A já validado neste documento para o projeto `lp-factory-10` no dashboard Vercel.
- Observação: visibilidade disponível para clientes; profundidade de métricas pode variar conforme plano/Observability Plus.

### Descrição
Painel de Observability da Vercel com visibilidade de tráfego, incluindo rotas com redirects/rewrites.

### Valor para o Projeto
- Diagnóstico mais rápido de comportamento de rotas e latência.

### Valor para o Usuário
- Maior consistência de navegação com monitoramento contínuo.

### Ações Recomendadas
1. Manter validações periódicas em smoke de preview para rotas críticas.
2. Evoluir alertas de latência conforme maturidade de observabilidade do time.

### Registro (Tipo A — Plataforma)
- Status: OK
- Verificado em: 08/02/2026
- Ambiente: Vercel Dashboard (projeto `lp-factory-10`) → Observability → Edge Requests
- Evidência: gráficos + tabela de rotas acessíveis; busca/filtro de rotas (ex.: `/a/home`) disponível.
- Observação: no smoke do preview `e10.4.6`, validar também `/a/[account]` e sequência E10.4 → E10.5 (redirect/latência).

---

## 11 — Server-side Tracking API (`@vercel/analytics/server`) *(🟩 Estável no ecossistema Vercel)*
2025-10-30

### Status no Projeto
- Status: Não implementado
- Evidência: roadmap/base técnica registram tracking interno em planejamento, sem adoção explícita de `@vercel/analytics/server` no projeto.
- Observação: custom events server-side dependem de disponibilidade/plano (tipicamente Pro/Enterprise).

### Descrição
Capacidade de envio de eventos customizados server-side via stack de analytics da Vercel, sem depender apenas de eventos client-side.

### Valor para o Projeto
- Pode melhorar confiabilidade de telemetria em fluxos sensíveis.

### Valor para o Usuário
- Melhora indireta na qualidade de produto por decisões guiadas por eventos mais consistentes.

### Ações Recomendadas
1. Avaliar desenho de eventos server-side alinhado ao modelo de observabilidade interno.
2. Evitar pressupor integração nativa pronta com APIs de Ads sem fonte oficial específica.

---

## 12 — Vercel AI Cloud + Gateway *(DEPRECADO — duplicado)*
2025-11-12

### Status no Projeto
- Status: Não implementado
- Evidência: item duplicado do `#1`, sem implementação dedicada no projeto.
- Observação: Duplicado / Superado por item mais novo (manter referência no `#1`).

### Descrição
Duplicado do item 1.

---

## 13 — Auto Job Cancellation (deploys em fila no mesmo branch) *(🟩 Estável)*
2025-12-05

### Status no Projeto
- Status: Implementado globalmente no projeto
- Evidência: comportamento default de integração Git ↔ Vercel já tratado como capacidade ativa neste documento.

### Descrição
Quando há vários pushes no mesmo branch/PR enquanto um build está em execução, a Vercel prioriza o commit mais recente e cancela jobs intermediários enfileirados, mantendo o Preview alinhado ao último estado do branch.

### Valor para o Projeto
- Reduz desperdício de builds em branches com commits rápidos (menos fila e menos ruído operacional).
- Diminui risco de QA abrir Preview antigo quando há muitas iterações na mesma branch.
- Acelera ciclos de correção durante execuções (ex.: branches de features como `e10.4.6`).

### Valor para o Usuário
- Correções e melhorias chegam mais rápido ao Preview/produção (menos tempo de espera por deploys).
- Menor chance de validação em estado desatualizado quando houver aprovação por Preview.

### Ações Recomendadas
1. Tratar como comportamento padrão do Vercel ↔ GitHub e manter registro operacional.
2. Só avaliar opt-out via `vercel.json` em caso específico que exija build de todos os commits.

### Registro (Tipo A — Plataforma)
- Status: N/A (default ON)
- Ação necessária: nenhuma
- Observação: somente criar `vercel.json` se optar por desabilitar o cancelamento automático.
