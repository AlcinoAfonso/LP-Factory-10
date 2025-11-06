# 🚀 Vercel + Next.js Update 1.3 — LP Factory 10
**Data:** 05/11/2025  
**Propósito:** Consolidar as inovações da Vercel e do Next.js 16 apresentadas entre o **Ship 2025 (junho)** e a **Next.js Conf 2025 (outubro)**, avaliando impacto técnico e estratégico para o LP Factory 10.  
**Versão anterior:** 1.1 (11/10/2025 — antes da padronização de status)  
**Próxima revisão:** Após o rollout estável do Next.js 16.1 e Vercel AI Gateway.  

---

## 🧭 Visão Geral

Em 2025 a Vercel lançou duas ondas de inovação complementares:

1. **Vercel AI Cloud (Ship 2025)** — nova fundação IA-native voltada a eficiência, segurança e deploy inteligente.  
2. **Next.js 16 (Next.js Conf 2025)** — atualização centrada em caching, edge runtime, performance e integração IA via DevTools MCP.

Esses avanços impactam diretamente a **camada de deploy e execução do LP Factory 10**, baseada em **Next.js 15+ com Vercel**.  
O documento descreve os recursos aplicáveis, status de maturidade e ações de adoção.

---

## 🧠 2025-06-30 — Vercel AI Cloud (Ship 2025)
**Status:** 🧪 Experimental  
**Descrição:** Nova fundação da Vercel voltada a aplicações **IA-native**, com **AI Gateway**, **Fluid Compute**, **Active CPU Pricing**, **Rolling Releases** e **BotID**.  
**Impacto:**  
- Reduz custos em workloads intermitentes (ex.: geração de copy e relatórios IA).  
- Permite deploys seguros e reversíveis com rollback automático.  
- Protege rotas críticas (login, APIs e endpoints IA) com detecção invisível de bots.  
- Base ideal para automações e agentes futuros (**E17 — Workspace Dashboard**).  

**Ações:**  
1. Testar **Active CPU** em workloads ocasionais (IA / relatórios).  
2. Avaliar **Rolling Releases** e **BotID** quando disponíveis na conta Vercel.  
3. Planejar uso do **AI Gateway** na fase *IA-ready* do produto.  

---

## 🧩 2025-10-22 — Next.js 16 e Vercel Edge 2025

### 1. Cache Components (Novo modelo de cache explícito)
**Status:** ⏳ Em Rollout  
**Descrição:** Substitui o PPR (Partial Pre-Rendering), permitindo caching opt-in via diretiva `use cache`.  
**Impacto:**  
- Controle granular de seções estáticas e dinâmicas.  
- Redução de latência p95 em blocos reutilizáveis (hero, FAQ, CTA).  
**Ações:**  
- Testar em ambiente *staging*.  
- Monitorar Core Web Vitals pós-ativação.  

---

### 2. Turbopack + File System Caching
**Status:** 🟩 Estável  
**Descrição:** Bundler padrão do Next 16, builds até 5× mais rápidos e *Fast Refresh* otimizado.  
**Impacto:**  
- Reduz tempo de build e deploy.  
- Acelera iteração e previews no pipeline CI/CD.  
**Ações:**  
- Migrar do Webpack → Turbopack no próximo ciclo CI.  

---

### 3. Roteamento e Navegação Aprimorados
**Status:** 🟩 Estável  
**Descrição:** Introduz *layout deduplication* e *incremental prefetching* adaptativo.  
**Impacto:**  
- Navegação mais fluida e responsiva.  
- Melhora métricas UX e Speed Insights.  
**Ações:**  
- Ativar prefetch adaptativo apenas em rotas internas do dashboard (`/a/[account]`).  

---

### 4. Next.js DevTools MCP (Model Context Protocol)
**Status:** ⏳ Em Rollout  
**Descrição:** Ferramenta de depuração IA-assistida com logs unificados e contexto de renderização.  
**Impacto:**  
- Diagnóstico automatizado de falhas SSR/Edge.  
- Reduz tempo de correção pós-deploy.  
**Ações:**  
- Habilitar quando disponível para contas Free/Hobby.  

---

### 5. React 19.2 + Novas APIs de UI
**Status:** 🟩 Estável  
**Descrição:** Suporte a *View Transitions* e `useEffectEvent()`.  
**Impacto:**  
- Transições suaves entre rotas.  
- LPs mais dinâmicas sem perda SEO.  
**Ações:**  
- Aplicar *View Transitions* em seções principais de LPs consultivas.  

---

### 6. APIs de Cache refinadas (`updateTag()`, `revalidateTag()`)
**Status:** ⏳ Em Rollout  
**Descrição:** Controle granular de invalidação de cache por tag.  
**Impacto:**  
- Atualizações pontuais sem rebuild completo.  
- Reduz custo e latência em multi-tenant.  
**Ações:**  
- Integrar `revalidateTag()` ao fluxo de publicação das LPs.  

---

### 7. Novo modelo de proxy (`proxy.ts`)
**Status:** 🧪 Experimental  
**Descrição:** Substitui `middleware.ts` por *proxy.ts* (edge boundary explícita).  
**Impacto:**  
- Arquitetura de edge mais previsível e auditável.  
- Melhora futura integração com Supabase Edge Functions.  
**Ações:**  
- Testar conversão em *staging*.  

---

## ⚙️ Integração com Supabase / LP Factory 10

| Recurso | Camada afetada | Dependências | Sinergia |
|----------|----------------|--------------|-----------|
| AI Cloud / AI Gateway | Edge + IA | Supabase Auth / Access Context | Base para automações futuras |
| Cache Components | SSR / Edge | `ACCESS_CONTEXT_ENFORCED` | Renderização parcial otimizada |
| Turbopack | CI/CD | GitHub + Vercel | Builds mais rápidos |
| DevTools MCP | DevOps | Logs AI / Supabase AI Debugging | Observabilidade unificada |
| React 19.2 | UI | shadcn/ui + Platform Kit | UX IA-ready |
| proxy.ts | Edge | Supabase Edge Functions | Integração futura |

---

## 📡 Server-side Tracking API (Ads Integration)

### Objetivo
Permitir envio de eventos de conversão direto do servidor (server-side tagging) para Google Ads e Meta Ads.

### Estrutura técnica
- Função Edge `/api/track` para receber e encaminhar eventos.
- Webhook Supabase → Vercel Edge → Ads APIs.
- Variáveis de ambiente seguras (`AD_API_KEY`, `META_ACCESS_TOKEN`).
- Mapeamento de eventos: `form_submit`, `cta_click`, `view_lp`.

### Benefícios
- Retroalimenta algoritmos de mídia com leads qualificados.
- Elimina tags de browser, melhora desempenho e privacidade.
- Sinergia direta com o módulo `events_analytics` do Supabase Update.

### Status
🧪 **Experimental**


---

## 🧾 Próximas Ações

1. Criar ambiente de *staging* “next16-edge” para testes de Cache Components + Turbopack.  
#a otimizar rotas e caching.

2. Avaliar Active CPU e Rolling Releases quando disponíveis.  
3. Atualizar Base Técnica 1.4 com seção “Edge Runtime 2025”.  
4. Referenciar este update no **Supabase Update 1.2**:  
   > 🔗 *Ver “Vercel + Next.js Update 1.2” para novidades de deploy e edge.*  
5. Monitorar métricas p95/p99 pós-migração.  
6. Planejar E12 — Edge & AI Refactor para consolidar cache, AI Gateway e proxy.
--
## 2025-11-05 — Observability: Redirects & External Rewrites (GA)

**Statu🟩:**🟩 Estável (GA)

**Descrição:** Novo painel no Vercel Observability inclui métricas para redirecionamentos (rewrites e proxies externos) por hostname/path, latência de conexão e erros. Permite diagnosticar gargalos e latências em proxies e configurar alertas via Vercel AI Gateway.

**Ações:**
1. Ativar a seção de "Redirects & External Rewrites" no painel de Observability.
2. Configurar alertas para p95/p99 de latência e taxa de erro.
3. Analisar dados de rewrites par-

---

## 📊 Resumo Geral

| Categoria | Recursos | Status |
|------------|-----------|--------|
| ✅ Implementado | Nenhum (aguardando adoção interna) | — |
| 🟩 Estável | Turbopack, React 19.2, Routing | 3 |
| ⏳ Em Rollout | Cache Components, Cache APIs, DevTools MCP | 3 |
| 🧪 Experimental | proxy.ts, AI Cloud | 2 |

---

## 📘 Legenda de Status

| Ícone | Nome | Significado |
|:--:|--|--|
| 🧪 | **Experimental** — protótipo ou base técnica ainda sem rollout. |
| ⏳ | **Em Rollout** — disponível parcialmente, sob validação. |
| 🟩 | **Estável** — liberado e seguro no ecossistema, pronto para adoção. |
| ✅ | **Implementado** — já ativo e funcional no LP Factory 10. |

---

**Fontes:** Vercel Ship 2025 • Next.js Conf 2025 • nextjs.org/blog/next-16 • vercel.com/blog/ship-2025
